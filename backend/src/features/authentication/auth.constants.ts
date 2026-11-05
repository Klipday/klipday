import type { CookieOptions } from 'express';

export const AUTH_SALT_ROUNDS = 10;
export const AUTH_TOKEN_EXPIRES_IN = '1d';
export const AUTH_COOKIE_NAME = 'token';
export const AUTH_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const MIN_PASSWORD_LENGTH = 8;

export const EMAIL_VERIFICATION_CODE_LENGTH = 6;
export const EMAIL_VERIFICATION_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
export const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
export const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

/**
 * Regex for validating Indonesian mobile phone numbers starting with 62.
 * Validates prefix 628 followed by a non-zero digit and 7-11 trailing digits (total 11-15 digits).
 */
export const INDONESIAN_PHONE_REGEX = /^628[1-9][0-9]{7,11}$/;

/**
 * Regex for validating 6-digit numeric OTP codes.
 */
export const SIX_DIGIT_OTP_REGEX = /^[0-9]{6}$/;

export const AUTH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: AUTH_COOKIE_MAX_AGE_MS,
};

export const AUTH_CLEAR_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
};

export const AUTH_MESSAGES = {
  // Success messages
  REGISTER_SUCCESS: 'Account registered successfully.',
  LOGIN_SUCCESS: 'Login successful.',
  LOGOUT_SUCCESS: 'Logout successful.',
  ACCOUNT_LOADED: 'Account loaded successfully.',

  // Authentication & session errors
  INVALID_CREDENTIALS: 'Invalid email or password.',
  EMAIL_ALREADY_EXISTS: 'Email is already registered.',
  ACCOUNT_NOT_FOUND: 'Account not found.',
  AUTH_REQUIRED: 'Authentication required.',
  CONFIG_MISSING: 'Authentication configuration is missing.',
  SESSION_EXPIRED: 'Session has expired or is invalid.',
  EMAIL_VERIFICATION_REQUIRED: 'Email Anda belum diverifikasi. Silakan masukkan kode verifikasi.',

  // Verification & recovery messages
  INVALID_OR_EXPIRED_CODE: 'Kode verifikasi tidak valid atau telah kedaluwarsa.',
  VERIFICATION_SUCCESS: 'Email Anda berhasil diverifikasi. Selamat datang di Klipday!',
  RESEND_COOLDOWN_ACTIVE: 'Harap tunggu 60 detik sebelum meminta kode baru.',
  CODE_RESENT_SUCCESS: 'Kode verifikasi baru telah dikirimkan ke email Anda.',
  ACCOUNT_ALREADY_VERIFIED: 'Email Anda sudah terverifikasi. Silakan masuk.',
  FORGOT_PASSWORD_GENERIC_SUCCESS: 'Jika email terdaftar, tautan pengaturan ulang kata sandi telah dikirimkan.',
  INVALID_OR_EXPIRED_RESET_TOKEN: 'Tautan pengaturan ulang kata sandi tidak valid atau telah kedaluwarsa.',
  PASSWORD_RESET_SUCCESS: 'Kata sandi Anda berhasil diperbarui. Silakan masuk kembali.',
  TOKEN_REQUIRED: 'Token diperlukan.',
  CODE_REQUIRED: 'Kode verifikasi 6 digit diperlukan.',
  CODE_INVALID: 'Kode verifikasi harus terdiri dari 6 angka.',

  // Validation fallback messages
  INVALID_REQUEST: 'Invalid request data.',
  EMAIL_OR_PASSWORD_REQUIRED: 'Email or password is required.',

  // Zod schema field messages
  PASSWORD_REQUIRED: 'Password is required.',
  PASSWORD_MIN_LENGTH: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
  PASSWORD_UPPERCASE: 'Password must contain at least one uppercase letter.',
  PASSWORD_NUMBER: 'Password must contain at least one number.',
  PASSWORD_SYMBOL: 'Password must contain at least one symbol.',
  EMAIL_REQUIRED: 'Email is required.',
  EMAIL_INVALID: 'Invalid email address.',
  PHONE_REQUIRED: 'Phone number is required for brand accounts.',
  PHONE_INVALID: 'Nomor telepon harus diawali dengan 62 (contoh: 628123456789).',
  COMPANY_NAME_REQUIRED: 'Company name is required for brand accounts.',
  INDUSTRY_INVALID: 'Selected industry is invalid.',
  FULL_NAME_REQUIRED: 'Full name is required for creator accounts.',
} as const;
