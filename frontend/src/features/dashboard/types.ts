import type { ComponentType, ReactNode } from 'react';

/**
 * Representation of an individual item within the dashboard navigation list.
 */
export interface DashboardNavItem {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
  isExternal?: boolean;
}

/**
 * State and mutation actions exposed by the navbar context for coordinating top bar and sidebar navigation.
 */
export interface NavbarContextValue {
  isSidebarCollapsed: boolean;
  isMobileOpen: boolean;
  ToggleSidebarCollapse: () => void;
  SetSidebarCollapsed: (collapsed: boolean) => void;
  ToggleMobileMenu: () => void;
  CloseMobileMenu: () => void;
  OpenMobileMenu: () => void;
}

/**
 * Props for the NavbarProvider component wrapper.
 */
export interface NavbarProviderProps {
  children: ReactNode;
  defaultSidebarCollapsed?: boolean;
}

/**
 * Props for the main full-height DashboardSidebar component.
 */
export interface DashboardSidebarProps {
  role?: string | null;
}

/**
 * Props for the inner navigation and header content of the sidebar.
 */
export interface SidebarContentProps {
  role?: string | null;
  collapsed: boolean;
  isDrawer?: boolean;
}

/**
 * Props for the sidebar header component with brand title and toggle buttons.
 */
export interface SidebarHeaderProps {
  collapsed: boolean;
  isDrawer?: boolean;
}

/**
 * Props for an individual sidebar navigation item.
 */
export interface SidebarNavItemProps {
  item: DashboardNavItem;
  collapsed: boolean;
  isActive: boolean;
  onItemClick: () => void;
}

/**
 * Props for the sidebar navigation links list container.
 */
export interface SidebarNavListProps {
  role?: string | null;
  collapsed: boolean;
}

/**
 * Props for the DashboardTopBar header component.
 */
export interface DashboardTopBarProps {
  userName?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  avatarUrl?: string | null;
}

/**
 * Props for the UserNav static user profile display component.
 */
export interface UserNavProps {
  name?: string | null;
  email?: string | null;
  role?: string | null;
  avatarUrl?: string | null;
}

/**
 * Props for the sidebar footer section containing profile and logout actions.
 */
export interface SidebarFooterProps {
  role?: string | null;
  collapsed: boolean;
}

/**
 * Props for the sidebar logout action button.
 */
export interface SidebarLogoutButtonProps {
  collapsed: boolean;
  onItemClick?: () => void;
}

/**
 * Props for custom SVG icon components within the sidebar.
 */
export interface SidebarCustomIconProps {
  className?: string;
}

/**
 * Props for the sidebar community card widget.
 */
export interface SidebarCommunityCardProps {
  collapsed: boolean;
  onItemClick?: () => void;
}

/**
 * Props for the sidebar help and assistance links section.
 */
export interface SidebarHelpSectionProps {
  collapsed: boolean;
  onItemClick?: () => void;
}

/**
 * Props for the sidebar help card / WhatsApp assistance button (legacy).
 */
export interface SidebarHelpCardProps {
  collapsed: boolean;
  onItemClick?: () => void;
}

import type { CampaignSubmissionReviewItem } from '@/features/submission/types';

/**
 * Standard API envelope returned by Klipday backend endpoints.
 */
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
}

/**
 * Campaign counts grouped by lifecycle status.
 */
export interface BrandDashboardCampaignStatusCounts {
  draft: number;
  inReview: number;
  revision: number;
  active: number;
  finished: number;
  total: number;
}

/**
 * High-level KPIs for brand monitoring.
 */
export interface BrandDashboardMetrics {
  totalVerifiedViews: number;
  totalSpent: number;
  activeCampaignsCount: number;
  pendingReviewsCount: number;
  walletActiveBalance: number;
  escrowLockedBalance: number;
  campaignStatusCounts: BrandDashboardCampaignStatusCounts;
}

/**
 * Pending submission item in the brand action center.
 */
export interface BrandDashboardPendingSubmission extends CampaignSubmissionReviewItem {
  campaign: {
    id: string;
    title: string | null;
  };
}

/**
 * Active running campaign with spend rollup and submission counts.
 */
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

/**
 * Viral hit clip summary displayed in the radar widget.
 */
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

/**
 * Complete summary payload returned by GET /brand/dashboard.
 */
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

/**
 * Props for the BrandDashboardHeader component.
 */
export interface BrandDashboardHeaderProps {
  brandName?: string | null;
  className?: string;
}

/**
 * Props for the BrandDashboardAlerts component.
 */
export interface BrandDashboardAlertsProps {
  walletActiveBalance: number;
  onTopUpClick: () => void;
  className?: string;
}

/**
 * Props for the BrandDashboardMetricsGrid component.
 */
export interface BrandDashboardMetricsGridProps {
  metrics: BrandDashboardMetrics;
  className?: string;
}

/**
 * Props for the BrandPendingReviewsQueue component.
 */
export interface BrandPendingReviewsQueueProps {
  submissions: BrandDashboardPendingSubmission[];
  onReviewSubmission: (submission: BrandDashboardPendingSubmission) => void;
  className?: string;
}

/**
 * Props for the BrandActiveCampaignsWidget component.
 */
export interface BrandActiveCampaignsWidgetProps {
  campaigns: BrandDashboardActiveCampaign[];
  className?: string;
}

/**
 * Props for the BrandTopClipsWidget component.
 */
export interface BrandTopClipsWidgetProps {
  topClips: BrandDashboardTopClip[];
  className?: string;
}

/**
 * Props for the BrandDashboardLaunchpad component.
 */
export interface BrandDashboardLaunchpadProps {
  onTopUpClick: () => void;
  className?: string;
}

/**
 * Props for the BrandDashboardSkeleton loading component.
 */
export interface BrandDashboardSkeletonProps {
  className?: string;
}

/**
 * Props for the BrandWalletOverviewCard component.
 */
export interface BrandWalletOverviewCardProps {
  walletActiveBalance: number;
  escrowLockedBalance: number;
  totalSpent: number;
  onTopUpClick: () => void;
  className?: string;
}

/**
 * Props for the BrandDashboardErrorState component.
 */
export interface BrandDashboardErrorStateProps {
  onRetry: () => void;
  className?: string;
}

/**
 * Submission lifecycle status values returned in the creator dashboard summary.
 */
export type CreatorDashboardSubmissionStatus =
  | 'JOINED'
  | 'PENDING_REVIEW'
  | 'REVISION_REQUESTED'
  | 'REJECTED'
  | 'APPROVED'
  | 'POSTED'
  | 'VERIFIED';

/**
 * Verified TikTok social account summary attached to creator dashboard header.
 */
export interface CreatorDashboardSocialSummary {
  username: string;
  avatarUrl: string | null;
  followersCount: number;
  isVerified: boolean;
}

/**
 * Creator submission counts grouped by lifecycle status.
 */
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

/**
 * High-level KPIs for the Creator Monitoring Dashboard.
 */
export interface CreatorDashboardMetrics {
  totalVerifiedViews: number;
  totalEarnings: number;
  walletActiveBalance: number;
  totalWithdrawn: number;
  pendingWithdrawalAmount: number;
  submissionStatusCounts: CreatorDashboardSubmissionStatusCounts;
}

/**
 * Submitted campaign item displayed in the creator's recent submissions list.
 */
export interface CreatorDashboardSubmissionItem {
  id: string;
  campaignId: string;
  campaignTitle: string | null;
  brandName: string;
  category: string;
  brandIndustry: string | null;
  submissionStatus: CreatorDashboardSubmissionStatus;
  verifiedViews: number;
  earnings: number;
  estimatedEarnings: number;
  submittedAt: string | null;
  updatedAt: string;
}

/**
 * Active joined campaign that the creator has joined (JOINED) and not yet submitted a video for.
 */
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

/**
 * Top verified clip item displayed in the creator's top clips radar widget.
 */
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

/**
 * Complete summary payload returned by GET /creator/dashboard.
 */
export interface CreatorDashboardResponse {
  creator: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    tiktokAccount: CreatorDashboardSocialSummary | null;
  };
  metrics: CreatorDashboardMetrics;
  recentSubmissions: CreatorDashboardSubmissionItem[];
  joinedCampaigns: CreatorDashboardJoinedCampaign[];
  topClips: CreatorDashboardTopClip[];
  hasAnySubmissions: boolean;
}

/**
 * Props for the CreatorDashboardHeader component.
 */
export interface CreatorDashboardHeaderProps {
  creatorName?: string | null;
  tiktokAccount?: CreatorDashboardSocialSummary | null;
  className?: string;
}

/**
 * Props for the CreatorDashboardMetricsGrid component.
 */
export interface CreatorDashboardMetricsGridProps {
  metrics: CreatorDashboardMetrics;
  className?: string;
}

/**
 * Props for the CreatorDashboardLaunchpad Day 0 onboarding component.
 */
export interface CreatorDashboardLaunchpadProps {
  isTikTokConnected: boolean;
  className?: string;
}

/**
 * Props for the CreatorRecentSubmissionsWidget component.
 */
export interface CreatorRecentSubmissionsWidgetProps {
  submissions: CreatorDashboardSubmissionItem[];
  className?: string;
}

/**
 * Props for the CreatorJoinedCampaignsWidget component.
 */
export interface CreatorJoinedCampaignsWidgetProps {
  campaigns: CreatorDashboardJoinedCampaign[];
  className?: string;
}

/**
 * Props for the CreatorTopClipsWidget component.
 */
export interface CreatorTopClipsWidgetProps {
  topClips: CreatorDashboardTopClip[];
  className?: string;
}

/**
 * Props for the CreatorDashboardSkeleton loading component.
 */
export interface CreatorDashboardSkeletonProps {
  className?: string;
}

/**
 * Props for the CreatorDashboardErrorState component.
 */
export interface CreatorDashboardErrorStateProps {
  onRetry: () => void;
  className?: string;
}



