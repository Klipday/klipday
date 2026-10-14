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


