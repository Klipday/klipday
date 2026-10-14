/**
 * Compile-time pure TypeScript interfaces and contracts for the creator feature module.
 * Adheres to AGENTS.md rule: Zero runtime overhead, all prop interfaces colocated here.
 */

export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

export type CreatorCategory =
  | 'BEAUTY_SKINCARE'
  | 'FASHION_STYLE'
  | 'FOOD_BEVERAGE'
  | 'HEALTH_FITNESS'
  | 'TECHNOLOGY_GADGETS'
  | 'LIFESTYLE'
  | 'GAMING'
  | 'TRAVEL'
  | 'ENTERTAINMENT'
  | 'OTHER';

export interface ContentCategoryOption {
  value: CreatorCategory;
  label: string;
}

export interface CreatorSocialSummary {
  username: string;
  avatarUrl: string | null;
  followersCount: number;
  isVerified: boolean;
}

export interface CreatorProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  phoneNumber: string | null;
  location: string | null;
  bio: string | null;
  contentCategories: CreatorCategory[];
  tiktokAccount: CreatorSocialSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCreatorProfilePayload {
  fullName?: string;
  dateOfBirth?: string | null;
  phoneNumber?: string | null;
  location?: string | null;
  bio?: string | null;
  contentCategories?: CreatorCategory[];
}

export interface CreatorProfileHeaderProps {
  profile: CreatorProfile;
  onAvatarUpload: (file: File) => void;
  isUploadingAvatar: boolean;
}

export interface CreatorProfileInfoFormProps {
  profile: CreatorProfile;
}

export interface CreatorCategoryPickerProps {
  selectedCategories: CreatorCategory[];
  onChange: (categories: CreatorCategory[]) => void;
  disabled?: boolean;
  className?: string;
}

export interface CreatorSocialAccountsTabProps {
  tiktokAccount: CreatorSocialSummary | null;
  onAccountChangeSuccess?: () => void;
  className?: string;
}

export interface CreatorPayoutAccountsTabProps {
  className?: string;
}

export interface CreatorProfileErrorStateProps {
  onRetry?: () => void;
  className?: string;
}

export interface CreatorProfileSkeletonProps {
  className?: string;
}
