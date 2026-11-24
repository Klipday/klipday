import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Readable } from 'node:stream';
import {
  CAMPAIGN_MESSAGES,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from '../src/features/campaign/campaign.constants.js';
import {
  ConfirmBankTransferPayment,
  DeleteCampaign,
  EditCampaign,
  GetCampaignById,
  GetCampaignPaymentDetails,
  GetCampaigns,
  GetCampaignStatusCounts,
  GetFeaturedCampaigns,
  InitializeCampaign,
  PayCampaignWithWallet,
  SubmitCampaign,
  UploadCampaignThumbnail,
  UploadPaymentProof,
  VerifyCampaignPayment,
} from '../src/features/campaign/campaign.handlers.js';
import { EnrichCampaignEscrowMetrics } from '../src/features/campaign/campaign.helper.js';
import {
  ValidateCampaignDateLogic,
  ValidateCampaignEditBody,
  ValidateCampaignQuery,
  ValidateCampaignRewardLogic,
  ValidateCampaignSubmitCompleteness,
} from '../src/features/campaign/campaign.validators.js';
import {
  CampaignStatus,
  CampaignType,
  Category,
  Industry,
  MaterialType,
  PaymentStatus,
  Platform,
  Role,
  Status,
  WalletTransactionType,
} from '../src/generated/prisma/enums.js';
import { Prisma } from '../src/generated/prisma/client.js';
import { prisma } from '../src/utils/prisma.js';
import {
  CreateMockNext,
  CreateMockRequest,
  CreateMockResponse,
} from './helpers/mock-express.js';

describe('Campaign Feature Module', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  const mockBrand = {
    id: 'brand-test-123',
    accountId: 'acc-brand-123',
    companyName: 'PT Brand Testing',
    industry: Industry.TECHNOLOGY,
    status: Status.ACTIVE,
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const sampleUpdatedAt = new Date('2026-11-18T10:00:00.000Z');

  const sampleCompleteCampaign = {
    id: 'camp-123',
    title: 'Awesome Campaign',
    description: 'Campaign description for testing',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    mainMediaUrl: 'https://example.com/video.mp4',
    campaignType: CampaignType.PRODUCT,
    campaignCategory: Category.TECHNOLOGY_GADGETS,
    platforms: [Platform.TIKTOK],
    maxSubmissionsPerPlatform: 1,
    cpm: 50000,
    budget: 500000,
    minViews: 1000,
    maxViews: 10000,
    startDate: tomorrow,
    endDate: nextWeek,
    updatedAt: sampleUpdatedAt,
    status: Status.ACTIVE,
    campaignStatus: CampaignStatus.DRAFT,
    materials: [
      {
        id: 'mat-1',
        name: 'Logo Video',
        type: MaterialType.VIDEO,
        url: 'https://example.com/mat.mp4',
        status: Status.ACTIVE,
      },
    ],
    brief: {
      id: 'brief-1',
      purpose: 'Brand awareness',
      keyMessage: 'Fast and reliable',
      callToAction: 'Check link in bio',
      status: Status.ACTIVE,
    },
    brand: {
      id: mockBrand.id,
      companyName: mockBrand.companyName,
      industry: mockBrand.industry,
    },
    _count: {
      submissions: 5,
    },
  };

  // ===========================================================================
  // 1. Validation & Logic Unit Tests
  // ===========================================================================
  describe('Validation & Domain Logic Suite', () => {
    describe('ValidateCampaignRewardLogic', () => {
      it('returns error when maxViews is less than minViews', () => {
        const error = ValidateCampaignRewardLogic({
          minViews: 1000,
          maxViews: 500,
        });
        expect(error).toBe(CAMPAIGN_MESSAGES.REWARD_MAX_LESS_THAN_MIN);
      });

      it('returns error when budget is less than CPM', () => {
        const error = ValidateCampaignRewardLogic({
          cpm: 100000,
          budget: 50000,
        });
        expect(error).toBe(CAMPAIGN_MESSAGES.REWARD_BUDGET_LESS_THAN_CPM);
      });

      it('passes when reward parameters are valid', () => {
        const error = ValidateCampaignRewardLogic({
          minViews: 1000,
          maxViews: 5000,
          cpm: 50000,
          budget: 500000,
        });
        expect(error).toBeNull();
      });
    });

    describe('ValidateCampaignDateLogic', () => {
      it('returns error when startDate is in the past', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 2);

        const error = ValidateCampaignDateLogic({
          startDate: yesterday,
          endDate: nextWeek,
        });
        expect(error).toBe(CAMPAIGN_MESSAGES.DATE_START_PAST);
      });

      it('returns error when endDate is before or equal to startDate', () => {
        const error = ValidateCampaignDateLogic({
          startDate: nextWeek,
          endDate: tomorrow,
        });
        expect(error).toBe(CAMPAIGN_MESSAGES.DATE_END_BEFORE_START);
      });

      it('passes when dates are valid future dates with endDate > startDate', () => {
        const error = ValidateCampaignDateLogic({
          startDate: tomorrow,
          endDate: nextWeek,
        });
        expect(error).toBeNull();
      });
    });

    describe('ValidateCampaignSubmitCompleteness', () => {
      it('returns error when Step 1 basic info is incomplete', () => {
        const error = ValidateCampaignSubmitCompleteness({
          ...sampleCompleteCampaign,
          title: '',
        });
        expect(error).toBe(CAMPAIGN_MESSAGES.STEP_1_INCOMPLETE);
      });

      it('returns error when Step 2 materials are missing', () => {
        const error = ValidateCampaignSubmitCompleteness({
          ...sampleCompleteCampaign,
          materials: [],
        });
        expect(error).toBe(CAMPAIGN_MESSAGES.STEP_2_NO_MATERIALS);
      });

      it('returns error when Step 3 brief is missing', () => {
        const error = ValidateCampaignSubmitCompleteness({
          ...sampleCompleteCampaign,
          brief: null,
        });
        expect(error).toBe(CAMPAIGN_MESSAGES.STEP_3_NO_BRIEF);
      });

      it('returns error when Step 4 budget is less than CPM', () => {
        const error = ValidateCampaignSubmitCompleteness({
          ...sampleCompleteCampaign,
          cpm: 100000,
          budget: 50000,
        });
        expect(error).toBe(CAMPAIGN_MESSAGES.STEP_4_INVALID_BUDGET);
      });

      it('passes when all 4 steps are fully completed', () => {
        const error = ValidateCampaignSubmitCompleteness(sampleCompleteCampaign as never);
        expect(error).toBeNull();
      });
    });

    describe('ValidateCampaignQuery', () => {
      it('parses valid query parameters with pagination and filters', () => {
        const result = ValidateCampaignQuery({
          page: '2',
          limit: '20',
          category: Category.TECHNOLOGY_GADGETS,
          sort: 'highest_cpm',
        });
        expect(typeof result).toBe('object');
        if (typeof result === 'object') {
          expect(result.page).toBe(2);
          expect(result.limit).toBe(20);
          expect(result.category).toBe(Category.TECHNOLOGY_GADGETS);
          expect(result.sort).toBe('highest_cpm');
        }
      });

      it('returns error string on invalid sort parameter', () => {
        const result = ValidateCampaignQuery({ sort: 'invalid-sort' });
        expect(typeof result).toBe('string');
      });
    });
  });

  // ===========================================================================
  // 2. Handler Unit Tests
  // ===========================================================================
  describe('Handler Unit Tests', () => {
    describe('InitializeCampaign', () => {
      it('creates empty draft campaign for authenticated brand (201)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.brand, 'findFirst').mockResolvedValue(mockBrand as never);
        jest.spyOn(prisma.campaign, 'create').mockResolvedValue({ id: 'new-camp-1' } as never);

        await InitializeCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(201);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: { id: 'new-camp-1' },
          message: CAMPAIGN_MESSAGES.INITIALIZE_SUCCESS,
        });
      });

      it('rejects non-brand accounts with 403 Forbidden', async () => {
        const req = CreateMockRequest({
          account: { sub: 'creator-acc', role: Role.CREATOR },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        await InitializeCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(403);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.ONLY_BRANDS_CAN_CREATE,
        });
      });
    });

    describe('EditCampaign', () => {
      it('updates campaign fields when request is valid (200)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
          body: { title: 'Updated Title' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest
          .spyOn(prisma.campaign, 'findFirst')
          .mockResolvedValue(sampleCompleteCampaign as never);
        jest
          .spyOn(prisma.campaign, 'update')
          .mockResolvedValue({ ...sampleCompleteCampaign, title: 'Updated Title' } as never);

        await EditCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: expect.objectContaining({ title: 'Updated Title' }),
          message: CAMPAIGN_MESSAGES.UPDATE_SUCCESS,
        });
      });

      it('returns 404 when campaign is not found or not owned by brand', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: 'unknown-id' },
          body: { title: 'Title' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(null);

        await EditCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.CAMPAIGN_NOT_FOUND,
        });
      });

      it('returns 400 when cpm is below minimum Rp 1.000', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
          body: { cpm: 999, budget: 100000 },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest
          .spyOn(prisma.campaign, 'findFirst')
          .mockResolvedValue(sampleCompleteCampaign as never);

        await EditCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.CPM_MIN_VALUE,
        });
      });

      it('returns 400 when reward logic fails (budget < cpm)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
          body: { cpm: 200000, budget: 100000 },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest
          .spyOn(prisma.campaign, 'findFirst')
          .mockResolvedValue(sampleCompleteCampaign as never);

        await EditCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.REWARD_BUDGET_LESS_THAN_CPM,
        });
      });

      it('returns 400 when attempting to update budget or cpm after payment is already APPROVED', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
          body: { budget: 900000 },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        const paidCampaign = {
          ...sampleCompleteCampaign,
          budget: 500000,
          cpm: 50000,
          payments: [
            {
              paymentStatus: PaymentStatus.APPROVED,
            },
          ],
        };

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(paidCampaign as never);

        await EditCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.BUDGET_LOCKED_AFTER_PAYMENT,
        });
      });

      it('allows updating non-financial fields when payment is already APPROVED (200)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
          body: { title: 'Updated Title After Approval' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        const paidCampaign = {
          ...sampleCompleteCampaign,
          budget: 500000,
          cpm: 50000,
          payments: [
            {
              paymentStatus: PaymentStatus.APPROVED,
            },
          ],
        };

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(paidCampaign as never);
        jest.spyOn(prisma.campaign, 'update').mockResolvedValue({
          ...paidCampaign,
          title: 'Updated Title After Approval',
        } as never);

        await EditCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'success',
            data: expect.objectContaining({ title: 'Updated Title After Approval' }),
          })
        );
      });

      it('normalizes blank optional brief text fields from "" to null on Step 3 save (200)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
          body: {
            brief: {
              purpose: 'Meningkatkan awareness produk',
              keyMessage: 'Hemat energi sepanjang hari',
              callToAction: 'Cek keranjang kuning',
              narration: '',
              impression: '',
              requiredCaption: '',
              guidelines: '',
            },
          },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(sampleCompleteCampaign as never);
        const updateSpy = jest
          .spyOn(prisma.campaign, 'update')
          .mockResolvedValue(sampleCompleteCampaign as never);

        await EditCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(updateSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              brief: expect.objectContaining({
                upsert: expect.objectContaining({
                  create: expect.objectContaining({
                    narration: null,
                    impression: null,
                    requiredCaption: null,
                    guidelines: null,
                  }),
                }),
              }),
            }),
          })
        );
      });

      it('rejects javascript: URL schemes in campaign URLs (400)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
          body: { mainMediaUrl: 'javascript:alert(1)' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(sampleCompleteCampaign as never);

        await EditCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.MAIN_MEDIA_URL_INVALID,
        });
      });

      it('returns 400 when editing a campaign whose status is IN_REVIEW or ACTIVE', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
          body: { title: 'Blocked Edit' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue({
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.ACTIVE,
        } as never);

        await EditCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.CANNOT_EDIT_CURRENT_STATUS,
        });
      });

      it('locks budget and cpm edits when manual payment is already SUBMITTED (400)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
          body: { budget: 900000 },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue({
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.AWAITING_PAYMENT,
          payments: [{ id: 'pay-sub-1', paymentStatus: PaymentStatus.SUBMITTED, uniqueCode: 123 }],
        } as never);

        await EditCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.BUDGET_LOCKED_AFTER_PAYMENT,
        });
      });

      it('returns 409 CONFLICT when expectedUpdatedAt is stale from another browser tab', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
          body: {
            title: 'Tab 1 Stale Save',
            expectedUpdatedAt: '2026-11-18T09:50:00.000Z',
          },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(sampleCompleteCampaign as never);

        await EditCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(409);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.CONFLICT_STALE_CAMPAIGN,
        });
      });

      it('syncs PENDING CampaignPayment amount atomically when budget changes in AWAITING_PAYMENT (200)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
          body: {
            budget: 800000,
            expectedUpdatedAt: sampleUpdatedAt.toISOString(),
          },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue({
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.AWAITING_PAYMENT,
          payments: [{ id: 'pay-pending-1', paymentStatus: PaymentStatus.PENDING, uniqueCode: 222 }],
        } as never);

        const mockTx = {
          campaignPayment: { update: jest.fn().mockResolvedValue({}) },
          campaign: {
            update: jest.fn().mockResolvedValue({
              ...sampleCompleteCampaign,
              campaignStatus: CampaignStatus.AWAITING_PAYMENT,
              budget: 800000,
            }),
          },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (cb: unknown) => {
          return (cb as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await EditCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(mockTx.campaignPayment.update).toHaveBeenCalledWith({
          where: { id: 'pay-pending-1' },
          data: {
            amount: 800000,
            uniqueCode: 222,
            totalPayable: 800222,
          },
        });
      });
    });

    describe('SubmitCampaign', () => {
      it('commits draft into AWAITING_PAYMENT and initializes payment with unique code (200)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        const submittedCampaign = {
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.AWAITING_PAYMENT,
        };

        jest
          .spyOn(prisma.campaign, 'findFirst')
          .mockResolvedValueOnce(sampleCompleteCampaign as never)
          .mockResolvedValueOnce(submittedCampaign as never);

        const mockTx = {
          campaignPayment: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ id: 'pay-123', uniqueCode: 123 }),
            update: jest.fn(),
          },
          campaign: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (cb: unknown) => {
          return (cb as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await SubmitCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(mockTx.campaign.updateMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              id: sampleCompleteCampaign.id,
              status: Status.ACTIVE,
              campaignStatus: CampaignStatus.DRAFT,
            },
            data: expect.objectContaining({ campaignStatus: CampaignStatus.AWAITING_PAYMENT }),
          })
        );
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: expect.objectContaining({ campaignStatus: CampaignStatus.AWAITING_PAYMENT }),
          message: CAMPAIGN_MESSAGES.PAYMENT_INITIALIZED_SUCCESS,
        });
      });

      it('transitions revised campaign directly to IN_REVIEW when payment was already APPROVED (200)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        const revisedCampaign = {
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.REVISION,
        };
        const updatedCampaign = {
          ...revisedCampaign,
          campaignStatus: CampaignStatus.IN_REVIEW,
        };

        jest
          .spyOn(prisma.campaign, 'findFirst')
          .mockResolvedValueOnce(revisedCampaign as never)
          .mockResolvedValueOnce(updatedCampaign as never);

        const createPaymentSpy = jest.fn();
        const mockTx = {
          campaignPayment: {
            findFirst: jest.fn().mockResolvedValue({
              id: 'pay-approved-1',
              paymentStatus: PaymentStatus.APPROVED,
            }),
            create: createPaymentSpy,
            update: jest.fn(),
          },
          campaign: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (cb: unknown) => {
          return (cb as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await SubmitCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: expect.objectContaining({ campaignStatus: CampaignStatus.IN_REVIEW }),
          message: CAMPAIGN_MESSAGES.SUBMIT_SUCCESS,
        });
        expect(createPaymentSpy).not.toHaveBeenCalled();
      });

      it('creates new payment record when existing payment was REJECTED (200)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest
          .spyOn(prisma.campaign, 'findFirst')
          .mockResolvedValueOnce(sampleCompleteCampaign as never)
          .mockResolvedValueOnce({
            ...sampleCompleteCampaign,
            campaignStatus: CampaignStatus.AWAITING_PAYMENT,
          } as never);

        const createPaymentSpy = jest.fn().mockResolvedValue({
          id: 'pay-new-2',
          paymentStatus: PaymentStatus.PENDING,
        });

        const mockTx = {
          campaignPayment: {
            findFirst: jest.fn().mockResolvedValue({
              id: 'pay-rejected-1',
              paymentStatus: PaymentStatus.REJECTED,
              uniqueCode: 111,
            }),
            create: createPaymentSpy,
            update: jest.fn(),
          },
          campaign: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (cb: unknown) => {
          return (cb as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await SubmitCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(createPaymentSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              paymentStatus: PaymentStatus.PENDING,
            }),
          })
        );
      });

      it('returns 409 conflict when two tabs submit the same draft simultaneously', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(sampleCompleteCampaign as never);

        const mockTx = {
          campaignPayment: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          campaign: {
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (cb: unknown) => {
          return (cb as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await SubmitCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(409);
        expect(mockTx.campaignPayment.create).not.toHaveBeenCalled();
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.PAYMENT_RACE_CONFLICT,
        });
      });

      it('rejects submission when draft endDate has already passed (400)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        const pastStart = new Date();
        pastStart.setDate(pastStart.getDate() - 5);
        const pastEnd = new Date();
        pastEnd.setDate(pastEnd.getDate() - 1);

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue({
          ...sampleCompleteCampaign,
          startDate: pastStart,
          endDate: pastEnd,
        } as never);

        await SubmitCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.DATE_END_PAST,
        });
      });

      it('rejects submission if campaign is already ACTIVE or IN_REVIEW (400)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue({
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.ACTIVE,
        } as never);

        await SubmitCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.CANNOT_SUBMIT_CURRENT_STATUS,
        });
      });
    });

    describe('GetCampaigns', () => {
      it('returns paginated campaigns list (200)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          query: { page: '1', limit: '10' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest
          .spyOn(prisma, '$transaction')
          .mockResolvedValue([[sampleCompleteCampaign], 1] as never);

        await GetCampaigns(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: {
            items: [sampleCompleteCampaign],
            pagination: {
              page: 1,
              limit: 10,
              total: 1,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false,
            },
          },
          message: CAMPAIGN_MESSAGES.RETRIEVED_SUCCESS,
        });
      });

      it('filters out expired campaigns when browsed by creator (200)', async () => {
        const req = CreateMockRequest({
          account: { sub: 'creator-account-id', role: Role.CREATOR },
          query: { page: '1', limit: '10' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        const transactionSpy = jest
          .spyOn(prisma, '$transaction')
          .mockResolvedValue([[sampleCompleteCampaign], 1] as never);

        await GetCampaigns(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(transactionSpy).toHaveBeenCalled();
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'success',
            message: CAMPAIGN_MESSAGES.RETRIEVED_SUCCESS,
          }),
        );
      });
    });

    describe('GetFeaturedCampaigns', () => {
      it('returns featured campaigns with backfill when count is less than 3 (200)', async () => {
        const req = CreateMockRequest({
          account: { sub: 'user-123', role: Role.CREATOR },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        const featuredOne = { ...sampleCompleteCampaign, isFeatured: true };
        const backfillOne = { ...sampleCompleteCampaign, id: 'camp-backfill-1' };

        jest
          .spyOn(prisma.campaign, 'findMany')
          .mockResolvedValueOnce([featuredOne] as never)
          .mockResolvedValueOnce([backfillOne] as never);

        await GetFeaturedCampaigns(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: [featuredOne, backfillOne],
          message: CAMPAIGN_MESSAGES.FEATURED_RETRIEVED_SUCCESS,
        });
      });
    });

    describe('GetCampaignStatusCounts', () => {
      it('returns aggregated status counts for brand (200)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        const groupedResults = [
          { campaignStatus: CampaignStatus.DRAFT, _count: { _all: 3 } },
          { campaignStatus: CampaignStatus.ACTIVE, _count: { _all: 5 } },
        ];

        jest.spyOn(prisma.campaign, 'groupBy').mockResolvedValue(groupedResults as never);

        await GetCampaignStatusCounts(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: expect.objectContaining({
            [CampaignStatus.DRAFT]: 3,
            [CampaignStatus.ACTIVE]: 5,
            [CampaignStatus.IN_REVIEW]: 0,
          }),
          message: CAMPAIGN_MESSAGES.STATUS_COUNTS_RETRIEVED_SUCCESS,
        });
      });
    });

    describe('GetCampaignById', () => {
      it('returns campaign detail for brand owner (200)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest
          .spyOn(prisma.campaign, 'findFirst')
          .mockResolvedValue(sampleCompleteCampaign as never);

        await GetCampaignById(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: sampleCompleteCampaign,
          message: CAMPAIGN_MESSAGES.DETAIL_RETRIEVED_SUCCESS,
        });
      });

      it('returns 404 when campaign does not exist or is inactive', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: 'non-existent' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(null);

        await GetCampaignById(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.CAMPAIGN_NOT_FOUND,
        });
      });
    });

    describe('DeleteCampaign', () => {
      it('performs atomic cascade soft-delete on campaign and relations (200)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest
          .spyOn(prisma.campaign, 'findFirst')
          .mockResolvedValue({ id: sampleCompleteCampaign.id, campaignStatus: CampaignStatus.DRAFT } as never);

        const mockTx = {
          campaign: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          campaignBrief: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          campaignMaterial: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          submission: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (cb: unknown) => {
          return (cb as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await DeleteCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(mockTx.campaign.updateMany).toHaveBeenCalledWith({
          where: {
            id: sampleCompleteCampaign.id,
            status: Status.ACTIVE,
            campaignStatus: CampaignStatus.DRAFT,
          },
          data: { status: Status.DELETED },
        });
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: null,
          message: CAMPAIGN_MESSAGES.DELETE_SUCCESS,
        });
      });

      it('returns 409 if another tab submitted the draft before delete executes in transaction', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest
          .spyOn(prisma.campaign, 'findFirst')
          .mockResolvedValue({ id: sampleCompleteCampaign.id, campaignStatus: CampaignStatus.DRAFT } as never);

        const mockTx = {
          campaign: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
          campaignBrief: { updateMany: jest.fn() },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (cb: unknown) => {
          return (cb as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await DeleteCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(409);
        expect(mockTx.campaignBrief.updateMany).not.toHaveBeenCalled();
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.ONLY_DRAFT_CAN_BE_DELETED,
        });
      });

      it('prevents brand from deleting non-draft campaigns such as AWAITING_PAYMENT (400)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest
          .spyOn(prisma.campaign, 'findFirst')
          .mockResolvedValue({ id: sampleCompleteCampaign.id, campaignStatus: CampaignStatus.AWAITING_PAYMENT } as never);

        await DeleteCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.ONLY_DRAFT_CAN_BE_DELETED,
        });
      });

      it('returns 404 if campaign is not owned by the brand', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: 'other-brand-campaign' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(null);

        await DeleteCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.CAMPAIGN_NOT_FOUND,
        });
      });
    });

    describe('GetCampaignPaymentDetails', () => {
      it('retrieves payment info, wallet balance, and bank info for owning brand (200)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        const mockCampaignWithPayment = {
          id: sampleCompleteCampaign.id,
          budget: 500000,
          brandId: mockBrand.id,
          brand: { accountId: mockBrand.accountId },
          payments: [
            {
              id: 'pay-1',
              amount: 500000,
              uniqueCode: 142,
              totalPayable: 500142,
              destinationBank: 'BCA',
              destinationAccount: '1234567890',
              paymentStatus: PaymentStatus.PENDING,
            },
          ],
        };

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(mockCampaignWithPayment as never);
        jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue({ balance: 1000000 } as never);

        await GetCampaignPaymentDetails(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'success',
            data: expect.objectContaining({
              walletBalance: 1000000,
              budget: 500000,
              canPayWithWallet: true,
              payment: expect.objectContaining({ uniqueCode: 142, totalPayable: 500142 }),
            }),
          })
        );
      });

      it('stays strictly read-only on GET when campaign has no payment record yet (200)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        const mockCampaignWithoutPayment = {
          id: sampleCompleteCampaign.id,
          budget: 500000,
          brandId: mockBrand.id,
          brand: { accountId: mockBrand.accountId },
          payments: [],
        };

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(mockCampaignWithoutPayment as never);
        jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue({ balance: 0 } as never);
        const createPaymentSpy = jest.spyOn(prisma.campaignPayment, 'create');

        await GetCampaignPaymentDetails(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(createPaymentSpy).not.toHaveBeenCalled();
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'success',
            data: expect.objectContaining({
              payment: null,
              budget: 500000,
            }),
          })
        );
      });

      it('computes read-only preview totalPayable when PENDING payment lags budget without mutating DB (200)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        const mockCampaignWithOldPayment = {
          id: sampleCompleteCampaign.id,
          budget: 800000,
          brandId: mockBrand.id,
          brand: { accountId: mockBrand.accountId },
          payments: [
            {
              id: 'pay-pending-old',
              amount: 500000,
              uniqueCode: 150,
              totalPayable: 500150,
              destinationBank: 'BCA',
              destinationAccount: '1234567890',
              paymentStatus: PaymentStatus.PENDING,
            },
          ],
        };

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(mockCampaignWithOldPayment as never);
        jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue({ balance: 0 } as never);
        const updatePaymentSpy = jest.spyOn(prisma.campaignPayment, 'update');

        await GetCampaignPaymentDetails(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(updatePaymentSpy).not.toHaveBeenCalled();
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'success',
            data: expect.objectContaining({
              budget: 800000,
              payment: expect.objectContaining({
                id: 'pay-pending-old',
                amount: 800000,
                totalPayable: 800150,
              }),
            }),
          })
        );
      });
    });
    });

    describe('PayCampaignWithWallet', () => {
      it('deducts wallet balance atomically, marks payment approved, and transitions to IN_REVIEW (200)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
          body: { expectedBudget: 500000 },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        const campaignAwaitingPayment = {
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.AWAITING_PAYMENT,
          payments: [{ id: 'pay-1', paymentStatus: PaymentStatus.PENDING }],
        };
        const updatedCampaign = {
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.IN_REVIEW,
        };

        jest
          .spyOn(prisma.campaign, 'findFirst')
          .mockResolvedValueOnce(campaignAwaitingPayment as never)
          .mockResolvedValueOnce(updatedCampaign as never);
        jest
          .spyOn(prisma.wallet, 'findFirst')
          .mockResolvedValueOnce({ id: 'wall-1', balance: 1000000 } as never);

        const mockTx = {
          campaign: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          wallet: {
            updateManyAndReturn: jest.fn().mockResolvedValue([{ id: 'wall-1', balance: 500000 }]),
          },
          walletTransaction: { create: jest.fn().mockResolvedValue({ id: 'txn-1' }) },
          campaignPayment: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (cb: unknown) => {
          return (cb as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await PayCampaignWithWallet(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(mockTx.wallet.updateManyAndReturn).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ accountId: mockBrand.accountId, status: Status.ACTIVE }),
          })
        );
        expect(mockTx.walletTransaction.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              balanceBefore: 1000000,
              balanceAfter: 500000,
              amount: 500000,
            }),
          })
        );
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: updatedCampaign,
          message: CAMPAIGN_MESSAGES.WALLET_PAYMENT_SUCCESS,
        });
      });

      it('rejects wallet payment fast when balance is insufficient without opening transaction (400)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        const campaignAwaitingPayment = {
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.AWAITING_PAYMENT,
          budget: 500000,
          payments: [],
        };

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValueOnce(campaignAwaitingPayment as never);
        jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValueOnce({ id: 'wall-1', balance: 200000 } as never);
        const txSpy = jest.spyOn(prisma, '$transaction');

        await PayCampaignWithWallet(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(txSpy).not.toHaveBeenCalled();
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.INSUFFICIENT_WALLET_BALANCE,
        });
      });

      it('returns 409 PAYMENT_AMOUNT_STALE when expectedBudget disagrees with current campaign budget', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
          body: { expectedBudget: 500000 },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValueOnce({
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.AWAITING_PAYMENT,
          budget: 800000,
          payments: [],
        } as never);
        jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValueOnce({ id: 'wall-1', balance: 2000000 } as never);
        const txSpy = jest.spyOn(prisma, '$transaction');

        await PayCampaignWithWallet(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(409);
        expect(txSpy).not.toHaveBeenCalled();
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.PAYMENT_AMOUNT_STALE,
        });
      });

      it('returns 409 PAYMENT_RACE_CONFLICT when two tabs attempt to pay same campaign simultaneously', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValueOnce({
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.AWAITING_PAYMENT,
          budget: 500000,
          payments: [],
        } as never);
        jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValueOnce({ id: 'wall-1', balance: 1000000 } as never);

        const mockTx = {
          campaign: {
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          wallet: {
            updateManyAndReturn: jest.fn(),
          },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (cb: unknown) => {
          return (cb as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await PayCampaignWithWallet(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(409);
        expect(mockTx.wallet.updateManyAndReturn).not.toHaveBeenCalled();
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.PAYMENT_RACE_CONFLICT,
        });
      });

      it('aborts with 400 when concurrent wallet debit leaves insufficient balance in SQL guard', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValueOnce({
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.AWAITING_PAYMENT,
          budget: 500000,
          payments: [],
        } as never);
        jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValueOnce({ id: 'wall-1', balance: 500000 } as never);

        const mockTx = {
          campaign: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          wallet: {
            updateManyAndReturn: jest.fn().mockResolvedValue([]),
          },
          walletTransaction: { create: jest.fn() },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (cb: unknown) => {
          return (cb as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await PayCampaignWithWallet(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(mockTx.walletTransaction.create).not.toHaveBeenCalled();
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.INSUFFICIENT_WALLET_BALANCE,
        });
      });
    });

    describe('ConfirmBankTransferPayment', () => {
      it('saves sender details & receipt proof atomically and transitions to IN_REVIEW (200)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
          body: {
            senderProviderName: 'BCA',
            senderAccountName: 'Budi Santoso',
            transferProofUrl: 'https://example.com/receipt.jpg',
            expectedBudget: 500000,
            expectedTotalPayable: 500142,
          },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        const campaignAwaitingPayment = {
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.AWAITING_PAYMENT,
          payments: [{ id: 'pay-1', uniqueCode: 142, status: Status.ACTIVE }],
        };
        const updatedCampaign = {
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.IN_REVIEW,
        };

        jest
          .spyOn(prisma.campaign, 'findFirst')
          .mockResolvedValueOnce(campaignAwaitingPayment as never)
          .mockResolvedValueOnce(updatedCampaign as never);

        const mockTx = {
          campaign: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          campaignPayment: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (cb: unknown) => {
          return (cb as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await ConfirmBankTransferPayment(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: updatedCampaign,
          message: CAMPAIGN_MESSAGES.TRANSFER_PAYMENT_SUBMITTED_SUCCESS,
        });
      });

      it('returns 409 when expectedTotalPayable is stale relative to current campaign budget', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
          body: {
            senderProviderName: 'BCA',
            senderAccountName: 'Budi Santoso',
            transferProofUrl: 'https://example.com/receipt.jpg',
            expectedBudget: 500000,
            expectedTotalPayable: 500142,
          },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValueOnce({
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.AWAITING_PAYMENT,
          budget: 750000,
          payments: [{ id: 'pay-1', uniqueCode: 142, status: Status.ACTIVE }],
        } as never);
        const txSpy = jest.spyOn(prisma, '$transaction');

        await ConfirmBankTransferPayment(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(409);
        expect(txSpy).not.toHaveBeenCalled();
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.PAYMENT_AMOUNT_STALE,
        });
      });

      it('returns 409 when another tab concurrently submits or pays the same campaign', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
          body: {
            senderProviderName: 'BCA',
            senderAccountName: 'Budi Santoso',
            transferProofUrl: 'https://example.com/receipt.jpg',
          },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValueOnce({
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.AWAITING_PAYMENT,
          payments: [{ id: 'pay-1', uniqueCode: 142, status: Status.ACTIVE }],
        } as never);

        const mockTx = {
          campaign: {
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          campaignPayment: { updateMany: jest.fn() },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (cb: unknown) => {
          return (cb as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await ConfirmBankTransferPayment(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(409);
        expect(mockTx.campaignPayment.updateMany).not.toHaveBeenCalled();
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.PAYMENT_RACE_CONFLICT,
        });
      });
    });

    describe('VerifyCampaignPayment', () => {
      it('approves submitted payment, sets campaign ACTIVE, and logs wallet transaction (200)', async () => {
        const req = CreateMockRequest({
          account: { sub: 'acc-admin-1', role: Role.ADMIN },
          params: { id: sampleCompleteCampaign.id },
          body: { action: 'APPROVE' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue({ id: 'admin-1' } as never);

        const campaignWithSubmittedPayment = {
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.IN_REVIEW,
          brand: { id: mockBrand.id, accountId: mockBrand.accountId, companyName: mockBrand.companyName },
          payments: [
            {
              id: 'pay-1',
              amount: 500000,
              totalPayable: 500142,
              paymentStatus: PaymentStatus.SUBMITTED,
              status: Status.ACTIVE,
            },
          ],
        };
        const activeCampaign = {
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.ACTIVE,
        };

        jest
          .spyOn(prisma.campaign, 'findFirst')
          .mockResolvedValueOnce(campaignWithSubmittedPayment as never)
          .mockResolvedValueOnce(activeCampaign as never);
        jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValueOnce({ id: 'wall-1', balance: 0 } as never);

        const mockTx = {
          campaign: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          campaignPayment: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          wallet: { update: jest.fn().mockResolvedValue({ id: 'wall-1', balance: new Prisma.Decimal(142) }) },
          walletTransaction: { create: jest.fn().mockResolvedValue({ id: 'txn-1' }) },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (cb: unknown) => {
          return (cb as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await VerifyCampaignPayment(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(mockTx.wallet.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 'wall-1' },
            data: { balance: { increment: new Prisma.Decimal(142) } },
          }),
        );
        expect(mockTx.walletTransaction.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              type: WalletTransactionType.CAMPAIGN_PAYMENT,
              amount: new Prisma.Decimal(500000),
            }),
          }),
        );
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: activeCampaign,
          message: CAMPAIGN_MESSAGES.PAYMENT_VERIFIED_SUCCESS,
        });
      });

      it('rejects submitted payment, sets campaign AWAITING_PAYMENT with rejectionReason (200)', async () => {
        const req = CreateMockRequest({
          account: { sub: 'acc-admin-1', role: Role.ADMIN },
          params: { id: sampleCompleteCampaign.id },
          body: { action: 'REJECT', rejectionReason: 'Nominal transfer tidak sesuai dengan kode unik.' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue({ id: 'admin-1' } as never);

        const campaignWithSubmittedPayment = {
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.IN_REVIEW,
          brand: { id: mockBrand.id, accountId: mockBrand.accountId, companyName: mockBrand.companyName },
          payments: [
            {
              id: 'pay-1',
              amount: 500000,
              totalPayable: 500142,
              paymentStatus: PaymentStatus.SUBMITTED,
              status: Status.ACTIVE,
            },
          ],
        };
        const revertedCampaign = {
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.AWAITING_PAYMENT,
          adminNote: 'Nominal transfer tidak sesuai dengan kode unik.',
        };

        jest
          .spyOn(prisma.campaign, 'findFirst')
          .mockResolvedValueOnce(campaignWithSubmittedPayment as never)
          .mockResolvedValueOnce(revertedCampaign as never);

        const mockTx = {
          campaign: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          campaignPayment: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        };

        jest.spyOn(prisma, '$transaction').mockImplementation(async (cb: unknown) => {
          return (cb as (tx: unknown) => Promise<unknown>)(mockTx);
        });

        await VerifyCampaignPayment(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: revertedCampaign,
          message: CAMPAIGN_MESSAGES.PAYMENT_VERIFIED_SUCCESS,
        });
      });

      it('returns 409 when payment amount disagrees with campaign budget during verification', async () => {
        const req = CreateMockRequest({
          account: { sub: 'acc-admin-1', role: Role.ADMIN },
          params: { id: sampleCompleteCampaign.id },
          body: { action: 'APPROVE' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.admin, 'findFirst').mockResolvedValue({ id: 'admin-1' } as never);

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValueOnce({
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.IN_REVIEW,
          budget: 800000,
          brand: { accountId: mockBrand.accountId },
          payments: [
            {
              id: 'pay-1',
              amount: 500000,
              totalPayable: 500142,
              paymentStatus: PaymentStatus.SUBMITTED,
            },
          ],
        } as never);
        const txSpy = jest.spyOn(prisma, '$transaction');

        await VerifyCampaignPayment(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(409);
        expect(txSpy).not.toHaveBeenCalled();
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.PAYMENT_AMOUNT_STALE,
        });
      });
    });

    describe('UploadCampaignThumbnail & UploadPaymentProof Security Guards', () => {
      it('rejects thumbnail upload when campaign is ACTIVE (400)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
          headers: { 'content-type': 'image/png', 'content-length': '64' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue({
          id: sampleCompleteCampaign.id,
          campaignStatus: CampaignStatus.ACTIVE,
        } as never);

        await UploadCampaignThumbnail(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.CANNOT_UPLOAD_IN_CURRENT_STATUS,
        });
      });

      it('rejects spoofed HTML payload disguised as image/png via magic-byte check (400)', async () => {
        process.env.SUPABASE_URL = 'https://test.supabase.co';
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

        const htmlBytes = Buffer.from('<html><script>alert(1)</script></html>');
        const streamReq = Readable.from([htmlBytes]) as unknown as Parameters<typeof UploadCampaignThumbnail>[0];
        streamReq.account = { sub: mockBrand.accountId, role: Role.BRAND };
        streamReq.params = { id: sampleCompleteCampaign.id };
        streamReq.headers = {
          'content-type': 'image/png',
          'content-length': String(htmlBytes.byteLength),
        };

        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue({
          id: sampleCompleteCampaign.id,
          campaignStatus: CampaignStatus.DRAFT,
        } as never);

        globalThis.fetch = (async (_input: unknown, init?: RequestInit) => {
          const reader = (init?.body as ReadableStream<Uint8Array>).getReader();
          while (true) {
            const { done } = await reader.read();
            if (done) break;
          }
          return new Response('ok', { status: 200 });
        }) as typeof fetch;

        await UploadCampaignThumbnail(streamReq, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.INVALID_IMAGE_SIGNATURE,
        });
      });

      it('rejects payment proof upload when campaign is not AWAITING_PAYMENT (400)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
          headers: { 'content-type': 'image/jpeg', 'content-length': '64' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue({
          id: sampleCompleteCampaign.id,
          campaignStatus: CampaignStatus.DRAFT,
        } as never);

        await UploadPaymentProof(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.CAMPAIGN_NOT_AWAITING_PAYMENT,
        });
      });
    });
  });

  describe('EnrichCampaignEscrowMetrics Helper', () => {
    it('returns campaign untouched if submissions relation is not present', () => {
      const campaign = { id: 'c-1', budget: 1000000 };
      const enriched = EnrichCampaignEscrowMetrics(campaign);
      expect(enriched).toEqual(campaign);
      expect(enriched.allocatedBudget).toBeUndefined();
    });

    it('calculates allocatedBudget and remainingBudget from approved/verified submission earnings', () => {
      const campaign = {
        id: 'c-1',
        budget: 1000000,
        submissions: [
          { earnings: 250000 },
          { earnings: 150000 },
        ],
      };
      const enriched = EnrichCampaignEscrowMetrics(campaign);
      expect(enriched.allocatedBudget).toBe(400000);
      expect(enriched.remainingBudget).toBe(600000);
      expect('submissions' in enriched).toBe(false);
    });

    it('caps remainingBudget at 0 when allocatedBudget exceeds budget', () => {
      const campaign = {
        id: 'c-1',
        budget: 500000,
        submissions: [
          { earnings: 600000 },
        ],
      };
      const enriched = EnrichCampaignEscrowMetrics(campaign);
      expect(enriched.allocatedBudget).toBe(600000);
      expect(enriched.remainingBudget).toBe(0);
    });

    it('handles empty submissions array correctly', () => {
      const campaign = {
        id: 'c-1',
        budget: 500000,
        submissions: [],
      };
      const enriched = EnrichCampaignEscrowMetrics(campaign);
      expect(enriched.allocatedBudget).toBe(0);
      expect(enriched.remainingBudget).toBe(500000);
    });
  });
});

