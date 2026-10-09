import type {
  PaymentStatus,
  PayoutStatus,
  WalletTransactionType,
} from '../../generated/prisma/enums.js';

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
  type: WalletTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  transactionDate: Date;
  campaignId: string | null;
  submissionId: string | null;
  createdAt: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

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
  cancellationRequestedAt: Date | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
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
