import { CREATOR_LIMITS } from '../constants';
import type { CreatorProfileFormValues } from '../schemas/creator.schemas';
import type { CreatorProfile, UpdateCreatorProfilePayload } from '../types';

/**
 * Extracts 2-letter uppercase initials from a creator's name.
 *
 * @param name - The full name string.
 * @returns Initials string (e.g. "Rina Putri" -> "RP").
 */
export function GetPersonInitials(name?: string | null): string {
  const cleanName = name?.trim();
  if (!cleanName) {
    return 'CR';
  }

  const words = cleanName.split(/\s+/);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return cleanName.slice(0, 2).toUpperCase();
}

/**
 * Formats a maximum date string (18 years ago today) formatted as YYYY-MM-DD
 * for use as the max attribute on date inputs.
 *
 * @returns Date string formatted as YYYY-MM-DD.
 */
export function GetMaxBirthDateString(): string {
  const today = new Date();
  const thresholdDate = new Date(
    today.getFullYear() - CREATOR_LIMITS.MIN_AGE,
    today.getMonth(),
    today.getDate(),
  );

  const year = thresholdDate.getFullYear();
  const month = String(thresholdDate.getMonth() + 1).padStart(2, '0');
  const day = String(thresholdDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Transforms an existing creator profile record into react-hook-form default values.
 *
 * @param profile - The active creator profile.
 * @returns Form values object.
 */
export function BuildCreatorProfileFormDefaults(
  profile: CreatorProfile,
): CreatorProfileFormValues {
  return {
    fullName: profile.fullName ?? '',
    dateOfBirth: profile.dateOfBirth ?? '',
    phoneNumber: profile.phoneNumber ?? '',
    location: profile.location ?? '',
    bio: profile.bio ?? '',
    contentCategories: profile.contentCategories ?? [],
  };
}

/**
 * Transforms valid form submission values into the backend update DTO payload.
 *
 * @param values - Form submission values.
 * @returns Cleaned payload for backend API mutation.
 */
export function BuildUpdateCreatorPayload(
  values: CreatorProfileFormValues,
): UpdateCreatorProfilePayload {
  return {
    fullName: values.fullName.trim(),
    dateOfBirth: values.dateOfBirth ? values.dateOfBirth.trim() : null,
    phoneNumber: values.phoneNumber ? values.phoneNumber.trim() : null,
    location: values.location ? values.location.trim() : null,
    bio: values.bio ? values.bio.trim() : null,
    contentCategories: values.contentCategories,
  };
}
