import type {
  CampaignStatus,
  CampaignType,
  Category,
  PaymentStatus,
  PayoutAccountType,
  PayoutStatus,
  Role,
  SubmissionStatus,
  VerificationStatus,
  WalletTransactionType,
} from '../../generated/prisma/enums.js';
import type {
  FreezeReasonType,
  KycFilterOption,
  KycReviewAction,
  KycRoleFilterOption,
  ModerationActionType,
  ModerationFilterOption,
  SettlementFilterOption,
  TopUpFilterOption,
  TopUpReviewAction,
  WithdrawalFilterOption,
  WithdrawalReviewAction,
  WithdrawalRoleFilterOption,
} from './admin.constants.js';

export interface AdminSettlementCountsDto {
  needSettlement: number;
  budgetFull: number;
  expired: number;
  finished: number;
}

export interface AdminSettlementCampaignCardDto {
  id: string;
  title: string;
  campaignCategory: Category;
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
  flaggedSubmissionsCount: number;
  lastMetricsSyncedAt: Date | null;
  endDate: Date | null;
  createdAt: Date;
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
  lastMetricsSyncedAt: Date | null;
  syncFailureStreak: number;
  lastSyncError: string | null;
  isFlaggedUnavailable: boolean;
  submittedAt: Date | null;
  createdAt: Date;
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
  flaggedSubmissionsCount: number;
  lastMetricsSyncedAt: Date | null;
  finalSnapshotSyncedAt: Date | null;
  endDate: Date | null;
  brand: {
    id: string;
    companyName: string;
    logoUrl: string | null;
  };
  submissions: AdminFifoSubmissionItemDto[];
}

export interface FifoSubmissionAllocationInput {
  id: string;
  verifiedViews: number;
  currentEarnings: number;
}

export interface FifoSubmissionAllocationResult {
  id: string;
  verifiedViews: number;
  targetEarnings: number;
  allocatedEarnings: number;
  unpaidShortfall: number;
  isCappedByBudget: boolean;
}

export interface FifoCampaignAllocationSummary {
  allocations: FifoSubmissionAllocationResult[];
  totalAllocated: number;
  remainingRefund: number;
}

export interface AdminModerationCountsDto {
  inReview: number;
  revision: number;
  active: number;
  rejected: number;
  all: number;
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
  paymentStatus: PaymentStatus;
  verifiedAt: Date | null;
  isWalletPayment: boolean;
}

export interface AdminModerationCampaignCardDto {
  id: string;
  title: string;
  campaignCategory: Category;
  campaignType: CampaignType;
  campaignStatus: CampaignStatus;
  thumbnailUrl: string | null;
  cpm: number;
  minViews: number;
  maxViews: number;
  budget: number;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
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

export interface AdminTopUpCountsDto {
  submitted: number;
  pending: number;
  approved: number;
  rejected: number;
  all: number;
}

export interface AdminTopUpBrandDto {
  id: string;
  companyName: string;
  logoUrl: string | null;
  email: string;
}

export interface AdminTopUpItemDto {
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
  status: PaymentStatus;
  rejectionReason: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  brand: AdminTopUpBrandDto;
}

export interface AdminTopUpsPaginatedDto {
  items: AdminTopUpItemDto[];
  counts: AdminTopUpCountsDto;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminWithdrawalUserDto {
  id: string;
  email: string;
  role: Role;
  displayName: string;
  avatarUrl: string | null;
}

export interface AdminWithdrawalPayoutAccountDto {
  id: string;
  accountType: string;
  provider: string;
  accountNumber: string;
  accountHolderName: string;
  proofUrl: string;
  verificationStatus: string;
}

export interface AdminWithdrawalItemDto {
  id: string;
  referenceCode: string;
  walletId: string;
  amount: number;
  accountProvider: string;
  accountNumber: string;
  accountHolderName: string;
  payoutStatus: PayoutStatus;
  rejectionReason: string | null;
  transferProofUrl: string | null;
  adminNote: string | null;
  cancellationRequestedAt: Date | string | null;
  cancellationReason: string | null;
  processedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  user: AdminWithdrawalUserDto;
  payoutAccount: AdminWithdrawalPayoutAccountDto | null;
}

export interface AdminWithdrawalCountsDto {
  pending: number;
  cancellation: number;
  approved: number;
  rejected: number;
  all: number;
}

export interface AdminWithdrawalsPaginatedDto {
  items: AdminWithdrawalItemDto[];
  counts: AdminWithdrawalCountsDto;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminKycUserDto {
  id: string;
  email: string;
  role: Role;
  displayName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
}

export interface AdminKycItemDto {
  id: string;
  walletId: string;
  accountType: PayoutAccountType;
  provider: string;
  accountNumber: string;
  accountHolderName: string;
  proofUrl: string;
  isPrimary: boolean;
  verificationStatus: VerificationStatus;
  rejectionReason: string | null;
  verifiedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  user: AdminKycUserDto;
}

export interface AdminKycCountsDto {
  pending: number;
  verified: number;
  rejected: number;
  all: number;
}

export interface AdminKycPaginatedDto {
  items: AdminKycItemDto[];
  counts: AdminKycCountsDto;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminDashboardCampaignsQueueDto {
  inReviewCount: number;
  manualPaymentSubmittedCount: number;
  revisionCount: number;
}

export interface AdminDashboardSettlementsQueueDto {
  needSettlementCount: number;
  budgetFullCount: number;
  expiredCount: number;
  unsettledBudgetTotal: number;
}

export interface AdminDashboardTopUpsQueueDto {
  submittedCount: number;
  submittedTotalPayable: number;
  pendingUploadCount: number;
}

export interface AdminDashboardWithdrawalsQueueDto {
  pendingCount: number;
  pendingTotalAmount: number;
  cancellationRequestedCount: number;
}

export interface AdminDashboardKycQueueDto {
  pendingCount: number;
  pendingCreatorCount: number;
  pendingBrandCount: number;
}

export interface AdminDashboardQueuesDto {
  totalActionableCount: number;
  campaigns: AdminDashboardCampaignsQueueDto;
  settlements: AdminDashboardSettlementsQueueDto;
  topUps: AdminDashboardTopUpsQueueDto;
  withdrawals: AdminDashboardWithdrawalsQueueDto;
  kyc: AdminDashboardKycQueueDto;
}

export interface AdminDashboardMetricsDto {
  lockedCampaignBudget: number;
  activeCampaignsCount: number;
  finishedCampaignsCount: number;
  totalUserWalletBalance: number;
  brandWalletBalance: number;
  creatorWalletBalance: number;
  totalCreatorRewardsPaid: number;
  totalApprovedWithdrawalsAmount: number;
  totalApprovedTopUpsAmount: number;
  totalVerifiedViews: number;
  totalCreatorsCount: number;
  totalBrandsCount: number;
  verifiedTikTokCreatorsCount: number;
}

export interface AdminDashboardWithdrawalActionItemDto {
  id: string;
  referenceCode: string;
  userName: string;
  userRole: Role;
  userAvatarUrl: string | null;
  bankName: string;
  accountNumber: string;
  amount: number;
  cancellationRequestedAt: Date | string | null;
  createdAt: Date | string;
}

export interface AdminDashboardTopUpActionItemDto {
  id: string;
  referenceCode: string;
  brandName: string;
  brandLogoUrl: string | null;
  senderBank: string | null;
  senderAccountName: string | null;
  totalPayable: number;
  amount: number;
  createdAt: Date | string;
}

export interface AdminDashboardKycActionItemDto {
  id: string;
  userName: string;
  userRole: Role;
  userAvatarUrl: string | null;
  accountType: PayoutAccountType;
  provider: string;
  accountNumber: string;
  accountHolderName: string;
  isHolderNameMismatch: boolean;
  createdAt: Date | string;
}

export interface AdminDashboardCampaignActionItemDto {
  id: string;
  title: string;
  brandName: string;
  brandLogoUrl: string | null;
  budget: number;
  campaignStatus: CampaignStatus;
  freezeReason: FreezeReasonType;
  paymentStatus: PaymentStatus;
  actionType: 'MODERATION' | 'SETTLEMENT';
  tagLabel: string;
  createdAt: Date | string;
}

export interface AdminDashboardTransactionActionItemDto {
  id: string;
  referenceCode: string | null;
  type: WalletTransactionType;
  amount: number;
  userName: string;
  userRole: Role;
  createdAt: Date | string;
  transactionDate: Date | string;
}

export interface AdminDashboardActionItemsDto {
  pendingWithdrawals: AdminDashboardWithdrawalActionItemDto[];
  submittedTopUps: AdminDashboardTopUpActionItemDto[];
  pendingKycRequests: AdminDashboardKycActionItemDto[];
  actionableCampaigns: AdminDashboardCampaignActionItemDto[];
  recentTransactions: AdminDashboardTransactionActionItemDto[];
}

export interface AdminDashboardSummaryDto {
  admin: {
    id: string;
    accountId: string;
    name: string;
    email: string;
  };
  queues: AdminDashboardQueuesDto;
  metrics: AdminDashboardMetricsDto;
  actionItems: AdminDashboardActionItemsDto;
}



