import type { ChangeEvent } from 'react';
import type { RewardFormValues } from '../schemas';
import type { Campaign, CampaignProjections } from '../types';

/**
 * Formats a Date object or date string into an HTML date input format (YYYY-MM-DD)
 * aligned to the Asia/Jakarta (WIB) calendar date so local selections do not shift by 1 day.
 *
 * @param date - The Date or ISO string to format.
 * @returns Formatted YYYY-MM-DD date string or empty string if invalid.
 */
export function FormatDateForInput(date?: string | Date | null): string {
  if (!date) return '';
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
    return date.trim();
  }
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return '';
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
  return formatted;
}

/**
 * Calculates a default start date (today) and end date (30 days from today) formatted as YYYY-MM-DD.
 *
 * @returns An object containing default startDate and endDate strings.
 */
export function GetDefaultCampaignDates(): { startDate: string; endDate: string } {
  const now = new Date();
  const startDate = FormatDateForInput(now);

  const thirtyDaysLater = new Date(now);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  const endDate = FormatDateForInput(thirtyDaysLater);

  const dates = { startDate, endDate };
  return dates;
}

/**
 * Maps campaign entity data into clean form values for Step 4 (Reward & Budget).
 * Defaults critical financial and threshold fields to 0 and dates to empty strings,
 * ensuring intentional configuration by the brand rather than arbitrary prefilled values.
 * Handles Prisma Decimal strings for cpm and budget, as well as Date string parsing.
 *
 * @param campaign - Partial campaign entity retrieved from the backend.
 * @returns Clean form values conforming to RewardFormValues.
 */
export function GetInitialReward(campaign?: Partial<Campaign> | null): RewardFormValues {
  const cpm = campaign?.cpm != null ? Number(campaign.cpm) : 0;
  const minViews = campaign?.minViews != null ? Number(campaign.minViews) : 0;
  const maxViews = campaign?.maxViews != null ? Number(campaign.maxViews) : 0;
  const maxSubmissionsPerPlatform =
    campaign?.maxSubmissionsPerPlatform === undefined ? 1 : campaign.maxSubmissionsPerPlatform;
  const budget = campaign?.budget != null ? Number(campaign.budget) : 0;
  const startDate = campaign?.startDate ? FormatDateForInput(campaign.startDate) : '';
  const endDate = campaign?.endDate ? FormatDateForInput(campaign.endDate) : '';

  const initialValues: RewardFormValues = {
    cpm,
    minViews,
    maxViews,
    maxSubmissionsPerPlatform,
    budget,
    startDate,
    endDate,
  };

  return initialValues;
}

/**
 * Calculates live projections and metrics for brand feedback:
 * - Total estimated views across all clips based on budget and CPM.
 * - Maximum reward potential per single video capped by maxViews.
 * - Minimum number of fully funded viral videos possible within total budget.
 * - Campaign active duration in days.
 *
 * @param values - Partial or active form values containing cpm, minViews, maxViews, budget, startDate, endDate.
 * @returns Calculated projection metrics.
 */
export function CalculateCampaignProjections(values: Partial<RewardFormValues>): CampaignProjections {
  const cpm = Number(values.cpm) || 0;
  const maxViews = Number(values.maxViews) || 0;
  const budget = Number(values.budget) || 0;

  const totalEstimatedViews = cpm > 0 && budget > 0 ? Math.floor((budget / cpm) * 1000) : 0;
  const maxEarningsPerVideo = maxViews > 0 && cpm > 0 ? Math.floor((maxViews * cpm) / 1000) : 0;
  const minFundedVideos = maxEarningsPerVideo > 0 && budget > 0 ? Math.floor(budget / maxEarningsPerVideo) : 0;

  let durationDays = 0;
  if (values.startDate && values.endDate) {
    const startMs = new Date(values.startDate).getTime();
    const endMs = new Date(values.endDate).getTime();
    if (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs) {
      durationDays = Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24));
    }
  }

  const projections: CampaignProjections = {
    totalEstimatedViews,
    maxEarningsPerVideo,
    minFundedVideos,
    durationDays,
  };

  return projections;
}

/**
 * Formats a numeric value as Indonesian Rupiah (IDR) currency.
 *
 * @param value - The number to format.
 * @returns Formatted currency string (e.g. "Rp 5.000.000").
 */
export function FormatRupiah(value?: number | null): string {
  if (value == null || isNaN(value)) return 'Rp 0';
  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  });
  const formatted = formatter.format(value);
  return formatted;
}

/**
 * Formats a numeric value with thousands separators.
 *
 * @param value - The number to format.
 * @returns Formatted number string (e.g. "50.000").
 */
export function FormatNumber(value?: number | null): string {
  if (value == null || isNaN(value)) return '0';
  const formatter = new Intl.NumberFormat('id-ID');
  const formatted = formatter.format(value);
  return formatted;
}

/**
 * Formats a number for text input display with Indonesian thousands separators (dot).
 * Returns an empty string if value is null, undefined, 0, or NaN so placeholders display cleanly.
 *
 * @param value - The numeric value to format.
 * @returns Formatted number string (e.g. "10.000", "5.000.000") or empty string.
 */
export function FormatNumberForInput(value?: number | null): string {
  if (value == null || isNaN(value) || value === 0) return '';
  const formatted = FormatNumber(value);
  return formatted;
}

/**
 * Parses a numeric input string that may contain thousands delimiters (dots, commas, or spaces)
 * into a clean integer number.
 *
 * @param value - The raw string input to parse.
 * @returns Clean integer number, or 0 if empty/invalid.
 */
export function ParseFormattedNumber(value: string): number {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 0;
  const parsed = Number(digits);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Handles change events for formatted numeric text inputs by stripping non-digit delimiters
 * and passing the clean parsed integer to the field's onChange callback.
 *
 * @param onChange - The form field onChange callback from react-hook-form.
 * @param event - The React change event from the input element.
 */
export function HandleFormattedNumberChange(onChange: (...event: unknown[]) => void, event: ChangeEvent<HTMLInputElement>): void {
  const parsed = ParseFormattedNumber(event.target.value);
  onChange(parsed);
}
