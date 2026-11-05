/**
 * Formats an ISO date string into natural Indonesian relative time (e.g. "5 mnt lalu", "1 jam lalu", "Kemarin").
 *
 * @param dateString - ISO timestamp.
 * @returns Human-friendly relative time string.
 */
export function FormatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Baru saja';
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} mnt lalu`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} jam lalu`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'Kemarin';
  }
  if (diffInDays < 7) {
    return `${diffInDays} hari lalu`;
  }
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Translates a notification category enum value into clean Indonesian text.
 *
 * @param category - Category enum string.
 * @returns Localized category name.
 */
export function FormatCategoryLabel(category: string): string {
  switch (category) {
    case 'CAMPAIGN':
      return 'Kampanye';
    case 'SUBMISSION':
      return 'Submission';
    case 'FINANCE':
      return 'Keuangan';
    case 'ACCOUNT':
      return 'Akun';
    case 'SYSTEM':
    default:
      return 'Sistem';
  }
}
