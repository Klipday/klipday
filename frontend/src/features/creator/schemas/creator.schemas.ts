import { z } from 'zod';
import {
  CREATOR_LIMITS,
  CREATOR_UI_MESSAGES,
  INDONESIAN_PHONE_REGEX,
} from '../constants';
import type { CreatorCategory } from '../types';

const CATEGORY_VALUES = [
  'BEAUTY_SKINCARE',
  'FASHION_STYLE',
  'FOOD_BEVERAGE',
  'HEALTH_FITNESS',
  'TECHNOLOGY_GADGETS',
  'LIFESTYLE',
  'GAMING',
  'TRAVEL',
  'ENTERTAINMENT',
  'OTHER',
] as const satisfies readonly CreatorCategory[];

/**
 * Validates that the birthdate is at least 18 years prior to today and not in the future
 * using timezone-safe UTC timestamps.
 *
 * @param dateStr - YYYY-MM-DD string.
 * @returns True if creator is at least 18 years old.
 */
export function ValidateAgeAtLeast18(dateStr?: string | null): boolean {
  if (!dateStr) {
    return false;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!match) {
    return false;
  }
  const birthYear = Number(match[1]);
  const birthMonth = Number(match[2]) - 1;
  const birthDay = Number(match[3]);
  const birthTimestamp = Date.UTC(birthYear, birthMonth, birthDay);

  if (Number.isNaN(birthTimestamp)) {
    return false;
  }

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();
  const currentDay = now.getUTCDate();
  const currentTimestamp = Date.UTC(currentYear, currentMonth, currentDay);

  if (birthTimestamp > currentTimestamp) {
    return false;
  }

  const minAgeTimestamp = Date.UTC(
    currentYear - CREATOR_LIMITS.MIN_AGE,
    currentMonth,
    currentDay,
  );

  return birthTimestamp <= minAgeTimestamp;
}

/**
 * Validates Indonesian telephone format starting with 62 (e.g. 628932627112).
 *
 * @param phoneStr - Raw phone string.
 * @returns True if valid Indonesian phone starting with 62.
 */
function ValidateIndonesianPhoneNumber(phoneStr?: string | null): boolean {
  if (!phoneStr) {
    return true; // Optional field
  }
  const cleanPhone = phoneStr.replace(/[\s-]/g, '');
  return INDONESIAN_PHONE_REGEX.test(cleanPhone);
}

export const CreatorProfileFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Nama lengkap sesuai KTP wajib diisi')
    .max(CREATOR_LIMITS.MAX_FULL_NAME_LENGTH, `Nama lengkap maksimal ${CREATOR_LIMITS.MAX_FULL_NAME_LENGTH} karakter`),
  dateOfBirth: z
    .string()
    .trim()
    .min(1, 'Tanggal lahir wajib diisi')
    .superRefine((val, ctx) => {
      const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(val);
      if (!match) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Format tanggal lahir tidak valid',
        });
        return;
      }
      const birthYear = Number(match[1]);
      const birthMonth = Number(match[2]) - 1;
      const birthDay = Number(match[3]);
      const birthTimestamp = Date.UTC(birthYear, birthMonth, birthDay);

      if (Number.isNaN(birthTimestamp)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Format tanggal lahir tidak valid',
        });
        return;
      }

      const now = new Date();
      const currentYear = now.getUTCFullYear();
      const currentMonth = now.getUTCMonth();
      const currentDay = now.getUTCDate();
      const currentTimestamp = Date.UTC(currentYear, currentMonth, currentDay);

      if (birthTimestamp > currentTimestamp) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tanggal lahir tidak boleh berada di masa depan',
        });
        return;
      }

      const minAgeTimestamp = Date.UTC(
        currentYear - CREATOR_LIMITS.MIN_AGE,
        currentMonth,
        currentDay,
      );

      if (birthTimestamp > minAgeTimestamp) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Usia kreator harus minimal 18 tahun untuk dapat berpartisipasi',
        });
      }
    }),
  phoneNumber: z
    .string()
    .trim()
    .refine(ValidateIndonesianPhoneNumber, {
      message: CREATOR_UI_MESSAGES.INVALID_PHONE_NUMBER,
    })
    .nullable()
    .optional(),
  location: z.string().trim().optional(),
  bio: z
    .string()
    .trim()
    .max(CREATOR_LIMITS.MAX_BIO_LENGTH, `Bio maksimal ${CREATOR_LIMITS.MAX_BIO_LENGTH} karakter`)
    .optional(),
  contentCategories: z
    .array(z.enum(CATEGORY_VALUES))
    .min(CREATOR_LIMITS.MIN_CATEGORIES, 'Pilih minimal 1 kategori niche konten')
    .max(CREATOR_LIMITS.MAX_CATEGORIES, 'Maksimal 3 kategori niche konten'),
});

export type CreatorProfileFormValues = z.infer<typeof CreatorProfileFormSchema>;
