import type { Prisma } from '../../generated/prisma/client.js';
import type { CampaignStatus, CampaignType, Category, Industry, MaterialType, PaymentStatus, Platform, Status } from '../../generated/prisma/enums.js';
import type {
  AdminVerifyPaymentInput,
  BankTransferPaymentInput,
  CampaignBriefInput,
  CampaignEditInput,
  CampaignMaterialItemInput,
  CampaignMaterialsInput,
  CampaignQueryInput,
  CampaignSortOption,
} from './campaign.schemas.js';

export type {
  AdminVerifyPaymentInput,
  BankTransferPaymentInput,
  CampaignBriefInput,
  CampaignEditInput,
  CampaignMaterialItemInput,
  CampaignMaterialsInput,
  CampaignQueryInput,
  CampaignSortOption,
};

export interface CampaignPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CampaignCardBrand {
  id: string;
  companyName: string;
  industry: Industry | null;
}

export interface CampaignCardCount {
  submissions: number;
}

export interface CampaignCardItem {
  id: string;
  title: string | null;
  description: string | null;
  campaignType: CampaignType;
  campaignCategory: Category;
  thumbnailUrl: string | null;
  platform: Platform;
  mainMediaUrl: string | null;
  cpm: Prisma.Decimal | number | null;
  minViews: number | null;
  maxViews: number | null;
  budget: Prisma.Decimal | number | null;
  startDate: Date | null;
  endDate: Date | null;
  status: Status;
  campaignStatus: CampaignStatus;
  isFeatured?: boolean;
  featuredBannerUrl?: string | null;
  featuredOrder?: number | null;
  featuredUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  brandId: string;
  brand: CampaignCardBrand;
  _count?: CampaignCardCount;
}

export interface CampaignCardMaterialItem {
  id: string;
  name: string;
  type: MaterialType;
  url: string;
  status: Status;
}

export interface CampaignCardBriefItem {
  id: string;
  purpose: string | null;
  keyMessage: string | null;
  narration?: string | null;
  impression?: string | null;
  callToAction: string | null;
  requiredCaption?: string | null;
  hashtags?: string[];
  mentionTags?: string[];
  dos?: string[];
  donts?: string[];
  guidelines?: string | null;
  status: Status;
}

export interface CampaignPaymentItem {
  id: string;
  campaignId: string;
  amount: Prisma.Decimal | number;
  uniqueCode: number;
  totalPayable: Prisma.Decimal | number;
  destinationBank: string;
  destinationAccount: string;
  senderProviderName: string | null;
  senderAccountName: string | null;
  transferProofUrl: string | null;
  paymentStatus: PaymentStatus;
  rejectionReason: string | null;
  verifiedByAdminId: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignBankDetails {
  bankName: string;
  accountNo: string;
  accountName: string;
}

export interface CampaignPaymentDetailsResponse {
  payment: CampaignPaymentItem | null;
  walletBalance: number;
  bankDetails: CampaignBankDetails;
  budget: number;
  canPayWithWallet: boolean;
}

export interface CampaignDetailItem extends CampaignCardItem {
  materials: CampaignCardMaterialItem[];
  brief: CampaignCardBriefItem | null;
  payments?: CampaignPaymentItem[];
}

export interface CampaignsPaginatedData {
  items: CampaignCardItem[];
  pagination: CampaignPaginationMeta;
}

export type CampaignStatusCounts = Record<CampaignStatus, number>;

export interface CampaignExistingFields {
  minViews?: number | null;
  maxViews?: number | null;
  budget?: Prisma.Decimal | number | null;
  cpm?: Prisma.Decimal | number | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
}

export type CampaignExistingRewardFields = CampaignExistingFields;

export interface CampaignSubmitCheckRecord {
  title?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  mainMediaUrl?: string | null;
  campaignType?: CampaignType | string | null;
  campaignCategory?: Category | string | null;
  platform?: Platform | string | null;
  cpm?: Prisma.Decimal | number | string | null;
  budget?: Prisma.Decimal | number | string | null;
  minViews?: number | null;
  maxViews?: number | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  materials?: Array<{ id: string; name: string; type: string; url: string; status: string }>;
  brief?: {
    purpose?: string | null;
    keyMessage?: string | null;
    callToAction?: string | null;
  } | null;
}
