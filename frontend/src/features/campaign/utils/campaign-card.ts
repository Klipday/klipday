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
 * Computes exact remaining percentage based on total budget and allocated/burned budget.
 *
 * @param budget - Total allocated campaign budget.
 * @param allocatedBudget - Currently consumed / allocated budget for creator payouts.
 * @returns An integer percentage between 0 and 100.
 */
export function CalculateBudgetPercentage(
  budget?: number | string | null,
  allocatedBudget?: number | string | null,
): number {
  if (budget == null) {
    return 0;
  }

  const numericBudget = typeof budget === 'string' ? parseFloat(budget) : Number(budget);

  if (isNaN(numericBudget) || numericBudget <= 0) {
    return 0;
  }

  if (allocatedBudget == null || allocatedBudget === 0) {
    return 100;
  }

  const numericAllocated =
    typeof allocatedBudget === 'string' ? parseFloat(allocatedBudget) : Number(allocatedBudget);

  if (isNaN(numericAllocated) || numericAllocated <= 0) {
    return 100;
  }

  const remaining = Math.max(0, numericBudget - numericAllocated);
  const percentage = Math.max(0, Math.min(100, Math.round((remaining / numericBudget) * 100)));

  return percentage;
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
        className: 'text-emerald-500',
      };

    case 'AWAITING_PAYMENT':
      return {
        label: 'Menunggu Pembayaran',
        className: 'text-amber-500',
      };

    case 'IN_REVIEW':
      return {
        label: 'Dalam Review',
        className: 'text-amber-500',
      };

    case 'REVISION':
      return {
        label: 'Perlu Revisi',
        className: 'text-amber-500',
      };

    case 'REJECTED':
      return {
        label: 'Ditolak',
        className: 'text-destructive',
      };

    case 'FINISHED':
      return {
        label: 'Selesai',
        className: 'text-muted-foreground',
      };

    case 'DRAFT':
      return {
        label: 'Draf',
        className: 'text-muted-foreground',
      };

    default:
      return {
        label: 'Lainnya',
        className: 'text-muted-foreground',
      };
  }
}
