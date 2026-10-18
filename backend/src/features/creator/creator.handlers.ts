import { Readable } from 'node:stream';
import { TransformStream } from 'node:stream/web';
import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';
import {
  CampaignStatus,
  PayoutStatus,
  Platform,
  Role,
  Status,
  SubmissionStatus,
  WalletTransactionType,
} from '../../generated/prisma/enums.js';
import { SendError, SendSuccess } from '../../utils/api-response.js';
import { prisma } from '../../utils/prisma.js';
import {
  ALLOWED_AVATAR_MIME_TYPES,
  CREATOR_DASHBOARD_CREATOR_SELECT,
  CREATOR_DASHBOARD_JOINED_CAMPAIGN_SELECT,
  CREATOR_DASHBOARD_LIMITS,
  CREATOR_DASHBOARD_SUBMISSION_SELECT,
  CREATOR_DASHBOARD_TOP_CLIP_SELECT,
  CREATOR_LIMITS,
  CREATOR_MESSAGES,
} from './creator.constants.js';
import { UpdateCreatorProfileSchema } from './creator.schemas.js';
import type {
  CreatorDashboardJoinedCampaign,
  CreatorDashboardResponse,
  CreatorDashboardSubmissionItem,
  CreatorDashboardSubmissionStatusCounts,
  CreatorDashboardTopClip,
  CreatorProfileResponse,
  CreatorSocialSummary,
} from './creator.types.js';


/**
 * Handles `GET /creator/profile`:
 * Retrieves the full profile of the authenticated creator, including their linked verified TikTok account.
 *
 * @param req - Express request.
 * @param res - Express response.
 * @param next - Express next function.
 */
export async function GetCreatorProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CREATOR_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR) {
      SendError(res, CREATOR_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const findCreatorQuery = {
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
      include: {
        account: {
          select: {
            email: true,
          },
        },
        socialAccounts: {
          where: {
            platform: Platform.TIKTOK,
            isVerified: true,
            status: Status.ACTIVE,
          },
          orderBy: {
            verifiedAt: 'desc' as const,
          },
          take: 1,
        },
      },
    };

    const creator = await prisma.creator.findFirst(findCreatorQuery);

    if (!creator) {
      SendError(res, CREATOR_MESSAGES.CREATOR_NOT_FOUND, 404);
      return;
    }

    const latestVerifiedTikTok = creator.socialAccounts[0];
    const tiktokAccount: CreatorSocialSummary | null = latestVerifiedTikTok
      ? {
          username: latestVerifiedTikTok.username,
          avatarUrl: latestVerifiedTikTok.avatarUrl,
          followersCount: latestVerifiedTikTok.followersCount,
          isVerified: latestVerifiedTikTok.isVerified,
        }
      : null;

    const formattedDob = creator.dateOfBirth
      ? creator.dateOfBirth.toISOString().slice(0, 10)
      : null;

    const responseData: CreatorProfileResponse = {
      id: creator.id,
      fullName: creator.fullName,
      email: creator.account.email,
      avatarUrl: creator.avatarUrl,
      dateOfBirth: formattedDob,
      phoneNumber: creator.phoneNumber,
      location: creator.location,
      bio: creator.bio,
      contentCategories: creator.contentCategories,
      tiktokAccount,
      createdAt: creator.createdAt,
      updatedAt: creator.updatedAt,
    };

    SendSuccess(res, responseData, CREATOR_MESSAGES.PROFILE_FETCH_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `PATCH /creator/profile`:
 * Updates the creator's personal details, age/birthdate, location, bio, and content niche categories.
 *
 * @param req - Express request with update fields.
 * @param res - Express response.
 * @param next - Express next function.
 */
export async function UpdateCreatorProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CREATOR_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR) {
      SendError(res, CREATOR_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const findCreatorQuery = {
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    };

    const existingCreator = await prisma.creator.findFirst(findCreatorQuery);

    if (!existingCreator) {
      SendError(res, CREATOR_MESSAGES.CREATOR_NOT_FOUND, 404);
      return;
    }

    const validationResult = UpdateCreatorProfileSchema.safeParse(req.body);

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      const errorMessage = firstIssue ? firstIssue.message : CREATOR_MESSAGES.INVALID_PAYLOAD;
      SendError(res, errorMessage, 400);
      return;
    }

    const payload = validationResult.data;
    const updateData: Prisma.CreatorUpdateInput = {};

    if (payload.fullName !== undefined) {
      updateData.fullName = payload.fullName.trim();
    }
    if (payload.dateOfBirth !== undefined) {
      if (!payload.dateOfBirth) {
        updateData.dateOfBirth = null;
      } else {
        const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(payload.dateOfBirth);
        if (match) {
          updateData.dateOfBirth = new Date(
            Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
          );
        } else {
          updateData.dateOfBirth = new Date(payload.dateOfBirth);
        }
      }
    }
    if (payload.phoneNumber !== undefined) {
      updateData.phoneNumber = payload.phoneNumber
        ? payload.phoneNumber.replace(/[\s-]/g, '').trim()
        : null;
    }
    if (payload.location !== undefined) {
      updateData.location = payload.location ? payload.location.trim() : null;
    }
    if (payload.bio !== undefined) {
      updateData.bio = payload.bio ? payload.bio.trim() : null;
    }
    if (payload.contentCategories !== undefined) {
      updateData.contentCategories = payload.contentCategories;
    }

    const updateQuery = {
      where: { id: existingCreator.id },
      data: updateData,
      include: {
        account: {
          select: {
            email: true,
          },
        },
        socialAccounts: {
          where: {
            platform: Platform.TIKTOK,
            isVerified: true,
            status: Status.ACTIVE,
          },
          orderBy: {
            verifiedAt: 'desc' as const,
          },
          take: 1,
        },
      },
    };

    const updatedCreator = await prisma.creator.update(updateQuery);

    const latestVerifiedTikTok = updatedCreator.socialAccounts[0];
    const tiktokAccount: CreatorSocialSummary | null = latestVerifiedTikTok
      ? {
          username: latestVerifiedTikTok.username,
          avatarUrl: latestVerifiedTikTok.avatarUrl,
          followersCount: latestVerifiedTikTok.followersCount,
          isVerified: latestVerifiedTikTok.isVerified,
        }
      : null;

    const formattedDob = updatedCreator.dateOfBirth
      ? updatedCreator.dateOfBirth.toISOString().slice(0, 10)
      : null;

    const responseData: CreatorProfileResponse = {
      id: updatedCreator.id,
      fullName: updatedCreator.fullName,
      email: updatedCreator.account.email,
      avatarUrl: updatedCreator.avatarUrl,
      dateOfBirth: formattedDob,
      phoneNumber: updatedCreator.phoneNumber,
      location: updatedCreator.location,
      bio: updatedCreator.bio,
      contentCategories: updatedCreator.contentCategories,
      tiktokAccount,
      createdAt: updatedCreator.createdAt,
      updatedAt: updatedCreator.updatedAt,
    };

    SendSuccess(res, responseData, CREATOR_MESSAGES.PROFILE_UPDATE_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /creator/profile/avatar`:
 * Streams custom avatar photo directly to Supabase Storage with chunk-based byte counting (DoS defense).
 *
 * @param req - Express request with raw image stream.
 * @param res - Express response.
 * @param next - Express next function.
 */
export async function UploadCreatorAvatar(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CREATOR_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR) {
      SendError(res, CREATOR_MESSAGES.UNAUTHORIZED_ROLE, 403);
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
      SendError(res, CREATOR_MESSAGES.CREATOR_NOT_FOUND, 404);
      return;
    }

    const rawContentType = req.headers['content-type']?.split(';')[0]?.trim().toLowerCase() ?? '';
    const fileExtension = ALLOWED_AVATAR_MIME_TYPES[rawContentType];

    if (!fileExtension) {
      SendError(res, CREATOR_MESSAGES.UNSUPPORTED_FILE_TYPE, 400);
      return;
    }

    const contentLength = Number(req.headers['content-length']);

    if (!contentLength || Number.isNaN(contentLength)) {
      SendError(res, CREATOR_MESSAGES.CONTENT_LENGTH_REQUIRED, 411);
      return;
    }

    if (contentLength > CREATOR_LIMITS.MAX_AVATAR_SIZE_BYTES) {
      SendError(res, CREATOR_MESSAGES.FILE_SIZE_EXCEEDED, 400);
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'campaign_thumbnails';

    if (!supabaseUrl || !serviceRoleKey) {
      SendError(res, CREATOR_MESSAGES.STORAGE_CONFIG_MISSING, 500);
      return;
    }

    let bytesReceived = 0;
    const sizeLimiter = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        bytesReceived += chunk.byteLength;
        if (bytesReceived > CREATOR_LIMITS.MAX_AVATAR_SIZE_BYTES) {
          controller.error(new Error('FILE_SIZE_EXCEEDED'));
        } else {
          controller.enqueue(chunk);
        }
      },
    });

    const webStream = Readable.toWeb(req).pipeThrough(sizeLimiter);
    const storagePath = `creators/${creator.id}/avatar-${Date.now()}.${fileExtension}`;
    const targetUrl = `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/${bucket}/${storagePath}`;

    const supabaseResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        'Content-Type': rawContentType,
        'x-upsert': 'true',
      },
      body: webStream,
      duplex: 'half',
    });

    if (!supabaseResponse.ok) {
      const errorDetail = await supabaseResponse.text();
      console.error('[Supabase Storage Upload Creator Avatar Error]', supabaseResponse.status, errorDetail);
      SendError(res, CREATOR_MESSAGES.STORAGE_UPLOAD_FAILED, 502);
      return;
    }

    const publicUrl = `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${bucket}/${storagePath}`;

    const updateAvatarQuery = {
      where: { id: creator.id },
      data: { avatarUrl: publicUrl },
    };

    await prisma.creator.update(updateAvatarQuery);

    SendSuccess(res, { url: publicUrl }, CREATOR_MESSAGES.AVATAR_UPLOAD_SUCCESS);
  } catch (error) {
    if (error instanceof Error && error.message === 'FILE_SIZE_EXCEEDED') {
      SendError(res, CREATOR_MESSAGES.FILE_SIZE_EXCEEDED, 400);
      return;
    }
    next(error);
  }
}

/**
 * Handles `GET /creator/dashboard`:
 * Retrieves aggregated creator KPI metrics, recent submitted campaigns,
 * active joined campaigns awaiting video submission (`submissionStatus: JOINED`),
 * and top verified clips in a single parallel roundtrip.
 *
 * @param req - Express request with authenticated account session.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetCreatorDashboardSummary(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CREATOR_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR && account.role !== Role.ADMIN) {
      SendError(res, CREATOR_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const findCreatorQuery = {
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
      select: CREATOR_DASHBOARD_CREATOR_SELECT,
    };

    const creator = await prisma.creator.findFirst(findCreatorQuery);

    if (!creator) {
      SendError(res, CREATOR_MESSAGES.CREATOR_NOT_FOUND, 404);
      return;
    }

    const walletQuery = {
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
      select: {
        id: true,
        balance: true,
      },
    };
    const walletPromise = prisma.wallet.findFirst(walletQuery);

    const verifiedSubmissionsAggregateQuery = {
      where: {
        creatorId: creator.id,
        status: Status.ACTIVE,
        submissionStatus: {
          in: [
            SubmissionStatus.APPROVED,
            SubmissionStatus.POSTED,
            SubmissionStatus.VERIFIED,
          ],
        },
        campaign: {
          status: Status.ACTIVE,
        },
      },
      _sum: {
        verifiedViews: true as const,
        earnings: true as const,
      },
    };
    const verifiedSubmissionsAggregatePromise = prisma.submission.aggregate(
      verifiedSubmissionsAggregateQuery,
    );

    const submissionStatusGroupsQuery = {
      by: ['submissionStatus' as const],
      where: {
        creatorId: creator.id,
        status: Status.ACTIVE,
        OR: [
          {
            submissionStatus: {
              not: SubmissionStatus.JOINED,
            },
            campaign: {
              status: Status.ACTIVE,
            },
          },
          {
            submissionStatus: SubmissionStatus.JOINED,
            campaign: {
              status: Status.ACTIVE,
              campaignStatus: CampaignStatus.ACTIVE,
            },
          },
        ],
      },
      _count: {
        _all: true as const,
      },
    };
    const submissionStatusGroupsPromise = prisma.submission.groupBy(
      submissionStatusGroupsQuery,
    );

    const walletEarningAggregateQuery = {
      where: {
        status: Status.ACTIVE,
        type: WalletTransactionType.CAMPAIGN_EARNING,
        wallet: {
          accountId: account.sub,
          status: Status.ACTIVE,
        },
      },
      _sum: {
        amount: true as const,
      },
    };
    const walletEarningAggregatePromise = prisma.walletTransaction.aggregate(
      walletEarningAggregateQuery,
    );

    const walletWithdrawalAggregateQuery = {
      where: {
        status: Status.ACTIVE,
        type: WalletTransactionType.WITHDRAWAL,
        wallet: {
          accountId: account.sub,
          status: Status.ACTIVE,
        },
      },
      _sum: {
        amount: true as const,
      },
    };
    const walletWithdrawalAggregatePromise = prisma.walletTransaction.aggregate(
      walletWithdrawalAggregateQuery,
    );

    const pendingPayoutAggregateQuery = {
      where: {
        status: Status.ACTIVE,
        payoutStatus: PayoutStatus.PENDING,
        wallet: {
          accountId: account.sub,
          status: Status.ACTIVE,
        },
      },
      _sum: {
        amount: true as const,
      },
    };
    const pendingPayoutAggregatePromise = prisma.payoutRequest.aggregate(
      pendingPayoutAggregateQuery,
    );

    const recentSubmissionsQuery = {
      where: {
        creatorId: creator.id,
        status: Status.ACTIVE,
        submissionStatus: {
          not: SubmissionStatus.JOINED,
        },
        campaign: {
          status: Status.ACTIVE,
        },
      },
      orderBy: [
        { updatedAt: 'desc' as const },
        { createdAt: 'desc' as const },
      ],
      take: CREATOR_DASHBOARD_LIMITS.RECENT_SUBMISSIONS_FETCH_POOL,
      select: CREATOR_DASHBOARD_SUBMISSION_SELECT,
    };
    const recentSubmissionsPromise = prisma.submission.findMany(
      recentSubmissionsQuery,
    );

    const joinedCampaignsQuery = {
      where: {
        creatorId: creator.id,
        status: Status.ACTIVE,
        submissionStatus: SubmissionStatus.JOINED,
        campaign: {
          status: Status.ACTIVE,
          campaignStatus: CampaignStatus.ACTIVE,
        },
      },
      orderBy: {
        updatedAt: 'desc' as const,
      },
      take: CREATOR_DASHBOARD_LIMITS.JOINED_CAMPAIGNS_LIMIT,
      select: CREATOR_DASHBOARD_JOINED_CAMPAIGN_SELECT,
    };
    const joinedCampaignsPromise = prisma.submission.findMany(
      joinedCampaignsQuery,
    );

    const topClipsQuery = {
      where: {
        creatorId: creator.id,
        status: Status.ACTIVE,
        submissionStatus: {
          in: [
            SubmissionStatus.APPROVED,
            SubmissionStatus.POSTED,
            SubmissionStatus.VERIFIED,
          ],
        },
        campaign: {
          status: Status.ACTIVE,
        },
      },
      orderBy: [
        { verifiedViews: 'desc' as const },
        { submittedAt: 'desc' as const },
      ],
      take: CREATOR_DASHBOARD_LIMITS.TOP_CLIPS_LIMIT,
      select: CREATOR_DASHBOARD_TOP_CLIP_SELECT,
    };
    const topClipsPromise = prisma.submission.findMany(topClipsQuery);

    const [
      wallet,
      verifiedSubmissionsAggregate,
      rawStatusCounts,
      walletEarningAggregate,
      walletWithdrawalAggregate,
      pendingPayoutAggregate,
      rawRecentSubmissions,
      rawJoinedCampaigns,
      rawTopClips,
    ] = await Promise.all([
      walletPromise,
      verifiedSubmissionsAggregatePromise,
      submissionStatusGroupsPromise,
      walletEarningAggregatePromise,
      walletWithdrawalAggregatePromise,
      pendingPayoutAggregatePromise,
      recentSubmissionsPromise,
      joinedCampaignsPromise,
      topClipsPromise,
    ]);

    const statusCountsMap: Record<string, number> = {};
    for (const row of rawStatusCounts) {
      statusCountsMap[row.submissionStatus] = row._count._all;
    }

    const joinedCount = statusCountsMap[SubmissionStatus.JOINED] || 0;
    const pendingReviewCount = statusCountsMap[SubmissionStatus.PENDING_REVIEW] || 0;
    const revisionRequestedCount = statusCountsMap[SubmissionStatus.REVISION_REQUESTED] || 0;
    const approvedCount = statusCountsMap[SubmissionStatus.APPROVED] || 0;
    const postedCount = statusCountsMap[SubmissionStatus.POSTED] || 0;
    const verifiedCount = statusCountsMap[SubmissionStatus.VERIFIED] || 0;
    const rejectedCount = statusCountsMap[SubmissionStatus.REJECTED] || 0;

    const submittedTotalCount =
      pendingReviewCount +
      revisionRequestedCount +
      approvedCount +
      postedCount +
      verifiedCount +
      rejectedCount;

    const totalSubmissionsCount = joinedCount + submittedTotalCount;

    const submissionStatusCounts: CreatorDashboardSubmissionStatusCounts = {
      joined: joinedCount,
      pendingReview: pendingReviewCount,
      revisionRequested: revisionRequestedCount,
      approved: approvedCount,
      posted: postedCount,
      verified: verifiedCount,
      rejected: rejectedCount,
      submittedTotal: submittedTotalCount,
      total: totalSubmissionsCount,
    };

    const sortedRecentSubmissions = [...rawRecentSubmissions]
      .sort((a, b) => {
        const aIsRevision = a.submissionStatus === SubmissionStatus.REVISION_REQUESTED ? 1 : 0;
        const bIsRevision = b.submissionStatus === SubmissionStatus.REVISION_REQUESTED ? 1 : 0;
        if (aIsRevision !== bIsRevision) {
          return bIsRevision - aIsRevision;
        }
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      })
      .slice(0, CREATOR_DASHBOARD_LIMITS.RECENT_SUBMISSIONS_LIMIT);

    const recentSubmissions: CreatorDashboardSubmissionItem[] =
      sortedRecentSubmissions.map((row) => {
        const actualEarnings = Number(row.earnings || 0);
        const campaignCpm = Number(row.campaign.cpm || 0);
        const maxViewsCap = row.campaign.maxViews;
        const effectiveViews =
          maxViewsCap && maxViewsCap > 0
            ? Math.min(row.verifiedViews, maxViewsCap)
            : row.verifiedViews;
        const calculatedEstimate = Math.floor(
          (effectiveViews / CREATOR_DASHBOARD_LIMITS.CPM_VIEW_DIVISOR) * campaignCpm,
        );
        const estimatedEarnings =
          row.submissionStatus === SubmissionStatus.REJECTED
            ? 0
            : actualEarnings > 0
              ? actualEarnings
              : calculatedEstimate;

        const submissionItem: CreatorDashboardSubmissionItem = {
          id: row.id,
          campaignId: row.campaignId,
          campaignTitle: row.campaign.title,
          brandName: row.campaign.brand.companyName,
          category: row.campaign.campaignCategory,
          brandIndustry: row.campaign.brand.industry,
          submissionStatus: row.submissionStatus,
          verifiedViews: row.verifiedViews,
          earnings: actualEarnings,
          estimatedEarnings,
          submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
          updatedAt: row.updatedAt.toISOString(),
        };
        return submissionItem;
      });

    const joinedCampaigns: CreatorDashboardJoinedCampaign[] =
      rawJoinedCampaigns.map((row) => {
        const camp = row.campaign;
        const budget = Number(camp.budget || 0);
        const spent = camp.submissions
          .filter(
            (s) =>
              s.submissionStatus === SubmissionStatus.APPROVED ||
              s.submissionStatus === SubmissionStatus.POSTED ||
              s.submissionStatus === SubmissionStatus.VERIFIED,
          )
          .reduce((sum, s) => sum + Number(s.earnings || 0), 0);
        const remainingBudget = Math.max(0, budget - spent);
        const remainingPercent =
          budget > 0
            ? Math.min(100, Math.max(0, Math.round((remainingBudget / budget) * 100)))
            : 100;

        const joinedCampaignItem: CreatorDashboardJoinedCampaign = {
          submissionId: row.id,
          id: camp.id,
          title: camp.title,
          brandName: camp.brand.companyName,
          category: camp.campaignCategory,
          brandIndustry: camp.brand.industry,
          cpm: Number(camp.cpm || 0),
          budget,
          spent,
          remainingBudget,
          remainingPercent,
          joinedAt: row.createdAt.toISOString(),
          endDate: camp.endDate ? camp.endDate.toISOString() : null,
        };
        return joinedCampaignItem;
      });

    const topClips: CreatorDashboardTopClip[] = rawTopClips.map((clip) => {
      const actualEarnings = Number(clip.earnings || 0);
      const campaignCpm = Number(clip.campaign.cpm || 0);
      const maxViewsCap = clip.campaign.maxViews;
      const effectiveViews =
        maxViewsCap && maxViewsCap > 0
          ? Math.min(clip.verifiedViews, maxViewsCap)
          : clip.verifiedViews;
      const calculatedEstimate = Math.floor(
        (effectiveViews / CREATOR_DASHBOARD_LIMITS.CPM_VIEW_DIVISOR) * campaignCpm,
      );
      const estimatedEarnings = actualEarnings > 0 ? actualEarnings : calculatedEstimate;

      const topClipItem: CreatorDashboardTopClip = {
        id: clip.id,
        campaignId: clip.campaignId,
        campaignTitle: clip.campaign.title,
        brandName: clip.campaign.brand.companyName,
        socialUsername: clip.socialAccount?.username || '',
        videoThumbnailUrl: clip.thumbnailUrl,
        liveVideoUrl: clip.liveVideoUrl,
        verifiedViews: clip.verifiedViews,
        earnings: actualEarnings,
        estimatedEarnings,
      };
      return topClipItem;
    });

    const latestVerifiedTikTok = creator.socialAccounts[0];
    const tiktokAccount: CreatorSocialSummary | null = latestVerifiedTikTok
      ? {
          username: latestVerifiedTikTok.username,
          avatarUrl: latestVerifiedTikTok.avatarUrl,
          followersCount: latestVerifiedTikTok.followersCount,
          isVerified: latestVerifiedTikTok.isVerified,
        }
      : null;

    const submissionEarningsSum = Number(verifiedSubmissionsAggregate._sum.earnings ?? 0);
    const walletEarningsSum = Number(walletEarningAggregate._sum.amount ?? 0);
    const totalEarnings = Math.max(submissionEarningsSum, walletEarningsSum);
    const totalWithdrawn = Number(walletWithdrawalAggregate._sum.amount ?? 0);
    const pendingWithdrawalAmount = Number(pendingPayoutAggregate._sum.amount ?? 0);
    const walletActiveBalance = wallet ? Number(wallet.balance) : 0;

    const responseData: CreatorDashboardResponse = {
      creator: {
        id: creator.id,
        fullName: creator.fullName,
        avatarUrl: creator.avatarUrl,
        tiktokAccount,
      },
      metrics: {
        totalVerifiedViews: verifiedSubmissionsAggregate._sum.verifiedViews ?? 0,
        totalEarnings,
        walletActiveBalance,
        totalWithdrawn,
        pendingWithdrawalAmount,
        submissionStatusCounts,
      },
      recentSubmissions,
      joinedCampaigns,
      topClips,
      hasAnySubmissions: totalSubmissionsCount > 0,
    };

    SendSuccess(res, responseData, CREATOR_MESSAGES.DASHBOARD_SUMMARY_FETCH_SUCCESS);
  } catch (err) {
    next(err);
  }
}

