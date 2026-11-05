import type { Prisma } from '../../generated/prisma/client.js';
import type {
  CronSyncStatus,
  CronTriggerSource,
  Status,
} from '../../generated/prisma/enums.js';
import type {
  CAMPAIGN_SYNC_DECISION,
  CRON_ELIGIBLE_CAMPAIGN_SELECT,
  CRON_SYNC_RUN_SELECT,
  SCRAPE_OUTCOME_KIND,
} from './cron.constants.js';

export type CampaignSyncDecisionKind =
  (typeof CAMPAIGN_SYNC_DECISION)[keyof typeof CAMPAIGN_SYNC_DECISION];

export type ScrapeOutcomeKind =
  (typeof SCRAPE_OUTCOME_KIND)[keyof typeof SCRAPE_OUTCOME_KIND];

export interface CampaignEligibilityInput {
  budget: number;
  allocatedEarnings: number;
  endDate: Date | null;
  finalSnapshotSyncedAt: Date | null;
  now: Date;
  forceSingleCampaign: boolean;
}

export interface CampaignEligibilityEvaluation {
  isEligible: boolean;
  decision: CampaignSyncDecisionKind;
  shouldStampFinalSnapshot: boolean;
}

export interface SubmissionSocialAccountSnapshot {
  id: string;
  username: string;
  platformUserId: string | null;
  status: Status;
}

export interface SubmissionScrapeTarget {
  id: string;
  campaignId: string;
  liveVideoUrl: string | null;
  socialAccount: SubmissionSocialAccountSnapshot | null;
}

export interface ScrapedSubmissionOutcome {
  submissionId: string;
  kind: ScrapeOutcomeKind;
  scrapedViews?: number | undefined;
  errorMessage?: string | undefined;
}

export interface ScrapeRetryConfig {
  timeoutMs: number;
  maxRetries: number;
  retryBaseDelayMs: number;
  interRequestPacingMs: number;
}

export interface CommitCampaignResult {
  skippedDuringCommit: boolean;
  submissionsUpdated: number;
  submissionsFailed: number;
  viewsDelta: number;
  allocatedDelta: number;
}

export interface ExecuteMetricsSyncOptions {
  triggerSource: CronTriggerSource;
  triggeredByAccountId?: string | null | undefined;
  campaignId?: string | null | undefined;
  now?: Date | undefined;
  scrapeConfigOverride?: Partial<ScrapeRetryConfig> | undefined;
}

export interface CronSyncRunDto {
  id: string;
  triggerSource: CronTriggerSource;
  triggeredByAccountId: string | null;
  targetCampaignId: string | null;
  cronStatus: CronSyncStatus;
  startedAt: Date;
  finishedAt: Date | null;
  durationMs: number | null;
  campaignsEvaluated: number;
  campaignsSynced: number;
  campaignsSkippedFrozen: number;
  submissionsScraped: number;
  submissionsUpdated: number;
  submissionsFailed: number;
  totalViewsDelta: number;
  totalAllocatedDelta: number;
  errorMessage: string | null;
  createdAt: Date;
}

export interface ExecuteMetricsSyncResult {
  acquiredLock: boolean;
  run: CronSyncRunDto | null;
}

export interface CronSchedulerLiveStatusDto {
  isEnabled: boolean;
  isRunning: boolean;
  isBusy: boolean;
  isLockActive: boolean;
  lockExpiresAt: Date | null;
  cronExpression: string;
  timezone: string;
  nextRunAt: Date | null;
  previousRunAt: Date | null;
  recentRuns: CronSyncRunDto[];
}

export type CronEligibleCampaignFromDb = Prisma.CampaignGetPayload<{
  select: typeof CRON_ELIGIBLE_CAMPAIGN_SELECT;
}>;

export type CronSyncRunRecordFromDb = Prisma.CronSyncRunGetPayload<{
  select: typeof CRON_SYNC_RUN_SELECT;
}>;
