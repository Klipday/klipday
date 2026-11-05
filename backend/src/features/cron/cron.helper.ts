import type { TikTokVideoItem } from '../../services/scrape-creators.js';
import type { FifoCampaignAllocationSummary } from '../admin/admin.types.js';
import {
  CAMPAIGN_SYNC_DECISION,
  CRON_MESSAGES,
  MAX_SAFE_PG_INT,
} from './cron.constants.js';
import type {
  CampaignEligibilityEvaluation,
  CampaignEligibilityInput,
  CronSyncRunDto,
  CronSyncRunRecordFromDb,
  SubmissionSocialAccountSnapshot,
} from './cron.types.js';

/**
 * Clamps a numeric metric into a safe non-negative 32-bit signed PostgreSQL integer (`INT4`).
 * Prevents database overflow errors when external social APIs return malformed or huge values.
 *
 * @param value - Raw numeric count.
 * @returns Non-negative integer within `[0, 2_147_483_647]`.
 */
export function ClampSafePgInt(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const floored = Math.floor(value);
  const nonNegative = Math.max(0, floored);
  const clamped = Math.min(MAX_SAFE_PG_INT, nonNegative);

  return clamped;
}

/**
 * Delays execution asynchronously for pacing and retry backoff.
 *
 * @param ms - Milliseconds to wait.
 * @returns Promise resolving after the specified delay.
 */
export function SleepMs(ms: number): Promise<void> {
  if (!Number.isFinite(ms) || ms <= 0) {
    return Promise.resolve();
  }

  const safeDelay = Math.floor(ms);
  const delayPromise = new Promise<void>((resolve) => {
    setTimeout(resolve, safeDelay);
  });

  return delayPromise;
}

/**
 * Executes an asynchronous worker across an array of items with bounded concurrency,
 * preserving deterministic output order matching the input array indices.
 *
 * @param items - Input items to process.
 * @param concurrency - Maximum number of concurrent worker executions.
 * @param worker - Async callback invoked for each item.
 * @returns Ordered array of worker results.
 */
export async function RunBoundedPool<TItem, TResult>(
  items: readonly TItem[],
  concurrency: number,
  worker: (item: TItem, index: number) => Promise<TResult>,
): Promise<TResult[]> {
  if (items.length === 0) {
    return [];
  }

  const normalizedConcurrency = Number.isFinite(concurrency) ? Math.floor(concurrency) : 1;
  const workerCount = Math.max(1, Math.min(items.length, normalizedConcurrency));
  const results = new Array<TResult>(items.length);
  let cursor = 0;

  /**
   * Pulls items from the shared index cursor until all items have been claimed.
   *
   * @returns Promise resolving when no items remain.
   */
  const ConsumeQueue = async (): Promise<void> => {
    while (cursor < items.length) {
      const currentIndex = cursor;
      cursor += 1;
      const currentItem = items[currentIndex] as TItem;
      const itemResult = await worker(currentItem, currentIndex);
      results[currentIndex] = itemResult;
    }
  };

  const workers: Promise<void>[] = [];
  for (let i = 0; i < workerCount; i += 1) {
    const workerPromise = ConsumeQueue();
    workers.push(workerPromise);
  }

  await Promise.all(workers);

  return results;
}

/**
 * Normalizes a TikTok handle by removing any leading `@`, trimming whitespace, and lowercasing.
 *
 * @param handle - Raw social username string.
 * @returns Normalized lowercase handle, or empty string if absent.
 */
export function NormalizeTikTokHandle(handle: string | null | undefined): string {
  if (!handle || typeof handle !== 'string') {
    return '';
  }

  const normalized = handle.trim().replace(/^@+/, '').toLowerCase();
  return normalized;
}

/**
 * Evaluates whether an active campaign should have its submission views scraped during the current sync run,
 * enforcing budget-full freeze and one-time post-expiry final snapshot semantics.
 *
 * @param input - Campaign budget, current allocation, expiration, snapshot timestamp, and trigger mode.
 * @returns Eligibility decision and whether committing this run should stamp `finalSnapshotSyncedAt`.
 */
export function EvaluateCampaignSyncEligibility(
  input: CampaignEligibilityInput,
): CampaignEligibilityEvaluation {
  const safeBudget = Number.isFinite(input.budget) ? Math.max(0, Math.floor(input.budget)) : 0;
  const safeAllocated = Number.isFinite(input.allocatedEarnings)
    ? Math.max(0, Math.floor(input.allocatedEarnings))
    : 0;
  const isExpired =
    input.endDate !== null && input.endDate.getTime() <= input.now.getTime();

  // Admin single-campaign manual refresh intentionally bypasses automatic freeze skips for audit verification
  if (input.forceSingleCampaign) {
    const shouldStampFinalSnapshot = isExpired && input.finalSnapshotSyncedAt === null;
    const evaluation: CampaignEligibilityEvaluation = {
      isEligible: true,
      decision: CAMPAIGN_SYNC_DECISION.MANUAL_FORCE_SYNC,
      shouldStampFinalSnapshot,
    };
    return evaluation;
  }

  if (safeBudget > 0 && safeAllocated >= safeBudget) {
    const evaluation: CampaignEligibilityEvaluation = {
      isEligible: false,
      decision: CAMPAIGN_SYNC_DECISION.SKIP_BUDGET_FULL,
      shouldStampFinalSnapshot: false,
    };
    return evaluation;
  }

  if (isExpired) {
    if (input.finalSnapshotSyncedAt !== null) {
      const evaluation: CampaignEligibilityEvaluation = {
        isEligible: false,
        decision: CAMPAIGN_SYNC_DECISION.SKIP_EXPIRED_ALREADY_SNAPSHOTTED,
        shouldStampFinalSnapshot: false,
      };
      return evaluation;
    }

    const evaluation: CampaignEligibilityEvaluation = {
      isEligible: true,
      decision: CAMPAIGN_SYNC_DECISION.POST_EXPIRY_FINAL_SNAPSHOT,
      shouldStampFinalSnapshot: true,
    };
    return evaluation;
  }

  const evaluation: CampaignEligibilityEvaluation = {
    isEligible: true,
    decision: CAMPAIGN_SYNC_DECISION.ACTIVE_RUNNING,
    shouldStampFinalSnapshot: false,
  };
  return evaluation;
}

/**
 * Verifies that the scraped TikTok video still belongs to the creator's linked social account.
 * Prefers immutable `platformUserId` comparison so legitimate TikTok handle renames do not trigger false flags,
 * falling back to normalized username matching when platform UIDs are unavailable.
 *
 * @param scrapedVideo - Video metadata returned by ScrapeCreators.
 * @param socialAccount - Snapshot of the creator's linked social account on the submission.
 * @returns True if ownership matches (or no social account was linked), false on anti-hijack mismatch.
 */
export function VerifyScrapedVideoOwnership(
  scrapedVideo: TikTokVideoItem,
  socialAccount: SubmissionSocialAccountSnapshot | null,
): boolean {
  if (!socialAccount) {
    return true;
  }

  const expectedUid = socialAccount.platformUserId?.trim() ?? '';
  const actualUid = scrapedVideo.authorPlatformUserId?.trim() ?? '';

  if (expectedUid !== '' && actualUid !== '') {
    return expectedUid === actualUid;
  }

  const expectedHandle = NormalizeTikTokHandle(socialAccount.username);
  const actualHandle = NormalizeTikTokHandle(scrapedVideo.authorUsername);

  if (expectedHandle === '' || actualHandle === '') {
    return false;
  }

  return expectedHandle === actualHandle;
}

/**
 * Resolves the updated verified view count using a monotonic high-water mark (`Math.max`),
 * preventing TikTok regional cache inconsistencies from reducing verified views or causing reward clawbacks.
 *
 * @param existingViews - Previously persisted verified view count.
 * @param scrapedViews - Newly scraped play count from TikTok.
 * @returns Safe non-decreasing verified view count.
 */
export function ResolveMonotonicVerifiedViews(
  existingViews: number,
  scrapedViews: number,
): number {
  const safeExisting = ClampSafePgInt(existingViews);
  const safeScraped = ClampSafePgInt(scrapedViews);
  const monotonicViews = Math.max(safeExisting, safeScraped);

  return monotonicViews;
}

/**
 * Enforces strict financial conservation invariants on computed FIFO reward allocations
 * before committing any numbers to PostgreSQL. Throws an error to roll back the transaction if violated.
 *
 * @param budget - Total campaign escrow budget in Rupiah.
 * @param summary - Computed FIFO allocation result summary.
 * @param expectedCount - Expected number of active approved submissions in the campaign.
 * @returns Void when all invariants hold.
 */
export function AssertCampaignAllocationInvariants(
  budget: number,
  summary: FifoCampaignAllocationSummary,
  expectedCount: number,
): void {
  if (summary.allocations.length !== expectedCount) {
    throw new Error(CRON_MESSAGES.INVARIANT_ALLOCATION_LENGTH_MISMATCH);
  }

  const safeBudget = Number.isFinite(budget) ? Math.max(0, Math.floor(budget)) : 0;
  let sumAllocated = 0;

  for (const allocation of summary.allocations) {
    const isWholeNonNegative =
      Number.isInteger(allocation.allocatedEarnings) && allocation.allocatedEarnings >= 0;
    if (!isWholeNonNegative) {
      throw new Error(CRON_MESSAGES.INVARIANT_NEGATIVE_OR_DECIMAL_EARNINGS);
    }

    if (allocation.allocatedEarnings > allocation.targetEarnings) {
      throw new Error(CRON_MESSAGES.INVARIANT_EXCEEDS_TARGET_REWARD);
    }

    sumAllocated += allocation.allocatedEarnings;
  }

  const isBalanced =
    sumAllocated === summary.totalAllocated &&
    Number.isInteger(summary.remainingRefund) &&
    summary.remainingRefund >= 0 &&
    summary.totalAllocated + summary.remainingRefund === safeBudget;

  if (!isBalanced) {
    throw new Error(CRON_MESSAGES.INVARIANT_BUDGET_CONSERVATION_VIOLATED);
  }
}

/**
 * Maps a Prisma `CronSyncRun` record into a serializable API DTO.
 *
 * @param record - Selected `CronSyncRun` row from PostgreSQL.
 * @returns Clean `CronSyncRunDto` response object.
 */
export function MapCronSyncRunToDto(record: CronSyncRunRecordFromDb): CronSyncRunDto {
  const dto: CronSyncRunDto = {
    id: record.id,
    triggerSource: record.triggerSource,
    triggeredByAccountId: record.triggeredByAccountId,
    targetCampaignId: record.targetCampaignId,
    cronStatus: record.cronStatus,
    startedAt: record.startedAt,
    finishedAt: record.finishedAt,
    durationMs: record.durationMs,
    campaignsEvaluated: record.campaignsEvaluated,
    campaignsSynced: record.campaignsSynced,
    campaignsSkippedFrozen: record.campaignsSkippedFrozen,
    submissionsScraped: record.submissionsScraped,
    submissionsUpdated: record.submissionsUpdated,
    submissionsFailed: record.submissionsFailed,
    totalViewsDelta: record.totalViewsDelta,
    totalAllocatedDelta: Number(record.totalAllocatedDelta),
    errorMessage: record.errorMessage,
    createdAt: record.createdAt,
  };

  return dto;
}
