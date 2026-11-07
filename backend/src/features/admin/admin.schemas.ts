import { z } from 'zod';
import {
  ADMIN_MESSAGES,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  KYC_FILTER,
  KYC_FILTER_OPTIONS,
  KYC_REVIEW_ACTION,
  KYC_REVIEW_ACTION_OPTIONS,
  KYC_ROLE_FILTER,
  KYC_ROLE_FILTER_OPTIONS,
  MAX_FEATURED_ORDER,
  MAX_LIMIT,
  MAX_REJECTION_REASON_LENGTH,
  MAX_REVIEW_NOTE_LENGTH,
  MAX_SEARCH_LENGTH,
  MIN_FEATURED_ORDER,
  MIN_REJECTION_REASON_LENGTH,
  MODERATION_ACTION_OPTIONS,
  MODERATION_FILTER,
  MODERATION_FILTER_OPTIONS,
  SETTLEMENT_FILTER,
  SETTLEMENT_FILTER_OPTIONS,
  TOPUP_FILTER,
  TOPUP_FILTER_OPTIONS,
  TOPUP_REVIEW_ACTION_OPTIONS,
  WITHDRAWAL_FILTER,
  WITHDRAWAL_FILTER_OPTIONS,
  WITHDRAWAL_REVIEW_ACTION_OPTIONS,
  WITHDRAWAL_ROLE_FILTER,
  WITHDRAWAL_ROLE_FILTER_OPTIONS,
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

export const AdminModerationQuerySchema = z.object({
  filter: z
    .enum(MODERATION_FILTER_OPTIONS, { error: ADMIN_MESSAGES.MODERATION_FILTER_INVALID })
    .default(MODERATION_FILTER.IN_REVIEW),
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

export type AdminModerationQuery = z.infer<typeof AdminModerationQuerySchema>;

export const AdminModerateCampaignSchema = z
  .object({
    action: z.enum(MODERATION_ACTION_OPTIONS, {
      error: ADMIN_MESSAGES.MODERATION_ACTION_INVALID,
    }),
    adminNote: z
      .string()
      .trim()
      .max(MAX_REVIEW_NOTE_LENGTH, ADMIN_MESSAGES.REVIEW_NOTE_MAX_EXCEEDED)
      .optional(),
    refundConfirmedManualPayment: z.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      if (
        data.action === 'REVISION' ||
        data.action === 'REJECT_PAYMENT' ||
        data.action === 'REJECT_CAMPAIGN'
      ) {
        return Boolean(data.adminNote && data.adminNote.trim().length > 0);
      }
      return true;
    },
    {
      message: ADMIN_MESSAGES.ADMIN_NOTE_REQUIRED,
      path: ['adminNote'],
    },
  );

export type AdminModerateCampaignInput = z.infer<typeof AdminModerateCampaignSchema>;

export const AdminTopUpQuerySchema = z.object({
  filter: z
    .enum(TOPUP_FILTER_OPTIONS, { error: ADMIN_MESSAGES.TOP_UP_FILTER_INVALID })
    .default(TOPUP_FILTER.SUBMITTED),
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

export type AdminTopUpQuery = z.infer<typeof AdminTopUpQuerySchema>;

export const ReviewBrandTopUpSchema = z
  .object({
    decision: z.enum(TOPUP_REVIEW_ACTION_OPTIONS, {
      error: ADMIN_MESSAGES.TOP_UP_ACTION_INVALID,
    }),
    rejectionReason: z
      .string()
      .trim()
      .max(500, ADMIN_MESSAGES.TOP_UP_REJECTION_REASON_MAX)
      .optional(),
  })
  .refine(
    (data) => {
      if (data.decision === 'REJECT') {
        return Boolean(data.rejectionReason && data.rejectionReason.trim().length >= 5);
      }
      return true;
    },
    {
      message: ADMIN_MESSAGES.TOP_UP_REJECTION_REASON_REQUIRED,
      path: ['rejectionReason'],
    },
  );

export type ReviewBrandTopUpInput = z.infer<typeof ReviewBrandTopUpSchema>;

export const AdminWithdrawalQuerySchema = z.object({
  filter: z
    .enum(WITHDRAWAL_FILTER_OPTIONS, { error: ADMIN_MESSAGES.WITHDRAWAL_FILTER_INVALID })
    .default(WITHDRAWAL_FILTER.PENDING),
  role: z
    .enum(WITHDRAWAL_ROLE_FILTER_OPTIONS, { error: ADMIN_MESSAGES.WITHDRAWAL_ROLE_FILTER_INVALID })
    .default(WITHDRAWAL_ROLE_FILTER.ALL),
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

export type AdminWithdrawalQuery = z.infer<typeof AdminWithdrawalQuerySchema>;

export const ReviewWithdrawalSchema = z
  .object({
    decision: z.enum(WITHDRAWAL_REVIEW_ACTION_OPTIONS, {
      error: ADMIN_MESSAGES.WITHDRAWAL_ACTION_INVALID,
    }),
    rejectionReason: z
      .string()
      .trim()
      .max(500, ADMIN_MESSAGES.WITHDRAWAL_REJECTION_REASON_MAX)
      .optional(),
    adminNote: z
      .string()
      .trim()
      .max(500, ADMIN_MESSAGES.WITHDRAWAL_ADMIN_NOTE_MAX)
      .optional(),
    transferProofUrl: z
      .union([z.string().url('URL bukti transfer tidak valid'), z.literal('')])
      .optional()
      .transform((val) => (val && val.trim().length > 0 ? val.trim() : undefined)),
  })
  .refine(
    (data) => {
      if (data.decision === 'REJECT') {
        return Boolean(data.rejectionReason && data.rejectionReason.trim().length >= 5);
      }
      return true;
    },
    {
      message: ADMIN_MESSAGES.WITHDRAWAL_REJECTION_REASON_REQUIRED,
      path: ['rejectionReason'],
    },
  );

export type ReviewWithdrawalInput = z.infer<typeof ReviewWithdrawalSchema>;

export const AdminKycQuerySchema = z.object(
  {
    filter: z
      .enum(KYC_FILTER_OPTIONS, { error: ADMIN_MESSAGES.KYC_FILTER_INVALID })
      .default(KYC_FILTER.PENDING),
    role: z
      .enum(KYC_ROLE_FILTER_OPTIONS, { error: ADMIN_MESSAGES.KYC_ROLE_FILTER_INVALID })
      .default(KYC_ROLE_FILTER.ALL),
    search: z
      .string({ error: ADMIN_MESSAGES.INVALID_PAYLOAD })
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
  },
  { error: ADMIN_MESSAGES.INVALID_PAYLOAD },
);

export type AdminKycQuery = z.infer<typeof AdminKycQuerySchema>;

export const ReviewKycSchema = z
  .object(
    {
      decision: z.enum(KYC_REVIEW_ACTION_OPTIONS, {
        error: ADMIN_MESSAGES.KYC_ACTION_INVALID,
      }),
      rejectionReason: z
        .string({ error: ADMIN_MESSAGES.KYC_REJECTION_REASON_REQUIRED })
        .trim()
        .max(MAX_REJECTION_REASON_LENGTH, ADMIN_MESSAGES.KYC_REJECTION_REASON_MAX)
        .nullable()
        .optional()
        .transform((val) => val ?? undefined),
    },
    { error: ADMIN_MESSAGES.INVALID_PAYLOAD },
  )
  .superRefine((data, ctx) => {
    if (
      data.decision === KYC_REVIEW_ACTION.REJECT &&
      (!data.rejectionReason ||
        data.rejectionReason.trim().length < MIN_REJECTION_REASON_LENGTH)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: ADMIN_MESSAGES.KYC_REJECTION_REASON_REQUIRED,
        path: ['rejectionReason'],
      });
    }
  });

export type ReviewKycInput = z.infer<typeof ReviewKycSchema>;

export const ToggleFeaturedCampaignSchema = z.object({
  isFeatured: z.boolean({ error: ADMIN_MESSAGES.FEATURED_STATUS_BOOLEAN }),
  featuredOrder: z
    .number({ error: ADMIN_MESSAGES.FEATURED_ORDER_NUMBER })
    .int(ADMIN_MESSAGES.FEATURED_ORDER_INTEGER)
    .min(MIN_FEATURED_ORDER, ADMIN_MESSAGES.FEATURED_ORDER_MIN)
    .max(MAX_FEATURED_ORDER, ADMIN_MESSAGES.FEATURED_ORDER_MAX)
    .nullable()
    .optional(),
  featuredUntil: z
    .union([
      z.string().datetime({ offset: true, error: ADMIN_MESSAGES.FEATURED_UNTIL_INVALID }),
      z.date(),
      z.literal(''),
    ])
    .nullable()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (!val) return null;
      if (val instanceof Date) return val;
      return new Date(val);
    }),
  featuredBannerUrl: z
    .union([z.string().url(ADMIN_MESSAGES.FEATURED_BANNER_URL_INVALID), z.literal('')])
    .nullable()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      return val && val.trim().length > 0 ? val.trim() : null;
    }),
});

export type ToggleFeaturedCampaignInput = z.infer<typeof ToggleFeaturedCampaignSchema>;

