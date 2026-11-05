import type { NextFunction, Request, Response } from 'express';
import {
  CampaignStatus,
  CronTriggerSource,
  Role,
  Status,
} from '../../generated/prisma/enums.js';
import { SendError, SendSuccess } from '../../utils/api-response.js';
import { prisma } from '../../utils/prisma.js';
import {
  CRON_MESSAGES,
  CRON_SYNC_RUN_SELECT,
  METRICS_SYNC_LOCK_KEY,
  RECENT_CRON_RUNS_LIMIT,
} from './cron.constants.js';
import {
  ExecuteCampaignMetricsSync,
  GetCronSchedulerStatus,
} from './cron.engine.js';
import { MapCronSyncRunToDto } from './cron.helper.js';
import type {
  CronSchedulerLiveStatusDto,
  ExecuteMetricsSyncOptions,
} from './cron.types.js';
import { ValidateManualMetricsSyncBody } from './cron.validators.js';

/**
 * Handles `GET /admin/cron/status`.
 * Returns the live 12-hour cron scheduler state, distributed lock status, and recent sync run telemetry.
 *
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next function.
 * @returns Promise resolving when response is sent.
 */
export async function GetCronStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.account) {
      SendError(res, CRON_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (req.account.role !== Role.ADMIN) {
      SendError(res, CRON_MESSAGES.ADMIN_ONLY, 403);
      return;
    }

    const lockQuery = {
      where: {
        lockKey: METRICS_SYNC_LOCK_KEY,
      },
      select: {
        lockedUntil: true,
      },
    };

    const recentRunsQuery = {
      where: {
        status: Status.ACTIVE,
      },
      orderBy: {
        startedAt: 'desc' as const,
      },
      take: RECENT_CRON_RUNS_LIMIT,
      select: CRON_SYNC_RUN_SELECT,
    };

    const [lockRecord, recentRunRecords] = await Promise.all([
      prisma.cronJobLock.findFirst(lockQuery),
      prisma.cronSyncRun.findMany(recentRunsQuery),
    ]);

    const now = new Date();
    const isLockActive = Boolean(
      lockRecord && lockRecord.lockedUntil.getTime() > now.getTime(),
    );
    const lockExpiresAt = isLockActive && lockRecord ? lockRecord.lockedUntil : null;
    const schedulerSnapshot = GetCronSchedulerStatus();
    const recentRuns = recentRunRecords.map((record) => MapCronSyncRunToDto(record));

    const statusDto: CronSchedulerLiveStatusDto = {
      isEnabled: schedulerSnapshot.isEnabled,
      isRunning: schedulerSnapshot.isRunning,
      isBusy: schedulerSnapshot.isBusy || isLockActive,
      isLockActive,
      lockExpiresAt,
      cronExpression: schedulerSnapshot.cronExpression,
      timezone: schedulerSnapshot.timezone,
      nextRunAt: schedulerSnapshot.nextRunAt,
      previousRunAt: schedulerSnapshot.previousRunAt,
      recentRuns,
    };

    SendSuccess(res, statusDto, CRON_MESSAGES.GET_CRON_STATUS_SUCCESS, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /admin/cron/metrics-sync`.
 * Triggers an immediate on-demand TikTok views & FIFO reward sync across all eligible active campaigns
 * or for a single active campaign (`{ campaignId }`), guarded by the shared distributed lease lock.
 *
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next function.
 * @returns Promise resolving when response is sent.
 */
export async function TriggerManualMetricsSync(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.account) {
      SendError(res, CRON_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (req.account.role !== Role.ADMIN) {
      SendError(res, CRON_MESSAGES.ADMIN_ONLY, 403);
      return;
    }

    const validated = ValidateManualMetricsSyncBody(req.body);
    if (typeof validated === 'string') {
      SendError(res, validated, 400);
      return;
    }

    if (validated.campaignId) {
      const targetCampaignQuery = {
        where: {
          id: validated.campaignId,
          status: Status.ACTIVE,
        },
        select: {
          id: true,
          campaignStatus: true,
        },
      };
      const targetCampaign = await prisma.campaign.findFirst(targetCampaignQuery);

      if (!targetCampaign) {
        SendError(res, CRON_MESSAGES.CAMPAIGN_NOT_FOUND, 404);
        return;
      }

      if (targetCampaign.campaignStatus === CampaignStatus.FINISHED) {
        SendError(res, CRON_MESSAGES.CAMPAIGN_ALREADY_SETTLED, 400);
        return;
      }

      if (targetCampaign.campaignStatus !== CampaignStatus.ACTIVE) {
        SendError(res, CRON_MESSAGES.CAMPAIGN_NOT_ACTIVE, 400);
        return;
      }
    }

    const syncOptions: ExecuteMetricsSyncOptions = {
      triggerSource: CronTriggerSource.MANUAL_ADMIN,
      triggeredByAccountId: req.account.sub,
      campaignId: validated.campaignId ?? null,
    };

    const syncResult = await ExecuteCampaignMetricsSync(syncOptions);

    if (!syncResult.acquiredLock || !syncResult.run) {
      SendError(res, CRON_MESSAGES.SYNC_ALREADY_RUNNING, 409);
      return;
    }

    SendSuccess(res, syncResult.run, CRON_MESSAGES.MANUAL_SYNC_SUCCESS, 200);
  } catch (err) {
    next(err);
  }
}
