import { z } from 'zod';
import {
  BRAND_LIMITS,
  BRAND_MESSAGES,
  PROVIDER_ACCOUNT_RULES,
} from '../constants';

export const BrandProfileFormSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(BRAND_LIMITS.MIN_COMPANY_NAME_LENGTH, BRAND_MESSAGES.COMPANY_NAME_MIN)
    .max(BRAND_LIMITS.MAX_COMPANY_NAME_LENGTH, BRAND_MESSAGES.COMPANY_NAME_MAX),
  industry: z
    .enum([
      'E_COMMERCE',
      'FOOD_AND_BEVERAGE',
      'FASHION_AND_BEAUTY',
      'TECHNOLOGY',
      'FINANCE',
      'HEALTH_AND_WELLNESS',
      'ENTERTAINMENT',
      'EDUCATION',
      'TRAVEL_AND_HOSPITALITY',
      'OTHER',
    ])
    .nullable()
    .optional(),
  location: z
    .string()
    .trim()
    .max(BRAND_LIMITS.MAX_LOCATION_LENGTH, BRAND_MESSAGES.LOCATION_MAX)
    .nullable()
    .optional(),
  website: z
    .string()
    .trim()
    .url(BRAND_MESSAGES.INVALID_WEBSITE_FORMAT)
    .or(z.literal(''))
    .nullable()
    .optional(),
  description: z
    .string()
    .trim()
    .max(BRAND_LIMITS.MAX_DESCRIPTION_LENGTH, BRAND_MESSAGES.DESCRIPTION_MAX)
    .nullable()
    .optional(),
  instagramHandle: z
    .string()
    .trim()
    .max(BRAND_LIMITS.MAX_SOCIAL_HANDLE_LENGTH, BRAND_MESSAGES.INSTAGRAM_HANDLE_MAX)
    .nullable()
    .optional(),
  tiktokHandle: z
    .string()
    .trim()
    .max(BRAND_LIMITS.MAX_SOCIAL_HANDLE_LENGTH, BRAND_MESSAGES.TIKTOK_HANDLE_MAX)
    .nullable()
    .optional(),
  xHandle: z
    .string()
    .trim()
    .max(BRAND_LIMITS.MAX_SOCIAL_HANDLE_LENGTH, BRAND_MESSAGES.X_HANDLE_MAX)
    .nullable()
    .optional(),
  threadsHandle: z
    .string()
    .trim()
    .max(BRAND_LIMITS.MAX_SOCIAL_HANDLE_LENGTH, BRAND_MESSAGES.THREADS_HANDLE_MAX)
    .nullable()
    .optional(),
  youtubeChannel: z
    .string()
    .trim()
    .max(BRAND_LIMITS.MAX_YOUTUBE_LENGTH, BRAND_MESSAGES.YOUTUBE_CHANNEL_MAX)
    .nullable()
    .optional(),
});

export type BrandProfileFormValues = z.infer<typeof BrandProfileFormSchema>;

export const PayoutAccountFormSchema = z
  .object({
    accountType: z.enum(['BANK_TRANSFER', 'E_WALLET']),
    provider: z
      .string()
      .trim()
      .min(BRAND_LIMITS.MIN_PROVIDER_LENGTH, BRAND_MESSAGES.PROVIDER_REQUIRED),
    accountNumber: z
      .string()
      .trim()
      .min(BRAND_LIMITS.MIN_ACCOUNT_NUMBER_LENGTH, BRAND_MESSAGES.ACCOUNT_NUMBER_MIN)
      .max(BRAND_LIMITS.MAX_ACCOUNT_NUMBER_LENGTH, BRAND_MESSAGES.ACCOUNT_NUMBER_MAX)
      .regex(/^[0-9]+$/, BRAND_MESSAGES.ACCOUNT_NUMBER_NUMERIC),
    accountHolderName: z
      .string()
      .trim()
      .min(BRAND_LIMITS.MIN_ACCOUNT_HOLDER_LENGTH, BRAND_MESSAGES.ACCOUNT_HOLDER_MIN)
      .max(BRAND_LIMITS.MAX_ACCOUNT_HOLDER_LENGTH, BRAND_MESSAGES.ACCOUNT_HOLDER_MAX),
    proofUrl: z.string().url(BRAND_MESSAGES.PROOF_URL_REQUIRED),
    isPrimary: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const providerRule = PROVIDER_ACCOUNT_RULES[data.provider.toUpperCase().trim()];
    if (providerRule && !providerRule.regex.test(data.accountNumber.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['accountNumber'],
        message: providerRule.description,
      });
    }
  });

export type PayoutAccountFormValues = z.infer<typeof PayoutAccountFormSchema>;
