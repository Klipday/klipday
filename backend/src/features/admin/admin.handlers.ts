import type { NextFunction, Request, Response } from 'express';
import { Prisma, type PrismaClient } from '../../generated/prisma/client.js';
import {
  CampaignStatus,
  PaymentStatus,
  Role,
  Status,
  SubmissionStatus,
  WalletTransactionType,
} from '../../generated/prisma/enums.js';
import { SendError, SendSuccess } from '../../utils/api-response.js';
import { prisma } from '../../utils/prisma.js';
import { CAMPAIGN_DETAIL_SELECT } from '../campaign/campaign.constants.js';
import {
  GenerateWalletTransactionReferenceCode,
  ProvisionAccountWallet,
} from '../wallet/wallet.helper.js';
import {
  ADMIN_MESSAGES,
  ADMIN_TOPUP_SELECT,
  FREEZE_REASON,
  MODERATION_ACTION,
  MODERATION_FILTER,
  SETTLEMENT_FILTER,
  TOPUP_FILTER,
  TOPUP_REVIEW_ACTION,
} from './admin.constants.js';
import {
  CalculateTargetReward,
  ComputeCampaignFifoAllocations,
  DetermineCampaignFreezeReason,
  GenerateSettlementTransactionRefCode,
  MapAdminTopUpToDto,
} from './admin.helper.js';
import {
  AdminModerateCampaignSchema,
  AdminModerationQuerySchema,
  AdminSettlementQuerySchema,
  AdminTopUpQuerySchema,
  DisqualifySubmissionSchema,
  ReviewBrandTopUpSchema,
  UpdateSubmissionViewsSchema,
} from './admin.schemas.js';
import type {
  AdminCampaignSettlementSummaryDto,
  AdminFifoSubmissionItemDto,
  AdminModerationCampaignCardDto,
  AdminModerationCampaignsPaginatedDto,
  AdminSettlementCampaignCardDto,
  AdminSettlementCampaignsPaginatedDto,
  AdminSettlementCountsDto,
  AdminTopUpItemDto,
  AdminTopUpsPaginatedDto,
  FifoSubmissionAllocationInput,
} from './admin.types.js';

/**
 * Builds the complete FIFO settlement summary and ledger breakdown for a specific campaign.
 *
 * @param campaignId - Target campaign UUID.
 * @param db - Prisma client or active transaction client.
 * @returns Populated AdminCampaignSettlementSummaryDto, or null if campaign does not exist.
 */
export async function BuildCampaignSettlementSummaryById(
  campaignId: string,
  db: PrismaClient | Prisma.TransactionClient = prisma,
): Promise<AdminCampaignSettlementSummaryDto | null> {
  const campaignLookupQuery = {
    where: {
      id: campaignId,
      status: Status.ACTIVE,
      brand: { status: Status.ACTIVE },
    },
    select: {
      id: true,
      title: true,
      campaignStatus: true,
      cpm: true,
      minViews: true,
      maxViews: true,
      budget: true,
      endDate: true,
      brand: {
        select: {
          id: true,
          companyName: true,
          logoUrl: true,
        },
      },
      submissions: {
        where: {
          status: Status.ACTIVE,
          submissionStatus: { not: SubmissionStatus.JOINED },
        },
        orderBy: [
          { submittedAt: 'asc' as const },
          { createdAt: 'asc' as const },
        ],
        select: {
          id: true,
          creatorId: true,
          liveVideoUrl: true,
          thumbnailUrl: true,
          videoCaption: true,
          submissionStatus: true,
          reviewNote: true,
          verifiedViews: true,
          earnings: true,
          submittedAt: true,
          createdAt: true,
          creator: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          socialAccount: {
            select: {
              username: true,
            },
          },
        },
      },
    },
  };

  const campaign = await db.campaign.findFirst(campaignLookupQuery);

  if (!campaign) {
    return null;
  }

  const budget = Number(campaign.budget ?? 0);
  const cpm = Number(campaign.cpm ?? 0);
  const minViews = campaign.minViews ?? 0;
  const maxViews = campaign.maxViews ?? 0;

  // Separate active approved/verified submissions for FIFO allocation from rejected/pending ones
  const approvedSubmissions = campaign.submissions.filter(
    (sub) => sub.submissionStatus === SubmissionStatus.APPROVED,
  );
  const verifiedSubmissions = campaign.submissions.filter(
    (sub) => sub.submissionStatus === SubmissionStatus.VERIFIED,
  );
  const pendingSubmissions = campaign.submissions.filter(
    (sub) =>
      sub.submissionStatus === SubmissionStatus.PENDING_REVIEW ||
      sub.submissionStatus === SubmissionStatus.REVISION_REQUESTED,
  );
  const disqualifiedSubmissions = campaign.submissions.filter(
    (sub) => sub.submissionStatus === SubmissionStatus.REJECTED,
  );

  const fifoInputs: FifoSubmissionAllocationInput[] = approvedSubmissions.map((sub) => ({
    id: sub.id,
    verifiedViews: sub.verifiedViews,
    currentEarnings: Number(sub.earnings ?? 0),
  }));

  const fifoSummary = ComputeCampaignFifoAllocations(
    budget,
    minViews,
    maxViews,
    cpm,
    fifoInputs,
  );

  const allocationById = new Map(
    fifoSummary.allocations.map((alloc) => [alloc.id, alloc]),
  );

  const verifiedCreatorRewards = verifiedSubmissions.reduce(
    (sum, sub) => sum + Math.floor(Number(sub.earnings ?? 0)),
    0,
  );

  const isFinished = campaign.campaignStatus === CampaignStatus.FINISHED;
  const allocatedCreatorRewards = isFinished
    ? verifiedCreatorRewards
    : fifoSummary.totalAllocated;
  const brandRefundAmount = Math.max(0, budget - allocatedCreatorRewards);

  const now = new Date();
  const freezeReason = DetermineCampaignFreezeReason(
    campaign.campaignStatus,
    budget,
    allocatedCreatorRewards,
    campaign.endDate,
    now,
  );

  let activeFifoSequence = 0;

  const submissionItems: AdminFifoSubmissionItemDto[] = campaign.submissions.map((sub) => {
    const isEligibleFifoQueueMember =
      sub.submissionStatus === SubmissionStatus.APPROVED ||
      sub.submissionStatus === SubmissionStatus.VERIFIED;

    if (isEligibleFifoQueueMember) {
      activeFifoSequence += 1;
    }

    const fifoOrder = isEligibleFifoQueueMember ? activeFifoSequence : null;
    const rawTarget = CalculateTargetReward(sub.verifiedViews, minViews, maxViews, cpm);
    const allocation = allocationById.get(sub.id);

    const subAllocated =
      sub.submissionStatus === SubmissionStatus.VERIFIED
        ? Math.floor(Number(sub.earnings ?? 0))
        : allocation
          ? allocation.allocatedEarnings
          : 0;

    const unpaidShortfall = isEligibleFifoQueueMember
      ? Math.max(0, rawTarget - subAllocated)
      : 0;
    const isCappedByBudget = isEligibleFifoQueueMember && unpaidShortfall > 0;

    const item: AdminFifoSubmissionItemDto = {
      id: sub.id,
      fifoOrder,
      creatorId: sub.creatorId,
      creatorName: sub.creator.fullName,
      creatorAvatarUrl: sub.creator.avatarUrl,
      socialUsername: sub.socialAccount?.username ?? null,
      liveVideoUrl: sub.liveVideoUrl,
      thumbnailUrl: sub.thumbnailUrl,
      videoCaption: sub.videoCaption,
      submissionStatus: sub.submissionStatus,
      reviewNote: sub.reviewNote,
      verifiedViews: sub.verifiedViews,
      allocatedEarnings: subAllocated,
      targetEarnings: rawTarget,
      unpaidShortfall,
      isCappedByBudget,
      submittedAt: sub.submittedAt,
      createdAt: sub.createdAt,
    };

    return item;
  });

  const canFinalize = campaign.campaignStatus === CampaignStatus.ACTIVE;

  const summaryDto: AdminCampaignSettlementSummaryDto = {
    campaignId: campaign.id,
    title: campaign.title ?? 'Kampanye Tanpa Judul',
    campaignStatus: campaign.campaignStatus,
    freezeReason,
    cpm,
    minViews,
    maxViews,
    budget,
    allocatedCreatorRewards,
    verifiedCreatorRewards,
    brandRefundAmount,
    canFinalize,
    pendingReviewCount: pendingSubmissions.length,
    approvedCount: approvedSubmissions.length,
    verifiedCount: verifiedSubmissions.length,
    disqualifiedCount: disqualifiedSubmissions.length,
    endDate: campaign.endDate,
    brand: {
      id: campaign.brand.id,
      companyName: campaign.brand.companyName,
      logoUrl: campaign.brand.logoUrl,
    },
    submissions: submissionItems,
  };

  return summaryDto;
}

/**
 * Handles `GET /admin/settlements`:
 * Lists campaigns eligible for settlement review (expired or 100% budget reached) as well as settled campaigns.
 *
 * @param req - Express request with filter, search, page, and limit query parameters.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetAdminSettlementCampaigns(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, ADMIN_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.ADMIN) {
      SendError(res, ADMIN_MESSAGES.ADMIN_ONLY, 403);
      return;
    }

    const parsedQuery = AdminSettlementQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      const firstIssue = parsedQuery.error.issues[0];
      const message = firstIssue ? firstIssue.message : ADMIN_MESSAGES.INVALID_PAYLOAD;
      SendError(res, message, 400);
      return;
    }

    const { filter, search, page, limit } = parsedQuery.data;

    const campaignsQuery = {
      where: {
        status: Status.ACTIVE,
        brand: { status: Status.ACTIVE },
        campaignStatus: {
          in: [CampaignStatus.ACTIVE, CampaignStatus.FINISHED],
        },
      },
      orderBy: { updatedAt: 'desc' as const },
      select: {
        id: true,
        title: true,
        campaignCategory: true,
        campaignType: true,
        campaignStatus: true,
        thumbnailUrl: true,
        cpm: true,
        minViews: true,
        maxViews: true,
        budget: true,
        endDate: true,
        createdAt: true,
        brand: {
          select: {
            id: true,
            companyName: true,
            logoUrl: true,
          },
        },
        submissions: {
          where: {
            status: Status.ACTIVE,
            submissionStatus: {
              in: [
                SubmissionStatus.APPROVED,
                SubmissionStatus.VERIFIED,
                SubmissionStatus.REJECTED,
              ],
            },
          },
          orderBy: [
            { submittedAt: 'asc' as const },
            { createdAt: 'asc' as const },
          ],
          select: {
            id: true,
            submissionStatus: true,
            verifiedViews: true,
            earnings: true,
          },
        },
      },
    };

    const campaigns = await prisma.campaign.findMany(campaignsQuery);
    const now = new Date();

    const mappedCards: AdminSettlementCampaignCardDto[] = campaigns.map((campaign) => {
      const budget = Number(campaign.budget ?? 0);
      const cpm = Number(campaign.cpm ?? 0);
      const minViews = campaign.minViews ?? 0;
      const maxViews = campaign.maxViews ?? 0;

      const approvedSubs = campaign.submissions.filter(
        (sub) => sub.submissionStatus === SubmissionStatus.APPROVED,
      );
      const verifiedSubs = campaign.submissions.filter(
        (sub) => sub.submissionStatus === SubmissionStatus.VERIFIED,
      );
      const disqualifiedSubs = campaign.submissions.filter(
        (sub) => sub.submissionStatus === SubmissionStatus.REJECTED,
      );

      const fifoInputs: FifoSubmissionAllocationInput[] = approvedSubs.map((sub) => ({
        id: sub.id,
        verifiedViews: sub.verifiedViews,
        currentEarnings: Number(sub.earnings ?? 0),
      }));

      const fifoSummary = ComputeCampaignFifoAllocations(
        budget,
        minViews,
        maxViews,
        cpm,
        fifoInputs,
      );

      const verifiedEarnings = verifiedSubs.reduce(
        (sum, sub) => sum + Math.floor(Number(sub.earnings ?? 0)),
        0,
      );

      const allocatedEarnings =
        campaign.campaignStatus === CampaignStatus.FINISHED
          ? verifiedEarnings
          : fifoSummary.totalAllocated;

      const remainingRefund = Math.max(0, budget - allocatedEarnings);
      const freezeReason = DetermineCampaignFreezeReason(
        campaign.campaignStatus,
        budget,
        allocatedEarnings,
        campaign.endDate,
        now,
      );

      const card: AdminSettlementCampaignCardDto = {
        id: campaign.id,
        title: campaign.title ?? 'Kampanye Tanpa Judul',
        campaignCategory: campaign.campaignCategory,
        campaignType: campaign.campaignType,
        campaignStatus: campaign.campaignStatus,
        thumbnailUrl: campaign.thumbnailUrl,
        cpm,
        minViews,
        maxViews,
        budget,
        allocatedEarnings,
        verifiedEarnings,
        remainingRefund,
        freezeReason,
        approvedSubmissionsCount: approvedSubs.length,
        verifiedSubmissionsCount: verifiedSubs.length,
        disqualifiedSubmissionsCount: disqualifiedSubs.length,
        endDate: campaign.endDate,
        createdAt: campaign.createdAt,
        brand: {
          id: campaign.brand.id,
          companyName: campaign.brand.companyName,
          logoUrl: campaign.brand.logoUrl,
        },
      };

      return card;
    });

    // Apply optional search filter before computing tab counts or after?
    // Compute tab counts across all settlement-relevant campaigns first
    const counts: AdminSettlementCountsDto = {
      needSettlement: mappedCards.filter(
        (c) =>
          c.freezeReason === FREEZE_REASON.BUDGET_FULL ||
          c.freezeReason === FREEZE_REASON.EXPIRED ||
          (c.campaignStatus === CampaignStatus.ACTIVE && c.approvedSubmissionsCount > 0),
      ).length,
      budgetFull: mappedCards.filter((c) => c.freezeReason === FREEZE_REASON.BUDGET_FULL).length,
      expired: mappedCards.filter((c) => c.freezeReason === FREEZE_REASON.EXPIRED).length,
      finished: mappedCards.filter((c) => c.freezeReason === FREEZE_REASON.FINISHED).length,
    };

    const filteredByTab = mappedCards.filter((card) => {
      if (filter === SETTLEMENT_FILTER.BUDGET_FULL) {
        return card.freezeReason === FREEZE_REASON.BUDGET_FULL;
      }
      if (filter === SETTLEMENT_FILTER.EXPIRED) {
        return card.freezeReason === FREEZE_REASON.EXPIRED;
      }
      if (filter === SETTLEMENT_FILTER.FINISHED) {
        return card.freezeReason === FREEZE_REASON.FINISHED;
      }
      // Default: NEED_SETTLEMENT includes frozen campaigns (BUDGET_FULL or EXPIRED)
      // plus active campaigns that already have approved submissions awaiting audit
      return (
        card.freezeReason === FREEZE_REASON.BUDGET_FULL ||
        card.freezeReason === FREEZE_REASON.EXPIRED ||
        (card.campaignStatus === CampaignStatus.ACTIVE && card.approvedSubmissionsCount > 0)
      );
    });

    const searchNormalized = search ? search.trim().toLowerCase() : '';
    const filteredBySearch =
      searchNormalized.length > 0
        ? filteredByTab.filter(
            (card) =>
              card.title.toLowerCase().includes(searchNormalized) ||
              card.brand.companyName.toLowerCase().includes(searchNormalized),
          )
        : filteredByTab;

    const total = filteredBySearch.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const startIndex = (page - 1) * limit;
    const paginatedItems = filteredBySearch.slice(startIndex, startIndex + limit);

    const responsePayload: AdminSettlementCampaignsPaginatedDto = {
      items: paginatedItems,
      counts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    SendSuccess(res, responsePayload, ADMIN_MESSAGES.GET_SETTLEMENTS_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `GET /admin/settlements/campaigns/:id`:
 * Returns the 4-column settlement ledger summary and FIFO submission queue for a campaign.
 *
 * @param req - Express request with campaign ID parameter.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetAdminCampaignSettlementSummary(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, ADMIN_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.ADMIN) {
      SendError(res, ADMIN_MESSAGES.ADMIN_ONLY, 403);
      return;
    }

    const campaignId = req.params.id as string;
    const summary = await BuildCampaignSettlementSummaryById(campaignId);

    if (!summary) {
      SendError(res, ADMIN_MESSAGES.CAMPAIGN_NOT_FOUND, 404);
      return;
    }

    SendSuccess(res, summary, ADMIN_MESSAGES.GET_CAMPAIGN_SETTLEMENT_SUMMARY_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /admin/settlements/submissions/:id/disqualify`:
 * Disqualifies an APPROVED submission during settlement audit, zeroes its earnings,
 * and automatically reshuffles freed budget down the FIFO queue to remaining APPROVED submissions.
 *
 * @param req - Express request with submission ID param and optional reviewNote body.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function DisqualifySettlementSubmission(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, ADMIN_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.ADMIN) {
      SendError(res, ADMIN_MESSAGES.ADMIN_ONLY, 403);
      return;
    }

    const parsedBody = DisqualifySubmissionSchema.safeParse(req.body ?? {});

    if (!parsedBody.success) {
      const firstIssue = parsedBody.error.issues[0];
      const message = firstIssue ? firstIssue.message : ADMIN_MESSAGES.INVALID_PAYLOAD;
      SendError(res, message, 400);
      return;
    }

    const submissionId = req.params.id as string;

    const submissionLookupQuery = {
      where: {
        id: submissionId,
        status: Status.ACTIVE,
        campaign: { status: Status.ACTIVE },
      },
      select: {
        id: true,
        campaignId: true,
        submissionStatus: true,
        campaign: {
          select: {
            id: true,
            campaignStatus: true,
            budget: true,
            cpm: true,
            minViews: true,
            maxViews: true,
          },
        },
      },
    };

    const targetSubmission = await prisma.submission.findFirst(submissionLookupQuery);

    if (!targetSubmission) {
      SendError(res, ADMIN_MESSAGES.SUBMISSION_NOT_FOUND, 404);
      return;
    }

    if (targetSubmission.campaign.campaignStatus === CampaignStatus.FINISHED) {
      SendError(res, ADMIN_MESSAGES.CAMPAIGN_ALREADY_SETTLED, 400);
      return;
    }

    if (targetSubmission.submissionStatus !== SubmissionStatus.APPROVED) {
      SendError(res, ADMIN_MESSAGES.SUBMISSION_NOT_ELIGIBLE_FOR_DISQUALIFY, 400);
      return;
    }

    const disqualifyNote =
      parsedBody.data.reviewNote && parsedBody.data.reviewNote.trim().length > 0
        ? parsedBody.data.reviewNote.trim()
        : ADMIN_MESSAGES.DEFAULT_DISQUALIFY_REASON;

    await prisma.$transaction(async (tx) => {
      const rejectPayload = {
        where: { id: targetSubmission.id },
        data: {
          submissionStatus: SubmissionStatus.REJECTED,
          earnings: new Prisma.Decimal(0),
          reviewNote: disqualifyNote,
        },
      };
      await tx.submission.update(rejectPayload);

      const remainingApprovedQuery = {
        where: {
          campaignId: targetSubmission.campaignId,
          status: Status.ACTIVE,
          submissionStatus: SubmissionStatus.APPROVED,
        },
        orderBy: [
          { submittedAt: 'asc' as const },
          { createdAt: 'asc' as const },
        ],
        select: {
          id: true,
          verifiedViews: true,
          earnings: true,
        },
      };

      const remainingApproved = await tx.submission.findMany(remainingApprovedQuery);

      const budget = Number(targetSubmission.campaign.budget ?? 0);
      const cpm = Number(targetSubmission.campaign.cpm ?? 0);
      const minViews = targetSubmission.campaign.minViews ?? 0;
      const maxViews = targetSubmission.campaign.maxViews ?? 0;

      const fifoInputs: FifoSubmissionAllocationInput[] = remainingApproved.map((sub) => ({
        id: sub.id,
        verifiedViews: sub.verifiedViews,
        currentEarnings: Number(sub.earnings ?? 0),
      }));

      const reshuffled = ComputeCampaignFifoAllocations(
        budget,
        minViews,
        maxViews,
        cpm,
        fifoInputs,
      );

      for (const allocation of reshuffled.allocations) {
        const updateAllocationPayload = {
          where: { id: allocation.id },
          data: {
            earnings: new Prisma.Decimal(allocation.allocatedEarnings),
          },
        };
        await tx.submission.update(updateAllocationPayload);
      }
    });

    const updatedSummary = await BuildCampaignSettlementSummaryById(targetSubmission.campaignId);

    if (!updatedSummary) {
      SendError(res, ADMIN_MESSAGES.CAMPAIGN_NOT_FOUND, 404);
      return;
    }

    SendSuccess(res, updatedSummary, ADMIN_MESSAGES.DISQUALIFY_SUBMISSION_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `PATCH /admin/settlements/submissions/:id/views`:
 * Updates the verified views of an APPROVED submission during settlement audit
 * and recalculates FIFO reward allocations across the campaign.
 *
 * @param req - Express request with submission ID param and verifiedViews body.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function UpdateSettlementSubmissionViews(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, ADMIN_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.ADMIN) {
      SendError(res, ADMIN_MESSAGES.ADMIN_ONLY, 403);
      return;
    }

    const parsedBody = UpdateSubmissionViewsSchema.safeParse(req.body);

    if (!parsedBody.success) {
      const firstIssue = parsedBody.error.issues[0];
      const message = firstIssue ? firstIssue.message : ADMIN_MESSAGES.INVALID_PAYLOAD;
      SendError(res, message, 400);
      return;
    }

    const submissionId = req.params.id as string;

    const submissionLookupQuery = {
      where: {
        id: submissionId,
        status: Status.ACTIVE,
        campaign: { status: Status.ACTIVE },
      },
      select: {
        id: true,
        campaignId: true,
        submissionStatus: true,
        campaign: {
          select: {
            id: true,
            campaignStatus: true,
            budget: true,
            cpm: true,
            minViews: true,
            maxViews: true,
          },
        },
      },
    };

    const targetSubmission = await prisma.submission.findFirst(submissionLookupQuery);

    if (!targetSubmission) {
      SendError(res, ADMIN_MESSAGES.SUBMISSION_NOT_FOUND, 404);
      return;
    }

    if (targetSubmission.campaign.campaignStatus === CampaignStatus.FINISHED) {
      SendError(res, ADMIN_MESSAGES.CAMPAIGN_ALREADY_SETTLED, 400);
      return;
    }

    await prisma.$transaction(async (tx) => {
      const updateViewsPayload = {
        where: { id: targetSubmission.id },
        data: {
          verifiedViews: parsedBody.data.verifiedViews,
        },
      };
      await tx.submission.update(updateViewsPayload);

      const approvedSubmissionsQuery = {
        where: {
          campaignId: targetSubmission.campaignId,
          status: Status.ACTIVE,
          submissionStatus: SubmissionStatus.APPROVED,
        },
        orderBy: [
          { submittedAt: 'asc' as const },
          { createdAt: 'asc' as const },
        ],
        select: {
          id: true,
          verifiedViews: true,
          earnings: true,
        },
      };

      const approvedSubmissions = await tx.submission.findMany(approvedSubmissionsQuery);

      const budget = Number(targetSubmission.campaign.budget ?? 0);
      const cpm = Number(targetSubmission.campaign.cpm ?? 0);
      const minViews = targetSubmission.campaign.minViews ?? 0;
      const maxViews = targetSubmission.campaign.maxViews ?? 0;

      const fifoInputs: FifoSubmissionAllocationInput[] = approvedSubmissions.map((sub) => ({
        id: sub.id,
        verifiedViews: sub.verifiedViews,
        currentEarnings: Number(sub.earnings ?? 0),
      }));

      const recalculated = ComputeCampaignFifoAllocations(
        budget,
        minViews,
        maxViews,
        cpm,
        fifoInputs,
      );

      for (const allocation of recalculated.allocations) {
        const updateAllocationPayload = {
          where: { id: allocation.id },
          data: {
            earnings: new Prisma.Decimal(allocation.allocatedEarnings),
          },
        };
        await tx.submission.update(updateAllocationPayload);
      }
    });

    const updatedSummary = await BuildCampaignSettlementSummaryById(targetSubmission.campaignId);

    if (!updatedSummary) {
      SendError(res, ADMIN_MESSAGES.CAMPAIGN_NOT_FOUND, 404);
      return;
    }

    SendSuccess(res, updatedSummary, ADMIN_MESSAGES.UPDATE_VIEWS_RESHUFFLE_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /admin/settlements/campaigns/:id/recalculate`:
 * Recalculates and persists FIFO reward allocations across all APPROVED submissions of a campaign.
 *
 * @param req - Express request with campaign ID parameter.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function RecalculateCampaignSettlementFifo(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, ADMIN_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.ADMIN) {
      SendError(res, ADMIN_MESSAGES.ADMIN_ONLY, 403);
      return;
    }

    const campaignId = req.params.id as string;

    const campaignLookupQuery = {
      where: {
        id: campaignId,
        status: Status.ACTIVE,
        brand: { status: Status.ACTIVE },
      },
      select: {
        id: true,
        campaignStatus: true,
        budget: true,
        cpm: true,
        minViews: true,
        maxViews: true,
      },
    };

    const campaign = await prisma.campaign.findFirst(campaignLookupQuery);

    if (!campaign) {
      SendError(res, ADMIN_MESSAGES.CAMPAIGN_NOT_FOUND, 404);
      return;
    }

    if (campaign.campaignStatus === CampaignStatus.FINISHED) {
      SendError(res, ADMIN_MESSAGES.CAMPAIGN_ALREADY_SETTLED, 400);
      return;
    }

    await prisma.$transaction(async (tx) => {
      const approvedQuery = {
        where: {
          campaignId: campaign.id,
          status: Status.ACTIVE,
          submissionStatus: SubmissionStatus.APPROVED,
        },
        orderBy: [
          { submittedAt: 'asc' as const },
          { createdAt: 'asc' as const },
        ],
        select: {
          id: true,
          verifiedViews: true,
          earnings: true,
        },
      };

      const approvedSubmissions = await tx.submission.findMany(approvedQuery);

      const budget = Number(campaign.budget ?? 0);
      const cpm = Number(campaign.cpm ?? 0);
      const minViews = campaign.minViews ?? 0;
      const maxViews = campaign.maxViews ?? 0;

      const fifoInputs: FifoSubmissionAllocationInput[] = approvedSubmissions.map((sub) => ({
        id: sub.id,
        verifiedViews: sub.verifiedViews,
        currentEarnings: Number(sub.earnings ?? 0),
      }));

      const recalculated = ComputeCampaignFifoAllocations(
        budget,
        minViews,
        maxViews,
        cpm,
        fifoInputs,
      );

      for (const allocation of recalculated.allocations) {
        const updatePayload = {
          where: { id: allocation.id },
          data: {
            earnings: new Prisma.Decimal(allocation.allocatedEarnings),
          },
        };
        await tx.submission.update(updatePayload);
      }
    });

    const updatedSummary = await BuildCampaignSettlementSummaryById(campaign.id);

    if (!updatedSummary) {
      SendError(res, ADMIN_MESSAGES.CAMPAIGN_NOT_FOUND, 404);
      return;
    }

    SendSuccess(res, updatedSummary, ADMIN_MESSAGES.RECALCULATE_FIFO_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /admin/settlements/campaigns/:id/finalize`:
 * Atomically finalizes campaign settlement:
 * 1. Computes final FIFO allocations for all APPROVED submissions and marks them VERIFIED.
 * 2. Credits each Creator's wallet with their verified earnings and logs `CAMPAIGN_EARNING`.
 * 3. Refunds any unspent escrow budget back to the Brand's wallet and logs `CAMPAIGN_REFUND`.
 * 4. Transitions the campaign status to `FINISHED`.
 *
 * @param req - Express request with campaign ID parameter.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function FinalizeCampaignSettlement(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, ADMIN_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.ADMIN) {
      SendError(res, ADMIN_MESSAGES.ADMIN_ONLY, 403);
      return;
    }

    const campaignId = req.params.id as string;

    const campaignLookupQuery = {
      where: {
        id: campaignId,
        status: Status.ACTIVE,
        brand: { status: Status.ACTIVE },
      },
      select: {
        id: true,
        title: true,
        campaignStatus: true,
        budget: true,
        cpm: true,
        minViews: true,
        maxViews: true,
        brand: {
          select: {
            id: true,
            accountId: true,
            companyName: true,
          },
        },
      },
    };

    const campaign = await prisma.campaign.findFirst(campaignLookupQuery);

    if (!campaign) {
      SendError(res, ADMIN_MESSAGES.CAMPAIGN_NOT_FOUND, 404);
      return;
    }

    if (campaign.campaignStatus === CampaignStatus.FINISHED) {
      SendError(res, ADMIN_MESSAGES.CAMPAIGN_ALREADY_SETTLED, 400);
      return;
    }

    if (campaign.campaignStatus !== CampaignStatus.ACTIVE) {
      SendError(res, ADMIN_MESSAGES.CAMPAIGN_NOT_ACTIVE_FOR_SETTLEMENT, 400);
      return;
    }

    const campaignTitle = campaign.title ?? 'Kampanye Klipday';
    const budget = Number(campaign.budget ?? 0);
    const cpm = Number(campaign.cpm ?? 0);
    const minViews = campaign.minViews ?? 0;
    const maxViews = campaign.maxViews ?? 0;

    await prisma.$transaction(async (tx) => {
      const approvedQuery = {
        where: {
          campaignId: campaign.id,
          status: Status.ACTIVE,
          submissionStatus: SubmissionStatus.APPROVED,
        },
        orderBy: [
          { submittedAt: 'asc' as const },
          { createdAt: 'asc' as const },
        ],
        select: {
          id: true,
          creatorId: true,
          verifiedViews: true,
          earnings: true,
          creator: {
            select: {
              id: true,
              accountId: true,
              fullName: true,
            },
          },
        },
      };

      const approvedSubmissions = await tx.submission.findMany(approvedQuery);

      const fifoInputs: FifoSubmissionAllocationInput[] = approvedSubmissions.map((sub) => ({
        id: sub.id,
        verifiedViews: sub.verifiedViews,
        currentEarnings: Number(sub.earnings ?? 0),
      }));

      const finalFifo = ComputeCampaignFifoAllocations(
        budget,
        minViews,
        maxViews,
        cpm,
        fifoInputs,
      );

      const allocationById = new Map(
        finalFifo.allocations.map((alloc) => [alloc.id, alloc]),
      );

      let txSequence = 1;

      // 1. Mark each APPROVED submission as VERIFIED and distribute creator earnings
      for (const sub of approvedSubmissions) {
        const allocation = allocationById.get(sub.id);
        const finalReward = allocation ? allocation.allocatedEarnings : 0;

        const verifySubPayload = {
          where: { id: sub.id },
          data: {
            submissionStatus: SubmissionStatus.VERIFIED,
            earnings: new Prisma.Decimal(finalReward),
          },
        };
        await tx.submission.update(verifySubPayload);

        if (finalReward > 0) {
          const creatorWallet = await ProvisionAccountWallet(
            sub.creator.accountId,
            Role.CREATOR,
            tx,
          );

          if (creatorWallet) {
            const balanceBefore = Number(creatorWallet.balance);
            const balanceAfter = balanceBefore + finalReward;

            const updateCreatorWalletPayload = {
              where: { id: creatorWallet.id },
              data: {
                balance: new Prisma.Decimal(balanceAfter),
              },
            };
            await tx.wallet.update(updateCreatorWalletPayload);

            const earningRefCode = GenerateSettlementTransactionRefCode(txSequence);
            txSequence += 1;

            const createEarningTxPayload = {
              data: {
                referenceCode: earningRefCode,
                walletId: creatorWallet.id,
                type: WalletTransactionType.CAMPAIGN_EARNING,
                amount: new Prisma.Decimal(finalReward),
                balanceBefore: new Prisma.Decimal(balanceBefore),
                balanceAfter: new Prisma.Decimal(balanceAfter),
                description: `Reward settlement video kampanye: ${campaignTitle}`,
                campaignId: campaign.id,
                submissionId: sub.id,
                transactionDate: new Date(),
                status: Status.ACTIVE,
              },
            };
            await tx.walletTransaction.create(createEarningTxPayload);
          }
        }
      }

      // 2. Close out any remaining unapproved submissions (JOINED, PENDING_REVIEW, REVISION_REQUESTED)
      const closeUnapprovedPayload = {
        where: {
          campaignId: campaign.id,
          status: Status.ACTIVE,
          submissionStatus: {
            in: [
              SubmissionStatus.JOINED,
              SubmissionStatus.PENDING_REVIEW,
              SubmissionStatus.REVISION_REQUESTED,
            ],
          },
        },
        data: {
          submissionStatus: SubmissionStatus.REJECTED,
          earnings: new Prisma.Decimal(0),
          reviewNote: ADMIN_MESSAGES.LEFTOVER_SUBMISSION_SETTLEMENT_NOTE,
        },
      };
      await tx.submission.updateMany(closeUnapprovedPayload);

      // 3. Refund any unspent budget back to the Brand's wallet
      const brandRefundAmount = finalFifo.remainingRefund;
      if (brandRefundAmount > 0) {
        const brandWallet = await ProvisionAccountWallet(
          campaign.brand.accountId,
          Role.BRAND,
          tx,
        );

        if (brandWallet) {
          const brandBalanceBefore = Number(brandWallet.balance);
          const brandBalanceAfter = brandBalanceBefore + brandRefundAmount;

          const updateBrandWalletPayload = {
            where: { id: brandWallet.id },
            data: {
              balance: new Prisma.Decimal(brandBalanceAfter),
            },
          };
          await tx.wallet.update(updateBrandWalletPayload);

          const refundRefCode = GenerateSettlementTransactionRefCode(txSequence);
          txSequence += 1;

          const createRefundTxPayload = {
            data: {
              referenceCode: refundRefCode,
              walletId: brandWallet.id,
              type: WalletTransactionType.CAMPAIGN_REFUND,
              amount: new Prisma.Decimal(brandRefundAmount),
              balanceBefore: new Prisma.Decimal(brandBalanceBefore),
              balanceAfter: new Prisma.Decimal(brandBalanceAfter),
              description: `Pengembalian sisa budget kampanye: ${campaignTitle}`,
              campaignId: campaign.id,
              transactionDate: new Date(),
              status: Status.ACTIVE,
            },
          };
          await tx.walletTransaction.create(createRefundTxPayload);
        }
      }

      // 4. Mark the campaign as FINISHED
      const finishCampaignPayload = {
        where: { id: campaign.id },
        data: {
          campaignStatus: CampaignStatus.FINISHED,
        },
      };
      await tx.campaign.update(finishCampaignPayload);
    });

    const settledSummary = await BuildCampaignSettlementSummaryById(campaign.id);

    if (!settledSummary) {
      SendError(res, ADMIN_MESSAGES.CAMPAIGN_NOT_FOUND, 404);
      return;
    }

    SendSuccess(res, settledSummary, ADMIN_MESSAGES.FINALIZE_SETTLEMENT_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Fetches a paginated list of campaigns for the admin moderation queue (`GET /admin/campaigns`).
 * Supports tab status filtering ('IN_REVIEW', 'REVISION', 'ACTIVE', 'REJECTED', 'ALL'),
 * search by campaign title or brand company name, and returns live tab counts.
 *
 * @param req - Express request with admin account and query params.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetAdminModerationCampaigns(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, ADMIN_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.ADMIN) {
      SendError(res, ADMIN_MESSAGES.ADMIN_ONLY, 403);
      return;
    }

    const parseResult = AdminModerationQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      SendError(res, firstIssue?.message || ADMIN_MESSAGES.INVALID_PAYLOAD, 400);
      return;
    }

    const { filter, search, page, limit } = parseResult.data;

    const whereClause: Prisma.CampaignWhereInput = {
      status: Status.ACTIVE,
      brand: { status: Status.ACTIVE },
    };

    if (filter === MODERATION_FILTER.IN_REVIEW) {
      whereClause.campaignStatus = CampaignStatus.IN_REVIEW;
    } else if (filter === MODERATION_FILTER.REVISION) {
      whereClause.campaignStatus = CampaignStatus.REVISION;
    } else if (filter === MODERATION_FILTER.ACTIVE) {
      whereClause.campaignStatus = CampaignStatus.ACTIVE;
    } else if (filter === MODERATION_FILTER.REJECTED) {
      whereClause.campaignStatus = CampaignStatus.REJECTED;
    } else if (filter === MODERATION_FILTER.ALL) {
      whereClause.campaignStatus = {
        in: [
          CampaignStatus.IN_REVIEW,
          CampaignStatus.REVISION,
          CampaignStatus.ACTIVE,
          CampaignStatus.REJECTED,
        ],
      };
    }

    if (search && search.trim().length > 0) {
      const queryTrimmed = search.trim();
      whereClause.AND = [
        {
          OR: [
            { title: { contains: queryTrimmed, mode: 'insensitive' } },
            { brand: { companyName: { contains: queryTrimmed, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    const skip = (page - 1) * limit;

    const [campaigns, totalFiltered, countInReview, countRevision, countActive, countRejected, countAll] =
      await Promise.all([
        prisma.campaign.findMany({
          where: whereClause,
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            title: true,
            campaignCategory: true,
            campaignType: true,
            campaignStatus: true,
            thumbnailUrl: true,
            cpm: true,
            minViews: true,
            maxViews: true,
            budget: true,
            startDate: true,
            endDate: true,
            createdAt: true,
            updatedAt: true,
            adminNote: true,
            brand: {
              select: {
                id: true,
                companyName: true,
                logoUrl: true,
                accountId: true,
              },
            },
            brief: {
              where: { status: Status.ACTIVE },
              select: {
                id: true,
                purpose: true,
                keyMessage: true,
                narration: true,
                guidelines: true,
                callToAction: true,
                requiredCaption: true,
              },
            },
            _count: {
              select: {
                materials: { where: { status: Status.ACTIVE } },
              },
            },
            payments: {
              where: { status: Status.ACTIVE },
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                amount: true,
                uniqueCode: true,
                totalPayable: true,
                destinationBank: true,
                destinationAccount: true,
                senderProviderName: true,
                senderAccountName: true,
                transferProofUrl: true,
                paymentStatus: true,
                verifiedAt: true,
              },
            },
          },
        }),
        prisma.campaign.count({ where: whereClause }),
        prisma.campaign.count({
          where: {
            status: Status.ACTIVE,
            campaignStatus: CampaignStatus.IN_REVIEW,
            brand: { status: Status.ACTIVE },
          },
        }),
        prisma.campaign.count({
          where: {
            status: Status.ACTIVE,
            campaignStatus: CampaignStatus.REVISION,
            brand: { status: Status.ACTIVE },
          },
        }),
        prisma.campaign.count({
          where: {
            status: Status.ACTIVE,
            campaignStatus: CampaignStatus.ACTIVE,
            brand: { status: Status.ACTIVE },
          },
        }),
        prisma.campaign.count({
          where: {
            status: Status.ACTIVE,
            campaignStatus: CampaignStatus.REJECTED,
            brand: { status: Status.ACTIVE },
          },
        }),
        prisma.campaign.count({
          where: {
            status: Status.ACTIVE,
            campaignStatus: {
              in: [
                CampaignStatus.IN_REVIEW,
                CampaignStatus.REVISION,
                CampaignStatus.ACTIVE,
                CampaignStatus.REJECTED,
              ],
            },
            brand: { status: Status.ACTIVE },
          },
        }),
      ]);

    const items: AdminModerationCampaignCardDto[] = campaigns.map((campaign) => {
      const payment = campaign.payments?.[0];
      const isWallet =
        payment?.destinationBank === 'SALDO_KLIPDAY' ||
        (payment?.uniqueCode === 0 && !payment?.senderProviderName && !payment?.transferProofUrl);

      const isBriefComplete = Boolean(
        campaign.brief &&
          (campaign.brief.guidelines ||
            campaign.brief.narration ||
            campaign.brief.requiredCaption ||
            campaign.brief.callToAction),
      );

      const item: AdminModerationCampaignCardDto = {
        id: campaign.id,
        title: campaign.title ?? 'Kampanye Tanpa Judul',
        campaignCategory: campaign.campaignCategory,
        campaignType: campaign.campaignType,
        campaignStatus: campaign.campaignStatus,
        thumbnailUrl: campaign.thumbnailUrl,
        cpm: campaign.cpm ? Number(campaign.cpm) : 0,
        minViews: campaign.minViews ?? 0,
        maxViews: campaign.maxViews ?? 0,
        budget: campaign.budget ? Number(campaign.budget) : 0,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
        adminNote: campaign.adminNote,
        materialsCount: campaign._count.materials,
        isBriefComplete,
        brand: {
          id: campaign.brand.id,
          companyName: campaign.brand.companyName,
          logoUrl: campaign.brand.logoUrl,
          accountId: campaign.brand.accountId,
        },
        payment: payment
          ? {
              id: payment.id,
              amount: Number(payment.amount),
              uniqueCode: payment.uniqueCode,
              totalPayable: Number(payment.totalPayable),
              destinationBank: payment.destinationBank,
              destinationAccount: payment.destinationAccount,
              senderProviderName: payment.senderProviderName,
              senderAccountName: payment.senderAccountName,
              transferProofUrl: payment.transferProofUrl,
              paymentStatus: payment.paymentStatus,
              verifiedAt: payment.verifiedAt,
              isWalletPayment: isWallet,
            }
          : null,
      };
      return item;
    });

    const totalPages = Math.ceil(totalFiltered / limit) || 1;

    const result: AdminModerationCampaignsPaginatedDto = {
      items,
      counts: {
        inReview: countInReview,
        revision: countRevision,
        active: countActive,
        rejected: countRejected,
        all: countAll,
      },
      pagination: {
        page,
        limit,
        total: totalFiltered,
        totalPages,
      },
    };

    SendSuccess(res, result, ADMIN_MESSAGES.GET_MODERATION_CAMPAIGNS_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles administrative campaign moderation decisions (`POST /admin/campaigns/:id/moderate`).
 * Supports:
 * - 'APPROVE': Approves manual transfer if pending and activates campaign for creators.
 * - 'REVISION': Locks manual transfer as approved and requests changes from brand with mandatory notes.
 * - 'REJECT_PAYMENT': Rejects transfer proof and reverts campaign to AWAITING_PAYMENT.
 * - 'REJECT_CAMPAIGN': Permanently rejects campaign with automatic wallet balance refund.
 *
 * @param req - Express request with admin account and moderation payload.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function ModerateCampaign(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, ADMIN_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.ADMIN) {
      SendError(res, ADMIN_MESSAGES.ADMIN_ONLY, 403);
      return;
    }

    const campaignId = req.params.id as string;

    const parseResult = AdminModerateCampaignSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      SendError(res, firstIssue?.message || ADMIN_MESSAGES.INVALID_PAYLOAD, 400);
      return;
    }

    const input = parseResult.data;

    const admin = await prisma.admin.findFirst({
      where: { accountId: account.sub, status: Status.ACTIVE },
      select: { id: true },
    });

    if (!admin) {
      SendError(res, ADMIN_MESSAGES.ADMIN_ACCOUNT_NOT_FOUND, 403);
      return;
    }

    const findCampaignQuery = {
      where: {
        id: campaignId,
        status: Status.ACTIVE,
        brand: { status: Status.ACTIVE },
      },
      select: {
        id: true,
        title: true,
        budget: true,
        campaignStatus: true,
        brandId: true,
        brand: {
          select: {
            id: true,
            accountId: true,
            companyName: true,
          },
        },
        payments: {
          where: { status: Status.ACTIVE },
          orderBy: { createdAt: 'desc' as const },
          take: 1,
        },
      },
    };

    const campaign = await prisma.campaign.findFirst(findCampaignQuery);

    if (!campaign) {
      SendError(res, ADMIN_MESSAGES.CAMPAIGN_NOT_FOUND, 404);
      return;
    }

    if (campaign.campaignStatus !== CampaignStatus.IN_REVIEW) {
      SendError(res, ADMIN_MESSAGES.CAMPAIGN_NOT_IN_REVIEW, 400);
      return;
    }

    const latestPayment = campaign.payments?.[0];

    if (input.action === MODERATION_ACTION.APPROVE) {
      await prisma.$transaction(async (tx) => {
        if (latestPayment && latestPayment.paymentStatus === PaymentStatus.SUBMITTED) {
          const brandWallet = await ProvisionAccountWallet(campaign.brand.accountId, Role.BRAND, tx);
          const totalPayable = Number(latestPayment.totalPayable);

          const paymentUpdatePayload = {
            where: { id: latestPayment.id },
            data: {
              paymentStatus: PaymentStatus.APPROVED,
              verifiedByAdminId: admin.id,
              verifiedAt: new Date(),
              rejectionReason: null,
            },
          };
          await tx.campaignPayment.update(paymentUpdatePayload);

          if (brandWallet) {
            const refCode = GenerateSettlementTransactionRefCode();
            const walletTransactionPayload = {
              data: {
                referenceCode: refCode,
                walletId: brandWallet.id,
                type: WalletTransactionType.CAMPAIGN_PAYMENT,
                amount: new Prisma.Decimal(totalPayable),
                balanceBefore: brandWallet.balance,
                balanceAfter: brandWallet.balance,
                description: `Pembayaran transfer manual kampanye "${campaign.title ?? 'Klipday'}" diverifikasi admin`,
                campaignId: campaign.id,
                transactionDate: new Date(),
                status: Status.ACTIVE,
              },
            };
            await tx.walletTransaction.create(walletTransactionPayload);
          }
        }

        const campaignUpdatePayload = {
          where: { id: campaign.id },
          data: {
            campaignStatus: CampaignStatus.ACTIVE,
            adminNote: null,
          },
        };
        await tx.campaign.update(campaignUpdatePayload);
      });
    } else if (input.action === MODERATION_ACTION.REVISION) {
      await prisma.$transaction(async (tx) => {
        // If payment was SUBMITTED, lock the payment as APPROVED so brand does not have to pay again
        if (latestPayment && latestPayment.paymentStatus === PaymentStatus.SUBMITTED) {
          const brandWallet = await ProvisionAccountWallet(campaign.brand.accountId, Role.BRAND, tx);
          const totalPayable = Number(latestPayment.totalPayable);

          const paymentUpdatePayload = {
            where: { id: latestPayment.id },
            data: {
              paymentStatus: PaymentStatus.APPROVED,
              verifiedByAdminId: admin.id,
              verifiedAt: new Date(),
              rejectionReason: null,
            },
          };
          await tx.campaignPayment.update(paymentUpdatePayload);

          if (brandWallet) {
            const refCode = GenerateSettlementTransactionRefCode();
            const walletTransactionPayload = {
              data: {
                referenceCode: refCode,
                walletId: brandWallet.id,
                type: WalletTransactionType.CAMPAIGN_PAYMENT,
                amount: new Prisma.Decimal(totalPayable),
                balanceBefore: brandWallet.balance,
                balanceAfter: brandWallet.balance,
                description: `Pembayaran transfer manual kampanye "${campaign.title ?? 'Klipday'}" diverifikasi admin (status revisi)`,
                campaignId: campaign.id,
                transactionDate: new Date(),
                status: Status.ACTIVE,
              },
            };
            await tx.walletTransaction.create(walletTransactionPayload);
          }
        }

        const campaignUpdatePayload = {
          where: { id: campaign.id },
          data: {
            campaignStatus: CampaignStatus.REVISION,
            adminNote: input.adminNote ?? null,
          },
        };
        await tx.campaign.update(campaignUpdatePayload);
      });
    } else if (input.action === MODERATION_ACTION.REJECT_PAYMENT) {
      if (!latestPayment || latestPayment.paymentStatus !== PaymentStatus.SUBMITTED) {
        SendError(res, ADMIN_MESSAGES.PAYMENT_NOT_SUBMITTED_FOR_REJECT, 400);
        return;
      }

      await prisma.$transaction(async (tx) => {
        const paymentUpdatePayload = {
          where: { id: latestPayment.id },
          data: {
            paymentStatus: PaymentStatus.REJECTED,
            rejectionReason: input.adminNote ?? null,
            verifiedByAdminId: admin.id,
            verifiedAt: new Date(),
          },
        };
        await tx.campaignPayment.update(paymentUpdatePayload);

        const campaignUpdatePayload = {
          where: { id: campaign.id },
          data: {
            campaignStatus: CampaignStatus.AWAITING_PAYMENT,
            adminNote: input.adminNote ?? null,
          },
        };
        await tx.campaign.update(campaignUpdatePayload);
      });
    } else if (input.action === MODERATION_ACTION.REJECT_CAMPAIGN) {
      await prisma.$transaction(async (tx) => {
        const budgetAmount = Number(campaign.budget ?? 0);
        const brandWallet = await ProvisionAccountWallet(campaign.brand.accountId, Role.BRAND, tx);

        if (latestPayment?.paymentStatus === PaymentStatus.APPROVED) {
          // Already paid via Saldo Dompet or previously approved manual transfer -> ALWAYS REFUND TO WALLET BALANCE
          const refundAmount = Number(latestPayment.totalPayable ?? budgetAmount);
          if (brandWallet && refundAmount > 0) {
            const balanceBefore = Number(brandWallet.balance);
            const balanceAfter = balanceBefore + refundAmount;

            const walletUpdatePayload = {
              where: { id: brandWallet.id },
              data: { balance: new Prisma.Decimal(balanceAfter) },
            };
            await tx.wallet.update(walletUpdatePayload);

            const refundRefCode = GenerateSettlementTransactionRefCode();
            const walletTransactionPayload = {
              data: {
                referenceCode: refundRefCode,
                walletId: brandWallet.id,
                type: WalletTransactionType.CAMPAIGN_REFUND,
                amount: new Prisma.Decimal(refundAmount),
                balanceBefore: new Prisma.Decimal(balanceBefore),
                balanceAfter: new Prisma.Decimal(balanceAfter),
                description: `Pengembalian dana (refund) kampanye "${campaign.title ?? 'Klipday'}" ditolak permanen`,
                campaignId: campaign.id,
                transactionDate: new Date(),
                status: Status.ACTIVE,
              },
            };
            await tx.walletTransaction.create(walletTransactionPayload);
          }
        } else if (latestPayment?.paymentStatus === PaymentStatus.SUBMITTED) {
          // Direct manual bank transfer receipt is in review
          if (input.refundConfirmedManualPayment !== false) {
            const payableAmount = Number(latestPayment.totalPayable);

            // Admin confirmed the money actually arrived in Klipday's bank account -> Record payment and immediately refund to brand's wallet
            const paymentUpdatePayload = {
              where: { id: latestPayment.id },
              data: {
                paymentStatus: PaymentStatus.APPROVED,
                verifiedByAdminId: admin.id,
                verifiedAt: new Date(),
                rejectionReason: null,
              },
            };
            await tx.campaignPayment.update(paymentUpdatePayload);

            if (brandWallet) {
              const paymentRefCode = GenerateSettlementTransactionRefCode();
              const paymentTransactionPayload = {
                data: {
                  referenceCode: paymentRefCode,
                  walletId: brandWallet.id,
                  type: WalletTransactionType.CAMPAIGN_PAYMENT,
                  amount: new Prisma.Decimal(payableAmount),
                  balanceBefore: brandWallet.balance,
                  balanceAfter: brandWallet.balance,
                  description: `Penerimaan transfer manual kampanye "${campaign.title ?? 'Klipday'}" sebelum penolakan`,
                  campaignId: campaign.id,
                  transactionDate: new Date(),
                  status: Status.ACTIVE,
                },
              };
              await tx.walletTransaction.create(paymentTransactionPayload);

              if (payableAmount > 0) {
                const balanceBefore = Number(brandWallet.balance);
                const balanceAfter = balanceBefore + payableAmount;

                const walletUpdatePayload = {
                  where: { id: brandWallet.id },
                  data: { balance: new Prisma.Decimal(balanceAfter) },
                };
                await tx.wallet.update(walletUpdatePayload);

                const refundRefCode = GenerateSettlementTransactionRefCode(1);
                const refundTransactionPayload = {
                  data: {
                    referenceCode: refundRefCode,
                    walletId: brandWallet.id,
                    type: WalletTransactionType.CAMPAIGN_REFUND,
                    amount: new Prisma.Decimal(payableAmount),
                    balanceBefore: new Prisma.Decimal(balanceBefore),
                    balanceAfter: new Prisma.Decimal(balanceAfter),
                    description: `Pengembalian dana (refund) kampanye "${campaign.title ?? 'Klipday'}" ditolak permanen`,
                    campaignId: campaign.id,
                    transactionDate: new Date(),
                    status: Status.ACTIVE,
                  },
                };
                await tx.walletTransaction.create(refundTransactionPayload);
              }
            }
          } else {
            // Money never arrived / fake proof -> Mark payment REJECTED, no wallet refund
            const paymentUpdatePayload = {
              where: { id: latestPayment.id },
              data: {
                paymentStatus: PaymentStatus.REJECTED,
                rejectionReason: input.adminNote ?? null,
                verifiedByAdminId: admin.id,
                verifiedAt: new Date(),
              },
            };
            await tx.campaignPayment.update(paymentUpdatePayload);
          }
        }

        const campaignUpdatePayload = {
          where: { id: campaign.id },
          data: {
            campaignStatus: CampaignStatus.REJECTED,
            adminNote: input.adminNote ?? null,
          },
        };
        await tx.campaign.update(campaignUpdatePayload);
      });
    }

    const updatedCampaignQuery = {
      where: { id: campaign.id, status: Status.ACTIVE },
      select: CAMPAIGN_DETAIL_SELECT,
    };
    const updatedCampaign = await prisma.campaign.findFirst(updatedCampaignQuery);

    SendSuccess(res, updatedCampaign, ADMIN_MESSAGES.MODERATE_CAMPAIGN_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `GET /api/admin/top-ups`: queries paginated manual top-up requests across brands,
 * with search and tab counts for verification and audit.
 *
 * @param req - Express request with filter, search, page, limit query parameters.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetAdminTopUpRequests(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, ADMIN_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.ADMIN) {
      SendError(res, ADMIN_MESSAGES.ADMIN_ONLY, 403);
      return;
    }

    const parseResult = AdminTopUpQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      SendError(res, firstIssue?.message || ADMIN_MESSAGES.INVALID_PAYLOAD, 400);
      return;
    }

    const { filter, search, page, limit } = parseResult.data;

    const baseWhereClause: Prisma.TopUpRequestWhereInput = {
      recordStatus: Status.ACTIVE,
      wallet: {
        status: Status.ACTIVE,
        account: {
          status: Status.ACTIVE,
          brand: { status: Status.ACTIVE },
        },
      },
    };

    const whereClause: Prisma.TopUpRequestWhereInput = {
      ...baseWhereClause,
    };

    if (filter === TOPUP_FILTER.SUBMITTED) {
      whereClause.status = PaymentStatus.SUBMITTED;
    } else if (filter === TOPUP_FILTER.PENDING) {
      whereClause.status = PaymentStatus.PENDING;
    } else if (filter === TOPUP_FILTER.APPROVED) {
      whereClause.status = PaymentStatus.APPROVED;
    } else if (filter === TOPUP_FILTER.REJECTED) {
      whereClause.status = PaymentStatus.REJECTED;
    } else if (filter === TOPUP_FILTER.ALL) {
      whereClause.status = {
        in: [
          PaymentStatus.PENDING,
          PaymentStatus.SUBMITTED,
          PaymentStatus.APPROVED,
          PaymentStatus.REJECTED,
        ],
      };
    }

    if (search && search.trim().length > 0) {
      const queryTrimmed = search.trim();
      whereClause.AND = [
        {
          OR: [
            { referenceCode: { contains: queryTrimmed, mode: 'insensitive' } },
            { senderAccountName: { contains: queryTrimmed, mode: 'insensitive' } },
            {
              wallet: {
                account: {
                  brand: {
                    companyName: { contains: queryTrimmed, mode: 'insensitive' },
                  },
                },
              },
            },
            {
              wallet: {
                account: {
                  email: { contains: queryTrimmed, mode: 'insensitive' },
                },
              },
            },
          ],
        },
      ];
    }

    const skip = (page - 1) * limit;

    const [
      topUps,
      totalFiltered,
      countSubmitted,
      countPending,
      countApproved,
      countRejected,
      countAll,
    ] = await Promise.all([
      prisma.topUpRequest.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: ADMIN_TOPUP_SELECT,
      }),
      prisma.topUpRequest.count({ where: whereClause }),
      prisma.topUpRequest.count({
        where: { ...baseWhereClause, status: PaymentStatus.SUBMITTED },
      }),
      prisma.topUpRequest.count({
        where: { ...baseWhereClause, status: PaymentStatus.PENDING },
      }),
      prisma.topUpRequest.count({
        where: { ...baseWhereClause, status: PaymentStatus.APPROVED },
      }),
      prisma.topUpRequest.count({
        where: { ...baseWhereClause, status: PaymentStatus.REJECTED },
      }),
      prisma.topUpRequest.count({
        where: {
          ...baseWhereClause,
          status: {
            in: [
              PaymentStatus.PENDING,
              PaymentStatus.SUBMITTED,
              PaymentStatus.APPROVED,
              PaymentStatus.REJECTED,
            ],
          },
        },
      }),
    ]);

    const items: AdminTopUpItemDto[] = topUps.map(MapAdminTopUpToDto);

    const totalPages = Math.ceil(totalFiltered / limit) || 1;

    const result: AdminTopUpsPaginatedDto = {
      items,
      counts: {
        submitted: countSubmitted,
        pending: countPending,
        approved: countApproved,
        rejected: countRejected,
        all: countAll,
      },
      pagination: {
        page,
        limit,
        total: totalFiltered,
        totalPages,
      },
    };

    SendSuccess(res, result, ADMIN_MESSAGES.GET_TOP_UPS_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /api/admin/top-ups/:id/review`: approves or rejects a submitted brand top-up request.
 * On APPROVE, atomic transaction credits `totalPayable` to brand wallet balance and creates a BRAND_DEPOSIT transaction.
 * On REJECT, sets status to REJECTED and stores the admin rejection reason.
 *
 * @param req - Express request with top-up id parameter and review decision payload.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function ReviewBrandTopUpRequest(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, ADMIN_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.ADMIN) {
      SendError(res, ADMIN_MESSAGES.ADMIN_ONLY, 403);
      return;
    }

    const admin = await prisma.admin.findFirst({
      where: { accountId: account.sub, status: Status.ACTIVE },
      select: { id: true },
    });

    if (!admin) {
      SendError(res, ADMIN_MESSAGES.ADMIN_ACCOUNT_NOT_FOUND, 403);
      return;
    }

    const topUpId = req.params.id as string;

    const parseResult = ReviewBrandTopUpSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      SendError(res, firstIssue?.message || ADMIN_MESSAGES.INVALID_PAYLOAD, 400);
      return;
    }

    const input = parseResult.data;

    const findTopUpQuery = {
      where: {
        id: topUpId,
        recordStatus: Status.ACTIVE,
        wallet: { status: Status.ACTIVE },
      },
      include: {
        wallet: true,
      },
    };

    const topUp = await prisma.topUpRequest.findFirst(findTopUpQuery);

    if (!topUp) {
      SendError(res, ADMIN_MESSAGES.TOP_UP_NOT_FOUND, 404);
      return;
    }

    if (topUp.status !== PaymentStatus.SUBMITTED) {
      SendError(res, ADMIN_MESSAGES.TOP_UP_NOT_SUBMITTED, 400);
      return;
    }

    const verifiedDate = new Date();

    if (input.decision === TOPUP_REVIEW_ACTION.APPROVE) {
      await prisma.$transaction(async (tx) => {
        const topUpUpdateResult = await tx.topUpRequest.updateMany({
          where: {
            id: topUp.id,
            status: PaymentStatus.SUBMITTED,
            recordStatus: Status.ACTIVE,
          },
          data: {
            status: PaymentStatus.APPROVED,
            rejectionReason: null,
            verifiedByAdminId: admin.id,
            verifiedAt: verifiedDate,
          },
        });

        if (topUpUpdateResult.count === 0) {
          throw new Error('TOP_UP_NOT_SUBMITTED');
        }

        const currentWallet = await tx.wallet.findUniqueOrThrow({
          where: { id: topUp.walletId },
        });

        const balanceBefore = Number(currentWallet.balance);
        const creditedAmount = Number(topUp.totalPayable);
        const balanceAfter = balanceBefore + creditedAmount;

        const walletUpdatePayload = {
          where: { id: topUp.walletId },
          data: {
            balance: new Prisma.Decimal(balanceAfter),
          },
        };
        await tx.wallet.update(walletUpdatePayload);

        const transactionReference = GenerateWalletTransactionReferenceCode();

        const walletTransactionPayload = {
          data: {
            referenceCode: transactionReference,
            walletId: topUp.walletId,
            type: WalletTransactionType.BRAND_DEPOSIT,
            amount: new Prisma.Decimal(creditedAmount),
            balanceBefore: new Prisma.Decimal(balanceBefore),
            balanceAfter: new Prisma.Decimal(balanceAfter),
            description: `Top Up Saldo Dompet (${topUp.referenceCode})`,
            transactionDate: verifiedDate,
            status: Status.ACTIVE,
          },
        };
        await tx.walletTransaction.create(walletTransactionPayload);
      });
    } else {
      const topUpRejectResult = await prisma.topUpRequest.updateMany({
        where: {
          id: topUp.id,
          status: PaymentStatus.SUBMITTED,
          recordStatus: Status.ACTIVE,
        },
        data: {
          status: PaymentStatus.REJECTED,
          rejectionReason: input.rejectionReason ?? null,
          verifiedByAdminId: admin.id,
          verifiedAt: verifiedDate,
        },
      });

      if (topUpRejectResult.count === 0) {
        SendError(res, ADMIN_MESSAGES.TOP_UP_NOT_SUBMITTED, 400);
        return;
      }
    }

    const updatedTopUpQuery = {
      where: { id: topUp.id, recordStatus: Status.ACTIVE },
      select: ADMIN_TOPUP_SELECT,
    };
    const updatedTopUp = await prisma.topUpRequest.findFirst(updatedTopUpQuery);

    if (!updatedTopUp) {
      SendError(res, ADMIN_MESSAGES.TOP_UP_NOT_FOUND, 404);
      return;
    }

    const result = MapAdminTopUpToDto(updatedTopUp);

    SendSuccess(res, result, ADMIN_MESSAGES.REVIEW_TOP_UP_SUCCESS);
  } catch (err) {
    if (err instanceof Error && err.message === 'TOP_UP_NOT_SUBMITTED') {
      SendError(res, ADMIN_MESSAGES.TOP_UP_NOT_SUBMITTED, 400);
      return;
    }
    next(err);
  }
}

