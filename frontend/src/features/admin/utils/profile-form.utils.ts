import type {
  AdminChangePasswordFormValues,
  AdminProfileFormValues,
} from '../schemas/admin-profile.schemas';
import type { AdminProfileDto } from '../types';

/**
 * Builds normalized default values for the administrator profile info form.
 *
 * @param profile - Active administrator profile DTO from the API.
 * @returns Initial form values matching `AdminProfileFormSchema`.
 */
export function GetAdminProfileFormDefaults(profile: AdminProfileDto): AdminProfileFormValues {
  const defaults: AdminProfileFormValues = {
    fullName: profile.fullName,
  };
  return defaults;
}

/**
 * Builds clean initial values for the administrator password change form.
 *
 * @returns Empty password form state matching `AdminChangePasswordFormSchema`.
 */
export function GetChangePasswordFormDefaults(): AdminChangePasswordFormValues {
  const defaults: AdminChangePasswordFormValues = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };
  return defaults;
}

/**
 * Derives up to two uppercase initials from an administrator's full name.
 *
 * @param fullName - The administrator's full name.
 * @returns Two-character uppercase initials fallback string (`AD` if blank).
 */
export function GetAdminInitials(fullName?: string | null): string {
  const cleaned = fullName?.trim();
  if (!cleaned) {
    return 'AD';
  }

  const words = cleaned.split(/\s+/);
  if (words.length >= 2) {
    const initials = `${words[0][0]}${words[1][0]}`.toUpperCase();
    return initials;
  }

  const singleInitials = cleaned.slice(0, 2).toUpperCase();
  return singleInitials;
}

/**
 * Formats an ISO timestamp string into a concise Indonesian calendar date (`23 Nov 2026`).
 *
 * @param isoDate - ISO 8601 date string.
 * @returns Localized Indonesian short date, or `'-'` when invalid.
 */
export function FormatAdminJoinedDate(isoDate: string): string {
  const parsedDate = new Date(isoDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return '-';
  }

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate);
  return formattedDate;
}
