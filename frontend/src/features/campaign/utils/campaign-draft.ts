import { CAMPAIGN_WIZARD_STEPS } from '../config/wizard-steps';
import type { Campaign, CampaignCardItem, DraftStepProgress } from '../types';
import { GetHighestAccessibleStepNumber } from './wizard-navigation';

/**
 * Formats a draft's ISO timestamp string into a friendly Indonesian localized date and time representation.
 * Example output: "16 Sep 2026, 10:30".
 *
 * @param dateString - The raw ISO date string to format.
 * @returns Formatted date string or '-' fallback if undefined or invalid.
 */
export function FormatDraftDate(dateString?: string | null): string {
  if (!dateString) {
    return '-';
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return '-';
  }

  const formatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedDate = formatter.format(date);
  return formattedDate;
}

/**
 * Calculates the current accessible wizard step progress for a given draft campaign item.
 * Evaluates completion criteria and returns the accessible step number, title, and badge text.
 *
 * @param draft - The draft campaign item to inspect.
 * @returns An object containing the step number, title, and formatted badge string.
 */
export function GetDraftStepProgress(draft?: Partial<CampaignCardItem> | null): DraftStepProgress {
  const stepNumber = GetHighestAccessibleStepNumber(draft as Partial<Campaign>);
  const matchedStep = CAMPAIGN_WIZARD_STEPS.find((step) => step.stepNumber === stepNumber);
  const stepTitle = matchedStep?.title ?? 'Informasi Dasar';
  const totalSteps = CAMPAIGN_WIZARD_STEPS.length;
  const stepBadgeText = `Langkah ${stepNumber} dari ${totalSteps}: ${stepTitle}`;

  const progressResult: DraftStepProgress = {
    stepNumber,
    stepTitle,
    stepBadgeText,
  };

  return progressResult;
}
