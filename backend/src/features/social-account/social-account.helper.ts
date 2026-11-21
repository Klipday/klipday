import { SOCIAL_ACCOUNT_SWITCH_COOLDOWN_MS } from './social-account.constants.js';
import type { SocialAccountSwitchCooldown } from './social-account.types.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Generates a random uppercase verification code in the format KD-XXXX.
 * Uses an alphanumeric character pool excluding ambiguous characters (I, O, 0, 1).
 *
 * @returns Formatted 7-character verification code string (e.g. 'KD-AB3X').
 */
export function GenerateVerificationCode(): string {
  // cspell:disable-next-line
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomSegment = '';

  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomSegment += characters[randomIndex];
  }

  return `KD-${randomSegment}`;
}

/**
 * Computes whether a creator is eligible to switch their connected TikTok account
 * based on the 30-day cooldown starting from the current account's `verifiedAt` timestamp.
 *
 * @param verifiedAt - Verification timestamp of the creator's currently active account.
 * @returns Cooldown eligibility, next available ISO timestamp, and remaining days.
 */
export function CalculateAccountSwitchCooldown(
  verifiedAt?: Date | null,
): SocialAccountSwitchCooldown {
  if (!verifiedAt) {
    return {
      canSwitchAccount: true,
      nextSwitchAvailableAt: null,
      remainingDays: 0,
    };
  }

  const nextAvailableMs = verifiedAt.getTime() + SOCIAL_ACCOUNT_SWITCH_COOLDOWN_MS;
  const remainingMs = nextAvailableMs - Date.now();

  if (remainingMs <= 0) {
    return {
      canSwitchAccount: true,
      nextSwitchAvailableAt: null,
      remainingDays: 0,
    };
  }

  const remainingDays = Math.ceil(remainingMs / MS_PER_DAY);
  const nextSwitchAvailableAt = new Date(nextAvailableMs).toISOString();

  return {
    canSwitchAccount: false,
    nextSwitchAvailableAt,
    remainingDays,
  };
}

/**
 * Formats an ISO timestamp into a concise localized Indonesian date string (e.g. "21 Des 2026").
 *
 * @param isoDate - ISO date string representing when the next account switch is allowed.
 * @returns Human-readable Indonesian date string.
 */
export function FormatCooldownDateId(isoDate: string): string {
  const parsedDate = new Date(isoDate);
  const formatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate);

  return formatted;
}
