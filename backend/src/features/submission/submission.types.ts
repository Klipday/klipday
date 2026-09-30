import type { SubmissionStatus } from '../../generated/prisma/enums.js';
import type { ALL_STATUS_FILTER } from './submission.constants.js';
import type { SocialAccountDto } from '../social-account/social-account.types.js';

export interface SaveDraftSubmissionBody {
  liveVideoUrl: string;
  thumbnailUrl?: string;
  videoCaption?: string;
  socialAccountId: string;
}

export interface FinalSubmitVideoBody {
  liveVideoUrl: string;
  thumbnailUrl?: string;
  videoCaption?: string;
  socialAccountId: string;
}

export interface RejectSubmissionBody {
  reviewNote?: string;
}

export interface RequestRevisionBody {
  reviewNote: string;
}

export interface SubmissionDetailDto {
  id: string;
  campaignId: string;
  creatorId: string;
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

export interface MySubmissionResponseData {
  submission: SubmissionDetailDto | null;
  socialAccount: SocialAccountDto | null;
}

export interface RawSubmissionInput {
  id: string;
  campaignId: string;
  creatorId: string;
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
    username: string;
    avatarUrl: string | null;
    followersCount: number;
  } | null;
}

export interface CampaignSubmissionsPaginatedData {
  items: CampaignSubmissionReviewItemDto[];
  pagination: SubmissionPaginationMeta;
}
