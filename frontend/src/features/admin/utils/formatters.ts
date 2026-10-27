import type {
  AdminModerationTabItem,
  AdminSettlementTabItem,
  FreezeReasonType,
  ModerationFilterOption,
  SettlementFilterOption,
} from '../types';

export const ADMIN_SETTLEMENT_TABS: AdminSettlementTabItem[] = [
  {
    key: 'NEED_SETTLEMENT',
    label: 'Perlu Settlement',
    countKey: 'needSettlement',
  },
  {
    key: 'BUDGET_FULL',
    label: 'Budget Penuh',
    countKey: 'budgetFull',
  },
  {
    key: 'EXPIRED',
    label: 'Kedaluwarsa',
    countKey: 'expired',
  },
  {
    key: 'FINISHED',
    label: 'Selesai',
    countKey: 'finished',
  },
];

export const VALID_SETTLEMENT_FILTER_KEYS: SettlementFilterOption[] = [
  'NEED_SETTLEMENT',
  'BUDGET_FULL',
  'EXPIRED',
  'FINISHED',
];

export const ADMIN_MODERATION_TABS: AdminModerationTabItem[] = [
  {
    key: 'IN_REVIEW',
    label: 'Perlu Ditinjau',
    countKey: 'inReview',
  },
  {
    key: 'REVISION',
    label: 'Perlu Revisi',
    countKey: 'revision',
  },
  {
    key: 'ACTIVE',
    label: 'Aktif Berjalan',
    countKey: 'active',
  },
  {
    key: 'REJECTED',
    label: 'Ditolak',
    countKey: 'rejected',
  },
  {
    key: 'ALL',
    label: 'Semua',
    countKey: 'all',
  },
];

export const VALID_MODERATION_FILTER_KEYS: ModerationFilterOption[] = [
  'IN_REVIEW',
  'REVISION',
  'ACTIVE',
  'REJECTED',
  'ALL',
];

/**
 * Formats a numeric Rupiah value into Indonesian currency display (`Rp 1.000.000`).
 *
 * @param amount - Rupiah value to format.
 * @returns Formatted Rupiah string.
 */
export function FormatRupiah(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? Math.floor(amount) : 0;
  const formatted = new Intl.NumberFormat('id-ID').format(safeAmount);
  return `Rp ${formatted}`;
}

/**
 * Formats view counts into compact Indonesian notation (e.g. `120K`, `1,2M`, or exact thousands).
 *
 * @param views - View count integer.
 * @returns Formatted string.
 */
export function FormatViewsCount(views: number): string {
  const safeViews = Number.isFinite(views) ? Math.max(0, Math.floor(views)) : 0;
  const formatted = new Intl.NumberFormat('id-ID').format(safeViews);
  return formatted;
}

/**
 * Formats a compact view threshold label (e.g. `10.000` -> `10K`).
 *
 * @param views - View threshold number.
 * @returns Compact view label string.
 */
export function FormatCompactViews(views: number): string {
  const safeViews = Number.isFinite(views) ? Math.max(0, Math.floor(views)) : 0;
  if (safeViews >= 1_000_000) {
    const millions = safeViews / 1_000_000;
    const label = Number.isInteger(millions) ? `${millions}M` : `${millions.toFixed(1)}M`;
    return label;
  }
  if (safeViews >= 1_000) {
    const thousands = safeViews / 1_000;
    const label = Number.isInteger(thousands) ? `${thousands}K` : `${thousands.toFixed(1)}K`;
    return label;
  }
  return String(safeViews);
}

/**
 * Formats an ISO timestamp into a concise Indonesian date and time string (`19 Okt 2026, 09:12`).
 *
 * @param isoDate - ISO date string or null.
 * @returns Formatted date-time string.
 */
export function FormatSubmissionTimestamp(isoDate: string | null): string {
  if (!isoDate) {
    return '-';
  }
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  const formatted = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
  return formatted;
}

/**
 * Resolves the human-readable badge label for a campaign freeze reason.
 *
 * @param freezeReason - Campaign settlement freeze reason.
 * @returns Indonesian badge text.
 */
export function GetFreezeReasonLabel(freezeReason: FreezeReasonType): string {
  if (freezeReason === 'BUDGET_FULL') {
    return 'Budget 100% Terpakai';
  }
  if (freezeReason === 'EXPIRED') {
    return 'Periode Berakhir';
  }
  if (freezeReason === 'FINISHED') {
    return 'Settlement Selesai';
  }
  return 'Siap Audit Settlement';
}
