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
