import { CampaignStatus } from '../../generated/prisma/enums.js';
import { CPM_VIEW_DIVISOR, FREEZE_REASON, type FreezeReasonType } from './admin.constants.js';
import type {
  FifoCampaignAllocationSummary,
  FifoSubmissionAllocationInput,
  FifoSubmissionAllocationResult,
} from './admin.types.js';

/**
 * Calculates the maximum eligible Rupiah reward for a single video submission
 * based on verified views, campaign minimum/maximum view thresholds, and CPM rate.
 *
 * @param verifiedViews - Current verified view count on the video.
 * @param minViews - Minimum views required before a clip becomes eligible for reward.
 * @param maxViews - Maximum views cap per clip (0 means uncapped).
 * @param cpm - Campaign cost per 1,000 views in Rupiah.
 * @returns Eligible target reward in whole Rupiah.
 */
export function CalculateTargetReward(
  verifiedViews: number,
  minViews: number,
  maxViews: number,
  cpm: number,
): number {
  const safeViews = Math.max(0, Math.floor(verifiedViews));
  const safeMinViews = Math.max(0, Math.floor(minViews));
  const safeMaxViews = Math.max(0, Math.floor(maxViews));
  const safeCpm = Math.max(0, cpm);

  if (safeViews < safeMinViews || safeCpm <= 0) {
    return 0;
  }

  const eligibleViews = safeMaxViews > 0 ? Math.min(safeViews, safeMaxViews) : safeViews;
  const rawReward = (eligibleViews / CPM_VIEW_DIVISOR) * safeCpm;
  const roundedReward = Math.floor(rawReward);

  return Math.max(0, roundedReward);
}

/**
 * Computes FIFO reward allocations across approved campaign submissions.
 * Preserves previously locked incremental earnings first, then distributes any available
 * or freed-up campaign budget (e.g. after a disqualification reshuffle) strictly in FIFO order (#1 -> #N)
 * to submissions that have unpaid eligible views.
 *
 * @param budget - Total campaign budget locked in escrow.
 * @param minViews - Minimum views threshold for the campaign.
 * @param maxViews - Maximum views cap per clip for the campaign.
 * @param cpm - Campaign CPM rate in Rupiah.
 * @param submissions - Approved submissions ordered by `submittedAt ASC, createdAt ASC`.
 * @returns Detailed per-submission allocations, total allocated creator rewards, and unspent brand refund.
 */
export function ComputeCampaignFifoAllocations(
  budget: number,
  minViews: number,
  maxViews: number,
  cpm: number,
  submissions: FifoSubmissionAllocationInput[],
): FifoCampaignAllocationSummary {
  const safeBudget = Math.max(0, Math.floor(budget));
  let remainingBudget = safeBudget;

  // Pass 1: Compute target reward for each clip and preserve valid already-allocated earnings within budget
  const firstPassItems = submissions.map((sub) => {
    const targetEarnings = CalculateTargetReward(sub.verifiedViews, minViews, maxViews, cpm);
    const sanitizedCurrent = Math.max(0, Math.floor(sub.currentEarnings));
    const preservedEarnings = Math.min(sanitizedCurrent, targetEarnings, remainingBudget);
    remainingBudget = Math.max(0, remainingBudget - preservedEarnings);

    const item = {
      id: sub.id,
      verifiedViews: sub.verifiedViews,
      targetEarnings,
      baseEarnings: preservedEarnings,
    };
    return item;
  });

  // Pass 2: Distribute any remaining or reshuffled budget pool strictly in FIFO order (#1 -> #N)
  const allocations: FifoSubmissionAllocationResult[] = firstPassItems.map((item) => {
    const unpaidGap = Math.max(0, item.targetEarnings - item.baseEarnings);
    const additionalAllocation = Math.min(unpaidGap, remainingBudget);
    const allocatedEarnings = item.baseEarnings + additionalAllocation;
    remainingBudget = Math.max(0, remainingBudget - additionalAllocation);

    const unpaidShortfall = Math.max(0, item.targetEarnings - allocatedEarnings);
    const isCappedByBudget = unpaidShortfall > 0;

    const result: FifoSubmissionAllocationResult = {
      id: item.id,
      verifiedViews: item.verifiedViews,
      targetEarnings: item.targetEarnings,
      allocatedEarnings,
      unpaidShortfall,
      isCappedByBudget,
    };
    return result;
  });

  const totalAllocated = Math.max(0, safeBudget - remainingBudget);
  const remainingRefund = remainingBudget;

  const summary: FifoCampaignAllocationSummary = {
    allocations,
    totalAllocated,
    remainingRefund,
  };

  return summary;
}

/**
 * Determines the settlement freeze classification for a campaign based on its lifecycle status,
 * budget consumption, and end date.
 *
 * @param campaignStatus - Current lifecycle status of the campaign.
 * @param budget - Total campaign budget in Rupiah.
 * @param allocatedEarnings - Total allocated/estimated earnings across approved submissions.
 * @param endDate - Campaign expiration timestamp.
 * @param now - Reference current timestamp.
 * @returns Freeze reason enum value.
 */
export function DetermineCampaignFreezeReason(
  campaignStatus: CampaignStatus,
  budget: number,
  allocatedEarnings: number,
  endDate: Date | null,
  now: Date,
): FreezeReasonType {
  if (campaignStatus === CampaignStatus.FINISHED) {
    return FREEZE_REASON.FINISHED;
  }

  if (budget > 0 && allocatedEarnings >= budget) {
    return FREEZE_REASON.BUDGET_FULL;
  }

  if (endDate && endDate.getTime() <= now.getTime()) {
    return FREEZE_REASON.EXPIRED;
  }

  return FREEZE_REASON.ACTIVE_RUNNING;
}

/**
 * Generates a unique transaction reference code for settlement ledger entries (e.g. TXN-XXXXXX-XXXX).
 *
 * @param sequenceIndex - Optional index to disambiguate multiple transactions generated in the same millisecond.
 * @returns Formatted reference code string.
 */
export function GenerateSettlementTransactionRefCode(sequenceIndex = 0): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const indexSuffix = sequenceIndex > 0 ? `-${sequenceIndex}` : '';
  const refCode = `TXN-${timestamp}-${randomSuffix}${indexSuffix}`;
  return refCode;
}
