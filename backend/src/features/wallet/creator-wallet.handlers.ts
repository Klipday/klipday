import { Readable } from 'node:stream';
import { TransformStream } from 'node:stream/web';
import type { NextFunction, Request, Response } from 'express';
import { PayoutStatus, Role, Status, VerificationStatus } from '../../generated/prisma/enums.js';
import { SendError, SendSuccess } from '../../utils/api-response.js';
import { prisma } from '../../utils/prisma.js';
import {
  ALLOWED_PROOF_MIME_TYPES,
  CREATOR_PAYOUT_LIMITS,
  CREATOR_WALLET_MESSAGES,
  WALLET_MESSAGES,
} from './wallet.constants.js';
import { CreateCreatorPayoutAccountSchema } from './wallet.schemas.js';

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

    let wallet = await prisma.wallet.findFirst({
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          accountId: account.sub,
          status: Status.ACTIVE,
        },
      });
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
