export type IndustryType =
  | 'E_COMMERCE'
  | 'FOOD_AND_BEVERAGE'
  | 'FASHION_AND_BEAUTY'
  | 'TECHNOLOGY'
  | 'FINANCE'
  | 'HEALTH_AND_WELLNESS'
  | 'ENTERTAINMENT'
  | 'EDUCATION'
  | 'TRAVEL_AND_HOSPITALITY'
  | 'OTHER';

export type PayoutAccountType = 'BANK_TRANSFER' | 'E_WALLET';

export type VerificationStatusType = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

export interface BrandProfile {
  id: string;
  companyName: string;
  email: string;
  phoneNumber: string | null;
  industry: IndustryType | null;
  logoUrl: string | null;
  location: string | null;
  website: string | null;
  description: string | null;
  instagramHandle: string | null;
  tiktokHandle: string | null;
  xHandle: string | null;
  threadsHandle: string | null;
  youtubeChannel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BrandPayoutAccount {
  id: string;
  walletId: string;
  brandId: string | null;
  accountType: PayoutAccountType;
  provider: string;
  accountNumber: string;
  accountHolderName: string;
  proofUrl: string;
  isPrimary: boolean;
  verificationStatus: VerificationStatusType;
  rejectionReason: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBrandProfilePayload {
  companyName: string;
  industry?: IndustryType | null;
  location?: string | null;
  website?: string | null;
  description?: string | null;
  instagramHandle?: string | null;
  tiktokHandle?: string | null;
  xHandle?: string | null;
  threadsHandle?: string | null;
  youtubeChannel?: string | null;
}

export interface CreateBrandPayoutAccountPayload {
  accountType: PayoutAccountType;
  provider: string;
  accountNumber: string;
  accountHolderName: string;
  proofUrl: string;
  isPrimary?: boolean;
}

export interface BrandProfileHeaderProps {
  profile: BrandProfile;
  onLogoUpload: (file: File) => void;
  isUploadingLogo: boolean;
}

export interface BrandLocationComboboxProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export type {
  BankComboboxProps,
  BankComboboxProps as BrandBankComboboxProps,
  AddPayoutAccountDialogProps,
} from '@/features/wallet/types';

export interface BrandProfileInfoFormProps {
  profile: BrandProfile;
}

export interface PayoutAccountCardProps {
  account: BrandPayoutAccount;
  onSetPrimary: (id: string) => void;
  onDelete: (id: string, isPendingCancel?: boolean) => void;
  isSettingPrimary: boolean;
  isDeleting: boolean;
}

export interface BrandPayoutAccountsTabProps {
  accounts: BrandPayoutAccount[];
  isLoading: boolean;
  onAddAccountClick: () => void;
}

export interface BrandSocialIconProps {
  className?: string;
}
