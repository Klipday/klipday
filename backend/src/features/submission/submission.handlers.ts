import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';
import { CampaignStatus, Platform, Role, Status, SubmissionStatus } from '../../generated/prisma/enums.js';
import { prisma } from '../../utils/prisma.js';
import { SendError, SendSuccess } from '../../utils/api-response.js';
import {
  GetInstagramVideoDetails,
  GetTikTokVideoDetails,
  GetYouTubeShortDetails,
  type SocialVideoItem,
} from '../../services/scrape-creators.js';
import { IsSupabaseStorageUrl, PersistVideoThumbnailToStorage } from '../../services/supabase.js';
import {
  NotifySubmissionApproved,
  NotifySubmissionReceived,
  NotifySubmissionRejected,
  NotifySubmissionRevision,
} from '../../services/notification/notification.dispatcher.js';
import {
  ALL_STATUS_FILTER,
  BUDGET_DECIMAL_PLACES,
  CPM_VIEW_DIVISOR,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_CONCURRENT_PENDING_REVIEW_PER_CAMPAIGN,
  SUBMISSION_MESSAGES,
  SUBMISSION_PLATFORM_DISPLAY_NAMES,
  SUBMISSION_SORT,
} from './submission.constants.js';
import {
  CreatorSubmissionQuerySchema,
  FinalSubmitVideoSchema,
  RejectSubmissionSchema,
  RequestRevisionSchema,
  SaveDraftSubmissionSchema,
  SubmissionQuerySchema,
} from './submission.validators.js';
import type {
  CampaignSubmissionsPaginatedData,
  CreatorSubmissionCountsDto,
  CreatorSubmissionListItemDto,
  CreatorSubmissionsPaginatedData,
  MySubmissionResponseData,
  PlatformSubmissionQuotaDto,
  SubmissionDetailDto,
} from './submission.types.js';
import {
  BuildSubmissionsOrderBy,
  BuildSubmissionsWhereClause,
  DoesVideoUrlMatchPlatform,
  ExtractPlatformVideoId,
  FormatCampaignSubmissionReviewItem,
  FormatSubmissionResponse,
  IsAllowedThumbnailUrl,
} from './submission.helper.js';

/**
 * Expected HTTP error thrown inside Prisma transactions so partial submission updates
 * roll back cleanly before returning a standardized error response.
 */
class SubmissionTransactionError extends Error {
  public readonly statusCode: number;

  /**
   * Creates a typed transaction error carrying HTTP status code and localized message.
   *
   * @param statusCode - HTTP response status code.
   * @param message - Localized API error message.
   */
  public constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

type SubmissionDbClient = Pick<typeof prisma, 'submission'>;

/**
 * Computes remaining campaign escrow budget in PostgreSQL using aggregate sum
 * instead of loading every approved submission row into Node memory.
 *
 * @param db - Prisma client or interactive transaction client.
 * @param campaignId - Target campaign UUID.
 * @param budget - Campaign total budget in Rupiah.
 * @returns Non-negative remaining escrow budget in Rupiah.
 */
async function GetRemainingCampaignEscrow(
  db: SubmissionDbClient,
  campaignId: string,
  budget: number,
): Promise<number> {
  const aggregateQuery = {
    where: {
      campaignId,
      status: Status.ACTIVE,
      submissionStatus: {
        in: [SubmissionStatus.APPROVED, SubmissionStatus.VERIFIED],
      },
    },
    _sum: {
      earnings: true as const,
    },
  };
  const aggregateResult = await db.submission.aggregate(aggregateQuery);
  const rawAllocated = aggregateResult._sum.earnings !== null && aggregateResult._sum.earnings !== undefined
    ? Number(aggregateResult._sum.earnings)
    : 0;
  const safeAllocated = Number.isFinite(rawAllocated) ? Math.max(0, Math.floor(rawAllocated)) : 0;
  const remaining = Math.max(0, budget - safeAllocated);
  return remaining;
}

/**
 * Dispatches live video verification to the matching ScrapeCreators platform adapter.
 *
 * @param platform - Target social platform enum.
 * @param liveVideoUrl - Submitted video URL.
 * @returns Verified social video metadata from ScrapeCreators.
 */
async function FetchVerifiedPlatformVideo(
  platform: Platform,
  liveVideoUrl: string,
): Promise<SocialVideoItem> {
  if (platform === Platform.INSTAGRAM) {
    const details = await GetInstagramVideoDetails(liveVideoUrl);
    return details;
  }

  if (platform === Platform.YOUTUBE) {
    const details = await GetYouTubeShortDetails(liveVideoUrl);
    return details;
  }

  const details = await GetTikTokVideoDetails(liveVideoUrl);
  return details;
}

/**
 * Checks whether the same social video (by platform external video ID or canonical URL)
 * has already been submitted on another active, non-rejected submission.
 *
 * @param db - Prisma client or interactive transaction client.
 * @param platform - Target social platform enum.
 * @param canonicalUrl - Canonical video URL.
 * @param videoId - Extracted platform video ID / shortcode, if available.
 * @param excludeSubmissionId - Optional current submission UUID to exclude from the check.
 * @returns True if a duplicate active submission already exists.
 */
async function HasDuplicateSubmittedVideo(
  db: SubmissionDbClient,
  platform: Platform,
  canonicalUrl: string,
  videoId: string | null,
  excludeSubmissionId?: string,
): Promise<boolean> {
  const urlConditions: Prisma.SubmissionWhereInput[] = [
    { liveVideoUrl: canonicalUrl },
  ];

  if (videoId) {
    urlConditions.push({
      platform,
      externalVideoId: videoId,
    });

    if (platform === Platform.TIKTOK) {
      urlConditions.push({
        liveVideoUrl: {
          contains: `/video/${videoId}`,
          mode: 'insensitive',
        },
      });
      urlConditions.push({
        liveVideoUrl: {
          contains: `/photo/${videoId}`,
          mode: 'insensitive',
        },
      });
    } else if (platform === Platform.INSTAGRAM) {
      urlConditions.push({
        liveVideoUrl: {
          contains: `/${videoId}`,
          mode: 'insensitive',
        },
      });
    } else if (platform === Platform.YOUTUBE) {
      urlConditions.push({
        liveVideoUrl: {
          contains: `/shorts/${videoId}`,
          mode: 'insensitive',
        },
      });
    }
  }

  const duplicateQuery = {
    where: {
      ...(excludeSubmissionId ? { id: { not: excludeSubmissionId } } : {}),
      status: Status.ACTIVE,
      submissionStatus: {
        notIn: [SubmissionStatus.JOINED, SubmissionStatus.REJECTED],
      },
      OR: urlConditions,
    },
    select: { id: true },
  };
  const existingDuplicate = await db.submission.findFirst(duplicateQuery);
  const hasDuplicate = Boolean(existingDuplicate);
  return hasDuplicate;
}

/**
 * Handles `POST /campaigns/:id/join`:
 * Enrolls a creator in an active campaign, creating a placeholder submission row with status `JOINED`.
 *
 * @param req - Express request with the authenticated account and campaign id parameter.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function JoinCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;
    if (!account) {
      SendError(res, SUBMISSION_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR) {
      SendError(res, SUBMISSION_MESSAGES.ONLY_CREATORS_CAN_JOIN, 403);
      return;
    }

    const campaignId = req.params.id as string;

    const findCampaignQuery = {
      where: {
        id: campaignId,
        status: Status.ACTIVE,
        campaignStatus: CampaignStatus.ACTIVE,
      },
      select: {
        id: true,
        cpm: true,
        minViews: true,
        budget: true,
        endDate: true,
        platforms: true,
      },
    };
    const campaign = await prisma.campaign.findFirst(findCampaignQuery);

    if (!campaign) {
      SendError(res, SUBMISSION_MESSAGES.CAMPAIGN_NOT_FOUND_OR_INACTIVE, 404);
      return;
    }

    if (campaign.endDate && new Date(campaign.endDate) < new Date()) {
      SendError(res, SUBMISSION_MESSAGES.CAMPAIGN_ENDED, 400);
      return;
    }

    const cpm = campaign.cpm ? Number(campaign.cpm) : 0;
    const minViews = campaign.minViews ?? 0;
    const minimumBudgetExists = Number(((minViews / CPM_VIEW_DIVISOR) * cpm).toFixed(BUDGET_DECIMAL_PLACES));
    const currentBudget = campaign.budget ? Number(campaign.budget) : 0;

    if (currentBudget < minimumBudgetExists) {
      SendError(res, SUBMISSION_MESSAGES.BUDGET_BELOW_MINIMUM, 400);
      return;
    }

    const findCreatorQuery = {
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    };
    const creator = await prisma.creator.findFirst(findCreatorQuery);

    if (!creator) {
      SendError(res, SUBMISSION_MESSAGES.CREATOR_NOT_FOUND, 404);
      return;
    }

    // Check if an active submission row already exists
    const findExistingSubmissionQuery = {
      where: {
        campaignId: campaign.id,
        creatorId: creator.id,
        status: Status.ACTIVE,
      },
      select: { id: true, submissionStatus: true },
    };
    const existingSubmission = await prisma.submission.findFirst(findExistingSubmissionQuery);

    if (existingSubmission) {
      if (existingSubmission.submissionStatus === SubmissionStatus.REJECTED) {
        SendError(res, SUBMISSION_MESSAGES.REJECTED_CANNOT_RESUBMIT, 400);
        return;
      }
    } else {
      const remainingEscrow = await GetRemainingCampaignEscrow(prisma, campaign.id, currentBudget);

      if (currentBudget > 0 && remainingEscrow <= 0) {
        SendError(res, SUBMISSION_MESSAGES.CAMPAIGN_BUDGET_FULL, 400);
        return;
      }

      if (remainingEscrow < minimumBudgetExists) {
        SendError(res, SUBMISSION_MESSAGES.BUDGET_BELOW_MINIMUM, 400);
        return;
      }

      const initialPlatform = campaign.platforms?.[0] ?? Platform.TIKTOK;
      const createSubmissionPayload = {
        data: {
          campaignId: campaign.id,
          creatorId: creator.id,
          platform: initialPlatform,
          submissionStatus: SubmissionStatus.JOINED,
          status: Status.ACTIVE,
        },
      };

      try {
        await prisma.submission.create(createSubmissionPayload);
      } catch (createError) {
        const isUniqueViolation =
          createError instanceof Prisma.PrismaClientKnownRequestError &&
          createError.code === 'P2002';

        if (!isUniqueViolation) {
          throw createError;
        }

        const concurrentSubmission = await prisma.submission.findFirst(findExistingSubmissionQuery);
        if (concurrentSubmission?.submissionStatus === SubmissionStatus.REJECTED) {
          SendError(res, SUBMISSION_MESSAGES.REJECTED_CANNOT_RESUBMIT, 400);
          return;
        }
      }
    }

    SendSuccess(res, null, SUBMISSION_MESSAGES.JOIN_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `GET /campaigns/:id/my-submission`:
 * Retrieves current creator's submission progress across all allowed campaign platforms,
 * per-platform remaining quotas, and all verified social accounts.
 *
 * @param req - Express request with authenticated account and campaign id parameter.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetMyCampaignSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;
    if (!account) {
      SendError(res, SUBMISSION_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR) {
      SendError(res, SUBMISSION_MESSAGES.ONLY_CREATORS_CAN_ACCESS_SUBMISSIONS, 403);
      return;
    }

    const campaignId = req.params.id as string;

    const findCreatorQuery = {
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    };
    const creator = await prisma.creator.findFirst(findCreatorQuery);

    if (!creator) {
      SendError(res, SUBMISSION_MESSAGES.CREATOR_NOT_FOUND, 404);
      return;
    }

    const findCampaignQuery = {
      where: {
        id: campaignId,
        status: Status.ACTIVE,
      },
      select: {
        id: true,
        platforms: true,
        maxSubmissionsPerPlatform: true,
      },
    };

    const findSubmissionsQuery = {
      where: {
        campaignId,
        creatorId: creator.id,
        status: Status.ACTIVE,
      },
      orderBy: {
        createdAt: 'desc' as const,
      },
      include: {
        socialAccount: {
          where: { status: Status.ACTIVE },
        },
      },
    };

    const findVerifiedAccountsQuery = {
      where: {
        creatorId: creator.id,
        isVerified: true,
        status: Status.ACTIVE,
      },
      orderBy: {
        verifiedAt: 'desc' as const,
      },
    };

    const [campaign, rawSubmissions, verifiedSocialAccounts] = await Promise.all([
      prisma.campaign.findFirst(findCampaignQuery),
      prisma.submission.findMany(findSubmissionsQuery),
      prisma.creatorSocialAccount.findMany(findVerifiedAccountsQuery),
    ]);

    // Deduplicate verified accounts to the latest active account per platform
    const seenPlatforms = new Set<Platform>();
    const activeSocialAccounts = verifiedSocialAccounts.filter((item) => {
      if (seenPlatforms.has(item.platform)) {
        return false;
      }
      seenPlatforms.add(item.platform);
      return true;
    });

    const mappedSubmissions: SubmissionDetailDto[] = rawSubmissions.map(FormatSubmissionResponse);

    // Prioritize an actionable submission (REVISION_REQUESTED or JOINED) for legacy single-submission callers
    const primarySubmission =
      mappedSubmissions.find((s) => s.submissionStatus === SubmissionStatus.REVISION_REQUESTED) ??
      mappedSubmissions.find((s) => s.submissionStatus === SubmissionStatus.JOINED) ??
      mappedSubmissions[0] ??
      null;

    const allowedPlatforms = campaign?.platforms?.length ? campaign.platforms : [Platform.TIKTOK];
    const maxPerPlatform = campaign?.maxSubmissionsPerPlatform === undefined ? 1 : campaign.maxSubmissionsPerPlatform;

    const platformQuotas: PlatformSubmissionQuotaDto[] = allowedPlatforms.map((platform) => {
      const submittedCount = mappedSubmissions.filter(
        (sub) =>
          sub.platform === platform &&
          sub.submissionStatus !== SubmissionStatus.JOINED &&
          sub.submissionStatus !== SubmissionStatus.REJECTED,
      ).length;
      const remainingSlots =
        maxPerPlatform === null ? null : Math.max(0, maxPerPlatform - submittedCount);
      const canSubmit = maxPerPlatform === null || submittedCount < maxPerPlatform;

      const quota: PlatformSubmissionQuotaDto = {
        platform,
        submittedCount,
        maxSubmissions: maxPerPlatform,
        remainingSlots,
        canSubmit,
      };
      return quota;
    });

    const isJoined = mappedSubmissions.length > 0;
    const canSubmitMore = isJoined && platformQuotas.some((quota) => quota.canSubmit);

    const effectiveSocialAccount =
      primarySubmission?.socialAccount ??
      activeSocialAccounts.find((acc) => acc.platform === Platform.TIKTOK) ??
      activeSocialAccounts[0] ??
      null;

    const responsePayload: MySubmissionResponseData = {
      submission: primarySubmission,
      submissions: mappedSubmissions,
      socialAccount: effectiveSocialAccount,
      socialAccounts: activeSocialAccounts,
      isJoined,
      canSubmitMore,
      maxSubmissionsPerPlatform: maxPerPlatform,
      platformQuotas,
    };

    SendSuccess(res, responsePayload, SUBMISSION_MESSAGES.GET_MY_SUBMISSION_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `PATCH /campaigns/:id/submission/draft`:
 * Autosaves the creator's chosen video selection, caption, and thumbnail for draft recovery.
 *
 * @param req - Express request with authenticated account and campaign id parameter.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function SaveDraftSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;
    if (!account) {
      SendError(res, SUBMISSION_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR) {
      SendError(res, SUBMISSION_MESSAGES.ONLY_CREATORS_CAN_DRAFT, 403);
      return;
    }

    const validation = SaveDraftSubmissionSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message ?? SUBMISSION_MESSAGES.INVALID_PAYLOAD;
      SendError(res, firstError, 400);
      return;
    }

    const campaignId = req.params.id as string;

    const findCreatorQuery = {
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    };
    const creator = await prisma.creator.findFirst(findCreatorQuery);

    if (!creator) {
      SendError(res, SUBMISSION_MESSAGES.CREATOR_NOT_FOUND, 404);
      return;
    }

    const findExistingSubmissionQuery = {
      where: {
        ...(validation.data.submissionId ? { id: validation.data.submissionId } : {}),
        campaignId,
        creatorId: creator.id,
        status: Status.ACTIVE,
      },
      include: {
        campaign: {
          select: {
            platforms: true,
          },
        },
      },
    };
    const existingSubmission = await prisma.submission.findFirst(findExistingSubmissionQuery);

    if (!existingSubmission) {
      SendError(res, SUBMISSION_MESSAGES.NOT_JOINED, 404);
      return;
    }

    if (
      existingSubmission.submissionStatus !== SubmissionStatus.JOINED &&
      existingSubmission.submissionStatus !== SubmissionStatus.REVISION_REQUESTED
    ) {
      if (existingSubmission.submissionStatus === SubmissionStatus.PENDING_REVIEW) {
        SendError(res, SUBMISSION_MESSAGES.CANNOT_MODIFY_UNDER_REVIEW, 400);
        return;
      }
      if (existingSubmission.submissionStatus === SubmissionStatus.APPROVED) {
        SendError(res, SUBMISSION_MESSAGES.ALREADY_APPROVED, 400);
        return;
      }
      if (existingSubmission.submissionStatus === SubmissionStatus.REJECTED) {
        SendError(res, SUBMISSION_MESSAGES.REJECTED_CANNOT_RESUBMIT, 400);
        return;
      }

      SendError(res, SUBMISSION_MESSAGES.STATUS_NOT_ALLOW_DRAFT, 400);
      return;
    }

    const findOwnedSocialAccountQuery = {
      where: {
        id: validation.data.socialAccountId,
        creatorId: creator.id,
        isVerified: true,
        status: Status.ACTIVE,
      },
    };
    const ownedSocialAccount = await prisma.creatorSocialAccount.findFirst(findOwnedSocialAccountQuery);

    if (!ownedSocialAccount) {
      SendError(res, SUBMISSION_MESSAGES.SOCIAL_ACCOUNT_NOT_VERIFIED, 400);
      return;
    }

    const targetPlatform = ownedSocialAccount.platform;
    const allowedPlatforms = existingSubmission.campaign?.platforms;
    if (allowedPlatforms?.length && !allowedPlatforms.includes(targetPlatform)) {
      SendError(res, SUBMISSION_MESSAGES.PLATFORM_NOT_ALLOWED, 400);
      return;
    }

    if (!DoesVideoUrlMatchPlatform(validation.data.liveVideoUrl, targetPlatform)) {
      const mismatchMsg =
        targetPlatform === Platform.YOUTUBE
          ? SUBMISSION_MESSAGES.YOUTUBE_SHORTS_ONLY
          : SUBMISSION_MESSAGES.VIDEO_URL_PLATFORM_MISMATCH;
      SendError(res, mismatchMsg, 400);
      return;
    }

    let resolvedThumbnailUrl = validation.data.thumbnailUrl;
    if (
      resolvedThumbnailUrl &&
      IsAllowedThumbnailUrl(resolvedThumbnailUrl) &&
      !IsSupabaseStorageUrl(resolvedThumbnailUrl)
    ) {
      const storedThumbnail = await PersistVideoThumbnailToStorage(
        resolvedThumbnailUrl,
        `submission-${existingSubmission.id}`,
      );
      if (storedThumbnail) {
        resolvedThumbnailUrl = storedThumbnail;
      }
    }

    // Atomic conditional write prevents a late draft save from overwriting a concurrently submitted video
    const conditionalDraftUpdate = {
      where: {
        id: existingSubmission.id,
        status: Status.ACTIVE,
        submissionStatus: {
          in: [SubmissionStatus.JOINED, SubmissionStatus.REVISION_REQUESTED],
        },
      },
      data: {
        platform: targetPlatform,
        liveVideoUrl: validation.data.liveVideoUrl,
        thumbnailUrl: resolvedThumbnailUrl,
        videoCaption: validation.data.videoCaption,
        socialAccountId: validation.data.socialAccountId,
      },
    };
    const draftClaim = await prisma.submission.updateMany(conditionalDraftUpdate);

    if (draftClaim.count === 0) {
      SendError(res, SUBMISSION_MESSAGES.SUBMISSION_RACE_CONFLICT, 409);
      return;
    }

    const reloadDraftQuery = {
      where: { id: existingSubmission.id, status: Status.ACTIVE },
      include: {
        socialAccount: {
          where: { status: Status.ACTIVE },
        },
      },
    };
    const updatedSubmission = await prisma.submission.findFirst(reloadDraftQuery);

    if (!updatedSubmission) {
      SendError(res, SUBMISSION_MESSAGES.SUBMISSION_NOT_FOUND, 404);
      return;
    }

    const formattedSubmission = FormatSubmissionResponse(updatedSubmission);
    SendSuccess(res, formattedSubmission, SUBMISSION_MESSAGES.DRAFT_SAVED);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /campaigns/:id/submission/submit`:
 * Finalizes a video submission across any allowed campaign platform (TikTok, Instagram Reels, YouTube Shorts).
 * Converts an existing `JOINED` / `REVISION_REQUESTED` record or creates a new `PENDING_REVIEW` submission
 * when the campaign permits additional videos on the target platform.
 *
 * @param req - Express request with authenticated account and campaign id parameter.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function FinalSubmitVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;
    if (!account) {
      SendError(res, SUBMISSION_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR) {
      SendError(res, SUBMISSION_MESSAGES.ONLY_CREATORS_CAN_SUBMIT, 403);
      return;
    }

    const validation = FinalSubmitVideoSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message ?? SUBMISSION_MESSAGES.INVALID_PAYLOAD;
      SendError(res, firstError, 400);
      return;
    }

    const campaignId = req.params.id as string;

    const findCreatorQuery = {
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    };
    const creator = await prisma.creator.findFirst(findCreatorQuery);

    if (!creator) {
      SendError(res, SUBMISSION_MESSAGES.CREATOR_NOT_FOUND, 404);
      return;
    }

    const findCreatorCampaignSubmissionsQuery = {
      where: {
        campaignId,
        creatorId: creator.id,
        status: Status.ACTIVE,
      },
      orderBy: {
        createdAt: 'asc' as const,
      },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            status: true,
            campaignStatus: true,
            budget: true,
            endDate: true,
            platforms: true,
            maxSubmissionsPerPlatform: true,
            brand: {
              select: {
                accountId: true,
              },
            },
          },
        },
      },
    };
    const creatorSubmissions = await prisma.submission.findMany(findCreatorCampaignSubmissionsQuery);

    if (creatorSubmissions.length === 0) {
      SendError(res, SUBMISSION_MESSAGES.SUBMISSION_NOT_FOUND, 404);
      return;
    }

    const parentCampaign = creatorSubmissions[0]?.campaign;

    if (parentCampaign) {
      if (
        parentCampaign.status !== Status.ACTIVE ||
        parentCampaign.campaignStatus !== CampaignStatus.ACTIVE
      ) {
        SendError(res, SUBMISSION_MESSAGES.CAMPAIGN_NOT_FOUND_OR_INACTIVE, 404);
        return;
      }

      if (parentCampaign.endDate && new Date(parentCampaign.endDate) <= new Date()) {
        SendError(res, SUBMISSION_MESSAGES.CAMPAIGN_ENDED, 400);
        return;
      }

      const campaignBudget = parentCampaign.budget ? Number(parentCampaign.budget) : 0;
      const remainingEscrow = await GetRemainingCampaignEscrow(
        prisma,
        parentCampaign.id,
        campaignBudget,
      );

      if (campaignBudget > 0 && remainingEscrow <= 0) {
        SendError(res, SUBMISSION_MESSAGES.CAMPAIGN_BUDGET_FULL, 400);
        return;
      }
    }

    const findOwnedSocialAccountQuery = {
      where: {
        id: validation.data.socialAccountId,
        creatorId: creator.id,
        isVerified: true,
        status: Status.ACTIVE,
      },
    };
    const ownedSocialAccount = await prisma.creatorSocialAccount.findFirst(findOwnedSocialAccountQuery);

    if (!ownedSocialAccount) {
      SendError(res, SUBMISSION_MESSAGES.SOCIAL_ACCOUNT_NOT_VERIFIED, 400);
      return;
    }

    const targetPlatform = ownedSocialAccount.platform;
    const targetPlatformName = SUBMISSION_PLATFORM_DISPLAY_NAMES[targetPlatform];
    const allowedPlatforms = parentCampaign?.platforms?.length ? parentCampaign.platforms : [Platform.TIKTOK];

    if (!allowedPlatforms.includes(targetPlatform)) {
      SendError(res, SUBMISSION_MESSAGES.PLATFORM_NOT_ALLOWED, 400);
      return;
    }

    if (!DoesVideoUrlMatchPlatform(validation.data.liveVideoUrl, targetPlatform)) {
      const mismatchMsg =
        targetPlatform === Platform.YOUTUBE
          ? SUBMISSION_MESSAGES.YOUTUBE_SHORTS_ONLY
          : SUBMISSION_MESSAGES.VIDEO_URL_PLATFORM_MISMATCH;
      SendError(res, mismatchMsg, 400);
      return;
    }

    const maxPerPlatform =
      parentCampaign?.maxSubmissionsPerPlatform === undefined ? 1 : parentCampaign.maxSubmissionsPerPlatform;

    // Resolve whether this submit updates an existing editable row or creates a new submission row
    let targetExistingSubmission = validation.data.submissionId
      ? creatorSubmissions.find((s) => s.id === validation.data.submissionId) ?? null
      : creatorSubmissions.find((s) => s.submissionStatus === SubmissionStatus.JOINED) ??
        creatorSubmissions.find(
          (s) => s.platform === targetPlatform && s.submissionStatus === SubmissionStatus.REVISION_REQUESTED,
        ) ??
        null;

    if (validation.data.submissionId && !targetExistingSubmission) {
      SendError(res, SUBMISSION_MESSAGES.SUBMISSION_NOT_FOUND, 404);
      return;
    }

    // If explicitly targeting an existing submission, verify it is editable
    if (
      targetExistingSubmission &&
      targetExistingSubmission.submissionStatus !== SubmissionStatus.JOINED &&
      targetExistingSubmission.submissionStatus !== SubmissionStatus.REVISION_REQUESTED
    ) {
      if (targetExistingSubmission.submissionStatus === SubmissionStatus.PENDING_REVIEW) {
        SendError(res, SUBMISSION_MESSAGES.UNDER_REVIEW_BY_BRAND, 400);
        return;
      }
      if (targetExistingSubmission.submissionStatus === SubmissionStatus.APPROVED) {
        SendError(res, SUBMISSION_MESSAGES.ALREADY_APPROVED, 400);
        return;
      }
      if (targetExistingSubmission.submissionStatus === SubmissionStatus.REJECTED) {
        SendError(res, SUBMISSION_MESSAGES.REJECTED_CANNOT_RESUBMIT, 400);
        return;
      }
      SendError(res, SUBMISSION_MESSAGES.SUBMISSION_STATUS_NOT_RESUBMITTABLE, 400);
      return;
    }

    // When creating a new additional submission row (no JOINED or REVISION_REQUESTED row reused), enforce platform quota & spam cap
    if (!targetExistingSubmission) {
      const activeSubmissionsOnPlatform = creatorSubmissions.filter(
        (s) =>
          s.platform === targetPlatform &&
          s.submissionStatus !== SubmissionStatus.JOINED &&
          s.submissionStatus !== SubmissionStatus.REJECTED,
      );

      if (maxPerPlatform !== null && activeSubmissionsOnPlatform.length >= maxPerPlatform) {
        if (maxPerPlatform === 1 && activeSubmissionsOnPlatform.length === 1) {
          const singleSub = activeSubmissionsOnPlatform[0];
          if (singleSub?.submissionStatus === SubmissionStatus.PENDING_REVIEW) {
            SendError(res, SUBMISSION_MESSAGES.UNDER_REVIEW_BY_BRAND, 400);
            return;
          }
          if (singleSub?.submissionStatus === SubmissionStatus.APPROVED) {
            SendError(res, SUBMISSION_MESSAGES.ALREADY_APPROVED, 400);
            return;
          }
        }
        SendError(res, SUBMISSION_MESSAGES.PLATFORM_QUOTA_REACHED(targetPlatformName, maxPerPlatform), 400);
        return;
      }

      // If single-slot campaign has only a REJECTED row on this single platform, preserve legacy rejection block
      const rejectedOnPlatform = creatorSubmissions.filter(
        (s) => s.platform === targetPlatform && s.submissionStatus === SubmissionStatus.REJECTED,
      );
      if (maxPerPlatform === 1 && allowedPlatforms.length === 1 && rejectedOnPlatform.length > 0 && activeSubmissionsOnPlatform.length === 0) {
        SendError(res, SUBMISSION_MESSAGES.REJECTED_CANNOT_RESUBMIT, 400);
        return;
      }

      const pendingCount = creatorSubmissions.filter(
        (s) => s.submissionStatus === SubmissionStatus.PENDING_REVIEW,
      ).length;
      if (pendingCount >= MAX_CONCURRENT_PENDING_REVIEW_PER_CAMPAIGN) {
        SendError(
          res,
          SUBMISSION_MESSAGES.PENDING_REVIEW_CAP_REACHED(MAX_CONCURRENT_PENDING_REVIEW_PER_CAMPAIGN),
          400,
        );
        return;
      }
    }

    // Server-side video ownership verification via ScrapeCreators
    let verifiedVideoDetails: SocialVideoItem;
    try {
      verifiedVideoDetails = await FetchVerifiedPlatformVideo(targetPlatform, validation.data.liveVideoUrl);
    } catch {
      SendError(res, SUBMISSION_MESSAGES.VIDEO_VERIFY_FAILED, 400);
      return;
    }

    const authorHandle = verifiedVideoDetails.authorUsername.toLowerCase();
    const verifiedHandle = ownedSocialAccount.username.toLowerCase();
    const isHandleMatch = Boolean(authorHandle) && authorHandle === verifiedHandle;
    const isPlatformUserIdMatch =
      Boolean(verifiedVideoDetails.authorPlatformUserId) &&
      Boolean(ownedSocialAccount.platformUserId) &&
      verifiedVideoDetails.authorPlatformUserId === ownedSocialAccount.platformUserId;

    if (!isHandleMatch && !isPlatformUserIdMatch) {
      const mismatchMessage = SUBMISSION_MESSAGES.VIDEO_AUTHOR_MISMATCH(
        verifiedVideoDetails.authorUsername,
        ownedSocialAccount.username,
        targetPlatformName,
      );
      SendError(res, mismatchMessage, 400);
      return;
    }

    const canonicalVideoUrl = verifiedVideoDetails.url || validation.data.liveVideoUrl;
    const extractedVideoId =
      verifiedVideoDetails.id || ExtractPlatformVideoId(targetPlatform, canonicalVideoUrl);

    // Pre-check duplicate reuse before persisting thumbnail to storage
    const isDuplicatePreCheck = await HasDuplicateSubmittedVideo(
      prisma,
      targetPlatform,
      canonicalVideoUrl,
      extractedVideoId,
      targetExistingSubmission?.id,
    );
    if (isDuplicatePreCheck) {
      SendError(res, SUBMISSION_MESSAGES.VIDEO_ALREADY_SUBMITTED, 409);
      return;
    }

    const serverThumbnailCandidate = verifiedVideoDetails.thumbnailUrl ?? validation.data.thumbnailUrl;
    let resolvedThumbnailUrl =
      serverThumbnailCandidate && IsAllowedThumbnailUrl(serverThumbnailCandidate)
        ? serverThumbnailCandidate
        : undefined;

    if (resolvedThumbnailUrl && !IsSupabaseStorageUrl(resolvedThumbnailUrl)) {
      const thumbnailSlug = targetExistingSubmission
        ? `submission-${targetExistingSubmission.id}`
        : `submission-${campaignId}-${Date.now()}`;
      const storedThumbnail = await PersistVideoThumbnailToStorage(
        resolvedThumbnailUrl,
        thumbnailSlug,
      );
      if (storedThumbnail) {
        resolvedThumbnailUrl = storedThumbnail;
      }
    }

    const resolvedCaption =
      verifiedVideoDetails.caption?.trim() || validation.data.videoCaption;

    const finalizedSubmission = await prisma.$transaction(async (tx) => {
      const freshSubmissions = await tx.submission.findMany(findCreatorCampaignSubmissionsQuery);
      if (freshSubmissions.length === 0) {
        throw new SubmissionTransactionError(404, SUBMISSION_MESSAGES.SUBMISSION_NOT_FOUND);
      }

      const freshCampaign = freshSubmissions[0]?.campaign;
      if (freshCampaign) {
        if (
          freshCampaign.status !== Status.ACTIVE ||
          freshCampaign.campaignStatus !== CampaignStatus.ACTIVE
        ) {
          throw new SubmissionTransactionError(404, SUBMISSION_MESSAGES.CAMPAIGN_NOT_FOUND_OR_INACTIVE);
        }

        if (freshCampaign.endDate && new Date(freshCampaign.endDate) <= new Date()) {
          throw new SubmissionTransactionError(400, SUBMISSION_MESSAGES.CAMPAIGN_ENDED);
        }

        const freshBudget = freshCampaign.budget ? Number(freshCampaign.budget) : 0;
        const freshRemaining = await GetRemainingCampaignEscrow(
          tx,
          freshCampaign.id,
          freshBudget,
        );

        if (freshBudget > 0 && freshRemaining <= 0) {
          throw new SubmissionTransactionError(400, SUBMISSION_MESSAGES.CAMPAIGN_BUDGET_FULL);
        }
      }

      const isDuplicateInTx = await HasDuplicateSubmittedVideo(
        tx,
        targetPlatform,
        canonicalVideoUrl,
        extractedVideoId,
        targetExistingSubmission?.id,
      );
      if (isDuplicateInTx) {
        throw new SubmissionTransactionError(409, SUBMISSION_MESSAGES.VIDEO_ALREADY_SUBMITTED);
      }

      if (targetExistingSubmission) {
        const freshTarget = freshSubmissions.find((s) => s.id === targetExistingSubmission.id);
        if (
          !freshTarget ||
          (freshTarget.submissionStatus !== SubmissionStatus.JOINED &&
            freshTarget.submissionStatus !== SubmissionStatus.REVISION_REQUESTED)
        ) {
          throw new SubmissionTransactionError(409, SUBMISSION_MESSAGES.SUBMISSION_RACE_CONFLICT);
        }

        const claimed = await tx.submission.updateMany({
          where: {
            id: freshTarget.id,
            status: Status.ACTIVE,
            submissionStatus: {
              in: [SubmissionStatus.JOINED, SubmissionStatus.REVISION_REQUESTED],
            },
          },
          data: {
            platform: targetPlatform,
            externalVideoId: extractedVideoId,
            liveVideoUrl: canonicalVideoUrl,
            thumbnailUrl: resolvedThumbnailUrl,
            videoCaption: resolvedCaption,
            socialAccountId: validation.data.socialAccountId,
            submissionStatus: SubmissionStatus.PENDING_REVIEW,
            submittedAt: new Date(),
          },
        });

        if (claimed.count === 0) {
          throw new SubmissionTransactionError(409, SUBMISSION_MESSAGES.SUBMISSION_RACE_CONFLICT);
        }

        const reloaded = await tx.submission.findFirst({
          where: { id: freshTarget.id, status: Status.ACTIVE },
          include: {
            socialAccount: {
              where: { status: Status.ACTIVE },
            },
          },
        });

        return reloaded;
      }

      // Re-verify quota & pending cap atomically inside transaction before inserting a new submission row
      const freshOnPlatformCount = freshSubmissions.filter(
        (s) =>
          s.platform === targetPlatform &&
          s.submissionStatus !== SubmissionStatus.JOINED &&
          s.submissionStatus !== SubmissionStatus.REJECTED,
      ).length;

      const freshMaxPerPlatform =
        freshCampaign?.maxSubmissionsPerPlatform === undefined ? 1 : freshCampaign.maxSubmissionsPerPlatform;

      if (freshMaxPerPlatform !== null && freshOnPlatformCount >= freshMaxPerPlatform) {
        throw new SubmissionTransactionError(
          400,
          SUBMISSION_MESSAGES.PLATFORM_QUOTA_REACHED(targetPlatformName, freshMaxPerPlatform),
        );
      }

      const freshPendingCount = freshSubmissions.filter(
        (s) => s.submissionStatus === SubmissionStatus.PENDING_REVIEW,
      ).length;
      if (freshPendingCount >= MAX_CONCURRENT_PENDING_REVIEW_PER_CAMPAIGN) {
        throw new SubmissionTransactionError(
          400,
          SUBMISSION_MESSAGES.PENDING_REVIEW_CAP_REACHED(MAX_CONCURRENT_PENDING_REVIEW_PER_CAMPAIGN),
        );
      }

      const created = await tx.submission.create({
        data: {
          campaignId,
          creatorId: creator.id,
          platform: targetPlatform,
          externalVideoId: extractedVideoId,
          liveVideoUrl: canonicalVideoUrl,
          thumbnailUrl: resolvedThumbnailUrl,
          videoCaption: resolvedCaption,
          socialAccountId: validation.data.socialAccountId,
          submissionStatus: SubmissionStatus.PENDING_REVIEW,
          submittedAt: new Date(),
          status: Status.ACTIVE,
        },
        include: {
          socialAccount: {
            where: { status: Status.ACTIVE },
          },
        },
      });

      return created;
    });

    if (finalizedSubmission && parentCampaign?.brand?.accountId) {
      void NotifySubmissionReceived({
        brandAccountId: parentCampaign.brand.accountId,
        campaignTitle: parentCampaign.title ?? 'Kampanye',
        creatorUsername: ownedSocialAccount.username,
        submissionId: finalizedSubmission.id,
        campaignId,
      });
    }

    const formattedSubmission = FormatSubmissionResponse(finalizedSubmission as never);
    SendSuccess(res, formattedSubmission, SUBMISSION_MESSAGES.SUBMIT_SUCCESS);
  } catch (err) {
    if (err instanceof SubmissionTransactionError) {
      SendError(res, err.message, err.statusCode);
      return;
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      SendError(res, SUBMISSION_MESSAGES.VIDEO_ALREADY_SUBMITTED, 409);
      return;
    }
    next(err);
  }
}

/**
 * Handles `GET /campaigns/:id/submissions`:
 * Retrieves paginated, filtered, searched, and sorted submitted videos for a campaign.
 * Strictly guarded: only the owning brand or platform admins can view campaign submissions.
 *
 * @param req - Express request with authenticated account, campaign id parameter, and query parameters.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetCampaignSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;
    if (!account) {
      SendError(res, SUBMISSION_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND && account.role !== Role.ADMIN) {
      SendError(res, SUBMISSION_MESSAGES.ONLY_BRANDS_AND_ADMINS_CAN_REVIEW, 403);
      return;
    }

    const validation = SubmissionQuerySchema.safeParse(req.query);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message ?? SUBMISSION_MESSAGES.INVALID_PAYLOAD;
      SendError(res, firstError, 400);
      return;
    }

    const query = validation.data;
    const campaignId = req.params.id as string;

    // Tenant ownership check: Brand must own campaign; return 404 for mismatches
    if (account.role === Role.BRAND) {
      const findBrandCampaignQuery = {
        where: {
          id: campaignId,
          status: Status.ACTIVE,
          brand: {
            accountId: account.sub,
            status: Status.ACTIVE,
          },
        },
        select: { id: true },
      };
      const brandCampaign = await prisma.campaign.findFirst(findBrandCampaignQuery);

      if (!brandCampaign) {
        SendError(res, SUBMISSION_MESSAGES.CAMPAIGN_NOT_FOUND, 404);
        return;
      }
    }

    const where = BuildSubmissionsWhereClause(campaignId, query);
    const orderBy = BuildSubmissionsOrderBy(query.sort);

    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const countQuery = { where };
    const findSubmissionsQuery = {
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        socialAccount: {
          select: {
            id: true,
            platform: true,
            username: true,
            avatarUrl: true,
            followersCount: true,
          },
        },
      },
    };

    const [total, submissions] = await Promise.all([prisma.submission.count(countQuery), prisma.submission.findMany(findSubmissionsQuery)]);

    const items = submissions.map(FormatCampaignSubmissionReviewItem);
    const totalPages = Math.ceil(total / limit) || 1;

    const responsePayload: CampaignSubmissionsPaginatedData = {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    SendSuccess(res, responsePayload, SUBMISSION_MESSAGES.GET_SUBMISSIONS_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /submissions/:id/accept`:
 * Approves a creator's submitted video, transitioning its status to `APPROVED` and clearing review notes.
 * Accessible only by the owning campaign brand or platform admin.
 *
 * @param req - Express request containing authenticated account and submission id parameter.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function AcceptSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;
    if (!account) {
      SendError(res, SUBMISSION_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND && account.role !== Role.ADMIN) {
      SendError(res, SUBMISSION_MESSAGES.ONLY_BRANDS_AND_ADMINS_CAN_REVIEW, 403);
      return;
    }

    const submissionId = req.params.id as string;

    const findSubmissionQuery = {
      where: {
        id: submissionId,
        status: Status.ACTIVE,
        ...(account.role === Role.BRAND
          ? {
              campaign: {
                brand: {
                  accountId: account.sub,
                },
                status: Status.ACTIVE,
              },
            }
          : {}),
      },
      select: {
        id: true,
        submissionStatus: true,
        campaign: {
          select: {
            id: true,
            title: true,
            status: true,
            campaignStatus: true,
            endDate: true,
            budget: true,
          },
        },
        creator: {
          select: {
            accountId: true,
          },
        },
      },
    };
    const submissionTarget = await prisma.submission.findFirst(findSubmissionQuery);

    if (!submissionTarget) {
      SendError(res, SUBMISSION_MESSAGES.SUBMISSION_NOT_FOUND, 404);
      return;
    }

    if (submissionTarget.submissionStatus === SubmissionStatus.APPROVED) {
      SendError(res, SUBMISSION_MESSAGES.ALREADY_APPROVED, 400);
      return;
    }

    const allowedStatuses: SubmissionStatus[] = [SubmissionStatus.PENDING_REVIEW, SubmissionStatus.REVISION_REQUESTED];
    if (!allowedStatuses.includes(submissionTarget.submissionStatus)) {
      SendError(res, SUBMISSION_MESSAGES.SUBMISSION_STATUS_NOT_REVIEWABLE, 400);
      return;
    }

    if (submissionTarget.campaign) {
      const targetCampaign = submissionTarget.campaign;
      if (
        targetCampaign.status !== Status.ACTIVE ||
        targetCampaign.campaignStatus !== CampaignStatus.ACTIVE
      ) {
        SendError(res, SUBMISSION_MESSAGES.CAMPAIGN_NOT_ACTIVE_FOR_APPROVAL, 400);
        return;
      }

      if (targetCampaign.endDate && new Date(targetCampaign.endDate) <= new Date()) {
        SendError(res, SUBMISSION_MESSAGES.CAMPAIGN_ENDED, 400);
        return;
      }

      const campaignBudget = targetCampaign.budget ? Number(targetCampaign.budget) : 0;
      const remainingEscrow = await GetRemainingCampaignEscrow(
        prisma,
        targetCampaign.id,
        campaignBudget,
      );
      if (campaignBudget > 0 && remainingEscrow <= 0) {
        SendError(res, SUBMISSION_MESSAGES.CAMPAIGN_BUDGET_FULL, 400);
        return;
      }
    }

    // Atomic conditional transition prevents concurrent Accept/Reject/Revision race conditions
    const conditionalAcceptQuery = {
      where: {
        id: submissionTarget.id,
        status: Status.ACTIVE,
        submissionStatus: {
          in: allowedStatuses,
        },
      },
      data: {
        submissionStatus: SubmissionStatus.APPROVED,
        reviewNote: null,
      },
    };
    const acceptClaim = await prisma.submission.updateMany(conditionalAcceptQuery);

    if (acceptClaim.count === 0) {
      SendError(res, SUBMISSION_MESSAGES.SUBMISSION_RACE_CONFLICT, 409);
      return;
    }

    const reloadAcceptedQuery = {
      where: { id: submissionTarget.id, status: Status.ACTIVE },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        socialAccount: {
          select: {
            id: true,
            platform: true,
            username: true,
            avatarUrl: true,
            followersCount: true,
          },
        },
      },
    };
    const updatedSubmission = await prisma.submission.findFirst(reloadAcceptedQuery);

    if (!updatedSubmission) {
      SendError(res, SUBMISSION_MESSAGES.SUBMISSION_NOT_FOUND, 404);
      return;
    }

    if (submissionTarget.creator?.accountId) {
      void NotifySubmissionApproved({
        creatorAccountId: submissionTarget.creator.accountId,
        campaignTitle: submissionTarget.campaign?.title ?? 'Kampanye',
        submissionId: updatedSubmission.id,
      });
    }

    const formattedItem = FormatCampaignSubmissionReviewItem(updatedSubmission);

    SendSuccess(res, formattedItem, SUBMISSION_MESSAGES.ACCEPT_SUBMISSION_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /submissions/:id/reject`:
 * Rejects a creator's video submission. Once rejected, the creator cannot modify, save drafts,
 * or upload/resubmit the video again for this campaign.
 *
 * @param req - Express request containing authenticated account, submission id parameter, and optional note.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function RejectSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;
    if (!account) {
      SendError(res, SUBMISSION_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND && account.role !== Role.ADMIN) {
      SendError(res, SUBMISSION_MESSAGES.ONLY_BRANDS_AND_ADMINS_CAN_REVIEW, 403);
      return;
    }

    const submissionId = req.params.id as string;

    const findSubmissionQuery = {
      where: {
        id: submissionId,
        status: Status.ACTIVE,
        ...(account.role === Role.BRAND
          ? {
              campaign: {
                brand: {
                  accountId: account.sub,
                },
                status: Status.ACTIVE,
              },
            }
          : {}),
      },
      select: {
        id: true,
        submissionStatus: true,
        campaign: {
          select: {
            title: true,
          },
        },
        creator: {
          select: {
            accountId: true,
          },
        },
      },
    };
    const submissionTarget = await prisma.submission.findFirst(findSubmissionQuery);

    if (!submissionTarget) {
      SendError(res, SUBMISSION_MESSAGES.SUBMISSION_NOT_FOUND, 404);
      return;
    }

    if (submissionTarget.submissionStatus === SubmissionStatus.REJECTED) {
      SendError(res, SUBMISSION_MESSAGES.ALREADY_REJECTED, 400);
      return;
    }

    if (submissionTarget.submissionStatus === SubmissionStatus.APPROVED) {
      SendError(res, SUBMISSION_MESSAGES.ALREADY_APPROVED, 400);
      return;
    }

    const allowedStatuses: SubmissionStatus[] = [SubmissionStatus.PENDING_REVIEW, SubmissionStatus.REVISION_REQUESTED];
    if (!allowedStatuses.includes(submissionTarget.submissionStatus)) {
      SendError(res, SUBMISSION_MESSAGES.SUBMISSION_STATUS_NOT_REVIEWABLE, 400);
      return;
    }

    const validation = RejectSubmissionSchema.safeParse(req.body ?? {});
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message ?? SUBMISSION_MESSAGES.INVALID_PAYLOAD;
      SendError(res, firstError, 400);
      return;
    }

    const note = validation.data?.reviewNote?.trim() || null;

    // Atomic conditional transition prevents concurrent Accept/Reject/Revision race conditions
    const conditionalRejectQuery = {
      where: {
        id: submissionTarget.id,
        status: Status.ACTIVE,
        submissionStatus: {
          in: allowedStatuses,
        },
      },
      data: {
        submissionStatus: SubmissionStatus.REJECTED,
        reviewNote: note,
      },
    };
    const rejectClaim = await prisma.submission.updateMany(conditionalRejectQuery);

    if (rejectClaim.count === 0) {
      SendError(res, SUBMISSION_MESSAGES.SUBMISSION_RACE_CONFLICT, 409);
      return;
    }

    const reloadRejectedQuery = {
      where: { id: submissionTarget.id, status: Status.ACTIVE },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        socialAccount: {
          select: {
            id: true,
            platform: true,
            username: true,
            avatarUrl: true,
            followersCount: true,
          },
        },
      },
    };
    const updatedSubmission = await prisma.submission.findFirst(reloadRejectedQuery);

    if (!updatedSubmission) {
      SendError(res, SUBMISSION_MESSAGES.SUBMISSION_NOT_FOUND, 404);
      return;
    }

    if (submissionTarget.creator?.accountId) {
      void NotifySubmissionRejected({
        creatorAccountId: submissionTarget.creator.accountId,
        campaignTitle: submissionTarget.campaign?.title ?? 'Kampanye',
        submissionId: updatedSubmission.id,
        rejectionReason: note || 'Tidak memenuhi kriteria brief kampanye.',
      });
    }

    const formattedItem = FormatCampaignSubmissionReviewItem(updatedSubmission);

    SendSuccess(res, formattedItem, SUBMISSION_MESSAGES.REJECT_SUBMISSION_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /submissions/:id/revision`:
 * Requests a revision on a submitted video, updating status to `REVISION_REQUESTED` and attaching
 * mandatory feedback/admin note for the creator.
 *
 * @param req - Express request containing authenticated account, submission id parameter, and admin note.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function RequestSubmissionRevision(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;
    if (!account) {
      SendError(res, SUBMISSION_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND && account.role !== Role.ADMIN) {
      SendError(res, SUBMISSION_MESSAGES.ONLY_BRANDS_AND_ADMINS_CAN_REVIEW, 403);
      return;
    }

    const submissionId = req.params.id as string;

    const findSubmissionQuery = {
      where: {
        id: submissionId,
        status: Status.ACTIVE,
        ...(account.role === Role.BRAND
          ? {
              campaign: {
                brand: {
                  accountId: account.sub,
                },
                status: Status.ACTIVE,
              },
            }
          : {}),
      },
      select: {
        id: true,
        submissionStatus: true,
        campaign: {
          select: {
            id: true,
            title: true,
          },
        },
        creator: {
          select: {
            accountId: true,
          },
        },
      },
    };
    const submissionTarget = await prisma.submission.findFirst(findSubmissionQuery);

    if (!submissionTarget) {
      SendError(res, SUBMISSION_MESSAGES.SUBMISSION_NOT_FOUND, 404);
      return;
    }

    if (submissionTarget.submissionStatus === SubmissionStatus.APPROVED) {
      SendError(res, SUBMISSION_MESSAGES.ALREADY_APPROVED, 400);
      return;
    }

    if (submissionTarget.submissionStatus === SubmissionStatus.REJECTED) {
      SendError(res, SUBMISSION_MESSAGES.ALREADY_REJECTED, 400);
      return;
    }

    const allowedStatuses: SubmissionStatus[] = [SubmissionStatus.PENDING_REVIEW, SubmissionStatus.REVISION_REQUESTED];
    if (!allowedStatuses.includes(submissionTarget.submissionStatus)) {
      SendError(res, SUBMISSION_MESSAGES.SUBMISSION_STATUS_NOT_REVIEWABLE, 400);
      return;
    }

    const validation = RequestRevisionSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message ?? SUBMISSION_MESSAGES.INVALID_PAYLOAD;
      SendError(res, firstError, 400);
      return;
    }

    const note = validation.data.reviewNote.trim();

    // Atomic conditional transition prevents concurrent Accept/Reject/Revision race conditions
    const conditionalRevisionQuery = {
      where: {
        id: submissionTarget.id,
        status: Status.ACTIVE,
        submissionStatus: {
          in: allowedStatuses,
        },
      },
      data: {
        submissionStatus: SubmissionStatus.REVISION_REQUESTED,
        reviewNote: note,
      },
    };
    const revisionClaim = await prisma.submission.updateMany(conditionalRevisionQuery);

    if (revisionClaim.count === 0) {
      SendError(res, SUBMISSION_MESSAGES.SUBMISSION_RACE_CONFLICT, 409);
      return;
    }

    const reloadRevisedQuery = {
      where: { id: submissionTarget.id, status: Status.ACTIVE },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        socialAccount: {
          select: {
            id: true,
            platform: true,
            username: true,
            avatarUrl: true,
            followersCount: true,
          },
        },
      },
    };
    const updatedSubmission = await prisma.submission.findFirst(reloadRevisedQuery);

    if (!updatedSubmission) {
      SendError(res, SUBMISSION_MESSAGES.SUBMISSION_NOT_FOUND, 404);
      return;
    }

    if (submissionTarget.creator?.accountId) {
      void NotifySubmissionRevision({
        creatorAccountId: submissionTarget.creator.accountId,
        campaignTitle: submissionTarget.campaign?.title ?? 'Kampanye',
        submissionId: updatedSubmission.id,
        campaignId: submissionTarget.campaign?.id ?? '',
        reviewNote: note,
      });
    }

    const formattedItem = FormatCampaignSubmissionReviewItem(updatedSubmission);

    SendSuccess(res, formattedItem, SUBMISSION_MESSAGES.REVISE_SUBMISSION_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `GET /submissions/my`:
 * Retrieves paginated, filtered, searched, and sorted video submissions created by the authenticated creator.
 * Returns each submission row with campaign title, description, thumbnail, brand name & logo, CPM, views, and earnings.
 *
 * @param req - Express request containing authenticated account and query parameters.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetCreatorSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;
    if (!account) {
      SendError(res, SUBMISSION_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR && account.role !== Role.ADMIN) {
      SendError(res, SUBMISSION_MESSAGES.ONLY_CREATORS_CAN_ACCESS_SUBMISSIONS, 403);
      return;
    }

    const findCreatorQuery = {
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
      select: { id: true },
    };
    const creator = await prisma.creator.findFirst(findCreatorQuery);

    if (!creator) {
      SendError(res, SUBMISSION_MESSAGES.CREATOR_NOT_FOUND, 404);
      return;
    }

    const validation = CreatorSubmissionQuerySchema.safeParse(req.query);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message ?? SUBMISSION_MESSAGES.INVALID_PAYLOAD;
      SendError(res, firstError, 400);
      return;
    }

    const query = validation.data;
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.SubmissionWhereInput = {
      creatorId: creator.id,
      status: Status.ACTIVE,
    };

    if (query.status && query.status !== ALL_STATUS_FILTER) {
      whereClause.submissionStatus = query.status;
    } else {
      whereClause.submissionStatus = {
        not: SubmissionStatus.JOINED,
      };
    }

    if (query.search) {
      whereClause.OR = [
        { campaign: { title: { contains: query.search, mode: 'insensitive' } } },
        { campaign: { brand: { companyName: { contains: query.search, mode: 'insensitive' } } } },
        { videoCaption: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    let orderBy: Prisma.SubmissionOrderByWithRelationInput[] = [
      { submittedAt: 'desc' },
      { createdAt: 'desc' },
    ];

    if (query.sort === SUBMISSION_SORT.VIEWS_DESC) {
      orderBy = [{ verifiedViews: 'desc' }, { createdAt: 'desc' }];
    } else if (query.sort === SUBMISSION_SORT.VIEWS_ASC) {
      orderBy = [{ verifiedViews: 'asc' }, { createdAt: 'desc' }];
    } else if (query.sort === SUBMISSION_SORT.EARNINGS_DESC) {
      orderBy = [{ earnings: 'desc' }, { createdAt: 'desc' }];
    } else if (query.sort === SUBMISSION_SORT.OLDEST) {
      orderBy = [{ submittedAt: 'asc' }, { createdAt: 'asc' }];
    }

    const findSubmissionsQuery = {
      where: whereClause,
      skip,
      take: limit,
      orderBy,
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnailUrl: true,
            cpm: true,
            minViews: true,
            maxViews: true,
            platforms: true,
            campaignStatus: true,
            brand: {
              select: {
                companyName: true,
                logoUrl: true,
              },
            },
          },
        },
        socialAccount: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    };

    const countQuery = { where: whereClause };

    const statusCountsQuery = {
      by: ['submissionStatus' as const],
      where: {
        creatorId: creator.id,
        status: Status.ACTIVE,
      },
      _count: {
        _all: true as const,
      },
    };

    const [rawSubmissions, total, statusGroups] = await Promise.all([
      prisma.submission.findMany(findSubmissionsQuery),
      prisma.submission.count(countQuery),
      prisma.submission.groupBy(statusCountsQuery),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    const counts: CreatorSubmissionCountsDto = {
      all: 0,
      pendingReview: 0,
      approved: 0,
      revisionRequested: 0,
      rejected: 0,
      joined: 0,
    };

    for (const group of statusGroups) {
      const cnt = group._count._all;
      if (group.submissionStatus === SubmissionStatus.PENDING_REVIEW) {
        counts.pendingReview = cnt;
        counts.all += cnt;
      } else if (group.submissionStatus === SubmissionStatus.APPROVED) {
        counts.approved = cnt;
        counts.all += cnt;
      } else if (group.submissionStatus === SubmissionStatus.REVISION_REQUESTED) {
        counts.revisionRequested = cnt;
        counts.all += cnt;
      } else if (group.submissionStatus === SubmissionStatus.REJECTED) {
        counts.rejected = cnt;
        counts.all += cnt;
      } else if (group.submissionStatus === SubmissionStatus.JOINED) {
        counts.joined = cnt;
      }
    }

    const items: CreatorSubmissionListItemDto[] = rawSubmissions.map((s) => ({
      id: s.id,
      campaignId: s.campaignId,
      campaignTitle: s.campaign.title || 'Kampanye Tanpa Judul',
      campaignDescription: s.campaign.description,
      campaignThumbnailUrl: s.campaign.thumbnailUrl,
      brandName: s.campaign.brand.companyName,
      brandLogoUrl: s.campaign.brand.logoUrl,
      cpm: Number(s.campaign.cpm ?? 0),
      platform: s.platform,
      liveVideoUrl: s.liveVideoUrl,
      thumbnailUrl: s.thumbnailUrl,
      videoCaption: s.videoCaption,
      submissionStatus: s.submissionStatus,
      reviewNote: s.reviewNote,
      verifiedViews: s.verifiedViews,
      earnings: Number(s.earnings ?? 0),
      submittedAt: s.submittedAt,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      socialAccount: s.socialAccount
        ? {
            id: s.socialAccount.id,
            username: s.socialAccount.username,
            avatarUrl: s.socialAccount.avatarUrl,
          }
        : null,
    }));

    const responsePayload: CreatorSubmissionsPaginatedData = {
      items,
      counts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    SendSuccess(res, responsePayload, SUBMISSION_MESSAGES.GET_CREATOR_SUBMISSIONS_SUCCESS);
  } catch (err) {
    next(err);
  }
}

