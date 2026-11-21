import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';
import { CampaignStatus, NotificationType, PaymentStatus, Role, Status } from '../../generated/prisma/enums.js';
import { SendError, SendSuccess } from '../../utils/api-response.js';
import { prisma } from '../../utils/prisma.js';
import { NotifyAdminPendingItem } from '../../services/notification/notification.dispatcher.js';
import {
  ALLOWED_PAYMENT_PROOF_MIME_TYPES,
  ALLOWED_THUMBNAIL_MIME_TYPES,
  CAMPAIGN_CARD_DRAFT_SELECT,
  CAMPAIGN_CARD_ESCROW_SELECT,
  CAMPAIGN_DETAIL_ESCROW_SELECT,
  CAMPAIGN_DETAIL_SELECT,
  CAMPAIGN_MESSAGES,
  DEFAULT_KLIPDAY_BANK_ACCOUNT_NAME,
  DEFAULT_KLIPDAY_BANK_ACCOUNT_NO,
  DEFAULT_KLIPDAY_BANK_NAME,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  EDITABLE_CAMPAIGN_STATUSES,
  FEATURED_CAMPAIGNS_LIMIT,
  FEATURED_CAMPAIGNS_MIN_COUNT,
  FINANCIAL_LOCKED_PAYMENT_STATUSES,
  MAX_LIMIT,
  MAX_PAYMENT_PROOF_SIZE_BYTES,
  MAX_THUMBNAIL_SIZE_BYTES,
  SUBMITTABLE_CAMPAIGN_STATUSES,
} from './campaign.constants.js';
import {
  BuildCampaignEditFields,
  BuildCampaignsOrderBy,
  BuildCampaignsWhereClause,
  CampaignTransactionError,
  DeleteSupabaseObjectIfInBucket,
  EnrichCampaignEscrowMetrics,
  ExecuteBankTransferConfirmInTx,
  ExecuteCampaignSubmissionInTx,
  ExecuteVerifyCampaignPaymentInTx,
  ExecuteWalletPaymentInTx,
  GeneratePaymentUniqueCode,
  StreamCampaignImageUpload,
} from './campaign.helper.js';
import type { CampaignsPaginatedData, CampaignStatusCounts, CampaignPaymentDetailsResponse } from './campaign.types.js';
import {
  ValidateAdminVerifyPaymentBody,
  ValidateBankTransferPaymentBody,
  ValidateCampaignDateLogic,
  ValidateCampaignEditBody,
  ValidateCampaignQuery,
  ValidateCampaignRewardLogic,
  ValidateCampaignSubmitCompleteness,
  ValidateWalletPaymentBody,
} from './campaign.validators.js';

/**
 * Checks whether a Prisma error represents P2025 (record not found / optimistic lock condition missed).
 *
 * @param err - Caught error object.
 * @returns True if `err` is a Prisma `P2025` error.
 */
function IsPrismaRecordNotFoundError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025';
}

/**
 * Handles `POST /campaigns`: creates an empty draft campaign for the
 * authenticated brand and returns its id, which the client uses to continue
 * the creation wizard step by step.
 *
 * @param req - Express request with the authenticated account from `RequireAuth`.
 * @param res - Express response object.
 * @param next - Express next function, used to forward unexpected errors.
 */
export async function InitializeCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CAMPAIGN_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, CAMPAIGN_MESSAGES.ONLY_BRANDS_CAN_CREATE, 403);
      return;
    }

    const findBrandQuery = {
      where: { accountId: account.sub, status: Status.ACTIVE },
      select: { id: true },
    };

    const brand = await prisma.brand.findFirst(findBrandQuery);

    if (!brand) {
      SendError(res, CAMPAIGN_MESSAGES.ONLY_BRANDS_CAN_CREATE, 403);
      return;
    }

    const createCampaignPayload = {
      data: {
        brandId: brand.id,
        status: Status.ACTIVE,
        campaignStatus: CampaignStatus.DRAFT,
      },
      select: { id: true },
    };

    const campaign = await prisma.campaign.create(createCampaignPayload);

    SendSuccess(res, { id: campaign.id }, CAMPAIGN_MESSAGES.INITIALIZE_SUCCESS, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `PATCH /campaigns/:id/edit`: the single edit endpoint of the
 * creation wizard. The body carries only the fields of the current wizard
 * step: every field is optional, and only the sent fields are validated
 * and written in one update.
 *
 * @param req - Express request with the authenticated account and the edit body.
 * @param res - Express response object.
 * @param next - Express next function, used to forward unexpected errors.
 */
export async function EditCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CAMPAIGN_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, CAMPAIGN_MESSAGES.ONLY_BRANDS_CAN_EDIT, 403);
      return;
    }

    const campaignId = req.params.id as string;

    const findCampaignQuery = {
      where: {
        id: campaignId,
        status: Status.ACTIVE,
        brand: { accountId: account.sub, status: Status.ACTIVE },
      },
      select: {
        id: true,
        campaignStatus: true,
        updatedAt: true,
        thumbnailUrl: true,
        minViews: true,
        maxViews: true,
        budget: true,
        cpm: true,
        startDate: true,
        endDate: true,
        payments: {
          where: { status: Status.ACTIVE },
          orderBy: { createdAt: 'desc' as const },
          take: 1,
          select: {
            id: true,
            paymentStatus: true,
            uniqueCode: true,
          },
        },
      },
    };

    const ownedCampaign = await prisma.campaign.findFirst(findCampaignQuery);

    if (!ownedCampaign) {
      SendError(res, CAMPAIGN_MESSAGES.CAMPAIGN_NOT_FOUND, 404);
      return;
    }

    const isEditableStatus = EDITABLE_CAMPAIGN_STATUSES.includes(
      ownedCampaign.campaignStatus as (typeof EDITABLE_CAMPAIGN_STATUSES)[number],
    );

    if (!isEditableStatus) {
      SendError(res, CAMPAIGN_MESSAGES.CANNOT_EDIT_CURRENT_STATUS, 400);
      return;
    }

    const input = ValidateCampaignEditBody(req.body);
    if (typeof input === 'string') {
      SendError(res, input, 400);
      return;
    }

    if (
      input.expectedUpdatedAt !== undefined &&
      ownedCampaign.updatedAt instanceof Date &&
      new Date(input.expectedUpdatedAt).getTime() !== ownedCampaign.updatedAt.getTime()
    ) {
      SendError(res, CAMPAIGN_MESSAGES.CONFLICT_STALE_CAMPAIGN, 409);
      return;
    }

    const latestPayment = ownedCampaign.payments?.[0];
    const isFinancialLocked = latestPayment
      ? FINANCIAL_LOCKED_PAYMENT_STATUSES.includes(
          latestPayment.paymentStatus as (typeof FINANCIAL_LOCKED_PAYMENT_STATUSES)[number],
        )
      : false;
    const isPaymentApproved = latestPayment?.paymentStatus === PaymentStatus.APPROVED;

    if (isFinancialLocked) {
      const isAttemptingBudgetChange =
        input.budget !== undefined && Number(input.budget) !== Number(ownedCampaign.budget ?? 0);
      const isAttemptingCpmChange =
        input.cpm !== undefined && Number(input.cpm) !== Number(ownedCampaign.cpm ?? 0);

      if (isAttemptingBudgetChange || isAttemptingCpmChange) {
        SendError(res, CAMPAIGN_MESSAGES.BUDGET_LOCKED_AFTER_PAYMENT, 400);
        return;
      }
    }

    const rewardError = ValidateCampaignRewardLogic(input, ownedCampaign);
    if (rewardError) {
      SendError(res, rewardError, 400);
      return;
    }

    const dateError = ValidateCampaignDateLogic(input, {
      ...ownedCampaign,
      isPaymentApproved,
    });
    if (dateError) {
      SendError(res, dateError, 400);
      return;
    }

    const updateFields = BuildCampaignEditFields(input);
    const optimisticWhere: Prisma.CampaignWhereUniqueInput = {
      id: ownedCampaign.id,
      status: Status.ACTIVE,
      campaignStatus: ownedCampaign.campaignStatus,
      ...(input.expectedUpdatedAt !== undefined && ownedCampaign.updatedAt instanceof Date
        ? { updatedAt: ownedCampaign.updatedAt }
        : {}),
    };

    const shouldSyncPendingPayment =
      ownedCampaign.campaignStatus === CampaignStatus.AWAITING_PAYMENT &&
      input.budget !== undefined &&
      Number(input.budget) !== Number(ownedCampaign.budget ?? 0) &&
      latestPayment !== undefined &&
      (latestPayment.paymentStatus === PaymentStatus.PENDING ||
        latestPayment.paymentStatus === PaymentStatus.REJECTED);

    const updated = shouldSyncPendingPayment
      ? await prisma.$transaction(async (tx) => {
          const validUniqueCode =
            latestPayment.uniqueCode >= 100 && latestPayment.uniqueCode <= 999
              ? latestPayment.uniqueCode
              : GeneratePaymentUniqueCode();
          const newBudget = Number(input.budget);

          await tx.campaignPayment.update({
            where: { id: latestPayment.id },
            data: {
              amount: newBudget,
              uniqueCode: validUniqueCode,
              totalPayable: newBudget + validUniqueCode,
            },
          });

          const savedCampaign = await tx.campaign.update({
            where: optimisticWhere,
            data: updateFields,
            select: CAMPAIGN_DETAIL_SELECT,
          });

          return savedCampaign;
        })
      : await prisma.campaign.update({
          where: optimisticWhere,
          data: updateFields,
          select: CAMPAIGN_DETAIL_SELECT,
        });

    if (
      input.thumbnailUrl &&
      ownedCampaign.thumbnailUrl &&
      input.thumbnailUrl !== ownedCampaign.thumbnailUrl
    ) {
      void DeleteSupabaseObjectIfInBucket(ownedCampaign.thumbnailUrl, ownedCampaign.id);
    }

    SendSuccess(res, updated, CAMPAIGN_MESSAGES.UPDATE_SUCCESS);
  } catch (err) {
    if (IsPrismaRecordNotFoundError(err)) {
      SendError(res, CAMPAIGN_MESSAGES.CONFLICT_STALE_CAMPAIGN, 409);
      return;
    }
    if (err instanceof CampaignTransactionError) {
      SendError(res, err.message, err.statusCode);
      return;
    }
    next(err);
  }
}

/**
 * Handles `GET /campaigns`: retrieves a paginated list of campaign cards with
 * keyword search, filters (category, campaign type, platform, status), and sorting.
 *
 * Role boundaries:
 * - Brand: sees their own campaigns across all lifecycle statuses.
 * - Creator: sees only campaigns with active lifecycle status and active brand.
 * - Admin: sees all active campaigns with optional status filter.
 *
 * @param req - Express request with the authenticated account and query parameters.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetCampaigns(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CAMPAIGN_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND && account.role !== Role.CREATOR && account.role !== Role.ADMIN) {
      SendError(res, CAMPAIGN_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const queryValidationResult = ValidateCampaignQuery(req.query);
    if (typeof queryValidationResult === 'string') {
      SendError(res, queryValidationResult, 400);
      return;
    }

    const queryInput = queryValidationResult;
    const page = queryInput.page ?? DEFAULT_PAGE;
    const rawLimit = queryInput.limit ?? DEFAULT_LIMIT;
    const limit = Math.min(rawLimit, MAX_LIMIT);
    const sort = queryInput.sort ?? 'latest';
    const skip = (page - 1) * limit;

    const whereClause = BuildCampaignsWhereClause(account, queryInput);
    const orderByClause = BuildCampaignsOrderBy(sort);
    const isBrandDraftOrRevisionQuery =
      account.role === Role.BRAND &&
      (queryInput.campaignStatus === CampaignStatus.DRAFT ||
        queryInput.campaignStatus === CampaignStatus.REVISION);
    const cardSelect = isBrandDraftOrRevisionQuery
      ? CAMPAIGN_CARD_DRAFT_SELECT
      : CAMPAIGN_CARD_ESCROW_SELECT;

    const [campaigns, totalCount] = await prisma.$transaction([
      prisma.campaign.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip,
        take: limit,
        select: cardSelect,
      }),
      prisma.campaign.count({
        where: whereClause,
      }),
    ]);

    const hideBudgetAmounts = account.role === Role.CREATOR;
    const enrichedCampaigns = campaigns.map((campaign) =>
      EnrichCampaignEscrowMetrics(campaign, { hideBudgetAmounts }),
    );

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const responsePayload: CampaignsPaginatedData = {
      items: enrichedCampaigns as never,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    };

    SendSuccess(res, responsePayload, CAMPAIGN_MESSAGES.RETRIEVED_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `GET /campaigns/featured`: retrieves a list of 3-5 featured campaigns for the hero carousel.
 * Pulls actively featured campaigns, backfilling with top active campaigns if fewer than 3 exist.
 *
 * @param req - Express request with the authenticated account.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetFeaturedCampaigns(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CAMPAIGN_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND && account.role !== Role.CREATOR && account.role !== Role.ADMIN) {
      SendError(res, CAMPAIGN_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const now = new Date();
    const featuredWhereClause: Prisma.CampaignWhereInput = {
      status: Status.ACTIVE,
      campaignStatus: CampaignStatus.ACTIVE,
      isFeatured: true,
      brand: { status: Status.ACTIVE },
      AND: [
        {
          OR: [{ featuredUntil: null }, { featuredUntil: { gt: now } }],
        },
        {
          OR: [{ endDate: null }, { endDate: { gt: now } }],
        },
      ],
    };

    const featuredOrderByClause: Prisma.CampaignOrderByWithRelationInput[] = [
      { featuredOrder: { sort: 'asc', nulls: 'last' } },
      { createdAt: 'desc' },
    ];

    const primaryQuery = {
      where: featuredWhereClause,
      orderBy: featuredOrderByClause,
      take: FEATURED_CAMPAIGNS_LIMIT,
      select: CAMPAIGN_CARD_ESCROW_SELECT,
    };

    const featuredCampaigns = await prisma.campaign.findMany(primaryQuery);

    if (featuredCampaigns.length < FEATURED_CAMPAIGNS_MIN_COUNT) {
      const existingIds = featuredCampaigns.map((campaign) => campaign.id);
      const backfillTake = FEATURED_CAMPAIGNS_LIMIT - featuredCampaigns.length;

      const backfillQuery = {
        where: {
          status: Status.ACTIVE,
          campaignStatus: CampaignStatus.ACTIVE,
          brand: { status: Status.ACTIVE },
          id: { notIn: existingIds },
          AND: [
            {
              OR: [{ endDate: null }, { endDate: { gt: now } }],
            },
          ],
        },
        orderBy: [
          { cpm: { sort: 'desc' as const, nulls: 'last' as const } },
          { budget: { sort: 'desc' as const, nulls: 'last' as const } },
          { createdAt: 'desc' as const },
        ],
        take: backfillTake,
        select: CAMPAIGN_CARD_ESCROW_SELECT,
      };

      const backfillCampaigns = await prisma.campaign.findMany(backfillQuery);
      const combinedCampaigns = [...featuredCampaigns, ...backfillCampaigns];
      const hideBudgetAmounts = account.role === Role.CREATOR;
      const enrichedCombined = combinedCampaigns.map((campaign) =>
        EnrichCampaignEscrowMetrics(campaign, { hideBudgetAmounts }),
      );

      SendSuccess(res, enrichedCombined, CAMPAIGN_MESSAGES.FEATURED_RETRIEVED_SUCCESS);
      return;
    }

    const hideBudgetAmounts = account.role === Role.CREATOR;
    const enrichedFeatured = featuredCampaigns.map((campaign) =>
      EnrichCampaignEscrowMetrics(campaign, { hideBudgetAmounts }),
    );

    SendSuccess(res, enrichedFeatured, CAMPAIGN_MESSAGES.FEATURED_RETRIEVED_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `GET /campaigns/counts`: aggregates total campaign count grouped by
 * lifecycle status (`campaignStatus`) for the authenticated brand or admin.
 *
 * @param req - Express request with the authenticated account.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetCampaignStatusCounts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CAMPAIGN_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND && account.role !== Role.ADMIN) {
      SendError(res, CAMPAIGN_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const whereClause: Prisma.CampaignWhereInput = {
      status: Status.ACTIVE,
      brand: { status: Status.ACTIVE },
    };

    if (account.role === Role.BRAND) {
      whereClause.brand = { accountId: account.sub, status: Status.ACTIVE };
    }

    const groupedCounts = await prisma.campaign.groupBy({
      by: ['campaignStatus'],
      where: whereClause,
      _count: {
        _all: true,
      },
    });

    const statusCounts: CampaignStatusCounts = {
      [CampaignStatus.DRAFT]: 0,
      [CampaignStatus.AWAITING_PAYMENT]: 0,
      [CampaignStatus.IN_REVIEW]: 0,
      [CampaignStatus.REVISION]: 0,
      [CampaignStatus.REJECTED]: 0,
      [CampaignStatus.ACTIVE]: 0,
      [CampaignStatus.FINISHED]: 0,
    };

    for (const group of groupedCounts) {
      statusCounts[group.campaignStatus] = group._count?._all ?? 0;
    }

    SendSuccess(res, statusCounts, CAMPAIGN_MESSAGES.STATUS_COUNTS_RETRIEVED_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `GET /campaigns/:id`: retrieves campaign details (including active
 * materials and brief) for display.
 *
 * @param req - Express request with the authenticated account and campaign id parameter.
 * @param res - Express response object.
 * @param next - Express next function, used to forward unexpected errors.
 */
export async function GetCampaignById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CAMPAIGN_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    const campaignId = req.params.id as string;

    const whereClause: Prisma.CampaignWhereInput = {
      id: campaignId,
      status: Status.ACTIVE,
      brand: { status: Status.ACTIVE },
    };

    if (account.role === Role.BRAND) {
      whereClause.brand = { accountId: account.sub, status: Status.ACTIVE };
    } else if (account.role === Role.CREATOR) {
      whereClause.campaignStatus = {
        in: [CampaignStatus.ACTIVE, CampaignStatus.FINISHED],
      };
    }

    const findDetailQuery = {
      where: whereClause,
      select: CAMPAIGN_DETAIL_ESCROW_SELECT,
    };

    const campaign = await prisma.campaign.findFirst(findDetailQuery);

    if (!campaign) {
      SendError(res, CAMPAIGN_MESSAGES.CAMPAIGN_NOT_FOUND, 404);
      return;
    }

    const hideBudgetAmounts = account.role === Role.CREATOR;
    const enrichedCampaign = EnrichCampaignEscrowMetrics(campaign, { hideBudgetAmounts });

    SendSuccess(res, enrichedCampaign, CAMPAIGN_MESSAGES.DETAIL_RETRIEVED_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /campaigns/:id/submit`: verifies that all wizard steps are
 * complete and valid, then transitions the campaign status from DRAFT or REVISION to IN_REVIEW.
 *
 * @param req - Express request with the authenticated account and campaign id parameter.
 * @param res - Express response object.
 * @param next - Express next function, used to forward unexpected errors.
 */
export async function SubmitCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CAMPAIGN_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, CAMPAIGN_MESSAGES.ONLY_BRANDS_CAN_SUBMIT, 403);
      return;
    }

    const campaignId = req.params.id as string;

    const findCampaignQuery = {
      where: {
        id: campaignId,
        status: Status.ACTIVE,
        brand: { accountId: account.sub, status: Status.ACTIVE },
      },
      include: {
        materials: {
          where: { status: Status.ACTIVE },
        },
        brief: {
          where: { status: Status.ACTIVE },
        },
      },
    };

    const ownedCampaign = await prisma.campaign.findFirst(findCampaignQuery);

    if (!ownedCampaign) {
      SendError(res, CAMPAIGN_MESSAGES.CAMPAIGN_NOT_FOUND, 404);
      return;
    }

    if (!SUBMITTABLE_CAMPAIGN_STATUSES.includes(ownedCampaign.campaignStatus as (typeof SUBMITTABLE_CAMPAIGN_STATUSES)[number])) {
      SendError(res, CAMPAIGN_MESSAGES.CANNOT_SUBMIT_CURRENT_STATUS, 400);
      return;
    }

    const completenessError = ValidateCampaignSubmitCompleteness(ownedCampaign);
    if (completenessError) {
      SendError(res, completenessError, 400);
      return;
    }

    const budgetAmount = Number(ownedCampaign.budget ?? 0);
    const destinationBank = process.env.KLIPDAY_BANK_NAME || DEFAULT_KLIPDAY_BANK_NAME;
    const destinationAccount = process.env.KLIPDAY_BANK_ACCOUNT_NO || DEFAULT_KLIPDAY_BANK_ACCOUNT_NO;

    const txResult = await prisma.$transaction((tx) =>
      ExecuteCampaignSubmissionInTx(tx, {
        campaignId: ownedCampaign.id,
        currentStatus: ownedCampaign.campaignStatus,
        budgetAmount,
        destinationBank,
        destinationAccount,
      }),
    );

    const updatedCampaign = await prisma.campaign.findFirst({
      where: { id: ownedCampaign.id, status: Status.ACTIVE },
      select: CAMPAIGN_DETAIL_SELECT,
    });

    if (txResult.isPaidRevision) {
      void NotifyAdminPendingItem({
        type: NotificationType.ADMIN_NEW_CAMPAIGN,
        title: 'Kampanye Hasil Revisi Menunggu Moderasi',
        message: `Kampanye "${ownedCampaign.title ?? 'Klipday'}" telah diperbarui dan menunggu pemeriksaan ulang.`,
        actionUrl: '/admin-dashboard/campaigns',
        metadata: { campaignId: ownedCampaign.id },
      });

      SendSuccess(res, updatedCampaign, CAMPAIGN_MESSAGES.SUBMIT_SUCCESS);
      return;
    }

    SendSuccess(res, updatedCampaign, CAMPAIGN_MESSAGES.PAYMENT_INITIALIZED_SUCCESS);
  } catch (err) {
    if (err instanceof CampaignTransactionError) {
      SendError(res, err.message, err.statusCode);
      return;
    }
    next(err);
  }
}

/**
 * Handles `POST /campaigns/:id/thumbnail`: streams the raw binary image payload
 * directly to Supabase Storage and returns the public asset URL without updating the database.
 *
 * @param req - Express request with the authenticated account from `RequireAuth`.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function UploadCampaignThumbnail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CAMPAIGN_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, CAMPAIGN_MESSAGES.ONLY_BRANDS_CAN_UPLOAD_THUMBNAIL, 403);
      return;
    }

    const campaignId = req.params.id as string;

    const findQuery = {
      where: {
        id: campaignId,
        status: Status.ACTIVE,
        brand: { accountId: account.sub, status: Status.ACTIVE },
      },
      select: { id: true, campaignStatus: true },
    };

    const ownedCampaign = await prisma.campaign.findFirst(findQuery);

    if (!ownedCampaign) {
      SendError(res, CAMPAIGN_MESSAGES.CAMPAIGN_NOT_FOUND, 404);
      return;
    }

    const canUploadThumbnail = EDITABLE_CAMPAIGN_STATUSES.includes(
      ownedCampaign.campaignStatus as (typeof EDITABLE_CAMPAIGN_STATUSES)[number],
    );

    if (!canUploadThumbnail) {
      SendError(res, CAMPAIGN_MESSAGES.CANNOT_UPLOAD_IN_CURRENT_STATUS, 400);
      return;
    }

    const uploadResult = await StreamCampaignImageUpload(req, {
      campaignId: ownedCampaign.id,
      folderPrefix: 'thumbnail',
      allowedMimeTypes: ALLOWED_THUMBNAIL_MIME_TYPES,
      maxSizeBytes: MAX_THUMBNAIL_SIZE_BYTES,
      successMessage: CAMPAIGN_MESSAGES.THUMBNAIL_UPLOAD_SUCCESS,
    });

    if (!uploadResult.ok) {
      SendError(res, uploadResult.message, uploadResult.statusCode);
      return;
    }

    SendSuccess(res, { url: uploadResult.publicUrl }, CAMPAIGN_MESSAGES.THUMBNAIL_UPLOAD_SUCCESS);
  } catch (error) {
    next(error);
  }
}

/**
 * Handles `DELETE /campaigns/:id`: soft-deletes a campaign and cascades
 * soft-deletion to all associated materials, brief, and submissions by updating
 * their `status` to `Status.DELETED` in an atomic database transaction.
 *
 * @param req - Express request with the authenticated account and campaign id parameter.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function DeleteCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CAMPAIGN_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND && account.role !== Role.ADMIN) {
      SendError(res, CAMPAIGN_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const campaignId = req.params.id as string;

    const whereClause: Prisma.CampaignWhereInput = {
      id: campaignId,
      status: Status.ACTIVE,
      brand: { status: Status.ACTIVE },
    };

    if (account.role === Role.BRAND) {
      whereClause.brand = { accountId: account.sub, status: Status.ACTIVE };
    }

    const findQuery = {
      where: whereClause,
      select: { id: true, campaignStatus: true },
    };

    const ownedCampaign = await prisma.campaign.findFirst(findQuery);

    if (!ownedCampaign) {
      SendError(res, CAMPAIGN_MESSAGES.CAMPAIGN_NOT_FOUND, 404);
      return;
    }

    if (account.role === Role.BRAND && ownedCampaign.campaignStatus !== CampaignStatus.DRAFT) {
      SendError(res, CAMPAIGN_MESSAGES.ONLY_DRAFT_CAN_BE_DELETED, 400);
      return;
    }

    await prisma.$transaction(async (tx) => {
      const deleteWhere: Prisma.CampaignWhereInput = {
        id: ownedCampaign.id,
        status: Status.ACTIVE,
        ...(account.role === Role.BRAND ? { campaignStatus: CampaignStatus.DRAFT } : {}),
      };

      const deletedCampaign = await tx.campaign.updateMany({
        where: deleteWhere,
        data: { status: Status.DELETED },
      });

      if (deletedCampaign.count === 0) {
        throw new CampaignTransactionError(
          409,
          account.role === Role.BRAND
            ? CAMPAIGN_MESSAGES.ONLY_DRAFT_CAN_BE_DELETED
            : CAMPAIGN_MESSAGES.CONFLICT_STALE_CAMPAIGN,
        );
      }

      await tx.campaignBrief.updateMany({
        where: { campaignId: ownedCampaign.id, status: Status.ACTIVE },
        data: { status: Status.DELETED },
      });
      await tx.campaignMaterial.updateMany({
        where: { campaignId: ownedCampaign.id, status: Status.ACTIVE },
        data: { status: Status.DELETED },
      });
      await tx.submission.updateMany({
        where: { campaignId: ownedCampaign.id, status: Status.ACTIVE },
        data: { status: Status.DELETED },
      });
    });

    SendSuccess(res, null, CAMPAIGN_MESSAGES.DELETE_SUCCESS);
  } catch (err) {
    if (err instanceof CampaignTransactionError) {
      SendError(res, err.message, err.statusCode);
      return;
    }
    next(err);
  }
}

/**
 * Handles `GET /campaigns/:id/payment`: retrieves campaign payment details,
 * Klipday bank account info, and authenticated brand wallet balance.
 *
 * @param req - Express request with authenticated account and campaign id.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetCampaignPaymentDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CAMPAIGN_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND && account.role !== Role.ADMIN) {
      SendError(res, CAMPAIGN_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const campaignId = req.params.id as string;

    const whereClause: Prisma.CampaignWhereInput = {
      id: campaignId,
      status: Status.ACTIVE,
      brand: { status: Status.ACTIVE },
    };

    if (account.role === Role.BRAND) {
      whereClause.brand = { accountId: account.sub, status: Status.ACTIVE };
    }

    const findCampaignQuery = {
      where: whereClause,
      select: {
        id: true,
        budget: true,
        brandId: true,
        brand: {
          select: {
            accountId: true,
          },
        },
        payments: {
          where: { status: Status.ACTIVE },
          orderBy: { createdAt: 'desc' as const },
          take: 1,
          select: {
            id: true,
            campaignId: true,
            amount: true,
            uniqueCode: true,
            totalPayable: true,
            destinationBank: true,
            destinationAccount: true,
            senderProviderName: true,
            senderAccountName: true,
            transferProofUrl: true,
            paymentStatus: true,
            rejectionReason: true,
            verifiedByAdminId: true,
            verifiedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    };

    const campaign = await prisma.campaign.findFirst(findCampaignQuery);

    if (!campaign) {
      SendError(res, CAMPAIGN_MESSAGES.CAMPAIGN_NOT_FOUND, 404);
      return;
    }

    const targetAccountId = campaign.brand.accountId;
    const findWalletQuery = {
      where: {
        accountId: targetAccountId,
        status: Status.ACTIVE,
      },
      select: {
        balance: true,
      },
    };

    const wallet = await prisma.wallet.findFirst(findWalletQuery);
    const walletBalance = wallet ? Number(wallet.balance) : 0;
    const budget = Number(campaign.budget ?? 0);
    const canPayWithWallet = walletBalance >= budget && budget > 0;

    const bankDetails = {
      bankName: process.env.KLIPDAY_BANK_NAME || DEFAULT_KLIPDAY_BANK_NAME,
      accountNo: process.env.KLIPDAY_BANK_ACCOUNT_NO || DEFAULT_KLIPDAY_BANK_ACCOUNT_NO,
      accountName: process.env.KLIPDAY_BANK_ACCOUNT_NAME || DEFAULT_KLIPDAY_BANK_ACCOUNT_NAME,
    };

    const existingPayment = campaign.payments?.[0] ?? null;

    // Strictly read-only: never mutate DB records inside a GET handler.
    // Recompute preview payable totals in-memory only when a PENDING invoice predates a budget edit.
    const latestPayment =
      existingPayment &&
      existingPayment.paymentStatus === PaymentStatus.PENDING &&
      budget > 0 &&
      Number(existingPayment.amount) !== budget
        ? (() => {
            const validCode =
              existingPayment.uniqueCode >= 100 && existingPayment.uniqueCode <= 999
                ? existingPayment.uniqueCode
                : 100;
            return {
              ...existingPayment,
              amount: budget,
              uniqueCode: validCode,
              totalPayable: budget + validCode,
            };
          })()
        : existingPayment;

    const responsePayload: CampaignPaymentDetailsResponse = {
      payment: latestPayment as never,
      walletBalance,
      bankDetails,
      budget,
      canPayWithWallet,
    };

    SendSuccess(res, responsePayload, CAMPAIGN_MESSAGES.PAYMENT_RETRIEVED_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /campaigns/:id/payment/wallet`: deducts campaign budget from brand
 * wallet, logs a WalletTransaction, marks payment approved, and transitions campaign to IN_REVIEW.
 *
 * @param req - Express request with authenticated brand account and campaign id.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function PayCampaignWithWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;
    
    if (!account) {
      SendError(res, CAMPAIGN_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, CAMPAIGN_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const campaignId = req.params.id as string;

    const [campaign, wallet] = await Promise.all([
      prisma.campaign.findFirst({
        where: {
          id: campaignId,
          status: Status.ACTIVE,
          brand: { accountId: account.sub, status: Status.ACTIVE },
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
              id: true,
              paymentStatus: true,
            },
          },
        },
      }),

      prisma.wallet.findFirst({
        where: { accountId: account.sub, status: Status.ACTIVE },
        select: { id: true, balance: true },
      }),
    ]);

    if (!campaign) {
      SendError(res, CAMPAIGN_MESSAGES.CAMPAIGN_NOT_FOUND, 404);
      return;
    }

    if (campaign.campaignStatus !== CampaignStatus.AWAITING_PAYMENT) {
      SendError(res, CAMPAIGN_MESSAGES.CAMPAIGN_NOT_AWAITING_PAYMENT, 400);
      return;
    }

    const bodyValidation = ValidateWalletPaymentBody(req.body);
    if (typeof bodyValidation === 'string') {
      SendError(res, bodyValidation, 400);
      return;
    }

    const budget = Number(campaign.budget ?? 0);
    if (budget <= 0) {
      SendError(res, CAMPAIGN_MESSAGES.STEP_4_INVALID_BUDGET, 400);
      return;
    }

    if (
      bodyValidation?.expectedBudget !== undefined &&
      Math.abs(bodyValidation.expectedBudget - budget) > 0.001
    ) {
      SendError(res, CAMPAIGN_MESSAGES.PAYMENT_AMOUNT_STALE, 409);
      return;
    }

    if (!wallet || Number(wallet.balance) < budget) {
      SendError(res, CAMPAIGN_MESSAGES.INSUFFICIENT_WALLET_BALANCE, 400);
      return;
    }

    const latestPayment = campaign.payments?.[0] ?? null;

    await prisma.$transaction((tx) =>
      ExecuteWalletPaymentInTx(tx, {
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        accountId: account.sub,
        budget,
        latestPayment,
      }),
    );

    const updatedCampaign = await prisma.campaign.findFirst({
      where: { id: campaign.id, status: Status.ACTIVE },
      select: CAMPAIGN_DETAIL_SELECT,
    });

    void NotifyAdminPendingItem({
      type: NotificationType.ADMIN_NEW_CAMPAIGN,
      title: 'Kampanye Baru Menunggu Moderasi',
      message: `Kampanye "${campaign.title ?? 'Klipday'}" telah dibayar dan menunggu pemeriksaan.`,
      actionUrl: '/admin-dashboard/campaigns',
      metadata: { campaignId: campaign.id },
    });

    SendSuccess(res, updatedCampaign, CAMPAIGN_MESSAGES.WALLET_PAYMENT_SUCCESS);
  } catch (err) {
    if (err instanceof CampaignTransactionError) {
      SendError(res, err.message, err.statusCode);
      return;
    }

    next(err);
  }
}

/**
 * Handles `POST /campaigns/:id/payment/proof`: streams the raw binary transfer proof
 * directly to Supabase Storage and returns the public asset URL without updating the database.
 *
 * @param req - Express request with authenticated brand account.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function UploadPaymentProof(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CAMPAIGN_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, CAMPAIGN_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const campaignId = req.params.id as string;

    const findQuery = {
      where: {
        id: campaignId,
        status: Status.ACTIVE,
        brand: { accountId: account.sub, status: Status.ACTIVE },
      },
      select: { id: true, campaignStatus: true },
    };

    const ownedCampaign = await prisma.campaign.findFirst(findQuery);

    if (!ownedCampaign) {
      SendError(res, CAMPAIGN_MESSAGES.CAMPAIGN_NOT_FOUND, 404);
      return;
    }

    if (ownedCampaign.campaignStatus !== CampaignStatus.AWAITING_PAYMENT) {
      SendError(res, CAMPAIGN_MESSAGES.CAMPAIGN_NOT_AWAITING_PAYMENT, 400);
      return;
    }

    const uploadResult = await StreamCampaignImageUpload(req, {
      campaignId: ownedCampaign.id,
      folderPrefix: 'payment-proof',
      allowedMimeTypes: ALLOWED_PAYMENT_PROOF_MIME_TYPES,
      maxSizeBytes: MAX_PAYMENT_PROOF_SIZE_BYTES,
      successMessage: CAMPAIGN_MESSAGES.PAYMENT_PROOF_UPLOAD_SUCCESS,
    });

    if (!uploadResult.ok) {
      SendError(res, uploadResult.message, uploadResult.statusCode);
      return;
    }

    SendSuccess(res, { url: uploadResult.publicUrl }, CAMPAIGN_MESSAGES.PAYMENT_PROOF_UPLOAD_SUCCESS);
  } catch (error) {
    next(error);
  }
}

/**
 * Handles `POST /campaigns/:id/payment/confirm`: saves manual bank transfer details
 * and receipt image, updates CampaignPayment to SUBMITTED, and transitions campaign to IN_REVIEW.
 *
 * @param req - Express request with authenticated brand account, campaign id, and transfer details.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function ConfirmBankTransferPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CAMPAIGN_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, CAMPAIGN_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const campaignId = req.params.id as string;

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        status: Status.ACTIVE,
        brand: { accountId: account.sub, status: Status.ACTIVE },
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
            id: true,
            uniqueCode: true,
          },
        },
      },
    });

    if (!campaign) {
      SendError(res, CAMPAIGN_MESSAGES.CAMPAIGN_NOT_FOUND, 404);
      return;
    }

    if (campaign.campaignStatus !== CampaignStatus.AWAITING_PAYMENT) {
      SendError(res, CAMPAIGN_MESSAGES.CAMPAIGN_NOT_AWAITING_PAYMENT, 400);
      return;
    }

    const validationResult = ValidateBankTransferPaymentBody(req.body);
    if (typeof validationResult === 'string') {
      SendError(res, validationResult, 400);
      return;
    }

    const input = validationResult;
    const budgetAmount = Number(campaign.budget ?? 0);

    if (budgetAmount <= 0) {
      SendError(res, CAMPAIGN_MESSAGES.STEP_4_INVALID_BUDGET, 400);
      return;
    }

    if (
      input.expectedBudget !== undefined &&
      Math.abs(input.expectedBudget - budgetAmount) > 0.001
    ) {
      SendError(res, CAMPAIGN_MESSAGES.PAYMENT_AMOUNT_STALE, 409);
      return;
    }

    const latestPayment = campaign.payments?.[0] ?? null;
    const validUniqueCode =
      latestPayment && latestPayment.uniqueCode >= 100 && latestPayment.uniqueCode <= 999
        ? latestPayment.uniqueCode
        : GeneratePaymentUniqueCode();
    const effectiveTotalPayable = budgetAmount + validUniqueCode;

    if (
      input.expectedTotalPayable !== undefined &&
      Math.abs(input.expectedTotalPayable - effectiveTotalPayable) > 0.001
    ) {
      SendError(res, CAMPAIGN_MESSAGES.PAYMENT_AMOUNT_STALE, 409);
      return;
    }

    const destinationBank = process.env.KLIPDAY_BANK_NAME || DEFAULT_KLIPDAY_BANK_NAME;
    const destinationAccount = process.env.KLIPDAY_BANK_ACCOUNT_NO || DEFAULT_KLIPDAY_BANK_ACCOUNT_NO;

    await prisma.$transaction((tx) =>
      ExecuteBankTransferConfirmInTx(tx, {
        campaignId: campaign.id,
        budgetAmount,
        uniqueCode: validUniqueCode,
        totalPayable: effectiveTotalPayable,
        destinationBank,
        destinationAccount,
        senderProviderName: input.senderProviderName,
        senderAccountName: input.senderAccountName,
        transferProofUrl: input.transferProofUrl,
        latestPaymentId: latestPayment?.id ?? null,
      }),
    );

    const updatedCampaign = await prisma.campaign.findFirst({
      where: { id: campaign.id, status: Status.ACTIVE },
      select: CAMPAIGN_DETAIL_SELECT,
    });

    void NotifyAdminPendingItem({
      type: NotificationType.ADMIN_NEW_CAMPAIGN,
      title: 'Kampanye Baru Menunggu Moderasi',
      message: `Kampanye "${campaign.title ?? 'Klipday'}" telah mengajukan bukti transfer dan menunggu pemeriksaan.`,
      actionUrl: '/admin-dashboard/campaigns',
      metadata: { campaignId: campaign.id },
    });

    SendSuccess(res, updatedCampaign, CAMPAIGN_MESSAGES.TRANSFER_PAYMENT_SUBMITTED_SUCCESS);
  } catch (err) {
    if (err instanceof CampaignTransactionError) {
      SendError(res, err.message, err.statusCode);
      return;
    }
    next(err);
  }
}

/**
 * Handles `POST /campaigns/:id/payment/verify`: Admin verification of manual bank transfer.
 * Approves payment (sets ACTIVE, logs WalletTransaction) or rejects payment (reverts to AWAITING_PAYMENT with reason).
 *
 * @param req - Express request with authenticated admin account and action payload.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function VerifyCampaignPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CAMPAIGN_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.ADMIN) {
      SendError(res, CAMPAIGN_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const campaignId = req.params.id as string;

    const admin = await prisma.admin.findFirst({
      where: { accountId: account.sub, status: Status.ACTIVE },
      select: { id: true },
    });

    if (!admin) {
      SendError(res, CAMPAIGN_MESSAGES.ADMIN_NOT_FOUND, 403);
      return;
    }

    const validationResult = ValidateAdminVerifyPaymentBody(req.body);
    if (typeof validationResult === 'string') {
      SendError(res, validationResult, 400);
      return;
    }

    const input = validationResult;

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, status: Status.ACTIVE },
      select: {
        id: true,
        title: true,
        budget: true,
        campaignStatus: true,
        brandId: true,
        brand: {
          select: {
            accountId: true,
          },
        },
        payments: {
          where: { status: Status.ACTIVE },
          orderBy: { createdAt: 'desc' as const },
          take: 1,
        },
      },
    });

    if (!campaign) {
      SendError(res, CAMPAIGN_MESSAGES.CAMPAIGN_NOT_FOUND, 404);
      return;
    }

    if (campaign.campaignStatus !== CampaignStatus.IN_REVIEW) {
      SendError(res, CAMPAIGN_MESSAGES.PAYMENT_NOT_SUBMITTED, 400);
      return;
    }

    const latestPayment = campaign.payments?.[0];

    if (!latestPayment) {
      SendError(res, CAMPAIGN_MESSAGES.PAYMENT_NOT_FOUND, 404);
      return;
    }

    if (latestPayment.paymentStatus !== PaymentStatus.SUBMITTED) {
      SendError(res, CAMPAIGN_MESSAGES.PAYMENT_NOT_SUBMITTED, 400);
      return;
    }

    if (
      input.action === 'APPROVE' &&
      latestPayment.amount !== null &&
      latestPayment.amount !== undefined &&
      Math.abs(Number(latestPayment.amount) - Number(campaign.budget ?? 0)) > 0.001
    ) {
      SendError(res, CAMPAIGN_MESSAGES.PAYMENT_AMOUNT_STALE, 409);
      return;
    }

    const brandWallet =
      input.action === 'APPROVE'
        ? await prisma.wallet.findFirst({
            where: { accountId: campaign.brand.accountId, status: Status.ACTIVE },
            select: { id: true, balance: true },
          })
        : null;

    if (input.action === 'APPROVE' && !brandWallet) {
      SendError(res, CAMPAIGN_MESSAGES.WALLET_NOT_FOUND, 404);
      return;
    }

    await prisma.$transaction((tx) =>
      ExecuteVerifyCampaignPaymentInTx(tx, {
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        adminId: admin.id,
        action: input.action,
        rejectionReason: input.rejectionReason,
        latestPayment,
        brandWallet,
      }),
    );

    const updatedCampaign = await prisma.campaign.findFirst({
      where: { id: campaign.id, status: Status.ACTIVE },
      select: CAMPAIGN_DETAIL_SELECT,
    });

    SendSuccess(res, updatedCampaign, CAMPAIGN_MESSAGES.PAYMENT_VERIFIED_SUCCESS);
  } catch (err) {
    if (err instanceof CampaignTransactionError) {
      SendError(res, err.message, err.statusCode);
      return;
    }
    next(err);
  }
}

