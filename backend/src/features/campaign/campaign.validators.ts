import { CampaignStatus } from '../../generated/prisma/enums.js';
import { CAMPAIGN_FIELD_LIMITS, CAMPAIGN_MESSAGES } from './campaign.constants.js';
import {
  adminVerifyPaymentSchema,
  bankTransferPaymentSchema,
  campaignEditSchema,
  campaignQuerySchema,
  walletPaymentSchema,
} from './campaign.schemas.js';
import type {
  AdminVerifyPaymentInput,
  BankTransferPaymentInput,
  CampaignEditInput,
  CampaignExistingFields,
  CampaignQueryInput,
  CampaignSubmitCheckRecord,
  WalletPaymentInput,
} from './campaign.types.js';

/**
 * Converts a timestamp to its UTC-midnight epoch milliseconds on the `Asia/Jakarta` (UTC+7) calendar date.
 * Ensures consistent WIB date comparisons regardless of server OS timezone.
 *
 * @param date - Date instance to project into Asia/Jakarta calendar day.
 * @returns Epoch milliseconds representing midnight UTC of that Jakarta calendar date.
 */
function ToJakartaCalendarDayMs(date: Date): number {
  const shiftedMs = date.getTime() + CAMPAIGN_FIELD_LIMITS.JAKARTA_UTC_OFFSET_MS;
  const shiftedDate = new Date(shiftedMs);
  const calendarDayMs = Date.UTC(
    shiftedDate.getUTCFullYear(),
    shiftedDate.getUTCMonth(),
    shiftedDate.getUTCDate(),
  );
  return calendarDayMs;
}

/**
 * Validates the campaign edit request body against the edit schema.
 * Every field is optional: a PATCH carries only the fields of the current
 * wizard step, but at least one known field must be present.
 *
 * @param body - Raw request body (`req.body`).
 * @returns The first validation error message when invalid, otherwise the parsed input.
 */
export function ValidateCampaignEditBody(body: unknown): CampaignEditInput | string {
  const result = campaignEditSchema.safeParse(body);

  if (!result.success) {
    return result.error.issues[0]?.message ?? CAMPAIGN_MESSAGES.INVALID_REQUEST_BODY;
  }

  return result.data;
}

/**
 * Validates reward and pricing rules for campaign edit input.
 * Ensures that maxViews is not less than minViews, budget is not less than CPM,
 * and budget can fund at least one creator reaching minimum views.
 *
 * @param input - The parsed campaign edit input.
 * @param existing - Optional existing campaign fields from the database.
 * @returns An error message string if a rule is violated, otherwise null.
 */
export function ValidateCampaignRewardLogic(input: CampaignEditInput, existing?: CampaignExistingFields): string | null {
  const effectiveMinViews = Number(input.minViews ?? existing?.minViews ?? 0);
  const effectiveMaxViews = Number(input.maxViews ?? existing?.maxViews ?? 0);

  if (effectiveMaxViews < effectiveMinViews) {
    return CAMPAIGN_MESSAGES.REWARD_MAX_LESS_THAN_MIN;
  }

  const effectiveBudget = Number(input.budget ?? existing?.budget ?? 0);
  const effectiveCpm = Number(input.cpm ?? existing?.cpm ?? 0);

  if (effectiveBudget < effectiveCpm) {
    return CAMPAIGN_MESSAGES.REWARD_BUDGET_LESS_THAN_CPM;
  }

  const minRequiredPayout = Math.ceil(
    (effectiveMinViews * effectiveCpm) / CAMPAIGN_FIELD_LIMITS.CPM_VIEW_DIVISOR,
  );

  if (effectiveBudget < minRequiredPayout) {
    return CAMPAIGN_MESSAGES.REWARD_BUDGET_BELOW_MIN_PAYOUT;
  }

  return null;
}

/**
 * Validates campaign schedule and date rules for edit input using Asia/Jakarta calendar days.
 * Merges incoming partial dates with existing campaign dates, allows unchanged past startDate
 * for approved paid REVISION campaigns, and ensures endDate is both in the future and after startDate.
 *
 * @param input - The parsed campaign edit input.
 * @param existing - Optional existing campaign fields from the database.
 * @returns An error message string if a rule is violated, otherwise null.
 */
export function ValidateCampaignDateLogic(input: CampaignEditInput, existing?: CampaignExistingFields): string | null {
  const hasDateUpdate = input.startDate !== undefined || input.endDate !== undefined;
  if (!hasDateUpdate) {
    return null;
  }

  const rawStartDate = input.startDate ?? existing?.startDate;
  const rawEndDate = input.endDate ?? existing?.endDate;
  const todayDayMs = ToJakartaCalendarDayMs(new Date());

  if (rawStartDate) {
    const effectiveStartDate = new Date(rawStartDate);
    if (Number.isNaN(effectiveStartDate.getTime())) {
      return CAMPAIGN_MESSAGES.START_DATE_REQUIRED;
    }

    const startDayMs = ToJakartaCalendarDayMs(effectiveStartDate);
    const existingStartDayMs = existing?.startDate
      ? ToJakartaCalendarDayMs(new Date(existing.startDate))
      : null;

    const isPaidRevisionUnchangedStart =
      existing?.campaignStatus === CampaignStatus.REVISION &&
      Boolean(existing?.isPaymentApproved) &&
      existingStartDayMs !== null &&
      startDayMs === existingStartDayMs;

    if (!isPaidRevisionUnchangedStart && startDayMs < todayDayMs) {
      return CAMPAIGN_MESSAGES.DATE_START_PAST;
    }
  }

  if (rawEndDate) {
    const effectiveEndDate = new Date(rawEndDate);
    if (Number.isNaN(effectiveEndDate.getTime())) {
      return CAMPAIGN_MESSAGES.END_DATE_REQUIRED;
    }

    if (rawStartDate) {
      const effectiveStartDate = new Date(rawStartDate);
      if (effectiveEndDate.getTime() <= effectiveStartDate.getTime()) {
        return CAMPAIGN_MESSAGES.DATE_END_BEFORE_START;
      }
    }

    const endDayMs = ToJakartaCalendarDayMs(effectiveEndDate);
    if (endDayMs <= todayDayMs) {
      return CAMPAIGN_MESSAGES.DATE_END_PAST;
    }
  }

  return null;
}

/**
 * Validates campaign completeness across all 4 creation wizard steps
 * before allowing final submission for review.
 *
 * @param campaign - The campaign entity with active materials and brief relations.
 * @returns Error string message if incomplete, or null if complete and valid.
 */
export function ValidateCampaignSubmitCompleteness(campaign: CampaignSubmitCheckRecord): string | null {
  // Step 1: Basic Info
  const hasTitle = Boolean(campaign.title && campaign.title.trim() !== '');
  const hasDesc = Boolean(campaign.description && campaign.description.trim() !== '');
  const hasThumb = Boolean(campaign.thumbnailUrl && campaign.thumbnailUrl.trim() !== '');
  const hasMedia = Boolean(campaign.mainMediaUrl && campaign.mainMediaUrl.trim() !== '');
  const hasType = Boolean(campaign.campaignType);
  const hasCat = Boolean(campaign.campaignCategory);
  const hasPlat = Array.isArray(campaign.platforms) && campaign.platforms.length > 0;

  if (!hasTitle || !hasDesc || !hasThumb || !hasMedia || !hasType || !hasCat || !hasPlat) {
    return CAMPAIGN_MESSAGES.STEP_1_INCOMPLETE;
  }

  // Step 2: Materials & Assets
  const activeMaterials = campaign.materials?.filter((item) => item.status === 'ACTIVE') ?? [];

  if (activeMaterials.length === 0) {
    return CAMPAIGN_MESSAGES.STEP_2_NO_MATERIALS;
  }

  const allMaterialsValid = activeMaterials.every((item) => {
    const hasName = Boolean(item.name && item.name.trim() !== '');
    const hasItemType = Boolean(item.type);
    const hasUrl = Boolean(item.url && item.url.trim() !== '');
    return hasName && hasItemType && hasUrl;
  });

  if (!allMaterialsValid) {
    return CAMPAIGN_MESSAGES.STEP_2_INVALID_MATERIALS;
  }

  // Step 3: Brief & Guidelines
  const brief = campaign.brief;
  if (!brief) {
    return CAMPAIGN_MESSAGES.STEP_3_NO_BRIEF;
  }

  const hasPurpose = Boolean(brief.purpose && brief.purpose.trim() !== '');
  const hasKeyMsg = Boolean(brief.keyMessage && brief.keyMessage.trim() !== '');
  const hasCta = Boolean(brief.callToAction && brief.callToAction.trim() !== '');

  if (!hasPurpose || !hasKeyMsg || !hasCta) {
    return CAMPAIGN_MESSAGES.STEP_3_INCOMPLETE_BRIEF;
  }

  // Step 4: Reward & Budget
  const cpm = campaign.cpm != null ? Number(campaign.cpm) : 0;
  const budget = campaign.budget != null ? Number(campaign.budget) : 0;
  const minViews = campaign.minViews != null ? Number(campaign.minViews) : 0;
  const maxViews = campaign.maxViews != null ? Number(campaign.maxViews) : 0;

  if (cpm < CAMPAIGN_FIELD_LIMITS.MIN_CPM_VALUE) {
    return CAMPAIGN_MESSAGES.STEP_4_INVALID_CPM;
  }

  if (budget <= 0 || budget < cpm) {
    return CAMPAIGN_MESSAGES.STEP_4_INVALID_BUDGET;
  }

  if (minViews <= 0 || maxViews < minViews) {
    return CAMPAIGN_MESSAGES.STEP_4_INVALID_VIEWS;
  }

  const minRequiredPayout = Math.ceil(
    (minViews * cpm) / CAMPAIGN_FIELD_LIMITS.CPM_VIEW_DIVISOR,
  );

  if (budget < minRequiredPayout) {
    return CAMPAIGN_MESSAGES.REWARD_BUDGET_BELOW_MIN_PAYOUT;
  }

  if (!campaign.startDate || !campaign.endDate) {
    return CAMPAIGN_MESSAGES.STEP_4_NO_DATES;
  }

  const startDate = new Date(campaign.startDate).getTime();
  const endDate = new Date(campaign.endDate).getTime();

  if (Number.isNaN(startDate) || Number.isNaN(endDate) || endDate <= startDate) {
    return CAMPAIGN_MESSAGES.STEP_4_INVALID_DATES;
  }

  if (endDate <= Date.now()) {
    return CAMPAIGN_MESSAGES.DATE_END_PAST;
  }

  return null;
}

/**
 * Validates the query parameters for retrieving the campaigns list.
 * Validates page, limit, keyword search, filters (category, type, platform, status),
 * and sorting strategy.
 *
 * @param query - Raw query object from `req.query`.
 * @returns The parsed and typed `CampaignQueryInput` or an error message string when validation fails.
 */
export function ValidateCampaignQuery(query: unknown): CampaignQueryInput | string {
  const parseResult = campaignQuerySchema.safeParse(query);

  if (!parseResult.success) {
    const firstIssue = parseResult.error.issues[0];
    const errorMessage = firstIssue?.message ?? CAMPAIGN_MESSAGES.INVALID_QUERY_PARAMS;
    return errorMessage;
  }

  return parseResult.data;
}

/**
 * Validates the optional wallet payment confirmation payload (`expectedBudget`).
 *
 * @param body - Raw request body from `req.body`.
 * @returns Parsed `WalletPaymentInput` or a validation error string when invalid.
 */
export function ValidateWalletPaymentBody(body: unknown): WalletPaymentInput | string {
  const parseResult = walletPaymentSchema.safeParse(body);

  if (!parseResult.success) {
    const firstIssue = parseResult.error.issues[0];
    const errorMessage = firstIssue?.message ?? CAMPAIGN_MESSAGES.INVALID_REQUEST_BODY;
    return errorMessage;
  }

  return parseResult.data;
}

/**
 * Validates the manual bank transfer payment confirmation payload.
 *
 * @param body - Raw request body from `req.body`.
 * @returns The parsed `BankTransferPaymentInput` or an error message string when invalid.
 */
export function ValidateBankTransferPaymentBody(body: unknown): BankTransferPaymentInput | string {
  const parseResult = bankTransferPaymentSchema.safeParse(body);

  if (!parseResult.success) {
    const firstIssue = parseResult.error.issues[0];
    const errorMessage = firstIssue?.message ?? CAMPAIGN_MESSAGES.INVALID_REQUEST_BODY;
    return errorMessage;
  }

  return parseResult.data;
}

/**
 * Validates the admin payment verification action payload.
 * Requires rejectionReason if action is 'REJECT'.
 *
 * @param body - Raw request body from `req.body`.
 * @returns The parsed `AdminVerifyPaymentInput` or an error message string when invalid.
 */
export function ValidateAdminVerifyPaymentBody(body: unknown): AdminVerifyPaymentInput | string {
  const parseResult = adminVerifyPaymentSchema.safeParse(body);

  if (!parseResult.success) {
    const firstIssue = parseResult.error.issues[0];
    const errorMessage = firstIssue?.message ?? CAMPAIGN_MESSAGES.INVALID_REQUEST_BODY;
    return errorMessage;
  }

  if (parseResult.data.action === 'REJECT' && (!parseResult.data.rejectionReason || parseResult.data.rejectionReason.trim() === '')) {
    return CAMPAIGN_MESSAGES.REJECTION_REASON_REQUIRED;
  }

  return parseResult.data;
}

