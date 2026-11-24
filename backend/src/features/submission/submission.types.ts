import type { Platform, SubmissionStatus } from '../../generated/prisma/enums.js';
import type { ALL_STATUS_FILTER } from './submission.constants.js';
import type { SocialAccountDto } from '../social-account/social-account.types.js';

export interface SubmissionDetailDto {
  id: string;
  campaignId: string;
  creatorId: string;
  platform: Platform;
  externalVideoId?: string | null;
  draftVideoUrl?: string | null;
  liveVideoUrl?: string | null;
  thumbnailUrl?: string | null;
  videoCaption?: string | null;
  submissionStatus: SubmissionStatus;
  reviewNote?: string | null;
  verifiedViews: number;
  earnings: string;
  submittedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  socialAccount?: SocialAccountDto | null;
}

export interface PlatformSubmissionQuotaDto {
  platform: Platform;
  submittedCount: number;
  maxSubmissions: number | null;
  remainingSlots: number | null;
  canSubmit: boolean;
}

export interface MySubmissionResponseData {
  submission: SubmissionDetailDto | null;
  submissions?: SubmissionDetailDto[];
  socialAccount: SocialAccountDto | null;
  socialAccounts?: SocialAccountDto[];
  isJoined?: boolean;
  canSubmitMore?: boolean;
  maxSubmissionsPerPlatform?: number | null;
  platformQuotas?: PlatformSubmissionQuotaDto[];
}

export interface RawSubmissionInput {
  id: string;
  campaignId: string;
  creatorId: string;
  platform?: Platform;
  externalVideoId?: string | null;
  draftVideoUrl?: string | null;
  liveVideoUrl?: string | null;
  thumbnailUrl?: string | null;
  videoCaption?: string | null;
  submissionStatus: SubmissionStatus;
  reviewNote?: string | null;
  verifiedViews: number;
  earnings: { toString(): string } | number | string;
  submittedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  socialAccount?: SocialAccountDto | null;
}
export interface SubmissionPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SubmissionQueryInput {
  page?: number;
  limit?: number;
  search?: string;
  status?: SubmissionStatus | typeof ALL_STATUS_FILTER;
  sort?: string;
}

export interface CampaignSubmissionReviewItemDto {
  id: string;
  campaignId: string;
  creatorId: string;
  platform: Platform;
  draftVideoUrl: string | null;
  liveVideoUrl: string | null;
  thumbnailUrl: string | null;
  videoCaption: string | null;
  submissionStatus: SubmissionStatus;
  reviewNote: string | null;
  verifiedViews: number;
  earnings: string;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  creator: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
  socialAccount: {
    id: string;
    platform?: Platform;
    username: string;
    avatarUrl: string | null;
    followersCount: number;
  } | null;
}

export interface CampaignSubmissionsPaginatedData {
  items: CampaignSubmissionReviewItemDto[];
  pagination: SubmissionPaginationMeta;
}

export interface CreatorSubmissionListItemDto {
  id: string;
  campaignId: string;
  campaignTitle: string;
  campaignDescription: string | null;
  campaignThumbnailUrl: string | null;
  brandName: string;
  brandLogoUrl: string | null;
  cpm: number;
  platform: string;
  liveVideoUrl: string | null;
  thumbnailUrl: string | null;
  videoCaption: string | null;
  submissionStatus: SubmissionStatus;
  reviewNote: string | null;
  verifiedViews: number;
  earnings: number;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  socialAccount: {
    id: string;
    username: string;
    avatarUrl: string | null;
  } | null;
}

export interface CreatorSubmissionCountsDto {
  all: number;
  pendingReview: number;
  approved: number;
  revisionRequested: number;
  rejected: number;
  joined: number;
}

export interface CreatorSubmissionsPaginatedData {
  items: CreatorSubmissionListItemDto[];
  counts: CreatorSubmissionCountsDto;
  pagination: SubmissionPaginationMeta;
}

