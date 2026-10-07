import type { StatusTabItem } from '../types';

/**
 * Predefined status tabs for the brand campaigns dashboard.
 * Each tab defines its unique URL key, localized label, and corresponding count key.
 */
export const CAMPAIGN_STATUS_TABS: StatusTabItem[] = [
  { key: 'ACTIVE', label: 'Aktif', countKey: 'ACTIVE' },
  { key: 'AWAITING_PAYMENT', label: 'Menunggu Pembayaran', countKey: 'AWAITING_PAYMENT', alertOnCount: true },
  { key: 'IN_REVIEW', label: 'Menunggu Review', countKey: 'IN_REVIEW' },
  { key: 'REVISION', label: 'Perlu Revisi', countKey: 'REVISION', alertOnCount: true },
  { key: 'FINISHED', label: 'Selesai', countKey: 'FINISHED' },
];
