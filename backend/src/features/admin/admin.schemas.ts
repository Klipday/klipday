import { z } from 'zod';
import {
  ADMIN_MESSAGES,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
  MAX_REVIEW_NOTE_LENGTH,
  MAX_SEARCH_LENGTH,
  SETTLEMENT_FILTER,
  SETTLEMENT_FILTER_OPTIONS,
} from './admin.constants.js';

export const AdminSettlementQuerySchema = z.object({
  filter: z
    .enum(SETTLEMENT_FILTER_OPTIONS, { error: ADMIN_MESSAGES.FILTER_INVALID })
    .default(SETTLEMENT_FILTER.NEED_SETTLEMENT),
  search: z
    .string()
    .trim()
    .max(MAX_SEARCH_LENGTH, ADMIN_MESSAGES.SEARCH_MAX_EXCEEDED)
    .optional(),
  page: z.coerce
    .number({ error: ADMIN_MESSAGES.PAGE_NUMBER_REQUIRED })
    .int(ADMIN_MESSAGES.PAGE_INTEGER)
    .positive(ADMIN_MESSAGES.PAGE_POSITIVE)
    .default(DEFAULT_PAGE),
  limit: z.coerce
    .number({ error: ADMIN_MESSAGES.LIMIT_NUMBER_REQUIRED })
    .int(ADMIN_MESSAGES.LIMIT_INTEGER)
    .positive(ADMIN_MESSAGES.LIMIT_POSITIVE)
    .max(MAX_LIMIT, ADMIN_MESSAGES.LIMIT_MAX_EXCEEDED)
    .default(DEFAULT_LIMIT),
});

export type AdminSettlementQuery = z.infer<typeof AdminSettlementQuerySchema>;

export const DisqualifySubmissionSchema = z.object({
  reviewNote: z
    .string()
    .trim()
    .max(MAX_REVIEW_NOTE_LENGTH, ADMIN_MESSAGES.REVIEW_NOTE_MAX_EXCEEDED)
    .optional(),
});

export type DisqualifySubmissionInput = z.infer<typeof DisqualifySubmissionSchema>;

export const UpdateSubmissionViewsSchema = z.object({
  verifiedViews: z
    .number({ error: ADMIN_MESSAGES.VERIFIED_VIEWS_INVALID })
    .int(ADMIN_MESSAGES.VERIFIED_VIEWS_INVALID)
    .min(0, ADMIN_MESSAGES.VERIFIED_VIEWS_INVALID),
});

export type UpdateSubmissionViewsInput = z.infer<typeof UpdateSubmissionViewsSchema>;
