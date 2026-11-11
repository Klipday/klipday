import { randomUUID } from 'node:crypto';
import { Cron } from 'croner';
import type { Prisma } from '../../generated/prisma/client.js';
import {
  CampaignStatus,
  CronSyncStatus,
  CronTriggerSource,
  Status,
  SubmissionStatus,
} from '../../generated/prisma/enums.js';
import {
  GetTikTokVideoDetails,
  ScrapeCreatorsApiError,
  ValidateTikTokVideoUrl,
} from '../../services/scrape-creators.js';
import { prisma } from '../../utils/prisma.js';
import { FIFO_SUBMISSION_ORDER_BY } from '../admin/admin.constants.js';
import { ComputeCampaignFifoAllocations } from '../admin/admin.helper.js';
import type { FifoSubmissionAllocationInput } from '../admin/admin.types.js';
import {
  CRON_ELIGIBLE_CAMPAIGN_SELECT,
  CRON_JOB_NAME,
  CRON_MESSAGES,
  CRON_SYNC_RUN_SELECT,
  DEFAULT_CRON_TIMEZONE,
  DEFAULT_METRICS_CRON_EXPRESSION,
  DEFAULT_SCRAPE_CONCURRENCY,
  INTER_REQUEST_PACING_MS,
  LOCK_LEASE_DURATION_MS,
  MAX_SCRAPE_RETRIES,
  METRICS_SYNC_LOCK_KEY,
  RETRY_BASE_DELAY_MS,
  SCRAPE_OUTCOME_KIND,
  SCRAPE_REQUEST_TIMEOUT_MS,
} from './cron.constants.js';
import {
  AssertCampaignAllocationInvariants,
  ClampSafePgInt,
  EvaluateCampaignSyncEligibility,
  MapCronSyncRunToDto,
  ResolveMonotonicVerifiedViews,
  RunBoundedPool,
  SleepMs,
  VerifyScrapedVideoOwnership,
} from './cron.helper.js';
import type {
  CampaignEligibilityInput,
  CommitCampaignResult,
  CronEligibleCampaignFromDb,
  ExecuteMetricsSyncOptions,
  ExecuteMetricsSyncResult,
  ScrapedSubmissionOutcome,
  ScrapeRetryConfig,
  SubmissionScrapeTarget,
} from './cron.types.js';

interface EligibleCampaignPlan {
  campaignId: string;
  shouldStampFinalSnapshot: boolean;
}

interface PreparedSubmissionDraft {
  id: string;
  existingViews: number;
  existingEarnings: number;
  existingStreak: number;
  existingError: string | null;
  nextViews: number;
  nextStreak: number;
  nextError: string | null;
  didSyncViews: boolean;
}

export interface SchedulerRuntimeSnapshot {
  isEnabled: boolean;
  isRunning: boolean;
  isBusy: boolean;
  cronExpression: string;
  timezone: string;
  nextRunAt: Date | null;
  previousRunAt: Date | null;
}

let activeCronJob: Cron | null = null;

/**
 * Resolves the configured cron schedule expression from environment variables or defaults to `0 6,18 * * *`.
 *
 * @returns Cron expression string.
 */
function ResolveCronExpression(): string {
  const configured = process.env.CRON_METRICS_SCHEDULE?.trim();
  const expression = configured && configured !== '' ? configured : DEFAULT_METRICS_CRON_EXPRESSION;
  return expression;
}

/**
 * Resolves the configured scheduler timezone from environment variables or defaults to `Asia/Jakarta`.
 *
 * @returns IANA timezone identifier.
 */
function ResolveCronTimezone(): string {
  const configured = process.env.CRON_TIMEZONE?.trim();
  const timezone = configured && configured !== '' ? configured : DEFAULT_CRON_TIMEZONE;
  return timezone;
}

/**
 * Determines whether the background automated cron scheduler is enabled in the current environment.
 *
 * @returns True if background scheduling is enabled.
 */
function IsAutomatedCronEnabled(): boolean {
  if (process.env.CRON_ENABLED === 'false') {
    return false;
  }

  return true;
}

/**
 * Persists an internal background cron failure to the Prisma `ErrorLog` table without throwing.
 *
 * @param message - Error summary message.
 * @param err - Caught exception object.
 * @param metadata - Contextual telemetry payload.
 * @returns Promise resolving when error logging finishes or safely swallows DB logging errors.
 */
async function RecordCronErrorLog(
  message: string,
  err: unknown,
  metadata: Record<string, unknown>,
): Promise<void> {
  const stackTrace = err instanceof Error ? (err.stack ?? null) : null;
  const errorLogPayload = {
    data: {
      statusCode: 500,
      message,
      stackTrace,
      endpoint: `CRON ${METRICS_SYNC_LOCK_KEY}`,
      accountId: null,
      metadata: metadata as Prisma.InputJsonValue,
    },
  };

  try {
    await prisma.errorLog.create(errorLogPayload);
  } catch (logErr) {
    console.error('[CronScheduler] Failed to persist ErrorLog entry:', logErr);
  }
}

/**
 * Acquires a pooler-safe distributed lease lock in `CronJobLock` without PostgreSQL session advisory locks.
 * Claims expired leases atomically via `updateMany`, falling back to unique `create` (`P2002` safe).
 *
 * @param lockKey - Unique job lock identifier.
 * @param lockedBy - Worker instance token (`pid-uuid`).
 * @param now - Current reference timestamp.
 * @param leaseDurationMs - Lease TTL in milliseconds before crash recovery is permitted.
 * @returns True if the caller now owns the active lease lock, false if another run is currently active.
 */
async function AcquireCronJobLock(
  lockKey: string,
  lockedBy: string,
  now: Date,
  leaseDurationMs = LOCK_LEASE_DURATION_MS,
): Promise<boolean> {
  const expiresAt = new Date(now.getTime() + leaseDurationMs);
  const reclaimQuery = {
    where: {
      lockKey,
      lockedUntil: {
        lte: now,
      },
    },
    data: {
      lockedBy,
      lockedAt: now,
      lockedUntil: expiresAt,
    },
  };

  const reclaimed = await prisma.cronJobLock.updateMany(reclaimQuery);
  if (reclaimed.count > 0) {
    return true;
  }

  const createPayload = {
    data: {
      lockKey,
      lockedBy,
      lockedAt: now,
      lockedUntil: expiresAt,
    },
  };

  try {
    await prisma.cronJobLock.create(createPayload);
    return true;
  } catch (err) {
    const errorCode =
      typeof err === 'object' && err !== null && 'code' in err
        ? (err as { code?: unknown }).code
        : undefined;
    if (errorCode === 'P2002') {
      return false;
    }
    throw err;
  }
}

/**
 * Extends the lease expiration timestamp for a currently owned `CronJobLock`.
 *
 * @param lockKey - Unique job lock identifier.
 * @param lockedBy - Worker instance token that acquired the lock.
 * @param now - Current reference timestamp.
 * @param leaseDurationMs - Lease extension duration in milliseconds.
 * @returns Promise resolving when the lease has been refreshed.
 */
async function RefreshCronJobLock(
  lockKey: string,
  lockedBy: string,
  now: Date,
  leaseDurationMs = LOCK_LEASE_DURATION_MS,
): Promise<void> {
  const expiresAt = new Date(now.getTime() + leaseDurationMs);
  const refreshQuery = {
    where: {
      lockKey,
      lockedBy,
    },
    data: {
      lockedUntil: expiresAt,
    },
  };

  await prisma.cronJobLock.updateMany(refreshQuery);
}

/**
 * Releases a held `CronJobLock` only if still owned by the calling `lockedBy` worker token,
 * ensuring a slow worker whose lease expired never unlocks a newer worker.
 *
 * @param lockKey - Unique job lock identifier.
 * @param lockedBy - Worker instance token that acquired the lock.
 * @returns Promise resolving once the lock release attempt completes.
 */
async function ReleaseCronJobLock(lockKey: string, lockedBy: string): Promise<void> {
  const expiredEpoch = new Date(0);
  const releaseQuery = {
    where: {
      lockKey,
      lockedBy,
    },
    data: {
      lockedUntil: expiredEpoch,
    },
  };

  try {
    await prisma.cronJobLock.updateMany(releaseQuery);
  } catch (err) {
    console.error('[CronScheduler] Failed to release CronJobLock:', err);
  }
}

/**
 * Stage 1 Worker: Scrapes live TikTok view counts for a single submission outside any Prisma transaction.
 * Retries transient 429/5xx/network timeouts with exponential backoff, immediately flags deleted/private
 * videos without wasting retries, and validates creator account ownership against URL hijacking.
 *
 * @param target - Submission scrape target containing URL and linked social account snapshot.
 * @param config - Timeout, retry, and inter-request pacing configuration.
 * @returns Structured outcome indicating either `SUCCESS` with clamped views or freeze-and-flag diagnostics.
 */
async function ScrapeSubmissionMetricsWithRetry(
  target: SubmissionScrapeTarget,
  config: ScrapeRetryConfig,
): Promise<ScrapedSubmissionOutcome> {
  const rawUrl = target.liveVideoUrl?.trim() ?? '';
  if (rawUrl === '') {
    const missingUrlOutcome: ScrapedSubmissionOutcome = {
      submissionId: target.id,
      kind: SCRAPE_OUTCOME_KIND.VIDEO_UNAVAILABLE,
      errorMessage: CRON_MESSAGES.SYNC_ERR_MISSING_VIDEO_URL,
    };
    return missingUrlOutcome;
  }

  let validatedUrl: string;
  try {
    validatedUrl = ValidateTikTokVideoUrl(rawUrl);
  } catch {
    const invalidUrlOutcome: ScrapedSubmissionOutcome = {
      submissionId: target.id,
      kind: SCRAPE_OUTCOME_KIND.VIDEO_UNAVAILABLE,
      errorMessage: CRON_MESSAGES.SYNC_ERR_VIDEO_UNAVAILABLE,
    };
    return invalidUrlOutcome;
  }

  for (let attempt = 0; attempt <= config.maxRetries; attempt += 1) {
    try {
      const requestOptions = { timeoutMs: config.timeoutMs };
      const videoDetails = await GetTikTokVideoDetails(validatedUrl, requestOptions);

      if (config.interRequestPacingMs > 0) {
        await SleepMs(config.interRequestPacingMs);
      }

      const isOwnerValid = VerifyScrapedVideoOwnership(videoDetails, target.socialAccount);
      if (!isOwnerValid) {
        const mismatchOutcome: ScrapedSubmissionOutcome = {
          submissionId: target.id,
          kind: SCRAPE_OUTCOME_KIND.OWNERSHIP_MISMATCH,
          errorMessage: CRON_MESSAGES.SYNC_ERR_OWNERSHIP_MISMATCH,
        };
        return mismatchOutcome;
      }

      const scrapedViews = ClampSafePgInt(videoDetails.viewCount ?? 0);
      const successOutcome: ScrapedSubmissionOutcome = {
        submissionId: target.id,
        kind: SCRAPE_OUTCOME_KIND.SUCCESS,
        scrapedViews,
      };
      return successOutcome;
    } catch (err) {
      if (err instanceof ScrapeCreatorsApiError) {
        if (err.isVideoUnavailable) {
          const unavailableOutcome: ScrapedSubmissionOutcome = {
            submissionId: target.id,
            kind: SCRAPE_OUTCOME_KIND.VIDEO_UNAVAILABLE,
            errorMessage: CRON_MESSAGES.SYNC_ERR_VIDEO_UNAVAILABLE,
          };
          return unavailableOutcome;
        }

        const canRetry = err.isRetryable && attempt < config.maxRetries;
        if (canRetry) {
          const backoffMs = config.retryBaseDelayMs * Math.pow(2, attempt);
          await SleepMs(backoffMs);
          continue;
        }

        const fallbackMessage = err.isRetryable
          ? CRON_MESSAGES.SYNC_ERR_TRANSIENT_UNAVAILABLE
          : CRON_MESSAGES.SYNC_ERR_SCRAPER_REJECTED;
        const apiFailureOutcome: ScrapedSubmissionOutcome = {
          submissionId: target.id,
          kind: SCRAPE_OUTCOME_KIND.TRANSIENT_ERROR,
          errorMessage: fallbackMessage,
        };
        return apiFailureOutcome;
      }

      const unexpectedFailureOutcome: ScrapedSubmissionOutcome = {
        submissionId: target.id,
        kind: SCRAPE_OUTCOME_KIND.TRANSIENT_ERROR,
        errorMessage: CRON_MESSAGES.SYNC_ERR_TRANSIENT_UNAVAILABLE,
      };
      return unexpectedFailureOutcome;
    }
  }

  const exhaustedOutcome: ScrapedSubmissionOutcome = {
    submissionId: target.id,
    kind: SCRAPE_OUTCOME_KIND.TRANSIENT_ERROR,
    errorMessage: CRON_MESSAGES.SYNC_ERR_TRANSIENT_UNAVAILABLE,
  };
  return exhaustedOutcome;
}

/**
 * Stage 2 Worker: Commits scraped view counts and recalculates Two-Pass FIFO reward estimations
 * for a single campaign inside a short, row-locked PostgreSQL transaction (`FOR UPDATE`).
 * Freezes views and flags `lastSyncError` on unavailable/mismatched videos without clawing back rewards.
 *
 * @param campaignId - Target campaign UUID to update.
 * @param shouldStampFinalSnapshot - Whether to stamp `finalSnapshotSyncedAt` upon commit.
 * @param outcomesBySubmissionId - Lookup map of Stage 1 scrape results keyed by submission ID.
 * @param syncedAt - Timestamp to record on synced records.
 * @returns Per-campaign commit telemetry counters.
 */
async function CommitCampaignMetricsTransaction(
  campaignId: string,
  shouldStampFinalSnapshot: boolean,
  outcomesBySubmissionId: ReadonlyMap<string, ScrapedSubmissionOutcome>,
  syncedAt: Date,
): Promise<CommitCampaignResult> {
  const commitResult = await prisma.$transaction(async (tx) => {
    // Row-level mutex prevents race conditions if Admin clicks "Selesaikan Kampanye" concurrently
    if (typeof tx.$queryRaw === 'function') {
      await tx.$queryRaw`SELECT id FROM campaigns WHERE id = ${campaignId} FOR UPDATE`;
    }

    const liveCampaignQuery = {
      where: {
        id: campaignId,
        status: Status.ACTIVE,
      },
      select: {
        id: true,
        campaignStatus: true,
        budget: true,
        minViews: true,
        maxViews: true,
        cpm: true,
        endDate: true,
        finalSnapshotSyncedAt: true,
      },
    };
    const liveCampaign = await tx.campaign.findFirst(liveCampaignQuery);

    if (!liveCampaign || liveCampaign.campaignStatus !== CampaignStatus.ACTIVE) {
      const skipped: CommitCampaignResult = {
        skippedDuringCommit: true,
        submissionsUpdated: 0,
        submissionsFailed: 0,
        viewsDelta: 0,
        allocatedDelta: 0,
      };
      return skipped;
    }

    const liveSubmissionsQuery = {
      where: {
        campaignId: liveCampaign.id,
        status: Status.ACTIVE,
        submissionStatus: SubmissionStatus.APPROVED,
      },
      orderBy: FIFO_SUBMISSION_ORDER_BY,
      select: {
        id: true,
        verifiedViews: true,
        earnings: true,
        syncFailureStreak: true,
        lastSyncError: true,
      },
    };
    const liveSubmissions = await tx.submission.findMany(liveSubmissionsQuery);

    let previousTotalViews = 0;
    let previousTotalAllocated = 0;
    let resolvedTotalViews = 0;
    let submissionsFailed = 0;

    const preparedSubmissions: PreparedSubmissionDraft[] = liveSubmissions.map((sub) => {
      const safeExistingViews = ClampSafePgInt(sub.verifiedViews);
      const rawEarnings = sub.earnings !== null && sub.earnings !== undefined
        ? Number(sub.earnings)
        : 0;
      const safeExistingEarnings = Number.isFinite(rawEarnings)
        ? Math.max(0, Math.floor(rawEarnings))
        : 0;

      previousTotalViews += safeExistingViews;
      previousTotalAllocated += safeExistingEarnings;

      const outcome = outcomesBySubmissionId.get(sub.id);

      if (!outcome) {
        resolvedTotalViews += safeExistingViews;
        const untouchedDraft: PreparedSubmissionDraft = {
          id: sub.id,
          existingViews: sub.verifiedViews,
          existingEarnings: safeExistingEarnings,
          existingStreak: sub.syncFailureStreak,
          existingError: sub.lastSyncError,
          nextViews: safeExistingViews,
          nextStreak: sub.syncFailureStreak,
          nextError: sub.lastSyncError,
          didSyncViews: false,
        };
        return untouchedDraft;
      }

      if (outcome.kind === SCRAPE_OUTCOME_KIND.SUCCESS) {
        const candidateViews = outcome.scrapedViews ?? safeExistingViews;
        const monotonicViews = ResolveMonotonicVerifiedViews(safeExistingViews, candidateViews);
        resolvedTotalViews += monotonicViews;

        const syncedDraft: PreparedSubmissionDraft = {
          id: sub.id,
          existingViews: sub.verifiedViews,
          existingEarnings: safeExistingEarnings,
          existingStreak: sub.syncFailureStreak,
          existingError: sub.lastSyncError,
          nextViews: monotonicViews,
          nextStreak: 0,
          nextError: null,
          didSyncViews: true,
        };
        return syncedDraft;
      }

      // Freeze & Flag (Option A): keep last verified views intact and surface failure diagnostics for Admin review
      resolvedTotalViews += safeExistingViews;
      submissionsFailed += 1;
      const incrementedStreak = ClampSafePgInt(sub.syncFailureStreak + 1);
      const diagnosticMessage = outcome.errorMessage ?? CRON_MESSAGES.SYNC_ERR_VIDEO_UNAVAILABLE;

      const flaggedDraft: PreparedSubmissionDraft = {
        id: sub.id,
        existingViews: sub.verifiedViews,
        existingEarnings: safeExistingEarnings,
        existingStreak: sub.syncFailureStreak,
        existingError: sub.lastSyncError,
        nextViews: safeExistingViews,
        nextStreak: incrementedStreak,
        nextError: diagnosticMessage,
        didSyncViews: false,
      };
      return flaggedDraft;
    });

    const fifoInputs: FifoSubmissionAllocationInput[] = preparedSubmissions.map((draft) => {
      const inputItem: FifoSubmissionAllocationInput = {
        id: draft.id,
        verifiedViews: draft.nextViews,
        currentEarnings: draft.existingEarnings,
      };
      return inputItem;
    });

    const liveBudget = liveCampaign.budget !== null && liveCampaign.budget !== undefined
      ? Number(liveCampaign.budget)
      : 0;
    const liveCpm = liveCampaign.cpm !== null && liveCampaign.cpm !== undefined
      ? Number(liveCampaign.cpm)
      : 0;
    const liveMinViews = liveCampaign.minViews ?? 0;
    const liveMaxViews = liveCampaign.maxViews ?? 0;

    const fifoSummary = ComputeCampaignFifoAllocations(
      liveBudget,
      liveMinViews,
      liveMaxViews,
      liveCpm,
      fifoInputs,
    );

    AssertCampaignAllocationInvariants(
      liveBudget,
      fifoSummary,
      preparedSubmissions.length,
    );

    const allocationById = new Map(
      fifoSummary.allocations.map((allocation) => [allocation.id, allocation]),
    );

    let submissionsUpdated = 0;

    for (const draft of preparedSubmissions) {
      const allocation = allocationById.get(draft.id);
      const nextEarnings = allocation ? allocation.allocatedEarnings : draft.existingEarnings;

      const hasStateChange =
        draft.didSyncViews ||
        draft.nextViews !== draft.existingViews ||
        nextEarnings !== draft.existingEarnings ||
        draft.nextStreak !== draft.existingStreak ||
        draft.nextError !== draft.existingError;

      if (hasStateChange) {
        const submissionUpdateQuery = {
          where: { id: draft.id },
          data: {
            verifiedViews: draft.nextViews,
            earnings: nextEarnings,
            syncFailureStreak: draft.nextStreak,
            lastSyncError: draft.nextError,
            ...(draft.didSyncViews ? { lastMetricsSyncedAt: syncedAt } : {}),
          },
        };
        await tx.submission.update(submissionUpdateQuery);
      }

      if (draft.didSyncViews || nextEarnings !== draft.existingEarnings) {
        submissionsUpdated += 1;
      }
    }

    const isExpiredAtCommit =
      liveCampaign.endDate !== null && liveCampaign.endDate.getTime() <= syncedAt.getTime();
    const shouldWriteFinalSnapshot =
      (shouldStampFinalSnapshot || isExpiredAtCommit) &&
      liveCampaign.finalSnapshotSyncedAt === null;

    const campaignUpdateQuery = {
      where: { id: liveCampaign.id },
      data: {
        lastMetricsSyncedAt: syncedAt,
        ...(shouldWriteFinalSnapshot ? { finalSnapshotSyncedAt: syncedAt } : {}),
      },
    };
    await tx.campaign.update(campaignUpdateQuery);

    const rawViewsDelta = Math.max(0, resolvedTotalViews - previousTotalViews);
    const viewsDelta = ClampSafePgInt(rawViewsDelta);
    const allocatedDelta = Math.max(0, fifoSummary.totalAllocated - previousTotalAllocated);

    const committed: CommitCampaignResult = {
      skippedDuringCommit: false,
      submissionsUpdated,
      submissionsFailed,
      viewsDelta,
      allocatedDelta,
    };
    return committed;
  });

  return commitResult;
}

/**
 * Executes an end-to-end automated or manual Admin campaign metrics sync run:
 * 1. Acquires distributed `CronJobLock` (`campaign_metrics_sync`).
 * 2. Evaluates active campaigns for budget-full / post-expiry freeze eligibility.
 * 3. Scrapes TikTok views via bounded concurrency pool outside DB transactions.
 * 4. Commits monotonic views + Two-Pass FIFO reward estimations per campaign in isolated transactions.
 * 5. Records complete audit telemetry in `CronSyncRun` and releases the lock.
 *
 * @param options - Trigger source, optional Admin account ID, optional single `campaignId`, and overrides.
 * @returns Lock acquisition status and completed `CronSyncRunDto` telemetry record.
 */
export async function ExecuteCampaignMetricsSync(
  options: ExecuteMetricsSyncOptions,
): Promise<ExecuteMetricsSyncResult> {
  const startedAt = options.now ?? new Date();
  const workerToken = `${process.pid}-${randomUUID()}`;
  const acquired = await AcquireCronJobLock(METRICS_SYNC_LOCK_KEY, workerToken, startedAt);

  if (!acquired) {
    const lockedResult: ExecuteMetricsSyncResult = {
      acquiredLock: false,
      run: null,
    };
    return lockedResult;
  }

  let runId: string | null = null;

  try {
    const createRunPayload = {
      data: {
        triggerSource: options.triggerSource,
        triggeredByAccountId: options.triggeredByAccountId ?? null,
        targetCampaignId: options.campaignId ?? null,
        cronStatus: CronSyncStatus.RUNNING,
        startedAt,
      },
      select: { id: true },
    };
    const createdRun = await prisma.cronSyncRun.create(createRunPayload);
    runId = createdRun.id;

    const targetCampaignFilter = options.campaignId ? { id: options.campaignId } : {};
    const campaignsQuery = {
      where: {
        status: Status.ACTIVE,
        campaignStatus: CampaignStatus.ACTIVE,
        ...targetCampaignFilter,
      },
      select: CRON_ELIGIBLE_CAMPAIGN_SELECT,
    };
    const activeCampaigns: CronEligibleCampaignFromDb[] =
      await prisma.campaign.findMany(campaignsQuery);

    const forceSingleCampaign = Boolean(options.campaignId);
    const eligiblePlans: EligibleCampaignPlan[] = [];
    const scrapeTargets: SubmissionScrapeTarget[] = [];
    let campaignsSkippedFrozen = 0;

    for (const campaign of activeCampaigns) {
      const allocatedEarnings = campaign.submissions.reduce((sum, sub) => {
        const rawSubEarnings = sub.earnings !== null && sub.earnings !== undefined
          ? Number(sub.earnings)
          : 0;
        const safeSubEarnings = Number.isFinite(rawSubEarnings)
          ? Math.max(0, Math.floor(rawSubEarnings))
          : 0;
        return sum + safeSubEarnings;
      }, 0);

      const campaignBudget = campaign.budget !== null && campaign.budget !== undefined
        ? Number(campaign.budget)
        : 0;

      const eligibilityInput: CampaignEligibilityInput = {
        budget: campaignBudget,
        allocatedEarnings,
        endDate: campaign.endDate,
        finalSnapshotSyncedAt: campaign.finalSnapshotSyncedAt,
        now: startedAt,
        forceSingleCampaign,
      };
      const evaluation = EvaluateCampaignSyncEligibility(eligibilityInput);

      if (!evaluation.isEligible) {
        campaignsSkippedFrozen += 1;
        continue;
      }

      const plan: EligibleCampaignPlan = {
        campaignId: campaign.id,
        shouldStampFinalSnapshot: evaluation.shouldStampFinalSnapshot,
      };
      eligiblePlans.push(plan);

      for (const sub of campaign.submissions) {
        const target: SubmissionScrapeTarget = {
          id: sub.id,
          campaignId: campaign.id,
          liveVideoUrl: sub.liveVideoUrl,
          socialAccount: sub.socialAccount,
        };
        scrapeTargets.push(target);
      }
    }

    const defaultPacingMs = process.env.NODE_ENV === 'test' ? 0 : INTER_REQUEST_PACING_MS;
    const scrapeConfig: ScrapeRetryConfig = {
      timeoutMs: options.scrapeConfigOverride?.timeoutMs ?? SCRAPE_REQUEST_TIMEOUT_MS,
      maxRetries: options.scrapeConfigOverride?.maxRetries ?? MAX_SCRAPE_RETRIES,
      retryBaseDelayMs: options.scrapeConfigOverride?.retryBaseDelayMs ?? RETRY_BASE_DELAY_MS,
      interRequestPacingMs:
        options.scrapeConfigOverride?.interRequestPacingMs ?? defaultPacingMs,
    };

    const scrapedOutcomes = await RunBoundedPool(
      scrapeTargets,
      DEFAULT_SCRAPE_CONCURRENCY,
      async (target) => {
        const outcome = await ScrapeSubmissionMetricsWithRetry(target, scrapeConfig);
        return outcome;
      },
    );

    const stageTwoTimestamp = options.now ?? new Date();
    await RefreshCronJobLock(METRICS_SYNC_LOCK_KEY, workerToken, stageTwoTimestamp);

    const outcomesBySubmissionId = new Map<string, ScrapedSubmissionOutcome>(
      scrapedOutcomes.map((outcome) => [outcome.submissionId, outcome]),
    );

    let campaignsSynced = 0;
    let submissionsUpdated = 0;
    let submissionsFailed = 0;
    let totalViewsDelta = 0;
    let totalAllocatedDelta = 0;
    const campaignErrors: string[] = [];

    for (const plan of eligiblePlans) {
      const commitNow = options.now ?? new Date();

      try {
        const commitResult = await CommitCampaignMetricsTransaction(
          plan.campaignId,
          plan.shouldStampFinalSnapshot,
          outcomesBySubmissionId,
          commitNow,
        );

        if (commitResult.skippedDuringCommit) {
          campaignsSkippedFrozen += 1;
          continue;
        }

        campaignsSynced += 1;
        submissionsUpdated += commitResult.submissionsUpdated;
        submissionsFailed += commitResult.submissionsFailed;
        totalViewsDelta = ClampSafePgInt(totalViewsDelta + commitResult.viewsDelta);
        totalAllocatedDelta += commitResult.allocatedDelta;
      } catch (campaignErr) {
        const rawErrMsg =
          campaignErr instanceof Error ? campaignErr.message : 'Unknown campaign commit error';
        campaignErrors.push(`Campaign ${plan.campaignId}: ${rawErrMsg}`);

        await RecordCronErrorLog(
          `Cron campaign commit failed (${plan.campaignId}): ${rawErrMsg}`,
          campaignErr,
          {
            runId,
            campaignId: plan.campaignId,
            triggerSource: options.triggerSource,
          },
        );
      }
    }

    const finishedAt = new Date();
    const durationMs = Math.max(0, finishedAt.getTime() - startedAt.getTime());

    let finalCronStatus: CronSyncStatus = CronSyncStatus.SUCCESS;
    if (campaignErrors.length > 0 && campaignsSynced === 0 && eligiblePlans.length > 0) {
      finalCronStatus = CronSyncStatus.FAILED;
    } else if (campaignErrors.length > 0 || submissionsFailed > 0) {
      finalCronStatus = CronSyncStatus.PARTIAL_FAILURE;
    }

    const errorSummary = campaignErrors.length > 0 ? campaignErrors.join(' | ') : null;
    const finalizeRunQuery = {
      where: { id: runId },
      data: {
        cronStatus: finalCronStatus,
        finishedAt,
        durationMs,
        campaignsEvaluated: activeCampaigns.length,
        campaignsSynced,
        campaignsSkippedFrozen,
        submissionsScraped: scrapeTargets.length,
        submissionsUpdated,
        submissionsFailed,
        totalViewsDelta,
        totalAllocatedDelta,
        errorMessage: errorSummary,
      },
      select: CRON_SYNC_RUN_SELECT,
    };

    const completedRunRecord = await prisma.cronSyncRun.update(finalizeRunQuery);
    const completedRunDto = MapCronSyncRunToDto(completedRunRecord);

    const syncResult: ExecuteMetricsSyncResult = {
      acquiredLock: true,
      run: completedRunDto,
    };
    return syncResult;
  } catch (fatalErr) {
    const fatalMessage =
      fatalErr instanceof Error ? fatalErr.message : 'Fatal cron metrics sync failure';

    if (runId) {
      const finishedAt = new Date();
      const durationMs = Math.max(0, finishedAt.getTime() - startedAt.getTime());
      const failRunQuery = {
        where: { id: runId },
        data: {
          cronStatus: CronSyncStatus.FAILED,
          finishedAt,
          durationMs,
          errorMessage: fatalMessage,
        },
      };

      try {
        await prisma.cronSyncRun.update(failRunQuery);
      } catch (updateErr) {
        console.error('[CronScheduler] Failed to mark CronSyncRun as FAILED:', updateErr);
      }
    }

    await RecordCronErrorLog(`Fatal cron sync failure: ${fatalMessage}`, fatalErr, {
      runId,
      triggerSource: options.triggerSource,
      targetCampaignId: options.campaignId ?? null,
    });

    throw fatalErr;
  } finally {
    await ReleaseCronJobLock(METRICS_SYNC_LOCK_KEY, workerToken);
  }
}

/**
 * Starts the in-process `croner` scheduler for 12-hour campaign metrics synchronization
 * (`0 6,18 * * *` in `Asia/Jakarta` WIB by default). Skips background timers in Jest (`NODE_ENV === 'test'`).
 *
 * @returns Active `Cron` instance, or `null` if disabled or running under automated tests.
 */
export function StartAutomatedCronScheduler(): Cron | null {
  if (process.env.NODE_ENV === 'test' || !IsAutomatedCronEnabled()) {
    return null;
  }

  if (activeCronJob) {
    return activeCronJob;
  }

  const cronExpression = ResolveCronExpression();
  const timezone = ResolveCronTimezone();

  const jobOptions = {
    name: CRON_JOB_NAME,
    timezone,
    protect: true,
    catch: (err: unknown) => {
      console.error('[CronScheduler] Unhandled scheduled execution error:', err);
    },
  };

  activeCronJob = new Cron(cronExpression, jobOptions, async () => {
    const syncOptions: ExecuteMetricsSyncOptions = {
      triggerSource: CronTriggerSource.SCHEDULED,
    };
    await ExecuteCampaignMetricsSync(syncOptions);
  });

  const nextScheduled = activeCronJob.nextRun();
  const nextIso = nextScheduled ? nextScheduled.toISOString() : 'none';
  console.log(
    `[CronScheduler] Automated campaign metrics sync scheduled (${cronExpression} ${timezone}, next: ${nextIso})`,
  );

  return activeCronJob;
}

/**
 * Gracefully stops the active `croner` scheduler timer during server shutdown (`SIGINT` / `SIGTERM`).
 *
 * @returns Void.
 */
export function StopAutomatedCronScheduler(): void {
  if (!activeCronJob) {
    return;
  }

  activeCronJob.stop();
  activeCronJob = null;
}

/**
 * Inspects the live runtime state of the `croner` scheduler, computing the next scheduled WIB run
 * even when inspected from environments where the background daemon is idle.
 *
 * @returns Snapshot of scheduler configuration and runtime flags.
 */
export function GetCronSchedulerStatus(): SchedulerRuntimeSnapshot {
  const isEnabled = IsAutomatedCronEnabled();
  const cronExpression = ResolveCronExpression();
  const timezone = ResolveCronTimezone();

  if (activeCronJob) {
    const isRunning = activeCronJob.isRunning();
    const isBusy = activeCronJob.isBusy();
    const nextRunAt = activeCronJob.nextRun();
    const previousRunAt = activeCronJob.previousRun();

    const activeSnapshot: SchedulerRuntimeSnapshot = {
      isEnabled,
      isRunning,
      isBusy,
      cronExpression,
      timezone,
      nextRunAt,
      previousRunAt,
    };
    return activeSnapshot;
  }

  let computedNextRun: Date | null = null;
  if (isEnabled) {
    try {
      const previewJob = new Cron(cronExpression, { timezone });
      computedNextRun = previewJob.nextRun();
    } catch {
      computedNextRun = null;
    }
  }

  const idleSnapshot: SchedulerRuntimeSnapshot = {
    isEnabled,
    isRunning: false,
    isBusy: false,
    cronExpression,
    timezone,
    nextRunAt: computedNextRun,
    previousRunAt: null,
  };
  return idleSnapshot;
}
