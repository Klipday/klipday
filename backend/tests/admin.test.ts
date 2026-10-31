import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Prisma } from '../src/generated/prisma/client.js';
import {
  CampaignStatus,
  CampaignType,
  Category,
  PaymentStatus,
  Role,
  Status,
  WalletTransactionType,
} from '../src/generated/prisma/enums.js';
import {
  ADMIN_MESSAGES,
  MODERATION_ACTION,
  MODERATION_FILTER,
  TOPUP_FILTER,
  TOPUP_REVIEW_ACTION,
} from '../src/features/admin/admin.constants.js';
import {
  GetAdminModerationCampaigns,
  GetAdminTopUpRequests,
  ModerateCampaign,
  ReviewBrandTopUpRequest,
} from '../src/features/admin/admin.handlers.js';
import {
  AdminModerateCampaignSchema,
  AdminModerationQuerySchema,
  AdminTopUpQuerySchema,
  ReviewBrandTopUpSchema,
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
});
