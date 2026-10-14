/**
 * Domain constants, limits, and validation messages for the authentication feature module.
 */

export const MIN_PASSWORD_LENGTH = 8;

/**
 * Regex for validating Indonesian mobile phone numbers starting with 62.
 * Validates prefix 628 followed by a non-zero digit and 7-11 trailing digits (total 11-15 digits).
 */
export const INDONESIAN_PHONE_REGEX = /^628[1-9][0-9]{7,11}$/;

export const INDUSTRY_OPTIONS = [
  'E_COMMERCE',
  'FOOD_AND_BEVERAGE',
  'FASHION_AND_BEAUTY',
  'TECHNOLOGY',
  'FINANCE',
  'HEALTH_AND_WELLNESS',
  'ENTERTAINMENT',
  'EDUCATION',
  'TRAVEL_AND_HOSPITALITY',
  'OTHER',
] as const;

export type Industry = (typeof INDUSTRY_OPTIONS)[number];

export const AUTH_VALIDATION_MESSAGES = {
  EMAIL_INVALID: 'Email tidak valid.',
  PASSWORD_MIN: `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`,
  PASSWORD_UPPERCASE: 'Kata sandi harus mengandung huruf kapital.',
  PASSWORD_NUMBER: 'Kata sandi harus mengandung angka.',
  PASSWORD_SYMBOL: 'Kata sandi harus mengandung simbol.',
  CONFIRM_PASSWORD_REQUIRED: 'Konfirmasi kata sandi wajib diisi.',
  CONFIRM_PASSWORD_MISMATCH: 'Kata sandi dan konfirmasi kata sandi tidak cocok.',
  FULL_NAME_REQUIRED: 'Nama lengkap wajib diisi.',
  COMPANY_NAME_REQUIRED: 'Nama perusahaan wajib diisi.',
  PHONE_REQUIRED: 'Nomor telepon wajib diisi.',
  PHONE_INVALID: 'Nomor telepon harus diawali dengan 62 (contoh: 628123456789).',
  INDUSTRY_REQUIRED: 'Industri wajib dipilih.',
  INDUSTRY_INVALID: 'Pilih industri yang valid dari daftar.',
} as const;
