import type { Prisma } from '../../generated/prisma/client.js';
import { CampaignStatus, Role } from '../../generated/prisma/enums.js';
import {
  ADMIN_KYC_SELECT,
  ADMIN_TOPUP_SELECT,
  ADMIN_WITHDRAWAL_SELECT,
  CPM_SEN_DIVISOR,
  FREEZE_REASON,
  SEN_PER_RUPIAH,
  type FreezeReasonType,
} from './admin.constants.js';
import type {
  AdminKycItemDto,
  AdminTopUpItemDto,
  AdminWithdrawalItemDto,
  FifoCampaignAllocationSummary,
  FifoSubmissionAllocationInput,
  FifoSubmissionAllocationResult,
} from './admin.types.js';

/**
 * Calculates the maximum eligible Rupiah reward for a single video submission
 * based on verified views, campaign minimum/maximum view thresholds, and CPM rate.
 * Uses exact BigInt Sen-scaled integer division to prevent IEEE-754 off-by-1-Rupiah rounding drift.
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
  if (!Number.isFinite(verifiedViews) || !Number.isFinite(cpm)) {
    return 0;
  }

  const safeViews = Math.max(0, Math.floor(verifiedViews));
  const safeMinViews = Number.isFinite(minViews) ? Math.max(0, Math.floor(minViews)) : 0;
  const safeMaxViews = Number.isFinite(maxViews) ? Math.max(0, Math.floor(maxViews)) : 0;
  const cpmInSen = Math.round(Math.max(0, cpm) * SEN_PER_RUPIAH);

  if (safeViews < safeMinViews || cpmInSen <= 0) {
    return 0;
  }

  const eligibleViews = safeMaxViews > 0 ? Math.min(safeViews, safeMaxViews) : safeViews;
  const targetRewardBigInt = (BigInt(eligibleViews) * BigInt(cpmInSen)) / CPM_SEN_DIVISOR;
  const roundedReward = Number(targetRewardBigInt);

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
 * @param submissions - Approved submissions ordered by `submittedAt ASC, createdAt ASC, id ASC`.
 * @returns Detailed per-submission allocations, total allocated creator rewards, and unspent brand refund.
 */
export function ComputeCampaignFifoAllocations(
  budget: number,
  minViews: number,
  maxViews: number,
  cpm: number,
  submissions: FifoSubmissionAllocationInput[],
): FifoCampaignAllocationSummary {
  const safeBudget = Number.isFinite(budget) ? Math.max(0, Math.floor(budget)) : 0;
  let remainingBudget = safeBudget;

  // Pass 1: Compute target reward for each clip and preserve valid already-allocated earnings within budget
  const firstPassItems = submissions.map((sub) => {
    const targetEarnings = CalculateTargetReward(sub.verifiedViews, minViews, maxViews, cpm);
    const sanitizedCurrent = Number.isFinite(sub.currentEarnings)
      ? Math.max(0, Math.floor(sub.currentEarnings))
      : 0;
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

export type AdminTopUpRecordFromDb = Prisma.TopUpRequestGetPayload<{
  select: typeof ADMIN_TOPUP_SELECT;
}>;

/**
 * Maps a Prisma top-up database record selected with ADMIN_TOPUP_SELECT into a strictly-typed AdminTopUpItemDto.
 * Ensures numerical amounts are cast from Prisma.Decimal to numbers.
 *
 * @param record - Top-up record from database.
 * @returns Serialized AdminTopUpItemDto contract.
 */
export function MapAdminTopUpToDto(record: AdminTopUpRecordFromDb): AdminTopUpItemDto {
  const item: AdminTopUpItemDto = {
    id: record.id,
    referenceCode: record.referenceCode,
    walletId: record.wallet.id,
    amount: Number(record.amount),
    uniqueCode: record.uniqueCode,
    totalPayable: Number(record.totalPayable),
    destinationBank: record.destinationBank,
    destinationAccount: record.destinationAccount,
    destinationHolderName: record.destinationHolderName,
    senderBank: record.senderBank,
    senderAccountName: record.senderAccountName,
    transferProofUrl: record.transferProofUrl,
    status: record.status,
    rejectionReason: record.rejectionReason,
    verifiedAt: record.verifiedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    brand: {
      id: record.wallet.account.brand?.id ?? '',
      companyName: record.wallet.account.brand?.companyName ?? 'Brand',
      logoUrl: record.wallet.account.brand?.logoUrl ?? null,
      email: record.wallet.account.email,
    },
  };

  return item;
}

export type AdminWithdrawalRecordFromDb = Prisma.PayoutRequestGetPayload<{
  select: typeof ADMIN_WITHDRAWAL_SELECT;
}>;

/**
 * Maps a Prisma payout request record selected with ADMIN_WITHDRAWAL_SELECT into a strictly-typed AdminWithdrawalItemDto.
 * Converts numerical amounts from Prisma.Decimal to numbers, normalizes requester profile (Brand vs Creator),
 * and structures the payout destination account snapshot.
 *
 * @param record - Payout request database record.
 * @returns Serialized AdminWithdrawalItemDto contract.
 */
export function MapAdminWithdrawalToDto(
  record: AdminWithdrawalRecordFromDb,
): AdminWithdrawalItemDto {
  const account = record.wallet.account;
  const isBrand = account.role === Role.BRAND;
  const displayName = isBrand
    ? (account.brand?.companyName || 'Brand')
    : (account.creator?.fullName || 'Kreator');
  const avatarUrl = isBrand
    ? (account.brand?.logoUrl ?? null)
    : (account.creator?.avatarUrl ?? null);

  const item: AdminWithdrawalItemDto = {
    id: record.id,
    referenceCode: record.referenceCode,
    walletId: record.walletId,
    amount: Number(record.amount),
    accountProvider: record.accountProvider,
    accountNumber: record.accountNumber,
    accountHolderName: record.accountHolderName,
    payoutStatus: record.payoutStatus,
    rejectionReason: record.rejectionReason,
    transferProofUrl: record.transferProofUrl,
    adminNote: record.adminNote,
    cancellationRequestedAt: record.cancellationRequestedAt,
    cancellationReason: record.cancellationReason,
    processedAt: record.processedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    user: {
      id: account.id,
      email: account.email,
      role: account.role,
      displayName,
      avatarUrl,
    },
    payoutAccount: record.payoutAccount
      ? {
          id: record.payoutAccount.id,
          accountType: record.payoutAccount.accountType,
          provider: record.payoutAccount.provider,
          accountNumber: record.payoutAccount.accountNumber,
          accountHolderName: record.payoutAccount.accountHolderName,
          proofUrl: record.payoutAccount.proofUrl,
          verificationStatus: record.payoutAccount.verificationStatus,
        }
      : null,
  };

  return item;
}

export type AdminKycRecordFromDb = Prisma.BrandPayoutAccountGetPayload<{
  select: typeof ADMIN_KYC_SELECT;
}>;

/**
 * Maps a Prisma payout account record selected with ADMIN_KYC_SELECT into a strictly-typed AdminKycItemDto.
 * Normalizes requester profile attributes (displayName, phoneNumber, avatarUrl) across Brand and Creator roles.
 *
 * @param record - Payout account database record with nested wallet and account profile.
 * @returns Serialized AdminKycItemDto contract.
 */
export function MapAdminKycToDto(record: AdminKycRecordFromDb): AdminKycItemDto {
  const account = record.wallet.account;
  const isBrand = account.role === Role.BRAND;
  const displayName = isBrand
    ? (account.brand?.companyName || 'Brand')
    : (account.creator?.fullName || 'Kreator');
  const phoneNumber = isBrand
    ? (account.brand?.phoneNumber ?? null)
    : (account.creator?.phoneNumber ?? null);
  const avatarUrl = isBrand
    ? (account.brand?.logoUrl ?? null)
    : (account.creator?.avatarUrl ?? null);

  const item: AdminKycItemDto = {
    id: record.id,
    walletId: record.walletId,
    accountType: record.accountType,
    provider: record.provider,
    accountNumber: record.accountNumber,
    accountHolderName: record.accountHolderName,
    proofUrl: record.proofUrl,
    isPrimary: record.isPrimary,
    verificationStatus: record.verificationStatus,
    rejectionReason: record.rejectionReason,
    verifiedAt: record.verifiedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    user: {
      id: account.id,
      email: account.email,
      role: account.role,
      displayName,
      phoneNumber,
      avatarUrl,
    },
  };

  return item;
}

/**
 * Computes alternative Indonesian phone/e-wallet number representations (`08...` <-> `628...`)
 * when an admin searches by phone or e-wallet number, bridging normalized `628...` profile phones
 * with `08...` or `628...` e-wallet account numbers.
 *
 * @param rawSearch - Trimmed search query entered by the admin.
 * @returns Array of distinct normalized phone variants (excluding `rawSearch` itself).
 */
export function BuildKycPhoneSearchVariants(rawSearch: string): string[] {
  const sanitized = rawSearch.replace(/[\s+-]/g, '');
  const variants = new Set<string>();

  if (/^08\d+$/.test(sanitized)) {
    variants.add(sanitized);
    variants.add(`62${sanitized.slice(1)}`);
  } else if (/^628\d+$/.test(sanitized)) {
    variants.add(sanitized);
    variants.add(`0${sanitized.slice(2)}`);
  }

  variants.delete(rawSearch);
  const result = Array.from(variants);
  return result;
}

/**
 * Determines whether a payout account holder name differs significantly from the profile's registered name.
 * Normalizes strings by lowercasing, trimming, and stripping punctuation and company prefixes.
 *
 * @param holderName - Account holder name on passbook or e-wallet profile.
 * @param profileName - Registered brand company name or creator full name.
 * @returns True if there is a likely mismatch between holder and profile name.
 */
export function CheckHolderNameMismatch(holderName: string, profileName: string): boolean {
  const cleanHolder = holderName.toLowerCase().replace(/^(pt|cv)\.?\s+/i, '').replace(/[^a-z0-9]/g, '');
  const cleanProfile = profileName.toLowerCase().replace(/^(pt|cv)\.?\s+/i, '').replace(/[^a-z0-9]/g, '');

  if (!cleanHolder || !cleanProfile) {
    return false;
  }

  if (
    cleanHolder === cleanProfile ||
    cleanHolder.includes(cleanProfile) ||
    cleanProfile.includes(cleanHolder)
  ) {
    return false;
  }

  // Token-based matching: handles reordered words (e.g. "Santoso Budi" vs "Budi Santoso")
  const holderTokens = holderName
    .toLowerCase()
    .replace(/^(pt|cv)\.?\s+/i, '')
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
  const profileTokens = profileName
    .toLowerCase()
    .replace(/^(pt|cv)\.?\s+/i, '')
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);

  const hasSharedSignificantToken = holderTokens.some((ht) =>
    profileTokens.some((pt) => ht === pt || ht.includes(pt) || pt.includes(ht)),
  );

  if (hasSharedSignificantToken) {
    return false;
  }

  return true;
}

