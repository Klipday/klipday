import type { ComponentType, ReactNode } from 'react';
import type { Control } from 'react-hook-form';
import type { MaterialsFormValues } from './schemas';

export interface ApiResponse<T> {
  status: string;
  data: T;
  message: string;
}

export interface InitializeCampaignResponse {
  id: string;
}

export type WizardStepSlug = 'step-1' | 'step-2' | 'step-3' | 'step-4' | 'step-5' | 'step-6';

export interface WizardStepItem {
  id: string;
  slug: WizardStepSlug;
  stepNumber: number;
  title: string;
  description: string;
}

export interface CampaignMaterial {
  id: string;
  name: string;
  type: string;
  url: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  campaignId?: string;
}

export interface CampaignBrief {
  id: string;
  purpose?: string | null;
  keyMessage?: string | null;
  narration?: string | null;
  impression?: string | null;
  callToAction?: string | null;
  requiredCaption?: string | null;
  hashtags?: string[];
  mentionTags?: string[];
  dos?: string[];
  donts?: string[];
  guidelines?: string | null;
  createdAt?: string;
  updatedAt?: string;
  campaignId?: string;
}

export interface CampaignBrand {
  id: string;
  companyName: string;
  industry?: string | null;
}

export interface CampaignPayment {
  id: string;
  campaignId: string;
  amount: number | string;
  uniqueCode: number;
  totalPayable: number | string;
  destinationBank: string;
  destinationAccount: string;
  senderProviderName?: string | null;
  senderAccountName?: string | null;
  transferProofUrl?: string | null;
  paymentStatus: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  verifiedByAdminId?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  title?: string | null;
  description?: string | null;
  campaignType?: string;
  campaignCategory?: string;
  thumbnailUrl?: string | null;
  platform?: string;
  mainMediaUrl?: string | null;
  cpm?: number | string | null;
  minViews?: number | null;
  maxViews?: number | null;
  budget?: number | string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string;
  campaignStatus?: string;
  adminNote?: string | null;
  isFeatured?: boolean;
  featuredBannerUrl?: string | null;
  featuredOrder?: number | null;
  featuredUntil?: string | null;
  createdAt?: string;
  updatedAt?: string;
  brandId?: string;
  materials?: CampaignMaterial[];
  brief?: CampaignBrief | null;
  brand?: CampaignBrand;
  payments?: CampaignPayment[];
  _count?: {
    submissions?: number;
  };
}

export interface CampaignEditInput {
  title?: string;
  description?: string;
  campaignType?: string;
  campaignCategory?: string;
  thumbnailUrl?: string;
  platform?: string;
  mainMediaUrl?: string;
  materials?: Array<{
    type: string;
    name: string;
    url: string;
  }>;
  brief?: Record<string, unknown>;
  cpm?: number;
  minViews?: number;
  maxViews?: number;
  budget?: number;
  startDate?: string | Date;
  endDate?: string | Date;
}

export interface MaterialFieldGroupProps {
  index: number;
  control: Control<MaterialsFormValues>;
  canRemove: boolean;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export interface BriefDynamicListFieldProps {
  label: string;
  description?: string;
  placeholder?: string;
  items: string[];
  onAddItem: (item: string) => void;
  onRemoveItem: (index: number) => void;
  disabled?: boolean;
  prefix?: string;
  variant?: 'pills' | 'rows';
  tone?: 'positive' | 'negative' | 'neutral';
  error?: string;
  maxItemLength?: number;
}

export interface DynamicListInputProps {
  onAdd: (item: string) => void;
  placeholder?: string;
  prefix?: string;
  disabled?: boolean;
  maxLength?: number;
}

export interface DynamicListPillsProps {
  items: string[];
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export interface DynamicListRowsProps {
  items: string[];
  onRemove: (index: number) => void;
  tone?: 'positive' | 'negative' | 'neutral';
  disabled?: boolean;
}

export interface CampaignProjections {
  totalEstimatedViews: number;
  maxEarningsPerVideo: number;
  minFundedVideos: number;
  durationDays: number;
}

export interface MissingStepItem {
  stepNumber: number;
  slug: WizardStepSlug;
  title: string;
  reason: string;
}

export interface CampaignCompletenessResult {
  isComplete: boolean;
  missingSteps: MissingStepItem[];
}

export interface CampaignReviewCompletenessAlertProps {
  missingSteps: MissingStepItem[];
  onNavigateToStep: (stepSlug: WizardStepSlug) => void;
}

export interface CampaignReviewBasicInfoProps {
  campaign: Campaign;
  onEdit: () => void;
}

export interface CampaignReviewMaterialsProps {
  materials?: CampaignMaterial[];
  onEdit: () => void;
}

export interface CampaignReviewBriefProps {
  brief?: CampaignBrief | null;
  onEdit: () => void;
}

export interface CampaignReviewRewardProps {
  campaign: Campaign;
  projections: CampaignProjections;
  onEdit: () => void;
}

export interface CampaignDanaAmanNoticeProps {
  variant?: 'budget' | 'review';
  title?: string;
  description?: string;
  className?: string;
}

export type CampaignReviewEscrowNoticeProps = CampaignDanaAmanNoticeProps;

export interface CampaignReviewActionsProps {
  onBack: () => void;
  onSubmit: () => void;
  isPending?: boolean;
  isComplete?: boolean;
}

export interface ReviewSummaryProps {
  campaign: Campaign;
  onSubmit: () => void;
  onBack: () => void;
  isPending?: boolean;
}

export interface CampaignWizardStepperProps {
  className?: string;
  campaign?: Campaign | null;
}

export interface CampaignWizardContext {
  campaign?: Campaign;
}

export interface CampaignWizardErrorProps {
  message?: string;
  onRetry?: () => void;
}

export interface CampaignThumbnailUploadProps {
  value?: string;
  onChange: (url: string) => void;
  campaignId: string;
  disabled?: boolean;
}

export interface WizardFormActionsProps {
  onBack?: () => void;
  isPending?: boolean;
  submitText?: string;
  backText?: string;
  className?: string;
}

export interface CampaignWizardHelperBoxProps {
  title: string;
  description?: string;
  tip?: string;
  icon?: ComponentType<{ className?: string }>;
  className?: string;
}

export interface CampaignEstimateRoiCardProps {
  projections: CampaignProjections;
  className?: string;
}

export interface UseUnsavedChangesGuardOptions {
  isDirty: boolean;
  isSaving?: boolean;
}

export interface UseUnsavedChangesGuardResult {
  isBlocked: boolean;
  ConfirmNavigation: () => void;
  CancelNavigation: () => void;
}

export interface CampaignUnsavedChangesDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface FieldLengthTrackerProps {
  current: number;
  max: number;
  className?: string;
}

export interface CampaignCardBrand {
  id: string;
  companyName: string;
  industry?: string | null;
}

export interface CampaignCardCount {
  submissions: number;
}

export interface CampaignCardItem {
  id: string;
  title: string | null;
  description: string | null;
  campaignType: string;
  campaignCategory: string;
  thumbnailUrl: string | null;
  platform: string;
  mainMediaUrl?: string | null;
  cpm: number | string | null;
  minViews?: number | null;
  maxViews?: number | null;
  budget: number | string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  campaignStatus: string;
  isFeatured?: boolean;
  featuredBannerUrl?: string | null;
  featuredOrder?: number | null;
  featuredUntil?: string | null;
  createdAt: string;
  updatedAt: string;
  brandId: string;
  brand: CampaignCardBrand;
  materials?: CampaignMaterial[];
  brief?: CampaignBrief | null;
  _count?: CampaignCardCount;
}

export interface CampaignCardProps {
  campaign: CampaignCardItem;
  onClick?: (campaign: CampaignCardItem) => void;
  className?: string;
}

export interface CampaignStatusBadgeConfig {
  label: string;
  className: string;
}

export interface CampaignPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CampaignsPaginatedData {
  items: CampaignCardItem[];
  pagination: CampaignPaginationMeta;
}

export interface CampaignQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  campaignType?: string;
  platform?: string;
  campaignStatus?: string;
  sort?: string;
}

export interface CampaignCardSkeletonProps {
  className?: string;
}

export interface BrandCampaignsListProps {
  onCardClick?: (campaign: CampaignCardItem) => void;
  className?: string;
}

export interface CreateCampaignDialogProps {
  children: ReactNode;
}

export type CampaignLifecycleStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'REVISION'
  | 'REJECTED'
  | 'ACTIVE'
  | 'FINISHED';

export interface CampaignStatusCounts {
  DRAFT: number;
  AWAITING_PAYMENT: number;
  IN_REVIEW: number;
  REVISION: number;
  REJECTED: number;
  ACTIVE: number;
  FINISHED: number;
}



export interface DraftStepProgress {
  stepNumber: number;
  stepTitle: string;
  stepBadgeText: string;
}

export interface ResumeDraftBannerProps {
  className?: string;
}

export interface DraftsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

export interface DraftItemRowProps {
  draft: CampaignCardItem;
  onContinue: (draft: CampaignCardItem) => void;
  onDelete: (draft: CampaignCardItem) => void;
  isDeleting: boolean;
  className?: string;
}

export interface StatusTabItem {
  key: string;
  label: string;
  countKey: keyof CampaignStatusCounts;
  alertOnCount?: boolean;
}

export interface CampaignEmptyStateConfig {
  title: string;
  description: string;
}

export interface CampaignStatusEmptyStateProps {
  status?: string;
  className?: string;
}

export interface BrandCampaignsErrorStateProps {
  error?: unknown;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export interface CampaignDetailPageProps {
  className?: string;
}

export interface CampaignDetailHeaderProps {
  campaign: Campaign;
  userRole?: 'BRAND' | 'CREATOR' | 'ADMIN' | null;
  onOpenSubmitDialog?: () => void;
  className?: string;
}

export interface CampaignDetailHeroMediaProps {
  thumbnailUrl?: string | null;
  title?: string | null;
  typeBadge?: string;
  brandName?: string;
  className?: string;
}

export interface CampaignDetailTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole?: 'BRAND' | 'CREATOR' | 'ADMIN' | null;
  className?: string;
}

export interface CampaignDetailAboutProps {
  description?: string | null;
  className?: string;
}

export interface CampaignDetailBriefSectionsProps {
  brief?: CampaignBrief | null;
  materials?: CampaignMaterial[];
  className?: string;
}

export interface CampaignDetailRewardSidebarProps {
  campaign: Campaign;
  className?: string;
}

export interface CampaignDetailSkeletonProps {
  className?: string;
}

export interface CampaignDetailErrorStateProps {
  error?: unknown;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export type {
  AdminSubmissionsViewProps,
  BrandSubmissionCardProps,
  BrandSubmissionsEmptyProps,
  BrandSubmissionsPaginationProps,
  BrandSubmissionsToolbarProps,
  BrandSubmissionsViewProps,
  CampaignDetailAdminSubmissionsProps,
  CampaignDetailBrandSubmissionCardProps,
  CampaignDetailBrandSubmissionsEmptyProps,
  CampaignDetailBrandSubmissionsPaginationProps,
  CampaignDetailBrandSubmissionsProps,
  CampaignDetailBrandSubmissionsToolbarProps,
  CampaignDetailCreatorSubmissionsProps,
  CampaignDetailSubmissionsPlaceholderProps,
  CampaignSubmissionsTabProps,
  CreatorSubmissionsViewProps,
} from '@/features/submission/types';

export interface FeaturedCampaignCarouselProps {
  campaigns: CampaignCardItem[];
  className?: string;
  onSelectCampaign?: (campaign: CampaignCardItem) => void;
}

export interface FeaturedCampaignSlideProps {
  campaign: CampaignCardItem;
  isActive: boolean;
  onSelect?: (campaign: CampaignCardItem) => void;
  className?: string;
}

export interface FeaturedCampaignSkeletonProps {
  className?: string;
}

export interface CreatorCampaignsListProps {
  campaigns?: CampaignCardItem[];
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onSelectCampaign?: (campaign: CampaignCardItem) => void;
  className?: string;
}

export interface CreatorCampaignsEmptyStateProps {
  onReset?: () => void;
  className?: string;
}

export interface CreatorCampaignsErrorStateProps {
  error?: unknown;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export interface CreatorCampaignsProps {
  className?: string;
}

export interface CampaignFiltersToolbarProps {
  className?: string;
  placeholder?: string;
  showSort?: boolean;
}

export interface CampaignFilterOptionItem {
  value: string;
  label: string;
}

export interface CampaignFilterSelectProps {
  value: string;
  placeholder: string;
  options: readonly CampaignFilterOptionItem[];
  onValueChange: (value: string) => void;
  className?: string;
  contentClassName?: string;
}

export interface UseCampaignFiltersResult {
  searchTerm: string;
  category: string;
  campaignType: string;
  sort: string;
  hasActiveFilters: boolean;
  HandleSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  HandleSearchKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  ClearSearch: () => void;
  UpdateParam: (key: string, value: string | null) => void;
  ResetFilters: () => void;
}

export interface BriefDirectivesProps {
  brief?: CampaignBrief | null;
  layout?: 'grid' | 'stack';
  className?: string;
}

export interface BriefDosDontsProps {
  dos?: string[] | null;
  donts?: string[] | null;
  className?: string;
}

export interface BriefNarrationProps {
  narration?: string | null;
  className?: string;
}

export interface BriefTagsProps {
  hashtags?: string[] | null;
  mentionTags?: string[] | null;
  className?: string;
}

export interface BriefMaterialsListProps {
  materials?: CampaignMaterial[] | null;
  className?: string;
}

export interface CampaignBankDetails {
  bankName: string;
  accountNo: string;
  accountName: string;
}

export interface CampaignPaymentDetailsResponse {
  payment: CampaignPayment | null;
  walletBalance: number;
  bankDetails: CampaignBankDetails;
  budget: number;
  canPayWithWallet: boolean;
}

export interface BankTransferPaymentPayload {
  senderProviderName: string;
  senderAccountName: string;
  transferProofUrl: string;
}

export interface AdminVerifyPaymentPayload {
  action: 'APPROVE' | 'REJECT';
  rejectionReason?: string;
}

export interface CampaignFormStep6Props {
  className?: string;
}

export interface CampaignPaymentWalletOptionProps {
  campaignId: string;
  budget: number;
  walletBalance: number;
  canPay: boolean;
  className?: string;
  onPaymentSuccess?: () => void;
}

export interface CampaignPaymentTransferOptionProps {
  campaignId: string;
  totalPayable: number;
  uniqueCode: number;
  bankDetails: CampaignBankDetails;
  existingPayment?: CampaignPayment | null;
  className?: string;
  onPaymentSuccess?: () => void;
}

export interface AdminPaymentReviewCardProps {
  campaign: Campaign;
  className?: string;
  onVerificationSuccess?: () => void;
}



