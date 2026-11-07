import bcrypt from 'bcrypt';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Prisma } from '../../generated/prisma/client.js';
import { Role, Status } from '../../generated/prisma/enums.js';
import { SendError, SendSuccess } from '../../utils/api-response.js';
import { prisma } from '../../utils/prisma.js';
import {
  AUTH_CLEAR_COOKIE_OPTIONS,
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_OPTIONS,
  AUTH_MESSAGES,
  AUTH_SALT_ROUNDS,
  AUTH_TOKEN_EXPIRES_IN,
  GetAuthClearCookieOptions,
  GetAuthCookieOptions,
  RESEND_COOLDOWN_MS,
} from './auth.constants.js';
import {
  BuildInitialWalletCreateData,
  CreateAndSendPasswordResetToken,
  CreateAndSendVerificationOtp,
  HashTokenOrCode,
} from './auth.helper.js';
import type {
  BrandProfileDto,
  CreatorProfileDto,
  CurrentAccountProfile,
} from './auth.types.js';
import {
  ValidateForgotPasswordBody,
  ValidateLoginBody,
  ValidateRegisterBody,
  ValidateResendVerificationBody,
  ValidateResetPasswordBody,
  ValidateVerifyEmailBody,
} from './auth.validators.js';

/**
 * Handles `POST /auth/register`: validates request payload, hashes password,
 * creates account with `isEmailVerified: false`, and automatically dispatches a 6-digit verification OTP.
 *
 * @param req - Express request with the register body.
 * @param res - Express response object.
 * @param next - Express next function to forward unhandled errors.
 */
export async function RegisterAccount(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = ValidateRegisterBody(req.body);

    if (typeof input === 'string') {
      SendError(res, input, 400);
      return;
    }

    const existingAccountQuery = {
      where: { email: input.email, status: Status.ACTIVE },
    };

    // findFirst instead of findUnique so the filter also excludes soft-deleted accounts
    const existingAccount = await prisma.account.findFirst(existingAccountQuery);

    if (existingAccount) {
      SendError(res, AUTH_MESSAGES.EMAIL_ALREADY_EXISTS, 409);
      return;
    }

    const passwordHash = await bcrypt.hash(input.password, AUTH_SALT_ROUNDS);

    // Nested create keeps account + profile + wallet in a single atomic write
    const profileData =
      input.role === Role.BRAND
        ? {
            brand: {
              create: {
                companyName: input.companyName,
                phoneNumber: input.phoneNumber,
                industry: input.industry,
              },
            },
          }
        : {
            creator: {
              create: {
                fullName: input.fullName,
              },
            },
          };

    const walletData = BuildInitialWalletCreateData(input.role);

    const createPayload = {
      data: {
        email: input.email,
        passwordHash,
        role: input.role,
        isEmailVerified: false,
        ...profileData,
        ...(walletData ? { wallet: walletData } : {}),
      },
      select: {
        id: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
    };

    const account = await prisma.account.create(createPayload);

    // Dispatch 6-digit OTP verification email immediately upon registration
    try {
      await CreateAndSendVerificationOtp(account.id, account.email);
    } catch (emailErr) {
      // Do not abort account creation if email delivery hits external issue;
      // user can use "Kirim Ulang Kode" on the verification screen
      console.error('Failed to send initial verification email:', emailErr);
    }

    SendSuccess(res, account, AUTH_MESSAGES.REGISTER_SUCCESS, 201);
  } catch (err) {
    // Unique index on email still exists for soft-deleted accounts; map P2002 to 409
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      SendError(res, AUTH_MESSAGES.EMAIL_ALREADY_EXISTS, 409);
      return;
    }

    next(err);
  }
}

/**
 * Handles `POST /auth/login`: validates credentials, verifies bcrypt hash,
 * enforces strict email verification gate, and issues a JWT token inside an httpOnly cookie.
 *
 * @param req - Express request with the login body.
 * @param res - Express response object.
 * @param next - Express next function to forward unhandled errors.
 */
export async function LoginAccount(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = ValidateLoginBody(req.body);

    if (typeof input === 'string') {
      SendError(res, input, 400);
      return;
    }

    const findAccountQuery = {
      where: { email: input.email, status: Status.ACTIVE },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        isEmailVerified: true,
      },
    };

    const account = await prisma.account.findFirst(findAccountQuery);

    if (!account) {
      SendError(res, AUTH_MESSAGES.INVALID_CREDENTIALS, 401);
      return;
    }

    const passwordMatches = await bcrypt.compare(input.password, account.passwordHash);

    if (!passwordMatches) {
      SendError(res, AUTH_MESSAGES.INVALID_CREDENTIALS, 401);
      return;
    }

    // STRICT VERIFICATION GATE: Unverified accounts are strictly blocked from logging in
    if (!account.isEmailVerified) {
      SendError(
        res,
        AUTH_MESSAGES.EMAIL_VERIFICATION_REQUIRED,
        403,
        {
          code: 'EMAIL_NOT_VERIFIED',
          email: account.email,
        },
      );
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      SendError(res, AUTH_MESSAGES.CONFIG_MISSING, 500);
      return;
    }

    const tokenPayload = { sub: account.id, role: account.role };
    const token = jwt.sign(tokenPayload, jwtSecret, {
      expiresIn: AUTH_TOKEN_EXPIRES_IN,
    });

    const cookieOptions = GetAuthCookieOptions();
    res.cookie(AUTH_COOKIE_NAME, token, cookieOptions);

    const loginResponseData = {
      id: account.id,
      email: account.email,
      role: account.role,
    };

    SendSuccess(res, loginResponseData, AUTH_MESSAGES.LOGIN_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /auth/verify-email`: validates the 6-digit OTP code, marks `isEmailVerified: true`,
 * and automatically logs the user in by issuing an active session cookie.
 *
 * @param req - Express request with `{ email, code }`.
 * @param res - Express response object.
 * @param next - Express next function to forward unhandled errors.
 */
export async function VerifyEmail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = ValidateVerifyEmailBody(req.body);

    if (typeof input === 'string') {
      SendError(res, input, 400);
      return;
    }

    const account = await prisma.account.findFirst({
      where: { email: input.email, status: Status.ACTIVE },
      select: { id: true, email: true, role: true, isEmailVerified: true },
    });

    if (!account) {
      SendError(res, AUTH_MESSAGES.ACCOUNT_NOT_FOUND, 404);
      return;
    }

    if (account.isEmailVerified) {
      SendSuccess(res, { alreadyVerified: true }, AUTH_MESSAGES.ACCOUNT_ALREADY_VERIFIED);
      return;
    }

    const codeHash = HashTokenOrCode(input.code);
    const now = new Date();

    const activeCodeRecord = await prisma.emailVerificationCode.findFirst({
      where: {
        accountId: account.id,
        codeHash,
        usedAt: null,
        expiresAt: { gt: now },
      },
    });

    if (!activeCodeRecord) {
      SendError(res, AUTH_MESSAGES.INVALID_OR_EXPIRED_CODE, 400);
      return;
    }

    // Atomic transaction: mark email verified and consume the OTP code
    await prisma.$transaction([
      prisma.account.update({
        where: { id: account.id },
        data: { isEmailVerified: true },
      }),
      prisma.emailVerificationCode.update({
        where: { id: activeCodeRecord.id },
        data: { usedAt: now },
      }),
    ]);

    // Issue session cookie upon successful verification for seamless onboarding
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret) {
      const tokenPayload = { sub: account.id, role: account.role };
      const token = jwt.sign(tokenPayload, jwtSecret, {
        expiresIn: AUTH_TOKEN_EXPIRES_IN,
      });
      const cookieOptions = GetAuthCookieOptions();
      res.cookie(AUTH_COOKIE_NAME, token, cookieOptions);
    }

    const verifiedResponseData = {
      id: account.id,
      email: account.email,
      role: account.role,
      isEmailVerified: true,
    };

    SendSuccess(res, verifiedResponseData, AUTH_MESSAGES.VERIFICATION_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /auth/resend-verification`: enforces a 60-second cooldown,
 * generates a fresh 6-digit OTP code, and dispatches the verification email.
 *
 * @param req - Express request with `{ email }`.
 * @param res - Express response object.
 * @param next - Express next function to forward unhandled errors.
 */
export async function ResendVerificationEmail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = ValidateResendVerificationBody(req.body);

    if (typeof input === 'string') {
      SendError(res, input, 400);
      return;
    }

    const account = await prisma.account.findFirst({
      where: { email: input.email, status: Status.ACTIVE },
      select: { id: true, email: true, isEmailVerified: true },
    });

    // Account enumeration defense: Return success even if email not found
    if (!account) {
      SendSuccess(res, null, AUTH_MESSAGES.CODE_RESENT_SUCCESS);
      return;
    }

    if (account.isEmailVerified) {
      SendError(res, AUTH_MESSAGES.ACCOUNT_ALREADY_VERIFIED, 400);
      return;
    }

    // Cooldown check: Find latest created verification code
    const latestCode = await prisma.emailVerificationCode.findFirst({
      where: { accountId: account.id },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    if (latestCode) {
      const elapsedMs = Date.now() - latestCode.createdAt.getTime();
      if (elapsedMs < RESEND_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsedMs) / 1000);
        SendError(
          res,
          AUTH_MESSAGES.RESEND_COOLDOWN_ACTIVE,
          429,
          { remainingSeconds },
        );
        return;
      }
    }

    await CreateAndSendVerificationOtp(account.id, account.email);

    SendSuccess(res, { email: account.email }, AUTH_MESSAGES.CODE_RESENT_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /auth/forgot-password`: generates a single-use 1-hour reset token
 * and sends the password reset email with account enumeration defense.
 *
 * @param req - Express request with `{ email }`.
 * @param res - Express response object.
 * @param next - Express next function to forward unhandled errors.
 */
export async function ForgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = ValidateForgotPasswordBody(req.body);

    if (typeof input === 'string') {
      SendError(res, input, 400);
      return;
    }

    const account = await prisma.account.findFirst({
      where: { email: input.email, status: Status.ACTIVE },
      select: { id: true, email: true },
    });

    if (account) {
      try {
        await CreateAndSendPasswordResetToken(account.id, account.email);
      } catch (emailErr) {
        console.error('Failed to dispatch password reset email:', emailErr);
      }
    }

    // Always return generic success to protect against account enumeration attacks
    SendSuccess(res, null, AUTH_MESSAGES.FORGOT_PASSWORD_GENERIC_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /auth/reset-password`: validates secret token, hashes new password with bcrypt,
 * updates the account, and invalidates the token in an atomic transaction.
 *
 * @param req - Express request with `{ token, password }`.
 * @param res - Express response object.
 * @param next - Express next function to forward unhandled errors.
 */
export async function ResetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = ValidateResetPasswordBody(req.body);

    if (typeof input === 'string') {
      SendError(res, input, 400);
      return;
    }

    const tokenHash = HashTokenOrCode(input.token);
    const now = new Date();

    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: now },
      },
      select: {
        id: true,
        accountId: true,
      },
    });

    if (!tokenRecord) {
      SendError(res, AUTH_MESSAGES.INVALID_OR_EXPIRED_RESET_TOKEN, 400);
      return;
    }

    const newPasswordHash = await bcrypt.hash(input.password, AUTH_SALT_ROUNDS);

    await prisma.$transaction([
      prisma.account.update({
        where: { id: tokenRecord.accountId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: now },
      }),
    ]);

    SendSuccess(res, null, AUTH_MESSAGES.PASSWORD_RESET_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /auth/logout`: clears the authentication JWT cookie.
 *
 * @param _req - Express request object.
 * @param res - Express response object.
 * @param next - Express next function to forward unhandled errors.
 */
export async function LogoutAccount(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const clearOptions = GetAuthClearCookieOptions();
    res.clearCookie(AUTH_COOKIE_NAME, clearOptions);
    SendSuccess(res, null, AUTH_MESSAGES.LOGOUT_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `GET /auth/me`: retrieves the authenticated user's profile details
 * based on their active session token.
 *
 * @param req - Express request with `req.account` populated by `RequireAuth`.
 * @param res - Express response object.
 * @param next - Express next function to forward unhandled errors.
 */
export async function GetCurrentAccount(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const accountPayload = req.account;

    if (!accountPayload?.sub) {
      SendError(res, AUTH_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    const accountQuery = {
      where: { id: accountPayload.sub, status: Status.ACTIVE },
      select: {
        id: true,
        email: true,
        role: true,
        isEmailVerified: true,
        brand: {
          select: {
            id: true,
            companyName: true,
            phoneNumber: true,
            industry: true,
            logoUrl: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            socialAccounts: {
              where: { status: Status.ACTIVE, isVerified: true },
              orderBy: { verifiedAt: 'desc' as const },
              take: 1,
              select: {
                avatarUrl: true,
              },
            },
          },
        },
        admin: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    };

    const account = await prisma.account.findFirst(accountQuery);

    if (!account) {
      SendError(res, AUTH_MESSAGES.ACCOUNT_NOT_FOUND, 404);
      return;
    }

    let displayName = '';
    let avatarUrl: string | null = null;
    if (account.role === Role.BRAND && account.brand?.companyName) {
      displayName = account.brand.companyName;
      avatarUrl = account.brand.logoUrl ?? null;
    } else if (account.role === Role.CREATOR && account.creator?.fullName) {
      displayName = account.creator.fullName;
      const latestSocialAvatar = account.creator.socialAccounts[0]?.avatarUrl ?? null;
      avatarUrl = account.creator.avatarUrl ?? latestSocialAvatar;
    } else if (account.role === Role.ADMIN && account.admin?.fullName) {
      displayName = account.admin.fullName;
    }

    const brandData: BrandProfileDto | null = account.brand
      ? {
          id: account.brand.id,
          companyName: account.brand.companyName,
          phoneNumber: account.brand.phoneNumber,
          industry: account.brand.industry,
          logoUrl: account.brand.logoUrl,
        }
      : null;

    const creatorData: CreatorProfileDto | null = account.creator
      ? {
          id: account.creator.id,
          fullName: account.creator.fullName,
          avatarUrl: account.creator.avatarUrl ?? account.creator.socialAccounts[0]?.avatarUrl ?? null,
        }
      : null;

    const profileData: CurrentAccountProfile = {
      id: account.id,
      email: account.email,
      role: account.role,
      name: displayName,
      avatarUrl,
      isEmailVerified: account.isEmailVerified,
      brand: brandData,
      creator: creatorData,
      admin: account.admin,
    };

    SendSuccess(res, profileData, AUTH_MESSAGES.ACCOUNT_LOADED);
  } catch (err) {
    next(err);
  }
}
