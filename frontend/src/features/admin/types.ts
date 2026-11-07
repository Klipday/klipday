import type { Campaign } from '@/features/campaign/types';
import type { SubmissionStatus } from '@/features/submission/types';

export type CampaignCategory = string;
export type CampaignType = 'PRODUCT' | 'SERVICE' | 'CONTENT' | string;
export type CampaignStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'REVISION'
  | 'REJECTED'
  | 'ACTIVE'
  | 'FINISHED';

export type SettlementFilterOption =
  | 'NEED_SETTLEMENT'
  | 'BUDGET_FULL'
  | 'EXPIRED'
  | 'FINISHED';

export type FreezeReasonType =
  | 'BUDGET_FULL'
  | 'EXPIRED'
  | 'FINISHED'
  | 'ACTIVE_RUNNING';

export interface AdminSettlementQueryParams {
  filter?: SettlementFilterOption;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminSettlementCountsDto {
  needSettlement: number;
  budgetFull: number;
  expired: number;
  finished: number;
}

export interface AdminSettlementCampaignCardDto {
  id: string;
  title: string;
  campaignCategory: CampaignCategory;
  campaignType: CampaignType;
  campaignStatus: CampaignStatus;
  thumbnailUrl: string | null;
  cpm: number;
  minViews: number;
  maxViews: number;
  budget: number;
  allocatedEarnings: number;
  verifiedEarnings: number;
  remainingRefund: number;
  freezeReason: FreezeReasonType;
  approvedSubmissionsCount: number;
  verifiedSubmissionsCount: number;
  disqualifiedSubmissionsCount: number;
  endDate: string | null;
  createdAt: string;
  brand: {
    id: string;
    companyName: string;
    logoUrl: string | null;
  };
}

export interface AdminSettlementCampaignsPaginatedDto {
  items: AdminSettlementCampaignCardDto[];
  counts: AdminSettlementCountsDto;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminFifoSubmissionItemDto {
  id: string;
  fifoOrder: number | null;
  creatorId: string;
  creatorName: string;
  creatorAvatarUrl: string | null;
  socialUsername: string | null;
  liveVideoUrl: string | null;
  thumbnailUrl: string | null;
  videoCaption: string | null;
  submissionStatus: SubmissionStatus;
  reviewNote: string | null;
  verifiedViews: number;
  allocatedEarnings: number;
  targetEarnings: number;
  unpaidShortfall: number;
  isCappedByBudget: boolean;
  lastMetricsSyncedAt?: string | null;
  syncFailureStreak?: number;
  lastSyncError?: string | null;
  isFlaggedUnavailable?: boolean;
  submittedAt: string | null;
  createdAt: string;
}

export interface AdminCampaignSettlementSummaryDto {
  campaignId: string;
  title: string;
  campaignStatus: CampaignStatus;
  freezeReason: FreezeReasonType;
  cpm: number;
  minViews: number;
  maxViews: number;
  budget: number;
  allocatedCreatorRewards: number;
  verifiedCreatorRewards: number;
  brandRefundAmount: number;
  canFinalize: boolean;
  pendingReviewCount: number;
  approvedCount: number;
  verifiedCount: number;
  disqualifiedCount: number;
  flaggedSubmissionsCount?: number;
  lastMetricsSyncedAt?: string | null;
  finalSnapshotSyncedAt?: string | null;
  endDate: string | null;
  brand: {
    id: string;
    companyName: string;
    logoUrl: string | null;
  };
  submissions: AdminFifoSubmissionItemDto[];
}

export interface ManualMetricsSyncResponseDto {
  acquiredLock: boolean;
  run: {
    id: string;
    triggerSource: string;
    cronStatus: string;
    durationMs: number | null;
    campaignsEvaluated: number;
    campaignsSynced: number;
    campaignsSkippedFrozen: number;
    submissionsScraped: number;
    submissionsUpdated: number;
    submissionsFailed: number;
    totalViewsDelta: number;
    totalAllocatedDelta: number;
    errorMessage: string | null;
    createdAt: string;
  };
}

export interface DisqualifySettlementSubmissionPayload {
  submissionId: string;
  campaignId: string;
  reviewNote?: string;
}

export interface UpdateSettlementSubmissionViewsPayload {
  submissionId: string;
  campaignId: string;
  verifiedViews: number;
}

export interface AdminSettlementTabItem {
  key: SettlementFilterOption;
  label: string;
  countKey: keyof AdminSettlementCountsDto;
}

export interface AdminSettlementTabsProps {
  counts?: AdminSettlementCountsDto;
  className?: string;
}

export interface AdminSettlementCardProps {
  campaign: AdminSettlementCampaignCardDto;
}

export interface AdminSettlementsSkeletonProps {
  count?: number;
}

export interface AdminSettlementsEmptyStateProps {
  activeFilter: SettlementFilterOption;
  searchQuery: string;
  onResetFilters: () => void;
}

export interface AdminSettlementsErrorStateProps {
  message: string;
  onRetry: () => void;
}

export interface AdminCampaignSettlementViewProps {
  campaignId?: string;
  className?: string;
}

export interface AdminFifoSubmissionRowProps {
  submission: AdminFifoSubmissionItemDto;
  isSettled: boolean;
  isDisqualifying: boolean;
  onRequestDisqualify: (submission: AdminFifoSubmissionItemDto) => void;
}

export interface AdminDisqualifySubmissionDialogProps {
  submission: AdminFifoSubmissionItemDto | null;
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reviewNote: string) => void;
}

export interface AdminFinalizeSettlementDialogProps {
  summary: AdminCampaignSettlementSummaryDto;
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export type ModerationFilterOption =
  | 'IN_REVIEW'
  | 'REVISION'
  | 'ACTIVE'
  | 'REJECTED'
  | 'ALL';

export type ModerationActionType =
  | 'APPROVE'
  | 'REVISION'
  | 'REJECT_PAYMENT'
  | 'REJECT_CAMPAIGN';

export interface AdminModerationQueryParams {
  filter?: ModerationFilterOption;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminModerationCountsDto {
  inReview: number;
  revision: number;
  active: number;
  rejected: number;
  all: number;
}

export interface AdminModerationTabItem {
  key: ModerationFilterOption;
  label: string;
  countKey: keyof AdminModerationCountsDto;
}


export interface AdminModerationPaymentDto {
  id: string;
  amount: number;
  uniqueCode: number;
  totalPayable: number;
  destinationBank: string;
  destinationAccount: string;
  senderProviderName: string | null;
  senderAccountName: string | null;
  transferProofUrl: string | null;
  paymentStatus: string;
  verifiedAt: string | null;
  isWalletPayment: boolean;
}

export interface AdminModerationCampaignCardDto {
  id: string;
  title: string;
  campaignCategory: CampaignCategory;
  campaignType: CampaignType;
  campaignStatus: CampaignStatus;
  thumbnailUrl: string | null;
  cpm: number;
  minViews: number;
  maxViews: number;
  budget: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  adminNote: string | null;
  materialsCount: number;
  isBriefComplete: boolean;
  isFeatured?: boolean;
  featuredOrder?: number | null;
  brand: {
    id: string;
    companyName: string;
    logoUrl: string | null;
    accountId: string;
  };
  payment: AdminModerationPaymentDto | null;
}

export interface AdminModerationCampaignsPaginatedDto {
  items: AdminModerationCampaignCardDto[];
  counts: AdminModerationCountsDto;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminModerateCampaignPayload {
  action: ModerationActionType;
  adminNote?: string;
  refundConfirmedManualPayment?: boolean;
}

export interface ToggleCampaignFeaturedPayload {
  isFeatured: boolean;
  featuredOrder?: number | null;
  featuredUntil?: string | null;
  featuredBannerUrl?: string | null;
}

export interface AdminFeaturedCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  campaignTitle: string;
  isFeatured?: boolean;
  featuredOrder?: number | null;
  featuredUntil?: string | null;
  featuredBannerUrl?: string | null;
  onSuccess?: () => void;
}

export interface AdminFeaturedCampaignDialogContentProps {
  campaignId: string;
  campaignTitle: string;
  isFeatured?: boolean;
  featuredOrder?: number | null;
  featuredUntil?: string | null;
  featuredBannerUrl?: string | null;
  onSuccess?: () => void;
  onClose: () => void;
}

export interface AdminModerationTabsProps {
  counts?: AdminModerationCountsDto;
  className?: string;
}

export interface AdminModerationCampaignCardProps {
  campaign: AdminModerationCampaignCardDto;
}

export interface AdminModerationEmptyStateProps {
  activeFilter: ModerationFilterOption;
  searchQuery: string;
  onResetFilters: () => void;
}

export interface AdminModerationSkeletonProps {
  count?: number;
}

export interface AdminCampaignModerationPanelProps {
  campaign: Campaign;
  onModerationSuccess?: () => void;
  className?: string;
}

export interface AdminTransferProofDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proofUrl: string | null;
  senderBank?: string | null;
  senderName?: string | null;
  totalPayable?: number | string | null;
}

export interface AdminApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  campaignTitle: string;
  isManualPaymentPending: boolean;
  totalPayable: number;
  onConfirm: () => void;
}

export interface AdminRevisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  campaignTitle: string;
  onConfirm: (adminNote: string) => void;
}

export interface AdminRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  campaignTitle: string;
  budget: number;
  isManualPaymentPending: boolean;
  onConfirm: (payload: {
    action: 'REJECT_PAYMENT' | 'REJECT_CAMPAIGN';
    adminNote: string;
    refundConfirmedManualPayment: boolean;
  }) => void;
}

export type AdminTopUpStatusFilter =
  | 'ALL'
  | 'PENDING'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED';

export type AdminTopUpReviewAction = 'APPROVE' | 'REJECT';

export interface AdminTopUpCounts {
  submitted: number;
  pending: number;
  approved: number;
  rejected: number;
  all: number;
}

export interface AdminTopUpTabItem {
  key: AdminTopUpStatusFilter;
  label: string;
  countKey: keyof AdminTopUpCounts;
}

export interface AdminTopUpBrand {
  id: string;
  companyName: string;
  logoUrl: string | null;
  email: string;
}

export interface AdminTopUpItem {
  id: string;
  referenceCode: string;
  walletId: string;
  amount: number;
  uniqueCode: number;
  totalPayable: number;
  destinationBank: string;
  destinationAccount: string;
  destinationHolderName: string;
  senderBank: string | null;
  senderAccountName: string | null;
  transferProofUrl: string | null;
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  brand: AdminTopUpBrand;
}

export interface AdminTopUpsPaginated {
  items: AdminTopUpItem[];
  counts: AdminTopUpCounts;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetAdminTopUpsParams {
  filter?: AdminTopUpStatusFilter;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ReviewBrandTopUpPayload {
  id: string;
  decision: AdminTopUpReviewAction;
  rejectionReason?: string;
}

export interface AdminTopUpStatusTabsProps {
  counts?: AdminTopUpCounts;
  className?: string;
}

export interface AdminTopUpItemRowProps {
  topUp: AdminTopUpItem;
  onOpenProof: (topUp: AdminTopUpItem) => void;
  onReview: (topUp: AdminTopUpItem, decision: AdminTopUpReviewAction) => void;
  className?: string;
}

export interface AdminTopUpProofDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topUp: AdminTopUpItem | null;
}

export type AdminTopUpProofModalProps = AdminTopUpProofDialogProps;

export interface AdminTopUpReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topUp: AdminTopUpItem | null;
  decision: AdminTopUpReviewAction | null;
  isPending: boolean;
  onConfirm: (rejectionReason?: string) => void;
}

export interface AdminTopUpEmptyStateProps {
  filter: AdminTopUpStatusFilter;
  searchQuery: string;
  onResetFilters: () => void;
}

export interface AdminTopUpErrorStateProps {
  message: string;
  onRetry: () => void;
}

export interface AdminTopUpSkeletonProps {
  count?: number;
}

// Withdrawal Verification & Disbursement Types (Phase 4)
export type AdminWithdrawalFilter =
  | 'PENDING'
  | 'CANCELLATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'ALL';

export type AdminWithdrawalRoleFilter = 'ALL' | 'CREATOR' | 'BRAND';

export type AdminWithdrawalReviewAction = 'APPROVE' | 'REJECT';

export interface AdminWithdrawalCounts {
  pending: number;
  cancellation: number;
  approved: number;
  rejected: number;
  all: number;
}

export interface AdminWithdrawalTabItem {
  key: AdminWithdrawalFilter;
  label: string;
  countKey: keyof AdminWithdrawalCounts;
}

export interface AdminWithdrawalUser {
  id: string;
  email: string;
  role: 'CREATOR' | 'BRAND' | 'ADMIN';
  displayName: string;
  avatarUrl: string | null;
}

export interface AdminWithdrawalPayoutAccount {
  id: string;
  accountType: string;
  provider: string;
  accountNumber: string;
  accountHolderName: string;
  proofUrl: string;
  verificationStatus: string;
}

export interface AdminWithdrawalItem {
  id: string;
  referenceCode: string;
  walletId: string;
  amount: number;
  accountProvider: string;
  accountNumber: string;
  accountHolderName: string;
  payoutStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  transferProofUrl: string | null;
  adminNote: string | null;
  cancellationRequestedAt: string | null;
  cancellationReason: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: AdminWithdrawalUser;
  payoutAccount: AdminWithdrawalPayoutAccount | null;
}

export interface AdminWithdrawalsPaginated {
  items: AdminWithdrawalItem[];
  counts: AdminWithdrawalCounts;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetAdminWithdrawalsParams {
  filter?: AdminWithdrawalFilter;
  role?: AdminWithdrawalRoleFilter;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ReviewAdminWithdrawalPayload {
  id: string;
  decision: AdminWithdrawalReviewAction;
  rejectionReason?: string;
  adminNote?: string;
  transferProofUrl?: string;
}

export interface AdminWithdrawalStatusTabsProps {
  counts?: AdminWithdrawalCounts;
  className?: string;
}

export interface AdminWithdrawalItemRowProps {
  withdrawal: AdminWithdrawalItem;
  onOpenKyc: (withdrawal: AdminWithdrawalItem) => void;
  onReview: (withdrawal: AdminWithdrawalItem, decision: AdminWithdrawalReviewAction) => void;
  className?: string;
}

export interface AdminWithdrawalKycDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  withdrawal: AdminWithdrawalItem | null;
}

export interface AdminWithdrawalReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  withdrawal: AdminWithdrawalItem | null;
  decision: AdminWithdrawalReviewAction | null;
  isPending: boolean;
  onConfirm: (payload: {
    rejectionReason?: string;
    adminNote?: string;
    transferProofUrl?: string;
  }) => void;
}

export interface AdminWithdrawalReviewDialogContentProps {
  withdrawal: AdminWithdrawalItem;
  decision: AdminWithdrawalReviewAction;
  isPending: boolean;
  onConfirm: (payload: {
    rejectionReason?: string;
    adminNote?: string;
    transferProofUrl?: string;
  }) => void;
  onClose: () => void;
}


export interface AdminWithdrawalEmptyStateProps {
  filter: AdminWithdrawalFilter;
  searchQuery: string;
  roleFilter: AdminWithdrawalRoleFilter;
  onResetFilters: () => void;
}

export interface AdminWithdrawalErrorStateProps {
  message: string;
  onRetry: () => void;
}

export interface AdminWithdrawalSkeletonProps {
  count?: number;
}

// KYC Verification & Payout Account Compliance Types (Phase 5)
export type AdminKycFilter = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'ALL';

export type AdminKycRoleFilter = 'ALL' | 'CREATOR' | 'BRAND';

export type AdminKycReviewAction = 'APPROVE' | 'REJECT';

export type AdminKycAccountType = 'BANK_TRANSFER' | 'E_WALLET';

export type AdminKycVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface AdminKycCounts {
  pending: number;
  verified: number;
  rejected: number;
  all: number;
}

export interface AdminKycTabItem {
  key: AdminKycFilter;
  label: string;
  countKey: keyof AdminKycCounts;
}

export interface AdminKycRoleOption {
  key: AdminKycRoleFilter;
  label: string;
}

export interface AdminKycUser {
  id: string;
  email: string;
  role: 'CREATOR' | 'BRAND' | 'ADMIN';
  displayName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
}

export interface AdminKycItem {
  id: string;
  walletId: string;
  accountType: AdminKycAccountType;
  provider: string;
  accountNumber: string;
  accountHolderName: string;
  proofUrl: string;
  isPrimary: boolean;
  verificationStatus: AdminKycVerificationStatus;
  rejectionReason: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: AdminKycUser;
}

export interface AdminKycPaginatedResponse {
  items: AdminKycItem[];
  counts: AdminKycCounts;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetAdminKycParams {
  filter?: AdminKycFilter;
  role?: AdminKycRoleFilter;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ReviewKycPayload {
  id: string;
  decision: AdminKycReviewAction;
  rejectionReason?: string;
}

export interface AdminKycStatusTabsProps {
  counts?: AdminKycCounts;
  className?: string;
}

export interface AdminKycItemRowProps {
  item: AdminKycItem;
  onOpenProof: (item: AdminKycItem) => void;
  onReview: (item: AdminKycItem, decision: AdminKycReviewAction) => void;
  className?: string;
}

export interface AdminKycProofDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: AdminKycItem | null;
}

export interface AdminKycReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: AdminKycItem | null;
  decision: AdminKycReviewAction | null;
  isPending: boolean;
  sessionKey?: number;
  onConfirm: (rejectionReason?: string) => void;
}

export interface AdminKycReviewDialogContentProps {
  item: AdminKycItem;
  decision: AdminKycReviewAction;
  isPending: boolean;
  onConfirm: (rejectionReason?: string) => void;
  onClose: () => void;
}

export interface AdminKycEmptyStateProps {
  filter: AdminKycFilter;
  searchQuery: string;
  roleFilter: AdminKycRoleFilter;
  page?: number;
  onResetFilters: () => void;
}

export interface AdminKycErrorStateProps {
  message: string;
  onRetry: () => void;
}

export interface AdminKycSkeletonProps {
  count?: number;
}



