import type { CampaignStatusBadgeConfig } from '../types';
import { FormatNumber, FormatRupiah } from './campaign-reward';

/**
 * Formats a CPM numeric value into a clean Rupiah currency representation without fractional decimals.
 *
 * @param cpm - Raw CPM value from campaign data (number, string, or null).
 * @returns Formatted CPM string, e.g. "Rp 2.000" or "Rp 0".
 */
export function FormatCpmDisplay(cpm?: number | string | null): string {
  if (cpm == null) {
    return 'Rp 0';
  }

  const numericValue = typeof cpm === 'string' ? parseFloat(cpm) : cpm;

  if (isNaN(numericValue) || numericValue <= 0) {
    return 'Rp 0';
  }

  const formatted = FormatRupiah(numericValue);
  return formatted;
}

/**
 * Formats joined creators count with thousands separators (e.g. 14.515 or 426).
 *
 * @param count - Total submissions count.
 * @returns Formatted count string.
 */
export function FormatJoinedCount(count?: number | null): string {
  if (count == null || isNaN(count) || count < 0) {
    return '0';
  }

  const formatted = FormatNumber(count);

  return formatted;
}

/**
 * Calculates remaining budget percentage for the campaign card progress bar.
 * Currently defaults to 100% for active funded campaigns or 0% when empty.
 *
 * @param budget - Total allocated campaign budget.
 * @returns An integer percentage between 0 and 100.
 */
export function CalculateBudgetPercentage(budget?: number | string | null): number {
  if (budget == null) {
    return 0;
  }

  const numericBudget = typeof budget === 'string' ? parseFloat(budget) : budget;

  if (isNaN(numericBudget) || numericBudget <= 0) {
    return 0;
  }

  // TODO: Until dynamic payout tracking is integrated, funded campaigns start at 100%
  return 100;
}

/**
 * Maps raw category enum keys to compact, modern badge labels matching the card visual design.
 *
 * @param category - Raw campaign category key (e.g. 'ENTERTAINMENT', 'BEAUTY_SKINCARE').
 * @returns Compact category label for badge display.
 */
export function GetCampaignCategoryBadgeLabel(category?: string | null): string {
  if (!category) {
    return 'OTHER';
  }

  const categoryMap: Record<string, string> = {
    BEAUTY_SKINCARE: 'BEAUTY',
    FASHION_STYLE: 'FASHION',
    FOOD_BEVERAGE: 'FOOD & BEVERAGE',
    HEALTH_FITNESS: 'HEALTH',
    TECHNOLOGY_GADGETS: 'TECH',
    LIFESTYLE: 'LIFESTYLE',
    GAMING: 'GAMING',
    TRAVEL: 'TRAVEL',
    ENTERTAINMENT: 'ENTERTAINMENT',
    EDUCATION: 'EDUCATION',
    OTHER: 'OTHER',
  };

  const label = categoryMap[category] ?? category.replace(/_/g, ' ');

  return label;
}

/**
 * Maps campaign type enums to high-contrast badge text (e.g. 'CLIPPING', 'UGC', 'PRODUCT').
 *
 * @param type - Raw campaign type key.
 * @returns Uppercase type label for thumbnail badge.
 */
export function GetCampaignTypeBadgeLabel(type?: string | null): string {
  if (!type) {
    return 'CLIPPING';
  }

  const typeMap: Record<string, string> = {
    PRODUCT: 'PRODUCT',
    SERVICE: 'SERVICE',
    CONTENT: 'CLIPPING',
    UGC: 'UGC',
  };

  const label = typeMap[type] ?? type.toUpperCase();

  return label;
}

/**
 * Resolves lifecycle status configuration (label and refined color styles) for brand campaign cards.
 *
 * @param status - Raw campaign status string (e.g. 'DRAFT', 'ACTIVE', 'IN_REVIEW').
 * @returns Status badge configuration containing label and CSS classes.
 */
export function GetCampaignStatusBadge(status?: string | null): CampaignStatusBadgeConfig {
  switch (status) {
    case 'ACTIVE':
      return {
        label: 'Aktif',
        className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      };

    case 'AWAITING_PAYMENT':
      return {
        label: 'Menunggu Pembayaran',
        className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      };

    case 'IN_REVIEW':
      return {
        label: 'Dalam Review',
        className: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      };

    case 'REVISION':
      return {
        label: 'Perlu Revisi',
        className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      };

    case 'REJECTED':
      return {
        label: 'Ditolak',
        className: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      };

    case 'FINISHED':
      return {
        label: 'Selesai',
        className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
      };

    case 'DRAFT':
      return {
        label: 'Draf',
        className: 'bg-zinc-800/80 text-zinc-300 border-zinc-700/50',
      };

    default:
      return {
        label: 'Lainnya',
        className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
      };
  }
}
