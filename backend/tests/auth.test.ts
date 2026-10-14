import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { CreateApp } from '../src/app.js';
import {
  AUTH_CLEAR_COOKIE_OPTIONS,
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_OPTIONS,
  AUTH_MESSAGES,
  AUTH_SALT_ROUNDS,
  AUTH_TOKEN_EXPIRES_IN,
} from '../src/features/authentication/auth.constants.js';
import {
  GetCurrentAccount,
  LoginAccount,
  LogoutAccount,
  RegisterAccount,
} from '../src/features/authentication/auth.handlers.js';
import {
  ValidateLoginBody,
  ValidateRegisterBody,
} from '../src/features/authentication/auth.validators.js';
import {
  BuildInitialWalletCreateData,
} from '../src/features/authentication/auth.helper.js';
import { Prisma } from '../src/generated/prisma/client.js';
import { Industry, Role, Status } from '../src/generated/prisma/enums.js';
import { RequireAuth } from '../src/middleware/auth.middleware.js';
import { prisma } from '../src/utils/prisma.js';
import {
  CreateMockNext,
  CreateMockRequest,
  CreateMockResponse,
} from './helpers/mock-express.js';
import {
  mockAdminAccount,
  mockBrandAccount,
  mockCreatorAccount,
  validBrandRegisterPayload,
  validCreatorRegisterPayload,
  validLoginPayload,
} from './helpers/test-fixtures.js';

describe('Authentication Feature Module', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-key-12345';
    process.env.NODE_ENV = 'test';
    jest.clearAllMocks();
    jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(null as never);
    jest.spyOn(prisma.wallet, 'create').mockResolvedValue({
      id: 'mock-wallet-id',
      accountId: 'mock-account-id',
      balance: new Prisma.Decimal(0),
      status: Status.ACTIVE,
    } as never);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // ===========================================================================
  // Tier 1 & 2: Validation Schemas & Input Validators
  // ===========================================================================
  describe('Validation Suite', () => {
    describe('ValidateLoginBody', () => {
      it('returns parsed credentials when payload is valid', () => {
        const result = ValidateLoginBody(validLoginPayload);

        expect(typeof result).toBe('object');
        expect(result).not.toBeNull();
        if (typeof result === 'object' && result !== null) {
          expect(result.email).toBe(validLoginPayload.email);
          expect(result.password).toBe(validLoginPayload.password);
        }
      });

      it('trims and lowercases email input', () => {
        const result = ValidateLoginBody({
          email: '  CREATOR@Example.COM  ',
          password: 'Password123!',
        });

        expect(typeof result).toBe('object');
        if (typeof result === 'object' && result !== null) {
          expect(result.email).toBe('creator@example.com');
        }
      });

      it('returns email required error when email is missing or empty', () => {
        const result = ValidateLoginBody({ password: 'Password123!' });
        expect(result).toBe(AUTH_MESSAGES.EMAIL_REQUIRED);
      });

      it('returns email invalid error for malformed email format', () => {
        const result = ValidateLoginBody({
          email: 'not-a-valid-email',
          password: 'Password123!',
        });
        expect(result).toBe(AUTH_MESSAGES.EMAIL_INVALID);
      });

      it('returns password required error when password is empty', () => {
        const result = ValidateLoginBody({
          email: 'test@example.com',
          password: '',
        });
        expect(result).toBe(AUTH_MESSAGES.PASSWORD_REQUIRED);
      });

      it('returns email required error when body is an empty object', () => {
        const result = ValidateLoginBody({});
        expect(result).toBe(AUTH_MESSAGES.EMAIL_REQUIRED);
      });
    });

    describe('ValidateRegisterBody', () => {
      it('returns parsed brand payload with normalized phone and trimmed fields', () => {
        const result = ValidateRegisterBody({
          role: Role.BRAND,
          email: '  BRAND@COMPANY.ID ',
          password: 'Password123!',
          companyName: '  PT Klipday Digital  ',
          phoneNumber: '0812-3456-7890',
          industry: Industry.TECHNOLOGY,
        });

        expect(typeof result).toBe('object');
        if (typeof result === 'object' && result !== null) {
          expect(result.role).toBe(Role.BRAND);
          expect(result.email).toBe('brand@company.id');
          if (result.role === Role.BRAND) {
            expect(result.companyName).toBe('PT Klipday Digital');
            expect(result.phoneNumber).toBe('081234567890');
            expect(result.industry).toBe(Industry.TECHNOLOGY);
          }
        }
      });

      it('returns parsed creator payload with trimmed full name', () => {
        const result = ValidateRegisterBody({
          role: Role.CREATOR,
          email: 'creator@example.com',
          password: 'Password123!',
          fullName: '  Budi Santoso  ',
        });

        expect(typeof result).toBe('object');
        if (typeof result === 'object' && result !== null) {
          expect(result.role).toBe(Role.CREATOR);
          expect(result.email).toBe('creator@example.com');
          if (result.role === Role.CREATOR) {
            expect(result.fullName).toBe('Budi Santoso');
          }
        }
      });

      it('rejects empty or non-object body with invalid request message', () => {
        expect(ValidateRegisterBody({})).toBe(AUTH_MESSAGES.INVALID_REQUEST);
        expect(ValidateRegisterBody(null)).toBe(AUTH_MESSAGES.INVALID_REQUEST);
      });

      it('enforces password minimum length of 8 characters', () => {
        const result = ValidateRegisterBody({
          ...validCreatorRegisterPayload,
          password: 'P1!',
        });
        expect(result).toBe(AUTH_MESSAGES.PASSWORD_MIN_LENGTH);
      });

      it('enforces password uppercase requirement', () => {
        const result = ValidateRegisterBody({
          ...validCreatorRegisterPayload,
          password: 'password123!',
        });
        expect(result).toBe(AUTH_MESSAGES.PASSWORD_UPPERCASE);
      });

      it('enforces password number requirement', () => {
        const result = ValidateRegisterBody({
          ...validCreatorRegisterPayload,
          password: 'Password!',
        });
        expect(result).toBe(AUTH_MESSAGES.PASSWORD_NUMBER);
      });

      it('enforces password symbol requirement', () => {
        const result = ValidateRegisterBody({
          ...validCreatorRegisterPayload,
          password: 'Password123',
        });
        expect(result).toBe(AUTH_MESSAGES.PASSWORD_SYMBOL);
      });

      it('validates brand phone format against Indonesian phone regex', () => {
        const invalidPhone = ValidateRegisterBody({
          ...validBrandRegisterPayload,
          phoneNumber: '12345',
        });
        expect(invalidPhone).toBe(AUTH_MESSAGES.PHONE_INVALID);
      });

      it('requires company name for brand accounts', () => {
        const missingCompany = ValidateRegisterBody({
          ...validBrandRegisterPayload,
          companyName: '   ',
        });
        expect(missingCompany).toBe(AUTH_MESSAGES.COMPANY_NAME_REQUIRED);
      });

      it('requires full name for creator accounts', () => {
        const missingName = ValidateRegisterBody({
          ...validCreatorRegisterPayload,
          fullName: '   ',
        });
        expect(missingName).toBe(AUTH_MESSAGES.FULL_NAME_REQUIRED);
      });
    });
  });

  // ===========================================================================
  // Tier 1 & 3: Handler Unit Tests
  // ===========================================================================
  describe('Handler Unit Tests', () => {
    describe('RegisterAccount', () => {
      it('creates a brand account and returns 201 Created', async () => {
        const req = CreateMockRequest({ body: validBrandRegisterPayload });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.account, 'findFirst').mockResolvedValue(null);
        jest
          .spyOn(bcrypt, 'hash')
          .mockResolvedValue('mock-hashed-password' as never);

        const createdAccount = {
          id: 'acc-new-brand',
          email: validBrandRegisterPayload.email,
          role: Role.BRAND,
          createdAt: new Date('2026-01-01T00:00:00Z'),
        };

        jest
          .spyOn(prisma.account, 'create')
          .mockResolvedValue(createdAccount as never);

        await RegisterAccount(req, res, next);

        expect(bcrypt.hash).toHaveBeenCalledWith(
          validBrandRegisterPayload.password,
          AUTH_SALT_ROUNDS,
        );
        expect(prisma.account.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              email: validBrandRegisterPayload.email,
              passwordHash: 'mock-hashed-password',
              role: Role.BRAND,
              brand: {
                create: {
                  companyName: validBrandRegisterPayload.companyName,
                  phoneNumber: validBrandRegisterPayload.phoneNumber,
                  industry: validBrandRegisterPayload.industry,
                },
              },
              wallet: {
                create: {
                  balance: expect.any(Prisma.Decimal),
                  status: Status.ACTIVE,
                },
              },
            }),
          }),
        );
        expect(prisma.wallet.create).not.toHaveBeenCalled();
        expect(statusMock).toHaveBeenCalledWith(201);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: createdAccount,
          message: AUTH_MESSAGES.REGISTER_SUCCESS,
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('creates a creator account and returns 201 Created', async () => {
        const req = CreateMockRequest({ body: validCreatorRegisterPayload });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.account, 'findFirst').mockResolvedValue(null);
        jest
          .spyOn(bcrypt, 'hash')
          .mockResolvedValue('mock-hashed-password' as never);

        const createdAccount = {
          id: 'acc-new-creator',
          email: validCreatorRegisterPayload.email,
          role: Role.CREATOR,
          createdAt: new Date('2026-01-01T00:00:00Z'),
        };

        jest
          .spyOn(prisma.account, 'create')
          .mockResolvedValue(createdAccount as never);

        await RegisterAccount(req, res, next);

        expect(prisma.account.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              email: validCreatorRegisterPayload.email,
              passwordHash: 'mock-hashed-password',
              role: Role.CREATOR,
              creator: {
                create: {
                  fullName: validCreatorRegisterPayload.fullName,
                },
              },
              wallet: {
                create: {
                  balance: expect.any(Prisma.Decimal),
                  status: Status.ACTIVE,
                },
              },
            }),
          }),
        );
        expect(prisma.wallet.create).not.toHaveBeenCalled();
        expect(statusMock).toHaveBeenCalledWith(201);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: createdAccount,
          message: AUTH_MESSAGES.REGISTER_SUCCESS,
        });
      });

      it('returns 400 when validation fails', async () => {
        const req = CreateMockRequest({ body: { invalid: 'data' } });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();
        const createSpy = jest.spyOn(prisma.account, 'create');

        await RegisterAccount(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: AUTH_MESSAGES.INVALID_REQUEST,
        });
        expect(createSpy).not.toHaveBeenCalled();
      });

      it('returns 409 Conflict when active account with same email already exists', async () => {
        const req = CreateMockRequest({ body: validCreatorRegisterPayload });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();
        const createSpy = jest.spyOn(prisma.account, 'create');

        jest
          .spyOn(prisma.account, 'findFirst')
          .mockResolvedValue(mockCreatorAccount as never);

        await RegisterAccount(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(409);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: AUTH_MESSAGES.EMAIL_ALREADY_EXISTS,
        });
        expect(createSpy).not.toHaveBeenCalled();
      });

      it('returns 409 Conflict when Prisma throws P2002 unique collision', async () => {
        const req = CreateMockRequest({ body: validCreatorRegisterPayload });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.account, 'findFirst').mockResolvedValue(null);
        jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);

        const prismaError = new Prisma.PrismaClientKnownRequestError(
          'Unique constraint failed',
          { code: 'P2002', clientVersion: '7.9.1' },
        );
        jest.spyOn(prisma.account, 'create').mockRejectedValue(prismaError);

        await RegisterAccount(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(409);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: AUTH_MESSAGES.EMAIL_ALREADY_EXISTS,
        });
      });

      it('forwards unexpected exceptions to next(err)', async () => {
        const req = CreateMockRequest({ body: validCreatorRegisterPayload });
        const { res } = CreateMockResponse();
        const next = CreateMockNext();

        const dbError = new Error('Database connection failed');
        jest.spyOn(prisma.account, 'findFirst').mockRejectedValue(dbError);

        await RegisterAccount(req, res, next);

        expect(next).toHaveBeenCalledWith(dbError);
      });
    });

    describe('LoginAccount', () => {
      it('validates credentials, sets httpOnly cookie, and returns 200 with summary', async () => {
        const req = CreateMockRequest({ body: validLoginPayload });
        const { res, statusMock, jsonMock, cookieMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest
          .spyOn(prisma.account, 'findFirst')
          .mockResolvedValue(mockCreatorAccount as never);
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
        jest.spyOn(jwt, 'sign').mockReturnValue('mocked-signed-jwt' as never);

        await LoginAccount(req, res, next);

        expect(bcrypt.compare).toHaveBeenCalledWith(
          validLoginPayload.password,
          mockCreatorAccount.passwordHash,
        );
        expect(jwt.sign).toHaveBeenCalledWith(
          { sub: mockCreatorAccount.id, role: mockCreatorAccount.role },
          'test-secret-key-12345',
          { expiresIn: AUTH_TOKEN_EXPIRES_IN },
        );
        expect(cookieMock).toHaveBeenCalledWith(
          AUTH_COOKIE_NAME,
          'mocked-signed-jwt',
          AUTH_COOKIE_OPTIONS,
        );
        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: {
            id: mockCreatorAccount.id,
            email: mockCreatorAccount.email,
            role: mockCreatorAccount.role,
          },
          message: AUTH_MESSAGES.LOGIN_SUCCESS,
        });
      });

      it('returns 400 when login payload is malformed', async () => {
        const req = CreateMockRequest({ body: { email: 'bad' } });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        await LoginAccount(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: AUTH_MESSAGES.EMAIL_INVALID,
        });
      });

      it('returns 401 when account is not found in database', async () => {
        const req = CreateMockRequest({ body: validLoginPayload });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.account, 'findFirst').mockResolvedValue(null);

        await LoginAccount(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: AUTH_MESSAGES.INVALID_CREDENTIALS,
        });
      });

      it('returns 401 when password does not match hash', async () => {
        const req = CreateMockRequest({ body: validLoginPayload });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest
          .spyOn(prisma.account, 'findFirst')
          .mockResolvedValue(mockCreatorAccount as never);
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

        await LoginAccount(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: AUTH_MESSAGES.INVALID_CREDENTIALS,
        });
      });

      it('returns 500 when JWT_SECRET configuration is missing', async () => {
        delete process.env.JWT_SECRET;

        const req = CreateMockRequest({ body: validLoginPayload });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest
          .spyOn(prisma.account, 'findFirst')
          .mockResolvedValue(mockCreatorAccount as never);
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

        await LoginAccount(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: AUTH_MESSAGES.CONFIG_MISSING,
        });
      });

      it('forwards unexpected errors to next(err)', async () => {
        const req = CreateMockRequest({ body: validLoginPayload });
        const { res } = CreateMockResponse();
        const next = CreateMockNext();

        const dbError = new Error('DB unreachable');
        jest.spyOn(prisma.account, 'findFirst').mockRejectedValue(dbError);

        await LoginAccount(req, res, next);

        expect(next).toHaveBeenCalledWith(dbError);
      });
    });

    describe('LogoutAccount', () => {
      it('clears the authentication cookie and returns 200', async () => {
        const req = CreateMockRequest();
        const { res, statusMock, jsonMock, clearCookieMock } =
          CreateMockResponse();
        const next = CreateMockNext();

        await LogoutAccount(req, res, next);

        expect(clearCookieMock).toHaveBeenCalledWith(
          AUTH_COOKIE_NAME,
          AUTH_CLEAR_COOKIE_OPTIONS,
        );
        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: null,
          message: AUTH_MESSAGES.LOGOUT_SUCCESS,
        });
      });
    });

    describe('GetCurrentAccount', () => {
      it('returns profile data with companyName as displayName for Brand account', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrandAccount.id, role: Role.BRAND },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest
          .spyOn(prisma.account, 'findFirst')
          .mockResolvedValue(mockBrandAccount as never);

        await GetCurrentAccount(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: {
            id: mockBrandAccount.id,
            email: mockBrandAccount.email,
            role: Role.BRAND,
            name: mockBrandAccount.brand.companyName,
            avatarUrl: null,
            isEmailVerified: mockBrandAccount.isEmailVerified,
            brand: {
              id: mockBrandAccount.brand.id,
              companyName: mockBrandAccount.brand.companyName,
              phoneNumber: mockBrandAccount.brand.phoneNumber,
              industry: mockBrandAccount.brand.industry,
              logoUrl: null,
            },
            creator: null,
            admin: null,
          },
          message: AUTH_MESSAGES.ACCOUNT_LOADED,
        });
      });

      it('returns profile data with fullName as displayName for Creator account', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreatorAccount.id, role: Role.CREATOR },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest
          .spyOn(prisma.account, 'findFirst')
          .mockResolvedValue(mockCreatorAccount as never);

        await GetCurrentAccount(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: {
            id: mockCreatorAccount.id,
            email: mockCreatorAccount.email,
            role: Role.CREATOR,
            name: mockCreatorAccount.creator.fullName,
            avatarUrl: null,
            isEmailVerified: mockCreatorAccount.isEmailVerified,
            brand: null,
            creator: {
              id: mockCreatorAccount.creator.id,
              fullName: mockCreatorAccount.creator.fullName,
              avatarUrl: null,
            },
            admin: null,
          },
          message: AUTH_MESSAGES.ACCOUNT_LOADED,
        });
      });

      it('returns profile data with admin fullName as displayName for Admin account', async () => {
        const req = CreateMockRequest({
          account: { sub: mockAdminAccount.id, role: Role.ADMIN },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest
          .spyOn(prisma.account, 'findFirst')
          .mockResolvedValue(mockAdminAccount as never);

        await GetCurrentAccount(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: {
            id: mockAdminAccount.id,
            email: mockAdminAccount.email,
            role: Role.ADMIN,
            name: mockAdminAccount.admin.fullName,
            avatarUrl: null,
            isEmailVerified: mockAdminAccount.isEmailVerified,
            brand: null,
            creator: null,
            admin: mockAdminAccount.admin,
          },
          message: AUTH_MESSAGES.ACCOUNT_LOADED,
        });
      });

      it('returns 401 when req.account.sub is missing', async () => {
        const req = CreateMockRequest({ account: undefined });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        await GetCurrentAccount(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: AUTH_MESSAGES.AUTH_REQUIRED,
        });
      });

      it('returns 404 when account is deleted or not found in database', async () => {
        const req = CreateMockRequest({
          account: { sub: 'non-existent', role: Role.CREATOR },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.account, 'findFirst').mockResolvedValue(null);

        await GetCurrentAccount(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: AUTH_MESSAGES.ACCOUNT_NOT_FOUND,
        });
      });
    });
  });

  // ===========================================================================
  // Tier 3 & 4: Middleware & Edge Cases
  // ===========================================================================
  describe('Middleware & Edge Cases', () => {
    describe('RequireAuth Middleware', () => {
      it('authenticates user from token cookie and attaches account to req', () => {
        const payload = { sub: 'user-123', role: Role.CREATOR };
        jest.spyOn(jwt, 'verify').mockReturnValue(payload as never);

        const req = CreateMockRequest({
          cookies: { [AUTH_COOKIE_NAME]: 'valid-cookie-token' },
        });
        const { res } = CreateMockResponse();
        const next = CreateMockNext();

        RequireAuth(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith(
          'valid-cookie-token',
          'test-secret-key-12345',
        );
        expect(req.account).toEqual(payload);
        expect(next).toHaveBeenCalled();
      });

      it('authenticates user from Authorization: Bearer header when cookie is missing', () => {
        const payload = { sub: 'bearer-user', role: Role.BRAND };
        jest.spyOn(jwt, 'verify').mockReturnValue(payload as never);

        const req = CreateMockRequest({
          cookies: {},
          headers: { authorization: 'Bearer my-bearer-token' } as never,
        });
        const { res } = CreateMockResponse();
        const next = CreateMockNext();

        RequireAuth(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith(
          'my-bearer-token',
          'test-secret-key-12345',
        );
        expect(req.account).toEqual(payload);
        expect(next).toHaveBeenCalled();
      });

      it('returns 401 when neither cookie nor Bearer token is provided', () => {
        const req = CreateMockRequest({ cookies: {}, headers: {} });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        RequireAuth(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: AUTH_MESSAGES.AUTH_REQUIRED,
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('returns 500 when JWT_SECRET environment variable is missing', () => {
        delete process.env.JWT_SECRET;

        const req = CreateMockRequest({
          cookies: { [AUTH_COOKIE_NAME]: 'token-123' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        RequireAuth(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: AUTH_MESSAGES.CONFIG_MISSING,
        });
      });

      it('returns 401 when token verification fails or is expired', () => {
        jest.spyOn(jwt, 'verify').mockImplementation(() => {
          throw new jwt.JsonWebTokenError('invalid token');
        });

        const req = CreateMockRequest({
          cookies: { [AUTH_COOKIE_NAME]: 'forged-token' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        RequireAuth(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: AUTH_MESSAGES.SESSION_EXPIRED,
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('Rate Limiter Concurrency Edge Case', () => {
      it('triggers HTTP 429 after exceeding request limit threshold on auth endpoints', async () => {
        const app = CreateApp();
        const responses: request.Response[] = [];

        // AuthRateLimiter threshold is 20 requests per 15 minutes.
        // Send 22 rapid requests to /auth/login.
        for (let i = 0; i < 22; i++) {
          const res = await request(app)
            .post('/auth/login')
            .send({ email: 'bad@format', password: '' });
          responses.push(res);
        }

        // The first 20 requests get through to the handler (returning 400 validation error)
        expect(responses[0]?.status).toBe(400);
        expect(responses[19]?.status).toBe(400);

        // The 21st and 22nd requests must be intercepted by AuthRateLimiter with 429
        const rateLimitedResponse = responses[20];
        expect(rateLimitedResponse?.status).toBe(429);
        expect(rateLimitedResponse?.body).toEqual({
          status: 'error',
          data: null,
          message: 'Too many requests. Please try again later.',
        });
      });
    });

    describe('Authentication Helpers & Wallet Provisioning', () => {
      it('BuildInitialWalletCreateData builds active 0-balance wallet for Role.BRAND', () => {
        const result = BuildInitialWalletCreateData(Role.BRAND);
        expect(result).toBeDefined();
        expect(result).toEqual({
          create: {
            balance: new Prisma.Decimal(0),
            status: Status.ACTIVE,
          },
        });
      });

      it('BuildInitialWalletCreateData builds active 0-balance wallet for Role.CREATOR', () => {
        const result = BuildInitialWalletCreateData(Role.CREATOR);
        expect(result).toBeDefined();
        expect(result).toEqual({
          create: {
            balance: new Prisma.Decimal(0),
            status: Status.ACTIVE,
          },
        });
      });

      it('BuildInitialWalletCreateData returns null for non-financial Role.ADMIN', () => {
        const result = BuildInitialWalletCreateData(Role.ADMIN);
        expect(result).toBeNull();
      });

      it('BuildInitialWalletCreateData returns null for undefined or invalid roles', () => {
        const undefinedResult = BuildInitialWalletCreateData(undefined as unknown as Role);
        const invalidResult = BuildInitialWalletCreateData('UNKNOWN' as Role);
        expect(undefinedResult).toBeNull();
        expect(invalidResult).toBeNull();
      });

      it('RegisterAccount builds an atomic payload and creates Account, Profile, and Wallet in a single DB query', async () => {
        const req = CreateMockRequest({ body: validBrandRegisterPayload });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.account, 'findFirst').mockResolvedValue(null);
        jest.spyOn(bcrypt, 'hash').mockResolvedValue('mock-hashed-password' as never);

        const createdAccount = {
          id: 'acc-atomic-brand',
          email: validBrandRegisterPayload.email,
          role: Role.BRAND,
          createdAt: new Date('2026-01-01T00:00:00Z'),
        };
        const createAccountSpy = jest
          .spyOn(prisma.account, 'create')
          .mockResolvedValue(createdAccount as never);
        const createWalletSpy = jest.spyOn(prisma.wallet, 'create');

        await RegisterAccount(req, res, next);

        expect(createAccountSpy).toHaveBeenCalledWith({
          data: {
            email: validBrandRegisterPayload.email,
            passwordHash: 'mock-hashed-password',
            role: Role.BRAND,
            brand: {
              create: {
                companyName: validBrandRegisterPayload.companyName,
                phoneNumber: validBrandRegisterPayload.phoneNumber,
                industry: validBrandRegisterPayload.industry,
              },
            },
            wallet: {
              create: {
                balance: expect.any(Prisma.Decimal),
                status: Status.ACTIVE,
              },
            },
          },
          select: { id: true, email: true, role: true, createdAt: true },
        });

        // Verifies zero separate wallet queries are triggered (pure relational payload builder pattern)
        expect(createWalletSpy).not.toHaveBeenCalled();
        expect(statusMock).toHaveBeenCalledWith(201);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: createdAccount,
          message: AUTH_MESSAGES.REGISTER_SUCCESS,
        });
        expect(next).not.toHaveBeenCalled();
      });
    });
  });
});

