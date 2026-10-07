import { CAMPAIGN_WIZARD_STEPS, GetWizardStepPath } from '../config/wizard-steps';
import type { Campaign, WizardStepSlug } from '../types';

/**
 * Checks whether Step 1 (Informasi Dasar) has all mandatory fields filled.
 * Requires title, description, campaignType, campaignCategory, thumbnailUrl,
 * platform, and mainMediaUrl.
 *
 * @param campaign - The campaign entity to evaluate.
 * @returns True if all mandatory Step 1 fields are filled, false otherwise.
 */
export function IsStep1Complete(campaign?: Partial<Campaign> | null): boolean {
  if (!campaign) return false;

  const hasTitle = Boolean(campaign.title && campaign.title.trim() !== '');
  const hasDescription = Boolean(campaign.description && campaign.description.trim() !== '');
  const hasType = Boolean(campaign.campaignType);
  const hasCategory = Boolean(campaign.campaignCategory);
  const hasThumbnail = Boolean(campaign.thumbnailUrl && campaign.thumbnailUrl.trim() !== '');
  const hasPlatform = Boolean(campaign.platform);
  const hasMainMedia = Boolean(campaign.mainMediaUrl && campaign.mainMediaUrl.trim() !== '');

  const isComplete = hasTitle && hasDescription && hasType && hasCategory && hasThumbnail && hasPlatform && hasMainMedia;

  return isComplete;
}

/**
 * Checks whether Step 2 (Materi & Aset) has all mandatory fields filled.
 * Requires at least one active material with valid name, type, and url.
 *
 * @param campaign - The campaign entity to evaluate.
 * @returns True if at least one valid active material exists, false otherwise.
 */
export function IsStep2Complete(campaign?: Partial<Campaign> | null): boolean {
  if (!campaign) return false;

  const activeMaterials = campaign.materials?.filter((material) => material.status !== 'DELETED') ?? [];
  if (activeMaterials.length === 0) return false;

  const allMaterialsValid = activeMaterials.every((material) => {
    const hasName = Boolean(material.name && material.name.trim() !== '');
    const hasType = Boolean(material.type);
    const hasUrl = Boolean(material.url && material.url.trim() !== '');
    return hasName && hasType && hasUrl;
  });

  return allMaterialsValid;
}

/**
 * Checks whether Step 3 (Brief & Panduan) has all mandatory fields filled.
 * Requires the brief to exist with purpose, keyMessage, and callToAction.
 *
 * @param campaign - The campaign entity to evaluate.
 * @returns True if mandatory brief fields are filled, false otherwise.
 */
export function IsStep3Complete(campaign?: Partial<Campaign> | null): boolean {
  if (!campaign || !campaign.brief) return false;

  const brief = campaign.brief;
  const hasPurpose = Boolean(brief.purpose && brief.purpose.trim() !== '');
  const hasKeyMessage = Boolean(brief.keyMessage && brief.keyMessage.trim() !== '');
  const hasCta = Boolean(brief.callToAction && brief.callToAction.trim() !== '');

  const isComplete = hasPurpose && hasKeyMessage && hasCta;
  return isComplete;
}

/**
 * Checks whether Step 4 (Hadiah & Anggaran) has all mandatory fields filled.
 * Requires positive CPM, positive budget (>= CPM), valid min/max views, and valid date range.
 *
 * @param campaign - The campaign entity to evaluate.
 * @returns True if all reward and budget fields are valid, false otherwise.
 */
export function IsStep4Complete(campaign?: Partial<Campaign> | null): boolean {
  if (!campaign) return false;

  const cpmNum = campaign.cpm != null ? Number(campaign.cpm) : 0;
  const budgetNum = campaign.budget != null ? Number(campaign.budget) : 0;
  const minViewsNum = campaign.minViews != null ? Number(campaign.minViews) : 0;
  const maxViewsNum = campaign.maxViews != null ? Number(campaign.maxViews) : 0;

  const hasCpm = cpmNum > 0;
  const hasBudget = budgetNum > 0 && budgetNum >= cpmNum;
  const hasViews = minViewsNum > 0 && maxViewsNum >= minViewsNum;
  const hasDates = Boolean(campaign.startDate && campaign.endDate);

  let hasValidDateOrder = false;
  if (campaign.startDate && campaign.endDate) {
    const start = new Date(campaign.startDate).getTime();
    const end = new Date(campaign.endDate).getTime();
    hasValidDateOrder = !isNaN(start) && !isNaN(end) && end > start;
  }

  const isComplete = hasCpm && hasBudget && hasViews && hasDates && hasValidDateOrder;
  return isComplete;
}

/**
 * Checks whether Step 5 (Review Kampanye) has been completed.
 * Step 5 is considered complete once the campaign has been committed to payment
 * (i.e. campaignStatus has transitioned away from DRAFT or REVISION).
 *
 * @param campaign - The campaign entity to evaluate.
 * @returns True if the campaign review has been committed, false otherwise.
 */
export function IsStep5Complete(campaign?: Partial<Campaign> | null): boolean {
  if (!campaign || !campaign.campaignStatus) return false;

  const isSubmitted = campaign.campaignStatus !== 'DRAFT' && campaign.campaignStatus !== 'REVISION';

  return isSubmitted;
}

/**
 * Checks whether Step 6 (Pembayaran) has been completed.
 * Step 6 is considered complete once payment has been submitted or approved
 * (i.e. campaignStatus has transitioned away from AWAITING_PAYMENT to IN_REVIEW, ACTIVE, etc.).
 *
 * @param campaign - The campaign entity to evaluate.
 * @returns True if payment has been submitted or completed, false otherwise.
 */
export function IsStep6Complete(campaign?: Partial<Campaign> | null): boolean {
  if (!campaign || !campaign.campaignStatus) return false;

  const isPaymentDone =
    campaign.campaignStatus !== 'DRAFT' &&
    campaign.campaignStatus !== 'REVISION' &&
    campaign.campaignStatus !== 'AWAITING_PAYMENT';

  return isPaymentDone;
}

/**
 * Checks whether a specific wizard step number has been completed.
 *
 * @param stepNumber - The step number (1 to 6).
 * @param campaign - The campaign entity to inspect.
 * @returns True if the specified step is completed.
 */
export function IsWizardStepCompleted(stepNumber: number, campaign?: Partial<Campaign> | null): boolean {
  switch (stepNumber) {
    case 1:
      return IsStep1Complete(campaign);
    case 2:
      return IsStep2Complete(campaign);
    case 3:
      return IsStep3Complete(campaign);
    case 4:
      return IsStep4Complete(campaign);
    case 5:
      return IsStep5Complete(campaign);
    case 6:
      return IsStep6Complete(campaign);
    default:
      return false;
  }
}

/**
 * Resolves the highest step number (1 to 6) that the user is currently permitted to access.
 * A user cannot jump ahead to step N unless all previous steps (1 to N-1) are completed.
 *
 * @param campaign - The campaign entity to inspect.
 * @returns Highest accessible step number between 1 and 6.
 */
export function GetHighestAccessibleStepNumber(campaign?: Partial<Campaign> | null): number {
  if (!IsStep1Complete(campaign)) {
    return 1;
  }

  if (!IsStep2Complete(campaign)) {
    return 2;
  }

  if (!IsStep3Complete(campaign)) {
    return 3;
  }

  if (!IsStep4Complete(campaign)) {
    return 4;
  }

  if (campaign?.campaignStatus === 'AWAITING_PAYMENT') {
    return 6;
  }

  if (!IsStep5Complete(campaign)) {
    return 5;
  }

  return 6;
}

/**
 * Checks whether a given target step number is accessible based on campaign progress.
 *
 * @param targetStepNumber - The step number being navigated to (1 to 6).
 * @param campaign - The campaign entity to inspect.
 * @returns True if accessible, false if blocked.
 */
export function IsStepAccessible(targetStepNumber: number, campaign?: Partial<Campaign> | null): boolean {
  const highestAllowed = GetHighestAccessibleStepNumber(campaign);
  const isAllowed = targetStepNumber <= highestAllowed;
  return isAllowed;
}

/**
 * Determines the appropriate wizard step slug for a campaign based on its completion state.
 * Directs the user to the earliest incomplete step, or 'step-6' if awaiting payment.
 *
 * @param campaign - The campaign entity to evaluate.
 * @returns The resolved wizard step slug ('step-1' | 'step-2' | 'step-3' | 'step-4' | 'step-5' | 'step-6').
 */
export function ResolveCampaignWizardStepSlug(campaign?: Partial<Campaign> | null): WizardStepSlug {
  if (campaign?.campaignStatus === 'AWAITING_PAYMENT') {
    return 'step-6';
  }

  const highestStepNumber = GetHighestAccessibleStepNumber(campaign);
  const matchedStep = CAMPAIGN_WIZARD_STEPS.find((step) => step.stepNumber === highestStepNumber);
  const slug = matchedStep?.slug ?? 'step-1';
  return slug;
}

/**
 * Resolves the full URL path for the appropriate wizard step of a campaign.
 *
 * @param campaign - The campaign entity to inspect.
 * @returns The resolved URL path string.
 */
export function ResolveCampaignWizardStepPath(campaign?: Partial<Campaign> | null): string {
  const stepSlug = ResolveCampaignWizardStepSlug(campaign);
  const path = GetWizardStepPath(stepSlug, campaign?.id);
  return path;
}
