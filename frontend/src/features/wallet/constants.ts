import type { WalletTransactionType } from './types';

export const KLIPDAY_DESTINATION_BANK = {
  bankName: 'BCA',
  accountNumber: '1234567890',
  accountHolderName: 'PT Klipday Media Kreasi',
  branch: 'KCP Sudirman Jakarta',
} as const;

export const TOP_UP_LIMITS = {
  MIN_AMOUNT: 50_000,
  MAX_AMOUNT: 100_000_000,
  MAX_PROOF_SIZE_BYTES: 5 * 1024 * 1024,
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
} as const;

export const WITHDRAWAL_LIMITS = {
  MIN_AMOUNT: 50_000,
  MAX_AMOUNT: 100_000_000,
} as const;



export interface WalletTransactionTabOption {
  key: WalletTransactionType;
  label: string;
}

export const WALLET_TRANSACTION_TABS: WalletTransactionTabOption[] = [
  { key: 'ALL', label: 'Semua Transaksi' },
  { key: 'BRAND_DEPOSIT', label: 'Top Up' },
  { key: 'CAMPAIGN_PAYMENT', label: 'Pembayaran Kampanye' },
  { key: 'CAMPAIGN_REFUND', label: 'Refund Saldo' },
  { key: 'CAMPAIGN_EARNING', label: 'Penghasilan Kampanye' },
  { key: 'WITHDRAWAL', label: 'Penarikan Saldo' },
];

export const TRANSACTION_TYPE_CONFIG = {
  BRAND_DEPOSIT: {
    label: 'Top Up Saldo',
    sign: '+',
    amountClass: 'text-emerald-600 dark:text-emerald-400 font-semibold',
    badgeClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  CAMPAIGN_PAYMENT: {
    label: 'Pembayaran Kampanye',
    sign: '-',
    amountClass: 'text-foreground font-semibold',
    badgeClass: 'border-border/60 bg-muted/40 text-muted-foreground',
  },
  CAMPAIGN_REFUND: {
    label: 'Refund Sisa Anggaran',
    sign: '+',
    amountClass: 'text-blue-600 dark:text-blue-400 font-semibold',
    badgeClass: 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  CAMPAIGN_EARNING: {
    label: 'Penghasilan Kampanye',
    sign: '+',
    amountClass: 'text-emerald-600 dark:text-emerald-400 font-semibold',
    badgeClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  WITHDRAWAL: {
    label: 'Penarikan Saldo',
    sign: '-',
    amountClass: 'text-amber-600 dark:text-amber-400 font-semibold',
    badgeClass: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  },
} as const;
