import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  AUTH_COOKIE_NAME,
  AUTH_ERROR_CODES,
  AUTH_MESSAGES,
} from '../src/features/authentication/auth.constants.js';
import {
  ForgotPassword,
  LoginAccount,
  RegisterAccount,
  ResendVerificationEmail,
  ResetPassword,
  VerifyEmail,
} from '../src/features/authentication/auth.handlers.js';
import {
  BuildPasswordResetEmailHtml,
  BuildPasswordResetEmailText,
  BuildVerificationOtpEmailHtml,
  BuildVerificationOtpEmailText,
  CreateAndSendPasswordResetToken,
  CreateAndSendVerificationOtp,
  GenerateNumericOtp,
  GenerateSecureHexToken,
  HashTokenOrCode,
} from '../src/features/authentication/auth.helper.js';
import { Role, Status } from '../src/generated/prisma/enums.js';
import { prisma } from '../src/utils/prisma.js';
import {
  CreateMockNext,
  CreateMockRequest,
  CreateMockResponse,
} from './helpers/mock-express.js';
import {
  mockCreatorAccount,
  mockUnverifiedAccount,
  validCreatorRegisterPayload,
} from './helpers/test-fixtures.js';

describe('Auth Recovery & Verification Module', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-key-recovery-12345';
    process.env.NODE_ENV = 'test';
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // ===========================================================================
  // 1. Strict Login Gate
  // ===========================================================================
  describe('Strict Login Verification Gate', () => {
    it('blocks login with 403 Forbidden when account email is unverified', async () => {
      const req = CreateMockRequest({
        body: {
          email: mockUnverifiedAccount.email,
          password: 'Password123!',
        },
      });
      const { res, statusMock, jsonMock, cookieMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest
        .spyOn(prisma.account, 'findFirst')
        .mockResolvedValue(mockUnverifiedAccount as never);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await LoginAccount(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(cookieMock).not.toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: {
          code: 'EMAIL_NOT_VERIFIED',
          email: mockUnverifiedAccount.email,
        },
        message: AUTH_MESSAGES.EMAIL_VERIFICATION_REQUIRED,
      });
    });

    it('allows login with 200 and issues session cookie when account is verified', async () => {
      const req = CreateMockRequest({
        body: {
          email: mockCreatorAccount.email,
          password: 'Password123!',
        },
      });
      const { res, statusMock, jsonMock, cookieMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest
        .spyOn(prisma.account, 'findFirst')
        .mockResolvedValue(mockCreatorAccount as never);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(jwt, 'sign').mockReturnValue('valid-jwt-token' as never);

      await LoginAccount(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(cookieMock).toHaveBeenCalledWith(
        AUTH_COOKIE_NAME,
        'valid-jwt-token',
        expect.any(Object),
      );
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: AUTH_MESSAGES.LOGIN_SUCCESS,
        }),
      );
    });
  });

  // ===========================================================================
  // 2. Registration with Automated OTP Dispatch
  // ===========================================================================
  describe('Registration & Automated OTP Creation', () => {
    it('creates account with isEmailVerified: false and dispatches 6-digit OTP', async () => {
      const req = CreateMockRequest({ body: validCreatorRegisterPayload });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.account, 'findFirst').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);
      jest.spyOn(prisma.account, 'create').mockResolvedValue({
        id: 'acc-new-1',
        email: validCreatorRegisterPayload.email,
        role: Role.CREATOR,
        isEmailVerified: false,
        createdAt: new Date(),
      } as never);
      jest
        .spyOn(prisma.emailVerificationCode, 'updateMany')
        .mockResolvedValue({ count: 0 } as never);
      const codeCreateSpy = jest
        .spyOn(prisma.emailVerificationCode, 'create')
        .mockResolvedValue({ id: 'code-1' } as never);

      await RegisterAccount(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            isEmailVerified: false,
            email: validCreatorRegisterPayload.email,
          }),
        }),
      );
      expect(codeCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            codeHash: expect.any(String),
            expiresAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  // ===========================================================================
  // 3. Email Verification Flow
  // ===========================================================================
  describe('VerifyEmail Endpoint', () => {
    it('verifies valid 6-digit OTP, updates database atomically, and issues JWT cookie', async () => {
      const req = CreateMockRequest({
        body: {
          email: 'creator@klipday.com',
          code: '123456',
        },
      });
      const { res, statusMock, jsonMock, cookieMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.account, 'findFirst').mockResolvedValue({
        id: 'acc-1',
        email: 'creator@klipday.com',
        role: Role.CREATOR,
        isEmailVerified: false,
      } as never);

      const updateManyMock = jest.fn<() => Promise<{ count: number }>>().mockResolvedValue({ count: 1 });
      const accountUpdateMock = jest.fn<() => Promise<Record<string, unknown>>>().mockResolvedValue({});

      jest.spyOn(prisma, '$transaction').mockImplementation((async (
        callback: (tx: {
          emailVerificationCode: { updateMany: typeof updateManyMock };
          account: { update: typeof accountUpdateMock };
        }) => Promise<boolean>,
      ) => {
        return callback({
          emailVerificationCode: { updateMany: updateManyMock },
          account: { update: accountUpdateMock },
        });
      }) as never);
      jest.spyOn(jwt, 'sign').mockReturnValue('verified-session-jwt' as never);

      await VerifyEmail(req, res, next);

      expect(updateManyMock).toHaveBeenCalledWith({
        where: {
          accountId: 'acc-1',
          codeHash: HashTokenOrCode('123456'),
          usedAt: null,
          expiresAt: { gt: expect.any(Date) },
        },
        data: { usedAt: expect.any(Date) },
      });
      expect(accountUpdateMock).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: { isEmailVerified: true },
      });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(cookieMock).toHaveBeenCalledWith(
        AUTH_COOKIE_NAME,
        'verified-session-jwt',
        expect.any(Object),
      );
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: AUTH_MESSAGES.VERIFICATION_SUCCESS,
          data: expect.objectContaining({
            isEmailVerified: true,
          }),
        }),
      );
    });

    it('rejects invalid, expired, or concurrently replayed OTP code with 400 Bad Request', async () => {
      const req = CreateMockRequest({
        body: {
          email: 'creator@klipday.com',
          code: '999999',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.account, 'findFirst').mockResolvedValue({
        id: 'acc-1',
        email: 'creator@klipday.com',
        role: Role.CREATOR,
        isEmailVerified: false,
      } as never);

      const updateManyMock = jest.fn<() => Promise<{ count: number }>>().mockResolvedValue({ count: 0 });
      const accountUpdateMock = jest.fn<() => Promise<Record<string, unknown>>>().mockResolvedValue({});

      jest.spyOn(prisma, '$transaction').mockImplementation((async (
        callback: (tx: {
          emailVerificationCode: { updateMany: typeof updateManyMock };
          account: { update: typeof accountUpdateMock };
        }) => Promise<boolean>,
      ) => {
        return callback({
          emailVerificationCode: { updateMany: updateManyMock },
          account: { update: accountUpdateMock },
        });
      }) as never);

      await VerifyEmail(req, res, next);

      expect(accountUpdateMock).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: AUTH_MESSAGES.INVALID_OR_EXPIRED_CODE,
      });
    });

    it('returns 500 before modifying database when JWT_SECRET is missing', async () => {
      delete process.env.JWT_SECRET;

      const req = CreateMockRequest({
        body: {
          email: 'creator@klipday.com',
          code: '123456',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.account, 'findFirst').mockResolvedValue({
        id: 'acc-1',
        email: 'creator@klipday.com',
        role: Role.CREATOR,
        isEmailVerified: false,
      } as never);
      const txSpy = jest.spyOn(prisma, '$transaction');

      await VerifyEmail(req, res, next);

      expect(txSpy).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: AUTH_MESSAGES.CONFIG_MISSING,
      });
    });
  });

  // ===========================================================================
  // 4. Resend Verification & Cooldown Mechanism
  // ===========================================================================
  describe('ResendVerificationEmail', () => {
    it('blocks resend if 60-second cooldown is still active (429 Too Many Requests)', async () => {
      const req = CreateMockRequest({
        body: { email: 'creator@klipday.com' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.account, 'findFirst').mockResolvedValue({
        id: 'acc-1',
        email: 'creator@klipday.com',
        isEmailVerified: false,
      } as never);

      // Last code created 20 seconds ago
      const recentDate = new Date(Date.now() - 20000);
      jest.spyOn(prisma.emailVerificationCode, 'findFirst').mockResolvedValue({
        createdAt: recentDate,
      } as never);

      await ResendVerificationEmail(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(429);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: AUTH_MESSAGES.RESEND_COOLDOWN_ACTIVE,
          data: expect.objectContaining({
            code: AUTH_ERROR_CODES.RESEND_COOLDOWN_ACTIVE,
            remainingSeconds: expect.any(Number),
          }),
        }),
      );
    });

    it('sends new 6-digit OTP code when cooldown has elapsed', async () => {
      const req = CreateMockRequest({
        body: { email: 'creator@klipday.com' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.account, 'findFirst').mockResolvedValue({
        id: 'acc-1',
        email: 'creator@klipday.com',
        isEmailVerified: false,
      } as never);

      // Last code created 70 seconds ago (> 60s)
      const olderDate = new Date(Date.now() - 70000);
      jest.spyOn(prisma.emailVerificationCode, 'findFirst').mockResolvedValue({
        createdAt: olderDate,
      } as never);

      jest
        .spyOn(prisma.emailVerificationCode, 'updateMany')
        .mockResolvedValue({ count: 1 } as never);
      const codeCreateSpy = jest
        .spyOn(prisma.emailVerificationCode, 'create')
        .mockResolvedValue({ id: 'code-2' } as never);

      await ResendVerificationEmail(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: AUTH_MESSAGES.CODE_RESENT_SUCCESS,
        }),
      );
      expect(codeCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            accountId: 'acc-1',
            codeHash: expect.any(String),
          }),
        }),
      );
    });

    it('cleans up OTP record and returns 503 when email delivery fails in production', async () => {
      const prevEnv = process.env.NODE_ENV;
      const prevResend = process.env.RESEND_API_KEY;
      const prevSmtp = process.env.SMTP_HOST;
      const prevProvider = process.env.EMAIL_PROVIDER;

      process.env.NODE_ENV = 'production';
      delete process.env.RESEND_API_KEY;
      delete process.env.SMTP_HOST;
      delete process.env.EMAIL_PROVIDER;

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      try {
        const req = CreateMockRequest({
          body: { email: 'creator@klipday.com' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.account, 'findFirst').mockResolvedValue({
          id: 'acc-1',
          email: 'creator@klipday.com',
          isEmailVerified: false,
        } as never);

        jest.spyOn(prisma.emailVerificationCode, 'findFirst').mockResolvedValue(null);
        jest
          .spyOn(prisma.emailVerificationCode, 'updateMany')
          .mockResolvedValue({ count: 0 } as never);
        jest
          .spyOn(prisma.emailVerificationCode, 'create')
          .mockResolvedValue({ id: 'code-failed' } as never);
        const deleteSpy = jest
          .spyOn(prisma.emailVerificationCode, 'delete')
          .mockResolvedValue({ id: 'code-failed' } as never);

        await ResendVerificationEmail(req, res, next);

        expect(deleteSpy).toHaveBeenCalledWith({
          where: { id: 'code-failed' },
        });
        expect(statusMock).toHaveBeenCalledWith(503);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: { code: AUTH_ERROR_CODES.EMAIL_DELIVERY_FAILED },
          message: AUTH_MESSAGES.EMAIL_DELIVERY_FAILED,
        });
      } finally {
        consoleErrorSpy.mockRestore();
        process.env.NODE_ENV = prevEnv;
        if (prevResend !== undefined) process.env.RESEND_API_KEY = prevResend;
        if (prevSmtp !== undefined) process.env.SMTP_HOST = prevSmtp;
        if (prevProvider !== undefined) process.env.EMAIL_PROVIDER = prevProvider;
      }
    });
  });

  // ===========================================================================
  // 5. Password Reset Workflow
  // ===========================================================================
  describe('ForgotPassword & ResetPassword', () => {
    it('dispatches password reset link with single-use 1-hour token', async () => {
      const req = CreateMockRequest({
        body: { email: 'creator@klipday.com' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.account, 'findFirst').mockResolvedValue({
        id: 'acc-1',
        email: 'creator@klipday.com',
      } as never);
      jest.spyOn(prisma.passwordResetToken, 'findFirst').mockResolvedValue(null);
      jest
        .spyOn(prisma.passwordResetToken, 'updateMany')
        .mockResolvedValue({ count: 0 } as never);
      const tokenCreateSpy = jest
        .spyOn(prisma.passwordResetToken, 'create')
        .mockResolvedValue({ id: 'tok-1' } as never);

      await ForgotPassword(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'success',
        data: null,
        message: AUTH_MESSAGES.FORGOT_PASSWORD_GENERIC_SUCCESS,
      });
      expect(tokenCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            accountId: 'acc-1',
            tokenHash: expect.any(String),
          }),
        }),
      );
    });

    it('suppresses duplicate reset email within 60-second cooldown while returning generic 200', async () => {
      const req = CreateMockRequest({
        body: { email: 'creator@klipday.com' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.account, 'findFirst').mockResolvedValue({
        id: 'acc-1',
        email: 'creator@klipday.com',
      } as never);
      jest.spyOn(prisma.passwordResetToken, 'findFirst').mockResolvedValue({
        createdAt: new Date(Date.now() - 20_000),
      } as never);
      const tokenCreateSpy = jest.spyOn(prisma.passwordResetToken, 'create');

      await ForgotPassword(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'success',
        data: null,
        message: AUTH_MESSAGES.FORGOT_PASSWORD_GENERIC_SUCCESS,
      });
      expect(tokenCreateSpy).not.toHaveBeenCalled();
    });

    it('returns generic success even if email does not exist (enumeration defense)', async () => {
      const req = CreateMockRequest({
        body: { email: 'nonexistent@example.com' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.account, 'findFirst').mockResolvedValue(null);
      const tokenCreateSpy = jest.spyOn(prisma.passwordResetToken, 'create');

      await ForgotPassword(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'success',
        data: null,
        message: AUTH_MESSAGES.FORGOT_PASSWORD_GENERIC_SUCCESS,
      });
      expect(tokenCreateSpy).not.toHaveBeenCalled();
    });

    it('updates password and marks token used atomically when valid token provided', async () => {
      const rawToken = 'secret-reset-token-12345';
      const req = CreateMockRequest({
        body: {
          token: rawToken,
          password: 'NewStrongPassword123!',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      const findFirstSpy = jest
        .spyOn(prisma.passwordResetToken, 'findFirst')
        .mockResolvedValue({
          id: 'tok-1',
          accountId: 'acc-1',
        } as never);

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('new-hashed-password' as never);

      const updateManyMock = jest.fn<() => Promise<{ count: number }>>().mockResolvedValue({ count: 1 });
      const accountUpdateMock = jest.fn<() => Promise<Record<string, unknown>>>().mockResolvedValue({});

      jest.spyOn(prisma, '$transaction').mockImplementation((async (
        callback: (tx: {
          passwordResetToken: { updateMany: typeof updateManyMock };
          account: { update: typeof accountUpdateMock };
        }) => Promise<boolean>,
      ) => {
        return callback({
          passwordResetToken: { updateMany: updateManyMock },
          account: { update: accountUpdateMock },
        });
      }) as never);

      await ResetPassword(req, res, next);

      expect(findFirstSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tokenHash: HashTokenOrCode(rawToken),
            usedAt: null,
            account: { status: Status.ACTIVE },
          }),
        }),
      );
      expect(updateManyMock).toHaveBeenCalledWith({
        where: {
          id: 'tok-1',
          usedAt: null,
          expiresAt: { gt: expect.any(Date) },
        },
        data: { usedAt: expect.any(Date) },
      });
      expect(accountUpdateMock).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: { passwordHash: 'new-hashed-password' },
      });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'success',
        data: null,
        message: AUTH_MESSAGES.PASSWORD_RESET_SUCCESS,
      });
    });

    it('rejects concurrent or replayed reset token when updateMany returns count 0', async () => {
      const rawToken = 'secret-reset-token-race';
      const req = CreateMockRequest({
        body: {
          token: rawToken,
          password: 'NewStrongPassword123!',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.passwordResetToken, 'findFirst').mockResolvedValue({
        id: 'tok-race',
        accountId: 'acc-1',
      } as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('new-hashed-password' as never);

      const updateManyMock = jest.fn<() => Promise<{ count: number }>>().mockResolvedValue({ count: 0 });
      const accountUpdateMock = jest.fn<() => Promise<Record<string, unknown>>>().mockResolvedValue({});

      jest.spyOn(prisma, '$transaction').mockImplementation((async (
        callback: (tx: {
          passwordResetToken: { updateMany: typeof updateManyMock };
          account: { update: typeof accountUpdateMock };
        }) => Promise<boolean>,
      ) => {
        return callback({
          passwordResetToken: { updateMany: updateManyMock },
          account: { update: accountUpdateMock },
        });
      }) as never);

      await ResetPassword(req, res, next);

      expect(accountUpdateMock).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: AUTH_MESSAGES.INVALID_OR_EXPIRED_RESET_TOKEN,
      });
    });

    it('rejects expired or used token with 400 Bad Request', async () => {
      const req = CreateMockRequest({
        body: {
          token: 'expired-token',
          password: 'NewStrongPassword123!',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.passwordResetToken, 'findFirst').mockResolvedValue(null);

      await ResetPassword(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: AUTH_MESSAGES.INVALID_OR_EXPIRED_RESET_TOKEN,
      });
    });
  });

  // ===========================================================================
  // 6. Security Helpers & Template Formatting
  // ===========================================================================
  describe('Cryptographic Helpers & Email Templates', () => {
    it('generates zero-padded 6-digit numeric OTP', () => {
      const otp = GenerateNumericOtp();
      expect(otp).toHaveLength(6);
      expect(otp).toMatch(/^[0-9]{6}$/);
    });

    it('produces deterministic SHA-256 hash', () => {
      const hash1 = HashTokenOrCode('123456');
      const hash2 = HashTokenOrCode('123456');
      const hash3 = HashTokenOrCode('654321');

      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });

    it('renders clean HTML email templates containing Klipday branding and zero AI slop', () => {
      const htmlOtp = BuildVerificationOtpEmailHtml({
        otpCode: '849201',
        verificationUrl: 'https://klipday.com/verify-email?code=849201',
      });
      expect(htmlOtp).toContain('Klipday');
      expect(htmlOtp).toContain('849201');
      expect(htmlOtp).toContain('Verifikasi Alamat Email Anda');
      // Verify no generic AI em-dashes
      expect(htmlOtp).not.toContain('—');

      const textOtp = BuildVerificationOtpEmailText({ otpCode: '849201' });
      expect(textOtp).toContain('849201');
      expect(textOtp).not.toContain('—');

      const htmlReset = BuildPasswordResetEmailHtml({
        resetUrl: 'https://klipday.com/reset-password?token=abc',
      });
      expect(htmlReset).toContain('Atur Ulang Kata Sandi');
      expect(htmlReset).toContain('https://klipday.com/reset-password?token=abc');
      expect(htmlReset).not.toContain('—');
    });
  });
});
