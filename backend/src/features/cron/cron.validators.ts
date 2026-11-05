import { CRON_MESSAGES } from './cron.constants.js';
import {
  TriggerManualMetricsSyncSchema,
  type TriggerManualMetricsSyncInput,
} from './cron.schemas.js';

/**
 * Validates the request body for `POST /admin/cron/metrics-sync`.
 * Accepts an empty body `{}` for global sync or `{ campaignId }` for single-campaign sync.
 *
 * @param body - Raw Express request body.
 * @returns Validated input object on success, or a localized Indonesian error message string on failure.
 */
export function ValidateManualMetricsSyncBody(
  body: unknown,
): TriggerManualMetricsSyncInput | string {
  const normalizedBody = body === undefined || body === null ? {} : body;
  const parsed = TriggerManualMetricsSyncSchema.safeParse(normalizedBody);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const message = firstIssue ? firstIssue.message : CRON_MESSAGES.INVALID_PAYLOAD;
    return message;
  }

  return parsed.data;
}
