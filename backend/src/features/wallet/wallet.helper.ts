import { randomInt } from 'node:crypto';
import { Prisma } from '../../generated/prisma/client.js';
import type { PrismaClient, Wallet } from '../../generated/prisma/client.js';
import { PaymentStatus, PayoutStatus, Role, Status } from '../../generated/prisma/enums.js';
import { prisma } from '../../utils/prisma.js';
import { TOP_UP_LIMITS } from './wallet.constants.js';
import type { PayoutRequestRecord, TopUpRequestRecord } from './wallet.types.js';

interface TopUpRequestEntityFields {
  id: string;
  referenceCode: string;
  walletId: string;
  amount: Prisma.Decimal | number;
  uniqueCode: number;
  totalPayable: Prisma.Decimal | number;
  destinationBank: string;
  destinationAccount: string;
  destinationHolderName: string;
  senderBank: string | null;
  senderAccountName: string | null;
  transferProofUrl: string | null;
  status: PaymentStatus;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PayoutRequestEntityFields {
  id: string;
  referenceCode: string;
  walletId: string;
  amount: Prisma.Decimal | number;
  accountProvider: string;
  accountNumber: string;
  accountHolderName: string;
  payoutStatus: PayoutStatus;
  payoutAccountId?: string | null;
  rejectionReason: string | null;
  transferProofUrl: string | null;
  adminNote: string | null;
  cancellationRequestedAt: Date | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Maps a TopUpRequest entity into its serialized API DTO record.
 *
 * @param topUp - Prisma TopUpRequest record.
 * @returns Normalized TopUpRequestRecord DTO.
 */
export function MapTopUpRequestToRecord(topUp: TopUpRequestEntityFields): TopUpRequestRecord {
  const record: TopUpRequestRecord = {
    id: topUp.id,
    referenceCode: topUp.referenceCode,
    walletId: topUp.walletId,
    amount: Number(topUp.amount),
    uniqueCode: topUp.uniqueCode,
    totalPayable: Number(topUp.totalPayable),
    destinationBank: topUp.destinationBank,
    destinationAccount: topUp.destinationAccount,
    destinationHolderName: topUp.destinationHolderName,
    senderBank: topUp.senderBank,
    senderAccountName: topUp.senderAccountName,
    transferProofUrl: topUp.transferProofUrl,
    status: topUp.status,
    rejectionReason: topUp.rejectionReason,
    createdAt: topUp.createdAt,
    updatedAt: topUp.updatedAt,
  };
  return record;
}

/**
 * Maps a PayoutRequest entity into its serialized API DTO record.
 *
 * @param payout - Prisma PayoutRequest record.
 * @returns Normalized PayoutRequestRecord DTO.
 */
export function MapPayoutRequestToRecord(payout: PayoutRequestEntityFields): PayoutRequestRecord {
  const record: PayoutRequestRecord = {
    id: payout.id,
    referenceCode: payout.referenceCode,
    walletId: payout.walletId,
    amount: Number(payout.amount),
    accountProvider: payout.accountProvider,
    accountNumber: payout.accountNumber,
    accountHolderName: payout.accountHolderName,
    payoutStatus: payout.payoutStatus,
    ...(payout.payoutAccountId !== undefined ? { payoutAccountId: payout.payoutAccountId } : {}),
    rejectionReason: payout.rejectionReason,
    transferProofUrl: payout.transferProofUrl,
    adminNote: payout.adminNote,
    cancellationRequestedAt: payout.cancellationRequestedAt,
    cancellationReason: payout.cancellationReason,
    createdAt: payout.createdAt,
    updatedAt: payout.updatedAt,
  };
  return record;
}

/**
 * Generates a human-readable reference code for top-up requests (e.g. TU-XXXXXX-XXXX).
 *
 * @returns Formatted reference code string.
 */
export function GenerateTopUpReferenceCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSuffix = randomInt(1000, 10000);
  const refCode = `TU-${timestamp}-${randomSuffix}`;
  return refCode;
}

/**
 * Generates a standardized transaction reference code for Klipday wallet logs (e.g. TXN-XXXXXX-XXXX).
 *
 * @returns Formatted transaction reference code string.
 */
export function GenerateWalletTransactionReferenceCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSuffix = randomInt(1000, 10000);
  const refCode = `TXN-${timestamp}-${randomSuffix}`;
  return refCode;
}

/**
 * Generates a cryptographically random 3-digit verification unique code between 100 and 999.
 *
 * @returns Three-digit integer unique code.
 */
export function GenerateTopUpUniqueCode(): number {
  const code = randomInt(TOP_UP_LIMITS.UNIQUE_CODE_MIN, TOP_UP_LIMITS.UNIQUE_CODE_MAX + 1);
  return code;
}

/**
 * Generates a human-readable reference code for withdrawal requests (e.g. WD-XXXXXX-XXXX).
 *
 * @returns Formatted reference code string.
 */
export function GenerateWithdrawalReferenceCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSuffix = randomInt(1000, 10000);
  const refCode = `WD-${timestamp}-${randomSuffix}`;
  return refCode;
}

/**
 * @deprecated Use `BuildInitialWalletCreateData` in `auth.helper.ts` for atomic nested creation during registration.
 * Eagerly provisions an active wallet with zero balance for an account.
 * Only BRAND and CREATOR roles receive a wallet; ADMIN accounts are ignored.
 * Idempotent: If a wallet already exists for the account, it returns the existing wallet.
 *
 * @param accountId - The unique ID of the account to provision.
 * @param role - The account role (BRAND, CREATOR, ADMIN). If omitted, it will be looked up.
 * @param db - Optional Prisma client or transaction client for atomic execution.
 * @returns The created or existing Wallet, or null if role is ADMIN or account is not found.
 */
export async function ProvisionAccountWallet(
  accountId: string,
  role?: Role,
  db: PrismaClient | Prisma.TransactionClient = prisma,
): Promise<Wallet | null> {
  if (!accountId || typeof accountId !== 'string' || accountId.trim() === '') {
    return null;
  }

  const cleanAccountId = accountId.trim();
  let resolvedRole = role;

  if (!resolvedRole) {
    const accountLookupQuery = {
      where: { id: cleanAccountId, status: Status.ACTIVE },
      select: { role: true },
    };
    const account = await db.account.findFirst(accountLookupQuery);

    if (!account) {
      return null;
    }

    resolvedRole = account.role;
  }

  // Admins do not participate in financial transactions or campaign payouts
  if (resolvedRole === Role.ADMIN) {
    return null;
  }

  const findWalletQuery = {
    where: { accountId: cleanAccountId, status: Status.ACTIVE },
  };
  const existingWallet = await db.wallet.findFirst(findWalletQuery);

  if (existingWallet) {
    return existingWallet;
  }

  const createWalletPayload = {
    data: {
      accountId: cleanAccountId,
      balance: new Prisma.Decimal(0),
      status: Status.ACTIVE,
    },
  };

  try {
    const createdWallet = await db.wallet.create(createWalletPayload);
    return createdWallet;
  } catch (err) {
    // Gracefully handle race condition if another process created the wallet concurrently
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const concurrentWallet = await db.wallet.findFirst(findWalletQuery);
      if (concurrentWallet) {
        return concurrentWallet;
      }
    }

    throw err;
  }
}
