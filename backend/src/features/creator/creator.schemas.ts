import { z } from 'zod';
import { Category } from '../../generated/prisma/enums.js';
import {
  CREATOR_LIMITS,
  CREATOR_MESSAGES,
  INDONESIAN_PHONE_REGEX,
} from './creator.constants.js';

/**
 * Validates that a date string corresponds to an age of at least 18 years
 * and is not in the future using timezone-safe UTC timestamps.
 *
 * @param dateStr - The ISO or YYYY-MM-DD date string.
 * @returns True if valid and >= 18 years old.
 */
export function ValidateAgeAtLeast18(dateStr: string): boolean {
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
 * Validates Indonesian phone number formats starting with 62 (e.g. 628998732627).
 *
 * @param phoneStr - The raw phone number string.
 * @returns True if valid Indonesian phone number starting with 62.
 */
function ValidateIndonesianPhoneNumber(phoneStr: string): boolean {
  const cleanPhone = phoneStr.replace(/[\s-]/g, '');
  return INDONESIAN_PHONE_REGEX.test(cleanPhone);
}

export const UpdateCreatorProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, CREATOR_MESSAGES.FULL_NAME_REQUIRED)
    .max(CREATOR_LIMITS.MAX_FULL_NAME_LENGTH, CREATOR_MESSAGES.FULL_NAME_TOO_LONG)
    .optional(),
  dateOfBirth: z
    .string()
    .trim()
    .superRefine((val, ctx) => {
      if (!val) {
        return;
      }
      const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(val);
      if (!match) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: CREATOR_MESSAGES.INVALID_DATE_OF_BIRTH,
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
          message: CREATOR_MESSAGES.INVALID_DATE_OF_BIRTH,
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
          message: CREATOR_MESSAGES.FUTURE_DATE_NOT_ALLOWED,
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
          message: CREATOR_MESSAGES.MIN_AGE_REQUIRED,
        });
      }
    })
    .nullable()
    .optional(),
  phoneNumber: z
    .string()
    .trim()
    .refine((val) => !val || ValidateIndonesianPhoneNumber(val), {
      message: CREATOR_MESSAGES.INVALID_PHONE_NUMBER,
    })
    .nullable()
    .optional(),
  location: z
    .string()
    .trim()
    .max(100)
    .nullable()
    .optional(),
  bio: z
    .string()
    .trim()
    .max(CREATOR_LIMITS.MAX_BIO_LENGTH, CREATOR_MESSAGES.BIO_TOO_LONG)
    .nullable()
    .optional(),
  contentCategories: z
    .array(z.nativeEnum(Category))
    .min(CREATOR_LIMITS.MIN_CATEGORIES, CREATOR_MESSAGES.CATEGORY_COUNT_INVALID)
    .max(CREATOR_LIMITS.MAX_CATEGORIES, CREATOR_MESSAGES.CATEGORY_COUNT_INVALID)
    .refine((categories) => new Set(categories).size === categories.length, {
      message: CREATOR_MESSAGES.DUPLICATE_CATEGORIES,
    })
    .optional(),
});

export type UpdateCreatorProfileInput = z.infer<typeof UpdateCreatorProfileSchema>;
