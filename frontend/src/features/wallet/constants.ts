import type { WalletTransactionTabOption, WalletTransactionType } from './types';

export type { WalletTransactionTabOption, WalletTransactionType };

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

export const CREATOR_WALLET_TRANSACTION_TABS: WalletTransactionTabOption[] = [
  { key: 'ALL', label: 'Semua Transaksi' },
  { key: 'CAMPAIGN_EARNING', label: 'Penghasilan Kampanye' },
  { key: 'WITHDRAWAL', label: 'Penarikan Saldo' },
];
export interface SupportedBankItem {
  code: string;
  name: string;
  category: 'POPULAR' | 'COMMERCIAL' | 'DIGITAL' | 'REGIONAL';
}

export const SUPPORTED_BANKS: readonly SupportedBankItem[] = [
  // Popular / Major
  { code: 'BCA', name: 'Bank Central Asia (BCA)', category: 'POPULAR' },
  { code: 'MANDIRI', name: 'Bank Mandiri', category: 'POPULAR' },
  { code: 'BNI', name: 'Bank Negara Indonesia (BNI)', category: 'POPULAR' },
  { code: 'BRI', name: 'Bank Rakyat Indonesia (BRI)', category: 'POPULAR' },
  { code: 'BSI', name: 'Bank Syariah Indonesia (BSI)', category: 'POPULAR' },
  { code: 'CIMB', name: 'CIMB Niaga', category: 'POPULAR' },
  { code: 'PERMATA', name: 'Permata Bank', category: 'POPULAR' },
  { code: 'DANAMON', name: 'Bank Danamon', category: 'POPULAR' },

  // Digital Banks
  { code: 'JAGO', name: 'Bank Jago', category: 'DIGITAL' },
  { code: 'SEABANK', name: 'SeaBank', category: 'DIGITAL' },
  { code: 'BLU', name: 'blu by BCA Digital', category: 'DIGITAL' },
  { code: 'JENIUS', name: 'Jenius (BTPN)', category: 'DIGITAL' },
  { code: 'ALLOBANK', name: 'Allo Bank', category: 'DIGITAL' },
  { code: 'SUPERBANK', name: 'Superbank', category: 'DIGITAL' },
  { code: 'BNC', name: 'Bank Neo Commerce (BNC)', category: 'DIGITAL' },
  { code: 'RAYA', name: 'Bank Raya', category: 'DIGITAL' },

  // Commercial / Private / State
  { code: 'BTN', name: 'Bank Tabungan Negara (BTN)', category: 'COMMERCIAL' },
  { code: 'PANIN', name: 'Panin Bank', category: 'COMMERCIAL' },
  { code: 'OCBC', name: 'OCBC NISP', category: 'COMMERCIAL' },
  { code: 'MAYBANK', name: 'Maybank Indonesia', category: 'COMMERCIAL' },
  { code: 'SINARMAS', name: 'Bank Sinarmas', category: 'COMMERCIAL' },
  { code: 'MEGA', name: 'Bank Mega', category: 'COMMERCIAL' },
  { code: 'MUAMALAT', name: 'Bank Muamalat', category: 'COMMERCIAL' },
  { code: 'BCA_SYARIAH', name: 'BCA Syariah', category: 'COMMERCIAL' },

  // Regional Development Banks (BPD)
  { code: 'BPD_DKI', name: 'Bank DKI', category: 'REGIONAL' },
  { code: 'BPD_BJB', name: 'Bank BJB (Jawa Barat)', category: 'REGIONAL' },
  { code: 'BPD_JATENG', name: 'Bank Jateng', category: 'REGIONAL' },
  { code: 'BPD_JATIM', name: 'Bank Jatim', category: 'REGIONAL' },
  { code: 'BPD_SUMUT', name: 'Bank Sumut', category: 'REGIONAL' },
  { code: 'BPD_NAGARI', name: 'Bank Nagari (Sumbar)', category: 'REGIONAL' },
  { code: 'BPD_DIY', name: 'Bank BPD DIY', category: 'REGIONAL' },
  { code: 'BPD_SULSELBAR', name: 'Bank Sulselbar', category: 'REGIONAL' },
  { code: 'BPD_KALSEL', name: 'Bank Kalsel', category: 'REGIONAL' },
  { code: 'BPD_KALTIMTARA', name: 'Bank Kaltimtara', category: 'REGIONAL' },
  { code: 'BPD_PAPUA', name: 'Bank Papua', category: 'REGIONAL' },
] as const;

export const SUPPORTED_EWALLETS = [
  { code: 'GOPAY', name: 'GoPay' },
  { code: 'OVO', name: 'OVO' },
  { code: 'DANA', name: 'DANA' },
  { code: 'SHOPEEPAY', name: 'ShopeePay' },
  { code: 'LINKAJA', name: 'LinkAja' },
] as const;

export const PROVIDER_ACCOUNT_RULES: Record<
  string,
  { regex: RegExp; description: string; example: string }
> = {
  BCA: {
    regex: /^[0-9]{10}$/,
    description: 'Nomor rekening BCA harus 10 digit angka.',
    example: '1234567890',
  },
  MANDIRI: {
    regex: /^[0-9]{13}$/,
    description: 'Nomor rekening Mandiri harus 13 digit angka.',
    example: '1234567890123',
  },
  BNI: {
    regex: /^[0-9]{10}$/,
    description: 'Nomor rekening BNI harus 10 digit angka.',
    example: '1234567890',
  },
  BRI: {
    regex: /^[0-9]{15}$/,
    description: 'Nomor rekening BRI harus 15 digit angka.',
    example: '123456789012345',
  },
  BSI: {
    regex: /^[0-9]{10}$/,
    description: 'Nomor rekening BSI harus 10 digit angka.',
    example: '1234567890',
  },
  CIMB: {
    regex: /^[0-9]{10,14}$/,
    description: 'Nomor rekening CIMB Niaga harus 10-14 digit angka.',
    example: '123456789012',
  },
  PERMATA: {
    regex: /^[0-9]{10,16}$/,
    description: 'Nomor rekening Permata harus 10-16 digit angka.',
    example: '1234567890',
  },
  DANAMON: {
    regex: /^[0-9]{10,12}$/,
    description: 'Nomor rekening Danamon harus 10-12 digit angka.',
    example: '1234567890',
  },
  BTN: {
    regex: /^[0-9]{10,16}$/,
    description: 'Nomor rekening BTN harus 10-16 digit angka.',
    example: '123456789012',
  },
  JAGO: {
    regex: /^[0-9]{10,12}$/,
    description: 'Nomor rekening Bank Jago harus 10-12 digit angka.',
    example: '101234567890',
  },
  SEABANK: {
    regex: /^[0-9]{11,12}$/,
    description: 'Nomor rekening SeaBank harus 11-12 digit angka.',
    example: '90123456789',
  },
  BLU: {
    regex: /^[0-9]{10,12}$/,
    description: 'Nomor rekening blu by BCA Digital harus 10-12 digit angka.',
    example: '001234567890',
  },
  JENIUS: {
    regex: /^[0-9]{10,12}$/,
    description: 'Nomor rekening Jenius (BTPN) harus 10-12 digit angka.',
    example: '90012345678',
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
  DANA: {
    regex: /^(08|628)[0-9]{8,12}$/,
    description: 'Nomor HP DANA harus berawalan 08 atau 628 (10-14 digit).',
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

export const PAYOUT_ACCOUNT_LIMITS = {
  MAX_PAYOUT_ACCOUNTS: 3,
  MIN_PROVIDER_LENGTH: 2,
  MIN_ACCOUNT_NUMBER_LENGTH: 4,
  MAX_ACCOUNT_NUMBER_LENGTH: 30,
  MIN_ACCOUNT_HOLDER_LENGTH: 2,
  MAX_ACCOUNT_HOLDER_LENGTH: 100,
  MAX_PROOF_SIZE_BYTES: 5 * 1024 * 1024,
} as const;

export const PAYOUT_ACCOUNT_MESSAGES = {
  PROVIDER_REQUIRED: 'Pilih bank atau e-wallet.',
  ACCOUNT_NUMBER_MIN: 'Nomor rekening/e-wallet minimal 4 digit.',
  ACCOUNT_NUMBER_MAX: 'Nomor rekening/e-wallet maksimal 30 digit.',
  ACCOUNT_NUMBER_NUMERIC: 'Nomor rekening/e-wallet hanya boleh berisi angka.',
  ACCOUNT_HOLDER_MIN: 'Nama pemilik akun minimal 2 karakter.',
  ACCOUNT_HOLDER_MAX: 'Nama pemilik akun maksimal 100 karakter.',
  PROOF_URL_REQUIRED: 'Wajib mengunggah foto bukti kepemilikan akun.',
  PROOF_SIZE_EXCEEDED: 'Ukuran berkas bukti maksimal 5 MB.',
  PROOF_UPLOAD_SUCCESS: 'Foto bukti rekening berhasil diunggah.',
} as const;

export const CREATOR_PAYOUT_PROVIDERS = [
  ...SUPPORTED_EWALLETS.map((e) => ({ value: e.code, label: e.name, type: 'E_WALLET' as const })),
  ...SUPPORTED_BANKS.map((b) => ({ value: b.code, label: b.name, type: 'BANK_TRANSFER' as const })),
] as const;

export const CREATOR_ACCOUNT_VALIDATION_RULES = PROVIDER_ACCOUNT_RULES;

