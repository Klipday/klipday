import { Readable } from 'node:stream';
import { TransformStream } from 'node:stream/web';
import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';
import {
  PayoutStatus,
  Role,
  Status,
  VerificationStatus,
  WalletTransactionType,
} from '../../generated/prisma/enums.js';
import { SendError, SendSuccess } from '../../utils/api-response.js';
import { prisma } from '../../utils/prisma.js';
import {
  ALLOWED_PROOF_MIME_TYPES,
  CREATOR_PAYOUT_LIMITS,
  CREATOR_WALLET_MESSAGES,
  WALLET_MESSAGES,
} from './wallet.constants.js';
import {
  GenerateWalletTransactionReferenceCode,
  GenerateWithdrawalReferenceCode,
} from './wallet.helper.js';
import {
  CreateCreatorPayoutAccountSchema,
  CreateCreatorWithdrawalSchema,
  CreatorTransactionQuerySchema,
  RequestWithdrawalCancellationSchema,
  SimulateCreatorEarningSchema,
} from './wallet.schemas.js';
import type {
  CreatorTransactionItem,
  CreatorWalletSummary,
  PaginatedCreatorTransactionsResponse,
  PayoutRequestRecord,
} from './wallet.types.js';

/**
 * Handles `GET /wallet/creator/payout-accounts`:
 * Retrieves all registered payout accounts (bank and e-wallet) for the authenticated creator.
 *
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetCreatorPayoutAccounts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CREATOR_WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR) {
      SendError(res, CREATOR_WALLET_MESSAGES.CREATOR_ROLE_REQUIRED, 403);
      return;
    }

    const wallet = await prisma.wallet.findFirst({
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    });

    if (!wallet) {
      SendSuccess(res, [], CREATOR_WALLET_MESSAGES.PAYOUT_ACCOUNTS_FETCH_SUCCESS);
      return;
    }

    const accounts = await prisma.brandPayoutAccount.findMany({
      where: {
        walletId: wallet.id,
        status: Status.ACTIVE,
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const records = accounts.map((item) => ({
      id: item.id,
      walletId: item.walletId,
      accountType: item.accountType,
      provider: item.provider,
      accountNumber: item.accountNumber,
      accountHolderName: item.accountHolderName,
      proofUrl: item.proofUrl,
      isPrimary: item.isPrimary,
      verificationStatus: item.verificationStatus,
      rejectionReason: item.rejectionReason,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    SendSuccess(res, records, CREATOR_WALLET_MESSAGES.PAYOUT_ACCOUNTS_FETCH_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /wallet/creator/payout-accounts`:
 * Registers a new bank account or e-wallet for creator withdrawals.
 *
 * @param req - Express request with payout account payload.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function CreateCreatorPayoutAccount(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CREATOR_WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR) {
      SendError(res, CREATOR_WALLET_MESSAGES.CREATOR_ROLE_REQUIRED, 403);
      return;
    }

    const validationResult = CreateCreatorPayoutAccountSchema.safeParse(req.body);

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      const errorMessage = firstIssue ? firstIssue.message : CREATOR_WALLET_MESSAGES.INVALID_PAYLOAD;
      SendError(res, errorMessage, 400);
      return;
    }

    const creator = await prisma.creator.findFirst({
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    });

    if (!creator) {
      SendError(res, CREATOR_WALLET_MESSAGES.CREATOR_NOT_FOUND, 404);
      return;
    }

    const wallet = await prisma.wallet.findFirst({
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    });

    if (!wallet) {
      SendError(res, CREATOR_WALLET_MESSAGES.WALLET_NOT_FOUND, 404);
      return;
    }

    const activeAccountsCount = await prisma.brandPayoutAccount.count({
      where: {
        walletId: wallet.id,
        status: Status.ACTIVE,
      },
    });

    if (activeAccountsCount >= CREATOR_PAYOUT_LIMITS.MAX_ACCOUNTS) {
      SendError(res, CREATOR_WALLET_MESSAGES.PAYOUT_ACCOUNT_LIMIT_EXCEEDED, 400);
      return;
    }

    const payload = validationResult.data;
    const normalizedProvider = payload.provider.toUpperCase().trim();
    const normalizedAccountNumber = payload.accountNumber.trim();

    const existingAccount = await prisma.brandPayoutAccount.findFirst({
      where: {
        walletId: wallet.id,
        provider: normalizedProvider,
        accountNumber: normalizedAccountNumber,
        status: Status.ACTIVE,
      },
    });

    if (existingAccount) {
      SendError(res, CREATOR_WALLET_MESSAGES.PAYOUT_ACCOUNT_DUPLICATE, 409);
      return;
    }

    const hasPrimaryAccount = await prisma.brandPayoutAccount.findFirst({
      where: {
        walletId: wallet.id,
        status: Status.ACTIVE,
        isPrimary: true,
      },
    });

    const shouldBePrimary = !hasPrimaryAccount || Boolean(payload.isPrimary);

    const createdAccount = await prisma.$transaction(async (tx) => {
      if (shouldBePrimary) {
        await tx.brandPayoutAccount.updateMany({
          where: {
            walletId: wallet.id,
            status: Status.ACTIVE,
          },
          data: {
            isPrimary: false,
          },
        });
      }

      return tx.brandPayoutAccount.create({
        data: {
          walletId: wallet.id,
          brandId: null,
          accountType: payload.accountType,
          provider: normalizedProvider,
          accountNumber: normalizedAccountNumber,
          accountHolderName: payload.accountHolderName.trim(),
          proofUrl: payload.proofUrl,
          isPrimary: shouldBePrimary,
          verificationStatus: VerificationStatus.PENDING,
          status: Status.ACTIVE,
        },
      });
    });

    const record = {
      id: createdAccount.id,
      walletId: createdAccount.walletId,
      accountType: createdAccount.accountType,
      provider: createdAccount.provider,
      accountNumber: createdAccount.accountNumber,
      accountHolderName: createdAccount.accountHolderName,
      proofUrl: createdAccount.proofUrl,
      isPrimary: createdAccount.isPrimary,
      verificationStatus: createdAccount.verificationStatus,
      rejectionReason: createdAccount.rejectionReason,
      createdAt: createdAccount.createdAt,
      updatedAt: createdAccount.updatedAt,
    };

    SendSuccess(res, record, CREATOR_WALLET_MESSAGES.PAYOUT_ACCOUNT_CREATED_SUCCESS, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /wallet/creator/payout-accounts/proof`:
 * Streams passbook photo or e-wallet screenshot directly to Supabase storage.
 *
 * @param req - Express request with raw image stream.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function UploadCreatorPayoutProof(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CREATOR_WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR) {
      SendError(res, CREATOR_WALLET_MESSAGES.CREATOR_ROLE_REQUIRED, 403);
      return;
    }

    const creator = await prisma.creator.findFirst({
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    });

    if (!creator) {
      SendError(res, CREATOR_WALLET_MESSAGES.CREATOR_NOT_FOUND, 404);
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

    if (contentLength > CREATOR_PAYOUT_LIMITS.MAX_PROOF_SIZE_BYTES) {
      SendError(res, WALLET_MESSAGES.FILE_SIZE_EXCEEDED, 400);
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'campaign_thumbnails';

    if (!supabaseUrl || !serviceRoleKey) {
      SendError(res, WALLET_MESSAGES.STORAGE_CONFIG_MISSING, 500);
      return;
    }

    let bytesReceived = 0;
    const sizeLimiter = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        bytesReceived += chunk.byteLength;
        if (bytesReceived > CREATOR_PAYOUT_LIMITS.MAX_PROOF_SIZE_BYTES) {
          controller.error(new Error('FILE_SIZE_EXCEEDED'));
        } else {
          controller.enqueue(chunk);
        }
      },
    });

    const webStream = Readable.toWeb(req).pipeThrough(sizeLimiter);
    const storagePath = `creators/${creator.id}/payout-proof-${Date.now()}.${fileExtension}`;
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
      console.error('[Supabase Storage Upload Creator Payout Proof Error]', supabaseResponse.status, errorDetail);
      SendError(res, WALLET_MESSAGES.STORAGE_UPLOAD_FAILED, 502);
      return;
    }

    const publicUrl = `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${bucket}/${storagePath}`;

    SendSuccess(res, { url: publicUrl }, CREATOR_WALLET_MESSAGES.PAYOUT_PROOF_UPLOAD_SUCCESS);
  } catch (error) {
    if (error instanceof Error && error.message === 'FILE_SIZE_EXCEEDED') {
      SendError(res, WALLET_MESSAGES.FILE_SIZE_EXCEEDED, 400);
      return;
    }
    next(error);
  }
}

/**
 * Handles `PATCH /wallet/creator/payout-accounts/:id/primary`:
 * Marks a verified payout account as the primary default account for creator withdrawals.
 *
 * @param req - Express request with account ID param.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function SetPrimaryCreatorPayoutAccount(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CREATOR_WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR) {
      SendError(res, CREATOR_WALLET_MESSAGES.CREATOR_ROLE_REQUIRED, 403);
      return;
    }

    const accountId = req.params.id as string;

    const wallet = await prisma.wallet.findFirst({
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    });

    if (!wallet) {
      SendError(res, CREATOR_WALLET_MESSAGES.WALLET_NOT_FOUND, 404);
      return;
    }

    const targetAccount = await prisma.brandPayoutAccount.findFirst({
      where: {
        id: accountId,
        walletId: wallet.id,
        status: Status.ACTIVE,
      },
    });

    if (!targetAccount) {
      SendError(res, CREATOR_WALLET_MESSAGES.PAYOUT_ACCOUNT_NOT_FOUND, 404);
      return;
    }

    if (targetAccount.verificationStatus !== VerificationStatus.VERIFIED) {
      SendError(res, CREATOR_WALLET_MESSAGES.PAYOUT_ACCOUNT_MUST_BE_VERIFIED, 400);
      return;
    }

    const updatedAccount = await prisma.$transaction(async (tx) => {
      await tx.brandPayoutAccount.updateMany({
        where: {
          walletId: wallet.id,
          status: Status.ACTIVE,
        },
        data: {
          isPrimary: false,
        },
      });

      return tx.brandPayoutAccount.update({
        where: { id: targetAccount.id },
        data: { isPrimary: true },
      });
    });

    const record = {
      id: updatedAccount.id,
      walletId: updatedAccount.walletId,
      accountType: updatedAccount.accountType,
      provider: updatedAccount.provider,
      accountNumber: updatedAccount.accountNumber,
      accountHolderName: updatedAccount.accountHolderName,
      proofUrl: updatedAccount.proofUrl,
      isPrimary: updatedAccount.isPrimary,
      verificationStatus: updatedAccount.verificationStatus,
      rejectionReason: updatedAccount.rejectionReason,
      createdAt: updatedAccount.createdAt,
      updatedAt: updatedAccount.updatedAt,
    };

    SendSuccess(res, record, CREATOR_WALLET_MESSAGES.PAYOUT_ACCOUNT_PRIMARY_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `DELETE /wallet/creator/payout-accounts/:id`:
 * Soft-deletes a creator payout destination account with pending withdrawal and race guards.
 *
 * @param req - Express request with account ID param.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function DeleteCreatorPayoutAccount(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CREATOR_WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR) {
      SendError(res, CREATOR_WALLET_MESSAGES.CREATOR_ROLE_REQUIRED, 403);
      return;
    }

    const accountId = req.params.id as string;

    const wallet = await prisma.wallet.findFirst({
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    });

    if (!wallet) {
      SendError(res, CREATOR_WALLET_MESSAGES.WALLET_NOT_FOUND, 404);
      return;
    }

    const targetAccount = await prisma.brandPayoutAccount.findFirst({
      where: {
        id: accountId,
        walletId: wallet.id,
        status: Status.ACTIVE,
      },
    });

    if (!targetAccount) {
      SendError(res, CREATOR_WALLET_MESSAGES.PAYOUT_ACCOUNT_NOT_FOUND, 404);
      return;
    }

    const intent = req.query.intent as string | undefined;

    if (intent === 'cancel_pending' && targetAccount.verificationStatus === VerificationStatus.VERIFIED) {
      SendError(res, CREATOR_WALLET_MESSAGES.PAYOUT_ACCOUNT_ALREADY_VERIFIED, 409);
      return;
    }

    const pendingWithdrawal = await prisma.payoutRequest.findFirst({
      where: {
        walletId: wallet.id,
        payoutAccountId: targetAccount.id,
        payoutStatus: PayoutStatus.PENDING,
        status: Status.ACTIVE,
      },
    });

    if (pendingWithdrawal) {
      SendError(res, CREATOR_WALLET_MESSAGES.PAYOUT_ACCOUNT_HAS_PENDING_WITHDRAWAL, 400);
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.brandPayoutAccount.update({
        where: { id: targetAccount.id },
        data: { status: Status.DELETED, isPrimary: false },
      });

      if (targetAccount.isPrimary) {
        const remainingAccount =
          (await tx.brandPayoutAccount.findFirst({
            where: {
              walletId: wallet.id,
              status: Status.ACTIVE,
              verificationStatus: VerificationStatus.VERIFIED,
              id: { not: targetAccount.id },
            },
            orderBy: { createdAt: 'desc' },
          })) ??
          (await tx.brandPayoutAccount.findFirst({
            where: {
              walletId: wallet.id,
              status: Status.ACTIVE,
              id: { not: targetAccount.id },
            },
            orderBy: { createdAt: 'desc' },
          }));

        if (remainingAccount) {
          await tx.brandPayoutAccount.update({
            where: { id: remainingAccount.id },
            data: { isPrimary: true },
          });
        }
      }
    });

    SendSuccess(res, null, CREATOR_WALLET_MESSAGES.PAYOUT_ACCOUNT_DELETED_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `GET /wallet/creator/summary`:
 * Retrieves the creator wallet balance and aggregated financial metrics
 * (active balance, total earnings from campaigns, total withdrawn, pending withdrawal requests count).
 *
 * @param req - Express request object with authenticated creator account.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetCreatorWalletSummary(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CREATOR_WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR) {
      SendError(res, CREATOR_WALLET_MESSAGES.CREATOR_ROLE_REQUIRED, 403);
      return;
    }

    const wallet = await prisma.wallet.findFirst({
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    });

    if (!wallet) {
      SendError(res, CREATOR_WALLET_MESSAGES.WALLET_NOT_FOUND, 404);
      return;
    }

    const earningsQuery = {
      where: {
        walletId: wallet.id,
        type: WalletTransactionType.CAMPAIGN_EARNING,
        status: Status.ACTIVE,
      },
      _sum: {
        amount: true as const,
      },
    };

    const withdrawnQuery = {
      where: {
        walletId: wallet.id,
        type: WalletTransactionType.WITHDRAWAL,
        status: Status.ACTIVE,
      },
      _sum: {
        amount: true as const,
      },
    };

    const pendingCountQuery = {
      where: {
        walletId: wallet.id,
        payoutStatus: PayoutStatus.PENDING,
        status: Status.ACTIVE,
      },
    };

    const [earningsAggregate, withdrawnAggregate, pendingWithdrawalsCount] = await Promise.all([
      prisma.walletTransaction.aggregate(earningsQuery),
      prisma.walletTransaction.aggregate(withdrawnQuery),
      prisma.payoutRequest.count(pendingCountQuery),
    ]);

    const activeBalance = Number(wallet.balance);
    const totalEarnings = Number(earningsAggregate._sum.amount ?? 0);
    const totalWithdrawn = Number(withdrawnAggregate._sum.amount ?? 0);

    const summary: CreatorWalletSummary = {
      walletId: wallet.id,
      balance: activeBalance,
      metrics: {
        activeBalance,
        totalEarnings,
        totalWithdrawn,
        pendingWithdrawalsCount,
      },
    };

    SendSuccess(res, summary, CREATOR_WALLET_MESSAGES.SUMMARY_FETCH_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `GET /wallet/creator/transactions`:
 * Retrieves paginated ledger transactions for the authenticated creator,
 * enriched with campaign and submission details.
 *
 * @param req - Express request object with filter query parameters.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetCreatorTransactions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CREATOR_WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR) {
      SendError(res, CREATOR_WALLET_MESSAGES.CREATOR_ROLE_REQUIRED, 403);
      return;
    }

    const validationResult = CreatorTransactionQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      const errorMessage = firstIssue ? firstIssue.message : 'Parameter query tidak valid.';
      SendError(res, errorMessage, 400);
      return;
    }

    const { type, page, limit, search } = validationResult.data;

    const wallet = await prisma.wallet.findFirst({
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    });

    if (!wallet) {
      SendError(res, CREATOR_WALLET_MESSAGES.WALLET_NOT_FOUND, 404);
      return;
    }

    const creatorAllowedTypes = [
      WalletTransactionType.CAMPAIGN_EARNING,
      WalletTransactionType.WITHDRAWAL,
    ];

    const typeFilter =
      type === 'ALL'
        ? { in: creatorAllowedTypes }
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
        { campaign: { title: { contains: search, mode: 'insensitive' } } },
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
        include: {
          campaign: {
            select: {
              id: true,
              title: true,
              cpm: true,
            },
          },
          submission: {
            select: {
              id: true,
              liveVideoUrl: true,
              verifiedViews: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const transactions: CreatorTransactionItem[] = records.map((item) => ({
      id: item.id,
      referenceCode: item.referenceCode,
      type: item.type as 'CAMPAIGN_EARNING' | 'WITHDRAWAL',
      amount: Number(item.amount),
      balanceBefore: Number(item.balanceBefore),
      balanceAfter: Number(item.balanceAfter),
      description: item.description,
      transactionDate: item.transactionDate,
      createdAt: item.createdAt,
      campaignId: item.campaignId ?? item.campaign?.id ?? null,
      campaignTitle: item.campaign?.title ?? null,
      cpmRate: item.campaign?.cpm ? Number(item.campaign.cpm) : null,
      submissionId: item.submissionId ?? item.submission?.id ?? null,
      videoUrl: item.submission?.liveVideoUrl ?? null,
      verifiedViews: item.submission?.verifiedViews ?? null,
    }));

    const responsePayload: PaginatedCreatorTransactionsResponse = {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    SendSuccess(res, responsePayload, CREATOR_WALLET_MESSAGES.TRANSACTIONS_FETCH_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `GET /wallet/creator/withdrawals/active`:
 * Retrieves all active pending withdrawal requests for the authenticated creator.
 *
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetActiveCreatorWithdrawals(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CREATOR_WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR) {
      SendError(res, CREATOR_WALLET_MESSAGES.CREATOR_ROLE_REQUIRED, 403);
      return;
    }

    const wallet = await prisma.wallet.findFirst({
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    });

    if (!wallet) {
      SendSuccess(res, [], CREATOR_WALLET_MESSAGES.ACTIVE_WITHDRAWALS_FETCH_SUCCESS);
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
      payoutAccountId: r.payoutAccountId,
      rejectionReason: r.rejectionReason,
      transferProofUrl: r.transferProofUrl,
      adminNote: r.adminNote,
      cancellationRequestedAt: r.cancellationRequestedAt,
      cancellationReason: r.cancellationReason,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    SendSuccess(res, result, CREATOR_WALLET_MESSAGES.ACTIVE_WITHDRAWALS_FETCH_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /wallet/creator/withdraw`:
 * Submits a new withdrawal request for the authenticated creator,
 * deducting/reserving funds from active balance and creating a pending PayoutRequest.
 *
 * @param req - Express request object with withdrawal payload.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function CreateCreatorWithdrawal(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CREATOR_WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR) {
      SendError(res, CREATOR_WALLET_MESSAGES.CREATOR_ROLE_REQUIRED, 403);
      return;
    }

    const validationResult = CreateCreatorWithdrawalSchema.safeParse(req.body);

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      const errorMessage = firstIssue ? firstIssue.message : 'Data penarikan saldo tidak valid.';
      SendError(res, errorMessage, 400);
      return;
    }

    const payload = validationResult.data;

    const wallet = await prisma.wallet.findFirst({
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    });

    if (!wallet) {
      SendError(res, CREATOR_WALLET_MESSAGES.WALLET_NOT_FOUND, 404);
      return;
    }

    if (Number(wallet.balance) < payload.amount) {
      SendError(res, CREATOR_WALLET_MESSAGES.INSUFFICIENT_BALANCE, 400);
      return;
    }

    const targetAccount = await prisma.brandPayoutAccount.findFirst({
      where: {
        id: payload.payoutAccountId,
        walletId: wallet.id,
        status: Status.ACTIVE,
      },
    });

    if (!targetAccount) {
      SendError(res, CREATOR_WALLET_MESSAGES.PAYOUT_ACCOUNT_NOT_FOUND, 404);
      return;
    }

    if (targetAccount.verificationStatus !== VerificationStatus.VERIFIED) {
      SendError(res, CREATOR_WALLET_MESSAGES.PAYOUT_ACCOUNT_NOT_VERIFIED, 400);
      return;
    }

    const withdrawalReference = GenerateWithdrawalReferenceCode();
    const transactionReference = GenerateWalletTransactionReferenceCode();

    const createdPayout = await prisma.$transaction(async (tx) => {
      const currentWallet = await tx.wallet.findUniqueOrThrow({
        where: { id: wallet.id },
      });

      const balanceBefore = Number(currentWallet.balance);

      if (balanceBefore < payload.amount) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      const balanceAfter = balanceBefore - payload.amount;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: new Prisma.Decimal(balanceAfter),
        },
      });

      await tx.walletTransaction.create({
        data: {
          referenceCode: transactionReference,
          walletId: wallet.id,
          type: WalletTransactionType.WITHDRAWAL,
          amount: new Prisma.Decimal(payload.amount),
          balanceBefore: new Prisma.Decimal(balanceBefore),
          balanceAfter: new Prisma.Decimal(balanceAfter),
          description: `Penarikan saldo ke ${targetAccount.provider} (${targetAccount.accountNumber}) - ${withdrawalReference}`,
          transactionDate: new Date(),
          status: Status.ACTIVE,
        },
      });

      return tx.payoutRequest.create({
        data: {
          referenceCode: withdrawalReference,
          walletId: wallet.id,
          amount: new Prisma.Decimal(payload.amount),
          accountProvider: targetAccount.provider,
          accountNumber: targetAccount.accountNumber,
          accountHolderName: targetAccount.accountHolderName,
          payoutAccountId: targetAccount.id,
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
      payoutAccountId: createdPayout.payoutAccountId,
      rejectionReason: createdPayout.rejectionReason,
      transferProofUrl: createdPayout.transferProofUrl,
      adminNote: createdPayout.adminNote,
      cancellationRequestedAt: createdPayout.cancellationRequestedAt,
      cancellationReason: createdPayout.cancellationReason,
      createdAt: createdPayout.createdAt,
      updatedAt: createdPayout.updatedAt,
    };

    SendSuccess(res, record, CREATOR_WALLET_MESSAGES.WITHDRAWAL_CREATED_SUCCESS, 201);
  } catch (err) {
    if (err instanceof Error && err.message === 'INSUFFICIENT_BALANCE') {
      SendError(res, CREATOR_WALLET_MESSAGES.INSUFFICIENT_BALANCE, 400);
      return;
    }
    next(err);
  }
}

/**
 * Handles `POST /wallet/creator/withdraw/:id/request-cancel`:
 * Requests cancellation of a pending withdrawal request for the creator.
 *
 * @param req - Express request object with withdrawal id param and optional reason.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function RequestCreatorWithdrawalCancellation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CREATOR_WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR) {
      SendError(res, CREATOR_WALLET_MESSAGES.CREATOR_ROLE_REQUIRED, 403);
      return;
    }

    const withdrawalId = req.params.id as string;

    const validationResult = RequestWithdrawalCancellationSchema.safeParse(req.body ?? {});

    if (!validationResult.success) {
      SendError(res, WALLET_MESSAGES.INVALID_CANCELLATION_PAYLOAD, 400);
      return;
    }

    const wallet = await prisma.wallet.findFirst({
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    });

    if (!wallet) {
      SendError(res, CREATOR_WALLET_MESSAGES.WALLET_NOT_FOUND, 404);
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
      SendError(res, CREATOR_WALLET_MESSAGES.WITHDRAWAL_NOT_FOUND, 404);
      return;
    }

    if (payout.payoutStatus !== PayoutStatus.PENDING) {
      SendError(res, CREATOR_WALLET_MESSAGES.WITHDRAWAL_ALREADY_PROCESSED, 400);
      return;
    }

    if (payout.cancellationRequestedAt) {
      SendError(res, CREATOR_WALLET_MESSAGES.WITHDRAWAL_CANCELLATION_ALREADY_REQUESTED, 400);
      return;
    }

    const reason = validationResult.data?.reason?.trim() || null;

    const updatedPayout = await prisma.payoutRequest.update({
      where: { id: payout.id },
      data: {
        cancellationRequestedAt: new Date(),
        cancellationReason: reason,
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
      payoutAccountId: updatedPayout.payoutAccountId,
      rejectionReason: updatedPayout.rejectionReason,
      transferProofUrl: updatedPayout.transferProofUrl,
      adminNote: updatedPayout.adminNote,
      cancellationRequestedAt: updatedPayout.cancellationRequestedAt,
      cancellationReason: updatedPayout.cancellationReason,
      createdAt: updatedPayout.createdAt,
      updatedAt: updatedPayout.updatedAt,
    };

    SendSuccess(res, record, CREATOR_WALLET_MESSAGES.WITHDRAWAL_CANCELLATION_REQUESTED_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /wallet/creator/simulate-earning`:
 * Simulates crediting campaign video views earnings to creator wallet for testing / QA.
 *
 * @param req - Express request object with earning payload.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function SimulateCreatorEarning(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CREATOR_WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR) {
      SendError(res, CREATOR_WALLET_MESSAGES.CREATOR_ROLE_REQUIRED, 403);
      return;
    }

    const validationResult = SimulateCreatorEarningSchema.safeParse(req.body);

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      const errorMessage = firstIssue ? firstIssue.message : 'Payload simulasi perolehan saldo tidak valid.';
      SendError(res, errorMessage, 400);
      return;
    }

    const payload = validationResult.data;

    const wallet = await prisma.wallet.findFirst({
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    });

    if (!wallet) {
      SendError(res, CREATOR_WALLET_MESSAGES.WALLET_NOT_FOUND, 404);
      return;
    }

    const transactionReference = GenerateWalletTransactionReferenceCode();

    const result = await prisma.$transaction(async (tx) => {
      const currentWallet = await tx.wallet.findUniqueOrThrow({
        where: { id: wallet.id },
      });

      const balanceBefore = Number(currentWallet.balance);
      const balanceAfter = balanceBefore + payload.amount;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: new Prisma.Decimal(balanceAfter),
        },
      });

      const description = payload.campaignTitle
        ? `Perolehan saldo video: ${payload.campaignTitle}`
        : 'Perolehan saldo penayangan video clipping';

      await tx.walletTransaction.create({
        data: {
          referenceCode: transactionReference,
          walletId: wallet.id,
          type: WalletTransactionType.CAMPAIGN_EARNING,
          amount: new Prisma.Decimal(payload.amount),
          balanceBefore: new Prisma.Decimal(balanceBefore),
          balanceAfter: new Prisma.Decimal(balanceAfter),
          description,
          transactionDate: new Date(),
          status: Status.ACTIVE,
        },
      });

      return { balance: balanceAfter };
    });

    SendSuccess(res, result, CREATOR_WALLET_MESSAGES.SIMULATE_EARNING_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /wallet/creator/withdraw/:id/approve`:
 * Simulates sandbox/admin approval of a creator withdrawal request.
 *
 * @param req - Express request object with withdrawal id param.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function SimulateCreatorWithdrawalApproval(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CREATOR_WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    const withdrawalId = req.params.id as string;

    const payout = await prisma.payoutRequest.findFirst({
      where: {
        id: withdrawalId,
        status: Status.ACTIVE,
      },
    });

    if (!payout) {
      SendError(res, CREATOR_WALLET_MESSAGES.WITHDRAWAL_NOT_FOUND, 404);
      return;
    }

    if (payout.payoutStatus === PayoutStatus.APPROVED) {
      SendError(res, CREATOR_WALLET_MESSAGES.WITHDRAWAL_ALREADY_PROCESSED, 400);
      return;
    }

    const updatedPayout = await prisma.payoutRequest.update({
      where: { id: payout.id },
      data: {
        payoutStatus: PayoutStatus.APPROVED,
        processedAt: new Date(),
        adminNote: 'Pencairan disetujui otomatis melalui simulasi testing',
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
      payoutAccountId: updatedPayout.payoutAccountId,
      rejectionReason: updatedPayout.rejectionReason,
      transferProofUrl: updatedPayout.transferProofUrl,
      adminNote: updatedPayout.adminNote,
      cancellationRequestedAt: updatedPayout.cancellationRequestedAt,
      cancellationReason: updatedPayout.cancellationReason,
      createdAt: updatedPayout.createdAt,
      updatedAt: updatedPayout.updatedAt,
    };

    SendSuccess(res, record, CREATOR_WALLET_MESSAGES.WITHDRAWAL_APPROVAL_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /wallet/creator/payout-accounts/:id/verify`:
 * Simulates sandbox/admin KYC verification of a creator payout account.
 *
 * @param req - Express request with payout account ID param.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function SimulateCreatorPayoutAccountVerification(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CREATOR_WALLET_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    const accountId = req.params.id as string;

    const targetAccount = await prisma.brandPayoutAccount.findFirst({
      where: {
        id: accountId,
        status: Status.ACTIVE,
      },
    });

    if (!targetAccount) {
      SendError(res, CREATOR_WALLET_MESSAGES.PAYOUT_ACCOUNT_NOT_FOUND, 404);
      return;
    }

    const updatedAccount = await prisma.brandPayoutAccount.update({
      where: { id: targetAccount.id },
      data: {
        verificationStatus: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        rejectionReason: null,
      },
    });

    const record = {
      id: updatedAccount.id,
      walletId: updatedAccount.walletId,
      accountType: updatedAccount.accountType,
      provider: updatedAccount.provider,
      accountNumber: updatedAccount.accountNumber,
      accountHolderName: updatedAccount.accountHolderName,
      proofUrl: updatedAccount.proofUrl,
      isPrimary: updatedAccount.isPrimary,
      verificationStatus: updatedAccount.verificationStatus,
      rejectionReason: updatedAccount.rejectionReason,
      createdAt: updatedAccount.createdAt,
      updatedAt: updatedAccount.updatedAt,
    };

    SendSuccess(res, record, CREATOR_WALLET_MESSAGES.PAYOUT_ACCOUNT_VERIFIED_SUCCESS);
  } catch (err) {
    next(err);
  }
}

