import { Prisma } from '../../generated/prisma/client.js';
import type { PrismaClient, Wallet } from '../../generated/prisma/client.js';
import { Role, Status } from '../../generated/prisma/enums.js';
import { prisma } from '../../utils/prisma.js';
import { TOP_UP_LIMITS } from './wallet.constants.js';

/**
 * Generates a human-readable reference code for top-up requests (e.g. TU-XXXXXX-XXXX).
 *
 * @returns Formatted reference code string.
 */
export function GenerateTopUpReferenceCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
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
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const refCode = `TXN-${timestamp}-${randomSuffix}`;
  return refCode;
}

/**
 * Generates a random 3-digit verification unique code between 100 and 999.
 *
 * @returns Three-digit integer unique code.
 */
export function GenerateTopUpUniqueCode(): number {
  const code = Math.floor(
    TOP_UP_LIMITS.UNIQUE_CODE_MIN +
      Math.random() * (TOP_UP_LIMITS.UNIQUE_CODE_MAX - TOP_UP_LIMITS.UNIQUE_CODE_MIN + 1),
  );
  return code;
}

/**
 * Generates a human-readable reference code for withdrawal requests (e.g. WD-XXXXXX-XXXX).
 *
 * @returns Formatted reference code string.
 */
export function GenerateWithdrawalReferenceCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
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
