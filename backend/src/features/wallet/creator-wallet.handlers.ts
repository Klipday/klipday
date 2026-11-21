import { Readable } from 'node:stream';
import { TransformStream } from 'node:stream/web';
import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';
import {
  NotificationType,
  PayoutStatus,
  Role,
  Status,
  VerificationStatus,
  WalletTransactionType,
} from '../../generated/prisma/enums.js';
import { SendError, SendSuccess } from '../../utils/api-response.js';
import { prisma } from '../../utils/prisma.js';
import { NotifyAdminPendingItem } from '../../services/notification/notification.dispatcher.js';
import {
  ALLOWED_PROOF_MIME_TYPES,
  CREATOR_PAYOUT_LIMITS,
  CREATOR_WALLET_MESSAGES,
  WALLET_MESSAGES,
  WITHDRAWAL_LIMITS,
} from './wallet.constants.js';
import {
  DetectProofImageMagicBytes,
  ExtractStreamValidationErrorCode,
  GenerateWithdrawalReferenceCode,
  MapPayoutRequestToRecord,
  MergeProofHeaderChunks,
} from './wallet.helper.js';
import {
  CreateCreatorPayoutAccountSchema,
  CreateCreatorWithdrawalSchema,
  CreatorTransactionQuerySchema,
  RequestWithdrawalCancellationSchema,
  UuidParamSchema,
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

    // Never demote an existing VERIFIED primary account when creating an unverified PENDING account
    const hasVerifiedPrimary =
      hasPrimaryAccount?.verificationStatus === VerificationStatus.VERIFIED;
    const shouldBePrimary =
      !hasPrimaryAccount || (!hasVerifiedPrimary && Boolean(payload.isPrimary));

    const createdAccount = await prisma.$transaction(async (tx) => {
      if (typeof tx.brandPayoutAccount.count === 'function') {
        const txActiveCount = await tx.brandPayoutAccount.count({
          where: {
            walletId: wallet.id,
            status: Status.ACTIVE,
          },
        });
        if (txActiveCount >= CREATOR_PAYOUT_LIMITS.MAX_ACCOUNTS) {
          throw new Error('PAYOUT_ACCOUNT_LIMIT_EXCEEDED');
        }
      }

      if (typeof tx.brandPayoutAccount.findFirst === 'function') {
        const txDuplicate = await tx.brandPayoutAccount.findFirst({
          where: {
            walletId: wallet.id,
            provider: normalizedProvider,
            accountNumber: normalizedAccountNumber,
            status: Status.ACTIVE,
          },
        });
        if (txDuplicate) {
          throw new Error('PAYOUT_ACCOUNT_DUPLICATE');
        }
      }

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

    void NotifyAdminPendingItem({
      type: NotificationType.ADMIN_NEW_KYC,
      title: 'Dokumen KYC Baru Menunggu Verifikasi',
      message: 'Creator baru mengajukan verifikasi data rekening / identitas.',
      actionUrl: '/admin-dashboard/kyc',
      metadata: { payoutAccountId: createdAccount.id },
    });

    SendSuccess(res, record, CREATOR_WALLET_MESSAGES.PAYOUT_ACCOUNT_CREATED_SUCCESS, 201);
  } catch (err) {
    if (err instanceof Error && err.message === 'PAYOUT_ACCOUNT_LIMIT_EXCEEDED') {
      SendError(res, CREATOR_WALLET_MESSAGES.PAYOUT_ACCOUNT_LIMIT_EXCEEDED, 400);
      return;
    }
    if (err instanceof Error && err.message === 'PAYOUT_ACCOUNT_DUPLICATE') {
      SendError(res, CREATOR_WALLET_MESSAGES.PAYOUT_ACCOUNT_DUPLICATE, 409);
      return;
    }
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
    let headerValidated = false;
    let headerBufferedLength = 0;
    let headerChunks: Uint8Array[] = [];

    const streamValidator = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        bytesReceived += chunk.byteLength;
        if (bytesReceived > CREATOR_PAYOUT_LIMITS.MAX_PROOF_SIZE_BYTES) {
          controller.error(new Error('FILE_SIZE_EXCEEDED'));
          return;
        }

        if (headerValidated) {
          controller.enqueue(chunk);
          return;
        }

        headerChunks.push(chunk);
        headerBufferedLength += chunk.byteLength;

        if (headerBufferedLength >= CREATOR_PAYOUT_LIMITS.IMAGE_SIGNATURE_HEADER_BYTES) {
          const mergedHeader = MergeProofHeaderChunks(headerChunks, headerBufferedLength);
          const detectedExt = DetectProofImageMagicBytes(mergedHeader);
          if (detectedExt !== fileExtension) {
            controller.error(new Error('INVALID_IMAGE_SIGNATURE'));
            return;
          }

          headerValidated = true;
          headerChunks = [];
          controller.enqueue(mergedHeader);
        }
      },
      flush(controller) {
        if (headerValidated) {
          return;
        }

        if (headerBufferedLength === 0) {
          controller.error(new Error('INVALID_IMAGE_SIGNATURE'));
          return;
        }

        const mergedHeader = MergeProofHeaderChunks(headerChunks, headerBufferedLength);
        const detectedExt = DetectProofImageMagicBytes(mergedHeader);
        if (detectedExt !== fileExtension) {
          controller.error(new Error('INVALID_IMAGE_SIGNATURE'));
          return;
        }

        headerValidated = true;
        headerChunks = [];
        controller.enqueue(mergedHeader);
      },
    });

    const webStream = Readable.toWeb(req).pipeThrough(streamValidator);
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
    const validationCode = ExtractStreamValidationErrorCode(error);
    if (validationCode === 'FILE_SIZE_EXCEEDED') {
      SendError(res, WALLET_MESSAGES.FILE_SIZE_EXCEEDED, 400);
      return;
    }
    if (validationCode === 'INVALID_IMAGE_SIGNATURE') {
      SendError(res, CREATOR_WALLET_MESSAGES.INVALID_IMAGE_SIGNATURE, 400);
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

    const idValidation = UuidParamSchema.safeParse(req.params.id);
    if (!idValidation.success) {
      SendError(res, CREATOR_WALLET_MESSAGES.INVALID_ID_PARAM, 400);
      return;
    }
    const accountId = idValidation.data;

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

    const idValidation = UuidParamSchema.safeParse(req.params.id);
    if (!idValidation.success) {
      SendError(res, CREATOR_WALLET_MESSAGES.INVALID_ID_PARAM, 400);
      return;
    }
    const accountId = idValidation.data;

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
      // Re-verify inside transaction to prevent concurrent withdrawal + delete race
      if (typeof tx.payoutRequest?.findFirst === 'function') {
        const txPendingWithdrawal = await tx.payoutRequest.findFirst({
          where: {
            walletId: wallet.id,
            payoutAccountId: targetAccount.id,
            payoutStatus: PayoutStatus.PENDING,
            status: Status.ACTIVE,
          },
          select: { id: true },
        });
        if (txPendingWithdrawal) {
          throw new Error('PAYOUT_ACCOUNT_HAS_PENDING_WITHDRAWAL');
        }
      }

      if (intent === 'cancel_pending' && typeof tx.brandPayoutAccount.updateMany === 'function') {
        const cancelResult = await tx.brandPayoutAccount.updateMany({
          where: {
            id: targetAccount.id,
            walletId: wallet.id,
            status: Status.ACTIVE,
            verificationStatus: VerificationStatus.PENDING,
          },
          data: { status: Status.DELETED, isPrimary: false },
        });
        if (cancelResult.count === 0) {
          throw new Error('PAYOUT_ACCOUNT_ALREADY_VERIFIED');
        }
      } else {
        await tx.brandPayoutAccount.update({
          where: { id: targetAccount.id },
          data: { status: Status.DELETED, isPrimary: false },
        });
      }

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
    if (err instanceof Error && err.message === 'PAYOUT_ACCOUNT_ALREADY_VERIFIED') {
      SendError(res, CREATOR_WALLET_MESSAGES.PAYOUT_ACCOUNT_ALREADY_VERIFIED, 409);
      return;
    }
    if (err instanceof Error && err.message === 'PAYOUT_ACCOUNT_HAS_PENDING_WITHDRAWAL') {
      SendError(res, CREATOR_WALLET_MESSAGES.PAYOUT_ACCOUNT_HAS_PENDING_WITHDRAWAL, 400);
      return;
    }
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
    const withdrawalAmountDecimal = new Prisma.Decimal(payload.amount);
    const idempotencyCutoff = new Date(Date.now() - WITHDRAWAL_LIMITS.IDEMPOTENCY_WINDOW_MS);

    const createdPayout = await prisma.$transaction(async (tx) => {
      // Re-verify payout account is still active and verified inside transaction
      if (typeof tx.brandPayoutAccount?.findFirst === 'function') {
        const txAccount = await tx.brandPayoutAccount.findFirst({
          where: {
            id: targetAccount.id,
            walletId: wallet.id,
            status: Status.ACTIVE,
            verificationStatus: VerificationStatus.VERIFIED,
          },
          select: { id: true },
        });
        if (!txAccount) {
          throw new Error('PAYOUT_ACCOUNT_NOT_VERIFIED');
        }
      }

      // 60-second idempotency guard prevents accidental 2-tab or slow-network duplicate withdrawals
      if (typeof tx.payoutRequest?.findFirst === 'function') {
        const recentDuplicate = await tx.payoutRequest.findFirst({
          where: {
            walletId: wallet.id,
            payoutAccountId: targetAccount.id,
            amount: withdrawalAmountDecimal,
            payoutStatus: PayoutStatus.PENDING,
            status: Status.ACTIVE,
            createdAt: { gte: idempotencyCutoff },
          },
          select: { id: true },
        });
        if (recentDuplicate) {
          throw new Error('DUPLICATE_WITHDRAWAL_REQUEST');
        }
      }

      // Atomic conditional decrement prevents concurrent double-spending on the same wallet balance
      const walletDeductPayload = {
        where: {
          id: wallet.id,
          status: Status.ACTIVE,
          balance: { gte: withdrawalAmountDecimal },
        },
        data: {
          balance: { decrement: withdrawalAmountDecimal },
        },
      };
      const deductResult = await tx.wallet.updateMany(walletDeductPayload);

      if (deductResult.count === 0) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      const createPayoutPayload = {
        data: {
          referenceCode: withdrawalReference,
          walletId: wallet.id,
          amount: withdrawalAmountDecimal,
          accountProvider: targetAccount.provider,
          accountNumber: targetAccount.accountNumber,
          accountHolderName: targetAccount.accountHolderName,
          payoutAccountId: targetAccount.id,
          payoutStatus: PayoutStatus.PENDING,
          status: Status.ACTIVE,
        },
      };
      const payout = await tx.payoutRequest.create(createPayoutPayload);
      return payout;
    });

    const record: PayoutRequestRecord = MapPayoutRequestToRecord(createdPayout);

    void NotifyAdminPendingItem({
      type: NotificationType.ADMIN_NEW_WITHDRAWAL,
      title: 'Penarikan Dana Kreator Baru',
      message: `Permintaan penarikan saldo kreator sebesar Rp ${Number(payload.amount).toLocaleString('id-ID')} menunggu transfer.`,
      actionUrl: '/admin-dashboard/withdrawals',
      metadata: { withdrawalId: createdPayout.id, amount: payload.amount },
    });

    SendSuccess(res, record, CREATOR_WALLET_MESSAGES.WITHDRAWAL_CREATED_SUCCESS, 201);
  } catch (err) {
    if (err instanceof Error && err.message === 'INSUFFICIENT_BALANCE') {
      SendError(res, CREATOR_WALLET_MESSAGES.INSUFFICIENT_BALANCE, 400);
      return;
    }
    if (err instanceof Error && err.message === 'PAYOUT_ACCOUNT_NOT_VERIFIED') {
      SendError(res, CREATOR_WALLET_MESSAGES.PAYOUT_ACCOUNT_NOT_VERIFIED, 400);
      return;
    }
    if (err instanceof Error && err.message === 'DUPLICATE_WITHDRAWAL_REQUEST') {
      SendError(res, CREATOR_WALLET_MESSAGES.DUPLICATE_WITHDRAWAL_REQUEST, 409);
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

    const idValidation = UuidParamSchema.safeParse(req.params.id);
    if (!idValidation.success) {
      SendError(res, CREATOR_WALLET_MESSAGES.INVALID_ID_PARAM, 400);
      return;
    }
    const withdrawalId = idValidation.data;

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

    const cancelUpdatePayload = {
      where: {
        id: payout.id,
        walletId: wallet.id,
        status: Status.ACTIVE,
        payoutStatus: PayoutStatus.PENDING,
        cancellationRequestedAt: null,
      },
      data: {
        cancellationRequestedAt: new Date(),
        cancellationReason: reason,
      },
    };
    const cancelResult = await prisma.payoutRequest.updateMany(cancelUpdatePayload);

    if (cancelResult.count === 0) {
      SendError(res, CREATOR_WALLET_MESSAGES.WITHDRAWAL_ALREADY_PROCESSED, 400);
      return;
    }

    const refreshedPayoutQuery = {
      where: {
        id: payout.id,
        walletId: wallet.id,
        status: Status.ACTIVE,
      },
    };
    const updatedPayout = await prisma.payoutRequest.findFirst(refreshedPayoutQuery);

    if (!updatedPayout) {
      SendError(res, CREATOR_WALLET_MESSAGES.WITHDRAWAL_NOT_FOUND, 404);
      return;
    }

    const record: PayoutRequestRecord = MapPayoutRequestToRecord(updatedPayout);

    SendSuccess(res, record, CREATOR_WALLET_MESSAGES.WITHDRAWAL_CANCELLATION_REQUESTED_SUCCESS);
  } catch (err) {
    next(err);
  }
}


