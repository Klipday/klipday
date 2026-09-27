import type { MySubmissionData } from '../types';

/**
 * Calculates the highest wizard step number the creator can navigate to based on current progress.
 *
 * @param submissionData - Current submission and connected social account data.
 * @returns Maximum accessible step number (1 to 4).
 */
export function GetHighestAccessibleSubmissionStepNumber(
  submissionData?: MySubmissionData | null,
): number {
  if (!submissionData) {
    return 1;
  }

  // Step 2 is accessible as long as creator has joined
  let highestStep = 2;

  // Step 3 requires a verified social account
  const isSocialConnected = Boolean(submissionData.socialAccount?.isVerified);
  if (isSocialConnected) {
    highestStep = 3;
  } else {
    return highestStep;
  }

  // Step 4 requires a selected draft video
  const hasSelectedVideo = Boolean(submissionData.submission?.liveVideoUrl);
  if (hasSelectedVideo) {
    highestStep = 4;
  }

  return highestStep;
}

/**
 * Formats seconds into MM:SS display format for timers.
 *
 * @param totalSeconds - Seconds remaining.
 * @returns Padded timer string (e.g. "09:45" or "00:54").
 */
export function FormatTimerSeconds(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainderSeconds = safeSeconds % 60;
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(remainderSeconds).padStart(2, '0');
  return `${paddedMinutes}:${paddedSeconds}`;
}

/**
 * Formats video play/view count into compact metric (e.g. "14.2K" or "1.5M").
 *
 * @param count - Raw integer view count.
 * @returns Compact formatted view string.
 */
export function FormatCompactCount(count?: number | null): string {
  if (count === null || count === undefined) {
    return '0';
  }

  if (count >= 1_000_000) {
    const millions = (count / 1_000_000).toFixed(1);
    return `${millions.replace(/\.0$/, '')}M`;
  }

  if (count >= 1_000) {
    const thousands = (count / 1_000).toFixed(1);
    return `${thousands.replace(/\.0$/, '')}K`;
  }

  return count.toLocaleString('id-ID');
}

/**
 * Formats a submission timestamp into Indonesian localized date string.
 * Example output: "26 Sep 2026, 14:30".
 *
 * @param dateStr - ISO date string representation.
 * @returns Formatted date string or fallback if invalid.
 */
export function FormatSubmissionDate(dateStr?: string | null): string {
  if (!dateStr) {
    return 'Belum tercatat';
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return 'Tanggal invalid';
  }
  const formatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
  return formatted;
}
