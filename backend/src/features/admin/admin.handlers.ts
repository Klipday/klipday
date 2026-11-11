import type { NextFunction, Request, Response } from 'express';
import { Prisma, type PrismaClient } from '../../generated/prisma/client.js';
import {
  CampaignStatus,
  NotificationType,
  PaymentStatus,
  PayoutStatus,
  Platform,
  Role,
  Status,
  SubmissionStatus,
  VerificationStatus,
  WalletTransactionType,
} from '../../generated/prisma/enums.js';
import { SendError, SendSuccess } from '../../utils/api-response.js';
import { prisma } from '../../utils/prisma.js';
import {
  DispatchNotification,
  NotifyCampaignApproved,
  NotifyCampaignRejected,
  NotifyCampaignRevision,
  NotifyKycApproved,
  NotifyKycRejected,
  NotifySettlementFinalizedForBrand,
  NotifySettlementFinalizedForCreator,
  NotifyTopUpApproved,
  NotifyTopUpRejected,
  NotifyWithdrawalApproved,
  NotifyWithdrawalRejected,
} from '../../services/notification/notification.dispatcher.js';
import { CAMPAIGN_DETAIL_SELECT } from '../campaign/campaign.constants.js';
import {
  GenerateWalletTransactionReferenceCode,
  ProvisionAccountWallet,
} from '../wallet/wallet.helper.js';
import {
  ADMIN_KYC_SELECT,
  ADMIN_MESSAGES,
  ADMIN_TOPUP_SELECT,
  ADMIN_WITHDRAWAL_SELECT,
  DASHBOARD_PREVIEW_LIMIT,
  DEFAULT_FEATURED_ORDER,
  FIFO_SUBMISSION_ORDER_BY,
  FREEZE_REASON,
  KYC_FILTER,
  KYC_REVIEW_ACTION,
  KYC_ROLE_FILTER,
  MODERATION_ACTION,
  MODERATION_FILTER,
  SETTLEMENT_FILTER,
  TOPUP_FILTER,
  TOPUP_REVIEW_ACTION,
  WITHDRAWAL_FILTER,
  WITHDRAWAL_REVIEW_ACTION,
  WITHDRAWAL_ROLE_FILTER,
} from './admin.constants.js';
import {
  BuildCampaignSettlementSummaryById,
  BuildKycPhoneSearchVariants,
  CalculateTargetReward,
  CheckHolderNameMismatch,
  ComputeCampaignFifoAllocations,
  DetermineCampaignFreezeReason,
  GenerateSettlementTransactionRefCode,
  MapAdminKycToDto,
  MapAdminTopUpToDto,
  MapAdminWithdrawalToDto,
} from './admin.helper.js';
import {
  AdminKycQuerySchema,
  AdminModerateCampaignSchema,
  AdminModerationQuerySchema,
  AdminSettlementQuerySchema,
  AdminTopUpQuerySchema,
  AdminWithdrawalQuerySchema,
  DisqualifySubmissionSchema,
  ReviewBrandTopUpSchema,
  ReviewKycSchema,
  ReviewWithdrawalSchema,
  ToggleFeaturedCampaignSchema,
  UpdateSubmissionViewsSchema,
} from './admin.schemas.js';
import type {
  AdminCampaignSettlementSummaryDto,
  AdminFifoSubmissionItemDto,
  AdminKycItemDto,
  AdminKycPaginatedDto,
  AdminModerationCampaignCardDto,
  AdminModerationCampaignsPaginatedDto,
  AdminSettlementCampaignCardDto,
  AdminSettlementCampaignsPaginatedDto,
  AdminSettlementCountsDto,
  AdminTopUpItemDto,
  AdminTopUpsPaginatedDto,
  AdminWithdrawalCountsDto,
  AdminWithdrawalItemDto,
  AdminWithdrawalsPaginatedDto,
  AdminDashboardActionItemsDto,
  AdminDashboardCampaignActionItemDto,
  AdminDashboardKycActionItemDto,
  AdminDashboardMetricsDto,
  AdminDashboardQueuesDto,
  AdminDashboardSummaryDto,
  AdminDashboardTopUpActionItemDto,
  AdminDashboardTransactionActionItemDto,
  AdminDashboardWithdrawalActionItemDto,
  FifoSubmissionAllocationInput,
} from './admin.types.js';

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
        lastMetricsSyncedAt: true,
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
          orderBy: FIFO_SUBMISSION_ORDER_BY,
          select: {
            id: true,
            submissionStatus: true,
            verifiedViews: true,
            earnings: true,
            syncFailureStreak: true,
            lastSyncError: true,
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
      const flaggedSubsCount = approvedSubs.filter(
        (sub) => (sub.syncFailureStreak ?? 0) > 0 && Boolean(sub.lastSyncError),
      ).length;

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

      const remainingRefund = Math.max(0, Math.floor(budget) - allocatedEarnings);
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
        flaggedSubmissionsCount: flaggedSubsCount,
        lastMetricsSyncedAt: campaign.lastMetricsSyncedAt ?? null,
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
        orderBy: FIFO_SUBMISSION_ORDER_BY,
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
          syncFailureStreak: 0,
          lastSyncError: null,
          lastMetricsSyncedAt: new Date(),
        },
      };
      await tx.submission.update(updateViewsPayload);

      const approvedSubmissionsQuery = {
        where: {
          campaignId: targetSubmission.campaignId,
          status: Status.ACTIVE,
          submissionStatus: SubmissionStatus.APPROVED,
        },
        orderBy: FIFO_SUBMISSION_ORDER_BY,
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
        orderBy: FIFO_SUBMISSION_ORDER_BY,
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

    let brandRefundAmount = 0;
    const settledCreatorPayouts: Array<{
      creatorAccountId: string;
      submissionId: string;
      rewardAmount: number;
    }> = [];

    await prisma.$transaction(async (tx) => {
      if (typeof tx.$queryRaw === 'function') {
        await tx.$queryRaw`SELECT id FROM campaigns WHERE id = ${campaign.id} FOR UPDATE`;
      }

      const approvedQuery = {
        where: {
          campaignId: campaign.id,
          status: Status.ACTIVE,
          submissionStatus: SubmissionStatus.APPROVED,
        },
        orderBy: FIFO_SUBMISSION_ORDER_BY,
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

        if (sub.creator?.accountId) {
          settledCreatorPayouts.push({
            creatorAccountId: sub.creator.accountId,
            submissionId: sub.id,
            rewardAmount: finalReward,
          });
        }

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
      brandRefundAmount = finalFifo.remainingRefund;
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

    // Notify Brand about settlement completion
    if (campaign.brand?.accountId) {
      void NotifySettlementFinalizedForBrand({
        brandAccountId: campaign.brand.accountId,
        campaignTitle,
        campaignId: campaign.id,
        refundAmount: brandRefundAmount,
      });
    }

    // Notify clippers (creators) about settlement reward distributed
    for (const payout of settledCreatorPayouts) {
      void NotifySettlementFinalizedForCreator({
        creatorAccountId: payout.creatorAccountId,
        campaignTitle,
        campaignId: campaign.id,
        submissionId: payout.submissionId,
        rewardAmount: payout.rewardAmount,
      });
    }

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
            isFeatured: true,
            featuredOrder: true,
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
        isFeatured: campaign.isFeatured,
        featuredOrder: campaign.featuredOrder,
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

    if (input.action === MODERATION_ACTION.APPROVE) {
      void NotifyCampaignApproved({
        brandAccountId: campaign.brand.accountId,
        campaignTitle: campaign.title ?? 'Kampanye',
        campaignId: campaign.id,
      });
    } else if (input.action === MODERATION_ACTION.REVISION) {
      void NotifyCampaignRevision({
        brandAccountId: campaign.brand.accountId,
        campaignTitle: campaign.title ?? 'Kampanye',
        campaignId: campaign.id,
        adminNote: input.adminNote ?? '',
      });
    } else if (input.action === MODERATION_ACTION.REJECT_CAMPAIGN) {
      void NotifyCampaignRejected({
        brandAccountId: campaign.brand.accountId,
        campaignTitle: campaign.title ?? 'Kampanye',
        campaignId: campaign.id,
        rejectionReason: input.adminNote ?? 'Kampanye tidak memenuhi kriteria moderasi platform.',
      });
    }

    SendSuccess(res, updatedCampaign, ADMIN_MESSAGES.MODERATE_CAMPAIGN_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Toggles and updates the featured promotion status, display order, banner, and duration for a campaign.
 * Restricted to administrators.
 *
 * @param req - Express request with campaign ID param and ToggleFeaturedCampaign payload.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function ToggleCampaignFeaturedStatus(
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

    const parseResult = ToggleFeaturedCampaignSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      SendError(res, firstIssue?.message || ADMIN_MESSAGES.INVALID_PAYLOAD, 400);
      return;
    }

    const input = parseResult.data;

    const findCampaignQuery = {
      where: {
        id: campaignId,
        status: Status.ACTIVE,
      },
      select: {
        id: true,
        isFeatured: true,
        featuredOrder: true,
        featuredUntil: true,
        featuredBannerUrl: true,
      },
    };

    const campaign = await prisma.campaign.findFirst(findCampaignQuery);

    if (!campaign) {
      SendError(res, ADMIN_MESSAGES.CAMPAIGN_NOT_FOUND, 404);
      return;
    }

    const updatePayload: Prisma.CampaignUpdateInput = {
      isFeatured: input.isFeatured,
      featuredOrder: input.isFeatured
        ? (input.featuredOrder !== undefined
            ? input.featuredOrder
            : (campaign.featuredOrder ?? DEFAULT_FEATURED_ORDER))
        : null,
      featuredUntil: input.isFeatured
        ? (input.featuredUntil !== undefined ? input.featuredUntil : campaign.featuredUntil)
        : null,
      featuredBannerUrl: input.isFeatured
        ? (input.featuredBannerUrl !== undefined
            ? input.featuredBannerUrl
            : campaign.featuredBannerUrl)
        : null,
    };

    const updateCampaignQuery = {
      where: { id: campaignId },
      data: updatePayload,
      select: CAMPAIGN_DETAIL_SELECT,
    };

    const updatedCampaign = await prisma.campaign.update(updateCampaignQuery);

    SendSuccess(res, updatedCampaign, ADMIN_MESSAGES.CAMPAIGN_FEATURED_UPDATED);
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

    if (topUp.wallet?.accountId) {
      if (input.decision === TOPUP_REVIEW_ACTION.APPROVE) {
        void NotifyTopUpApproved({
          brandAccountId: topUp.wallet.accountId,
          amount: Number(topUp.totalPayable),
        });
      } else {
        void NotifyTopUpRejected({
          brandAccountId: topUp.wallet.accountId,
          amount: Number(topUp.totalPayable),
          rejectionReason: input.rejectionReason ?? 'Bukti transfer tidak valid.',
        });
      }
    }

    SendSuccess(res, result, ADMIN_MESSAGES.REVIEW_TOP_UP_SUCCESS);
  } catch (err) {
    if (err instanceof Error && err.message === 'TOP_UP_NOT_SUBMITTED') {
      SendError(res, ADMIN_MESSAGES.TOP_UP_NOT_SUBMITTED, 400);
      return;
    }
    next(err);
  }
}

/**
 * Handles `GET /api/admin/withdrawals`: queries paginated withdrawal requests across creators and brands,
 * with status filter, role filter, keyword search, and live tab counts.
 *
 * @param req - Express request with filter, role, search, page, limit query parameters.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetAdminWithdrawals(
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

    const parseResult = AdminWithdrawalQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      SendError(res, firstIssue?.message || ADMIN_MESSAGES.INVALID_PAYLOAD, 400);
      return;
    }

    const { filter, role, search, page, limit } = parseResult.data;

    const baseWhereClause: Prisma.PayoutRequestWhereInput = {
      status: Status.ACTIVE,
      wallet: {
        status: Status.ACTIVE,
        account: {
          status: Status.ACTIVE,
          ...(role === WITHDRAWAL_ROLE_FILTER.CREATOR
            ? { role: Role.CREATOR }
            : role === WITHDRAWAL_ROLE_FILTER.BRAND
              ? { role: Role.BRAND }
              : {}),
        },
      },
    };

    const whereClause: Prisma.PayoutRequestWhereInput = {
      ...baseWhereClause,
    };

    if (filter === WITHDRAWAL_FILTER.PENDING) {
      whereClause.payoutStatus = PayoutStatus.PENDING;
      whereClause.cancellationRequestedAt = null;
    } else if (filter === WITHDRAWAL_FILTER.CANCELLATION) {
      whereClause.payoutStatus = PayoutStatus.PENDING;
      whereClause.cancellationRequestedAt = { not: null };
    } else if (filter === WITHDRAWAL_FILTER.APPROVED) {
      whereClause.payoutStatus = PayoutStatus.APPROVED;
    } else if (filter === WITHDRAWAL_FILTER.REJECTED) {
      whereClause.payoutStatus = PayoutStatus.REJECTED;
    } else if (filter === WITHDRAWAL_FILTER.ALL) {
      whereClause.payoutStatus = {
        in: [
          PayoutStatus.PENDING,
          PayoutStatus.APPROVED,
          PayoutStatus.REJECTED,
        ],
      };
    }

    if (search && search.trim().length > 0) {
      const queryTrimmed = search.trim();
      whereClause.AND = [
        {
          OR: [
            { referenceCode: { contains: queryTrimmed, mode: 'insensitive' } },
            { accountProvider: { contains: queryTrimmed, mode: 'insensitive' } },
            { accountNumber: { contains: queryTrimmed, mode: 'insensitive' } },
            { accountHolderName: { contains: queryTrimmed, mode: 'insensitive' } },
            {
              wallet: {
                account: {
                  email: { contains: queryTrimmed, mode: 'insensitive' },
                },
              },
            },
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
                  creator: {
                    fullName: { contains: queryTrimmed, mode: 'insensitive' },
                  },
                },
              },
            },
          ],
        },
      ];
    }

    const skip = (page - 1) * limit;

    const findWithdrawalsQuery = {
      where: whereClause,
      orderBy: { createdAt: 'desc' as const },
      skip,
      take: limit,
      select: ADMIN_WITHDRAWAL_SELECT,
    };
    const countFilteredQuery = { where: whereClause };
    const countPendingQuery = {
      where: {
        ...baseWhereClause,
        payoutStatus: PayoutStatus.PENDING,
        cancellationRequestedAt: null,
      },
    };
    const countCancellationQuery = {
      where: {
        ...baseWhereClause,
        payoutStatus: PayoutStatus.PENDING,
        cancellationRequestedAt: { not: null },
      },
    };
    const countApprovedQuery = {
      where: { ...baseWhereClause, payoutStatus: PayoutStatus.APPROVED },
    };
    const countRejectedQuery = {
      where: { ...baseWhereClause, payoutStatus: PayoutStatus.REJECTED },
    };
    const countAllQuery = {
      where: {
        ...baseWhereClause,
        payoutStatus: {
          in: [
            PayoutStatus.PENDING,
            PayoutStatus.APPROVED,
            PayoutStatus.REJECTED,
          ],
        },
      },
    };

    const [
      withdrawals,
      totalFiltered,
      countPending,
      countCancellation,
      countApproved,
      countRejected,
      countAll,
    ] = await Promise.all([
      prisma.payoutRequest.findMany(findWithdrawalsQuery),
      prisma.payoutRequest.count(countFilteredQuery),
      prisma.payoutRequest.count(countPendingQuery),
      prisma.payoutRequest.count(countCancellationQuery),
      prisma.payoutRequest.count(countApprovedQuery),
      prisma.payoutRequest.count(countRejectedQuery),
      prisma.payoutRequest.count(countAllQuery),
    ]);

    const items: AdminWithdrawalItemDto[] = withdrawals.map(MapAdminWithdrawalToDto);

    const totalPages = Math.ceil(totalFiltered / limit) || 1;

    const result: AdminWithdrawalsPaginatedDto = {
      items,
      counts: {
        pending: countPending,
        cancellation: countCancellation,
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

    SendSuccess(res, result, ADMIN_MESSAGES.GET_WITHDRAWALS_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /api/admin/withdrawals/:id/review`:
 * Reviews a pending withdrawal request from a creator or brand.
 * On APPROVE: marks payoutStatus APPROVED, records admin details, and ensures a WITHDRAWAL transaction exists.
 * On REJECT: marks payoutStatus REJECTED, records rejectionReason, refunds amount to wallet balance,
 * and soft-deletes any premature WITHDRAWAL transaction.
 *
 * @param req - Express request with withdrawal id parameter and review decision payload.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function ReviewWithdrawalRequest(
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

    const findAdminQuery = {
      where: { accountId: account.sub, status: Status.ACTIVE },
      select: { id: true },
    };
    const admin = await prisma.admin.findFirst(findAdminQuery);

    if (!admin) {
      SendError(res, ADMIN_MESSAGES.ADMIN_ACCOUNT_NOT_FOUND, 403);
      return;
    }

    const withdrawalId = req.params.id as string;

    const parseResult = ReviewWithdrawalSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      SendError(res, firstIssue?.message || ADMIN_MESSAGES.INVALID_PAYLOAD, 400);
      return;
    }

    const input = parseResult.data;

    const findWithdrawalQuery = {
      where: {
        id: withdrawalId,
        status: Status.ACTIVE,
        wallet: { status: Status.ACTIVE },
      },
      include: {
        wallet: true,
      },
    };

    const withdrawal = await prisma.payoutRequest.findFirst(findWithdrawalQuery);

    if (!withdrawal) {
      SendError(res, ADMIN_MESSAGES.WITHDRAWAL_NOT_FOUND, 404);
      return;
    }

    if (withdrawal.payoutStatus !== PayoutStatus.PENDING) {
      SendError(res, ADMIN_MESSAGES.WITHDRAWAL_NOT_PENDING, 400);
      return;
    }

    const processedDate = new Date();

    if (input.decision === WITHDRAWAL_REVIEW_ACTION.APPROVE) {
      await prisma.$transaction(async (tx) => {
        const updatePayoutPayload = {
          where: {
            id: withdrawal.id,
            payoutStatus: PayoutStatus.PENDING,
            status: Status.ACTIVE,
          },
          data: {
            payoutStatus: PayoutStatus.APPROVED,
            processedByAdminId: admin.id,
            processedAt: processedDate,
            adminNote: input.adminNote ?? null,
            transferProofUrl: input.transferProofUrl ?? null,
          },
        };
        const updateResult = await tx.payoutRequest.updateMany(updatePayoutPayload);

        if (updateResult.count === 0) {
          throw new Error('WITHDRAWAL_NOT_PENDING');
        }

        const findExistingTxnQuery = {
          where: {
            walletId: withdrawal.walletId,
            type: WalletTransactionType.WITHDRAWAL,
            status: Status.ACTIVE,
            OR: [
              { referenceCode: withdrawal.referenceCode },
              { description: { contains: withdrawal.referenceCode } },
            ],
          },
        };
        const existingTxn = await tx.walletTransaction.findFirst(findExistingTxnQuery);

        if (!existingTxn) {
          const transactionReference = GenerateWalletTransactionReferenceCode();
          const findWalletQuery = {
            where: { id: withdrawal.walletId },
          };
          const currentWallet = await tx.wallet.findUniqueOrThrow(findWalletQuery);
          const withdrawalAmount = Number(withdrawal.amount);
          const balanceAfter = Number(currentWallet.balance);
          const balanceBefore = balanceAfter + withdrawalAmount;

          const transactionPayload = {
            data: {
              referenceCode: transactionReference,
              walletId: withdrawal.walletId,
              type: WalletTransactionType.WITHDRAWAL,
              amount: new Prisma.Decimal(withdrawalAmount),
              balanceBefore: new Prisma.Decimal(balanceBefore),
              balanceAfter: new Prisma.Decimal(balanceAfter),
              description: `Penarikan saldo ke ${withdrawal.accountProvider} (${withdrawal.accountNumber}) a.n ${withdrawal.accountHolderName} (${withdrawal.referenceCode})`,
              transactionDate: processedDate,
              status: Status.ACTIVE,
            },
          };
          await tx.walletTransaction.create(transactionPayload);
        }
      });
    } else if (input.decision === WITHDRAWAL_REVIEW_ACTION.REJECT) {
      await prisma.$transaction(async (tx) => {
        const updatePayoutPayload = {
          where: {
            id: withdrawal.id,
            payoutStatus: PayoutStatus.PENDING,
            status: Status.ACTIVE,
          },
          data: {
            payoutStatus: PayoutStatus.REJECTED,
            rejectionReason: input.rejectionReason,
            processedByAdminId: admin.id,
            processedAt: processedDate,
            adminNote: input.adminNote ?? null,
          },
        };
        const updateResult = await tx.payoutRequest.updateMany(updatePayoutPayload);

        if (updateResult.count === 0) {
          throw new Error('WITHDRAWAL_NOT_PENDING');
        }

        const refundPayload = {
          where: { id: withdrawal.walletId },
          data: {
            balance: {
              increment: withdrawal.amount,
            },
          },
        };
        await tx.wallet.update(refundPayload);

        const findPrematureTxnQuery = {
          where: {
            walletId: withdrawal.walletId,
            type: WalletTransactionType.WITHDRAWAL,
            status: Status.ACTIVE,
            OR: [
              { referenceCode: withdrawal.referenceCode },
              { description: { contains: withdrawal.referenceCode } },
            ],
          },
        };
        const prematureTxn = await tx.walletTransaction.findFirst(findPrematureTxnQuery);

        if (prematureTxn) {
          const deletePrematureTxnPayload = {
            where: { id: prematureTxn.id },
            data: { status: Status.DELETED },
          };
          await tx.walletTransaction.update(deletePrematureTxnPayload);
        }
      });
    }

    const updatedWithdrawalQuery = {
      where: { id: withdrawal.id, status: Status.ACTIVE },
      select: ADMIN_WITHDRAWAL_SELECT,
    };
    const updatedWithdrawal = await prisma.payoutRequest.findFirst(updatedWithdrawalQuery);

    if (!updatedWithdrawal) {
      SendError(res, ADMIN_MESSAGES.WITHDRAWAL_NOT_FOUND, 404);
      return;
    }

    const result = MapAdminWithdrawalToDto(updatedWithdrawal);

    if (withdrawal.wallet?.accountId) {
      if (input.decision === WITHDRAWAL_REVIEW_ACTION.APPROVE) {
        void NotifyWithdrawalApproved({
          creatorAccountId: withdrawal.wallet.accountId,
          amount: Number(withdrawal.amount),
        });
      } else {
        void NotifyWithdrawalRejected({
          creatorAccountId: withdrawal.wallet.accountId,
          amount: Number(withdrawal.amount),
          rejectionReason: input.rejectionReason ?? 'Permintaan penarikan dana ditolak admin.',
        });
      }
    }

    SendSuccess(res, result, ADMIN_MESSAGES.REVIEW_WITHDRAWAL_SUCCESS);
  } catch (err) {
    if (err instanceof Error && err.message === 'WITHDRAWAL_NOT_PENDING') {
      SendError(res, ADMIN_MESSAGES.WITHDRAWAL_NOT_PENDING, 400);
      return;
    }
    next(err);
  }
}

/**
 * Handles `GET /api/admin/kyc`: queries paginated payout account KYC submissions across creators and brands,
 * enforcing soft-delete filters, status/role filters, keyword search, and live status tab counts.
 *
 * @param req - Express request with filter, role, search, page, limit query parameters.
 * @param res - Express response object.
 * @param next - Express next function.
 * @returns Promise resolving after sending the standardized JSON response.
 */
export async function GetAdminKycRequests(
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

    const parseResult = AdminKycQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      SendError(res, firstIssue?.message || ADMIN_MESSAGES.INVALID_PAYLOAD, 400);
      return;
    }

    const { filter, role, search, page, limit } = parseResult.data;

    const accountRoleWhere: Prisma.AccountWhereInput =
      role === KYC_ROLE_FILTER.CREATOR
        ? {
            status: Status.ACTIVE,
            role: Role.CREATOR,
            creator: { status: Status.ACTIVE },
          }
        : role === KYC_ROLE_FILTER.BRAND
          ? {
              status: Status.ACTIVE,
              role: Role.BRAND,
              brand: { status: Status.ACTIVE },
            }
          : {
              status: Status.ACTIVE,
              OR: [
                { role: Role.CREATOR, creator: { status: Status.ACTIVE } },
                { role: Role.BRAND, brand: { status: Status.ACTIVE } },
              ],
            };

    const baseWhereClause: Prisma.BrandPayoutAccountWhereInput = {
      status: Status.ACTIVE,
      wallet: {
        status: Status.ACTIVE,
        account: accountRoleWhere,
      },
    };

    const whereClause: Prisma.BrandPayoutAccountWhereInput = {
      ...baseWhereClause,
    };

    if (filter === KYC_FILTER.PENDING) {
      whereClause.verificationStatus = VerificationStatus.PENDING;
    } else if (filter === KYC_FILTER.VERIFIED) {
      whereClause.verificationStatus = VerificationStatus.VERIFIED;
    } else if (filter === KYC_FILTER.REJECTED) {
      whereClause.verificationStatus = VerificationStatus.REJECTED;
    } else if (filter === KYC_FILTER.ALL) {
      whereClause.verificationStatus = {
        in: [
          VerificationStatus.PENDING,
          VerificationStatus.VERIFIED,
          VerificationStatus.REJECTED,
        ],
      };
    }

    if (search && search.trim().length > 0) {
      const queryTrimmed = search.trim();
      const phoneVariants = BuildKycPhoneSearchVariants(queryTrimmed);
      const searchConditions: Prisma.BrandPayoutAccountWhereInput[] = [
        { provider: { contains: queryTrimmed, mode: 'insensitive' } },
        { accountNumber: { contains: queryTrimmed, mode: 'insensitive' } },
        { accountHolderName: { contains: queryTrimmed, mode: 'insensitive' } },
        {
          wallet: {
            account: {
              email: { contains: queryTrimmed, mode: 'insensitive' },
            },
          },
        },
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
              brand: {
                phoneNumber: { contains: queryTrimmed, mode: 'insensitive' },
              },
            },
          },
        },
        {
          wallet: {
            account: {
              creator: {
                fullName: { contains: queryTrimmed, mode: 'insensitive' },
              },
            },
          },
        },
        {
          wallet: {
            account: {
              creator: {
                phoneNumber: { contains: queryTrimmed, mode: 'insensitive' },
              },
            },
          },
        },
      ];

      for (const variant of phoneVariants) {
        searchConditions.push(
          { accountNumber: { contains: variant, mode: 'insensitive' } },
          {
            wallet: {
              account: {
                brand: {
                  phoneNumber: { contains: variant, mode: 'insensitive' },
                },
              },
            },
          },
          {
            wallet: {
              account: {
                creator: {
                  phoneNumber: { contains: variant, mode: 'insensitive' },
                },
              },
            },
          },
        );
      }

      whereClause.AND = [{ OR: searchConditions }];
    }

    const skip = (page - 1) * limit;

    const findKycRequestsQuery = {
      where: whereClause,
      orderBy: { createdAt: 'desc' as const },
      skip,
      take: limit,
      select: ADMIN_KYC_SELECT,
    };
    const countFilteredQuery = { where: whereClause };
    const countPendingQuery = {
      where: {
        ...baseWhereClause,
        verificationStatus: VerificationStatus.PENDING,
      },
    };
    const countVerifiedQuery = {
      where: {
        ...baseWhereClause,
        verificationStatus: VerificationStatus.VERIFIED,
      },
    };
    const countRejectedQuery = {
      where: {
        ...baseWhereClause,
        verificationStatus: VerificationStatus.REJECTED,
      },
    };
    const countAllQuery = {
      where: {
        ...baseWhereClause,
        verificationStatus: {
          in: [
            VerificationStatus.PENDING,
            VerificationStatus.VERIFIED,
            VerificationStatus.REJECTED,
          ],
        },
      },
    };

    const [
      kycRecords,
      totalFiltered,
      countPending,
      countVerified,
      countRejected,
      countAll,
    ] = await Promise.all([
      prisma.brandPayoutAccount.findMany(findKycRequestsQuery),
      prisma.brandPayoutAccount.count(countFilteredQuery),
      prisma.brandPayoutAccount.count(countPendingQuery),
      prisma.brandPayoutAccount.count(countVerifiedQuery),
      prisma.brandPayoutAccount.count(countRejectedQuery),
      prisma.brandPayoutAccount.count(countAllQuery),
    ]);

    const items: AdminKycItemDto[] = kycRecords.map(MapAdminKycToDto);

    const totalPages = Math.ceil(totalFiltered / limit) || 1;

    const result: AdminKycPaginatedDto = {
      items,
      counts: {
        pending: countPending,
        verified: countVerified,
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

    SendSuccess(res, result, ADMIN_MESSAGES.GET_KYC_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /api/admin/kyc/:id/review`: approves or rejects a pending payout account KYC submission.
 * Enforces fast-fail guard ordering (401 -> 403 -> 400 -> 404/409 -> atomic transaction) and reconciles
 * `isPrimary` automatically inside the database transaction so every wallet maintains at most one primary
 * account and falls back to an active verified account whenever no primary remains.
 *
 * @param req - Express request with KYC payout account ID parameter and review decision payload.
 * @param res - Express response object.
 * @param next - Express next function.
 * @returns Promise resolving after sending the standardized JSON response.
 */
export async function ReviewKycRequest(
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

    const rawKycId = req.params.id;
    const kycId = typeof rawKycId === 'string' ? rawKycId.trim() : '';
    if (kycId.length === 0) {
      SendError(res, ADMIN_MESSAGES.INVALID_PAYLOAD, 400);
      return;
    }

    const parseResult = ReviewKycSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      SendError(res, firstIssue?.message || ADMIN_MESSAGES.INVALID_PAYLOAD, 400);
      return;
    }

    const input = parseResult.data;

    const findKycQuery = {
      where: {
        id: kycId,
        status: Status.ACTIVE,
        wallet: {
          status: Status.ACTIVE,
          account: {
            status: Status.ACTIVE,
            OR: [
              { role: Role.CREATOR, creator: { status: Status.ACTIVE } },
              { role: Role.BRAND, brand: { status: Status.ACTIVE } },
            ],
          },
        },
      },
      select: {
        id: true,
        walletId: true,
        isPrimary: true,
        verificationStatus: true,
        wallet: {
          select: {
            accountId: true,
          },
        },
      },
    };

    const targetKyc = await prisma.brandPayoutAccount.findFirst(findKycQuery);

    if (!targetKyc) {
      SendError(res, ADMIN_MESSAGES.KYC_NOT_FOUND, 404);
      return;
    }

    if (targetKyc.verificationStatus !== VerificationStatus.PENDING) {
      SendError(res, ADMIN_MESSAGES.KYC_NOT_PENDING, 409);
      return;
    }

    const reviewedAt = new Date();

    if (input.decision === KYC_REVIEW_ACTION.APPROVE) {
      await prisma.$transaction(async (tx) => {
        const approveUpdatePayload = {
          where: {
            id: targetKyc.id,
            verificationStatus: VerificationStatus.PENDING,
            status: Status.ACTIVE,
          },
          data: {
            verificationStatus: VerificationStatus.VERIFIED,
            verifiedAt: reviewedAt,
            rejectionReason: null,
          },
        };
        const updateResult = await tx.brandPayoutAccount.updateMany(approveUpdatePayload);

        if (updateResult.count === 0) {
          throw new Error('KYC_NOT_PENDING');
        }

        const findVerifiedPrimaryQuery = {
          where: {
            walletId: targetKyc.walletId,
            status: Status.ACTIVE,
            verificationStatus: VerificationStatus.VERIFIED,
            isPrimary: true,
            id: { not: targetKyc.id },
          },
          select: { id: true },
        };
        const existingVerifiedPrimary = await tx.brandPayoutAccount.findFirst(
          findVerifiedPrimaryQuery,
        );

        if (!existingVerifiedPrimary) {
          const clearOtherPrimaryPayload = {
            where: {
              walletId: targetKyc.walletId,
              status: Status.ACTIVE,
              id: { not: targetKyc.id },
              isPrimary: true,
            },
            data: {
              isPrimary: false,
            },
          };
          await tx.brandPayoutAccount.updateMany(clearOtherPrimaryPayload);

          const promoteApprovedPayload = {
            where: { id: targetKyc.id },
            data: { isPrimary: true },
          };
          await tx.brandPayoutAccount.update(promoteApprovedPayload);
        } else {
          // Enforce <= 1 primary inside the transaction without trusting pre-tx targetKyc.isPrimary
          const demoteDuplicatePrimaryPayload = {
            where: {
              id: targetKyc.id,
              status: Status.ACTIVE,
              isPrimary: true,
            },
            data: { isPrimary: false },
          };
          await tx.brandPayoutAccount.updateMany(demoteDuplicatePrimaryPayload);
        }
      });
    } else {
      await prisma.$transaction(async (tx) => {
        const rejectUpdatePayload = {
          where: {
            id: targetKyc.id,
            verificationStatus: VerificationStatus.PENDING,
            status: Status.ACTIVE,
          },
          data: {
            verificationStatus: VerificationStatus.REJECTED,
            rejectionReason: input.rejectionReason ?? null,
            verifiedAt: null,
            isPrimary: false,
          },
        };
        const updateResult = await tx.brandPayoutAccount.updateMany(rejectUpdatePayload);

        if (updateResult.count === 0) {
          throw new Error('KYC_NOT_PENDING');
        }

        // Determine remaining primary status strictly inside tx to prevent concurrent primary-switch races
        const findRemainingPrimaryQuery = {
          where: {
            walletId: targetKyc.walletId,
            status: Status.ACTIVE,
            isPrimary: true,
            id: { not: targetKyc.id },
          },
          select: { id: true },
        };
        const remainingPrimaryAccount = await tx.brandPayoutAccount.findFirst(
          findRemainingPrimaryQuery,
        );

        if (!remainingPrimaryAccount) {
          const findFallbackVerifiedQuery = {
            where: {
              walletId: targetKyc.walletId,
              status: Status.ACTIVE,
              verificationStatus: VerificationStatus.VERIFIED,
              id: { not: targetKyc.id },
            },
            orderBy: [
              { verifiedAt: 'desc' as const },
              { createdAt: 'desc' as const },
            ],
            select: { id: true },
          };
          const fallbackVerifiedAccount = await tx.brandPayoutAccount.findFirst(
            findFallbackVerifiedQuery,
          );

          if (fallbackVerifiedAccount) {
            const promoteFallbackPayload = {
              where: { id: fallbackVerifiedAccount.id },
              data: { isPrimary: true },
            };
            await tx.brandPayoutAccount.update(promoteFallbackPayload);
          }
        }
      });
    }

    const updatedKycQuery = {
      where: { id: targetKyc.id, status: Status.ACTIVE },
      select: ADMIN_KYC_SELECT,
    };
    const updatedKyc = await prisma.brandPayoutAccount.findFirst(updatedKycQuery);

    if (!updatedKyc) {
      SendError(res, ADMIN_MESSAGES.KYC_NOT_FOUND, 404);
      return;
    }

    const result = MapAdminKycToDto(updatedKyc);
    const successMessage =
      input.decision === KYC_REVIEW_ACTION.APPROVE
        ? ADMIN_MESSAGES.KYC_APPROVE_SUCCESS
        : ADMIN_MESSAGES.KYC_REJECT_SUCCESS;

    if (targetKyc.wallet?.accountId) {
      if (input.decision === KYC_REVIEW_ACTION.APPROVE) {
        void NotifyKycApproved({
          creatorAccountId: targetKyc.wallet.accountId,
        });
      } else {
        void NotifyKycRejected({
          creatorAccountId: targetKyc.wallet.accountId,
          rejectionReason: input.rejectionReason ?? 'Dokumen belum memenuhi kriteria.',
        });
      }
    }

    SendSuccess(res, result, successMessage);
  } catch (err) {
    if (err instanceof Error && err.message === 'KYC_NOT_PENDING') {
      SendError(res, ADMIN_MESSAGES.KYC_NOT_PENDING, 409);
      return;
    }
    next(err);
  }
}

/**
 * Retrieves the comprehensive operational admin dashboard summary.
 * Aggregates all 5 actionable review queues (Moderation, Settlement, Top Up, Withdraw, KYC),
 * platform-wide financial & ecosystem health metrics (Locked Campaign Budgets, User Wallets,
 * Paid Rewards, Views, User counts), and oldest-first triage preview lists in a single roundtrip.
 *
 * @param req - Express request object containing authenticated admin session.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetAdminDashboardSummary(
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

    const adminQuery = {
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
      include: {
        account: {
          select: {
            email: true,
            status: true,
          },
        },
      },
    };
    const admin = await prisma.admin.findFirst(adminQuery);

    if (!admin || admin.account.status !== Status.ACTIVE) {
      SendError(res, ADMIN_MESSAGES.ADMIN_ACCOUNT_NOT_FOUND, 404);
      return;
    }

    // 1. Queue 1: Campaign Moderation counts
    const campaignInReviewCountQuery: Prisma.CampaignCountArgs = {
      where: {
        campaignStatus: CampaignStatus.IN_REVIEW,
        status: Status.ACTIVE,
        brand: { status: Status.ACTIVE },
      },
    };
    const campaignInReviewCountPromise = prisma.campaign.count(campaignInReviewCountQuery);

    const campaignManualPaymentCountQuery: Prisma.CampaignCountArgs = {
      where: {
        campaignStatus: CampaignStatus.IN_REVIEW,
        status: Status.ACTIVE,
        brand: { status: Status.ACTIVE },
        payments: {
          some: {
            paymentStatus: PaymentStatus.SUBMITTED,
            status: Status.ACTIVE,
          },
        },
      },
    };
    const campaignManualPaymentCountPromise = prisma.campaign.count(campaignManualPaymentCountQuery);

    const campaignRevisionCountQuery: Prisma.CampaignCountArgs = {
      where: {
        campaignStatus: CampaignStatus.REVISION,
        status: Status.ACTIVE,
        brand: { status: Status.ACTIVE },
      },
    };
    const campaignRevisionCountPromise = prisma.campaign.count(campaignRevisionCountQuery);

    // 2. Queue 2: Settlement Campaigns
    const settlementCampaignsQuery = {
      where: {
        status: Status.ACTIVE,
        brand: { status: Status.ACTIVE },
        campaignStatus: {
          in: [CampaignStatus.ACTIVE, CampaignStatus.FINISHED],
        },
      },
      orderBy: { createdAt: 'asc' as const },
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
        payments: {
          where: { status: Status.ACTIVE },
          orderBy: { createdAt: 'desc' as const },
          take: 1,
          select: {
            paymentStatus: true,
          },
        },
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
    const settlementCampaignsPromise = prisma.campaign.findMany(settlementCampaignsQuery);

    // 3. Queue 3: Top Ups
    const topUpsSubmittedCountQuery = {
      where: {
        status: PaymentStatus.SUBMITTED,
        recordStatus: Status.ACTIVE,
        wallet: {
          status: Status.ACTIVE,
          account: {
            status: Status.ACTIVE,
            brand: { status: Status.ACTIVE },
          },
        },
      },
    };
    const topUpsSubmittedCountPromise = prisma.topUpRequest.count(topUpsSubmittedCountQuery);

    const topUpsSubmittedSumQuery: Prisma.TopUpRequestAggregateArgs = {
      where: {
        status: PaymentStatus.SUBMITTED,
        recordStatus: Status.ACTIVE,
        wallet: {
          status: Status.ACTIVE,
          account: {
            status: Status.ACTIVE,
            brand: { status: Status.ACTIVE },
          },
        },
      },
      _sum: {
        totalPayable: true,
      },
    };
    const topUpsSubmittedSumPromise = prisma.topUpRequest.aggregate(topUpsSubmittedSumQuery);

    const topUpsPendingCountQuery = {
      where: {
        status: PaymentStatus.PENDING,
        recordStatus: Status.ACTIVE,
        wallet: {
          status: Status.ACTIVE,
          account: {
            status: Status.ACTIVE,
            brand: { status: Status.ACTIVE },
          },
        },
      },
    };
    const topUpsPendingCountPromise = prisma.topUpRequest.count(topUpsPendingCountQuery);

    // 4. Queue 4: Withdrawals
    const withdrawalsPendingCountQuery = {
      where: {
        payoutStatus: PayoutStatus.PENDING,
        status: Status.ACTIVE,
        wallet: {
          status: Status.ACTIVE,
          account: { status: Status.ACTIVE },
        },
      },
    };
    const withdrawalsPendingCountPromise = prisma.payoutRequest.count(withdrawalsPendingCountQuery);

    const withdrawalsPendingSumQuery: Prisma.PayoutRequestAggregateArgs = {
      where: {
        payoutStatus: PayoutStatus.PENDING,
        status: Status.ACTIVE,
        wallet: {
          status: Status.ACTIVE,
          account: { status: Status.ACTIVE },
        },
      },
      _sum: {
        amount: true,
      },
    };
    const withdrawalsPendingSumPromise = prisma.payoutRequest.aggregate(withdrawalsPendingSumQuery);

    const withdrawalsCancellationCountQuery = {
      where: {
        payoutStatus: PayoutStatus.PENDING,
        status: Status.ACTIVE,
        cancellationRequestedAt: { not: null },
        wallet: {
          status: Status.ACTIVE,
          account: { status: Status.ACTIVE },
        },
      },
    };
    const withdrawalsCancellationCountPromise = prisma.payoutRequest.count(withdrawalsCancellationCountQuery);

    // 5. Queue 5: KYC Verification
    const kycPendingCountQuery = {
      where: {
        verificationStatus: VerificationStatus.PENDING,
        status: Status.ACTIVE,
        wallet: {
          status: Status.ACTIVE,
          account: { status: Status.ACTIVE },
        },
      },
    };
    const kycPendingCountPromise = prisma.brandPayoutAccount.count(kycPendingCountQuery);

    const kycPendingCreatorCountQuery = {
      where: {
        verificationStatus: VerificationStatus.PENDING,
        status: Status.ACTIVE,
        wallet: {
          status: Status.ACTIVE,
          account: {
            status: Status.ACTIVE,
            role: Role.CREATOR,
          },
        },
      },
    };
    const kycPendingCreatorCountPromise = prisma.brandPayoutAccount.count(kycPendingCreatorCountQuery);

    const kycPendingBrandCountQuery = {
      where: {
        verificationStatus: VerificationStatus.PENDING,
        status: Status.ACTIVE,
        wallet: {
          status: Status.ACTIVE,
          account: {
            status: Status.ACTIVE,
            role: Role.BRAND,
          },
        },
      },
    };
    const kycPendingBrandCountPromise = prisma.brandPayoutAccount.count(kycPendingBrandCountQuery);

    // 6. Financial & Ecosystem Metrics
    const activeCampaignsCountQuery = {
      where: {
        campaignStatus: CampaignStatus.ACTIVE,
        status: Status.ACTIVE,
        brand: { status: Status.ACTIVE },
      },
    };
    const activeCampaignsCountPromise = prisma.campaign.count(activeCampaignsCountQuery);

    const activeCampaignsBudgetQuery: Prisma.CampaignAggregateArgs = {
      where: {
        campaignStatus: CampaignStatus.ACTIVE,
        status: Status.ACTIVE,
        brand: { status: Status.ACTIVE },
      },
      _sum: {
        budget: true,
      },
    };
    const activeCampaignsBudgetPromise = prisma.campaign.aggregate(activeCampaignsBudgetQuery);

    const finishedCampaignsCountQuery = {
      where: {
        campaignStatus: CampaignStatus.FINISHED,
        status: Status.ACTIVE,
        brand: { status: Status.ACTIVE },
      },
    };
    const finishedCampaignsCountPromise = prisma.campaign.count(finishedCampaignsCountQuery);

    const userWalletsQuery = {
      where: {
        status: Status.ACTIVE,
        account: {
          status: Status.ACTIVE,
          role: {
            in: [Role.BRAND, Role.CREATOR],
          },
        },
      },
      select: {
        balance: true,
        account: {
          select: {
            role: true,
          },
        },
      },
    };
    const userWalletsPromise = prisma.wallet.findMany(userWalletsQuery);

    const totalCreatorRewardsPaidQuery: Prisma.WalletTransactionAggregateArgs = {
      where: {
        type: WalletTransactionType.CAMPAIGN_EARNING,
        status: Status.ACTIVE,
      },
      _sum: {
        amount: true,
      },
    };
    const totalCreatorRewardsPaidPromise = prisma.walletTransaction.aggregate(totalCreatorRewardsPaidQuery);

    const totalApprovedWithdrawalsAmountQuery: Prisma.PayoutRequestAggregateArgs = {
      where: {
        payoutStatus: PayoutStatus.APPROVED,
        status: Status.ACTIVE,
      },
      _sum: {
        amount: true,
      },
    };
    const totalApprovedWithdrawalsAmountPromise = prisma.payoutRequest.aggregate(totalApprovedWithdrawalsAmountQuery);

    const totalApprovedTopUpsAmountQuery: Prisma.TopUpRequestAggregateArgs = {
      where: {
        status: PaymentStatus.APPROVED,
        recordStatus: Status.ACTIVE,
      },
      _sum: {
        totalPayable: true,
      },
    };
    const totalApprovedTopUpsAmountPromise = prisma.topUpRequest.aggregate(totalApprovedTopUpsAmountQuery);

    const totalVerifiedViewsQuery: Prisma.SubmissionAggregateArgs = {
      where: {
        status: Status.ACTIVE,
        submissionStatus: {
          in: [SubmissionStatus.APPROVED, SubmissionStatus.VERIFIED],
        },
        campaign: {
          status: Status.ACTIVE,
        },
      },
      _sum: {
        verifiedViews: true,
      },
    };
    const totalVerifiedViewsPromise = prisma.submission.aggregate(totalVerifiedViewsQuery);

    const totalCreatorsCountQuery = {
      where: {
        status: Status.ACTIVE,
        account: { status: Status.ACTIVE },
      },
    };
    const totalCreatorsCountPromise = prisma.creator.count(totalCreatorsCountQuery);

    const totalBrandsCountQuery = {
      where: {
        status: Status.ACTIVE,
        account: { status: Status.ACTIVE },
      },
    };
    const totalBrandsCountPromise = prisma.brand.count(totalBrandsCountQuery);

    const verifiedTikTokCreatorsCountQuery = {
      where: {
        platform: Platform.TIKTOK,
        isVerified: true,
        status: Status.ACTIVE,
        creator: {
          status: Status.ACTIVE,
          account: { status: Status.ACTIVE },
        },
      },
    };
    const verifiedTikTokCreatorsCountPromise = prisma.creatorSocialAccount.count(verifiedTikTokCreatorsCountQuery);

    // 7. Triage Preview Items
    const pendingWithdrawalsQuery = {
      where: {
        payoutStatus: PayoutStatus.PENDING,
        status: Status.ACTIVE,
        wallet: {
          status: Status.ACTIVE,
          account: { status: Status.ACTIVE },
        },
      },
      select: ADMIN_WITHDRAWAL_SELECT,
      orderBy: [
        { createdAt: 'asc' as const },
      ],
      take: 20,
    };
    const pendingWithdrawalsPromise = prisma.payoutRequest.findMany(pendingWithdrawalsQuery);

    const previewTopUpsQuery = {
      where: {
        status: PaymentStatus.SUBMITTED,
        recordStatus: Status.ACTIVE,
        wallet: {
          status: Status.ACTIVE,
          account: {
            status: Status.ACTIVE,
            brand: { status: Status.ACTIVE },
          },
        },
      },
      select: ADMIN_TOPUP_SELECT,
      orderBy: {
        createdAt: 'asc' as const,
      },
      take: DASHBOARD_PREVIEW_LIMIT,
    };
    const previewTopUpsPromise = prisma.topUpRequest.findMany(previewTopUpsQuery);

    const previewKycQuery = {
      where: {
        verificationStatus: VerificationStatus.PENDING,
        status: Status.ACTIVE,
        wallet: {
          status: Status.ACTIVE,
          account: { status: Status.ACTIVE },
        },
      },
      select: ADMIN_KYC_SELECT,
      orderBy: {
        createdAt: 'asc' as const,
      },
      take: DASHBOARD_PREVIEW_LIMIT,
    };
    const previewKycPromise = prisma.brandPayoutAccount.findMany(previewKycQuery);

    const moderationCampaignsPreviewQuery = {
      where: {
        campaignStatus: CampaignStatus.IN_REVIEW,
        status: Status.ACTIVE,
        brand: { status: Status.ACTIVE },
      },
      select: {
        id: true,
        title: true,
        budget: true,
        campaignStatus: true,
        payments: {
          where: { status: Status.ACTIVE },
          orderBy: { createdAt: 'desc' as const },
          take: 1,
          select: {
            paymentStatus: true,
          },
        },
        createdAt: true,
        brand: {
          select: {
            companyName: true,
            logoUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc' as const,
      },
      take: DASHBOARD_PREVIEW_LIMIT,
    };
    const moderationCampaignsPreviewPromise = prisma.campaign.findMany(moderationCampaignsPreviewQuery);

    const recentTransactionsQuery = {
      where: {
        status: Status.ACTIVE,
        wallet: {
          status: Status.ACTIVE,
          account: { status: Status.ACTIVE },
        },
      },
      select: {
        id: true,
        referenceCode: true,
        type: true,
        amount: true,
        createdAt: true,
        transactionDate: true,
        wallet: {
          select: {
            account: {
              select: {
                role: true,
                brand: { select: { companyName: true } },
                creator: { select: { fullName: true } },
              },
            },
          },
        },
      },
      orderBy: {
        transactionDate: 'desc' as const,
      },
      take: DASHBOARD_PREVIEW_LIMIT,
    };
    const recentTransactionsPromise = prisma.walletTransaction.findMany(recentTransactionsQuery);

    const [
      [
        campaignInReviewCount,
        campaignManualPaymentCount,
        campaignRevisionCount,
        settlementCampaigns,
        topUpsSubmittedCount,
        topUpsSubmittedSum,
        topUpsPendingCount,
        withdrawalsPendingCount,
        withdrawalsPendingSum,
        withdrawalsCancellationCount,
        kycPendingCount,
        kycPendingCreatorCount,
        kycPendingBrandCount,
        activeCampaignsBudget,
        activeCampaignsCount,
        finishedCampaignsCount,
        userWallets,
        totalCreatorRewardsPaid,
        totalApprovedWithdrawalsAmount,
        totalApprovedTopUpsAmount,
        totalVerifiedViews,
        totalCreatorsCount,
        totalBrandsCount,
        verifiedTikTokCreatorsCount,
      ],
      [
        rawPendingWithdrawals,
        rawSubmittedTopUps,
        rawPendingKyc,
        rawModerationCampaigns,
        rawRecentTransactions,
      ],
    ] = await Promise.all([
      Promise.all([
        campaignInReviewCountPromise,
        campaignManualPaymentCountPromise,
        campaignRevisionCountPromise,
        settlementCampaignsPromise,
        topUpsSubmittedCountPromise,
        topUpsSubmittedSumPromise,
        topUpsPendingCountPromise,
        withdrawalsPendingCountPromise,
        withdrawalsPendingSumPromise,
        withdrawalsCancellationCountPromise,
        kycPendingCountPromise,
        kycPendingCreatorCountPromise,
        kycPendingBrandCountPromise,
        activeCampaignsBudgetPromise,
        activeCampaignsCountPromise,
        finishedCampaignsCountPromise,
        userWalletsPromise,
        totalCreatorRewardsPaidPromise,
        totalApprovedWithdrawalsAmountPromise,
        totalApprovedTopUpsAmountPromise,
        totalVerifiedViewsPromise,
        totalCreatorsCountPromise,
        totalBrandsCountPromise,
        verifiedTikTokCreatorsCountPromise,
      ] as const),
      Promise.all([
        pendingWithdrawalsPromise,
        previewTopUpsPromise,
        previewKycPromise,
        moderationCampaignsPreviewPromise,
        recentTransactionsPromise,
      ] as const),
    ]);

    // Compute Settlement queue counts and candidate campaigns
    const now = new Date();
    let settlementNeedSettlementCount = 0;
    let settlementBudgetFullCount = 0;
    let settlementExpiredCount = 0;
    let unsettledBudgetTotal = 0;

    const actionableSettlementCampaigns: AdminDashboardCampaignActionItemDto[] = [];

    for (const campaign of settlementCampaigns) {
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

      const freezeReason = DetermineCampaignFreezeReason(
        campaign.campaignStatus,
        budget,
        allocatedEarnings,
        campaign.endDate,
        now,
      );

      const isBudgetFull = freezeReason === FREEZE_REASON.BUDGET_FULL;
      const isExpired = freezeReason === FREEZE_REASON.EXPIRED;
      const needsSettlement =
        isBudgetFull ||
        isExpired ||
        (campaign.campaignStatus === CampaignStatus.ACTIVE && approvedSubs.length > 0);

      if (isBudgetFull) {
        settlementBudgetFullCount += 1;
      }
      if (isExpired) {
        settlementExpiredCount += 1;
      }
      if (needsSettlement) {
        settlementNeedSettlementCount += 1;
        unsettledBudgetTotal += budget;
      }

      if (needsSettlement) {
        const tagLabel = isBudgetFull
          ? 'Kuota Penuh · Siap Settlement'
          : isExpired
            ? 'Periode Berakhir · Siap Settlement'
            : 'Submisi Disetujui · Siap Audit';

        const latestPayment = campaign.payments?.[0];
        actionableSettlementCampaigns.push({
          id: campaign.id,
          title: campaign.title ?? 'Kampanye Tanpa Judul',
          brandName: campaign.brand.companyName ?? 'Brand',
          brandLogoUrl: campaign.brand.logoUrl,
          budget,
          campaignStatus: campaign.campaignStatus,
          freezeReason,
          paymentStatus: latestPayment?.paymentStatus ?? PaymentStatus.APPROVED,
          actionType: 'SETTLEMENT',
          tagLabel,
          createdAt: campaign.createdAt,
        });
      }
    }

    // Moderation campaign preview items
    const moderationActionItems: AdminDashboardCampaignActionItemDto[] = rawModerationCampaigns.map(
      (c) => {
        const latestPayment = c.payments?.[0];
        const isManualTransfer = latestPayment?.paymentStatus === PaymentStatus.SUBMITTED;
        const tagLabel = isManualTransfer
          ? 'Perlu Moderasi (Transfer Manual)'
          : 'Perlu Moderasi (Saldo Dompet)';

        return {
          id: c.id,
          title: c.title ?? 'Kampanye Tanpa Judul',
          brandName: c.brand.companyName ?? 'Brand',
          brandLogoUrl: c.brand.logoUrl,
          budget: Number(c.budget ?? 0),
          campaignStatus: c.campaignStatus,
          freezeReason: FREEZE_REASON.ACTIVE_RUNNING,
          paymentStatus: latestPayment?.paymentStatus ?? PaymentStatus.PENDING,
          actionType: 'MODERATION',
          tagLabel,
          createdAt: c.createdAt,
        };
      },
    );

    // Combine actionable campaigns: settlement campaigns + moderation campaigns, sorted oldest first (FIFO) and capped at DASHBOARD_PREVIEW_LIMIT
    const combinedActionableCampaigns = [
      ...actionableSettlementCampaigns,
      ...moderationActionItems,
    ]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, DASHBOARD_PREVIEW_LIMIT);

    // Sort pending withdrawals: cancellationRequestedAt != null first, then oldest createdAt
    const sortedPendingWithdrawals: AdminDashboardWithdrawalActionItemDto[] = [
      ...rawPendingWithdrawals,
    ]
      .sort((a, b) => {
        const aHasCancel = a.cancellationRequestedAt != null ? 1 : 0;
        const bHasCancel = b.cancellationRequestedAt != null ? 1 : 0;
        if (aHasCancel !== bHasCancel) {
          return bHasCancel - aHasCancel;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      })
      .slice(0, DASHBOARD_PREVIEW_LIMIT)
      .map((w) => {
        const account = w.wallet.account;
        const isBrand = account.role === Role.BRAND;
        const userName = isBrand
          ? (account.brand?.companyName || 'Brand')
          : (account.creator?.fullName || 'Kreator');
        const userAvatarUrl = isBrand
          ? (account.brand?.logoUrl ?? null)
          : (account.creator?.avatarUrl ?? null);

        return {
          id: w.id,
          referenceCode: w.referenceCode,
          userName,
          userRole: account.role,
          userAvatarUrl,
          bankName: w.accountProvider,
          accountNumber: w.accountNumber,
          amount: Number(w.amount),
          cancellationRequestedAt: w.cancellationRequestedAt,
          createdAt: w.createdAt,
        };
      });

    // Top-up action items
    const topUpActionItems: AdminDashboardTopUpActionItemDto[] = rawSubmittedTopUps.map((t) => ({
      id: t.id,
      referenceCode: t.referenceCode,
      brandName: t.wallet.account.brand?.companyName ?? 'Brand',
      brandLogoUrl: t.wallet.account.brand?.logoUrl ?? null,
      senderBank: t.senderBank,
      senderAccountName: t.senderAccountName,
      totalPayable: Number(t.totalPayable),
      amount: Number(t.amount),
      createdAt: t.createdAt,
    }));

    // KYC action items
    const kycActionItems: AdminDashboardKycActionItemDto[] = rawPendingKyc.map((k) => {
      const account = k.wallet.account;
      const isBrand = account.role === Role.BRAND;
      const userName = isBrand
        ? (account.brand?.companyName || 'Brand')
        : (account.creator?.fullName || 'Kreator');
      const userAvatarUrl = isBrand
        ? (account.brand?.logoUrl ?? null)
        : (account.creator?.avatarUrl ?? null);

      const isHolderNameMismatch = CheckHolderNameMismatch(k.accountHolderName, userName);

      return {
        id: k.id,
        userName,
        userRole: account.role,
        userAvatarUrl,
        accountType: k.accountType,
        provider: k.provider,
        accountNumber: k.accountNumber,
        accountHolderName: k.accountHolderName,
        isHolderNameMismatch,
        createdAt: k.createdAt,
      };
    });

    // Recent transactions
    const transactionActionItems: AdminDashboardTransactionActionItemDto[] = rawRecentTransactions.map(
      (tx) => {
        const account = tx.wallet.account;
        const isBrand = account.role === Role.BRAND;
        const userName = isBrand
          ? (account.brand?.companyName || 'Brand')
          : (account.creator?.fullName || 'Kreator');

        return {
          id: tx.id,
          referenceCode: tx.referenceCode,
          type: tx.type,
          amount: Number(tx.amount),
          userName,
          userRole: account.role,
          createdAt: tx.createdAt,
          transactionDate: tx.transactionDate,
        };
      },
    );

    // Calculate wallet balances (Brand vs Creator)
    let brandWalletBalance = 0;
    let creatorWalletBalance = 0;
    for (const w of userWallets) {
      const bal = Number(w.balance);
      if (w.account.role === Role.BRAND) {
        brandWalletBalance += bal;
      } else if (w.account.role === Role.CREATOR) {
        creatorWalletBalance += bal;
      }
    }
    const totalUserWalletBalance = brandWalletBalance + creatorWalletBalance;

    // Total actionable tasks count across all 5 queues
    const totalActionableCount =
      campaignInReviewCount +
      settlementNeedSettlementCount +
      topUpsSubmittedCount +
      withdrawalsPendingCount +
      kycPendingCount;

    const summary: AdminDashboardSummaryDto = {
      admin: {
        id: admin.id,
        accountId: admin.accountId,
        name: admin.fullName,
        email: admin.account.email,
      },
      queues: {
        totalActionableCount,
        campaigns: {
          inReviewCount: campaignInReviewCount,
          manualPaymentSubmittedCount: campaignManualPaymentCount,
          revisionCount: campaignRevisionCount,
        },
        settlements: {
          needSettlementCount: settlementNeedSettlementCount,
          budgetFullCount: settlementBudgetFullCount,
          expiredCount: settlementExpiredCount,
          unsettledBudgetTotal,
        },
        topUps: {
          submittedCount: topUpsSubmittedCount,
          submittedTotalPayable: Number(topUpsSubmittedSum._sum?.totalPayable ?? 0),
          pendingUploadCount: topUpsPendingCount,
        },
        withdrawals: {
          pendingCount: withdrawalsPendingCount,
          pendingTotalAmount: Number(withdrawalsPendingSum._sum?.amount ?? 0),
          cancellationRequestedCount: withdrawalsCancellationCount,
        },
        kyc: {
          pendingCount: kycPendingCount,
          pendingCreatorCount: kycPendingCreatorCount,
          pendingBrandCount: kycPendingBrandCount,
        },
      },
      metrics: {
        lockedCampaignBudget: Number(activeCampaignsBudget._sum?.budget ?? 0),
        activeCampaignsCount,
        finishedCampaignsCount,
        totalUserWalletBalance,
        brandWalletBalance,
        creatorWalletBalance,
        totalCreatorRewardsPaid: Number(totalCreatorRewardsPaid._sum?.amount ?? 0),
        totalApprovedWithdrawalsAmount: Number(totalApprovedWithdrawalsAmount._sum?.amount ?? 0),
        totalApprovedTopUpsAmount: Number(totalApprovedTopUpsAmount._sum?.totalPayable ?? 0),
        totalVerifiedViews: totalVerifiedViews._sum?.verifiedViews ?? 0,
        totalCreatorsCount,
        totalBrandsCount,
        verifiedTikTokCreatorsCount,
      },
      actionItems: {
        pendingWithdrawals: sortedPendingWithdrawals,
        submittedTopUps: topUpActionItems,
        pendingKycRequests: kycActionItems,
        actionableCampaigns: combinedActionableCampaigns,
        recentTransactions: transactionActionItems,
      },
    };

    SendSuccess(res, summary, ADMIN_MESSAGES.GET_ADMIN_DASHBOARD_SUCCESS);
  } catch (err) {
    next(err);
  }
}




