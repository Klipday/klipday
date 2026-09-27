import type { Campaign } from '../campaign/types';

export type SubmissionStatus = 'JOINED' | 'PENDING_REVIEW' | 'REVISION_REQUESTED' | 'REJECTED' | 'APPROVED' | 'POSTED' | 'VERIFIED';

export type SocialPlatform = 'TIKTOK' | 'INSTAGRAM' | 'YOUTUBE';

export interface CreatorSocialAccount {
  id: string;
  creatorId: string;
  platform: SocialPlatform;
  username: string;
  platformUserId?: string | null;
  avatarUrl?: string | null;
  followersCount: number;
  isVerified: boolean;
  verificationCode?: string | null;
  verificationExpiresAt?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
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
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  socialAccountId?: string | null;
  socialAccount?: CreatorSocialAccount | null;
}

export interface MySubmissionData {
  submission: Submission | null;
  socialAccount: CreatorSocialAccount | null;
}

export interface SocialVideoItem {
  id: string;
  url: string;
  authorUsername: string;
  title?: string;
  caption?: string;
  thumbnailUrl?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  publishedAt?: string;
}

export interface RequestVerificationCodeInput {
  username: string;
}

export interface RequestVerificationCodeResponse {
  code?: string;
  expiresAt?: string;
  username: string;
  alreadyVerified?: boolean;
  account?: CreatorSocialAccount;
}

export interface VerifyBioInput {
  username: string;
}

export interface ValidateVideoUrlInput {
  videoUrl: string;
}

export interface SaveDraftSubmissionInput {
  liveVideoUrl?: string;
  thumbnailUrl?: string;
  videoCaption?: string;
  socialAccountId?: string;
}

export interface FinalSubmitVideoInput {
  liveVideoUrl?: string;
  thumbnailUrl?: string;
  videoCaption?: string;
  socialAccountId?: string;
}

export interface SubmissionWizardStepConfig {
  stepNumber: number;
  slug: string;
  label: string;
  description: string;
}

export interface SubmissionWizardOutletContext {
  campaign: Campaign;
  submissionData?: MySubmissionData;
}

export interface SubmissionWizardHeaderProps {
  campaignTitle?: string | null;
  campaignId?: string;
  className?: string;
}

export interface SubmissionWizardStepperProps {
  currentStepNumber: number;
  highestAccessibleStep: number;
  campaignId: string;
  className?: string;
}

export interface SubmissionFormStep1BriefProps {
  campaign: Campaign;
  className?: string;
}

export interface SubmissionFormStep2AccountProps {
  campaignId: string;
  connectedAccount?: CreatorSocialAccount | null;
  className?: string;
}

export interface SubmissionFormStep3VideoPickerProps {
  campaignId: string;
  currentDraft?: Submission | null;
  connectedAccount?: CreatorSocialAccount | null;
  className?: string;
}

export interface SubmissionFormStep4OverviewProps {
  campaign: Campaign;
  submission?: Submission | null;
  connectedAccount?: CreatorSocialAccount | null;
  className?: string;
}

export interface SubmissionVideoCardProps {
  video: SocialVideoItem;
  isSelected?: boolean;
  onSelect: (video: SocialVideoItem | null) => void;
  className?: string;
}

export interface SubmissionDialogProps {
  campaign: Campaign;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

export interface SubmissionDialogCampaignSidebarProps {
  campaign: Campaign;
  className?: string;
}

export interface SubmissionDialogStepperProps {
  currentStep: number;
  totalSteps?: number;
  highestAccessibleStep?: number;
  onStepSelect?: (step: number) => void;
  className?: string;
}

export type SubmissionBriefSection = 'tentang' | 'wajib' | 'narasi' | 'caption' | 'aturan' | 'materi';

export type BriefTabFilter = SubmissionBriefSection;

export interface SubmissionStep1BriefDialogProps {
  campaign: Campaign;
  hasAgreed: boolean;
  onToggleAgreed: () => void;
  className?: string;
}

export interface SubmissionStep2AccountDialogProps {
  campaignId: string;
  campaign?: Campaign;
  campaignPlatform?: string;
  connectedAccount?: CreatorSocialAccount | null;
  onAccountVerified?: (account: CreatorSocialAccount) => void;
  className?: string;
}

export interface SocialAccountConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform?: SocialPlatform | string;
  connectedAccount?: CreatorSocialAccount | null;
  onAccountVerified?: (account: CreatorSocialAccount) => void;
  className?: string;
}

export interface SocialPlatformOption {
  id: SocialPlatform;
  name: string;
  description?: string;
}

export interface SocialPlatformRowProps {
  platformId: SocialPlatform;
  platformName: string;
  isSupported: boolean;
  connectedAccount?: CreatorSocialAccount | null;
  onConnect: () => void;
  onSwitchAccount: () => void;
  className?: string;
}

export interface ConnectGuideStepItemProps {
  stepNumber: number;
  title: string;
  description: string;
  isLast?: boolean;
}

export interface SocialPlatformIconProps {
  className?: string;
}

export interface SubmissionStep3VideoPickerDialogProps {
  campaignId: string;
  connectedAccount?: CreatorSocialAccount | null;
  selectedVideo: SocialVideoItem | null;
  onSelectVideo: (video: SocialVideoItem | null) => void;
  onSwitchAccount?: () => void;
  className?: string;
}

export interface SubmissionStep4OverviewDialogProps {
  campaign: Campaign;
  selectedVideo: SocialVideoItem | null;
  connectedAccount?: CreatorSocialAccount | null;
  className?: string;
}

export interface SubmissionDialogFooterProps {
  currentStep: number;
  totalSteps?: number;
  canProceed: boolean;
  isSubmitting?: boolean;
  onBack: () => void;
  onNext: () => void;
  className?: string;
}

export interface SubmissionExitConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
}

export type SubmissionSortOption = 'latest' | 'oldest' | 'views_desc' | 'views_asc';

export interface CampaignSubmissionsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: SubmissionStatus | 'ALL';
  sort?: SubmissionSortOption;
}

export interface CampaignSubmissionReviewItem {
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

export interface SubmissionPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CampaignSubmissionsPaginatedResponse {
  items: CampaignSubmissionReviewItem[];
  pagination: SubmissionPaginationMeta;
}
