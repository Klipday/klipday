import type { Category, SubmissionStatus } from '../../generated/prisma/enums.js';

export interface CreatorSocialSummary {
  username: string;
  avatarUrl: string | null;
  followersCount: number;
  isVerified: boolean;
}

export interface CreatorProfileResponse {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  phoneNumber: string | null;
  location: string | null;
  bio: string | null;
  contentCategories: Category[];
  tiktokAccount: CreatorSocialSummary | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatorDashboardSubmissionStatusCounts {
  joined: number;
  pendingReview: number;
  revisionRequested: number;
  approved: number;
  posted: number;
  verified: number;
  rejected: number;
  submittedTotal: number;
  total: number;
}

export interface CreatorDashboardMetrics {
  totalVerifiedViews: number;
  totalEarnings: number;
  walletActiveBalance: number;
  totalWithdrawn: number;
  pendingWithdrawalAmount: number;
  submissionStatusCounts: CreatorDashboardSubmissionStatusCounts;
}

export interface CreatorDashboardSubmissionItem {
  id: string;
  campaignId: string;
  campaignTitle: string | null;
  brandName: string;
  category: string;
  brandIndustry: string | null;
  submissionStatus: SubmissionStatus;
  verifiedViews: number;
  earnings: number;
  estimatedEarnings: number;
  submittedAt: string | null;
  updatedAt: string;
}

export interface CreatorDashboardJoinedCampaign {
  submissionId: string;
  id: string;
  title: string | null;
  brandName: string;
  category: string;
  brandIndustry: string | null;
  cpm: number;
  budget: number;
  spent: number;
  remainingBudget: number;
  remainingPercent: number;
  joinedAt: string;
  endDate: string | null;
}

export interface CreatorDashboardTopClip {
  id: string;
  campaignId: string;
  campaignTitle: string | null;
  brandName: string;
  socialUsername: string;
  videoThumbnailUrl: string | null;
  liveVideoUrl: string | null;
  verifiedViews: number;
  earnings: number;
  estimatedEarnings: number;
}

export interface CreatorDashboardResponse {
  creator: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    tiktokAccount: CreatorSocialSummary | null;
  };
  metrics: CreatorDashboardMetrics;
  recentSubmissions: CreatorDashboardSubmissionItem[];
  joinedCampaigns: CreatorDashboardJoinedCampaign[];
  topClips: CreatorDashboardTopClip[];
  hasAnySubmissions: boolean;
}

