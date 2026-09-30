import { z } from 'zod';
import {
  ALL_STATUS_FILTER,
  MAX_CAPTION_LENGTH,
  MAX_LIMIT,
  MAX_REVIEW_NOTE_LENGTH,
  MAX_SEARCH_LENGTH,
  REVIEWABLE_SUBMISSION_STATUSES,
  SUBMISSION_MESSAGES,
  SUBMISSION_SORT_OPTIONS,
} from './submission.constants.js';

export const SaveDraftSubmissionSchema = z.object({
  liveVideoUrl: z
    .string({ error: SUBMISSION_MESSAGES.VIDEO_URL_REQUIRED })
    .url(SUBMISSION_MESSAGES.VIDEO_URL_INVALID),
  thumbnailUrl: z.string().url(SUBMISSION_MESSAGES.THUMBNAIL_URL_INVALID).optional(),
  videoCaption: z.string().max(MAX_CAPTION_LENGTH, SUBMISSION_MESSAGES.CAPTION_MAX_EXCEEDED).optional(),
  socialAccountId: z
    .string({ error: SUBMISSION_MESSAGES.SOCIAL_ACCOUNT_ID_REQUIRED })
    .uuid(SUBMISSION_MESSAGES.SOCIAL_ACCOUNT_ID_INVALID),
});

export const FinalSubmitVideoSchema = z.object({
  liveVideoUrl: z
    .string({ error: SUBMISSION_MESSAGES.TIKTOK_URL_REQUIRED })
    .url(SUBMISSION_MESSAGES.TIKTOK_URL_INVALID),
  thumbnailUrl: z.string().url(SUBMISSION_MESSAGES.THUMBNAIL_URL_INVALID).optional(),
  videoCaption: z.string().max(MAX_CAPTION_LENGTH, SUBMISSION_MESSAGES.CAPTION_MAX_EXCEEDED).optional(),
  socialAccountId: z
    .string({ error: SUBMISSION_MESSAGES.SOCIAL_ACCOUNT_ID_REQUIRED })
    .uuid(SUBMISSION_MESSAGES.SOCIAL_ACCOUNT_ID_INVALID),
});

export const SubmissionQuerySchema = z.object({
  page: z.coerce
    .number({ error: SUBMISSION_MESSAGES.PAGE_NUMBER_REQUIRED })
    .int(SUBMISSION_MESSAGES.PAGE_INTEGER)
    .positive(SUBMISSION_MESSAGES.PAGE_POSITIVE)
    .optional(),
  limit: z.coerce
    .number({ error: SUBMISSION_MESSAGES.LIMIT_NUMBER_REQUIRED })
    .int(SUBMISSION_MESSAGES.LIMIT_INTEGER)
    .positive(SUBMISSION_MESSAGES.LIMIT_POSITIVE)
    .max(MAX_LIMIT, SUBMISSION_MESSAGES.LIMIT_MAX_EXCEEDED)
    .optional(),
  search: z.string().trim().max(MAX_SEARCH_LENGTH, SUBMISSION_MESSAGES.SEARCH_MAX_EXCEEDED).optional(),
  status: z
    .enum([...REVIEWABLE_SUBMISSION_STATUSES, ALL_STATUS_FILTER], {
      error: SUBMISSION_MESSAGES.STATUS_FILTER_INVALID,
    })
    .optional(),
  sort: z
    .enum(SUBMISSION_SORT_OPTIONS, {
      error: SUBMISSION_MESSAGES.SORT_INVALID,
    })
    .optional(),
});

export const RejectSubmissionSchema = z.object({
  reviewNote: z.string().trim().max(MAX_REVIEW_NOTE_LENGTH, SUBMISSION_MESSAGES.REVIEW_NOTE_MAX_EXCEEDED).optional(),
});

export const RequestRevisionSchema = z.object({
  reviewNote: z
    .string({ error: SUBMISSION_MESSAGES.REVIEW_NOTE_REQUIRED })
    .trim()
    .min(1, SUBMISSION_MESSAGES.REVIEW_NOTE_REQUIRED)
    .max(MAX_REVIEW_NOTE_LENGTH, SUBMISSION_MESSAGES.REVIEW_NOTE_MAX_EXCEEDED),
});