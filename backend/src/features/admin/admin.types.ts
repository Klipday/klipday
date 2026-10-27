import type {
  CampaignStatus,
  CampaignType,
  Category,
  PaymentStatus,
  SubmissionStatus,
} from '../../generated/prisma/enums.js';
import type {
  FreezeReasonType,
  ModerationActionType,
  ModerationFilterOption,
  SettlementFilterOption,
} from './admin.constants.js';

export interface AdminSettlementQueryInput {
  filter: SettlementFilterOption;
  search?: string | undefined;
  page: number;
  limit: number;
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

export interface AdminModerationQueryInput {
  filter: ModerationFilterOption;
  search?: string | undefined;
  page: number;
  limit: number;
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
  adminNote?: string | undefined;
  refundConfirmedManualPayment?: boolean | undefined;
}
