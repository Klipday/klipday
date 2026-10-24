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
  endDate: string | null;
  brand: {
    id: string;
    companyName: string;
    logoUrl: string | null;
  };
  submissions: AdminFifoSubmissionItemDto[];
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
