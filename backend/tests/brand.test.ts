import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Prisma } from '../src/generated/prisma/client.js';
import {
  CampaignStatus,
  Industry,
  PayoutAccountType,
  PayoutStatus,
  Role,
  Status,
  SubmissionStatus,
  VerificationStatus,
} from '../src/generated/prisma/enums.js';
import {
  BRAND_DASHBOARD_MESSAGES,
  BRAND_LIMITS,
  BRAND_MESSAGES,
  PROVIDER_ACCOUNT_RULES,
} from '../src/features/brand/brand.constants.js';
import {
  CreateBrandPayoutAccount,
  DeleteBrandPayoutAccount,
  GetBrandDashboardSummary,
  GetBrandPayoutAccounts,
  GetBrandProfile,
  SetPrimaryBrandPayoutAccount,
  UpdateBrandProfile,
  UploadBrandLogo,
  UploadBrandPayoutProof,
} from '../src/features/brand/brand.handlers.js';
import { CreateWithdrawalRequest } from '../src/features/wallet/wallet.handlers.js';
import { WALLET_MESSAGES } from '../src/features/wallet/wallet.constants.js';
import { prisma } from '../src/utils/prisma.js';
import {
  CreateMockNext,
  CreateMockRequest,
  CreateMockResponse,
} from './helpers/mock-express.js';

describe('Brand Profile and KYC Payout Feature Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAccountId = 'acc-brand-test-888';
  const mockBrand = {
    id: 'brand-test-888',
    accountId: mockAccountId,
    companyName: 'PT Brand Keren Nusantara',
    phoneNumber: '6281299887766',
    industry: Industry.TECHNOLOGY,
    logoUrl: 'https://storage.supabase.co/logo.jpg',
    location: 'Jakarta Selatan',
    website: 'https://brandkeren.com',
    description: 'Brand teknologi terdepan',
    instagramHandle: 'brandkeren',
    tiktokHandle: 'brandkeren',
    xHandle: 'brandkeren',
    threadsHandle: 'brandkeren',
    youtubeChannel: 'brandkeren',
    status: Status.ACTIVE,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    account: {
      email: 'brand@keren.com',
    },
  };

  const mockWallet = {
    id: 'wallet-test-888',
    accountId: mockAccountId,
    balance: new Prisma.Decimal(1000000),
    status: Status.ACTIVE,
  };

  // ===========================================================================
  // 1. GetBrandProfile
  // ===========================================================================
  describe('GetBrandProfile Handler', () => {
    it('returns 401 when account session is missing', async () => {
      const req = CreateMockRequest({ account: undefined });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await GetBrandProfile(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: BRAND_MESSAGES.AUTH_REQUIRED }),
      );
    });

    it('returns 403 when user is not a BRAND', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.CREATOR },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await GetBrandProfile(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: BRAND_MESSAGES.UNAUTHORIZED_ROLE }),
      );
    });

    it('returns 404 if brand is not found', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.brand, 'findFirst').mockResolvedValue(null);

      await GetBrandProfile(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: BRAND_MESSAGES.BRAND_NOT_FOUND }),
      );
    });

    it('returns 200 with full profile data on success', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.brand, 'findFirst').mockResolvedValue(mockBrand as never);

      await GetBrandProfile(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            companyName: 'PT Brand Keren Nusantara',
            email: 'brand@keren.com',
            industry: Industry.TECHNOLOGY,
            location: 'Jakarta Selatan',
          }),
        }),
      );
    });
  });

  // ===========================================================================
  // 2. UpdateBrandProfile
  // ===========================================================================
  describe('UpdateBrandProfile Handler', () => {
    it('returns 400 when input validation fails (companyName too short)', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        body: { companyName: 'A' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await UpdateBrandProfile(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'error' }),
      );
    });

    it('updates profile and trims @ prefix from social handles', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        body: {
          companyName: 'Brand Maju Bersama',
          location: 'Bandung',
          instagramHandle: '@brandmaju',
          tiktokHandle: '@brandmaju_id',
          website: 'https://brandmaju.com',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.brand, 'findFirst').mockResolvedValue(mockBrand as never);
      const updateSpy = jest.spyOn(prisma.brand, 'update').mockResolvedValue({
        ...mockBrand,
        companyName: 'Brand Maju Bersama',
        location: 'Bandung',
        instagramHandle: 'brandmaju',
        tiktokHandle: 'brandmaju_id',
        website: 'https://brandmaju.com',
      } as never);

      await UpdateBrandProfile(req, res, next);

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companyName: 'Brand Maju Bersama',
            location: 'Bandung',
            instagramHandle: 'brandmaju',
            tiktokHandle: 'brandmaju_id',
          }),
        }),
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: BRAND_MESSAGES.PROFILE_UPDATE_SUCCESS,
        }),
      );
    });

    it('preserves omitted fields in partial update without overwriting them with null', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        body: {
          description: 'Deskripsi baru yang diperbarui',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.brand, 'findFirst').mockResolvedValue(mockBrand as never);
      const updateSpy = jest.spyOn(prisma.brand, 'update').mockResolvedValue({
        ...mockBrand,
        description: 'Deskripsi baru yang diperbarui',
      } as never);

      await UpdateBrandProfile(req, res, next);

      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: mockBrand.id },
        data: { description: 'Deskripsi baru yang diperbarui' },
        include: {
          account: {
            select: { email: true },
          },
        },
      });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: BRAND_MESSAGES.PROFILE_UPDATE_SUCCESS,
        }),
      );
    });
  });

  // ===========================================================================
  // 3. Payout Accounts
  // ===========================================================================
  describe('Brand Payout Accounts Handlers', () => {
    it('GetBrandPayoutAccounts returns registered accounts sorted by primary first', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.brandPayoutAccount, 'findMany').mockResolvedValue([
        {
          id: 'payout-1',
          walletId: mockWallet.id,
          brandId: mockBrand.id,
          accountType: PayoutAccountType.BANK_TRANSFER,
          provider: 'BCA',
          accountNumber: '1234567890',
          accountHolderName: 'PT Brand Keren',
          proofUrl: 'https://storage.supabase.co/proof1.jpg',
          isPrimary: true,
          verificationStatus: VerificationStatus.VERIFIED,
          rejectionReason: null,
          verifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as never);

      await GetBrandPayoutAccounts(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ provider: 'BCA', isPrimary: true }),
          ]),
        }),
      );
    });

    it('CreateBrandPayoutAccount rejects invalid account number according to provider regex', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        body: {
          accountType: 'BANK_TRANSFER',
          provider: 'BCA',
          accountNumber: '12345', // BCA requires exactly 10 digits
          accountHolderName: 'PT Brand Keren',
          proofUrl: 'https://storage.supabase.co/proof.jpg',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await CreateBrandPayoutAccount(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: PROVIDER_ACCOUNT_RULES.BCA.description,
        }),
      );
    });

    it('CreateBrandPayoutAccount rejects when limit of 3 accounts is exceeded', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        body: {
          accountType: 'BANK_TRANSFER',
          provider: 'MANDIRI',
          accountNumber: '1234567890123',
          accountHolderName: 'PT Brand Keren',
          proofUrl: 'https://storage.supabase.co/proof.jpg',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.brand, 'findFirst').mockResolvedValue(mockBrand as never);
      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.brandPayoutAccount, 'count').mockResolvedValue(3);

      await CreateBrandPayoutAccount(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: BRAND_MESSAGES.PAYOUT_ACCOUNT_LIMIT_EXCEEDED }),
      );
    });

    it('CreateBrandPayoutAccount rejects duplicate account number', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        body: {
          accountType: 'BANK_TRANSFER',
          provider: 'BCA',
          accountNumber: '1234567890',
          accountHolderName: 'PT Brand Keren',
          proofUrl: 'https://storage.supabase.co/proof.jpg',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.brand, 'findFirst').mockResolvedValue(mockBrand as never);
      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.brandPayoutAccount, 'count').mockResolvedValue(1);
      jest.spyOn(prisma.brandPayoutAccount, 'findFirst').mockResolvedValue({
        id: 'existing-acc',
      } as never);

      await CreateBrandPayoutAccount(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: BRAND_MESSAGES.PAYOUT_ACCOUNT_DUPLICATE }),
      );
    });

    it('CreateBrandPayoutAccount successfully creates bank account and makes it primary when first account', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        body: {
          accountType: 'BANK_TRANSFER',
          provider: 'BCA',
          accountNumber: '1234567890',
          accountHolderName: 'PT Brand Keren',
          proofUrl: 'https://storage.supabase.co/proof.jpg',
          isPrimary: false,
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.brand, 'findFirst').mockResolvedValue(mockBrand as never);
      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.brandPayoutAccount, 'count').mockResolvedValue(0);
      jest.spyOn(prisma.brandPayoutAccount, 'findFirst')
        .mockResolvedValueOnce(null) // duplicate check
        .mockResolvedValueOnce(null); // primary account check

      const createdAccountMock = {
        id: 'new-payout-acc',
        walletId: mockWallet.id,
        brandId: mockBrand.id,
        accountType: 'BANK_TRANSFER',
        provider: 'BCA',
        accountNumber: '1234567890',
        accountHolderName: 'PT Brand Keren',
        proofUrl: 'https://storage.supabase.co/proof.jpg',
        isPrimary: true,
        verificationStatus: VerificationStatus.PENDING,
        rejectionReason: null,
        verifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const txMock = {
        brandPayoutAccount: {
          updateMany: jest.fn().mockResolvedValue({ count: 0 } as never),
          create: jest.fn().mockResolvedValue(createdAccountMock as never),
        },
      };

      jest.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
        return callback(txMock as never);
      });

      await CreateBrandPayoutAccount(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            id: 'new-payout-acc',
            provider: 'BCA',
            isPrimary: true,
            verificationStatus: VerificationStatus.PENDING,
          }),
        }),
      );
    });

    it('CreateBrandPayoutAccount successfully creates e-wallet account (GoPay)', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        body: {
          accountType: 'E_WALLET',
          provider: 'GOPAY',
          accountNumber: '081234567890',
          accountHolderName: 'PT Brand Keren',
          proofUrl: 'https://storage.supabase.co/gopay-proof.jpg',
          isPrimary: false,
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.brand, 'findFirst').mockResolvedValue(mockBrand as never);
      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.brandPayoutAccount, 'count').mockResolvedValue(1);
      jest.spyOn(prisma.brandPayoutAccount, 'findFirst')
        .mockResolvedValueOnce(null) // duplicate check
        .mockResolvedValueOnce({ id: 'existing-primary' } as never); // has primary account

      const createdGopayMock = {
        id: 'new-gopay-acc',
        walletId: mockWallet.id,
        brandId: mockBrand.id,
        accountType: 'E_WALLET',
        provider: 'GOPAY',
        accountNumber: '081234567890',
        accountHolderName: 'PT Brand Keren',
        proofUrl: 'https://storage.supabase.co/gopay-proof.jpg',
        isPrimary: false,
        verificationStatus: VerificationStatus.PENDING,
        rejectionReason: null,
        verifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const txMock = {
        brandPayoutAccount: {
          create: jest.fn().mockResolvedValue(createdGopayMock as never),
        },
      };

      jest.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
        return callback(txMock as never);
      });

      await CreateBrandPayoutAccount(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            id: 'new-gopay-acc',
            provider: 'GOPAY',
            isPrimary: false,
            verificationStatus: VerificationStatus.PENDING,
          }),
        }),
      );
    });

    it('SetPrimaryBrandPayoutAccount unsets other accounts and sets target account as primary', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        params: { id: 'payout-acc-2' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.brandPayoutAccount, 'findFirst').mockResolvedValue({
        id: 'payout-acc-2',
        walletId: mockWallet.id,
        isPrimary: false,
      } as never);

      const txMock = {
        brandPayoutAccount: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 } as never),
          update: jest.fn().mockResolvedValue({
            id: 'payout-acc-2',
            walletId: mockWallet.id,
            isPrimary: true,
            provider: 'BCA',
            accountNumber: '1234567890',
            accountHolderName: 'Brand',
            verificationStatus: VerificationStatus.VERIFIED,
          } as never),
        },
      };

      jest.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
        return callback(txMock as never);
      });

      await SetPrimaryBrandPayoutAccount(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: BRAND_MESSAGES.PAYOUT_ACCOUNT_PRIMARY_SUCCESS }),
      );
    });

    it('DeleteBrandPayoutAccount returns 404 when target account is not found', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        params: { id: 'non-existing-acc' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.brandPayoutAccount, 'findFirst').mockResolvedValue(null);

      await DeleteBrandPayoutAccount(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: BRAND_MESSAGES.PAYOUT_ACCOUNT_NOT_FOUND }),
      );
    });

    it('DeleteBrandPayoutAccount soft-deletes and promotes remaining account to primary if deleted account was primary', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        params: { id: 'primary-acc-1' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.brandPayoutAccount, 'findFirst').mockResolvedValue({
        id: 'primary-acc-1',
        walletId: mockWallet.id,
        isPrimary: true,
      } as never);
      jest.spyOn(prisma.payoutRequest, 'findFirst').mockResolvedValue(null as never);

      const updateSpy = jest.fn().mockResolvedValue({} as never);
      const findFirstSpy = jest.fn().mockResolvedValue({
        id: 'secondary-acc-2',
        walletId: mockWallet.id,
        isPrimary: false,
      } as never);

      const txMock = {
        brandPayoutAccount: {
          update: updateSpy,
          findFirst: findFirstSpy,
        },
      };

      jest.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
        return callback(txMock as never);
      });

      await DeleteBrandPayoutAccount(req, res, next);

      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 'primary-acc-1' },
        data: { status: Status.DELETED, isPrimary: false },
      });
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 'secondary-acc-2' },
        data: { isPrimary: true },
      });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: BRAND_MESSAGES.PAYOUT_ACCOUNT_DELETED_SUCCESS }),
      );
    });
  });

  // ===========================================================================
  // 4. File Upload Handlers (Logo & Proof)
  // ===========================================================================
  describe('Brand File Upload Handlers', () => {
    it('UploadBrandLogo rejects unsupported mime types', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        headers: {
          'content-type': 'application/pdf',
          'content-length': '1024',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.brand, 'findFirst').mockResolvedValue(mockBrand as never);

      await UploadBrandLogo(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: BRAND_MESSAGES.UNSUPPORTED_FILE_TYPE }),
      );
    });

    it('UploadBrandLogo rejects missing Content-Length header with 411', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        headers: {
          'content-type': 'image/png',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.brand, 'findFirst').mockResolvedValue(mockBrand as never);

      await UploadBrandLogo(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(411);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: BRAND_MESSAGES.CONTENT_LENGTH_REQUIRED }),
      );
    });

    it('UploadBrandLogo rejects file size exceeding MAX_LOGO_SIZE_BYTES with 400', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        headers: {
          'content-type': 'image/png',
          'content-length': String(BRAND_LIMITS.MAX_LOGO_SIZE_BYTES + 100),
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.brand, 'findFirst').mockResolvedValue(mockBrand as never);

      await UploadBrandLogo(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: BRAND_MESSAGES.FILE_SIZE_EXCEEDED }),
      );
    });

    it('UploadBrandPayoutProof rejects unsupported mime type', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        headers: {
          'content-type': 'application/zip',
          'content-length': '1024',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.brand, 'findFirst').mockResolvedValue(mockBrand as never);

      await UploadBrandPayoutProof(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: BRAND_MESSAGES.UNSUPPORTED_FILE_TYPE }),
      );
    });
  });

  // ===========================================================================
  // 5. Wallet Withdrawal with verified Payout Account
  // ===========================================================================
  describe('Wallet Withdrawal with Payout Account Integration', () => {
    it('rejects withdrawal if payout account is not found', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        body: {
          amount: 100000,
          payoutAccountId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.brandPayoutAccount, 'findFirst').mockResolvedValue(null);

      await CreateWithdrawalRequest(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: WALLET_MESSAGES.PAYOUT_ACCOUNT_NOT_FOUND }),
      );
    });

    it('rejects withdrawal if payout account is still PENDING verification', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        body: {
          amount: 100000,
          payoutAccountId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.brandPayoutAccount, 'findFirst').mockResolvedValue({
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        walletId: mockWallet.id,
        verificationStatus: VerificationStatus.PENDING,
      } as never);

      await CreateWithdrawalRequest(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: WALLET_MESSAGES.PAYOUT_ACCOUNT_NOT_VERIFIED }),
      );
    });

    it('successfully creates withdrawal request using verified payout account snapshot', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        body: {
          amount: 100000,
          payoutAccountId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.brandPayoutAccount, 'findFirst').mockResolvedValue({
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        walletId: mockWallet.id,
        provider: 'BCA',
        accountNumber: '1234567890',
        accountHolderName: 'PT Brand Keren',
        verificationStatus: VerificationStatus.VERIFIED,
      } as never);

      const txMock = {
        wallet: {
          update: jest.fn().mockResolvedValue({} as never),
        },
        payoutRequest: {
          create: jest.fn().mockResolvedValue({
            id: 'payout-req-123',
            referenceCode: 'WD-TEST-0001',
            walletId: mockWallet.id,
            payoutAccountId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            amount: new Prisma.Decimal(100000),
            accountProvider: 'BCA',
            accountNumber: '1234567890',
            accountHolderName: 'PT Brand Keren',
            payoutStatus: PayoutStatus.PENDING,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as never),
        },
      };

      jest.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
        return callback(txMock as never);
      });

      await CreateWithdrawalRequest(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            accountProvider: 'BCA',
            accountNumber: '1234567890',
            payoutAccountId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          }),
        }),
      );
    });
  });

  // ===========================================================================
  // 9. GetBrandDashboardSummary
  // ===========================================================================
  describe('GetBrandDashboardSummary Handler', () => {
    it('returns 401 when account session is missing', async () => {
      const req = CreateMockRequest({ account: undefined });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await GetBrandDashboardSummary(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: BRAND_MESSAGES.AUTH_REQUIRED }),
      );
    });

    it('returns 403 when user role is not BRAND or ADMIN', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.CREATOR },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await GetBrandDashboardSummary(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: BRAND_MESSAGES.UNAUTHORIZED_ROLE }),
      );
    });

    it('returns 404 when brand profile is not found', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.brand, 'findFirst').mockResolvedValue(null);

      await GetBrandDashboardSummary(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: BRAND_MESSAGES.BRAND_NOT_FOUND }),
      );
    });

    it('returns 200 with complete metrics for brand with active campaigns and pending reviews', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.brand, 'findFirst').mockResolvedValue({
        id: 'brand-test-888',
        companyName: 'PT Brand Keren Nusantara',
        logoUrl: 'https://storage.supabase.co/logo.jpg',
      } as never);

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue({
        balance: new Prisma.Decimal(2500000),
      } as never);

      jest.spyOn(prisma.campaign, 'count')
        .mockResolvedValueOnce(3) // totalCampaignsCount
        .mockResolvedValueOnce(2); // activeCampaignsCount

      jest.spyOn(prisma.submission, 'count').mockResolvedValue(4); // pendingReviewsCount

      jest.spyOn(prisma.submission, 'aggregate').mockResolvedValue({
        _sum: {
          verifiedViews: 125000,
          earnings: new Prisma.Decimal(1250000),
        },
      } as never);

      jest.spyOn(prisma.campaign, 'findMany')
        .mockResolvedValueOnce([
          {
            budget: new Prisma.Decimal(5000000),
            submissions: [
              { earnings: new Prisma.Decimal(1250000) },
            ],
          },
        ] as never) // ongoingCampaigns (for escrow)
        .mockResolvedValueOnce([
          {
            id: 'camp-1',
            title: 'Kampanye Promo Q4',
            campaignCategory: 'TECHNOLOGY',
            cpm: new Prisma.Decimal(10000),
            budget: new Prisma.Decimal(5000000),
            startDate: new Date('2026-01-01T00:00:00Z'),
            endDate: new Date('2026-02-01T00:00:00Z'),
            submissions: [
              {
                submissionStatus: SubmissionStatus.APPROVED,
                verifiedViews: 50000,
                earnings: new Prisma.Decimal(500000),
              },
              {
                submissionStatus: SubmissionStatus.PENDING_REVIEW,
                verifiedViews: 0,
                earnings: new Prisma.Decimal(0),
              },
            ],
          },
        ] as never); // activeCampaigns

      jest.spyOn(prisma.submission, 'findMany')
        .mockResolvedValueOnce([
          {
            id: 'sub-1',
            campaignId: 'camp-1',
            creatorId: 'creator-1',
            draftVideoUrl: null,
            liveVideoUrl: 'https://tiktok.com/@creator/video/1',
            thumbnailUrl: 'https://img.tiktok.com/thumb1.jpg',
            videoCaption: 'Review produk keren #fyp',
            submissionStatus: SubmissionStatus.PENDING_REVIEW,
            reviewNote: null,
            verifiedViews: 0,
            earnings: new Prisma.Decimal(0),
            submittedAt: new Date('2026-01-10T10:00:00Z'),
            createdAt: new Date('2026-01-10T10:00:00Z'),
            updatedAt: new Date('2026-01-10T10:00:00Z'),
            campaign: { id: 'camp-1', title: 'Kampanye Promo Q4' },
            creator: { id: 'creator-1', fullName: 'Budi Kreator', avatarUrl: null },
            socialAccount: { id: 'soc-1', username: 'budikreator', avatarUrl: null, followersCount: 15000 },
          },
        ] as never) // pendingSubmissions
        .mockResolvedValueOnce([
          {
            id: 'clip-1',
            campaignId: 'camp-1',
            thumbnailUrl: 'https://img.tiktok.com/thumb1.jpg',
            liveVideoUrl: 'https://tiktok.com/@creator/video/1',
            verifiedViews: 50000,
            earnings: new Prisma.Decimal(500000),
            campaign: { title: 'Kampanye Promo Q4' },
            creator: { fullName: 'Budi Kreator', avatarUrl: null },
            socialAccount: { username: 'budikreator', avatarUrl: null },
          },
        ] as never); // topClips

      jest.spyOn(prisma.campaign, 'groupBy').mockResolvedValueOnce([
        { campaignStatus: CampaignStatus.DRAFT, _count: { _all: 2 } },
        { campaignStatus: CampaignStatus.FINISHED, _count: { _all: 5 } },
        { campaignStatus: CampaignStatus.ACTIVE, _count: { _all: 2 } },
      ] as never);

      await GetBrandDashboardSummary(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: BRAND_DASHBOARD_MESSAGES.SUMMARY_FETCH_SUCCESS,
          data: expect.objectContaining({
            brand: expect.objectContaining({
              id: 'brand-test-888',
              companyName: 'PT Brand Keren Nusantara',
            }),
            metrics: expect.objectContaining({
              totalVerifiedViews: 125000,
              totalSpent: 1250000,
              activeCampaignsCount: 2,
              pendingReviewsCount: 4,
              walletActiveBalance: 2500000,
              escrowLockedBalance: 3750000, // 5000000 - 1250000
              campaignStatusCounts: {
                draft: 2,
                inReview: 0,
                revision: 0,
                active: 2,
                finished: 5,
                total: 3,
              },
            }),
            hasAnyCampaigns: true,
            pendingSubmissions: expect.arrayContaining([
              expect.objectContaining({
                id: 'sub-1',
                submissionStatus: SubmissionStatus.PENDING_REVIEW,
                campaign: expect.objectContaining({ title: 'Kampanye Promo Q4' }),
              }),
            ]),
            activeCampaigns: expect.arrayContaining([
              expect.objectContaining({
                id: 'camp-1',
                progressPercent: 10, // 500000 / 5000000 = 10%
                pendingSubmissionsCount: 1,
              }),
            ]),
            topClips: expect.arrayContaining([
              expect.objectContaining({
                id: 'clip-1',
                verifiedViews: 50000,
              }),
            ]),
          }),
        }),
      );
    });

    it('returns 200 with zero state for brand with no campaigns (Day 0)', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.brand, 'findFirst').mockResolvedValue({
        id: 'brand-test-888',
        companyName: 'PT Brand Keren Nusantara',
        logoUrl: null,
      } as never);

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(null);

      jest.spyOn(prisma.campaign, 'count')
        .mockResolvedValueOnce(0) // totalCampaignsCount = 0
        .mockResolvedValueOnce(0); // activeCampaignsCount = 0

      jest.spyOn(prisma.campaign, 'groupBy').mockResolvedValueOnce([] as never);

      jest.spyOn(prisma.submission, 'count').mockResolvedValue(0);

      jest.spyOn(prisma.submission, 'aggregate').mockResolvedValue({
        _sum: {
          verifiedViews: null,
          earnings: null,
        },
      } as never);

      jest.spyOn(prisma.campaign, 'findMany')
        .mockResolvedValueOnce([]) // ongoingCampaigns
        .mockResolvedValueOnce([]); // activeCampaigns

      jest.spyOn(prisma.submission, 'findMany')
        .mockResolvedValueOnce([]) // pendingSubmissions
        .mockResolvedValueOnce([]); // topClips

      await GetBrandDashboardSummary(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            hasAnyCampaigns: false,
            metrics: {
              totalVerifiedViews: 0,
              totalSpent: 0,
              activeCampaignsCount: 0,
              pendingReviewsCount: 0,
              walletActiveBalance: 0,
              escrowLockedBalance: 0,
              campaignStatusCounts: {
                draft: 0,
                inReview: 0,
                revision: 0,
                active: 0,
                finished: 0,
                total: 0,
              },
            },
            pendingSubmissions: [],
            activeCampaigns: [],
            topClips: [],
          }),
        }),
      );
    });

    it('forwards error to next() when an unexpected exception is thrown', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
      });
      const { res } = CreateMockResponse();
      const next = CreateMockNext();

      const testError = new Error('Database connection failed');
      jest.spyOn(prisma.brand, 'findFirst').mockRejectedValue(testError);

      await GetBrandDashboardSummary(req, res, next);

      expect(next).toHaveBeenCalledWith(testError);
    });
  });
});
