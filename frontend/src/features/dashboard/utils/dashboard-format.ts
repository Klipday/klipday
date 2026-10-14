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
