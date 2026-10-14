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

export const CREATOR_WALLET_TRANSACTION_TABS: {
  key: 'ALL' | 'CAMPAIGN_EARNING' | 'WITHDRAWAL';
  label: string;
}[] = [
  { key: 'ALL', label: 'Semua Mutasi' },
  { key: 'CAMPAIGN_EARNING', label: 'Pendapatan Video' },
  { key: 'WITHDRAWAL', label: 'Penarikan Saldo' },
];

export const CREATOR_PAYOUT_PROVIDERS = [
  // E-Wallet (Dominan untuk Kreator)
  { value: 'DANA', label: 'DANA', type: 'E_WALLET' as const },
  { value: 'GOPAY', label: 'GoPay', type: 'E_WALLET' as const },
  { value: 'OVO', label: 'OVO', type: 'E_WALLET' as const },
  { value: 'SHOPEEPAY', label: 'ShopeePay', type: 'E_WALLET' as const },
  { value: 'LINKAJA', label: 'LinkAja', type: 'E_WALLET' as const },
  // Bank Digital & Konvensional
  { value: 'BCA', label: 'BCA (Bank Central Asia)', type: 'BANK_TRANSFER' as const },
  { value: 'MANDIRI', label: 'Bank Mandiri', type: 'BANK_TRANSFER' as const },
  { value: 'BRI', label: 'BRI (Bank Rakyat Indonesia)', type: 'BANK_TRANSFER' as const },
  { value: 'BNI', label: 'BNI (Bank Negara Indonesia)', type: 'BANK_TRANSFER' as const },
  { value: 'JAGO', label: 'Bank Jago', type: 'BANK_TRANSFER' as const },
  { value: 'SEABANK', label: 'SeaBank Indonesia', type: 'BANK_TRANSFER' as const },
  { value: 'BLU', label: 'blu by BCA Digital', type: 'BANK_TRANSFER' as const },
  { value: 'JENIUS', label: 'Jenius (BTPN)', type: 'BANK_TRANSFER' as const },
  { value: 'BSI', label: 'Bank Syariah Indonesia (BSI)', type: 'BANK_TRANSFER' as const },
  { value: 'CIMB', label: 'CIMB Niaga', type: 'BANK_TRANSFER' as const },
] as const;

export const CREATOR_ACCOUNT_VALIDATION_RULES: Record<
  string,
  { regex: RegExp; description: string; example: string }
> = {
  BCA: {
    regex: /^[0-9]{10}$/,
    description: 'Nomor rekening BCA harus terdiri dari 10 digit angka.',
    example: '1234567890',
  },
  MANDIRI: {
    regex: /^[0-9]{13}$/,
    description: 'Nomor rekening Mandiri harus terdiri dari 13 digit angka.',
    example: '1234567890123',
  },
  BNI: {
    regex: /^[0-9]{10}$/,
    description: 'Nomor rekening BNI harus terdiri dari 10 digit angka.',
    example: '1234567890',
  },
  BRI: {
    regex: /^[0-9]{15}$/,
    description: 'Nomor rekening BRI harus terdiri dari 15 digit angka.',
    example: '123456789012345',
  },
  BSI: {
    regex: /^[0-9]{10}$/,
    description: 'Nomor rekening BSI harus terdiri dari 10 digit angka.',
    example: '1234567890',
  },
  CIMB: {
    regex: /^[0-9]{10,14}$/,
    description: 'Nomor rekening CIMB Niaga harus terdiri dari 10-14 digit angka.',
    example: '123456789012',
  },
  JAGO: {
    regex: /^[0-9]{10,12}$/,
    description: 'Nomor rekening Bank Jago harus terdiri dari 10-12 digit angka.',
    example: '101234567890',
  },
  SEABANK: {
    regex: /^[0-9]{11,12}$/,
    description: 'Nomor rekening SeaBank harus terdiri dari 11-12 digit angka.',
    example: '90123456789',
  },
  BLU: {
    regex: /^[0-9]{10,12}$/,
    description: 'Nomor rekening blu by BCA Digital harus terdiri dari 10-12 digit angka.',
    example: '001234567890',
  },
  JENIUS: {
    regex: /^[0-9]{10,12}$/,
    description: 'Nomor rekening Jenius harus terdiri dari 10-12 digit angka.',
    example: '90012345678',
  },
  DANA: {
    regex: /^(08|628)[0-9]{8,12}$/,
    description: 'Nomor HP DANA harus berawalan 08 atau 628 (10-14 digit).',
    example: '081234567890',
  },
  GOPAY: {
    regex: /^(08|628)[0-9]{8,12}$/,
    description: 'Nomor HP GoPay harus berawalan 08 atau 628 (10-14 digit).',
    example: '081234567890',
  },
  OVO: {
    regex: /^(08|628)[0-9]{8,12}$/,
    description: 'Nomor HP OVO harus berawalan 08 atau 628 (10-14 digit).',
    example: '081234567890',
  },
  SHOPEEPAY: {
    regex: /^(08|628)[0-9]{8,12}$/,
    description: 'Nomor HP ShopeePay harus berawalan 08 atau 628 (10-14 digit).',
    example: '081234567890',
  },
  LINKAJA: {
    regex: /^(08|628)[0-9]{8,12}$/,
    description: 'Nomor HP LinkAja harus berawalan 08 atau 628 (10-14 digit).',
    example: '081234567890',
  },
};

