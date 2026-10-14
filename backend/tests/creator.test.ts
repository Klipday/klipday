import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  Category,
  PayoutAccountType,
  PayoutStatus,
  Platform,
  Role,
  Status,
  VerificationStatus,
} from '../src/generated/prisma/enums.js';
import {
  CREATOR_MESSAGES,
} from '../src/features/creator/creator.constants.js';
import {
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
});
