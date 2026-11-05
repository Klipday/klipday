import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Prisma } from '../src/generated/prisma/client.js';
import {
  CampaignStatus,
  CronSyncStatus,
  CronTriggerSource,
  Role,
  Status,
  SubmissionStatus,
} from '../src/generated/prisma/enums.js';
import {
  CalculateTargetReward,
  ComputeCampaignFifoAllocations,
} from '../src/features/admin/admin.helper.js';
import {
  CAMPAIGN_SYNC_DECISION,
  CRON_MESSAGES,
  DEFAULT_CRON_TIMEZONE,
  DEFAULT_METRICS_CRON_EXPRESSION,
  SCRAPE_OUTCOME_KIND,
} from '../src/features/cron/cron.constants.js';
import {
  GetCronSchedulerStatus,
  StartAutomatedCronScheduler,
  StopAutomatedCronScheduler,
} from '../src/features/cron/cron.engine.js';
import {
  GetCronStatus,
  TriggerManualMetricsSync,
} from '../src/features/cron/cron.handlers.js';
import {
  AssertCampaignAllocationInvariants,
  ClampSafePgInt,
  EvaluateCampaignSyncEligibility,
  ResolveMonotonicVerifiedViews,
  RunBoundedPool,
  VerifyScrapedVideoOwnership,
} from '../src/features/cron/cron.helper.js';
import {
  FinalSubmitVideo,
  JoinCampaign,
} from '../src/features/submission/submission.handlers.js';
import { SUBMISSION_MESSAGES } from '../src/features/submission/submission.constants.js';
import { prisma } from '../src/utils/prisma.js';
import {
  CreateMockNext,
  CreateMockRequest,
  CreateMockResponse,
} from './helpers/mock-express.js';

describe('12-Hour Automated Metrics & Escrow Calculation Cron Engine', () => {
  describe('1. Exact Reward & FIFO Math Invariants', () => {
    it('calculates target reward with zero IEEE-754 floating-point drift', () => {
      // 1,140 views with Rp 1,000 CPM:
      // Binary64 float (1140 / 1000) * 1000 previously drifted to 1139.9999999999998 -> Math.floor gave 1,139.
      // BigInt Sen-scaled integer division must give exactly 1,140 Rupiah.
      const rewardExact1140 = CalculateTargetReward(1140, 1000, 0, 1000);
      expect(rewardExact1140).toBe(1140);

      const reward570 = CalculateTargetReward(570, 500, 0, 100);
      expect(reward570).toBe(57);
    });

    it('returns zero reward when verified views are below minViews or CPM is zero', () => {
      expect(CalculateTargetReward(999, 1000, 0, 1500)).toBe(0);
      expect(CalculateTargetReward(5000, 1000, 0, 0)).toBe(0);
      expect(CalculateTargetReward(0, 0, 0, 1500)).toBe(0);
    });

    it('respects maxViews threshold when specified', () => {
      // 5,000 views, capped at 3,000 views with Rp 2,000 CPM
      const cappedReward = CalculateTargetReward(5000, 1000, 3000, 2000);
      expect(cappedReward).toBe(6000);
    });

    it('preserves previously locked earnings in Pass 1 and allocates remaining budget FIFO in Pass 2', () => {
      const budget = 10_000;
      const minViews = 1000;
      const maxViews = 0;
      const cpm = 1000;

      // Cycle 1: Sub #1 had 4,000 views (target 4,000), Sub #2 had 6,000 views (target 6,000). Total = 10,000 (budget exhausted).
      // Cycle 2: Sub #1 viral jump to 20,000 views (target 20,000).
      // Sub #2 already locked Rp 6,000 in Cycle 1. Sub #2's 6,000 MUST NOT be clawed back!
      const submissions = [
        { id: 'sub-1', verifiedViews: 20_000, currentEarnings: 4000 },
        { id: 'sub-2', verifiedViews: 6_000, currentEarnings: 6000 },
      ];

      const result = ComputeCampaignFifoAllocations(budget, minViews, maxViews, cpm, submissions);

      expect(result.allocations[0].allocatedEarnings).toBe(4000);
      expect(result.allocations[0].targetEarnings).toBe(20000);
      expect(result.allocations[0].isCappedByBudget).toBe(true);

      expect(result.allocations[1].allocatedEarnings).toBe(6000);
      expect(result.allocations[1].targetEarnings).toBe(6000);
      expect(result.allocations[1].isCappedByBudget).toBe(false);

      expect(result.totalAllocated).toBe(10_000);
      expect(result.remainingRefund).toBe(0);
    });

    it('asserts campaign allocation invariants and catches over-allocation', () => {
      const budget = 10_000;
      const validSummary = {
        allocations: [
          {
            id: 'sub-1',
            verifiedViews: 5000,
            targetEarnings: 5000,
            allocatedEarnings: 5000,
            unpaidShortfall: 0,
            isCappedByBudget: false,
          },
        ],
        totalAllocated: 5000,
        remainingRefund: 5000,
      };

      expect(() => AssertCampaignAllocationInvariants(budget, validSummary, 1)).not.toThrow();

      const invalidSummary = {
        allocations: [
          {
            id: 'sub-1',
            verifiedViews: 5000,
            targetEarnings: 5000,
            allocatedEarnings: 15000,
            unpaidShortfall: 0,
            isCappedByBudget: false,
          },
        ],
        totalAllocated: 15000,
        remainingRefund: 0,
      };

      expect(() => AssertCampaignAllocationInvariants(budget, invalidSummary, 1)).toThrow();
    });
  });

  describe('2. Campaign Sync Eligibility & Lifecycle Freezing', () => {
    it('evaluates active running campaign as eligible for sync', () => {
      const evaluation = EvaluateCampaignSyncEligibility({
        budget: 10_000_000,
        allocatedEarnings: 4_000_000,
        endDate: new Date(Date.now() + 86400000),
        finalSnapshotSyncedAt: null,
        now: new Date(),
        forceSingleCampaign: false,
      });

      expect(evaluation.isEligible).toBe(true);
      expect(evaluation.decision).toBe(CAMPAIGN_SYNC_DECISION.ACTIVE_RUNNING);
      expect(evaluation.shouldStampFinalSnapshot).toBe(false);
    });

    it('skips campaigns that have reached BUDGET_FULL during scheduled runs', () => {
      const evaluation = EvaluateCampaignSyncEligibility({
        budget: 5_000_000,
        allocatedEarnings: 5_000_000,
        endDate: new Date(Date.now() + 86400000),
        finalSnapshotSyncedAt: null,
        now: new Date(),
        forceSingleCampaign: false,
      });

      expect(evaluation.isEligible).toBe(false);
      expect(evaluation.decision).toBe(CAMPAIGN_SYNC_DECISION.SKIP_BUDGET_FULL);
    });

    it('executes one post-expiry final snapshot when endDate has passed', () => {
      const evaluation = EvaluateCampaignSyncEligibility({
        budget: 10_000_000,
        allocatedEarnings: 2_000_000,
        endDate: new Date(Date.now() - 3600000), // Ended 1 hour ago
        finalSnapshotSyncedAt: null,
        now: new Date(),
        forceSingleCampaign: false,
      });

      expect(evaluation.isEligible).toBe(true);
      expect(evaluation.decision).toBe(CAMPAIGN_SYNC_DECISION.POST_EXPIRY_FINAL_SNAPSHOT);
      expect(evaluation.shouldStampFinalSnapshot).toBe(true);
    });

    it('skips expired campaigns that have already been snapshotted', () => {
      const evaluation = EvaluateCampaignSyncEligibility({
        budget: 10_000_000,
        allocatedEarnings: 2_000_000,
        endDate: new Date(Date.now() - 3600000),
        finalSnapshotSyncedAt: new Date(Date.now() - 1800000),
        now: new Date(),
        forceSingleCampaign: false,
      });

      expect(evaluation.isEligible).toBe(false);
      expect(evaluation.decision).toBe(CAMPAIGN_SYNC_DECISION.SKIP_EXPIRED_ALREADY_SNAPSHOTTED);
    });

    it('permits manual force sync even on budget-full or expired campaigns', () => {
      const evaluation = EvaluateCampaignSyncEligibility({
        budget: 10_000_000,
        allocatedEarnings: 10_000_000,
        endDate: new Date(Date.now() - 3600000),
        finalSnapshotSyncedAt: new Date(),
        now: new Date(),
        forceSingleCampaign: true,
      });

      expect(evaluation.isEligible).toBe(true);
      expect(evaluation.decision).toBe(CAMPAIGN_SYNC_DECISION.MANUAL_FORCE_SYNC);
    });
  });

  describe('3. Monotonic Views, Ownership Validation & Concurrency Pool', () => {
    it('maintains monotonic high-water mark if scraped view count dips', () => {
      const result = ResolveMonotonicVerifiedViews(15420, 15410);
      expect(result).toBe(15420);

      const increased = ResolveMonotonicVerifiedViews(15420, 16000);
      expect(increased).toBe(16000);
    });

    it('validates video author ownership against linked social account', () => {
      const linkedAccount = {
        id: 'acc-1',
        username: 'klipcreator',
        platformUserId: 'uid-12345',
        status: Status.ACTIVE,
      };

      // Match by UID
      expect(
        VerifyScrapedVideoOwnership(
          {
            id: 'v-1',
            url: 'https://tiktok.com/@newhandle/video/1',
            authorPlatformUserId: 'uid-12345',
            authorUsername: 'newhandle',
          },
          linkedAccount,
        ),
      ).toBe(true);

      // Match by username fallback
      expect(
        VerifyScrapedVideoOwnership(
          {
            id: 'v-2',
            url: 'https://tiktok.com/@klipcreator/video/2',
            authorPlatformUserId: undefined,
            authorUsername: 'KLIPCREATOR',
          },
          linkedAccount,
        ),
      ).toBe(true);

      // Mismatch
      expect(
        VerifyScrapedVideoOwnership(
          {
            id: 'v-3',
            url: 'https://tiktok.com/@hijacker/video/3',
            authorPlatformUserId: 'uid-99999',
            authorUsername: 'hijacker',
          },
          linkedAccount,
        ),
      ).toBe(false);
    });

    it('processes items through bounded concurrency pool without dropping elements', async () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8];
      const results = await RunBoundedPool(items, 3, async (item) => item * 2);
      expect(results).toEqual([2, 4, 6, 8, 10, 12, 14, 16]);
    });
  });

  describe('4. Scheduler Configuration & Live Status', () => {
    it('returns configured 06:00 and 18:00 WIB schedule and timezone in runtime snapshot', () => {
      const status = GetCronSchedulerStatus();
      expect(status.cronExpression).toBe(DEFAULT_METRICS_CRON_EXPRESSION);
      expect(status.cronExpression).toBe('0 6,18 * * *');
      expect(status.timezone).toBe(DEFAULT_CRON_TIMEZONE);
      expect(status.timezone).toBe('Asia/Jakarta');
      expect(status.isRunning).toBe(false);
    });

    it('skips starting automated timer in test environment', () => {
      const job = StartAutomatedCronScheduler();
      expect(job).toBeNull();
      StopAutomatedCronScheduler();
    });
  });

  describe('5. Admin Cron Endpoints (GET /admin/cron/status & POST /admin/cron/metrics-sync)', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('requires authentication on GET /admin/cron/status (401)', async () => {
      const req = CreateMockRequest({ account: undefined });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await GetCronStatus(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: CRON_MESSAGES.AUTH_REQUIRED }),
      );
    });

    it('blocks non-admin roles on GET /admin/cron/status (403)', async () => {
      const req = CreateMockRequest({
        account: { sub: 'creator-acc', email: 'creator@klipday.com', role: Role.CREATOR },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await GetCronStatus(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: CRON_MESSAGES.ADMIN_ONLY }),
      );
    });

    it('returns live status and recent runs for authenticated ADMIN (200)', async () => {
      const findFirstMock = jest.spyOn(prisma.cronJobLock, 'findFirst').mockResolvedValue(null);
      const findManyMock = jest.spyOn(prisma.cronSyncRun, 'findMany').mockResolvedValue([]);

      const req = CreateMockRequest({
        account: { sub: 'admin-acc', email: 'admin@klipday.com', role: Role.ADMIN },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await GetCronStatus(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            cronExpression: '0 6,18 * * *',
            timezone: 'Asia/Jakarta',
            recentRuns: expect.any(Array),
          }),
        }),
      );

      findFirstMock.mockRestore();
      findManyMock.mockRestore();
    });

    it('validates target campaign on POST /admin/cron/metrics-sync and returns 404 if missing', async () => {
      const findFirstMock = jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(null);

      const req = CreateMockRequest({
        account: { sub: 'admin-acc', email: 'admin@klipday.com', role: Role.ADMIN },
        body: { campaignId: 'c9f0c2e6-7a1b-4f5d-9b8a-3e2c1d0f5e6a' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await TriggerManualMetricsSync(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: CRON_MESSAGES.CAMPAIGN_NOT_FOUND }),
      );

      findFirstMock.mockRestore();
    });
  });

  describe('6. Escrow Entry Gate Defense (JoinCampaign & FinalSubmitVideo)', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('rejects JoinCampaign when remaining campaign escrow is fully allocated (BUDGET_FULL)', async () => {
      const campaignMock = {
        id: 'camp-1',
        budget: new Prisma.Decimal(100_000),
        cpm: new Prisma.Decimal(1000),
        minViews: 1000,
        endDate: new Date(Date.now() + 86400000),
        submissions: [
          { earnings: new Prisma.Decimal(100_000) }, // 100% budget allocated
        ],
      };
      const creatorMock = { id: 'creator-1', accountId: 'creator-acc' };

      const findCampaignMock = jest
        .spyOn(prisma.campaign, 'findFirst')
        .mockResolvedValue(campaignMock as never);
      const findCreatorMock = jest
        .spyOn(prisma.creator, 'findFirst')
        .mockResolvedValue(creatorMock as never);
      const findExistingSubmissionMock = jest
        .spyOn(prisma.submission, 'findFirst')
        .mockResolvedValue(null);

      const req = CreateMockRequest({
        account: { sub: 'creator-acc', email: 'creator@klipday.com', role: Role.CREATOR },
        params: { id: 'camp-1' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await JoinCampaign(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: SUBMISSION_MESSAGES.CAMPAIGN_BUDGET_FULL }),
      );

      findCampaignMock.mockRestore();
      findCreatorMock.mockRestore();
      findExistingSubmissionMock.mockRestore();
    });

    it('rejects FinalSubmitVideo when campaign budget is already 100% allocated', async () => {
      const existingSubMock = {
        id: 'sub-1',
        submissionStatus: SubmissionStatus.JOINED,
        campaign: {
          id: 'camp-1',
          status: Status.ACTIVE,
          campaignStatus: CampaignStatus.ACTIVE,
          budget: new Prisma.Decimal(50_000),
          endDate: new Date(Date.now() + 86400000),
          submissions: [
            { earnings: new Prisma.Decimal(50_000) }, // 100% full
          ],
        },
      };

      const findCreatorMock = jest
        .spyOn(prisma.creator, 'findFirst')
        .mockResolvedValue({ id: 'creator-1' } as never);
      const findExistingSubMock = jest
        .spyOn(prisma.submission, 'findFirst')
        .mockResolvedValue(existingSubMock as never);

      const req = CreateMockRequest({
        account: { sub: 'creator-acc', email: 'creator@klipday.com', role: Role.CREATOR },
        params: { id: 'camp-1' },
        body: {
          liveVideoUrl: 'https://www.tiktok.com/@creator/video/1234567890123456789',
          thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
          videoCaption: 'Klipday campaign video review',
          socialAccountId: '11111111-1111-4111-8111-111111111111',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await FinalSubmitVideo(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: SUBMISSION_MESSAGES.CAMPAIGN_BUDGET_FULL }),
      );

      findCreatorMock.mockRestore();
      findExistingSubMock.mockRestore();
    });
  });
});
