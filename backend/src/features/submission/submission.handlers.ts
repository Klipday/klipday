import type { NextFunction, Request, Response } from 'express';
import { CampaignStatus, Platform, Role, Status, SubmissionStatus } from '../../generated/prisma/enums.js';
import { prisma } from '../../utils/prisma.js';
import { SendError, SendSuccess } from '../../utils/api-response.js';
import {
  BUDGET_DECIMAL_PLACES,
  CPM_VIEW_DIVISOR,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  SUBMISSION_MESSAGES,
} from './submission.constants.js';
import { FinalSubmitVideoSchema, SaveDraftSubmissionSchema, SubmissionQuerySchema } from './submission.validators.js';
import type { CampaignSubmissionsPaginatedData, MySubmissionResponseData, SubmissionDetailDto } from './submission.types.js';
import {
  BuildSubmissionsOrderBy,
  BuildSubmissionsWhereClause,
  FormatCampaignSubmissionReviewItem,
  FormatSubmissionResponse,
} from './submission.helper.js';

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
      select: { id: true },
    };
    const existingSubmission = await prisma.submission.findFirst(findExistingSubmissionQuery);

    if (!existingSubmission) {
      const createSubmissionPayload = {
        data: {
          campaignId: campaign.id,
          creatorId: creator.id,
          submissionStatus: SubmissionStatus.JOINED,
          status: Status.ACTIVE,
        },
      };
      await prisma.submission.create(createSubmissionPayload);
    }

    SendSuccess(res, null, SUBMISSION_MESSAGES.JOIN_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `GET /campaigns/:id/my-submission`:
 * Retrieves current creator's submission progress and connected TikTok social account.
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

    const findSubmissionQuery = {
      where: {
        campaignId,
        creatorId: creator.id,
        status: Status.ACTIVE,
      },
      include: {
        socialAccount: {
          where: { status: Status.ACTIVE },
        },
      },
    };
    const rawSubmission = await prisma.submission.findFirst(findSubmissionQuery);

    const findVerifiedSocialAccountQuery = {
      where: {
        creatorId: creator.id,
        platform: Platform.TIKTOK,
        isVerified: true,
        status: Status.ACTIVE,
      },
      orderBy: {
        verifiedAt: 'desc' as const,
      },
    };
    const verifiedSocialAccount = await prisma.creatorSocialAccount.findFirst(findVerifiedSocialAccountQuery);

    let mappedSubmission: SubmissionDetailDto | null = null;
    if (rawSubmission) {
      mappedSubmission = FormatSubmissionResponse(rawSubmission);
    }

    // Prioritize the social account already bound to this submission;
    // fallback to the creator's currently active verified TikTok account.
    const effectiveSocialAccount = rawSubmission?.socialAccount ?? verifiedSocialAccount;

    const responsePayload: MySubmissionResponseData = {
      submission: mappedSubmission,
      socialAccount: effectiveSocialAccount,
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
        campaignId,
        creatorId: creator.id,
        status: Status.ACTIVE,
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

      SendError(res, SUBMISSION_MESSAGES.STATUS_NOT_ALLOW_DRAFT, 400);
      return;
    }

    const findOwnedSocialAccountQuery = {
      where: {
        id: validation.data.socialAccountId,
        creatorId: creator.id,
        status: Status.ACTIVE,
      },
    };
    const ownedSocialAccount = await prisma.creatorSocialAccount.findFirst(findOwnedSocialAccountQuery);

    if (!ownedSocialAccount) {
      SendError(res, SUBMISSION_MESSAGES.SOCIAL_ACCOUNT_INVALID, 400);
      return;
    }

    const updateDraftPayload = {
      where: { id: existingSubmission.id },
      data: {
        liveVideoUrl: validation.data.liveVideoUrl,
        thumbnailUrl: validation.data.thumbnailUrl,
        videoCaption: validation.data.videoCaption,
        socialAccountId: validation.data.socialAccountId,
      },
      include: {
        socialAccount: {
          where: { status: Status.ACTIVE },
        },
      },
    };
    const updatedSubmission = await prisma.submission.update(updateDraftPayload);

    const formattedSubmission = FormatSubmissionResponse(updatedSubmission);
    SendSuccess(res, formattedSubmission, SUBMISSION_MESSAGES.DRAFT_SAVED);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /campaigns/:id/submission/submit`:
 * Finalizes the video submission (Step 4), setting `submittedAt` and transitioning status to `PENDING_REVIEW`.
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

    const findExistingSubmissionQuery = {
      where: {
        campaignId,
        creatorId: creator.id,
        status: Status.ACTIVE,
      },
    };
    const existingSubmission = await prisma.submission.findFirst(findExistingSubmissionQuery);

    if (!existingSubmission) {
      SendError(res, SUBMISSION_MESSAGES.SUBMISSION_NOT_FOUND, 404);
      return;
    }

    if (
      existingSubmission.submissionStatus !== SubmissionStatus.JOINED &&
      existingSubmission.submissionStatus !== SubmissionStatus.REVISION_REQUESTED
    ) {
      if (existingSubmission.submissionStatus === SubmissionStatus.PENDING_REVIEW) {
        SendError(res, SUBMISSION_MESSAGES.UNDER_REVIEW_BY_BRAND, 400);
        return;
      }

      if (existingSubmission.submissionStatus === SubmissionStatus.APPROVED) {
        SendError(res, SUBMISSION_MESSAGES.ALREADY_APPROVED, 400);
        return;
      }

      SendError(res, SUBMISSION_MESSAGES.SUBMISSION_STATUS_NOT_RESUBMITTABLE, 400);
      return;
    }

    const findOwnedSocialAccountQuery = {
      where: {
        id: validation.data.socialAccountId,
        creatorId: creator.id,
        status: Status.ACTIVE,
      },
    };
    const ownedSocialAccount = await prisma.creatorSocialAccount.findFirst(findOwnedSocialAccountQuery);

    if (!ownedSocialAccount) {
      SendError(res, SUBMISSION_MESSAGES.SOCIAL_ACCOUNT_INVALID, 400);
      return;
    }

    const finalizeSubmissionPayload = {
      where: { id: existingSubmission.id },
      data: {
        liveVideoUrl: validation.data.liveVideoUrl,
        thumbnailUrl: validation.data.thumbnailUrl,
        videoCaption: validation.data.videoCaption,
        socialAccountId: validation.data.socialAccountId,
        submissionStatus: SubmissionStatus.PENDING_REVIEW,
        submittedAt: new Date(),
      },
      include: {
        socialAccount: {
          where: { status: Status.ACTIVE },
        },
      },
    };
    const finalizedSubmission = await prisma.submission.update(finalizeSubmissionPayload);

    const formattedSubmission = FormatSubmissionResponse(finalizedSubmission);
    SendSuccess(res, formattedSubmission, SUBMISSION_MESSAGES.SUBMIT_SUCCESS);
  } catch (err) {
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
            username: true,
            avatarUrl: true,
            followersCount: true,
          },
        },
      },
    };

    const [total, submissions] = await Promise.all([
      prisma.submission.count(countQuery),
      prisma.submission.findMany(findSubmissionsQuery),
    ]);

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
