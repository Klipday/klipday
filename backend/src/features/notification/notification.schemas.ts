import { z } from 'zod';
import {
  DEFAULT_NOTIFICATION_LIMIT,
  DEFAULT_NOTIFICATION_PAGE,
  MAX_NOTIFICATION_LIMIT,
} from './notification.constants.js';

const NotificationCategoryEnum = z.enum([
  'CAMPAIGN',
  'SUBMISSION',
  'FINANCE',
  'ACCOUNT',
  'SYSTEM',
]);

export const NotificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(DEFAULT_NOTIFICATION_PAGE),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_NOTIFICATION_LIMIT)
    .optional()
    .default(DEFAULT_NOTIFICATION_LIMIT),
  category: NotificationCategoryEnum.optional(),
  unreadOnly: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

export const NotificationIdParamSchema = z.object({
  id: z.string().trim().min(1, 'ID notifikasi tidak valid.'),
});

export type NotificationQueryInput = z.infer<typeof NotificationQuerySchema>;
export type NotificationIdParamInput = z.infer<typeof NotificationIdParamSchema>;
