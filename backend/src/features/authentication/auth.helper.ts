import crypto from 'node:crypto';
import { Prisma } from '../../generated/prisma/client.js';
import { Role, Status } from '../../generated/prisma/enums.js';
import {
  BuildPasswordResetEmailHtml,
  BuildPasswordResetEmailText,
  BuildVerificationOtpEmailHtml,
  BuildVerificationOtpEmailText,
  SendPasswordResetEmail,
  SendVerificationOtpEmail,
} from '../../services/email/index.js';

export {
  BuildPasswordResetEmailHtml,
  BuildPasswordResetEmailText,
  BuildVerificationOtpEmailHtml,
  BuildVerificationOtpEmailText,
};
import { prisma } from '../../utils/prisma.js';
import {
  AUTH_MESSAGES,
  EMAIL_VERIFICATION_CODE_LENGTH,
  EMAIL_VERIFICATION_EXPIRY_MS,
  PASSWORD_RESET_EXPIRY_MS,
} from './auth.constants.js';

/**
 * Error thrown when an outbound authentication email cannot be accepted for delivery.
 */
export class EmailDeliveryError extends Error {
  /**
   * Creates an EmailDeliveryError instance.
   *
   * @param message - Human-readable or provider-supplied delivery failure reason.
   */
  constructor(message: string) {
    super(message);
    this.name = 'EmailDeliveryError';
  }
}

/**
 * Builds the initial nested create payload for a new account's wallet.
 * Pure relational payload builder: returns initial wallet creation data
 * for financial roles (BRAND, CREATOR), or null for non-financial roles (ADMIN)
 * or invalid roles via fast-fail.
 *
 * @param role - The role of the account being registered.
 * @returns Nested wallet create payload or null if the role should not have a wallet.
 */
export function BuildInitialWalletCreateData(
  role: Role,
): Prisma.WalletCreateNestedOneWithoutAccountInput | null {
  if (role !== Role.BRAND && role !== Role.CREATOR) {
    return null;
  }

  const walletData: Prisma.WalletCreateNestedOneWithoutAccountInput = {
    create: {
      balance: new Prisma.Decimal(0),
      status: Status.ACTIVE,
    },
  };

  return walletData;
}

/**
 * Generates a cryptographically random numeric OTP string of specified length (default 6 digits).
 *
 * @param length - Number of digits (default 6).
 * @returns Zero-padded numeric string.
 */
export function GenerateNumericOtp(length: number = EMAIL_VERIFICATION_CODE_LENGTH): string {
  const max = 10 ** length;
  const num = crypto.randomInt(0, max);
  const otp = num.toString().padStart(length, '0');
  return otp;
}

/**
 * Generates a cryptographically secure random hexadecimal token string.
 *
 * @param bytes - Byte length before hex encoding (default 32).
 * @returns Hex-encoded random string.
 */
export function GenerateSecureHexToken(bytes: number = 32): string {
  const token = crypto.randomBytes(bytes).toString('hex');
  return token;
}

/**
 * Computes a deterministic SHA-256 digest of a raw token or OTP code.
 * Ensures raw secrets are never persisted in the database.
 *
 * @param raw - Plain-text secret token or code.
 * @returns 64-character lowercase hexadecimal hash.
 */
export function HashTokenOrCode(raw: string): string {
  const hash = crypto.createHash('sha256').update(raw.trim()).digest('hex');
  return hash;
}

/**
 * Resolves the public frontend client base URL for email action links.
 *
 * @returns Resolved origin URL string without trailing slash.
 */
function ResolveClientBaseUrl(): string {
  const configuredAppUrl = process.env.APP_URL?.trim();
  const configuredOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
  const primaryOrigin =
    configuredAppUrl ||
    configuredOrigin.split(',')[0]?.trim() ||
    'http://localhost:5173';
  const sanitized = primaryOrigin.replace(/\/+$/, '');
  return sanitized;
}

/**
 * Invalidates prior active verification codes for an account, persists a new 6-digit OTP,
 * and sends the verification email.
 *
 * @param accountId - Primary key of the account.
 * @param email - Target email address.
 * @returns The raw 6-digit OTP code sent.
 * @throws {EmailDeliveryError} When the email provider fails to accept the message.
 */
export async function CreateAndSendVerificationOtp(
  accountId: string,
  email: string,
): Promise<string> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + EMAIL_VERIFICATION_EXPIRY_MS);
  const rawOtp = GenerateNumericOtp();
  const codeHash = HashTokenOrCode(rawOtp);

  // Invalidate any existing unused codes for this account
  await prisma.emailVerificationCode.updateMany({
    where: {
      accountId,
      usedAt: null,
    },
    data: {
      usedAt: now,
    },
  });

  // Persist fresh OTP code record
  const createdCode = await prisma.emailVerificationCode.create({
    data: {
      accountId,
      codeHash,
      expiresAt,
    },
  });

  const baseUrl = ResolveClientBaseUrl();
  const verificationUrl = `${baseUrl}/verify-email?email=${encodeURIComponent(email)}&code=${rawOtp}`;

  const emailResult = await SendVerificationOtpEmail(email, {
    otpCode: rawOtp,
    verificationUrl,
  });

  if (!emailResult.success) {
    // Best-effort rollback so failed delivery does not burn the user's resend cooldown
    try {
      if (createdCode?.id) {
        await prisma.emailVerificationCode.delete({
          where: { id: createdCode.id },
        });
      }
    } catch (cleanupErr) {
      console.error('Failed to clean up unsent verification code:', cleanupErr);
    }

    const errorMessage = emailResult.error ?? AUTH_MESSAGES.EMAIL_DELIVERY_FAILED;
    throw new EmailDeliveryError(errorMessage);
  }

  return rawOtp;
}

/**
 * Invalidates prior active password reset tokens for an account, persists a new 1-hour token,
 * and sends the password reset email.
 *
 * @param accountId - Primary key of the account.
 * @param email - Target email address.
 * @returns The raw secret hex token sent.
 * @throws {EmailDeliveryError} When the email provider fails to accept the message.
 */
export async function CreateAndSendPasswordResetToken(
  accountId: string,
  email: string,
): Promise<string> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PASSWORD_RESET_EXPIRY_MS);
  const rawToken = GenerateSecureHexToken();
  const tokenHash = HashTokenOrCode(rawToken);

  // Invalidate any existing unused reset tokens for this account
  await prisma.passwordResetToken.updateMany({
    where: {
      accountId,
      usedAt: null,
    },
    data: {
      usedAt: now,
    },
  });

  // Persist fresh reset token record
  const createdToken = await prisma.passwordResetToken.create({
    data: {
      accountId,
      tokenHash,
      expiresAt,
    },
  });

  const baseUrl = ResolveClientBaseUrl();
  const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

  const emailResult = await SendPasswordResetEmail(email, {
    resetUrl,
  });

  if (!emailResult.success) {
    // Best-effort rollback so failed delivery does not lock the user out of requesting again
    try {
      if (createdToken?.id) {
        await prisma.passwordResetToken.delete({
          where: { id: createdToken.id },
        });
      }
    } catch (cleanupErr) {
      console.error('Failed to clean up unsent password reset token:', cleanupErr);
    }

    const errorMessage = emailResult.error ?? AUTH_MESSAGES.EMAIL_DELIVERY_FAILED;
    throw new EmailDeliveryError(errorMessage);
  }

  return rawToken;
}
