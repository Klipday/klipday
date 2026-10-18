import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Prisma } from '../src/generated/prisma/client.js';
import {
  Category,
  Industry,
  PayoutAccountType,
  PayoutStatus,
  Platform,
  Role,
  Status,
  SubmissionStatus,
  VerificationStatus,
} from '../src/generated/prisma/enums.js';
import {
  CREATOR_MESSAGES,
} from '../src/features/creator/creator.constants.js';
import {
  GetCreatorDashboardSummary,
  GetCreatorProfile,
  UpdateCreatorProfile,
} from '../src/features/creator/creator.handlers.js';
import {
  CreateCreatorPayoutAccount,
  DeleteCreatorPayoutAccount,
  GetCreatorPayoutAccounts,
  SetPrimaryCreatorPayoutAccount,
  UploadCreatorPayoutProof,
} from '../src/features/wallet/creator-wallet.handlers.js';
import { CREATOR_WALLET_MESSAGES, WALLET_MESSAGES } from '../src/features/wallet/wallet.constants.js';
import { prisma } from '../src/utils/prisma.js';
import {
  CreateMockNext,
  CreateMockRequest,
  CreateMockResponse,
} from './helpers/mock-express.js';

describe('Creator Profile and Payout Accounts Feature Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAccountId = 'acc-creator-test-123';
  const mockCreator = {
    id: 'creator-test-123',
    accountId: mockAccountId,
    fullName: 'Rina Clipper',
    avatarUrl: 'https://storage.supabase.co/avatar.jpg',
    dateOfBirth: new Date('2000-05-15'),
    phoneNumber: '6281234567890',
    location: 'Kota Bandung',
    bio: 'Clipper handal video TikTok gaming dan lifestyle',
    contentCategories: [Category.GAMING, Category.LIFESTYLE],
    status: Status.ACTIVE,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    account: {
      email: 'rina@klipday.com',
    },
    socialAccounts: [
      {
        id: 'soc-123',
        creatorId: 'creator-test-123',
        platform: Platform.TIKTOK,
        username: 'rinaclips',
        avatarUrl: 'https://storage.supabase.co/tiktok-avatar.jpg',
        followersCount: 15400,
        isVerified: true,
        verifiedAt: new Date('2026-01-02'),
        status: Status.ACTIVE,
      },
    ],
  };

  const mockWallet = {
    id: 'wallet-creator-123',
    accountId: mockAccountId,
    balance: 500000,
    status: Status.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('GetCreatorProfile Handler', () => {
    it('should return 401 if unauthenticated', async () => {
      const req = CreateMockRequest();
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await GetCreatorProfile(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: CREATOR_MESSAGES.AUTH_REQUIRED,
        }),
      );
    });

    it('should return 403 if authenticated user is not CREATOR', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, email: 'brand@test.com', role: Role.BRAND },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await GetCreatorProfile(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: CREATOR_MESSAGES.UNAUTHORIZED_ROLE,
        }),
      );
    });

    it('should return 404 if creator profile does not exist', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, email: 'rina@klipday.com', role: Role.CREATOR },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(null);

      await GetCreatorProfile(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: CREATOR_MESSAGES.CREATOR_NOT_FOUND,
        }),
      );
    });

    it('should return 200 with formatted creator profile and tiktokAccount', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, email: 'rina@klipday.com', role: Role.CREATOR },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as any);

      await GetCreatorProfile(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            id: mockCreator.id,
            fullName: mockCreator.fullName,
            email: 'rina@klipday.com',
            dateOfBirth: '2000-05-15',
            tiktokAccount: expect.objectContaining({
              username: 'rinaclips',
              followersCount: 15400,
              isVerified: true,
            }),
          }),
        }),
      );
    });
  });

  describe('UpdateCreatorProfile Handler', () => {
    it('should reject underage birthdate with 400', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, email: 'rina@klipday.com', role: Role.CREATOR },
        body: {
          // A date within the last 10 years (clearly under 18)
          dateOfBirth: '2018-01-01',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as any);

      await UpdateCreatorProfile(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: CREATOR_MESSAGES.MIN_AGE_REQUIRED,
        }),
      );
    });

    it('should accept birthdate turning exactly 18 years old today with 200', async () => {
      const now = new Date();
      const currentYear = now.getUTCFullYear();
      const currentMonth = String(now.getUTCMonth() + 1).padStart(2, '0');
      const currentDay = String(now.getUTCDate()).padStart(2, '0');
      const eighteenToday = `${currentYear - 18}-${currentMonth}-${currentDay}`;

      const req = CreateMockRequest({
        account: { sub: mockAccountId, email: 'rina@klipday.com', role: Role.CREATOR },
        body: {
          dateOfBirth: eighteenToday,
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as any);
      jest.spyOn(prisma.creator, 'update').mockResolvedValue({
        ...mockCreator,
        dateOfBirth: new Date(eighteenToday),
      } as any);

      await UpdateCreatorProfile(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
        }),
      );
    });

    it('should reject future birthdate with 400 and FUTURE_DATE_NOT_ALLOWED', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, email: 'rina@klipday.com', role: Role.CREATOR },
        body: {
          dateOfBirth: '2099-01-01',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as any);

      await UpdateCreatorProfile(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: CREATOR_MESSAGES.FUTURE_DATE_NOT_ALLOWED,
        }),
      );
    });

    it('should reject invalid date string format with 400 and INVALID_DATE_OF_BIRTH', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, email: 'rina@klipday.com', role: Role.CREATOR },
        body: {
          dateOfBirth: 'not-a-valid-date',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as any);

      await UpdateCreatorProfile(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: CREATOR_MESSAGES.INVALID_DATE_OF_BIRTH,
        }),
      );
    });

    it('should reject more than 3 content categories with 400', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, email: 'rina@klipday.com', role: Role.CREATOR },
        body: {
          contentCategories: [
            Category.GAMING,
            Category.LIFESTYLE,
            Category.BEAUTY_SKINCARE,
            Category.TECHNOLOGY_GADGETS,
          ],
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as any);

      await UpdateCreatorProfile(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: CREATOR_MESSAGES.CATEGORY_COUNT_INVALID,
        }),
      );
    });

    it('should reject duplicate content categories with 400', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, email: 'rina@klipday.com', role: Role.CREATOR },
        body: {
          contentCategories: [Category.GAMING, Category.GAMING],
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as any);

      await UpdateCreatorProfile(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: CREATOR_MESSAGES.DUPLICATE_CATEGORIES,
        }),
      );
    });
    it('should reject phone number not starting with 62 with 400', async () => {
      const invalidPhones = ['081234567890', '08998732627', '+628998732627', '8998732627'];

      for (const invalidPhone of invalidPhones) {
        const req = CreateMockRequest({
          account: { sub: mockAccountId, email: 'rina@klipday.com', role: Role.CREATOR },
          body: {
            phoneNumber: invalidPhone,
          },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as any);

        await UpdateCreatorProfile(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'error',
            message: CREATOR_MESSAGES.INVALID_PHONE_NUMBER,
          }),
        );
      }
    });

    it('should accept valid phone number starting with 62 with 200', async () => {
      const validPhones = ['628932627112', '628998732627'];

      for (const validPhone of validPhones) {
        const req = CreateMockRequest({
          account: { sub: mockAccountId, email: 'rina@klipday.com', role: Role.CREATOR },
          body: {
            phoneNumber: validPhone,
          },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as any);
        jest.spyOn(prisma.creator, 'update').mockResolvedValue({
          ...mockCreator,
          phoneNumber: validPhone,
        } as any);

        await UpdateCreatorProfile(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'success',
            data: expect.objectContaining({
              phoneNumber: validPhone,
            }),
          }),
        );
      }
    });

    it('should accept null or empty string phone number (optional) with 200', async () => {
      const clearValues = [null, ''];

      for (const clearVal of clearValues) {
        const req = CreateMockRequest({
          account: { sub: mockAccountId, email: 'rina@klipday.com', role: Role.CREATOR },
          body: {
            phoneNumber: clearVal,
          },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as any);
        jest.spyOn(prisma.creator, 'update').mockResolvedValue({
          ...mockCreator,
          phoneNumber: null,
        } as any);

        await UpdateCreatorProfile(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'success',
            data: expect.objectContaining({
              phoneNumber: null,
            }),
          }),
        );
      }
    });

    it('should successfully update creator profile and return 200', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, email: 'rina@klipday.com', role: Role.CREATOR },
        body: {
          fullName: 'Rina Putri Permata',
          dateOfBirth: '1998-12-25',
          location: 'Kota Bandung',
          bio: 'Kreator video clipping TikTok berprestasi',
          contentCategories: [Category.GAMING, Category.ENTERTAINMENT],
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as any);
      jest.spyOn(prisma.creator, 'update').mockResolvedValue({
        ...mockCreator,
        fullName: 'Rina Putri Permata',
        dateOfBirth: new Date('1998-12-25'),
        location: 'Kota Bandung',
        bio: 'Kreator video clipping TikTok berprestasi',
        contentCategories: [Category.GAMING, Category.ENTERTAINMENT],
      } as any);

      await UpdateCreatorProfile(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            fullName: 'Rina Putri Permata',
            dateOfBirth: '1998-12-25',
          }),
        }),
      );
    });
  });

  describe('Creator Payout Accounts Handlers', () => {
    const mockPayoutAccount = {
      id: 'payout-acc-1',
      walletId: mockWallet.id,
      brandId: null,
      accountType: PayoutAccountType.BANK_TRANSFER,
      provider: 'BCA',
      accountNumber: '1234567890',
      accountHolderName: 'Rina Putri',
      proofUrl: 'https://storage.supabase.co/proof.jpg',
      isPrimary: true,
      verificationStatus: VerificationStatus.VERIFIED,
      rejectionReason: null,
      status: Status.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('GetCreatorPayoutAccounts should return 200 with list of accounts', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, email: 'rina@klipday.com', role: Role.CREATOR },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as any);
      jest.spyOn(prisma.brandPayoutAccount, 'findMany').mockResolvedValue([mockPayoutAccount as any]);

      await GetCreatorPayoutAccounts(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.arrayContaining([
            expect.objectContaining({
              id: 'payout-acc-1',
              provider: 'BCA',
              accountNumber: '1234567890',
            }),
          ]),
        }),
      );
    });

    it('CreateCreatorPayoutAccount should return 409 if duplicate account number exists', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, email: 'rina@klipday.com', role: Role.CREATOR },
        body: {
          accountType: PayoutAccountType.BANK_TRANSFER,
          provider: 'BCA',
          accountNumber: '1234567890',
          accountHolderName: 'Rina Putri',
          proofUrl: 'https://storage.supabase.co/proof.jpg',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as any);
      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as any);
      jest.spyOn(prisma.brandPayoutAccount, 'count').mockResolvedValue(1);
      jest.spyOn(prisma.brandPayoutAccount, 'findFirst').mockResolvedValue(mockPayoutAccount as any);

      await CreateCreatorPayoutAccount(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: CREATOR_WALLET_MESSAGES.PAYOUT_ACCOUNT_DUPLICATE,
        }),
      );
    });

    it('CreateCreatorPayoutAccount should return 201 when registering a valid bank account', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, email: 'rina@klipday.com', role: Role.CREATOR },
        body: {
          accountType: PayoutAccountType.BANK_TRANSFER,
          provider: 'BCA',
          accountNumber: '1234567890',
          accountHolderName: 'Rina Putri',
          proofUrl: 'https://storage.supabase.co/proof.jpg',
          isPrimary: false,
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as any);
      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as any);
      jest.spyOn(prisma.brandPayoutAccount, 'count').mockResolvedValue(0);
      jest.spyOn(prisma.brandPayoutAccount, 'findFirst')
        .mockResolvedValueOnce(null) // duplicate check
        .mockResolvedValueOnce(null); // primary account check

      const createdAccountMock = {
        id: 'new-creator-payout-acc',
        walletId: mockWallet.id,
        brandId: null,
        accountType: PayoutAccountType.BANK_TRANSFER,
        provider: 'BCA',
        accountNumber: '1234567890',
        accountHolderName: 'Rina Putri',
        proofUrl: 'https://storage.supabase.co/proof.jpg',
        isPrimary: true,
        verificationStatus: VerificationStatus.PENDING,
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const txMock = {
        brandPayoutAccount: {
          updateMany: jest.fn().mockResolvedValue({ count: 0 } as any),
          create: jest.fn().mockResolvedValue(createdAccountMock as any),
        },
      };

      jest.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
        return callback(txMock as any);
      });

      await CreateCreatorPayoutAccount(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            id: 'new-creator-payout-acc',
            provider: 'BCA',
            isPrimary: true,
            verificationStatus: VerificationStatus.PENDING,
          }),
        }),
      );
    });

    it('CreateCreatorPayoutAccount should return 201 when registering a valid e-wallet account (DANA)', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, email: 'rina@klipday.com', role: Role.CREATOR },
        body: {
          accountType: PayoutAccountType.E_WALLET,
          provider: 'DANA',
          accountNumber: '081234567890',
          accountHolderName: 'Rina Putri',
          proofUrl: 'https://storage.supabase.co/dana-proof.jpg',
          isPrimary: false,
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as any);
      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as any);
      jest.spyOn(prisma.brandPayoutAccount, 'count').mockResolvedValue(1);
      jest.spyOn(prisma.brandPayoutAccount, 'findFirst')
        .mockResolvedValueOnce(null) // duplicate check
        .mockResolvedValueOnce({ id: 'existing-primary' } as any); // has primary account

      const createdDanaMock = {
        id: 'new-dana-acc',
        walletId: mockWallet.id,
        brandId: null,
        accountType: PayoutAccountType.E_WALLET,
        provider: 'DANA',
        accountNumber: '081234567890',
        accountHolderName: 'Rina Putri',
        proofUrl: 'https://storage.supabase.co/dana-proof.jpg',
        isPrimary: false,
        verificationStatus: VerificationStatus.PENDING,
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const txMock = {
        brandPayoutAccount: {
          create: jest.fn().mockResolvedValue(createdDanaMock as any),
        },
      };

      jest.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
        return callback(txMock as any);
      });

      await CreateCreatorPayoutAccount(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            id: 'new-dana-acc',
            provider: 'DANA',
            isPrimary: false,
            verificationStatus: VerificationStatus.PENDING,
          }),
        }),
      );
    });

    it('SetPrimaryCreatorPayoutAccount should return 400 if target account is not VERIFIED', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, email: 'rina@klipday.com', role: Role.CREATOR },
        params: { id: 'payout-acc-2' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as any);
      jest.spyOn(prisma.brandPayoutAccount, 'findFirst').mockResolvedValue({
        ...mockPayoutAccount,
        id: 'payout-acc-2',
        verificationStatus: VerificationStatus.PENDING,
      } as any);

      await SetPrimaryCreatorPayoutAccount(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: CREATOR_WALLET_MESSAGES.PAYOUT_ACCOUNT_MUST_BE_VERIFIED,
        }),
      );
    });

    it('DeleteCreatorPayoutAccount should return 400 if account is bound to a pending withdrawal', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, email: 'rina@klipday.com', role: Role.CREATOR },
        params: { id: 'payout-acc-1' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as any);
      jest.spyOn(prisma.brandPayoutAccount, 'findFirst').mockResolvedValue(mockPayoutAccount as any);
      jest.spyOn(prisma.payoutRequest, 'findFirst').mockResolvedValue({
        id: 'wd-1',
        payoutStatus: PayoutStatus.PENDING,
      } as any);

      await DeleteCreatorPayoutAccount(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: CREATOR_WALLET_MESSAGES.PAYOUT_ACCOUNT_HAS_PENDING_WITHDRAWAL,
        }),
      );
    });

    it('DeleteCreatorPayoutAccount should promote remaining VERIFIED account to primary when primary is deleted', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, email: 'rina@klipday.com', role: Role.CREATOR },
        params: { id: 'payout-acc-1' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      const remainingVerifiedAccount = {
        ...mockPayoutAccount,
        id: 'payout-acc-verified',
        isPrimary: false,
        verificationStatus: VerificationStatus.VERIFIED,
      };

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as any);
      jest.spyOn(prisma.brandPayoutAccount, 'findFirst').mockResolvedValue(mockPayoutAccount as any);
      jest.spyOn(prisma.payoutRequest, 'findFirst').mockResolvedValue(null);

      const updateSpy = jest.fn().mockResolvedValue({} as any);
      const findFirstSpy = jest.fn().mockResolvedValue(remainingVerifiedAccount as any);

      jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        return callback({
          brandPayoutAccount: {
            update: updateSpy,
            findFirst: findFirstSpy,
          },
        });
      });

      await DeleteCreatorPayoutAccount(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: CREATOR_WALLET_MESSAGES.PAYOUT_ACCOUNT_DELETED_SUCCESS,
        }),
      );
      // Ensure remaining verified account was promoted to primary
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'payout-acc-verified' },
          data: { isPrimary: true },
        }),
      );
    });

    it('UploadCreatorPayoutProof should reject unsupported mime type with 400', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, email: 'rina@klipday.com', role: Role.CREATOR },
        headers: {
          'content-type': 'application/pdf',
          'content-length': '1024',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as any);

      await UploadCreatorPayoutProof(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: WALLET_MESSAGES.UNSUPPORTED_FILE_TYPE,
        }),
      );
    });
  });

  describe('GetCreatorDashboardSummary Handler', () => {
    it('returns 401 if unauthenticated', async () => {
      const req = CreateMockRequest();
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await GetCreatorDashboardSummary(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: CREATOR_MESSAGES.AUTH_REQUIRED,
        }),
      );
    });

    it('returns 403 if authenticated user is BRAND', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, email: 'brand@test.com', role: Role.BRAND },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await GetCreatorDashboardSummary(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: CREATOR_MESSAGES.UNAUTHORIZED_ROLE,
        }),
      );
    });

    it('returns 404 if creator profile does not exist', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, email: 'rina@klipday.com', role: Role.CREATOR },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(null);

      await GetCreatorDashboardSummary(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: CREATOR_MESSAGES.CREATOR_NOT_FOUND,
        }),
      );
    });

    it('returns 200 with complete metrics, recentSubmissions (REVISION_REQUESTED prioritized), joinedCampaigns, and topClips (Day 100)', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, email: 'rina@klipday.com', role: Role.CREATOR },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue({
        id: 'wallet-creator-123',
        balance: new Prisma.Decimal(850000),
      } as never);

      jest.spyOn(prisma.submission, 'aggregate').mockResolvedValue({
        _sum: {
          verifiedViews: 142500,
          earnings: new Prisma.Decimal(1425000),
        },
      } as never);

      jest.spyOn(prisma.submission, 'groupBy').mockResolvedValueOnce([
        { submissionStatus: SubmissionStatus.JOINED, _count: { _all: 1 } },
        { submissionStatus: SubmissionStatus.PENDING_REVIEW, _count: { _all: 1 } },
        { submissionStatus: SubmissionStatus.REVISION_REQUESTED, _count: { _all: 1 } },
        { submissionStatus: SubmissionStatus.APPROVED, _count: { _all: 2 } },
      ] as never);

      jest.spyOn(prisma.walletTransaction, 'aggregate')
        .mockResolvedValueOnce({
          _sum: { amount: new Prisma.Decimal(1400000) },
        } as never) // walletEarningAggregate
        .mockResolvedValueOnce({
          _sum: { amount: new Prisma.Decimal(575000) },
        } as never); // walletWithdrawalAggregate

      jest.spyOn(prisma.payoutRequest, 'aggregate').mockResolvedValueOnce({
        _sum: { amount: new Prisma.Decimal(150000) },
      } as never);

      jest.spyOn(prisma.submission, 'findMany')
        .mockResolvedValueOnce([
          {
            id: 'sub-approved-1',
            campaignId: 'camp-1',
            submissionStatus: SubmissionStatus.APPROVED,
            verifiedViews: 84200,
            earnings: new Prisma.Decimal(0), // should compute estimatedEarnings from views * cpm / 1000
            submittedAt: new Date('2026-01-12T10:00:00Z'),
            createdAt: new Date('2026-01-12T10:00:00Z'),
            updatedAt: new Date('2026-01-12T12:00:00Z'),
            campaign: {
              id: 'camp-1',
              title: 'Kopi Kenangan Mantan Promo',
              campaignCategory: Category.FOOD_BEVERAGE,
              cpm: new Prisma.Decimal(10000),
              brand: {
                companyName: 'Kopi Kenangan',
                industry: Industry.FOOD_AND_BEVERAGE,
              },
            },
          },
          {
            id: 'sub-revision-1',
            campaignId: 'camp-2',
            submissionStatus: SubmissionStatus.REVISION_REQUESTED,
            verifiedViews: 12000,
            earnings: new Prisma.Decimal(150000),
            submittedAt: new Date('2026-01-10T10:00:00Z'),
            createdAt: new Date('2026-01-10T10:00:00Z'),
            updatedAt: new Date('2026-01-10T12:00:00Z'),
            campaign: {
              id: 'camp-2',
              title: 'Skincare Glow Serum',
              campaignCategory: Category.BEAUTY_SKINCARE,
              cpm: new Prisma.Decimal(12000),
              brand: {
                companyName: 'Glow Beauty',
                industry: Industry.FASHION_AND_BEAUTY,
              },
            },
          },
        ] as never) // recentSubmissions
        .mockResolvedValueOnce([
          {
            id: 'sub-joined-1',
            campaignId: 'camp-3',
            createdAt: new Date('2026-01-14T08:00:00Z'),
            updatedAt: new Date('2026-01-14T08:00:00Z'),
            campaign: {
              id: 'camp-3',
              title: 'Gadget Flagship Launch',
              campaignCategory: Category.TECHNOLOGY_GADGETS,
              cpm: new Prisma.Decimal(15000),
              budget: new Prisma.Decimal(10000000),
              startDate: new Date('2026-01-01T00:00:00Z'),
              endDate: new Date('2026-02-01T00:00:00Z'),
              brand: {
                companyName: 'TechNova ID',
                industry: Industry.TECHNOLOGY,
              },
              submissions: [
                {
                  submissionStatus: SubmissionStatus.APPROVED,
                  earnings: new Prisma.Decimal(2500000),
                },
                {
                  submissionStatus: SubmissionStatus.JOINED,
                  earnings: new Prisma.Decimal(0),
                },
              ],
            },
          },
        ] as never) // joinedCampaigns
        .mockResolvedValueOnce([
          {
            id: 'sub-approved-1',
            campaignId: 'camp-1',
            thumbnailUrl: 'https://storage.supabase.co/thumb1.jpg',
            liveVideoUrl: 'https://www.tiktok.com/@rinaclips/video/123',
            verifiedViews: 84200,
            earnings: new Prisma.Decimal(842000),
            campaign: {
              id: 'camp-1',
              title: 'Kopi Kenangan Mantan Promo',
              cpm: new Prisma.Decimal(10000),
              brand: {
                companyName: 'Kopi Kenangan',
              },
            },
            socialAccount: {
              username: 'rinaclips',
            },
          },
        ] as never); // topClips

      await GetCreatorDashboardSummary(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: CREATOR_MESSAGES.DASHBOARD_SUMMARY_FETCH_SUCCESS,
          data: expect.objectContaining({
            creator: expect.objectContaining({
              id: 'creator-test-123',
              fullName: 'Rina Clipper',
              tiktokAccount: expect.objectContaining({
                username: 'rinaclips',
                isVerified: true,
              }),
            }),
            metrics: {
              totalVerifiedViews: 142500,
              totalEarnings: 1425000,
              walletActiveBalance: 850000,
              totalWithdrawn: 575000,
              pendingWithdrawalAmount: 150000,
              submissionStatusCounts: {
                joined: 1,
                pendingReview: 1,
                revisionRequested: 1,
                approved: 2,
                posted: 0,
                verified: 0,
                rejected: 0,
                submittedTotal: 4,
                total: 5,
              },
            },
            hasAnySubmissions: true,
            recentSubmissions: [
              // REVISION_REQUESTED should be sorted first even if older updatedAt
              expect.objectContaining({
                id: 'sub-revision-1',
                submissionStatus: SubmissionStatus.REVISION_REQUESTED,
                estimatedEarnings: 150000,
              }),
              expect.objectContaining({
                id: 'sub-approved-1',
                submissionStatus: SubmissionStatus.APPROVED,
                verifiedViews: 84200,
                estimatedEarnings: 842000, // (84200 / 1000) * 10000
              }),
            ],
            joinedCampaigns: [
              expect.objectContaining({
                submissionId: 'sub-joined-1',
                id: 'camp-3',
                title: 'Gadget Flagship Launch',
                brandName: 'TechNova ID',
                cpm: 15000,
                budget: 10000000,
                spent: 2500000,
                remainingBudget: 7500000,
                remainingPercent: 75,
              }),
            ],
            topClips: [
              expect.objectContaining({
                id: 'sub-approved-1',
                verifiedViews: 84200,
                earnings: 842000,
              }),
            ],
          }),
        }),
      );
    });

    it('returns 200 with zero state when creator has no submissions and no wallet (Day 0)', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, email: 'rina@klipday.com', role: Role.CREATOR },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue({
        ...mockCreator,
        socialAccounts: [],
      } as never);
      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.submission, 'aggregate').mockResolvedValue({
        _sum: { verifiedViews: null, earnings: null },
      } as never);
      jest.spyOn(prisma.submission, 'groupBy').mockResolvedValueOnce([] as never);
      jest.spyOn(prisma.walletTransaction, 'aggregate')
        .mockResolvedValueOnce({ _sum: { amount: null } } as never)
        .mockResolvedValueOnce({ _sum: { amount: null } } as never);
      jest.spyOn(prisma.payoutRequest, 'aggregate').mockResolvedValueOnce({
        _sum: { amount: null },
      } as never);
      jest.spyOn(prisma.submission, 'findMany')
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await GetCreatorDashboardSummary(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            hasAnySubmissions: false,
            creator: expect.objectContaining({
              tiktokAccount: null,
            }),
            metrics: {
              totalVerifiedViews: 0,
              totalEarnings: 0,
              walletActiveBalance: 0,
              totalWithdrawn: 0,
              pendingWithdrawalAmount: 0,
              submissionStatusCounts: {
                joined: 0,
                pendingReview: 0,
                revisionRequested: 0,
                approved: 0,
                posted: 0,
                verified: 0,
                rejected: 0,
                submittedTotal: 0,
                total: 0,
              },
            },
            recentSubmissions: [],
            joinedCampaigns: [],
            topClips: [],
          }),
        }),
      );
    });

    it('returns 200 with hasAnySubmissions=true when creator has joined an active campaign (JOINED) and has not submitted any video yet, and enforces REJECTED=0 and maxViews cap', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, email: 'rina@klipday.com', role: Role.CREATOR },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue({
        id: 'wallet-creator-123',
        balance: new Prisma.Decimal(0),
      } as never);
      jest.spyOn(prisma.submission, 'aggregate').mockResolvedValue({
        _sum: { verifiedViews: null, earnings: null },
      } as never);
      const groupBySpy = jest.spyOn(prisma.submission, 'groupBy').mockResolvedValueOnce([
        { submissionStatus: SubmissionStatus.JOINED, _count: { _all: 1 } },
        { submissionStatus: SubmissionStatus.REJECTED, _count: { _all: 1 } },
        { submissionStatus: SubmissionStatus.PENDING_REVIEW, _count: { _all: 1 } },
      ] as never);
      jest.spyOn(prisma.walletTransaction, 'aggregate')
        .mockResolvedValueOnce({ _sum: { amount: null } } as never)
        .mockResolvedValueOnce({ _sum: { amount: null } } as never);
      jest.spyOn(prisma.payoutRequest, 'aggregate').mockResolvedValueOnce({
        _sum: { amount: null },
      } as never);
      jest.spyOn(prisma.submission, 'findMany')
        .mockResolvedValueOnce([
          {
            id: 'sub-rejected-1',
            campaignId: 'camp-rej',
            submissionStatus: SubmissionStatus.REJECTED,
            verifiedViews: 25000,
            earnings: new Prisma.Decimal(0),
            submittedAt: new Date('2026-01-11T10:00:00Z'),
            createdAt: new Date('2026-01-11T10:00:00Z'),
            updatedAt: new Date('2026-01-13T10:00:00Z'),
            campaign: {
              id: 'camp-rej',
              title: 'Rejected Promo',
              campaignCategory: Category.LIFESTYLE,
              cpm: new Prisma.Decimal(10000),
              maxViews: 50000,
              brand: {
                companyName: 'Brand X',
                industry: Industry.OTHER,
              },
            },
          },
          {
            id: 'sub-capped-1',
            campaignId: 'camp-cap',
            submissionStatus: SubmissionStatus.PENDING_REVIEW,
            verifiedViews: 100000,
            earnings: new Prisma.Decimal(0),
            submittedAt: new Date('2026-01-12T10:00:00Z'),
            createdAt: new Date('2026-01-12T10:00:00Z'),
            updatedAt: new Date('2026-01-12T10:00:00Z'),
            campaign: {
              id: 'camp-cap',
              title: 'Capped Views Promo',
              campaignCategory: Category.GAMING,
              cpm: new Prisma.Decimal(10000),
              maxViews: 50000, // caps effectiveViews at 50000 -> 500,000 IDR
              brand: {
                companyName: 'Game Studio',
                industry: null,
              },
            },
          },
        ] as never)
        .mockResolvedValueOnce([
          {
            id: 'sub-joined-only',
            campaignId: 'camp-join',
            createdAt: new Date('2026-01-15T10:00:00Z'),
            updatedAt: new Date('2026-01-15T10:00:00Z'),
            campaign: {
              id: 'camp-join',
              title: 'Active Joined Campaign',
              campaignCategory: Category.FOOD_BEVERAGE,
              cpm: new Prisma.Decimal(12000),
              budget: new Prisma.Decimal(5000000),
              startDate: new Date('2026-01-01T00:00:00Z'),
              endDate: new Date('2026-02-01T00:00:00Z'),
              brand: {
                companyName: 'Foodie Co',
                industry: Industry.FOOD_AND_BEVERAGE,
              },
              submissions: [],
            },
          },
        ] as never)
        .mockResolvedValueOnce([]);

      await GetCreatorDashboardSummary(req, res, next);

      expect(groupBySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                submissionStatus: SubmissionStatus.JOINED,
                campaign: {
                  status: Status.ACTIVE,
                  campaignStatus: 'ACTIVE',
                },
              }),
            ]),
          }),
        }),
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            hasAnySubmissions: true,
            recentSubmissions: [
              expect.objectContaining({
                id: 'sub-rejected-1',
                submissionStatus: SubmissionStatus.REJECTED,
                verifiedViews: 25000,
                estimatedEarnings: 0, // REJECTED must be 0
              }),
              expect.objectContaining({
                id: 'sub-capped-1',
                submissionStatus: SubmissionStatus.PENDING_REVIEW,
                verifiedViews: 100000,
                estimatedEarnings: 500000, // capped at maxViews=50000 * 10000 / 1000
              }),
            ],
            joinedCampaigns: [
              expect.objectContaining({
                submissionId: 'sub-joined-only',
                id: 'camp-join',
                remainingBudget: 5000000,
                remainingPercent: 100,
              }),
            ],
          }),
        }),
      );
    });

    it('forwards unexpected error to next()', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, email: 'rina@klipday.com', role: Role.CREATOR },
      });
      const { res } = CreateMockResponse();
      const next = CreateMockNext();

      const dbError = new Error('DB Failure');
      jest.spyOn(prisma.creator, 'findFirst').mockRejectedValue(dbError);

      await GetCreatorDashboardSummary(req, res, next);

      expect(next).toHaveBeenCalledWith(dbError);
    });
  });
});

