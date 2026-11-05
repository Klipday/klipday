import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Prisma } from '../src/generated/prisma/client.js';
import {
  CampaignStatus,
  CampaignType,
  Category,
  PaymentStatus,
  PayoutAccountType,
  PayoutStatus,
  Role,
  Status,
  SubmissionStatus,
  VerificationStatus,
  WalletTransactionType,
} from '../src/generated/prisma/enums.js';
import {
  ADMIN_MESSAGES,
  KYC_FILTER,
  KYC_REVIEW_ACTION,
  KYC_ROLE_FILTER,
  MODERATION_ACTION,
  MODERATION_FILTER,
  TOPUP_FILTER,
  TOPUP_REVIEW_ACTION,
  WITHDRAWAL_FILTER,
  WITHDRAWAL_REVIEW_ACTION,
  WITHDRAWAL_ROLE_FILTER,
} from '../src/features/admin/admin.constants.js';
import {
  GetAdminDashboardSummary,
  GetAdminKycRequests,
  GetAdminModerationCampaigns,
  GetAdminTopUpRequests,
  GetAdminWithdrawals,
  ModerateCampaign,
  ReviewBrandTopUpRequest,
  ReviewKycRequest,
  ReviewWithdrawalRequest,
} from '../src/features/admin/admin.handlers.js';
import {
  BuildKycPhoneSearchVariants,
  CheckHolderNameMismatch,
} from '../src/features/admin/admin.helper.js';
import {
  AdminKycQuerySchema,
  AdminModerateCampaignSchema,
  AdminModerationQuerySchema,
  AdminTopUpQuerySchema,
  AdminWithdrawalQuerySchema,
  ReviewBrandTopUpSchema,
  ReviewKycSchema,
  ReviewWithdrawalSchema,
} from '../src/features/admin/admin.schemas.js';
import { prisma } from '../src/utils/prisma.js';
import {
  CreateMockNext,
  CreateMockRequest,
  CreateMockResponse,
} from './helpers/mock-express.js';

describe('Admin Campaign Moderation Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAdminAccount = {
    sub: 'acc-admin-999',
    role: Role.ADMIN,
  };

  const mockAdmin = {
    id: 'admin-profile-999',
    accountId: mockAdminAccount.sub,
    status: Status.ACTIVE,
  };

  const mockBrand = {
    id: 'brand-test-123',
    accountId: 'acc-brand-123',
    companyName: 'PT Brand Testing',
    logoUrl: 'https://example.com/logo.png',
    status: Status.ACTIVE,
  };

  const mockBrandWallet = {
    id: 'wallet-brand-123',
    accountId: mockBrand.accountId,
    balance: new Prisma.Decimal(1000000),
    status: Status.ACTIVE,
  };

  const sampleInReviewCampaign = {
    id: 'camp-mod-100',
    title: 'Testing Moderation Campaign',
    campaignCategory: Category.TECHNOLOGY_GADGETS,
    campaignType: CampaignType.PRODUCT,
    campaignStatus: CampaignStatus.IN_REVIEW,
    thumbnailUrl: 'https://example.com/camp.jpg',
    cpm: new Prisma.Decimal(50000),
    minViews: 1000,
    maxViews: 20000,
    budget: new Prisma.Decimal(500000),
    startDate: new Date('2026-11-01'),
    endDate: new Date('2026-11-15'),
    createdAt: new Date('2026-10-27T10:00:00Z'),
    updatedAt: new Date('2026-10-27T10:00:00Z'),
    adminNote: null,
    brandId: mockBrand.id,
    brand: mockBrand,
    brief: {
      id: 'brief-100',
      purpose: 'Brand Awareness',
      keyMessage: 'Fast and reliable',
      narration: 'Check it out',
      guidelines: 'Use clean background',
      callToAction: 'Check bio',
      requiredCaption: '#Klipday',
      status: Status.ACTIVE,
    },
    materials: [],
    _count: {
      materials: 2,
    },
    payments: [
      {
        id: 'payment-mod-100',
        campaignId: 'camp-mod-100',
        amount: new Prisma.Decimal(500000),
        uniqueCode: 342,
        totalPayable: new Prisma.Decimal(500342),
        destinationBank: 'BCA',
        destinationAccount: '1234567890',
        senderProviderName: 'Bank Mandiri',
        senderAccountName: 'John Doe',
        transferProofUrl: 'https://example.com/receipt.jpg',
        paymentStatus: PaymentStatus.SUBMITTED,
        verifiedAt: null,
        rejectionReason: null,
        status: Status.ACTIVE,
      },
    ],
  };

  // ===========================================================================
  // 1. Zod Schema Validation Tests
  // ===========================================================================
  describe('Zod Schema Validations', () => {
    describe('AdminModerationQuerySchema', () => {
      it('defaults to filter IN_REVIEW, page 1, limit 12', () => {
        const parsed = AdminModerationQuerySchema.parse({});
        expect(parsed.filter).toBe(MODERATION_FILTER.IN_REVIEW);
        expect(parsed.page).toBe(1);
        expect(parsed.limit).toBe(12);
      });

      it('accepts valid filter option and trims search', () => {
        const parsed = AdminModerationQuerySchema.parse({
          filter: MODERATION_FILTER.REVISION,
          search: '  Nike Campaign  ',
          page: '2',
          limit: '20',
        });
        expect(parsed.filter).toBe(MODERATION_FILTER.REVISION);
        expect(parsed.search).toBe('Nike Campaign');
        expect(parsed.page).toBe(2);
        expect(parsed.limit).toBe(20);
      });

      it('rejects invalid filter option', () => {
        const result = AdminModerationQuerySchema.safeParse({ filter: 'UNKNOWN_STATUS' });
        expect(result.success).toBe(false);
      });
    });

    describe('AdminModerateCampaignSchema', () => {
      it('accepts APPROVE without adminNote', () => {
        const parsed = AdminModerateCampaignSchema.parse({
          action: MODERATION_ACTION.APPROVE,
        });
        expect(parsed.action).toBe(MODERATION_ACTION.APPROVE);
        expect(parsed.refundConfirmedManualPayment).toBe(true);
      });

      it('rejects REVISION when adminNote is empty', () => {
        const result = AdminModerateCampaignSchema.safeParse({
          action: MODERATION_ACTION.REVISION,
          adminNote: '   ',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(ADMIN_MESSAGES.ADMIN_NOTE_REQUIRED);
        }
      });

      it('rejects REJECT_PAYMENT when adminNote is empty', () => {
        const result = AdminModerateCampaignSchema.safeParse({
          action: MODERATION_ACTION.REJECT_PAYMENT,
        });
        expect(result.success).toBe(false);
      });

      it('rejects REJECT_CAMPAIGN when adminNote is empty', () => {
        const result = AdminModerateCampaignSchema.safeParse({
          action: MODERATION_ACTION.REJECT_CAMPAIGN,
        });
        expect(result.success).toBe(false);
      });

      it('accepts REJECT_CAMPAIGN with valid note and explicit refund flag', () => {
        const parsed = AdminModerateCampaignSchema.parse({
          action: MODERATION_ACTION.REJECT_CAMPAIGN,
          adminNote: 'Materi melanggar panduan komunitas.',
          refundConfirmedManualPayment: false,
        });
        expect(parsed.action).toBe(MODERATION_ACTION.REJECT_CAMPAIGN);
        expect(parsed.adminNote).toBe('Materi melanggar panduan komunitas.');
        expect(parsed.refundConfirmedManualPayment).toBe(false);
      });
    });
  });

  // ===========================================================================
  // 2. GetAdminModerationCampaigns Handler Tests
  // ===========================================================================
  describe('GetAdminModerationCampaigns Handler', () => {
    it('returns 401 when account is not authenticated', async () => {
      const req = CreateMockRequest({ account: undefined });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await GetAdminModerationCampaigns(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: ADMIN_MESSAGES.AUTH_REQUIRED,
      });
    });

    it('returns 403 when user is not Role.ADMIN', async () => {
      const req = CreateMockRequest({
        account: { sub: 'acc-brand-1', role: Role.BRAND },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await GetAdminModerationCampaigns(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: ADMIN_MESSAGES.ADMIN_ONLY,
      });
    });

    it('returns paginated items and live tab counts with active brand filter (200)', async () => {
      const req = CreateMockRequest({
        account: mockAdminAccount,
        query: { filter: 'IN_REVIEW', page: '1', limit: '10' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.campaign, 'findMany').mockResolvedValue([sampleInReviewCampaign as never]);
      jest
        .spyOn(prisma.campaign, 'count')
        .mockResolvedValueOnce(1) // totalFiltered
        .mockResolvedValueOnce(1) // countInReview
        .mockResolvedValueOnce(0) // countRevision
        .mockResolvedValueOnce(2) // countActive
        .mockResolvedValueOnce(0) // countRejected
        .mockResolvedValueOnce(3); // countAll

      await GetAdminModerationCampaigns(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      const callArg = jsonMock.mock.calls[0]?.[0] as {
        status: string;
        data: {
          items: unknown[];
          counts: { inReview: number; active: number };
          pagination: { total: number };
        };
      };
      expect(callArg.status).toBe('success');
      expect(callArg.data.items).toHaveLength(1);
      expect(callArg.data.counts.inReview).toBe(1);
      expect(callArg.data.counts.active).toBe(2);
      expect(callArg.data.pagination.total).toBe(1);

      // Verify brand soft-delete filter was passed
      const findManyArg = (prisma.campaign.findMany as jest.Mock).mock.calls[0]?.[0] as {
        where: { status: Status; brand: { status: Status } };
      };
      expect(findManyArg.where.status).toBe(Status.ACTIVE);
      expect(findManyArg.where.brand.status).toBe(Status.ACTIVE);
    });
  });

  // ===========================================================================
  // 3. ModerateCampaign Handler Tests
  // ===========================================================================
  describe('ModerateCampaign Handler', () => {
    it('returns 401 when account is not authenticated', async () => {
      const req = CreateMockRequest({
        account: undefined,
        params: { id: sampleInReviewCampaign.id },
        body: { action: MODERATION_ACTION.APPROVE },
      });
      const { res, statusMock } = CreateMockResponse();
      const next = CreateMockNext();

      await ModerateCampaign(req, res, next);
      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('returns 403 when user is not Role.ADMIN', async () => {
      const req = CreateMockRequest({
        account: { sub: 'creator-acc', role: Role.CREATOR },
        params: { id: sampleInReviewCampaign.id },
        body: { action: MODERATION_ACTION.APPROVE },
      });
      const { res, statusMock } = CreateMockResponse();
      const next = CreateMockNext();

      await ModerateCampaign(req, res, next);
      expect(statusMock).toHaveBeenCalledWith(403);
    });

    it('returns 404 when campaign is not found', async () => {
      const req = CreateMockRequest({
        account: mockAdminAccount,
        params: { id: 'non-existent-campaign' },
        body: { action: MODERATION_ACTION.APPROVE },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(mockAdmin as never);
      jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(null);

      await ModerateCampaign(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: ADMIN_MESSAGES.CAMPAIGN_NOT_FOUND,
      });
    });

    it('returns 400 when campaign is not in IN_REVIEW status', async () => {
      const req = CreateMockRequest({
        account: mockAdminAccount,
        params: { id: sampleInReviewCampaign.id },
        body: { action: MODERATION_ACTION.APPROVE },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      const activeCampaign = {
        ...sampleInReviewCampaign,
        campaignStatus: CampaignStatus.ACTIVE,
      };

      jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(mockAdmin as never);
      jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(activeCampaign as never);

      await ModerateCampaign(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: ADMIN_MESSAGES.CAMPAIGN_NOT_IN_REVIEW,
      });
    });

    it('successfully APPROVES campaign with SUBMITTED manual payment (200)', async () => {
      const req = CreateMockRequest({
        account: mockAdminAccount,
        params: { id: sampleInReviewCampaign.id },
        body: { action: MODERATION_ACTION.APPROVE },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(mockAdmin as never);
      jest
        .spyOn(prisma.campaign, 'findFirst')
        .mockResolvedValueOnce(sampleInReviewCampaign as never) // lookup
        .mockResolvedValueOnce({
          ...sampleInReviewCampaign,
          campaignStatus: CampaignStatus.ACTIVE,
        } as never); // final select

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockBrandWallet as never);

      const mockTx = {
        wallet: {
          findFirst: jest.fn().mockResolvedValue(mockBrandWallet),
          update: jest.fn().mockResolvedValue(mockBrandWallet),
        },
        campaignPayment: { update: jest.fn().mockResolvedValue({}) },
        walletTransaction: { create: jest.fn().mockResolvedValue({}) },
        campaign: { update: jest.fn().mockResolvedValue({}) },
      };

      jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: unknown) => {
        return (callback as (tx: unknown) => Promise<unknown>)(mockTx);
      });

      await ModerateCampaign(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(mockTx.campaignPayment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: sampleInReviewCampaign.payments[0].id },
          data: expect.objectContaining({
            paymentStatus: PaymentStatus.APPROVED,
            verifiedByAdminId: mockAdmin.id,
          }),
        }),
      );
      expect(mockTx.walletTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: WalletTransactionType.CAMPAIGN_PAYMENT,
            walletId: mockBrandWallet.id,
          }),
        }),
      );
      expect(mockTx.campaign.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: sampleInReviewCampaign.id },
          data: expect.objectContaining({
            campaignStatus: CampaignStatus.ACTIVE,
            adminNote: null,
          }),
        }),
      );
    });

    it('successfully requests REVISION and locks manual payment as APPROVED (200)', async () => {
      const req = CreateMockRequest({
        account: mockAdminAccount,
        params: { id: sampleInReviewCampaign.id },
        body: {
          action: MODERATION_ACTION.REVISION,
          adminNote: 'Mohon perbaiki deskripsi dan link materi Google Drive.',
        },
      });
      const { res, statusMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(mockAdmin as never);
      jest
        .spyOn(prisma.campaign, 'findFirst')
        .mockResolvedValueOnce(sampleInReviewCampaign as never)
        .mockResolvedValueOnce({
          ...sampleInReviewCampaign,
          campaignStatus: CampaignStatus.REVISION,
          adminNote: 'Mohon perbaiki deskripsi dan link materi Google Drive.',
        } as never);

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockBrandWallet as never);

      const mockTx = {
        wallet: {
          findFirst: jest.fn().mockResolvedValue(mockBrandWallet),
          update: jest.fn().mockResolvedValue(mockBrandWallet),
        },
        campaignPayment: { update: jest.fn().mockResolvedValue({}) },
        walletTransaction: { create: jest.fn().mockResolvedValue({}) },
        campaign: { update: jest.fn().mockResolvedValue({}) },
      };

      jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: unknown) => {
        return (callback as (tx: unknown) => Promise<unknown>)(mockTx);
      });

      await ModerateCampaign(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(mockTx.campaignPayment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paymentStatus: PaymentStatus.APPROVED,
          }),
        }),
      );
      expect(mockTx.campaign.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            campaignStatus: CampaignStatus.REVISION,
            adminNote: 'Mohon perbaiki deskripsi dan link materi Google Drive.',
          }),
        }),
      );
    });

    it('returns 400 when REJECT_PAYMENT is requested on non-SUBMITTED payment', async () => {
      const walletPaidCampaign = {
        ...sampleInReviewCampaign,
        payments: [
          {
            ...sampleInReviewCampaign.payments[0],
            paymentStatus: PaymentStatus.APPROVED,
          },
        ],
      };

      const req = CreateMockRequest({
        account: mockAdminAccount,
        params: { id: sampleInReviewCampaign.id },
        body: {
          action: MODERATION_ACTION.REJECT_PAYMENT,
          adminNote: 'Struk tidak valid.',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(mockAdmin as never);
      jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(walletPaidCampaign as never);

      await ModerateCampaign(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: ADMIN_MESSAGES.PAYMENT_NOT_SUBMITTED_FOR_REJECT,
      });
    });

    it('successfully REJECTS campaign and auto-refunds full amount to brand wallet (200)', async () => {
      const req = CreateMockRequest({
        account: mockAdminAccount,
        params: { id: sampleInReviewCampaign.id },
        body: {
          action: MODERATION_ACTION.REJECT_CAMPAIGN,
          adminNote: 'Kampanye melanggar ketentuan platform Klipday.',
          refundConfirmedManualPayment: true,
        },
      });
      const { res, statusMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(mockAdmin as never);
      jest
        .spyOn(prisma.campaign, 'findFirst')
        .mockResolvedValueOnce(sampleInReviewCampaign as never)
        .mockResolvedValueOnce({
          ...sampleInReviewCampaign,
          campaignStatus: CampaignStatus.REJECTED,
          adminNote: 'Kampanye melanggar ketentuan platform Klipday.',
        } as never);

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockBrandWallet as never);

      const mockTx = {
        campaignPayment: { update: jest.fn().mockResolvedValue({}) },
        walletTransaction: { create: jest.fn().mockResolvedValue({}) },
        wallet: {
          findFirst: jest.fn().mockResolvedValue(mockBrandWallet),
          update: jest.fn().mockResolvedValue(mockBrandWallet),
        },
        campaign: { update: jest.fn().mockResolvedValue({}) },
      };

      jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: unknown) => {
        return (callback as (tx: unknown) => Promise<unknown>)(mockTx);
      });

      await ModerateCampaign(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);

      // Payment verified
      expect(mockTx.campaignPayment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paymentStatus: PaymentStatus.APPROVED,
          }),
        }),
      );

      // Wallet balance refunded
      const expectedRefundAmount = Number(sampleInReviewCampaign.payments[0].totalPayable);
      const expectedNewBalance = Number(mockBrandWallet.balance) + expectedRefundAmount;

      expect(mockTx.wallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockBrandWallet.id },
          data: { balance: new Prisma.Decimal(expectedNewBalance) },
        }),
      );

      // Refund transaction recorded
      expect(mockTx.walletTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: WalletTransactionType.CAMPAIGN_REFUND,
            amount: new Prisma.Decimal(expectedRefundAmount),
          }),
        }),
      );

      // Campaign set to REJECTED
      expect(mockTx.campaign.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            campaignStatus: CampaignStatus.REJECTED,
            adminNote: 'Kampanye melanggar ketentuan platform Klipday.',
          }),
        }),
      );
    });

    it('rejects fake payment on REJECT_CAMPAIGN when refundConfirmedManualPayment is false without refunding wallet', async () => {
      const req = CreateMockRequest({
        account: mockAdminAccount,
        params: { id: sampleInReviewCampaign.id },
        body: {
          action: MODERATION_ACTION.REJECT_CAMPAIGN,
          adminNote: 'Struk transfer palsu.',
          refundConfirmedManualPayment: false,
        },
      });
      const { res, statusMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(mockAdmin as never);
      jest
        .spyOn(prisma.campaign, 'findFirst')
        .mockResolvedValueOnce(sampleInReviewCampaign as never)
        .mockResolvedValueOnce({
          ...sampleInReviewCampaign,
          campaignStatus: CampaignStatus.REJECTED,
        } as never);

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockBrandWallet as never);

      const mockTx = {
        campaignPayment: { update: jest.fn().mockResolvedValue({}) },
        walletTransaction: { create: jest.fn().mockResolvedValue({}) },
        wallet: {
          findFirst: jest.fn().mockResolvedValue(mockBrandWallet),
          update: jest.fn().mockResolvedValue(mockBrandWallet),
        },
        campaign: { update: jest.fn().mockResolvedValue({}) },
      };

      jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: unknown) => {
        return (callback as (tx: unknown) => Promise<unknown>)(mockTx);
      });

      await ModerateCampaign(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);

      // Payment marked REJECTED
      expect(mockTx.campaignPayment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paymentStatus: PaymentStatus.REJECTED,
            rejectionReason: 'Struk transfer palsu.',
          }),
        }),
      );

      // No wallet refund
      expect(mockTx.wallet.update).not.toHaveBeenCalled();
      expect(mockTx.walletTransaction.create).not.toHaveBeenCalled();
    });
  });

  describe('Admin Brand Top-Up Review Module', () => {
    const mockAdminAccount = {
      sub: 'acc-admin-999',
      role: Role.ADMIN,
    };

    const mockAdmin = {
      id: 'admin-profile-999',
      accountId: mockAdminAccount.sub,
      status: Status.ACTIVE,
    };

    const sampleTopUp = {
      id: 'topup-123',
      referenceCode: 'TU-2610-8912',
      walletId: 'wallet-brand-123',
      amount: new Prisma.Decimal(1000000),
      uniqueCode: 342,
      totalPayable: new Prisma.Decimal(1000342),
      destinationBank: 'BCA',
      destinationAccount: '1234567890',
      destinationHolderName: 'PT Klipday Media Kreasi',
      senderBank: 'BCA',
      senderAccountName: 'PT Brand Testing',
      transferProofUrl: 'https://example.com/receipt.jpg',
      status: PaymentStatus.SUBMITTED,
      rejectionReason: null,
      verifiedByAdminId: null,
      verifiedAt: null,
      recordStatus: Status.ACTIVE,
      createdAt: new Date('2026-10-27T10:00:00Z'),
      updatedAt: new Date('2026-10-27T10:05:00Z'),
      wallet: {
        id: 'wallet-brand-123',
        balance: new Prisma.Decimal(500000),
        status: Status.ACTIVE,
        account: {
          id: 'acc-brand-123',
          email: 'brand@example.com',
          status: Status.ACTIVE,
          brand: {
            id: 'brand-test-123',
            companyName: 'PT Brand Testing',
            logoUrl: 'https://example.com/logo.png',
            status: Status.ACTIVE,
          },
        },
      },
    };

    describe('GetAdminTopUpRequests', () => {
      it('should fail with 401 if unauthenticated', async () => {
        const req = CreateMockRequest({ query: {} });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        await GetAdminTopUpRequests(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(401);
      });

      it('should fail with 403 if role is not ADMIN', async () => {
        const req = CreateMockRequest({
          account: { sub: 'creator-1', role: Role.CREATOR },
          query: {},
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        await GetAdminTopUpRequests(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(403);
      });

      it('should successfully return paginated top-up queue and tab counts', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          query: {
            filter: TOPUP_FILTER.SUBMITTED,
            page: '1',
            limit: '10',
          },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.topUpRequest, 'findMany').mockResolvedValue([sampleTopUp as never]);
        jest
          .spyOn(prisma.topUpRequest, 'count')
          .mockResolvedValueOnce(1) // totalFiltered
          .mockResolvedValueOnce(1) // countSubmitted
          .mockResolvedValueOnce(0) // countPending
          .mockResolvedValueOnce(0) // countApproved
          .mockResolvedValueOnce(0) // countRejected
          .mockResolvedValueOnce(1); // countAll

        await GetAdminTopUpRequests(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'success',
            data: expect.objectContaining({
              items: expect.arrayContaining([
                expect.objectContaining({
                  id: sampleTopUp.id,
                  referenceCode: sampleTopUp.referenceCode,
                  totalPayable: 1000342,
                  status: PaymentStatus.SUBMITTED,
                  brand: expect.objectContaining({
                    companyName: 'PT Brand Testing',
                    email: 'brand@example.com',
                  }),
                }),
              ]),
              counts: {
                submitted: 1,
                pending: 0,
                approved: 0,
                rejected: 0,
                all: 1,
              },
              pagination: {
                page: 1,
                limit: 10,
                total: 1,
                totalPages: 1,
              },
            }),
          }),
        );
      });

      it('should include brand email in search query filter', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          query: { search: 'brand@example.com' },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        const findManySpy = jest
          .spyOn(prisma.topUpRequest, 'findMany')
          .mockResolvedValue([sampleTopUp as never]);
        jest.spyOn(prisma.topUpRequest, 'count').mockResolvedValue(1);

        await GetAdminTopUpRequests(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(findManySpy).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              AND: [
                {
                  OR: expect.arrayContaining([
                    { wallet: { account: { email: { contains: 'brand@example.com', mode: 'insensitive' } } } },
                  ]),
                },
              ],
            }),
          }),
        );
      });
    });

    describe('ReviewBrandTopUpRequest', () => {
      it('should fail with 401 if unauthenticated', async () => {
        const req = CreateMockRequest({
          params: { id: sampleTopUp.id },
          body: { decision: TOPUP_REVIEW_ACTION.APPROVE },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        await ReviewBrandTopUpRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(401);
      });

      it('should fail with 403 if role is not ADMIN', async () => {
        const req = CreateMockRequest({
          account: { sub: 'brand-1', role: Role.BRAND },
          params: { id: sampleTopUp.id },
          body: { decision: TOPUP_REVIEW_ACTION.APPROVE },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        await ReviewBrandTopUpRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(403);
      });

      it('should fail with 403 if admin record is not found', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: sampleTopUp.id },
          body: { decision: TOPUP_REVIEW_ACTION.APPROVE },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(null);

        await ReviewBrandTopUpRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(403);
      });

      it('should fail with 400 if REJECT decision lacks a valid rejectionReason', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: sampleTopUp.id },
          body: { decision: TOPUP_REVIEW_ACTION.REJECT, rejectionReason: 'bad' },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(mockAdmin as never);

        await ReviewBrandTopUpRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
      });

      it('should fail with 404 if top-up request is not found', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: 'non-existent' },
          body: { decision: TOPUP_REVIEW_ACTION.APPROVE },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(mockAdmin as never);
        jest.spyOn(prisma.topUpRequest, 'findFirst').mockResolvedValue(null);

        await ReviewBrandTopUpRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(404);
      });

      it('should fail with 400 if top-up request is not in SUBMITTED status', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: sampleTopUp.id },
          body: { decision: TOPUP_REVIEW_ACTION.APPROVE },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(mockAdmin as never);
        jest.spyOn(prisma.topUpRequest, 'findFirst').mockResolvedValue({
          ...sampleTopUp,
          status: PaymentStatus.PENDING,
        } as never);

        await ReviewBrandTopUpRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
      });

      it('should atomically credit totalPayable and record BRAND_DEPOSIT transaction on APPROVE', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: sampleTopUp.id },
          body: { decision: TOPUP_REVIEW_ACTION.APPROVE },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(mockAdmin as never);
        jest
          .spyOn(prisma.topUpRequest, 'findFirst')
          .mockResolvedValueOnce(sampleTopUp as never)
          .mockResolvedValueOnce({
            ...sampleTopUp,
            status: PaymentStatus.APPROVED,
            verifiedByAdminId: mockAdmin.id,
            verifiedAt: new Date(),
          } as never);

        const mockTx = {
          topUpRequest: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          wallet: {
            findUniqueOrThrow: jest.fn().mockResolvedValue({
              id: sampleTopUp.walletId,
              balance: new Prisma.Decimal(500000),
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          walletTransaction: { create: jest.fn().mockResolvedValue({}) },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: unknown) => {
          return (callback as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await ReviewBrandTopUpRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);

        // Top up conditionally updated to APPROVED
        expect(mockTx.topUpRequest.updateMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              id: sampleTopUp.id,
              status: PaymentStatus.SUBMITTED,
              recordStatus: Status.ACTIVE,
            },
            data: expect.objectContaining({
              status: PaymentStatus.APPROVED,
              rejectionReason: null,
              verifiedByAdminId: mockAdmin.id,
            }),
          }),
        );

        // Wallet incremented by totalPayable (500000 + 1000342 = 1500342)
        expect(mockTx.wallet.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: sampleTopUp.walletId },
            data: {
              balance: new Prisma.Decimal(1500342),
            },
          }),
        );

        // WalletTransaction recorded
        expect(mockTx.walletTransaction.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              walletId: sampleTopUp.walletId,
              type: WalletTransactionType.BRAND_DEPOSIT,
              amount: new Prisma.Decimal(1000342),
              balanceBefore: new Prisma.Decimal(500000),
              balanceAfter: new Prisma.Decimal(1500342),
            }),
          }),
        );
      });

      it('should fail with 400 and abort transaction if concurrent request already approved/rejected top-up (race condition guard)', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: sampleTopUp.id },
          body: { decision: TOPUP_REVIEW_ACTION.APPROVE },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(mockAdmin as never);
        jest.spyOn(prisma.topUpRequest, 'findFirst').mockResolvedValue(sampleTopUp as never);

        const mockTx = {
          topUpRequest: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) }, // simulated concurrent update
          wallet: {
            findUniqueOrThrow: jest.fn(),
            update: jest.fn(),
          },
          walletTransaction: { create: jest.fn() },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: unknown) => {
          return (callback as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await ReviewBrandTopUpRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: ADMIN_MESSAGES.TOP_UP_NOT_SUBMITTED,
        });

        // Crucial: wallet balance and transaction ledger MUST NOT be touched
        expect(mockTx.wallet.update).not.toHaveBeenCalled();
        expect(mockTx.walletTransaction.create).not.toHaveBeenCalled();
      });

      it('should update status to REJECTED and save rejectionReason on REJECT without touching wallet', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: sampleTopUp.id },
          body: {
            decision: TOPUP_REVIEW_ACTION.REJECT,
            rejectionReason: 'Nominal transfer tidak sesuai dengan total tagihan.',
          },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(mockAdmin as never);
        jest
          .spyOn(prisma.topUpRequest, 'findFirst')
          .mockResolvedValueOnce(sampleTopUp as never)
          .mockResolvedValueOnce({
            ...sampleTopUp,
            status: PaymentStatus.REJECTED,
            rejectionReason: 'Nominal transfer tidak sesuai dengan total tagihan.',
            verifiedByAdminId: mockAdmin.id,
            verifiedAt: new Date(),
          } as never);

        const updateSpy = jest
          .spyOn(prisma.topUpRequest, 'updateMany')
          .mockResolvedValue({ count: 1 } as never);
        const transactionSpy = jest.spyOn(prisma, '$transaction');

        await ReviewBrandTopUpRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);

        expect(updateSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              id: sampleTopUp.id,
              status: PaymentStatus.SUBMITTED,
              recordStatus: Status.ACTIVE,
            },
            data: expect.objectContaining({
              status: PaymentStatus.REJECTED,
              rejectionReason: 'Nominal transfer tidak sesuai dengan total tagihan.',
              verifiedByAdminId: mockAdmin.id,
            }),
          }),
        );

        // Should NOT run atomic wallet transaction
        expect(transactionSpy).not.toHaveBeenCalled();
      });

      it('should fail with 400 if concurrent request already processed top-up on REJECT', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: sampleTopUp.id },
          body: {
            decision: TOPUP_REVIEW_ACTION.REJECT,
            rejectionReason: 'Struk tidak jelas.',
          },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(mockAdmin as never);
        jest.spyOn(prisma.topUpRequest, 'findFirst').mockResolvedValue(sampleTopUp as never);

        jest
          .spyOn(prisma.topUpRequest, 'updateMany')
          .mockResolvedValue({ count: 0 } as never); // simulated concurrent update

        await ReviewBrandTopUpRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: ADMIN_MESSAGES.TOP_UP_NOT_SUBMITTED,
        });
      });
    });
  });

  describe('Admin Withdrawal Verification & Review Module (Phase 4)', () => {
    const sampleWithdrawal = {
      id: 'wd-uuid-1',
      referenceCode: 'WD-2610-8912',
      walletId: 'wallet-uuid-1',
      amount: new Prisma.Decimal(250000),
      accountProvider: 'BCA',
      accountNumber: '7410992811',
      accountHolderName: 'Raka Pratama',
      payoutAccountId: 'payout-acc-uuid-1',
      payoutStatus: PayoutStatus.PENDING,
      rejectionReason: null,
      transferProofUrl: null,
      adminNote: null,
      cancellationRequestedAt: null,
      cancellationReason: null,
      processedByAdminId: null,
      processedAt: null,
      status: Status.ACTIVE,
      createdAt: new Date('2026-10-26T10:00:00Z'),
      updatedAt: new Date('2026-10-26T10:00:00Z'),
      payoutAccount: {
        id: 'payout-acc-uuid-1',
        accountType: 'BANK_TRANSFER',
        provider: 'BCA',
        accountNumber: '7410992811',
        accountHolderName: 'Raka Pratama',
        proofUrl: 'https://storage.klipday.com/payout/proof.jpg',
        verificationStatus: 'VERIFIED',
      },
      wallet: {
        id: 'wallet-uuid-1',
        accountId: 'creator-acc-1',
        status: Status.ACTIVE,
        account: {
          id: 'creator-acc-1',
          email: 'creator@klipday.com',
          role: Role.CREATOR,
          status: Status.ACTIVE,
          brand: null,
          creator: {
            id: 'creator-profile-1',
            fullName: 'Raka Pratama',
            avatarUrl: 'https://avatar.com/raka.jpg',
          },
        },
      },
    };

    describe('GetAdminWithdrawals', () => {
      it('should fail with 401 if unauthenticated', async () => {
        const req = CreateMockRequest({ query: {} });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        await GetAdminWithdrawals(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: ADMIN_MESSAGES.AUTH_REQUIRED,
        });
      });

      it('should fail with 403 if non-admin role', async () => {
        const req = CreateMockRequest({
          account: { ...mockAdminAccount, role: Role.CREATOR },
          query: {},
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        await GetAdminWithdrawals(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(403);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: ADMIN_MESSAGES.ADMIN_ONLY,
        });
      });

      it('should return paginated withdrawals and live tab counts for PENDING filter', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          query: { filter: 'PENDING', page: '1', limit: '25' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest
          .spyOn(prisma.payoutRequest, 'findMany')
          .mockResolvedValue([sampleWithdrawal as never]);
        jest
          .spyOn(prisma.payoutRequest, 'count')
          .mockResolvedValueOnce(1) // totalFiltered
          .mockResolvedValueOnce(1) // countPending
          .mockResolvedValueOnce(0) // countCancellation
          .mockResolvedValueOnce(3) // countApproved
          .mockResolvedValueOnce(0) // countRejected
          .mockResolvedValueOnce(4); // countAll

        await GetAdminWithdrawals(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          message: ADMIN_MESSAGES.GET_WITHDRAWALS_SUCCESS,
          data: expect.objectContaining({
            items: expect.arrayContaining([
              expect.objectContaining({
                id: sampleWithdrawal.id,
                referenceCode: sampleWithdrawal.referenceCode,
                amount: 250000,
                accountProvider: 'BCA',
                accountNumber: '7410992811',
                accountHolderName: 'Raka Pratama',
                payoutStatus: PayoutStatus.PENDING,
                user: expect.objectContaining({
                  displayName: 'Raka Pratama',
                  email: 'creator@klipday.com',
                  role: Role.CREATOR,
                }),
              }),
            ]),
            counts: {
              pending: 1,
              cancellation: 0,
              approved: 3,
              rejected: 0,
              all: 4,
            },
            pagination: {
              page: 1,
              limit: 25,
              total: 1,
              totalPages: 1,
            },
          }),
        });
      });

      it('should properly filter by CANCELLATION status and CREATOR role', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          query: { filter: 'CANCELLATION', role: 'CREATOR' },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        const findManySpy = jest
          .spyOn(prisma.payoutRequest, 'findMany')
          .mockResolvedValue([]);
        jest.spyOn(prisma.payoutRequest, 'count').mockResolvedValue(0);

        await GetAdminWithdrawals(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(findManySpy).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: Status.ACTIVE,
              payoutStatus: PayoutStatus.PENDING,
              cancellationRequestedAt: { not: null },
              wallet: expect.objectContaining({
                account: expect.objectContaining({
                  role: Role.CREATOR,
                }),
              }),
            }),
          }),
        );
      });

      it('should search across referenceCode and accountHolderName when search param is given', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          query: { search: 'Raka' },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        const findManySpy = jest
          .spyOn(prisma.payoutRequest, 'findMany')
          .mockResolvedValue([]);
        jest.spyOn(prisma.payoutRequest, 'count').mockResolvedValue(0);

        await GetAdminWithdrawals(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(findManySpy).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              AND: expect.arrayContaining([
                expect.objectContaining({
                  OR: expect.arrayContaining([
                    { referenceCode: { contains: 'Raka', mode: 'insensitive' } },
                    { accountProvider: { contains: 'Raka', mode: 'insensitive' } },
                    { accountHolderName: { contains: 'Raka', mode: 'insensitive' } },
                  ]),
                }),
              ]),
            }),
          }),
        );
      });
    });

    describe('ReviewWithdrawalRequest', () => {
      it('should fail with 401 if unauthenticated', async () => {
        const req = CreateMockRequest({
          params: { id: sampleWithdrawal.id },
          body: { decision: WITHDRAWAL_REVIEW_ACTION.APPROVE },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        await ReviewWithdrawalRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(401);
      });

      it('should fail with 403 if caller is not an admin', async () => {
        const req = CreateMockRequest({
          account: { ...mockAdminAccount, role: Role.BRAND },
          params: { id: sampleWithdrawal.id },
          body: { decision: WITHDRAWAL_REVIEW_ACTION.APPROVE },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        await ReviewWithdrawalRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(403);
      });

      it('should fail with 403 if admin profile does not exist', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: sampleWithdrawal.id },
          body: { decision: WITHDRAWAL_REVIEW_ACTION.APPROVE },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(null);

        await ReviewWithdrawalRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(403);
      });

      it('should fail with 400 if decision is REJECT but rejectionReason is under 5 chars', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: sampleWithdrawal.id },
          body: { decision: WITHDRAWAL_REVIEW_ACTION.REJECT, rejectionReason: 'bad' },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(mockAdmin as never);

        await ReviewWithdrawalRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
      });

      it('should fail with 404 if withdrawal request is not found', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: 'non-existent' },
          body: { decision: WITHDRAWAL_REVIEW_ACTION.APPROVE },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(mockAdmin as never);
        jest.spyOn(prisma.payoutRequest, 'findFirst').mockResolvedValue(null);

        await ReviewWithdrawalRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(404);
      });

      it('should fail with 400 if withdrawal request is not in PENDING status', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: sampleWithdrawal.id },
          body: { decision: WITHDRAWAL_REVIEW_ACTION.APPROVE },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(mockAdmin as never);
        jest.spyOn(prisma.payoutRequest, 'findFirst').mockResolvedValue({
          ...sampleWithdrawal,
          payoutStatus: PayoutStatus.APPROVED,
        } as never);

        await ReviewWithdrawalRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
      });

      it('should atomically approve withdrawal and create WITHDRAWAL transaction if not already present', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: sampleWithdrawal.id },
          body: {
            decision: WITHDRAWAL_REVIEW_ACTION.APPROVE,
            adminNote: 'Transfer via BCA KlikBisnis berhasil.',
          },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(mockAdmin as never);
        jest
          .spyOn(prisma.payoutRequest, 'findFirst')
          .mockResolvedValueOnce(sampleWithdrawal as never)
          .mockResolvedValueOnce({
            ...sampleWithdrawal,
            payoutStatus: PayoutStatus.APPROVED,
            adminNote: 'Transfer via BCA KlikBisnis berhasil.',
            processedByAdminId: mockAdmin.id,
            processedAt: new Date(),
          } as never);

        const mockTx = {
          payoutRequest: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          walletTransaction: {
            findFirst: jest.fn().mockResolvedValue(null), // no transaction yet
            create: jest.fn().mockResolvedValue({}),
          },
          wallet: {
            findUniqueOrThrow: jest.fn().mockResolvedValue({
              id: sampleWithdrawal.walletId,
              balance: new Prisma.Decimal(100000),
            }),
          },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: unknown) => {
          return (callback as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await ReviewWithdrawalRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);

        // payoutRequest updated
        expect(mockTx.payoutRequest.updateMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              id: sampleWithdrawal.id,
              payoutStatus: PayoutStatus.PENDING,
              status: Status.ACTIVE,
            },
            data: expect.objectContaining({
              payoutStatus: PayoutStatus.APPROVED,
              adminNote: 'Transfer via BCA KlikBisnis berhasil.',
              processedByAdminId: mockAdmin.id,
            }),
          }),
        );

        // WalletTransaction created with 250000
        expect(mockTx.walletTransaction.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              walletId: sampleWithdrawal.walletId,
              type: WalletTransactionType.WITHDRAWAL,
              amount: new Prisma.Decimal(250000),
            }),
          }),
        );
      });

      it('should approve withdrawal without creating duplicate transaction if already present', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: sampleWithdrawal.id },
          body: { decision: WITHDRAWAL_REVIEW_ACTION.APPROVE },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(mockAdmin as never);
        jest
          .spyOn(prisma.payoutRequest, 'findFirst')
          .mockResolvedValueOnce(sampleWithdrawal as never)
          .mockResolvedValueOnce({
            ...sampleWithdrawal,
            payoutStatus: PayoutStatus.APPROVED,
          } as never);

        const mockTx = {
          payoutRequest: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          walletTransaction: {
            findFirst: jest.fn().mockResolvedValue({ id: 'existing-txn-id' }), // already exists!
            create: jest.fn(),
          },
          wallet: { findUniqueOrThrow: jest.fn() },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: unknown) => {
          return (callback as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await ReviewWithdrawalRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(mockTx.walletTransaction.create).not.toHaveBeenCalled();
      });

      it('should reject withdrawal, refund wallet balance, and soft-delete premature transaction', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: sampleWithdrawal.id },
          body: {
            decision: WITHDRAWAL_REVIEW_ACTION.REJECT,
            rejectionReason: 'Nomor rekening tidak terdaftar di bank tujuan.',
          },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(mockAdmin as never);
        jest
          .spyOn(prisma.payoutRequest, 'findFirst')
          .mockResolvedValueOnce(sampleWithdrawal as never)
          .mockResolvedValueOnce({
            ...sampleWithdrawal,
            payoutStatus: PayoutStatus.REJECTED,
            rejectionReason: 'Nomor rekening tidak terdaftar di bank tujuan.',
          } as never);

        const mockTx = {
          payoutRequest: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          wallet: { update: jest.fn().mockResolvedValue({}) },
          walletTransaction: {
            findFirst: jest.fn().mockResolvedValue({ id: 'premature-txn-1' }),
            update: jest.fn().mockResolvedValue({}),
          },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: unknown) => {
          return (callback as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await ReviewWithdrawalRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);

        // Balance refunded by 250000
        expect(mockTx.wallet.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: sampleWithdrawal.walletId },
            data: {
              balance: {
                increment: sampleWithdrawal.amount,
              },
            },
          }),
        );

        // Premature transaction soft deleted
        expect(mockTx.walletTransaction.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 'premature-txn-1' },
            data: { status: Status.DELETED },
          }),
        );
      });

      it('should abort and return 400 if concurrent admin already reviewed withdrawal', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: sampleWithdrawal.id },
          body: { decision: WITHDRAWAL_REVIEW_ACTION.APPROVE },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(mockAdmin as never);
        jest.spyOn(prisma.payoutRequest, 'findFirst').mockResolvedValue(sampleWithdrawal as never);

        const mockTx = {
          payoutRequest: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) }, // race condition
          walletTransaction: { findFirst: jest.fn(), create: jest.fn() },
          wallet: { findUniqueOrThrow: jest.fn() },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: unknown) => {
          return (callback as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await ReviewWithdrawalRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: ADMIN_MESSAGES.WITHDRAWAL_NOT_PENDING,
        });
      });

      it('should accept empty string for transferProofUrl and approve successfully', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: sampleWithdrawal.id },
          body: {
            decision: WITHDRAWAL_REVIEW_ACTION.APPROVE,
            transferProofUrl: '',
          },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(mockAdmin as never);
        jest
          .spyOn(prisma.payoutRequest, 'findFirst')
          .mockResolvedValueOnce(sampleWithdrawal as never)
          .mockResolvedValueOnce({
            ...sampleWithdrawal,
            payoutStatus: PayoutStatus.APPROVED,
          } as never);

        const mockTx = {
          payoutRequest: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          walletTransaction: {
            findFirst: jest.fn().mockResolvedValue({ id: 'existing-txn' }),
            create: jest.fn(),
          },
          wallet: { findUniqueOrThrow: jest.fn() },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: unknown) => {
          return (callback as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await ReviewWithdrawalRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
      });

      it('should reject withdrawal cleanly when no premature transaction exists (e.g. Brand withdrawal)', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: sampleWithdrawal.id },
          body: {
            decision: WITHDRAWAL_REVIEW_ACTION.REJECT,
            rejectionReason: 'Rekening bank tidak dapat menerima transfer.',
          },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(mockAdmin as never);
        jest
          .spyOn(prisma.payoutRequest, 'findFirst')
          .mockResolvedValueOnce(sampleWithdrawal as never)
          .mockResolvedValueOnce({
            ...sampleWithdrawal,
            payoutStatus: PayoutStatus.REJECTED,
          } as never);

        const mockTx = {
          payoutRequest: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          wallet: { update: jest.fn().mockResolvedValue({}) },
          walletTransaction: {
            findFirst: jest.fn().mockResolvedValue(null), // no premature transaction!
            update: jest.fn(),
          },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: unknown) => {
          return (callback as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await ReviewWithdrawalRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(mockTx.wallet.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: sampleWithdrawal.walletId },
            data: {
              balance: {
                increment: sampleWithdrawal.amount,
              },
            },
          }),
        );
        expect(mockTx.walletTransaction.update).not.toHaveBeenCalled();
      });
    });
  });

  // ===========================================================================
  // 5. Admin KYC Verification Queue & Review (Phase 5)
  // ===========================================================================
  describe('Admin KYC Verification Queue & Review (Phase 5)', () => {
    const sampleCreatorKyc = {
      id: 'kyc-creator-001',
      walletId: 'wallet-creator-777',
      accountType: PayoutAccountType.BANK_TRANSFER,
      provider: 'BCA',
      accountNumber: '7410992811',
      accountHolderName: 'Raka Pratama',
      proofUrl: 'https://example.com/kyc-bca-passbook.jpg',
      isPrimary: true,
      verificationStatus: VerificationStatus.PENDING,
      rejectionReason: null,
      verifiedAt: null,
      createdAt: new Date('2026-10-31T05:15:00Z'),
      updatedAt: new Date('2026-10-31T05:15:00Z'),
      wallet: {
        id: 'wallet-creator-777',
        accountId: 'acc-creator-777',
        account: {
          id: 'acc-creator-777',
          email: 'raka.clipper@klipday.com',
          role: Role.CREATOR,
          brand: null,
          creator: {
            id: 'creator-777',
            fullName: 'Raka Pratama',
            avatarUrl: 'https://example.com/raka-avatar.jpg',
            phoneNumber: '6281288912201',
          },
        },
      },
    };

    const sampleBrandKyc = {
      id: 'kyc-brand-002',
      walletId: mockBrandWallet.id,
      accountType: PayoutAccountType.E_WALLET,
      provider: 'GOPAY',
      accountNumber: '6281190023310',
      accountHolderName: 'PT Brand Testing',
      proofUrl: 'https://example.com/kyc-gopay.jpg',
      isPrimary: false,
      verificationStatus: VerificationStatus.PENDING,
      rejectionReason: null,
      verifiedAt: null,
      createdAt: new Date('2026-10-31T04:40:00Z'),
      updatedAt: new Date('2026-10-31T04:40:00Z'),
      wallet: {
        id: mockBrandWallet.id,
        accountId: mockBrand.accountId,
        account: {
          id: mockBrand.accountId,
          email: 'finance@brandtesting.id',
          role: Role.BRAND,
          brand: {
            id: mockBrand.id,
            companyName: mockBrand.companyName,
            logoUrl: mockBrand.logoUrl,
            phoneNumber: '6281190023310',
          },
          creator: null,
        },
      },
    };

    describe('Zod Schemas (AdminKycQuerySchema & ReviewKycSchema)', () => {
      it('defaults AdminKycQuerySchema to filter PENDING, role ALL, page 1, limit 12', () => {
        const parsed = AdminKycQuerySchema.parse({});
        expect(parsed.filter).toBe(KYC_FILTER.PENDING);
        expect(parsed.role).toBe(KYC_ROLE_FILTER.ALL);
        expect(parsed.page).toBe(1);
        expect(parsed.limit).toBe(12);
      });

      it('parses valid filter, role, trimmed search, and pagination integers', () => {
        const parsed = AdminKycQuerySchema.parse({
          filter: KYC_FILTER.VERIFIED,
          role: KYC_ROLE_FILTER.BRAND,
          search: '  BCA 7410  ',
          page: '3',
          limit: '25',
        });
        expect(parsed.filter).toBe(KYC_FILTER.VERIFIED);
        expect(parsed.role).toBe(KYC_ROLE_FILTER.BRAND);
        expect(parsed.search).toBe('BCA 7410');
        expect(parsed.page).toBe(3);
        expect(parsed.limit).toBe(25);
      });

      it('rejects invalid KYC filter or role options', () => {
        const badFilter = AdminKycQuerySchema.safeParse({ filter: 'UNKNOWN' });
        expect(badFilter.success).toBe(false);

        const badRole = AdminKycQuerySchema.safeParse({ role: 'ADMIN' });
        expect(badRole.success).toBe(false);
      });

      it('validates ReviewKycSchema for APPROVE without rejectionReason', () => {
        const parsed = ReviewKycSchema.safeParse({
          decision: KYC_REVIEW_ACTION.APPROVE,
        });
        expect(parsed.success).toBe(true);
      });

      it('requires rejectionReason between 5 and 500 chars when decision is REJECT', () => {
        const missingReason = ReviewKycSchema.safeParse({
          decision: KYC_REVIEW_ACTION.REJECT,
        });
        expect(missingReason.success).toBe(false);

        const shortReason = ReviewKycSchema.safeParse({
          decision: KYC_REVIEW_ACTION.REJECT,
          rejectionReason: '   abc   ',
        });
        expect(shortReason.success).toBe(false);

        const tooLongReason = ReviewKycSchema.safeParse({
          decision: KYC_REVIEW_ACTION.REJECT,
          rejectionReason: 'x'.repeat(501),
        });
        expect(tooLongReason.success).toBe(false);

        const validReject = ReviewKycSchema.safeParse({
          decision: KYC_REVIEW_ACTION.REJECT,
          rejectionReason: '  Nama pemilik buku tabungan tidak sesuai identitas akun.  ',
        });
        expect(validReject.success).toBe(true);
        if (validReject.success) {
          expect(validReject.data.rejectionReason).toBe(
            'Nama pemilik buku tabungan tidak sesuai identitas akun.',
          );
        }
      });

      it('emits localized Indonesian error messages on null rejectionReason, undefined body, and array search query', () => {
        const nullRejectReason = ReviewKycSchema.safeParse({
          decision: KYC_REVIEW_ACTION.REJECT,
          rejectionReason: null,
        });
        expect(nullRejectReason.success).toBe(false);
        if (!nullRejectReason.success) {
          expect(nullRejectReason.error.issues[0]?.message).toBe(
            ADMIN_MESSAGES.KYC_REJECTION_REASON_REQUIRED,
          );
        }

        const nullApproveReason = ReviewKycSchema.safeParse({
          decision: KYC_REVIEW_ACTION.APPROVE,
          rejectionReason: null,
        });
        expect(nullApproveReason.success).toBe(true);

        const undefinedBody = ReviewKycSchema.safeParse(undefined);
        expect(undefinedBody.success).toBe(false);
        if (!undefinedBody.success) {
          expect(undefinedBody.error.issues[0]?.message).toBe(
            ADMIN_MESSAGES.INVALID_PAYLOAD,
          );
        }

        const arraySearch = AdminKycQuerySchema.safeParse({
          search: ['bca', 'gopay'],
        });
        expect(arraySearch.success).toBe(false);
        if (!arraySearch.success) {
          expect(arraySearch.error.issues[0]?.message).toBe(
            ADMIN_MESSAGES.INVALID_PAYLOAD,
          );
        }
      });

      it('expands 08... and 628... Indonesian phone/e-wallet search variants cleanly', () => {
        expect(BuildKycPhoneSearchVariants('081288912201')).toEqual(['6281288912201']);
        expect(BuildKycPhoneSearchVariants('6281288912201')).toEqual(['081288912201']);
        expect(BuildKycPhoneSearchVariants('+62 812-8891-2201')).toEqual([
          '6281288912201',
          '081288912201',
        ]);
        expect(BuildKycPhoneSearchVariants('Mandiri')).toEqual([]);
      });
    });

    describe('GetAdminKycRequests', () => {
      it('fails with 401 when unauthenticated', async () => {
        const req = CreateMockRequest();
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        await GetAdminKycRequests(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: ADMIN_MESSAGES.AUTH_REQUIRED,
        });
      });

      it('fails with 403 and zero DB hit when caller is not ADMIN', async () => {
        const findManySpy = jest.spyOn(prisma.brandPayoutAccount, 'findMany');
        const req = CreateMockRequest({
          account: { sub: 'acc-creator-777', role: Role.CREATOR },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        await GetAdminKycRequests(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(403);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: ADMIN_MESSAGES.ADMIN_ONLY,
        });
        expect(findManySpy).not.toHaveBeenCalled();
      });

      it('fails with 400 when query validation fails', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          query: { filter: 'INVALID_STATUS' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        await GetAdminKycRequests(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: ADMIN_MESSAGES.KYC_FILTER_INVALID,
        });
      });

      it('returns paginated creator and brand KYC items with live tab counts', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          query: { filter: 'PENDING', page: '1', limit: '25' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest
          .spyOn(prisma.brandPayoutAccount, 'findMany')
          .mockResolvedValue([sampleCreatorKyc as never, sampleBrandKyc as never]);
        jest
          .spyOn(prisma.brandPayoutAccount, 'count')
          .mockResolvedValueOnce(2) // totalFiltered
          .mockResolvedValueOnce(2) // countPending
          .mockResolvedValueOnce(4) // countVerified
          .mockResolvedValueOnce(1) // countRejected
          .mockResolvedValueOnce(7); // countAll

        await GetAdminKycRequests(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          message: ADMIN_MESSAGES.GET_KYC_SUCCESS,
          data: {
            items: [
              expect.objectContaining({
                id: sampleCreatorKyc.id,
                accountType: PayoutAccountType.BANK_TRANSFER,
                provider: 'BCA',
                accountNumber: '7410992811',
                accountHolderName: 'Raka Pratama',
                isPrimary: true,
                verificationStatus: VerificationStatus.PENDING,
                user: {
                  id: 'acc-creator-777',
                  email: 'raka.clipper@klipday.com',
                  role: Role.CREATOR,
                  displayName: 'Raka Pratama',
                  phoneNumber: '6281288912201',
                  avatarUrl: 'https://example.com/raka-avatar.jpg',
                },
              }),
              expect.objectContaining({
                id: sampleBrandKyc.id,
                accountType: PayoutAccountType.E_WALLET,
                provider: 'GOPAY',
                accountNumber: '6281190023310',
                accountHolderName: 'PT Brand Testing',
                isPrimary: false,
                verificationStatus: VerificationStatus.PENDING,
                user: {
                  id: mockBrand.accountId,
                  email: 'finance@brandtesting.id',
                  role: Role.BRAND,
                  displayName: mockBrand.companyName,
                  phoneNumber: '6281190023310',
                  avatarUrl: mockBrand.logoUrl,
                },
              }),
            ],
            counts: {
              pending: 2,
              verified: 4,
              rejected: 1,
              all: 7,
            },
            pagination: {
              page: 1,
              limit: 25,
              total: 2,
              totalPages: 1,
            },
          },
        });
      });

      it('applies soft-delete filters, role filter (BRAND), status filter (VERIFIED), and keyword search', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          query: {
            filter: 'VERIFIED',
            role: 'BRAND',
            search: 'Mandiri',
          },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        const findManySpy = jest
          .spyOn(prisma.brandPayoutAccount, 'findMany')
          .mockResolvedValue([]);
        jest.spyOn(prisma.brandPayoutAccount, 'count').mockResolvedValue(0);

        await GetAdminKycRequests(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(findManySpy).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: Status.ACTIVE,
              verificationStatus: VerificationStatus.VERIFIED,
              wallet: {
                status: Status.ACTIVE,
                account: {
                  status: Status.ACTIVE,
                  role: Role.BRAND,
                  brand: { status: Status.ACTIVE },
                },
              },
              AND: [
                {
                  OR: expect.arrayContaining([
                    { provider: { contains: 'Mandiri', mode: 'insensitive' } },
                    { accountNumber: { contains: 'Mandiri', mode: 'insensitive' } },
                    { accountHolderName: { contains: 'Mandiri', mode: 'insensitive' } },
                  ]),
                },
              ],
            }),
          }),
        );
      });

      it('expands 08... phone search into 628... variants across accountNumber and profile phoneNumber', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          query: {
            filter: 'PENDING',
            search: '081288912201',
          },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        const findManySpy = jest
          .spyOn(prisma.brandPayoutAccount, 'findMany')
          .mockResolvedValue([]);
        jest.spyOn(prisma.brandPayoutAccount, 'count').mockResolvedValue(0);

        await GetAdminKycRequests(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(findManySpy).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              AND: [
                {
                  OR: expect.arrayContaining([
                    { accountNumber: { contains: '081288912201', mode: 'insensitive' } },
                    { accountNumber: { contains: '6281288912201', mode: 'insensitive' } },
                    {
                      wallet: {
                        account: {
                          creator: {
                            phoneNumber: { contains: '6281288912201', mode: 'insensitive' },
                          },
                        },
                      },
                    },
                    {
                      wallet: {
                        account: {
                          brand: {
                            phoneNumber: { contains: '6281288912201', mode: 'insensitive' },
                          },
                        },
                      },
                    },
                  ]),
                },
              ],
            }),
          }),
        );
      });
    });

    describe('ReviewKycRequest', () => {
      it('fails with 401 when unauthenticated', async () => {
        const req = CreateMockRequest({
          params: { id: sampleCreatorKyc.id },
          body: { decision: KYC_REVIEW_ACTION.APPROVE },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        await ReviewKycRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(401);
      });

      it('fails with 403 and zero DB hit when caller is BRAND or CREATOR', async () => {
        const findFirstSpy = jest.spyOn(prisma.brandPayoutAccount, 'findFirst');
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCreatorKyc.id },
          body: { decision: KYC_REVIEW_ACTION.APPROVE },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        await ReviewKycRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(403);
        expect(findFirstSpy).not.toHaveBeenCalled();
      });

      it('fails with 400 and zero DB hit when REJECT payload has invalid rejectionReason', async () => {
        const findFirstSpy = jest.spyOn(prisma.brandPayoutAccount, 'findFirst');
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: sampleCreatorKyc.id },
          body: { decision: KYC_REVIEW_ACTION.REJECT, rejectionReason: 'no' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        await ReviewKycRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: ADMIN_MESSAGES.KYC_REJECTION_REASON_REQUIRED,
        });
        expect(findFirstSpy).not.toHaveBeenCalled();
      });

      it('fails with 404 when KYC payout account does not exist or is soft-deleted', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: 'missing-kyc-id' },
          body: { decision: KYC_REVIEW_ACTION.APPROVE },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.brandPayoutAccount, 'findFirst').mockResolvedValue(null);

        await ReviewKycRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: ADMIN_MESSAGES.KYC_NOT_FOUND,
        });
      });

      it('fails with 409 Conflict when KYC submission is already VERIFIED or REJECTED', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: sampleCreatorKyc.id },
          body: { decision: KYC_REVIEW_ACTION.APPROVE },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.brandPayoutAccount, 'findFirst').mockResolvedValue({
          id: sampleCreatorKyc.id,
          walletId: sampleCreatorKyc.walletId,
          isPrimary: true,
          verificationStatus: VerificationStatus.VERIFIED,
        } as never);

        await ReviewKycRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(409);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: ADMIN_MESSAGES.KYC_NOT_PENDING,
        });
      });

      it('fails with 409 Conflict when concurrent review updates KYC record before transaction commits', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: sampleCreatorKyc.id },
          body: { decision: KYC_REVIEW_ACTION.APPROVE },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.brandPayoutAccount, 'findFirst').mockResolvedValue({
          id: sampleCreatorKyc.id,
          walletId: sampleCreatorKyc.walletId,
          isPrimary: true,
          verificationStatus: VerificationStatus.PENDING,
        } as never);

        const mockTx = {
          brandPayoutAccount: {
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
            findFirst: jest.fn(),
            update: jest.fn(),
          },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: unknown) => {
          return (callback as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await ReviewKycRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(409);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: ADMIN_MESSAGES.KYC_NOT_PENDING,
        });
      });

      it('approves PENDING KYC account and promotes it to isPrimary when wallet has no verified primary account', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: sampleBrandKyc.id },
          body: { decision: KYC_REVIEW_ACTION.APPROVE },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest
          .spyOn(prisma.brandPayoutAccount, 'findFirst')
          .mockResolvedValueOnce({
            id: sampleBrandKyc.id,
            walletId: sampleBrandKyc.walletId,
            isPrimary: false,
            verificationStatus: VerificationStatus.PENDING,
          } as never)
          .mockResolvedValueOnce({
            ...sampleBrandKyc,
            isPrimary: true,
            verificationStatus: VerificationStatus.VERIFIED,
            verifiedAt: new Date(),
          } as never);

        const mockTx = {
          brandPayoutAccount: {
            updateMany: jest
              .fn()
              .mockResolvedValueOnce({ count: 1 }) // transition PENDING -> VERIFIED
              .mockResolvedValueOnce({ count: 1 }), // clear any unverified isPrimary
            findFirst: jest.fn().mockResolvedValue(null), // no existing VERIFIED primary
            update: jest.fn().mockResolvedValue({}),
          },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: unknown) => {
          return (callback as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await ReviewKycRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(mockTx.brandPayoutAccount.updateMany).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({
            where: {
              id: sampleBrandKyc.id,
              verificationStatus: VerificationStatus.PENDING,
              status: Status.ACTIVE,
            },
            data: expect.objectContaining({
              verificationStatus: VerificationStatus.VERIFIED,
              rejectionReason: null,
              verifiedAt: expect.any(Date),
            }),
          }),
        );
        expect(mockTx.brandPayoutAccount.updateMany).toHaveBeenNthCalledWith(2, {
          where: {
            walletId: sampleBrandKyc.walletId,
            status: Status.ACTIVE,
            id: { not: sampleBrandKyc.id },
            isPrimary: true,
          },
          data: { isPrimary: false },
        });
        expect(mockTx.brandPayoutAccount.update).toHaveBeenCalledWith({
          where: { id: sampleBrandKyc.id },
          data: { isPrimary: true },
        });
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'success',
            message: ADMIN_MESSAGES.KYC_APPROVE_SUCCESS,
          }),
        );
      });

      it('approves PENDING KYC account without overriding an existing VERIFIED primary account', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: sampleBrandKyc.id },
          body: { decision: KYC_REVIEW_ACTION.APPROVE },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest
          .spyOn(prisma.brandPayoutAccount, 'findFirst')
          .mockResolvedValueOnce({
            id: sampleBrandKyc.id,
            walletId: sampleBrandKyc.walletId,
            isPrimary: false,
            verificationStatus: VerificationStatus.PENDING,
          } as never)
          .mockResolvedValueOnce({
            ...sampleBrandKyc,
            isPrimary: false,
            verificationStatus: VerificationStatus.VERIFIED,
            verifiedAt: new Date(),
          } as never);

        const mockTx = {
          brandPayoutAccount: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            findFirst: jest.fn().mockResolvedValue({ id: 'existing-verified-primary' }),
            update: jest.fn(),
          },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: unknown) => {
          return (callback as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await ReviewKycRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(mockTx.brandPayoutAccount.update).not.toHaveBeenCalled();
      });

      it('rejects primary PENDING KYC account, demotes isPrimary, and promotes most recent VERIFIED fallback account', async () => {
        const rejectionNote =
          'Nama pemilik rekening buku tabungan tidak sesuai dengan nama profil akun.';
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: sampleCreatorKyc.id },
          body: {
            decision: KYC_REVIEW_ACTION.REJECT,
            rejectionReason: rejectionNote,
          },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest
          .spyOn(prisma.brandPayoutAccount, 'findFirst')
          .mockResolvedValueOnce({
            id: sampleCreatorKyc.id,
            walletId: sampleCreatorKyc.walletId,
            isPrimary: true,
            verificationStatus: VerificationStatus.PENDING,
          } as never)
          .mockResolvedValueOnce({
            ...sampleCreatorKyc,
            isPrimary: false,
            verificationStatus: VerificationStatus.REJECTED,
            rejectionReason: rejectionNote,
            verifiedAt: null,
          } as never);

        const mockTx = {
          brandPayoutAccount: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            findFirst: jest
              .fn()
              .mockResolvedValueOnce(null) // no remaining primary account in tx
              .mockResolvedValueOnce({ id: 'fallback-verified-kyc-999' }), // fallback VERIFIED account
            update: jest.fn().mockResolvedValue({}),
          },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: unknown) => {
          return (callback as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await ReviewKycRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(mockTx.brandPayoutAccount.updateMany).toHaveBeenCalledWith({
          where: {
            id: sampleCreatorKyc.id,
            verificationStatus: VerificationStatus.PENDING,
            status: Status.ACTIVE,
          },
          data: {
            verificationStatus: VerificationStatus.REJECTED,
            rejectionReason: rejectionNote,
            verifiedAt: null,
            isPrimary: false,
          },
        });
        expect(mockTx.brandPayoutAccount.findFirst).toHaveBeenNthCalledWith(1, {
          where: {
            walletId: sampleCreatorKyc.walletId,
            status: Status.ACTIVE,
            isPrimary: true,
            id: { not: sampleCreatorKyc.id },
          },
          select: { id: true },
        });
        expect(mockTx.brandPayoutAccount.findFirst).toHaveBeenNthCalledWith(2, {
          where: {
            walletId: sampleCreatorKyc.walletId,
            status: Status.ACTIVE,
            verificationStatus: VerificationStatus.VERIFIED,
            id: { not: sampleCreatorKyc.id },
          },
          orderBy: [{ verifiedAt: 'desc' }, { createdAt: 'desc' }],
          select: { id: true },
        });
        expect(mockTx.brandPayoutAccount.update).toHaveBeenCalledWith({
          where: { id: 'fallback-verified-kyc-999' },
          data: { isPrimary: true },
        });
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'success',
            message: ADMIN_MESSAGES.KYC_REJECT_SUCCESS,
          }),
        );
      });

      it('rejects primary PENDING KYC account cleanly when no fallback VERIFIED account exists', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: sampleCreatorKyc.id },
          body: {
            decision: KYC_REVIEW_ACTION.REJECT,
            rejectionReason: 'Foto buku tabungan terpotong dan nomor rekening tidak terbaca.',
          },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest
          .spyOn(prisma.brandPayoutAccount, 'findFirst')
          .mockResolvedValueOnce({
            id: sampleCreatorKyc.id,
            walletId: sampleCreatorKyc.walletId,
            isPrimary: true,
            verificationStatus: VerificationStatus.PENDING,
          } as never)
          .mockResolvedValueOnce({
            ...sampleCreatorKyc,
            isPrimary: false,
            verificationStatus: VerificationStatus.REJECTED,
            rejectionReason: 'Foto buku tabungan terpotong dan nomor rekening tidak terbaca.',
          } as never);

        const mockTx = {
          brandPayoutAccount: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            findFirst: jest.fn().mockResolvedValue(null),
            update: jest.fn(),
          },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: unknown) => {
          return (callback as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await ReviewKycRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(mockTx.brandPayoutAccount.findFirst).toHaveBeenCalledTimes(2);
        expect(mockTx.brandPayoutAccount.update).not.toHaveBeenCalled();
      });

      it('fails with 400 and zero DB hit when :id parameter is blank', async () => {
        const findFirstSpy = jest.spyOn(prisma.brandPayoutAccount, 'findFirst');
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: '   ' },
          body: { decision: KYC_REVIEW_ACTION.APPROVE },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        await ReviewKycRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(findFirstSpy).not.toHaveBeenCalled();
      });

      it('demotes duplicate isPrimary transactionally on approved account if another VERIFIED primary already exists', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: sampleCreatorKyc.id },
          body: { decision: KYC_REVIEW_ACTION.APPROVE },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest
          .spyOn(prisma.brandPayoutAccount, 'findFirst')
          .mockResolvedValueOnce({
            id: sampleCreatorKyc.id,
            walletId: sampleCreatorKyc.walletId,
            isPrimary: false, // Even if pre-tx was false before a concurrent primary switch!
            verificationStatus: VerificationStatus.PENDING,
          } as never)
          .mockResolvedValueOnce({
            ...sampleCreatorKyc,
            isPrimary: false,
            verificationStatus: VerificationStatus.VERIFIED,
            verifiedAt: new Date(),
          } as never);

        const mockTx = {
          brandPayoutAccount: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            findFirst: jest.fn().mockResolvedValue({ id: 'already-primary-verified' }),
            update: jest.fn().mockResolvedValue({}),
          },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: unknown) => {
          return (callback as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await ReviewKycRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(mockTx.brandPayoutAccount.updateMany).toHaveBeenNthCalledWith(2, {
          where: {
            id: sampleCreatorKyc.id,
            status: Status.ACTIVE,
            isPrimary: true,
          },
          data: { isPrimary: false },
        });
        expect(mockTx.brandPayoutAccount.update).not.toHaveBeenCalled();
      });

      it('rejects non-primary PENDING KYC account without overriding an existing active primary account', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: sampleBrandKyc.id },
          body: {
            decision: KYC_REVIEW_ACTION.REJECT,
            rejectionReason: 'Screenshot profil e-wallet tidak menampilkan nomor terdaftar.',
          },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest
          .spyOn(prisma.brandPayoutAccount, 'findFirst')
          .mockResolvedValueOnce({
            id: sampleBrandKyc.id,
            walletId: sampleBrandKyc.walletId,
            isPrimary: true, // Even if pre-tx was true before user concurrently switched primary to another account!
            verificationStatus: VerificationStatus.PENDING,
          } as never)
          .mockResolvedValueOnce({
            ...sampleBrandKyc,
            isPrimary: false,
            verificationStatus: VerificationStatus.REJECTED,
            rejectionReason: 'Screenshot profil e-wallet tidak menampilkan nomor terdaftar.',
          } as never);

        const mockTx = {
          brandPayoutAccount: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            findFirst: jest.fn().mockResolvedValue({ id: 'concurrently-selected-primary' }),
            update: jest.fn(),
          },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: unknown) => {
          return (callback as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await ReviewKycRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(mockTx.brandPayoutAccount.findFirst).toHaveBeenCalledTimes(1);
        expect(mockTx.brandPayoutAccount.update).not.toHaveBeenCalled();
      });

      it('promotes fallback VERIFIED account on REJECT when user concurrently promoted targetKyc after pre-tx read', async () => {
        const req = CreateMockRequest({
          account: mockAdminAccount,
          params: { id: sampleBrandKyc.id },
          body: {
            decision: KYC_REVIEW_ACTION.REJECT,
            rejectionReason: 'Nama rekening tujuan berbeda dari akta perusahaan.',
          },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest
          .spyOn(prisma.brandPayoutAccount, 'findFirst')
          .mockResolvedValueOnce({
            id: sampleBrandKyc.id,
            walletId: sampleBrandKyc.walletId,
            isPrimary: false, // Pre-tx read saw false, then Brand concurrently switched primary to targetKyc
            verificationStatus: VerificationStatus.PENDING,
          } as never)
          .mockResolvedValueOnce({
            ...sampleBrandKyc,
            isPrimary: false,
            verificationStatus: VerificationStatus.REJECTED,
            rejectionReason: 'Nama rekening tujuan berbeda dari akta perusahaan.',
          } as never);

        const mockTx = {
          brandPayoutAccount: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            findFirst: jest
              .fn()
              .mockResolvedValueOnce(null) // 0 primary accounts remain after rejecting targetKyc
              .mockResolvedValueOnce({ id: 'previous-verified-brand-kyc' }),
            update: jest.fn().mockResolvedValue({}),
          },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: unknown) => {
          return (callback as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await ReviewKycRequest(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(mockTx.brandPayoutAccount.update).toHaveBeenCalledWith({
          where: { id: 'previous-verified-brand-kyc' },
          data: { isPrimary: true },
        });
      });
    });
  });

  describe('Admin Operational Dashboard Module (GET /admin/dashboard)', () => {
    const mockAdminAccount = {
      sub: 'acc-admin-999',
      role: Role.ADMIN,
    };

    const mockAdminProfile = {
      id: 'admin-prof-999',
      accountId: mockAdminAccount.sub,
      fullName: 'Super Administrator',
      status: Status.ACTIVE,
      account: {
        email: 'admin@klipday.com',
        status: Status.ACTIVE,
      },
    };

    it('returns 401 when request is not authenticated', async () => {
      const req = CreateMockRequest({ account: undefined });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await GetAdminDashboardSummary(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: ADMIN_MESSAGES.AUTH_REQUIRED,
        }),
      );
    });

    it('returns 403 when authenticated user is not an administrator', async () => {
      const req = CreateMockRequest({
        account: { sub: 'creator-123', role: Role.CREATOR },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await GetAdminDashboardSummary(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: ADMIN_MESSAGES.ADMIN_ONLY,
        }),
      );
    });

    it('returns 404 when admin profile is not found or soft-deleted', async () => {
      const req = CreateMockRequest({ account: mockAdminAccount });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(null);

      await GetAdminDashboardSummary(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: ADMIN_MESSAGES.ADMIN_ACCOUNT_NOT_FOUND,
        }),
      );
    });

    it('returns 200 with complete aggregated queues, metrics, and prioritized action items', async () => {
      const req = CreateMockRequest({ account: mockAdminAccount });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(mockAdminProfile as never);

      // Moderation counts
      jest
        .spyOn(prisma.campaign, 'count')
        .mockResolvedValueOnce(3) // inReviewCount
        .mockResolvedValueOnce(1) // manualPaymentCount
        .mockResolvedValueOnce(2) // revisionCount
        .mockResolvedValueOnce(5) // activeCampaignsCount
        .mockResolvedValueOnce(4); // finishedCampaignsCount

      // Settlement campaigns
      const mockSettlementCampaigns = [
        {
          id: 'camp-settle-1',
          title: 'Serum Niacinamide Launch',
          campaignCategory: Category.BEAUTY_SKINCARE,
          campaignType: CampaignType.PRODUCT,
          campaignStatus: CampaignStatus.ACTIVE,
          thumbnailUrl: 'https://example.com/serum.jpg',
          cpm: new Prisma.Decimal(25000),
          minViews: 1000,
          maxViews: 50000,
          budget: new Prisma.Decimal(1000000),
          endDate: new Date(Date.now() - 3600000), // Expired
          createdAt: new Date('2026-10-10T10:00:00Z'),
          paymentStatus: PaymentStatus.APPROVED,
          brand: {
            id: 'brand-1',
            companyName: 'PT Brand Glow',
            logoUrl: 'https://example.com/logo.jpg',
          },
          submissions: [
            {
              id: 'sub-1',
              submissionStatus: SubmissionStatus.APPROVED,
              verifiedViews: 20000,
              earnings: new Prisma.Decimal(500000),
            },
          ],
        },
      ];
      jest.spyOn(prisma.campaign, 'findMany').mockImplementation(async (args: unknown) => {
        const query = args as { where?: { campaignStatus?: unknown } };
        if (query?.where?.campaignStatus === CampaignStatus.IN_REVIEW) {
          return [
            {
              id: 'camp-in-review-1',
              title: 'Hoodie Oversize Launch',
              budget: new Prisma.Decimal(5000000),
              campaignStatus: CampaignStatus.IN_REVIEW,
              paymentStatus: PaymentStatus.SUBMITTED,
              createdAt: new Date('2026-10-29T10:00:00Z'),
              brand: {
                companyName: 'Erigo Apparel',
                logoUrl: null,
              },
            },
          ] as never;
        }
        return mockSettlementCampaigns as never;
      });

      // Top up counts and sums
      jest
        .spyOn(prisma.topUpRequest, 'count')
        .mockResolvedValueOnce(2) // submittedCount
        .mockResolvedValueOnce(1); // pendingCount

      jest.spyOn(prisma.topUpRequest, 'aggregate').mockImplementation(async (args: unknown) => {
        const query = args as { where?: { status?: unknown } };
        if (query?.where?.status === PaymentStatus.SUBMITTED) {
          return { _sum: { totalPayable: new Prisma.Decimal(15000000) } } as never;
        }
        return { _sum: { totalPayable: new Prisma.Decimal(25000000) } } as never;
      });

      // Withdrawals counts and sums
      jest
        .spyOn(prisma.payoutRequest, 'count')
        .mockResolvedValueOnce(4) // pendingCount
        .mockResolvedValueOnce(1); // cancellationCount

      jest.spyOn(prisma.payoutRequest, 'aggregate').mockImplementation(async (args: unknown) => {
        const query = args as { where?: { payoutStatus?: unknown } };
        if (query?.where?.payoutStatus === PayoutStatus.PENDING) {
          return { _sum: { amount: new Prisma.Decimal(6450000) } } as never;
        }
        return { _sum: { amount: new Prisma.Decimal(45000000) } } as never;
      });

      // KYC counts
      jest
        .spyOn(prisma.brandPayoutAccount, 'count')
        .mockResolvedValueOnce(3) // pendingCount
        .mockResolvedValueOnce(2) // creator pending
        .mockResolvedValueOnce(1); // brand pending

      // Active campaigns budget aggregate
      jest.spyOn(prisma.campaign, 'aggregate').mockResolvedValue({
        _sum: { budget: new Prisma.Decimal(84500000) },
      } as never);

      // User wallets
      jest.spyOn(prisma.wallet, 'findMany').mockResolvedValue([
        { balance: new Prisma.Decimal(29400000), account: { role: Role.BRAND } },
        { balance: new Prisma.Decimal(12780000), account: { role: Role.CREATOR } },
      ] as never);

      // Total creator rewards paid
      jest.spyOn(prisma.walletTransaction, 'aggregate').mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(118400000) },
      } as never);

      // Total verified views
      jest.spyOn(prisma.submission, 'aggregate').mockResolvedValue({
        _sum: { verifiedViews: 14200000 },
      } as never);

      // Total creators and brands counts
      jest.spyOn(prisma.creator, 'count').mockResolvedValue(312);
      jest.spyOn(prisma.brand, 'count').mockResolvedValue(36);
      jest.spyOn(prisma.creatorSocialAccount, 'count').mockResolvedValue(180);

      // Action items: pending withdrawals with cancellation priority test
      const mockRawWithdrawals = [
        {
          id: 'wd-normal-1',
          referenceCode: 'WD-2610-0001',
          amount: new Prisma.Decimal(1000000),
          accountProvider: 'BCA',
          accountNumber: '1234567890',
          accountHolderName: 'Kreator Satu',
          cancellationRequestedAt: null,
          createdAt: new Date('2026-10-31T01:00:00Z'),
          wallet: {
            account: {
              role: Role.CREATOR,
              brand: null,
              creator: { fullName: 'Kreator Satu', avatarUrl: null },
            },
          },
        },
        {
          id: 'wd-cancel-2',
          referenceCode: 'WD-2610-0002',
          amount: new Prisma.Decimal(2500000),
          accountProvider: 'MANDIRI',
          accountNumber: '9876543210',
          accountHolderName: 'PT Brand Dua',
          cancellationRequestedAt: new Date('2026-10-31T03:00:00Z'), // Cancellation requested!
          createdAt: new Date('2026-10-31T02:00:00Z'),
          wallet: {
            account: {
              role: Role.BRAND,
              brand: { companyName: 'PT Brand Dua', logoUrl: null },
              creator: null,
            },
          },
        },
      ];
      jest.spyOn(prisma.payoutRequest, 'findMany').mockResolvedValue(mockRawWithdrawals as never);

      // Action items: submitted top ups
      const mockRawTopUps = [
        {
          id: 'tu-1',
          referenceCode: 'TU-2610-0001',
          amount: new Prisma.Decimal(10000000),
          totalPayable: new Prisma.Decimal(10000284),
          senderBank: 'BCA',
          senderAccountName: 'PT Brand Glow',
          createdAt: new Date('2026-10-31T04:00:00Z'),
          wallet: {
            account: {
              brand: { companyName: 'PT Brand Glow', logoUrl: null },
            },
          },
        },
      ];
      jest.spyOn(prisma.topUpRequest, 'findMany').mockResolvedValue(mockRawTopUps as never);

      // Action items: pending KYC
      const mockRawKyc = [
        {
          id: 'kyc-1',
          accountType: PayoutAccountType.BANK_TRANSFER,
          provider: 'BCA',
          accountNumber: '5410928811',
          accountHolderName: 'Aulia Rahman', // Exact match
          createdAt: new Date('2026-10-31T05:00:00Z'),
          wallet: {
            account: {
              role: Role.CREATOR,
              brand: null,
              creator: { fullName: 'Aulia Rahman', avatarUrl: null },
            },
          },
        },
        {
          id: 'kyc-2',
          accountType: PayoutAccountType.E_WALLET,
          provider: 'DANA',
          accountNumber: '085719283301',
          accountHolderName: 'Budi Santoso', // Mismatch with Sinta Maharani
          createdAt: new Date('2026-10-31T06:00:00Z'),
          wallet: {
            account: {
              role: Role.CREATOR,
              brand: null,
              creator: { fullName: 'Sinta Maharani', avatarUrl: null },
            },
          },
        },
      ];
      jest.spyOn(prisma.brandPayoutAccount, 'findMany').mockResolvedValue(mockRawKyc as never);

      // Action items: recent transactions
      const mockRawTransactions = [
        {
          id: 'tx-1',
          referenceCode: 'TXN-2610-0001',
          type: WalletTransactionType.BRAND_DEPOSIT,
          amount: new Prisma.Decimal(20000000),
          createdAt: new Date('2026-10-31T07:00:00Z'),
          transactionDate: new Date('2026-10-31T07:00:00Z'),
          wallet: {
            account: {
              role: Role.BRAND,
              brand: { companyName: 'Skintific Official' },
              creator: null,
            },
          },
        },
      ];
      jest.spyOn(prisma.walletTransaction, 'findMany').mockResolvedValue(mockRawTransactions as never);

      await GetAdminDashboardSummary(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      const responseData = jsonMock.mock.calls[0]?.[0]?.data;

      // 1. Admin Info
      expect(responseData.admin.name).toBe('Super Administrator');
      expect(responseData.admin.email).toBe('admin@klipday.com');

      // 2. Queues
      expect(responseData.queues.totalActionableCount).toBe(3 + 1 + 2 + 4 + 3); // 13
      expect(responseData.queues.campaigns.inReviewCount).toBe(3);
      expect(responseData.queues.campaigns.manualPaymentSubmittedCount).toBe(1);
      expect(responseData.queues.campaigns.revisionCount).toBe(2);
      expect(responseData.queues.settlements.expiredCount).toBe(1);
      expect(responseData.queues.settlements.needSettlementCount).toBe(1);
      expect(responseData.queues.topUps.submittedCount).toBe(2);
      expect(responseData.queues.topUps.submittedTotalPayable).toBe(15000000);
      expect(responseData.queues.withdrawals.pendingCount).toBe(4);
      expect(responseData.queues.withdrawals.cancellationRequestedCount).toBe(1);
      expect(responseData.queues.kyc.pendingCount).toBe(3);
      expect(responseData.queues.kyc.pendingCreatorCount).toBe(2);
      expect(responseData.queues.kyc.pendingBrandCount).toBe(1);

      // 3. Platform Metrics
      expect(responseData.metrics.lockedCampaignBudget).toBe(84500000);
      expect(responseData.metrics.activeCampaignsCount).toBe(5);
      expect(responseData.metrics.finishedCampaignsCount).toBe(4);
      expect(responseData.metrics.brandWalletBalance).toBe(29400000);
      expect(responseData.metrics.creatorWalletBalance).toBe(12780000);
      expect(responseData.metrics.totalUserWalletBalance).toBe(42180000);
      expect(responseData.metrics.totalCreatorRewardsPaid).toBe(118400000);
      expect(responseData.metrics.totalApprovedWithdrawalsAmount).toBe(45000000);
      expect(responseData.metrics.totalApprovedTopUpsAmount).toBe(25000000);
      expect(responseData.metrics.totalVerifiedViews).toBe(14200000);
      expect(responseData.metrics.totalCreatorsCount).toBe(312);
      expect(responseData.metrics.totalBrandsCount).toBe(36);
      expect(responseData.metrics.verifiedTikTokCreatorsCount).toBe(180);

      // 4. Action items - Withdrawal Cancellation Priority
      expect(responseData.actionItems.pendingWithdrawals).toHaveLength(2);
      expect(responseData.actionItems.pendingWithdrawals[0].id).toBe('wd-cancel-2'); // Floated to top
      expect(responseData.actionItems.pendingWithdrawals[0].cancellationRequestedAt).not.toBeNull();
      expect(responseData.actionItems.pendingWithdrawals[1].id).toBe('wd-normal-1');

      // 5. Action items - KYC Mismatch Detection
      expect(responseData.actionItems.pendingKycRequests).toHaveLength(2);
      expect(responseData.actionItems.pendingKycRequests[0].isHolderNameMismatch).toBe(false);
      expect(responseData.actionItems.pendingKycRequests[1].isHolderNameMismatch).toBe(true);

      // 6. Action items - Actionable Campaigns
      expect(responseData.actionItems.actionableCampaigns.length).toBeGreaterThan(0);
      expect(responseData.actionItems.actionableCampaigns[0].actionType).toBe('SETTLEMENT');
    });

    it('returns zero metrics when platform has no active data without throwing error', async () => {
      const req = CreateMockRequest({ account: mockAdminAccount });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue(mockAdminProfile as never);
      jest.spyOn(prisma.campaign, 'count').mockResolvedValue(0);
      jest.spyOn(prisma.campaign, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.topUpRequest, 'count').mockResolvedValue(0);
      jest.spyOn(prisma.topUpRequest, 'aggregate').mockResolvedValue({ _sum: { totalPayable: null } } as never);
      jest.spyOn(prisma.payoutRequest, 'count').mockResolvedValue(0);
      jest.spyOn(prisma.payoutRequest, 'aggregate').mockResolvedValue({ _sum: { amount: null } } as never);
      jest.spyOn(prisma.brandPayoutAccount, 'count').mockResolvedValue(0);
      jest.spyOn(prisma.campaign, 'aggregate').mockResolvedValue({ _sum: { budget: null } } as never);
      jest.spyOn(prisma.wallet, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.walletTransaction, 'aggregate').mockResolvedValue({ _sum: { amount: null } } as never);
      jest.spyOn(prisma.submission, 'aggregate').mockResolvedValue({ _sum: { verifiedViews: null } } as never);
      jest.spyOn(prisma.creator, 'count').mockResolvedValue(0);
      jest.spyOn(prisma.brand, 'count').mockResolvedValue(0);
      jest.spyOn(prisma.creatorSocialAccount, 'count').mockResolvedValue(0);
      jest.spyOn(prisma.payoutRequest, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.topUpRequest, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.brandPayoutAccount, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.walletTransaction, 'findMany').mockResolvedValue([]);

      await GetAdminDashboardSummary(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      const data = jsonMock.mock.calls[0]?.[0]?.data;
      expect(data.queues.totalActionableCount).toBe(0);
      expect(data.metrics.lockedCampaignBudget).toBe(0);
      expect(data.metrics.totalUserWalletBalance).toBe(0);
      expect(data.metrics.totalCreatorRewardsPaid).toBe(0);
      expect(data.actionItems.pendingWithdrawals).toEqual([]);
      expect(data.actionItems.submittedTopUps).toEqual([]);
      expect(data.actionItems.pendingKycRequests).toEqual([]);
      expect(data.actionItems.actionableCampaigns).toEqual([]);
      expect(data.actionItems.recentTransactions).toEqual([]);
    });

    describe('CheckHolderNameMismatch helper', () => {
      it('returns false when names match exactly or with case/space differences', () => {
        expect(CheckHolderNameMismatch('Budi Santoso', 'budi santoso')).toBe(false);
        expect(CheckHolderNameMismatch('BUDI SANTOSO', 'Budi Santoso')).toBe(false);
      });

      it('returns false when one name has PT. or CV. prefix', () => {
        expect(CheckHolderNameMismatch('PT. Brand Sejahtera', 'Brand Sejahtera')).toBe(false);
        expect(CheckHolderNameMismatch('CV Kreatif Mandiri', 'Kreatif Mandiri')).toBe(false);
        expect(CheckHolderNameMismatch('Brand Sejahtera', 'PT. Brand Sejahtera')).toBe(false);
      });

      it('returns false when words are reordered or contain middle initials', () => {
        expect(CheckHolderNameMismatch('Santoso Budi', 'Budi Santoso')).toBe(false);
        expect(CheckHolderNameMismatch('Muhammad Rizky Pratama', 'Rizky Pratama')).toBe(false);
      });

      it('returns true when names genuinely mismatch', () => {
        expect(CheckHolderNameMismatch('Budi Santoso', 'Sinta Maharani')).toBe(true);
        expect(CheckHolderNameMismatch('PT Indah Gemilang', 'Erigo Apparel')).toBe(true);
      });

      it('returns false when either name is empty', () => {
        expect(CheckHolderNameMismatch('', 'Budi Santoso')).toBe(false);
        expect(CheckHolderNameMismatch('Budi Santoso', '')).toBe(false);
      });
    });
  });
});




