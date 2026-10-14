import type {
  Industry,
  PayoutAccountType,
  SubmissionStatus,
  VerificationStatus,
} from '../../generated/prisma/enums.js';

export interface BrandProfileResponse {
  id: string;
  companyName: string;
  email: string;
  phoneNumber: string | null;
  industry: Industry | null;
  logoUrl: string | null;
  location: string | null;
  website: string | null;
  description: string | null;
  instagramHandle: string | null;
  tiktokHandle: string | null;
  xHandle: string | null;
  threadsHandle: string | null;
  youtubeChannel: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandPayoutAccountRecord {
  id: string;
  walletId: string;
  brandId: string | null;
  accountType: PayoutAccountType;
  provider: string;
  accountNumber: string;
  accountHolderName: string;
  proofUrl: string;
  isPrimary: boolean;
  verificationStatus: VerificationStatus;
  rejectionReason: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandDashboardCampaignStatusCounts {
  draft: number;
  inReview: number;
  revision: number;
  active: number;
  finished: number;
  total: number;
}

export interface BrandDashboardMetrics {
  totalVerifiedViews: number;
  totalSpent: number;
  activeCampaignsCount: number;
  pendingReviewsCount: number;
  walletActiveBalance: number;
  escrowLockedBalance: number;
  campaignStatusCounts: BrandDashboardCampaignStatusCounts;
}

export interface BrandDashboardPendingSubmission {
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
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  campaign: {
    id: string;
    title: string | null;
  };
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

export interface BrandDashboardActiveCampaign {
  id: string;
  title: string | null;
  category: string;
  cpm: number;
  budget: number;
  spent: number;
  verifiedViews: number;
  totalSubmissionsCount: number;
  pendingSubmissionsCount: number;
  progressPercent: number;
  startDate: string | null;
  endDate: string | null;
}

export interface BrandDashboardTopClip {
  id: string;
  campaignId: string;
  campaignTitle: string | null;
  creatorName: string;
  creatorAvatarUrl: string | null;
  socialUsername: string;
  socialAvatarUrl: string | null;
  videoThumbnailUrl: string | null;
  liveVideoUrl: string | null;
  verifiedViews: number;
  earnings: number;
}

export interface BrandDashboardResponse {
  brand: {
    id: string;
    companyName: string;
    logoUrl: string | null;
  };
  metrics: BrandDashboardMetrics;
  pendingSubmissions: BrandDashboardPendingSubmission[];
  activeCampaigns: BrandDashboardActiveCampaign[];
  topClips: BrandDashboardTopClip[];
  hasAnyCampaigns: boolean;
}
