/**
 * Formats a numeric currency value into Indonesian Rupiah (e.g. Rp 1.500.000).
 *
 * @param amount - Number amount to format.
 * @returns Formatted Rupiah string.
 */
export function FormatRupiah(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeAmount);

  return formatted;
}

/**
 * Formats a numeric value with Indonesian thousand separators (e.g. 1.500.000).
 *
 * @param amount - Number amount to format.
 * @returns Formatted number string.
 */
export function FormatNumber(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat('id-ID').format(safeAmount);
  return formatted;
}

/**
 * Strips non-digit characters from an input string and returns the parsed integer.
 *
 * @param value - Raw formatted string (e.g. "Rp 1.500.000" or "500,000").
 * @returns Parsed integer value.
 */
export function ParseFormattedRupiah(value: string): number {
  const digitsOnly = value.replace(/\D/g, '');
  const parsed = parseInt(digitsOnly, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats an ISO date string or Date object into human-readable Indonesian date and time.
 * (e.g. "12 Okt 2026, 14:30 WIB").
 *
 * @param date - Date object or ISO string.
 * @returns Formatted date string in Indonesian.
 */
export function FormatDateIndonesian(date: string | Date): string {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;

  if (Number.isNaN(parsedDate.getTime())) {
    return '-';
  }

  const formatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsedDate);

  return `${formatted} WIB`;
}
