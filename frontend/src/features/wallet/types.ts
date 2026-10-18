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

export interface WalletTransactionTabOption {
  key: WalletTransactionType;
  label: string;
}

export interface WalletHeaderProps {
  title: string;
  description: string;
  onOpenWithdrawal: () => void;
  onOpenTopUp?: () => void;
  className?: string;
}

export interface WalletMetricItem {
  label: string;
  value: number;
}

export interface WalletMetricsCardsProps {
  items: WalletMetricItem[];
  isLoading?: boolean;
  className?: string;
}

export interface WalletTransactionTypeFilterProps {
  activeType: WalletTransactionType;
  onTypeChange: (type: WalletTransactionType) => void;
  options?: WalletTransactionTabOption[];
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

export interface WalletTransactionTableProps {
  transactions: WalletTransactionItem[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  activeType?: WalletTransactionType;
  searchQuery?: string;
  onResetSearch?: () => void;
  className?: string;
}

export interface WalletTransactionEmptyStateProps {
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
  payoutAccountId?: string | null;
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
  payoutAccountId?: string;
  accountProvider?: string;
  accountNumber?: string;
  accountHolderName?: string;
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

export interface WalletPendingWithdrawalBannerProps {
  activeWithdrawals: PayoutRequestRecord[];
  role?: 'BRAND' | 'CREATOR';
  className?: string;
}

export interface WalletWithdrawalRequestsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activeWithdrawals: PayoutRequestRecord[];
  role?: 'BRAND' | 'CREATOR';
  className?: string;
}

export interface WalletWithdrawalRequestItemRowProps {
  withdrawal: PayoutRequestRecord;
  role?: 'BRAND' | 'CREATOR';
  className?: string;
}

export interface WalletWithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeBalance: number;
  onWithdrawalSuccess?: () => void;
  role?: 'BRAND' | 'CREATOR';
}

// =============================================================================
// Creator Wallet Types
// =============================================================================

export interface CreatorWalletMetrics {
  activeBalance: number;
  totalEarnings: number;
  totalWithdrawn: number;
  pendingWithdrawalsCount: number;
}

export interface CreatorWalletSummary {
  walletId: string;
  balance: number;
  metrics: CreatorWalletMetrics;
}

export interface CreatorTransactionItem {
  id: string;
  referenceCode: string | null;
  type: 'CAMPAIGN_EARNING' | 'WITHDRAWAL';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  transactionDate: string;
  createdAt: string;
  campaignId: string | null;
  campaignTitle: string | null;
  cpmRate: number | null;
  submissionId: string | null;
  videoUrl: string | null;
  verifiedViews: number | null;
}

export interface PaginatedCreatorTransactionsResponse {
  transactions: CreatorTransactionItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreatorTransactionQueryParams {
  type?: WalletTransactionType;
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreatorPayoutAccountRecord {
  id: string;
  walletId: string;
  accountType: 'BANK_TRANSFER' | 'E_WALLET';
  provider: string;
  accountNumber: string;
  accountHolderName: string;
  proofUrl: string;
  isPrimary: boolean;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCreatorPayoutAccountPayload {
  accountType: 'BANK_TRANSFER' | 'E_WALLET';
  provider: string;
  accountNumber: string;
  accountHolderName: string;
  proofUrl: string;
  isPrimary?: boolean;
}

export interface CreateCreatorWithdrawalPayload {
  amount: number;
  payoutAccountId: string;
}

export interface BankComboboxProps {
  id?: string;
  accountType?: 'BANK_TRANSFER' | 'E_WALLET' | 'ALL';
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  hasError?: boolean;
  placeholder?: string;
}

export interface AddPayoutAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingAccountsCount?: number;
  onSuccess?: () => void;
  role?: 'BRAND' | 'CREATOR';
}




