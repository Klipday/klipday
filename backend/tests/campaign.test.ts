import { beforeEach, describe, expect, it, jest } from '@jest/globals';
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
  VerifyCampaignPayment,
} from '../src/features/campaign/campaign.handlers.js';
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
import { prisma } from '../src/utils/prisma.js';
import {
  CreateMockNext,
  CreateMockRequest,
  CreateMockResponse,
} from './helpers/mock-express.js';

describe('Campaign Feature Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  const sampleCompleteCampaign = {
    id: 'camp-123',
    title: 'Awesome Campaign',
    description: 'Campaign description for testing',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    mainMediaUrl: 'https://example.com/video.mp4',
    campaignType: CampaignType.PRODUCT,
    campaignCategory: Category.TECHNOLOGY_GADGETS,
    platform: Platform.TIKTOK,
    cpm: 50000,
    budget: 500000,
    minViews: 1000,
    maxViews: 10000,
    startDate: tomorrow,
    endDate: nextWeek,
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
    });

    describe('SubmitCampaign', () => {
      it('commits draft into AWAITING_PAYMENT and initializes payment with unique code (200)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest
          .spyOn(prisma.campaign, 'findFirst')
          .mockResolvedValue(sampleCompleteCampaign as never);
        jest
          .spyOn(prisma.campaignPayment, 'findFirst')
          .mockResolvedValue(null);
        jest
          .spyOn(prisma.campaignPayment, 'create')
          .mockResolvedValue({ id: 'pay-123', uniqueCode: 123 } as never);
        jest.spyOn(prisma.campaign, 'update').mockResolvedValue({
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.AWAITING_PAYMENT,
        } as never);

        await SubmitCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
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

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(revisedCampaign as never);
        jest.spyOn(prisma.campaignPayment, 'findFirst').mockResolvedValue({
          id: 'pay-approved-1',
          paymentStatus: PaymentStatus.APPROVED,
        } as never);

        const updatedCampaign = {
          ...revisedCampaign,
          campaignStatus: CampaignStatus.IN_REVIEW,
        };
        jest.spyOn(prisma.campaign, 'update').mockResolvedValue(updatedCampaign as never);

        const createPaymentSpy = jest.spyOn(prisma.campaignPayment, 'create');

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
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(sampleCompleteCampaign as never);
        jest.spyOn(prisma.campaignPayment, 'findFirst').mockResolvedValue({
          id: 'pay-rejected-1',
          paymentStatus: PaymentStatus.REJECTED,
          uniqueCode: 111,
        } as never);

        const createPaymentSpy = jest.spyOn(prisma.campaignPayment, 'create').mockResolvedValue({
          id: 'pay-new-2',
          paymentStatus: PaymentStatus.PENDING,
        } as never);

        jest.spyOn(prisma.campaign, 'update').mockResolvedValue({
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.AWAITING_PAYMENT,
        } as never);

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

        jest.spyOn(prisma, '$transaction').mockResolvedValue([
          { id: sampleCompleteCampaign.id, status: Status.DELETED },
          { count: 1 },
          { count: 1 },
          { count: 0 },
        ] as never);

        await DeleteCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: null,
          message: CAMPAIGN_MESSAGES.DELETE_SUCCESS,
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

      it('auto-initializes pending payment record if campaign has budget and no payment record exists (200)', async () => {
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
        const createPaymentSpy = jest.spyOn(prisma.campaignPayment, 'create').mockResolvedValue({
          id: 'pay-auto-1',
          amount: 500000,
          uniqueCode: 199,
          totalPayable: 500199,
          paymentStatus: PaymentStatus.PENDING,
        } as never);

        await GetCampaignPaymentDetails(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(createPaymentSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              campaignId: sampleCompleteCampaign.id,
              amount: 500000,
              paymentStatus: PaymentStatus.PENDING,
            }),
          })
        );
      });

      it('auto-syncs pending payment amount and totalPayable when campaign budget was updated (200)', async () => {
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
        const updatePaymentSpy = jest.spyOn(prisma.campaignPayment, 'update').mockResolvedValue({
          id: 'pay-pending-old',
          amount: 800000,
          uniqueCode: 150,
          totalPayable: 800150,
          paymentStatus: PaymentStatus.PENDING,
        } as never);

        await GetCampaignPaymentDetails(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(updatePaymentSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 'pay-pending-old' },
            data: expect.objectContaining({
              amount: 800000,
              totalPayable: 800150,
            }),
          })
        );
      });
    });
    });

    describe('PayCampaignWithWallet', () => {
      it('deducts wallet balance, marks payment approved, and transitions to IN_REVIEW (200)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockBrand.accountId, role: Role.BRAND },
          params: { id: sampleCompleteCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        const campaignAwaitingPayment = {
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.AWAITING_PAYMENT,
          payments: [{ id: 'pay-1', status: Status.ACTIVE }],
        };

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(campaignAwaitingPayment as never);
        jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue({ id: 'wall-1', balance: 1000000 } as never);

        const updatedCampaign = {
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.IN_REVIEW,
        };

        jest.spyOn(prisma, '$transaction').mockResolvedValue([
          updatedCampaign,
          { id: 'wall-1', balance: 500000 },
          { id: 'txn-1' },
          { id: 'pay-1', paymentStatus: PaymentStatus.APPROVED },
        ] as never);

        await PayCampaignWithWallet(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: updatedCampaign,
          message: CAMPAIGN_MESSAGES.WALLET_PAYMENT_SUCCESS,
        });
      });

      it('rejects wallet payment when balance is insufficient (400)', async () => {
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
        };

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(campaignAwaitingPayment as never);
        jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue({ id: 'wall-1', balance: 200000 } as never);

        await PayCampaignWithWallet(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: CAMPAIGN_MESSAGES.INSUFFICIENT_WALLET_BALANCE,
        });
      });
    });

    describe('ConfirmBankTransferPayment', () => {
      it('saves sender details & receipt proof and transitions to IN_REVIEW (200)', async () => {
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

        const campaignAwaitingPayment = {
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.AWAITING_PAYMENT,
          payments: [{ id: 'pay-1', status: Status.ACTIVE }],
        };

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(campaignAwaitingPayment as never);

        const updatedCampaign = {
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.IN_REVIEW,
        };

        jest.spyOn(prisma, '$transaction').mockResolvedValue([
          updatedCampaign,
          { id: 'pay-1', paymentStatus: PaymentStatus.SUBMITTED },
        ] as never);

        await ConfirmBankTransferPayment(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: updatedCampaign,
          message: CAMPAIGN_MESSAGES.TRANSFER_PAYMENT_SUBMITTED_SUCCESS,
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
          brand: { id: mockBrand.id, accountId: mockBrand.accountId, companyName: mockBrand.companyName },
          payments: [
            {
              id: 'pay-1',
              totalPayable: 500142,
              paymentStatus: PaymentStatus.SUBMITTED,
              status: Status.ACTIVE,
            },
          ],
        };

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(campaignWithSubmittedPayment as never);
        jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue({ id: 'wall-1', balance: 0 } as never);

        const activeCampaign = {
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.ACTIVE,
        };

        jest.spyOn(prisma, '$transaction').mockResolvedValue([
          activeCampaign,
          { id: 'pay-1', paymentStatus: PaymentStatus.APPROVED },
          { id: 'txn-1' },
        ] as never);

        await VerifyCampaignPayment(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
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
          brand: { id: mockBrand.id, accountId: mockBrand.accountId, companyName: mockBrand.companyName },
          payments: [
            {
              id: 'pay-1',
              totalPayable: 500142,
              paymentStatus: PaymentStatus.SUBMITTED,
              status: Status.ACTIVE,
            },
          ],
        };

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(campaignWithSubmittedPayment as never);

        const revertedCampaign = {
          ...sampleCompleteCampaign,
          campaignStatus: CampaignStatus.AWAITING_PAYMENT,
          adminNote: 'Nominal transfer tidak sesuai dengan kode unik.',
        };

        jest.spyOn(prisma, '$transaction').mockResolvedValue([
          revertedCampaign,
          { id: 'pay-1', paymentStatus: PaymentStatus.REJECTED },
        ] as never);

        await VerifyCampaignPayment(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: revertedCampaign,
          message: CAMPAIGN_MESSAGES.PAYMENT_VERIFIED_SUCCESS,
        });
      });
    });
  });
});

