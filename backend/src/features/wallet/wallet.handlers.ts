import { Readable } from 'node:stream';
import { TransformStream } from 'node:stream/web';
import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';
import {
  CampaignStatus,
  PaymentStatus,
  PayoutStatus,
  Role,
  Status,
  SubmissionStatus,
  WalletTransactionType,
} from '../../generated/prisma/enums.js';
import { SendError, SendSuccess } from '../../utils/api-response.js';
import { prisma } from '../../utils/prisma.js';
import {
  ALLOWED_PROOF_MIME_TYPES,
  KLIPDAY_DESTINATION_BANK,
  TOP_UP_LIMITS,
  WALLET_MESSAGES,
  WITHDRAWAL_LIMITS,
} from './wallet.constants.js';
import {
  GenerateTopUpReferenceCode,
  GenerateTopUpUniqueCode,
  GenerateWalletTransactionReferenceCode,
  GenerateWithdrawalReferenceCode,
} from './wallet.helper.js';
import {
  CreateTopUpSchema,
  CreateWithdrawalSchema,
  RequestWithdrawalCancellationSchema,
  SubmitTopUpProofSchema,
  TransactionQuerySchema,
} from './wallet.schemas.js';
import type {
  BrandWalletSummary,
  PaginatedTransactionsResponse,
  PayoutRequestRecord,
  SimulateApprovalResult,
  SimulateWithdrawalResult,
  TopUpRequestRecord,
} from './wallet.types.js';

/**
 * Handles `GET /wallet/summary`: returns the active balance, locked balance
 * (alokasi kampanye), and total creator payouts for the authenticated brand.
 *
 * @param req - Express request with authenticated account.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetBrandWalletSummary(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, WALLET_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const brand = await prisma.brand.findFirst({
      where: { accountId: account.sub, status: Status.ACTIVE },
      select: { id: true },
    });

    if (!brand) {
      SendError(res, WALLET_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    let wallet = await prisma.wallet.findFirst({
      where: { accountId: account.sub, status: Status.ACTIVE },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          accountId: account.sub,
          balance: new Prisma.Decimal(0),
          status: Status.ACTIVE,
        },
      });
    }

    // Calculate total verified creator payouts for this brand's campaigns
    const verifiedSubmissions = await prisma.submission.findMany({
      where: {
        status: Status.ACTIVE,
        submissionStatus: SubmissionStatus.VERIFIED,
        campaign: {
          brandId: brand.id,
          status: Status.ACTIVE,
        },
      },
      select: {
        earnings: true,
      },
    });

    const totalCreatorPayout = verifiedSubmissions.reduce(
      (sum, sub) => sum + Number(sub.earnings || 0),
      0,
    );

    // Calculate locked balance (allocated budget minus verified creator earnings) for ongoing campaigns
    const ongoingCampaigns = await prisma.campaign.findMany({
      where: {
        brandId: brand.id,
        status: Status.ACTIVE,
        campaignStatus: {
          in: [CampaignStatus.IN_REVIEW, CampaignStatus.REVISION, CampaignStatus.ACTIVE],
        },
      },
      select: {
        id: true,
        budget: true,
        submissions: {
          where: {
            status: Status.ACTIVE,
            submissionStatus: SubmissionStatus.VERIFIED,
          },
          select: {
            earnings: true,
          },
        },
      },
    });

    const lockedBalance = ongoingCampaigns.reduce((acc, campaign) => {
      const budget = Number(campaign.budget || 0);
      const earned = campaign.submissions.reduce(
        (subSum, s) => subSum + Number(s.earnings || 0),
        0,
      );
      const remaining = Math.max(0, budget - earned);
      return acc + remaining;
    }, 0);

    const activeBalance = Number(wallet.balance);

    const summary: BrandWalletSummary = {
      walletId: wallet.id,
      balance: activeBalance,
      metrics: {
        activeBalance,
        lockedBalance,
        totalCreatorPayout,
      },
    };

    SendSuccess(res, summary, WALLET_MESSAGES.SUMMARY_FETCH_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /wallet/top-up`: creates a new manual top-up request with unique code
 * and BCA destination details for the authenticated brand.
 *
 * @param req - Express request with authenticated account and body.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function CreateTopUpRequest(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, WALLET_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const validationResult = CreateTopUpSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0]?.message ?? WALLET_MESSAGES.INVALID_AMOUNT_RANGE;
      SendError(res, errorMessage, 400);
      return;
    }

    const payload = validationResult.data;

    let wallet = await prisma.wallet.findFirst({
      where: { accountId: account.sub, status: Status.ACTIVE },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          accountId: account.sub,
          balance: new Prisma.Decimal(0),
          status: Status.ACTIVE,
        },
      });
    }

    const referenceCode = GenerateTopUpReferenceCode();
    const uniqueCode = GenerateTopUpUniqueCode();
    const totalPayable = payload.amount + uniqueCode;

    const initialStatus = payload.transferProofUrl ? PaymentStatus.SUBMITTED : PaymentStatus.PENDING;

    const createdTopUp = await prisma.topUpRequest.create({
      data: {
        referenceCode,
        walletId: wallet.id,
        amount: new Prisma.Decimal(payload.amount),
        uniqueCode,
        totalPayable: new Prisma.Decimal(totalPayable),
        destinationBank: KLIPDAY_DESTINATION_BANK.bankName,
        destinationAccount: KLIPDAY_DESTINATION_BANK.accountNumber,
        destinationHolderName: KLIPDAY_DESTINATION_BANK.accountHolderName,
        senderBank: payload.senderBank || null,
        senderAccountName: payload.senderAccountName || null,
        transferProofUrl: payload.transferProofUrl || null,
        status: initialStatus,
        recordStatus: Status.ACTIVE,
      },
    });

    const record: TopUpRequestRecord = {
      id: createdTopUp.id,
      referenceCode: createdTopUp.referenceCode,
      walletId: createdTopUp.walletId,
      amount: Number(createdTopUp.amount),
      uniqueCode: createdTopUp.uniqueCode,
      totalPayable: Number(createdTopUp.totalPayable),
      destinationBank: createdTopUp.destinationBank,
      destinationAccount: createdTopUp.destinationAccount,
      destinationHolderName: createdTopUp.destinationHolderName,
      senderBank: createdTopUp.senderBank,
      senderAccountName: createdTopUp.senderAccountName,
      transferProofUrl: createdTopUp.transferProofUrl,
      status: createdTopUp.status,
      rejectionReason: createdTopUp.rejectionReason,
      createdAt: createdTopUp.createdAt,
      updatedAt: createdTopUp.updatedAt,
    };

    SendSuccess(res, record, WALLET_MESSAGES.TOP_UP_CREATED_SUCCESS, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /wallet/top-up/:id/approve`: simulates sandbox approval of a manual
 * top-up request, updating the balance atomically and recording a BRAND_DEPOSIT transaction.
 *
 * @param req - Express request with top-up id parameter.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function SimulateTopUpApproval(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, WALLET_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const topUpId = req.params.id as string;

    const wallet = await prisma.wallet.findFirst({
      where: { accountId: account.sub, status: Status.ACTIVE },
    });

    if (!wallet) {
      SendError(res, WALLET_MESSAGES.WALLET_NOT_FOUND, 404);
      return;
    }

    const topUp = await prisma.topUpRequest.findFirst({
      where: {
        id: topUpId,
        walletId: wallet.id,
        recordStatus: Status.ACTIVE,
      },
    });

    if (!topUp) {
      SendError(res, WALLET_MESSAGES.TOP_UP_NOT_FOUND, 404);
      return;
    }

    if (topUp.status === PaymentStatus.APPROVED) {
      SendError(res, WALLET_MESSAGES.TOP_UP_ALREADY_PROCESSED, 400);
      return;
    }

    const transactionResult = await prisma.$transaction(async (tx) => {
      const updatedTopUp = await tx.topUpRequest.update({
        where: { id: topUp.id },
        data: {
          status: PaymentStatus.APPROVED,
          verifiedAt: new Date(),
        },
      });

      const currentWallet = await tx.wallet.findUniqueOrThrow({
        where: { id: wallet.id },
      });

      const balanceBefore = Number(currentWallet.balance);
      const depositAmount = Number(topUp.amount);
      const balanceAfter = balanceBefore + depositAmount;

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: new Prisma.Decimal(balanceAfter),
        },
      });

      const transactionReference = GenerateWalletTransactionReferenceCode();

      const createdTxn = await tx.walletTransaction.create({
        data: {
          referenceCode: transactionReference,
          walletId: wallet.id,
          type: WalletTransactionType.BRAND_DEPOSIT,
          amount: new Prisma.Decimal(depositAmount),
          balanceBefore: new Prisma.Decimal(balanceBefore),
          balanceAfter: new Prisma.Decimal(balanceAfter),
          description: `Top up saldo via transfer bank (${topUp.referenceCode})`,
          transactionDate: new Date(),
          status: Status.ACTIVE,
        },
      });

      return {
        updatedTopUp,
        updatedWallet,
        createdTxn,
      };
    });

    const result: SimulateApprovalResult = {
      topUp: {
        id: transactionResult.updatedTopUp.id,
        referenceCode: transactionResult.updatedTopUp.referenceCode,
        walletId: transactionResult.updatedTopUp.walletId,
        amount: Number(transactionResult.updatedTopUp.amount),
        uniqueCode: transactionResult.updatedTopUp.uniqueCode,
        totalPayable: Number(transactionResult.updatedTopUp.totalPayable),
        destinationBank: transactionResult.updatedTopUp.destinationBank,
        destinationAccount: transactionResult.updatedTopUp.destinationAccount,
        destinationHolderName: transactionResult.updatedTopUp.destinationHolderName,
        senderBank: transactionResult.updatedTopUp.senderBank,
        senderAccountName: transactionResult.updatedTopUp.senderAccountName,
        transferProofUrl: transactionResult.updatedTopUp.transferProofUrl,
        status: transactionResult.updatedTopUp.status,
        rejectionReason: transactionResult.updatedTopUp.rejectionReason,
        createdAt: transactionResult.updatedTopUp.createdAt,
        updatedAt: transactionResult.updatedTopUp.updatedAt,
      },
      wallet: {
        id: transactionResult.updatedWallet.id,
        balance: Number(transactionResult.updatedWallet.balance),
      },
      transaction: {
        id: transactionResult.createdTxn.id,
        referenceCode: transactionResult.createdTxn.referenceCode,
        amount: Number(transactionResult.createdTxn.amount),
        balanceAfter: Number(transactionResult.createdTxn.balanceAfter),
      },
    };

    SendSuccess(res, result, WALLET_MESSAGES.TOP_UP_SIMULATION_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `GET /wallet/transactions`: returns paginated ledger transactions
 * for the authenticated brand, filtered by transaction type and search query.
 *
 * @param req - Express request with query parameters.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetBrandTransactions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, WALLET_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const validationResult = TransactionQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      SendError(res, WALLET_MESSAGES.INVALID_QUERY_PARAMS, 400);
      return;
    }

    const { type, page, limit, search } = validationResult.data;

    let wallet = await prisma.wallet.findFirst({
      where: { accountId: account.sub, status: Status.ACTIVE },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          accountId: account.sub,
          balance: new Prisma.Decimal(0),
          status: Status.ACTIVE,
        },
      });
    }

    const brandAllowedTypes = [
      WalletTransactionType.BRAND_DEPOSIT,
      WalletTransactionType.CAMPAIGN_PAYMENT,
      WalletTransactionType.CAMPAIGN_REFUND,
      WalletTransactionType.CAMPAIGN_EARNING,
      WalletTransactionType.WITHDRAWAL,
    ];

    const typeFilter =
      type === 'ALL'
        ? { in: brandAllowedTypes }
        : (type as WalletTransactionType);

    const whereClause: Prisma.WalletTransactionWhereInput = {
      walletId: wallet.id,
      status: Status.ACTIVE,
      type: typeFilter,
    };

    if (search && search.length > 0) {
      whereClause.OR = [
        { referenceCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, records] = await Promise.all([
      prisma.walletTransaction.count({ where: whereClause }),
      prisma.walletTransaction.findMany({
        where: whereClause,
        orderBy: { transactionDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const transactions = records.map((r) => ({
      id: r.id,
      referenceCode: r.referenceCode,
      type: r.type,
      amount: Number(r.amount),
      balanceBefore: Number(r.balanceBefore),
      balanceAfter: Number(r.balanceAfter),
      description: r.description,
      transactionDate: r.transactionDate,
      campaignId: r.campaignId,
      submissionId: r.submissionId,
      createdAt: r.createdAt,
    }));

    const responsePayload: PaginatedTransactionsResponse = {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };

    SendSuccess(res, responsePayload, WALLET_MESSAGES.TRANSACTIONS_FETCH_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /wallet/top-up/proof`: streams and uploads top-up payment proof image
 * directly to Supabase storage with byte size limit guard.
 *
 * @param req - Express request with raw image stream.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function UploadTopUpProof(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, WALLET_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const rawContentType = req.headers['content-type']?.split(';')[0]?.trim().toLowerCase() ?? '';
    const fileExtension = ALLOWED_PROOF_MIME_TYPES[rawContentType];

    if (!fileExtension) {
      SendError(res, WALLET_MESSAGES.UNSUPPORTED_FILE_TYPE, 400);
      return;
    }

    const contentLength = Number(req.headers['content-length']);

    if (!contentLength || Number.isNaN(contentLength)) {
      SendError(res, WALLET_MESSAGES.CONTENT_LENGTH_REQUIRED, 411);
      return;
    }

    if (contentLength > TOP_UP_LIMITS.MAX_PROOF_SIZE_BYTES) {
      SendError(res, WALLET_MESSAGES.FILE_SIZE_EXCEEDED, 400);
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'campaign-thumbnails';

    if (!supabaseUrl || !serviceRoleKey) {
      SendError(res, WALLET_MESSAGES.STORAGE_CONFIG_MISSING, 500);
      return;
    }

    let bytesReceived = 0;
    const sizeLimiter = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        bytesReceived += chunk.byteLength;
        if (bytesReceived > TOP_UP_LIMITS.MAX_PROOF_SIZE_BYTES) {
          controller.error(new Error('FILE_SIZE_EXCEEDED'));
        } else {
          controller.enqueue(chunk);
        }
      },
    });

    const webStream = Readable.toWeb(req).pipeThrough(sizeLimiter);
    const storagePath = `wallet/${account.sub}/top-up-proof-${Date.now()}.${fileExtension}`;
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
      console.error('[Supabase Storage Upload Top-Up Proof Error]', supabaseResponse.status, errorDetail);
      SendError(res, WALLET_MESSAGES.STORAGE_UPLOAD_FAILED, 502);
      return;
    }

    const publicUrl = `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${bucket}/${storagePath}`;

    SendSuccess(res, { url: publicUrl }, WALLET_MESSAGES.PROOF_UPLOAD_SUCCESS);
  } catch (error) {
    if (error instanceof Error && error.message === 'FILE_SIZE_EXCEEDED') {
      SendError(res, WALLET_MESSAGES.FILE_SIZE_EXCEEDED, 400);
      return;
    }

    next(error);
  }
}

/**
 * Handles `GET /wallet/top-up/active`: returns active unapproved top-up requests
 * (PENDING or SUBMITTED) created within the last 24 hours for the authenticated brand.
 *
 * @param req - Express request with authenticated account.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetActiveTopUpRequests(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, WALLET_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const wallet = await prisma.wallet.findFirst({
      where: { accountId: account.sub, status: Status.ACTIVE },
    });

    if (!wallet) {
      SendSuccess(res, [], WALLET_MESSAGES.ACTIVE_TOP_UPS_FETCH_SUCCESS);
      return;
    }

    const expiryCutoff = new Date(
      Date.now() - TOP_UP_LIMITS.EXPIRATION_HOURS * 60 * 60 * 1000,
    );

    const activeTopUps = await prisma.topUpRequest.findMany({
      where: {
        walletId: wallet.id,
        recordStatus: Status.ACTIVE,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.SUBMITTED] },
        createdAt: { gte: expiryCutoff },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result: TopUpRequestRecord[] = activeTopUps.map((r) => ({
      id: r.id,
      referenceCode: r.referenceCode,
      walletId: r.walletId,
      amount: Number(r.amount),
      uniqueCode: r.uniqueCode,
      totalPayable: Number(r.totalPayable),
      destinationBank: r.destinationBank,
      destinationAccount: r.destinationAccount,
      destinationHolderName: r.destinationHolderName,
      senderBank: r.senderBank,
      senderAccountName: r.senderAccountName,
      transferProofUrl: r.transferProofUrl,
      status: r.status,
      rejectionReason: r.rejectionReason,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    SendSuccess(res, result, WALLET_MESSAGES.ACTIVE_TOP_UPS_FETCH_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /wallet/top-up/:id/submit`: submits or attaches proof of payment
 * for a pending top-up request and updates its lifecycle status to SUBMITTED.
 *
 * @param req - Express request with top-up id parameter and optional proof payload.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function SubmitTopUpProof(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, WALLET_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const topUpId = req.params.id as string;

    const validationResult = SubmitTopUpProofSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.issues[0]?.message ?? 'Payload tidak valid.';
      SendError(res, errorMessage, 400);
      return;
    }

    const wallet = await prisma.wallet.findFirst({
      where: { accountId: account.sub, status: Status.ACTIVE },
    });

    if (!wallet) {
      SendError(res, WALLET_MESSAGES.WALLET_NOT_FOUND, 404);
      return;
    }

    const topUp = await prisma.topUpRequest.findFirst({
      where: {
        id: topUpId,
        walletId: wallet.id,
        recordStatus: Status.ACTIVE,
      },
    });

    if (!topUp) {
      SendError(res, WALLET_MESSAGES.TOP_UP_NOT_FOUND, 404);
      return;
    }

    if (topUp.status === PaymentStatus.APPROVED) {
      SendError(res, WALLET_MESSAGES.TOP_UP_ALREADY_PROCESSED, 400);
      return;
    }

    const updateData: Prisma.TopUpRequestUpdateInput = {
      status: PaymentStatus.SUBMITTED,
    };

    if (validationResult.data.transferProofUrl) {
      updateData.transferProofUrl = validationResult.data.transferProofUrl;
    }

    const updatedTopUp = await prisma.topUpRequest.update({
      where: { id: topUp.id },
      data: updateData,
    });

    const record: TopUpRequestRecord = {
      id: updatedTopUp.id,
      referenceCode: updatedTopUp.referenceCode,
      walletId: updatedTopUp.walletId,
      amount: Number(updatedTopUp.amount),
      uniqueCode: updatedTopUp.uniqueCode,
      totalPayable: Number(updatedTopUp.totalPayable),
      destinationBank: updatedTopUp.destinationBank,
      destinationAccount: updatedTopUp.destinationAccount,
      destinationHolderName: updatedTopUp.destinationHolderName,
      senderBank: updatedTopUp.senderBank,
      senderAccountName: updatedTopUp.senderAccountName,
      transferProofUrl: updatedTopUp.transferProofUrl,
      status: updatedTopUp.status,
      rejectionReason: updatedTopUp.rejectionReason,
      createdAt: updatedTopUp.createdAt,
      updatedAt: updatedTopUp.updatedAt,
    };

    SendSuccess(res, record, WALLET_MESSAGES.TOP_UP_SUBMIT_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `DELETE /wallet/top-up/:id`: soft-deletes / cancels a pending or unapproved
 * top-up request for the authenticated brand.
 *
 * @param req - Express request with top-up id parameter.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function CancelTopUpRequest(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, WALLET_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const topUpId = req.params.id as string;

    const wallet = await prisma.wallet.findFirst({
      where: { accountId: account.sub, status: Status.ACTIVE },
    });

    if (!wallet) {
      SendError(res, WALLET_MESSAGES.WALLET_NOT_FOUND, 404);
      return;
    }

    const topUp = await prisma.topUpRequest.findFirst({
      where: {
        id: topUpId,
        walletId: wallet.id,
        recordStatus: Status.ACTIVE,
      },
    });

    if (!topUp) {
      SendError(res, WALLET_MESSAGES.TOP_UP_NOT_FOUND, 404);
      return;
    }

    if (topUp.status === PaymentStatus.APPROVED) {
      SendError(res, WALLET_MESSAGES.TOP_UP_CANNOT_BE_CANCELLED, 400);
      return;
    }

    await prisma.topUpRequest.update({
      where: { id: topUp.id },
      data: {
        recordStatus: Status.DELETED,
      },
    });

    SendSuccess(res, { id: topUp.id }, WALLET_MESSAGES.TOP_UP_CANCEL_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `GET /wallet/withdrawals/active`: returns pending withdrawal requests
 * for the authenticated brand.
 *
 * @param req - Express request with authenticated account.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetActiveWithdrawalRequests(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, WALLET_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const wallet = await prisma.wallet.findFirst({
      where: { accountId: account.sub, status: Status.ACTIVE },
    });

    if (!wallet) {
      SendSuccess(res, [], WALLET_MESSAGES.ACTIVE_WITHDRAWALS_FETCH_SUCCESS);
      return;
    }

    const activeWithdrawals = await prisma.payoutRequest.findMany({
      where: {
        walletId: wallet.id,
        status: Status.ACTIVE,
        payoutStatus: PayoutStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
    });

    const result: PayoutRequestRecord[] = activeWithdrawals.map((r) => ({
      id: r.id,
      referenceCode: r.referenceCode,
      walletId: r.walletId,
      amount: Number(r.amount),
      accountProvider: r.accountProvider,
      accountNumber: r.accountNumber,
      accountHolderName: r.accountHolderName,
      payoutStatus: r.payoutStatus,
      rejectionReason: r.rejectionReason,
      transferProofUrl: r.transferProofUrl,
      adminNote: r.adminNote,
      cancellationRequestedAt: r.cancellationRequestedAt,
      cancellationReason: r.cancellationReason,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    SendSuccess(res, result, WALLET_MESSAGES.ACTIVE_WITHDRAWALS_FETCH_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /wallet/withdraw`: submits a new withdrawal request for the authenticated brand.
 * Validates available active balance, reserves funds immediately, and saves payout details.
 *
 * @param req - Express request with authenticated account and body.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function CreateWithdrawalRequest(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, WALLET_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const validationResult = CreateWithdrawalSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.issues[0]?.message ?? WALLET_MESSAGES.INVALID_WITHDRAWAL_AMOUNT;
      SendError(res, errorMessage, 400);
      return;
    }

    const payload = validationResult.data;

    const wallet = await prisma.wallet.findFirst({
      where: { accountId: account.sub, status: Status.ACTIVE },
    });

    if (!wallet) {
      SendError(res, WALLET_MESSAGES.WALLET_NOT_FOUND, 404);
      return;
    }

    const currentBalance = Number(wallet.balance);

    if (currentBalance < payload.amount) {
      SendError(res, WALLET_MESSAGES.INSUFFICIENT_BALANCE, 400);
      return;
    }

    const referenceCode = GenerateWithdrawalReferenceCode();
    const newBalance = currentBalance - payload.amount;

    const createdPayout = await prisma.$transaction(async (tx) => {
      // Deduct active balance immediately upon request to prevent double-spending
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: new Prisma.Decimal(newBalance),
          accountProvider: payload.accountProvider,
          accountNumber: payload.accountNumber,
          accountHolderName: payload.accountHolderName,
        },
      });

      return tx.payoutRequest.create({
        data: {
          referenceCode,
          walletId: wallet.id,
          amount: new Prisma.Decimal(payload.amount),
          accountProvider: payload.accountProvider,
          accountNumber: payload.accountNumber,
          accountHolderName: payload.accountHolderName,
          payoutStatus: PayoutStatus.PENDING,
          status: Status.ACTIVE,
        },
      });
    });

    const record: PayoutRequestRecord = {
      id: createdPayout.id,
      referenceCode: createdPayout.referenceCode,
      walletId: createdPayout.walletId,
      amount: Number(createdPayout.amount),
      accountProvider: createdPayout.accountProvider,
      accountNumber: createdPayout.accountNumber,
      accountHolderName: createdPayout.accountHolderName,
      payoutStatus: createdPayout.payoutStatus,
      rejectionReason: createdPayout.rejectionReason,
      transferProofUrl: createdPayout.transferProofUrl,
      adminNote: createdPayout.adminNote,
      cancellationRequestedAt: createdPayout.cancellationRequestedAt,
      cancellationReason: createdPayout.cancellationReason,
      createdAt: createdPayout.createdAt,
      updatedAt: createdPayout.updatedAt,
    };

    SendSuccess(res, record, WALLET_MESSAGES.WITHDRAWAL_CREATED_SUCCESS, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /wallet/withdraw/:id/request-cancel`: submits a cancellation request
 * for a pending withdrawal. Funds remain safely locked/reserved in the system until an
 * Admin reviews and approves the cancellation, eliminating the double payout exploit.
 *
 * @param req - Express request with withdrawal id param and optional reason in body.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function RequestWithdrawalCancellation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, WALLET_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const withdrawalId = req.params.id as string;

    const parsedBody = RequestWithdrawalCancellationSchema.safeParse(req.body ?? {});
    if (!parsedBody.success) {
      SendError(res, parsedBody.error.issues[0]?.message ?? WALLET_MESSAGES.INVALID_CANCELLATION_PAYLOAD, 400);
      return;
    }

    const wallet = await prisma.wallet.findFirst({
      where: { accountId: account.sub, status: Status.ACTIVE },
    });

    if (!wallet) {
      SendError(res, WALLET_MESSAGES.WALLET_NOT_FOUND, 404);
      return;
    }

    const payout = await prisma.payoutRequest.findFirst({
      where: {
        id: withdrawalId,
        walletId: wallet.id,
        status: Status.ACTIVE,
      },
    });

    if (!payout) {
      SendError(res, WALLET_MESSAGES.WITHDRAWAL_NOT_FOUND, 404);
      return;
    }

    if (payout.payoutStatus !== PayoutStatus.PENDING) {
      SendError(res, WALLET_MESSAGES.WITHDRAWAL_ALREADY_PROCESSED, 400);
      return;
    }

    if (payout.cancellationRequestedAt) {
      SendError(res, WALLET_MESSAGES.WITHDRAWAL_CANCELLATION_ALREADY_REQUESTED, 400);
      return;
    }

    const updatedPayout = await prisma.payoutRequest.update({
      where: { id: payout.id },
      data: {
        cancellationRequestedAt: new Date(),
        cancellationReason: parsedBody.data.reason ?? null,
      },
    });

    const record: PayoutRequestRecord = {
      id: updatedPayout.id,
      referenceCode: updatedPayout.referenceCode,
      walletId: updatedPayout.walletId,
      amount: Number(updatedPayout.amount),
      accountProvider: updatedPayout.accountProvider,
      accountNumber: updatedPayout.accountNumber,
      accountHolderName: updatedPayout.accountHolderName,
      payoutStatus: updatedPayout.payoutStatus,
      rejectionReason: updatedPayout.rejectionReason,
      transferProofUrl: updatedPayout.transferProofUrl,
      adminNote: updatedPayout.adminNote,
      cancellationRequestedAt: updatedPayout.cancellationRequestedAt,
      cancellationReason: updatedPayout.cancellationReason,
      createdAt: updatedPayout.createdAt,
      updatedAt: updatedPayout.updatedAt,
    };

    SendSuccess(res, record, WALLET_MESSAGES.WITHDRAWAL_CANCELLATION_REQUESTED_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /wallet/withdraw/:id/approve-cancellation`: admin or sandbox approval
 * of a pending cancellation request. Marks payout as REJECTED and atomically refunds
 * the reserved funds back into the brand's active wallet balance.
 *
 * @param req - Express request with withdrawal id param.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function ApproveWithdrawalCancellation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND && account.role !== Role.ADMIN) {
      SendError(res, WALLET_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const withdrawalId = req.params.id as string;

    const wallet = await prisma.wallet.findFirst({
      where: { accountId: account.sub, status: Status.ACTIVE },
    });

    if (!wallet) {
      SendError(res, WALLET_MESSAGES.WALLET_NOT_FOUND, 404);
      return;
    }

    const payout = await prisma.payoutRequest.findFirst({
      where: {
        id: withdrawalId,
        walletId: wallet.id,
        status: Status.ACTIVE,
      },
    });

    if (!payout) {
      SendError(res, WALLET_MESSAGES.WITHDRAWAL_NOT_FOUND, 404);
      return;
    }

    if (payout.payoutStatus !== PayoutStatus.PENDING) {
      SendError(res, WALLET_MESSAGES.WITHDRAWAL_ALREADY_PROCESSED, 400);
      return;
    }

    if (!payout.cancellationRequestedAt) {
      SendError(res, WALLET_MESSAGES.WITHDRAWAL_CANCELLATION_NOT_REQUESTED, 400);
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedPayout = await tx.payoutRequest.update({
        where: { id: payout.id },
        data: {
          payoutStatus: PayoutStatus.REJECTED,
          rejectionReason: payout.cancellationReason
            ? `Dibatalkan atas permintaan Brand: ${payout.cancellationReason}`
            : 'Dibatalkan atas permintaan Brand',
          processedAt: new Date(),
        },
      });

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: payout.amount,
          },
        },
      });

      return { updatedPayout, updatedWallet };
    });

    const record: PayoutRequestRecord = {
      id: result.updatedPayout.id,
      referenceCode: result.updatedPayout.referenceCode,
      walletId: result.updatedPayout.walletId,
      amount: Number(result.updatedPayout.amount),
      accountProvider: result.updatedPayout.accountProvider,
      accountNumber: result.updatedPayout.accountNumber,
      accountHolderName: result.updatedPayout.accountHolderName,
      payoutStatus: result.updatedPayout.payoutStatus,
      rejectionReason: result.updatedPayout.rejectionReason,
      transferProofUrl: result.updatedPayout.transferProofUrl,
      adminNote: result.updatedPayout.adminNote,
      cancellationRequestedAt: result.updatedPayout.cancellationRequestedAt,
      cancellationReason: result.updatedPayout.cancellationReason,
      createdAt: result.updatedPayout.createdAt,
      updatedAt: result.updatedPayout.updatedAt,
    };

    SendSuccess(
      res,
      {
        payout: record,
        wallet: { id: result.updatedWallet.id, balance: Number(result.updatedWallet.balance) },
      },
      WALLET_MESSAGES.WITHDRAWAL_CANCELLATION_APPROVED_SUCCESS,
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `DELETE /wallet/withdraw/:id`: legacy endpoint guard. Unilateral instant self-refunds
 * are strictly disabled to prevent race condition / double payout exploits.
 * Directs user to submit a cancellation request instead.
 *
 * @param req - Express request with withdrawal id param.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function CancelWithdrawalRequest(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, WALLET_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    SendError(res, WALLET_MESSAGES.WITHDRAWAL_CANNOT_CANCEL_DIRECTLY, 400);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /wallet/withdraw/:id/approve`: simulates sandbox admin approval and transfer
 * for a pending withdrawal request, writing a finalized `WITHDRAWAL` record into `WalletTransaction`.
 *
 * @param req - Express request with withdrawal id parameter.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function SimulateWithdrawalApproval(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, WALLET_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const withdrawalId = req.params.id as string;

    const wallet = await prisma.wallet.findFirst({
      where: { accountId: account.sub, status: Status.ACTIVE },
    });

    if (!wallet) {
      SendError(res, WALLET_MESSAGES.WALLET_NOT_FOUND, 404);
      return;
    }

    const payout = await prisma.payoutRequest.findFirst({
      where: {
        id: withdrawalId,
        walletId: wallet.id,
        status: Status.ACTIVE,
      },
    });

    if (!payout) {
      SendError(res, WALLET_MESSAGES.WITHDRAWAL_NOT_FOUND, 404);
      return;
    }

    if (payout.payoutStatus !== PayoutStatus.PENDING) {
      SendError(res, WALLET_MESSAGES.WITHDRAWAL_ALREADY_PROCESSED, 400);
      return;
    }

    const transactionResult = await prisma.$transaction(async (tx) => {
      const updatedPayout = await tx.payoutRequest.update({
        where: { id: payout.id },
        data: {
          payoutStatus: PayoutStatus.APPROVED,
          processedAt: new Date(),
        },
      });

      const currentWallet = await tx.wallet.findUniqueOrThrow({
        where: { id: wallet.id },
      });

      const payoutAmount = Number(payout.amount);
      const balanceAfter = Number(currentWallet.balance);
      const balanceBefore = balanceAfter + payoutAmount;

      const transactionReference = GenerateWalletTransactionReferenceCode();

      const createdTxn = await tx.walletTransaction.create({
        data: {
          referenceCode: transactionReference,
          walletId: wallet.id,
          type: WalletTransactionType.WITHDRAWAL,
          amount: new Prisma.Decimal(payoutAmount),
          balanceBefore: new Prisma.Decimal(balanceBefore),
          balanceAfter: new Prisma.Decimal(balanceAfter),
          description: `Penarikan saldo ke ${payout.accountProvider} (${payout.accountNumber}) a.n ${payout.accountHolderName} (${payout.referenceCode})`,
          transactionDate: new Date(),
          status: Status.ACTIVE,
        },
      });

      return {
        updatedPayout,
        updatedWallet: currentWallet,
        createdTxn,
      };
    });

    const result: SimulateWithdrawalResult = {
      payout: {
        id: transactionResult.updatedPayout.id,
        referenceCode: transactionResult.updatedPayout.referenceCode,
        walletId: transactionResult.updatedPayout.walletId,
        amount: Number(transactionResult.updatedPayout.amount),
        accountProvider: transactionResult.updatedPayout.accountProvider,
        accountNumber: transactionResult.updatedPayout.accountNumber,
        accountHolderName: transactionResult.updatedPayout.accountHolderName,
        payoutStatus: transactionResult.updatedPayout.payoutStatus,
        rejectionReason: transactionResult.updatedPayout.rejectionReason,
        transferProofUrl: transactionResult.updatedPayout.transferProofUrl,
        adminNote: transactionResult.updatedPayout.adminNote,
        cancellationRequestedAt: transactionResult.updatedPayout.cancellationRequestedAt,
        cancellationReason: transactionResult.updatedPayout.cancellationReason,
        createdAt: transactionResult.updatedPayout.createdAt,
        updatedAt: transactionResult.updatedPayout.updatedAt,
      },
      wallet: {
        id: transactionResult.updatedWallet.id,
        balance: Number(transactionResult.updatedWallet.balance),
      },
      transaction: {
        id: transactionResult.createdTxn.id,
        referenceCode: transactionResult.createdTxn.referenceCode,
        amount: Number(transactionResult.createdTxn.amount),
        balanceAfter: Number(transactionResult.createdTxn.balanceAfter),
      },
    };

    SendSuccess(res, result, WALLET_MESSAGES.WITHDRAWAL_SIMULATION_SUCCESS);
  } catch (err) {
    next(err);
  }
}

