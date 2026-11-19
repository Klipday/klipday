import { z } from 'zod';
import { Industry, PayoutAccountType } from '../../generated/prisma/enums.js';
import {
  BRAND_LIMITS,
  BRAND_MESSAGES,
  INDONESIAN_PHONE_REGEX,
  PROVIDER_ACCOUNT_RULES,
} from './brand.constants.js';

export const UpdateBrandProfileSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(BRAND_LIMITS.MIN_COMPANY_NAME_LENGTH, BRAND_MESSAGES.COMPANY_NAME_MIN_LENGTH)
    .max(BRAND_LIMITS.MAX_COMPANY_NAME_LENGTH, BRAND_MESSAGES.COMPANY_NAME_MAX_LENGTH)
    .optional(),
  phoneNumber: z
    .string()
    .trim()
    .refine((val) => !val || INDONESIAN_PHONE_REGEX.test(val.replace(/[\s-]/g, '')), {
      message: BRAND_MESSAGES.INVALID_PHONE_NUMBER,
    })
    .nullable()
    .optional(),
  industry: z.nativeEnum(Industry).nullable().optional(),
  location: z
    .string()
    .trim()
    .max(BRAND_LIMITS.MAX_LOCATION_LENGTH, BRAND_MESSAGES.LOCATION_MAX_LENGTH)
    .nullable()
    .optional(),
  website: z
    .string()
    .trim()
    .url(BRAND_MESSAGES.INVALID_WEBSITE_URL)
    .or(z.literal(''))
    .nullable()
    .optional(),
  description: z
    .string()
    .trim()
    .max(BRAND_LIMITS.MAX_DESCRIPTION_LENGTH, BRAND_MESSAGES.DESCRIPTION_MAX_LENGTH)
    .nullable()
    .optional(),
  instagramHandle: z
    .string()
    .trim()
    .max(BRAND_LIMITS.MAX_SOCIAL_HANDLE_LENGTH, BRAND_MESSAGES.INSTAGRAM_HANDLE_MAX_LENGTH)
    .nullable()
    .optional(),
  tiktokHandle: z
    .string()
    .trim()
    .max(BRAND_LIMITS.MAX_SOCIAL_HANDLE_LENGTH, BRAND_MESSAGES.TIKTOK_HANDLE_MAX_LENGTH)
    .nullable()
    .optional(),
  xHandle: z
    .string()
    .trim()
    .max(BRAND_LIMITS.MAX_SOCIAL_HANDLE_LENGTH, BRAND_MESSAGES.X_HANDLE_MAX_LENGTH)
    .nullable()
    .optional(),
  threadsHandle: z
    .string()
    .trim()
    .max(BRAND_LIMITS.MAX_SOCIAL_HANDLE_LENGTH, BRAND_MESSAGES.THREADS_HANDLE_MAX_LENGTH)
    .nullable()
    .optional(),
  youtubeChannel: z
    .string()
    .trim()
    .max(BRAND_LIMITS.MAX_YOUTUBE_LENGTH, BRAND_MESSAGES.YOUTUBE_CHANNEL_MAX_LENGTH)
    .nullable()
    .optional(),
});

export type UpdateBrandProfileInput = z.infer<typeof UpdateBrandProfileSchema>;

/**
 * Validates that a KYC proof URL uses HTTPS and does not target loopback, link-local, or private network hosts.
 *
 * @param rawUrl - Candidate proof URL string.
 * @returns True if the URL is a safe HTTPS proof URL.
 */
export function IsSafeHttpsProofUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host.endsWith('.local') ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^169\.254\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export const CreateBrandPayoutAccountSchema = z
  .object({
    accountType: z.nativeEnum(PayoutAccountType),
    provider: z
      .string()
      .trim()
      .min(BRAND_LIMITS.MIN_PROVIDER_LENGTH, BRAND_MESSAGES.PROVIDER_REQUIRED),
    accountNumber: z
      .string()
      .trim()
      .min(BRAND_LIMITS.MIN_ACCOUNT_NUMBER_LENGTH, BRAND_MESSAGES.ACCOUNT_NUMBER_INVALID)
      .max(BRAND_LIMITS.MAX_ACCOUNT_NUMBER_LENGTH, BRAND_MESSAGES.ACCOUNT_NUMBER_INVALID),
    accountHolderName: z
      .string()
      .trim()
      .min(BRAND_LIMITS.MIN_ACCOUNT_HOLDER_LENGTH, BRAND_MESSAGES.ACCOUNT_HOLDER_REQUIRED)
      .max(BRAND_LIMITS.MAX_ACCOUNT_HOLDER_LENGTH, BRAND_MESSAGES.ACCOUNT_HOLDER_REQUIRED),
    proofUrl: z
      .string()
      .url(BRAND_MESSAGES.PROOF_URL_REQUIRED)
      .refine(IsSafeHttpsProofUrl, { message: BRAND_MESSAGES.PROOF_URL_REQUIRED }),
    isPrimary: z.boolean().optional().default(false),
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

export type CreateBrandPayoutAccountInput = z.infer<typeof CreateBrandPayoutAccountSchema>;
