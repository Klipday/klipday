export type WalletTransactionType =
  | 'ALL'
  | 'BRAND_DEPOSIT'
  | 'CAMPAIGN_PAYMENT'
  | 'CAMPAIGN_REFUND'
  | 'CAMPAIGN_EARNING'
  | 'WITHDRAWAL';

export type PaymentStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message: string;
}

export interface BrandWalletMetrics {
  activeBalance: number;
  lockedBalance: number;
  totalCreatorPayout: number;
}

export interface BrandWalletSummary {
  walletId: string;
  balance: number;
  metrics: BrandWalletMetrics;
}

export interface WalletTransactionItem {
  id: string;
  referenceCode: string | null;
  type:
    | 'BRAND_DEPOSIT'
    | 'CAMPAIGN_PAYMENT'
    | 'CAMPAIGN_REFUND'
    | 'CAMPAIGN_EARNING'
    | 'WITHDRAWAL';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  transactionDate: string;
  campaignId: string | null;
  submissionId: string | null;
  createdAt: string;
}

export interface TopUpRequestRecord {
  id: string;
  referenceCode: string;
  walletId: string;
  amount: number;
  uniqueCode: number;
  totalPayable: number;
  destinationBank: string;
  destinationAccount: string;
  destinationHolderName: string;
  senderBank: string | null;
  senderAccountName: string | null;
  transferProofUrl: string | null;
  status: PaymentStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTopUpPayload {
  amount: number;
  senderBank: string;
  senderAccountName: string;
  transferProofUrl?: string;
}

export interface PaginatedTransactionsResponse {
  transactions: WalletTransactionItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TransactionQueryParams {
  type?: WalletTransactionType;
  page?: number;
  limit?: number;
  search?: string;
}

export interface SimulateApprovalResult {
  topUp: TopUpRequestRecord;
  wallet: {
    id: string;
    balance: number;
  };
  transaction: {
    id: string;
    referenceCode: string | null;
    amount: number;
    balanceAfter: number;
  };
}

export interface BrandWalletHeaderProps {
  onOpenTopUp: () => void;
  onOpenWithdrawal: () => void;
  className?: string;
}

export interface BrandWalletMetricsCardsProps {
  summary?: BrandWalletSummary;
  isLoading?: boolean;
  className?: string;
}

export interface BrandTransactionFilterTabsProps {
  activeType: WalletTransactionType;
  onTypeChange: (type: WalletTransactionType) => void;
  className?: string;
}

export interface BrandTransactionTypeFilterProps {
  activeType: WalletTransactionType;
  onTypeChange: (type: WalletTransactionType) => void;
  className?: string;
}

export interface BrandPendingTopUpBannerProps {
  activeTopUps: TopUpRequestRecord[];
  onResumeTopUp: (topUp: TopUpRequestRecord) => void;
  className?: string;
}

export interface BrandTopUpRequestsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activeTopUps: TopUpRequestRecord[];
  onResumeTopUp: (topUp: TopUpRequestRecord) => void;
  className?: string;
}

export interface BrandTopUpRequestItemRowProps {
  topUp: TopUpRequestRecord;
  onResumeTopUp: (topUp: TopUpRequestRecord) => void;
  className?: string;
}

export interface BrandTransactionTableProps {
  transactions: WalletTransactionItem[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  searchQuery?: string;
  onResetSearch?: () => void;
  className?: string;
}

export interface BrandTransactionEmptyStateProps {
  hasFilter?: boolean;
  onResetFilter?: () => void;
  className?: string;
}

export interface SubmitTopUpProofPayload {
  transferProofUrl?: string;
}

export interface BrandTopUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTopUpSuccess?: () => void;
  initialTopUp?: TopUpRequestRecord | null;
}

export type PayoutStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PayoutRequestRecord {
  id: string;
  referenceCode: string;
  walletId: string;
  amount: number;
  accountProvider: string;
  accountNumber: string;
  accountHolderName: string;
  payoutStatus: PayoutStatus;
  rejectionReason: string | null;
  transferProofUrl: string | null;
  adminNote: string | null;
  cancellationRequestedAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RequestWithdrawalCancellationPayload {
  reason?: string;
}

export interface CreateWithdrawalPayload {
  amount: number;
  accountProvider: string;
  accountNumber: string;
  accountHolderName: string;
}

export interface SimulateWithdrawalResult {
  payout: PayoutRequestRecord;
  wallet: {
    id: string;
    balance: number;
  };
  transaction: {
    id: string;
    referenceCode: string | null;
    amount: number;
    balanceAfter: number;
  };
}

export interface BrandPendingWithdrawalBannerProps {
  activeWithdrawals: PayoutRequestRecord[];
  className?: string;
}

export interface BrandWithdrawalRequestsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activeWithdrawals: PayoutRequestRecord[];
  className?: string;
}

export interface BrandWithdrawalRequestItemRowProps {
  withdrawal: PayoutRequestRecord;
  className?: string;
}

export interface BrandWithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeBalance: number;
  onWithdrawalSuccess?: () => void;
  defaultBank?: {
    accountProvider?: string;
    accountNumber?: string;
    accountHolderName?: string;
  };
}

