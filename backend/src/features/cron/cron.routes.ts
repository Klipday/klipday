import type { Request, Response } from 'express';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { RequireAuth } from '../../middleware/auth.middleware.js';
import { SendError } from '../../utils/api-response.js';
import { CRON_MESSAGES } from './cron.constants.js';
import { GetCronStatus, TriggerManualMetricsSync } from './cron.handlers.js';

export const cronRouter = Router();

const manualSyncLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (_req: Request, res: Response) => {
    SendError(res, CRON_MESSAGES.SYNC_ALREADY_RUNNING, 429);
  },
});

cronRouter.use(RequireAuth);

cronRouter.get('/status', GetCronStatus);
cronRouter.post('/metrics-sync', manualSyncLimiter, TriggerManualMetricsSync);
