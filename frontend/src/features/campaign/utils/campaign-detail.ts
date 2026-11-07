/**
 * Utility functions specific to the Campaign Detail view.
 * Handles countdown calculation, date range formatting, earning calculations,
 * and clipboard copy operations for social media instructions.
 */

/**
 * Calculates remaining active days for a campaign based on its end date.
 *
 * @param endDate - The ISO date string or Date representation of the campaign deadline.
 * @returns Object with remaining day count, expiration flag, and localized label.
 */
export function CalculateDaysRemaining(endDate?: string | null): {
  days: number;
  isExpired: boolean;
  label: string;
} {
  const daysResult = {
    days: 0,
    isExpired: false,
    label: 'Tanpa batas waktu',
  };

  if (!endDate) return daysResult;

  const endMs = new Date(endDate).getTime();
  const nowMs = Date.now();

  if (isNaN(endMs)) {
    daysResult.label = 'Jadwal Invalid';
    return daysResult;
  }

  const diffMs = endMs - nowMs;
  const dayMs = 1000 * 60 * 60 * 24;

  if (diffMs <= 0) {
    daysResult.days = 0;
    daysResult.isExpired = true;
    daysResult.label = 'Periode berakhir';
    return daysResult;
  }

  const daysLeft = Math.ceil(diffMs / dayMs);
  daysResult.label = `${daysLeft} hari lagi`;

  return daysResult;
}

/**
 * Formats campaign start and end dates into an Indonesian localized date range string.
 *
 * @param startDate - The campaign launch date string.
 * @param endDate - The campaign deadline date string.
 * @returns Formatted date range, e.g. "15 Okt 2026 - 15 Nov 2026".
 */
export function FormatDateRangeDisplay(startDate?: string | null, endDate?: string | null): string {
  if (!startDate && !endDate) {
    return 'Fleksibel / Belum ditentukan';
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };

  const formatter = new Intl.DateTimeFormat('id-ID', dateOptions);

  const formattedStart = startDate ? formatter.format(new Date(startDate)) : 'Mulai segera';
  const formattedEnd = endDate ? formatter.format(new Date(endDate)) : 'Selesai otomatis';

  const range = `${formattedStart} – ${formattedEnd}`;
  return range;
}

/**
 * Calculates maximum possible earning for a single clip given CPM and max view cap.
 *
 * @param cpm - Campaign CPM (cost per 1,000 views).
 * @param maxViews - Maximum allowable view count per clip.
 * @returns Calculated maximum IDR earnings per video.
 */
export function CalculateMaxEarningsPerClip(cpm?: number | string | null, maxViews?: number | null): number {
  const numericCpm = typeof cpm === 'string' ? parseFloat(cpm) : (cpm ?? 0);
  const numericMaxViews = maxViews ?? 0;

  if (numericCpm <= 0 || numericMaxViews <= 0) {
    return 0;
  }

  const maxEarnings = Math.round((numericMaxViews / 1000) * numericCpm);
  return maxEarnings;
}

/**
 * Copies a given text string to the user's system clipboard using navigator.clipboard
 * with fallback support for older browser contexts.
 *
 * @param text - The text string to copy.
 * @returns Promise resolving to true if copy succeeded, false otherwise.
 */
export async function CopyTextToClipboard(text: string): Promise<boolean> {
  if (!text) {
    return false;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const success = document.execCommand('copy');
    textArea.remove();

    return success;
  } catch {
    return false;
  }
}
