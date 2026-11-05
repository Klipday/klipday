import type {
  AdminKycAccountType,
  AdminKycFilter,
  AdminKycRoleOption,
  AdminKycTabItem,
  AdminModerationTabItem,
  AdminSettlementTabItem,
  AdminTopUpStatusFilter,
  AdminTopUpTabItem,
  AdminWithdrawalFilter,
  AdminWithdrawalTabItem,
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

export const ADMIN_TOPUP_TABS: AdminTopUpTabItem[] = [
  {
    key: 'SUBMITTED',
    label: 'Perlu Verifikasi',
    countKey: 'submitted',
  },
  {
    key: 'PENDING',
    label: 'Menunggu Transfer',
    countKey: 'pending',
  },
  {
    key: 'APPROVED',
    label: 'Disetujui',
    countKey: 'approved',
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

export const VALID_TOPUP_FILTER_KEYS: AdminTopUpStatusFilter[] = [
  'SUBMITTED',
  'PENDING',
  'APPROVED',
  'REJECTED',
  'ALL',
];

export const ADMIN_WITHDRAWAL_TABS: AdminWithdrawalTabItem[] = [
  {
    key: 'PENDING',
    label: 'Perlu Diproses',
    countKey: 'pending',
  },
  {
    key: 'CANCELLATION',
    label: 'Pengajuan Batal',
    countKey: 'cancellation',
  },
  {
    key: 'APPROVED',
    label: 'Selesai Ditransfer',
    countKey: 'approved',
  },
  {
    key: 'REJECTED',
    label: 'Ditolak / Batal',
    countKey: 'rejected',
  },
  {
    key: 'ALL',
    label: 'Semua',
    countKey: 'all',
  },
];

export const VALID_WITHDRAWAL_FILTER_KEYS: AdminWithdrawalFilter[] = [
  'PENDING',
  'CANCELLATION',
  'APPROVED',
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

export const ADMIN_KYC_TABS: AdminKycTabItem[] = [
  {
    key: 'PENDING',
    label: 'Perlu Verifikasi',
    countKey: 'pending',
  },
  {
    key: 'VERIFIED',
    label: 'Terverifikasi',
    countKey: 'verified',
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

export const VALID_KYC_FILTER_KEYS: AdminKycFilter[] = [
  'PENDING',
  'VERIFIED',
  'REJECTED',
  'ALL',
];

export const ADMIN_KYC_ROLE_OPTIONS: AdminKycRoleOption[] = [
  { key: 'ALL', label: 'Semua Role' },
  { key: 'CREATOR', label: 'Kreator' },
  { key: 'BRAND', label: 'Brand' },
];

/**
 * Resolves the human-readable Indonesian label for a payout account type.
 *
 * @param accountType - Payout account type ('BANK_TRANSFER' or 'E_WALLET').
 * @returns Indonesian display label.
 */
export function GetKycAccountTypeLabel(accountType: AdminKycAccountType): string {
  if (accountType === 'E_WALLET') {
    return 'E-Wallet';
  }
  return 'Transfer Bank';
}

/**
 * Resolves the human-readable Indonesian label for an account role.
 *
 * @param role - Account role string ('CREATOR', 'BRAND', or 'ADMIN').
 * @returns Indonesian role label.
 */
export function GetKycRoleLabel(role: string): string {
  if (role === 'CREATOR') {
    return 'Kreator';
  }
  if (role === 'BRAND') {
    return 'Brand';
  }
  return 'Admin';
}

/**
 * Checks whether the submitted bank/e-wallet holder name differs from the registered profile name
 * (ignoring casing and extra whitespace) so admins can spot third-party account mismatches quickly.
 *
 * @param profileDisplayName - Registered Creator full name or Brand company name.
 * @param accountHolderName - Submitted account holder name on passbook or e-wallet.
 * @returns True when the normalized names do not match.
 */
export function IsAccountHolderNameMismatch(
  profileDisplayName: string,
  accountHolderName: string,
): boolean {
  const normalizedProfile = profileDisplayName.trim().replace(/\s+/g, ' ').toLowerCase();
  const normalizedHolder = accountHolderName.trim().replace(/\s+/g, ' ').toLowerCase();
  const isMismatch = normalizedProfile !== normalizedHolder;
  return isMismatch;
}

/**
 * Validates that a URL uses an explicit `http:` or `https:` protocol before rendering it
 * in `<img src>` or external `<a href>` attributes (preventing `javascript:` or `data:` XSS).
 *
 * @param rawUrl - Candidate URL string from payout account proof or avatar record.
 * @returns True only when `rawUrl` parses as an `http:` or `https:` URL.
 */
export function IsSafeHttpUrl(rawUrl: string | null | undefined): boolean {
  if (!rawUrl) {
    return false;
  }

  const trimmed = rawUrl.trim();
  if (trimmed.length === 0) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    const isHttpProtocol = parsed.protocol === 'http:' || parsed.protocol === 'https:';
    return isHttpProtocol;
  } catch {
    return false;
  }
}

/**
 * Extracts 2-character uppercase initials from a Creator or Brand display name for circular avatars.
 *
 * @param displayName - Registered Creator full name or Brand company name.
 * @returns Uppercase initials (defaults to `'KY'` when blank).
 */
export function GetKycUserInitials(displayName: string): string {
  const trimmed = displayName.trim();
  if (trimmed.length === 0) {
    return 'KY';
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    const twoWordInitials = `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return twoWordInitials;
  }

  const singleWordInitials = trimmed.slice(0, 2).toUpperCase();
  return singleWordInitials;
}


