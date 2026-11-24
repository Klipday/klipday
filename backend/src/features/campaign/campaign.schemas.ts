import { z } from 'zod';
import { CampaignStatus, CampaignType, Category, MaterialType, Platform } from '../../generated/prisma/enums.js';
import {
  ADMIN_PAYMENT_VERIFY_ACTIONS,
  CAMPAIGN_FIELD_LIMITS,
  CAMPAIGN_MESSAGES,
  CAMPAIGN_SORT_OPTIONS,
  SCALAR_FIELDS,
} from './campaign.constants.js';

export type CampaignSortOption = (typeof CAMPAIGN_SORT_OPTIONS)[number];

/**
 * Builds a strict HTTP/HTTPS URL schema that rejects unsafe pseudo-schemes such as `javascript:` or `data:`.
 *
 * @param errorMessage - Validation error message returned when the URL is invalid or non-HTTP.
 * @returns Configured Zod string schema.
 */
function BuildHttpUrlSchema(errorMessage: string) {
  return z
    .string({ error: errorMessage })
    .trim()
    .pipe(z.url({ error: errorMessage }))
    .refine((val) => /^https?:\/\//i.test(val), {
      message: errorMessage,
    });
}

/**
 * Builds an optional nullable brief text schema that normalizes empty strings (`""`)
 * into `null` so optional fields can be omitted, left blank on Step 3, or cleared later.
 *
 * @param maxLength - Maximum allowed character count.
 * @param maxMessage - Error message when maxLength is exceeded.
 * @returns Configured Zod schema.
 */
function BuildOptionalNullableBriefTextSchema(maxLength: number, maxMessage: string) {
  return z
    .union([z.string().trim().max(maxLength, maxMessage), z.null()])
    .transform((val) => (val === '' ? null : val))
    .optional();
}

const titleField = z
  .string({ error: CAMPAIGN_MESSAGES.TITLE_REQUIRED })
  .trim()
  .min(1, CAMPAIGN_MESSAGES.TITLE_REQUIRED)
  .max(CAMPAIGN_FIELD_LIMITS.TITLE_MAX_LENGTH, CAMPAIGN_MESSAGES.TITLE_MAX_EXCEEDED);

const descriptionField = z
  .string({ error: CAMPAIGN_MESSAGES.DESCRIPTION_REQUIRED })
  .trim()
  .min(1, CAMPAIGN_MESSAGES.DESCRIPTION_REQUIRED)
  .max(CAMPAIGN_FIELD_LIMITS.DESCRIPTION_MAX_LENGTH, CAMPAIGN_MESSAGES.DESCRIPTION_MAX_EXCEEDED);

const thumbnailUrlField = BuildHttpUrlSchema(CAMPAIGN_MESSAGES.THUMBNAIL_URL_INVALID);

const mainMediaUrlField = BuildHttpUrlSchema(CAMPAIGN_MESSAGES.MAIN_MEDIA_URL_INVALID);

const cpmField = z
  .number({ error: CAMPAIGN_MESSAGES.CPM_NUMBER_REQUIRED })
  .finite(CAMPAIGN_MESSAGES.CPM_NUMBER_REQUIRED)
  .min(CAMPAIGN_FIELD_LIMITS.MIN_CPM_VALUE, CAMPAIGN_MESSAGES.CPM_MIN_VALUE)
  .max(CAMPAIGN_FIELD_LIMITS.MAX_CPM_VALUE, CAMPAIGN_MESSAGES.CPM_MAX_EXCEEDED);

const minViewsField = z
  .number({ error: CAMPAIGN_MESSAGES.MIN_VIEWS_NUMBER_REQUIRED })
  .int(CAMPAIGN_MESSAGES.MIN_VIEWS_INTEGER)
  .positive(CAMPAIGN_MESSAGES.MIN_VIEWS_POSITIVE)
  .max(CAMPAIGN_FIELD_LIMITS.MAX_PG_INT, CAMPAIGN_MESSAGES.MIN_VIEWS_MAX_EXCEEDED);

const maxViewsField = z
  .number({ error: CAMPAIGN_MESSAGES.MAX_VIEWS_NUMBER_REQUIRED })
  .int(CAMPAIGN_MESSAGES.MAX_VIEWS_INTEGER)
  .positive(CAMPAIGN_MESSAGES.MAX_VIEWS_POSITIVE)
  .max(CAMPAIGN_FIELD_LIMITS.MAX_PG_INT, CAMPAIGN_MESSAGES.MAX_VIEWS_MAX_EXCEEDED);

const budgetField = z
  .number({ error: CAMPAIGN_MESSAGES.BUDGET_NUMBER_REQUIRED })
  .finite(CAMPAIGN_MESSAGES.BUDGET_NUMBER_REQUIRED)
  .positive(CAMPAIGN_MESSAGES.BUDGET_POSITIVE)
  .max(CAMPAIGN_FIELD_LIMITS.MAX_BUDGET_VALUE, CAMPAIGN_MESSAGES.BUDGET_MAX_EXCEEDED);

const startDateField = z.union(
  [
    z.date(),
    z
      .string({ error: CAMPAIGN_MESSAGES.START_DATE_REQUIRED })
      .trim()
      .min(1, CAMPAIGN_MESSAGES.START_DATE_EMPTY)
      .pipe(z.coerce.date({ error: CAMPAIGN_MESSAGES.START_DATE_REQUIRED })),
  ],
  { error: CAMPAIGN_MESSAGES.START_DATE_REQUIRED }
);

const endDateField = z.union(
  [
    z.date(),
    z
      .string({ error: CAMPAIGN_MESSAGES.END_DATE_REQUIRED })
      .trim()
      .min(1, CAMPAIGN_MESSAGES.END_DATE_EMPTY)
      .pipe(z.coerce.date({ error: CAMPAIGN_MESSAGES.END_DATE_REQUIRED })),
  ],
  { error: CAMPAIGN_MESSAGES.END_DATE_REQUIRED }
);

const campaignMaterialItemSchema = z.object({
  type: z.enum(MaterialType, { error: CAMPAIGN_MESSAGES.MATERIAL_TYPE_INVALID }),
  name: z
    .string({ error: CAMPAIGN_MESSAGES.MATERIAL_NAME_REQUIRED })
    .trim()
    .min(1, CAMPAIGN_MESSAGES.MATERIAL_NAME_REQUIRED)
    .max(CAMPAIGN_FIELD_LIMITS.MATERIAL_NAME_MAX_LENGTH, CAMPAIGN_MESSAGES.MATERIAL_NAME_MAX_EXCEEDED),
  url: BuildHttpUrlSchema(CAMPAIGN_MESSAGES.MATERIAL_URL_INVALID),
});

const campaignMaterialsSchema = z
  .array(campaignMaterialItemSchema)
  .min(1, CAMPAIGN_MESSAGES.MATERIALS_REQUIRED)
  .max(CAMPAIGN_FIELD_LIMITS.MATERIALS_MAX_COUNT, CAMPAIGN_MESSAGES.MATERIALS_MAX_EXCEEDED);

const buildBriefArraySchema = (emptyItemMsg: string) =>
  z
    .array(
      z
        .string()
        .trim()
        .min(1, emptyItemMsg)
        .max(CAMPAIGN_FIELD_LIMITS.BRIEF_ARRAY_ITEM_MAX_LENGTH, CAMPAIGN_MESSAGES.BRIEF_ARRAY_ITEM_MAX_EXCEEDED)
    )
    .max(CAMPAIGN_FIELD_LIMITS.BRIEF_ARRAY_MAX_ITEMS, CAMPAIGN_MESSAGES.BRIEF_ARRAY_MAX_ITEMS)
    .optional();

const campaignBriefSchema = z.object({
  purpose: z
    .string()
    .trim()
    .min(1, CAMPAIGN_MESSAGES.BRIEF_PURPOSE_EMPTY)
    .max(CAMPAIGN_FIELD_LIMITS.BRIEF_PURPOSE_MAX_LENGTH, CAMPAIGN_MESSAGES.BRIEF_PURPOSE_MAX_EXCEEDED)
    .optional(),
  keyMessage: z
    .string()
    .trim()
    .min(1, CAMPAIGN_MESSAGES.BRIEF_KEY_MESSAGE_EMPTY)
    .max(CAMPAIGN_FIELD_LIMITS.BRIEF_KEY_MESSAGE_MAX_LENGTH, CAMPAIGN_MESSAGES.BRIEF_KEY_MESSAGE_MAX_EXCEEDED)
    .optional(),
  narration: BuildOptionalNullableBriefTextSchema(
    CAMPAIGN_FIELD_LIMITS.BRIEF_NARRATION_MAX_LENGTH,
    CAMPAIGN_MESSAGES.BRIEF_NARRATION_MAX_EXCEEDED
  ),
  impression: BuildOptionalNullableBriefTextSchema(
    CAMPAIGN_FIELD_LIMITS.BRIEF_IMPRESSION_MAX_LENGTH,
    CAMPAIGN_MESSAGES.BRIEF_IMPRESSION_MAX_EXCEEDED
  ),
  callToAction: z
    .string()
    .trim()
    .min(1, CAMPAIGN_MESSAGES.BRIEF_CALL_TO_ACTION_EMPTY)
    .max(CAMPAIGN_FIELD_LIMITS.BRIEF_CALL_TO_ACTION_MAX_LENGTH, CAMPAIGN_MESSAGES.BRIEF_CALL_TO_ACTION_MAX_EXCEEDED)
    .optional(),
  requiredCaption: BuildOptionalNullableBriefTextSchema(
    CAMPAIGN_FIELD_LIMITS.BRIEF_REQUIRED_CAPTION_MAX_LENGTH,
    CAMPAIGN_MESSAGES.BRIEF_REQUIRED_CAPTION_MAX_EXCEEDED
  ),
  hashtags: buildBriefArraySchema(CAMPAIGN_MESSAGES.BRIEF_HASHTAG_EMPTY),
  mentionTags: buildBriefArraySchema(CAMPAIGN_MESSAGES.BRIEF_MENTION_TAG_EMPTY),
  dos: buildBriefArraySchema(CAMPAIGN_MESSAGES.BRIEF_DO_GUIDELINE_EMPTY),
  donts: buildBriefArraySchema(CAMPAIGN_MESSAGES.BRIEF_DONT_GUIDELINE_EMPTY),
  guidelines: BuildOptionalNullableBriefTextSchema(
    CAMPAIGN_FIELD_LIMITS.BRIEF_GUIDELINES_MAX_LENGTH,
    CAMPAIGN_MESSAGES.BRIEF_GUIDELINES_MAX_EXCEEDED
  ),
});

// Single edit schema for the creation wizard: every field is optional, so a
// PATCH only needs the fields of the current wizard step, while requiring at least
// one known update field and optional optimistic concurrency check.
export const campaignEditSchema = z
  .object({
    title: titleField.optional(),
    description: descriptionField.optional(),
    campaignType: z.enum(CampaignType, { error: CAMPAIGN_MESSAGES.CAMPAIGN_TYPE_INVALID }).optional(),
    campaignCategory: z.enum(Category, { error: CAMPAIGN_MESSAGES.CAMPAIGN_CATEGORY_INVALID }).optional(),
    thumbnailUrl: thumbnailUrlField.optional(),
    platform: z.enum(Platform, { error: CAMPAIGN_MESSAGES.PLATFORM_INVALID }).optional(),
    mainMediaUrl: mainMediaUrlField.optional(),
    materials: campaignMaterialsSchema.optional(),
    brief: campaignBriefSchema.optional(),
    cpm: cpmField.optional(),
    minViews: minViewsField.optional(),
    maxViews: maxViewsField.optional(),
    budget: budgetField.optional(),
    startDate: startDateField.optional(),
    endDate: endDateField.optional(),
    expectedUpdatedAt: z.iso
      .datetime({ error: CAMPAIGN_MESSAGES.EXPECTED_UPDATED_AT_INVALID })
      .optional(),
  })
  .refine(
    (data) =>
      SCALAR_FIELDS.some((key) => data[key] !== undefined) ||
      data.materials !== undefined ||
      data.brief !== undefined,
    {
      message: CAMPAIGN_MESSAGES.EDIT_NO_FIELDS_PROVIDED,
    }
  );

const pageQueryField = z.coerce
  .number({ error: CAMPAIGN_MESSAGES.PAGE_NUMBER_REQUIRED })
  .int(CAMPAIGN_MESSAGES.PAGE_INTEGER)
  .positive(CAMPAIGN_MESSAGES.PAGE_POSITIVE)
  .optional();

const limitQueryField = z.coerce
  .number({ error: CAMPAIGN_MESSAGES.LIMIT_NUMBER_REQUIRED })
  .int(CAMPAIGN_MESSAGES.LIMIT_INTEGER)
  .positive(CAMPAIGN_MESSAGES.LIMIT_POSITIVE)
  .max(100, CAMPAIGN_MESSAGES.LIMIT_MAX_EXCEEDED)
  .optional();

const searchQueryField = z
  .string()
  .trim()
  .max(100, CAMPAIGN_MESSAGES.SEARCH_MAX_EXCEEDED)
  .optional();

const campaignQuerySortEnum = z.enum(CAMPAIGN_SORT_OPTIONS, {
  error: CAMPAIGN_MESSAGES.SORT_INVALID,
});

export const campaignQuerySchema = z.object({
  page: pageQueryField,
  limit: limitQueryField,
  search: searchQueryField,
  category: z.enum(Category, { error: CAMPAIGN_MESSAGES.CATEGORY_FILTER_INVALID }).optional(),
  campaignType: z.enum(CampaignType, { error: CAMPAIGN_MESSAGES.CAMPAIGN_TYPE_FILTER_INVALID }).optional(),
  platform: z.enum(Platform, { error: CAMPAIGN_MESSAGES.PLATFORM_FILTER_INVALID }).optional(),
  campaignStatus: z.enum(CampaignStatus, { error: CAMPAIGN_MESSAGES.CAMPAIGN_STATUS_FILTER_INVALID }).optional(),
  sort: campaignQuerySortEnum.optional(),
});

export const walletPaymentSchema = z
  .object({
    expectedBudget: budgetField.optional(),
  })
  .optional();

export const bankTransferPaymentSchema = z.object({
  senderProviderName: z
    .string({ error: CAMPAIGN_MESSAGES.SENDER_PROVIDER_REQUIRED })
    .trim()
    .min(2, CAMPAIGN_MESSAGES.SENDER_PROVIDER_REQUIRED)
    .max(CAMPAIGN_FIELD_LIMITS.TITLE_MAX_LENGTH, CAMPAIGN_MESSAGES.SENDER_PROVIDER_MAX_EXCEEDED),
  senderAccountName: z
    .string({ error: CAMPAIGN_MESSAGES.SENDER_ACCOUNT_NAME_REQUIRED })
    .trim()
    .min(2, CAMPAIGN_MESSAGES.SENDER_ACCOUNT_NAME_REQUIRED)
    .max(CAMPAIGN_FIELD_LIMITS.TITLE_MAX_LENGTH, CAMPAIGN_MESSAGES.SENDER_ACCOUNT_NAME_MAX_EXCEEDED),
  transferProofUrl: BuildHttpUrlSchema(CAMPAIGN_MESSAGES.PAYMENT_PROOF_REQUIRED),
  expectedBudget: budgetField.optional(),
  expectedTotalPayable: budgetField.optional(),
});

export const adminVerifyPaymentSchema = z.object({
  action: z.enum(ADMIN_PAYMENT_VERIFY_ACTIONS, { error: CAMPAIGN_MESSAGES.ADMIN_ACTION_INVALID }),
  rejectionReason: z.string().trim().optional(),
});

export type CampaignMaterialItemInput = z.infer<typeof campaignMaterialItemSchema>;
export type CampaignMaterialsInput = z.infer<typeof campaignMaterialsSchema>;
export type CampaignBriefInput = z.infer<typeof campaignBriefSchema>;
export type CampaignEditInput = z.infer<typeof campaignEditSchema>;
export type CampaignQueryInput = z.infer<typeof campaignQuerySchema>;
export type WalletPaymentInput = z.infer<typeof walletPaymentSchema>;
export type BankTransferPaymentInput = z.infer<typeof bankTransferPaymentSchema>;
export type AdminVerifyPaymentInput = z.infer<typeof adminVerifyPaymentSchema>;
