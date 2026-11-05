import { DASHBOARD_CATEGORY_MAP, DASHBOARD_MESSAGES } from '../constants';

/**
 * Localizes raw campaign category and industry enum strings into clean, user-facing Indonesian labels.
 * Gracefully handles both uppercase snake_case enums, custom strings, and empty values.
 *
 * @param category - Raw enum or string value (e.g. 'FOOD_BEVERAGE', 'BEAUTY_SKINCARE').
 * @returns Clean, human-readable Indonesian label.
 */
export function GetDashboardCategoryLabel(category?: string | null): string {
  if (!category || !category.trim()) {
    return DASHBOARD_MESSAGES.DEFAULT_CATEGORY_LABEL;
  }

  const trimmedCategory = category.trim();
  const normalizedKey = trimmedCategory.toUpperCase();
  const mappedLabel = DASHBOARD_CATEGORY_MAP[normalizedKey];

  if (mappedLabel) {
    return mappedLabel;
  }

  const formattedFallback = trimmedCategory
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return formattedFallback;
}

/**
 * Formats elapsed wait duration since creation (e.g. "Menunggu 42 mnt", "Menunggu 3 jam").
 *
 * @param date - Creation timestamp.
 * @returns Human-readable waiting label.
 */
export function FormatWaitDuration(date: Date | string): string {
  const timestamp = typeof date === 'string' ? new Date(date).getTime() : date.getTime();
  const diffMs = Math.max(0, Date.now() - timestamp);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `Menunggu ${diffDays} hari`;
  }
  if (diffHours > 0) {
    return `Menunggu ${diffHours} jam`;
  }
  return `Menunggu ${Math.max(1, diffMinutes)} mnt`;
}

/**
 * Formats elapsed relative time ago (e.g. "14 mnt lalu", "2 jam lalu", "3 hari lalu").
 *
 * @param date - Past timestamp.
 * @returns Formatted Indonesian relative time string.
 */
export function FormatTimeAgo(date: Date | string): string {
  const timestamp = typeof date === 'string' ? new Date(date).getTime() : date.getTime();
  const diffMs = Math.max(0, Date.now() - timestamp);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} hari lalu`;
  }
  if (diffHours > 0) {
    return `${diffHours} jam lalu`;
  }
  return `${Math.max(1, diffMinutes)} mnt lalu`;
}

/**
 * Formats large amounts into compact Rupiah millions (e.g. Rp 29,4 jt).
 *
 * @param amount - Raw numeric Rupiah amount.
 * @returns Formatted compact Rupiah string.
 */
export function FormatShortMillionRupiah(amount: number): string {
  if (amount >= 1_000_000) {
    const inMillions = amount / 1_000_000;
    const formatted = inMillions.toLocaleString('id-ID', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return `Rp ${formatted} jt`;
  }
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

/**
 * Computes 2-letter uppercase initials from a name string (e.g. "Rizky Pratama" -> "RP").
 *
 * @param name - Display name or company name.
 * @returns Two capital letters or "?".
 */
export function GetInitials(name?: string | null): string {
  if (!name || !name.trim()) {
    return '?';
  }
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0]?.slice(0, 2).toUpperCase() ?? '?';
  }
  const first = parts[0]?.[0] ?? '';
  const second = parts[1]?.[0] ?? '';
  return `${first}${second}`.toUpperCase();
}

