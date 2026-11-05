import { z } from 'zod';
import { CRON_MESSAGES } from './cron.constants.js';

export const TriggerManualMetricsSyncSchema = z.object(
  {
    campaignId: z
      .string({ error: CRON_MESSAGES.INVALID_CAMPAIGN_ID })
      .trim()
      .uuid(CRON_MESSAGES.INVALID_CAMPAIGN_ID)
      .optional(),
  },
  { error: CRON_MESSAGES.INVALID_PAYLOAD },
);

export type TriggerManualMetricsSyncInput = z.infer<typeof TriggerManualMetricsSyncSchema>;
