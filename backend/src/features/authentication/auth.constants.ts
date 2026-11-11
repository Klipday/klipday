import type { CookieOptions } from 'express';

export const AUTH_SALT_ROUNDS = 10;
export const AUTH_TOKEN_EXPIRES_IN = '1d';
export const AUTH_COOKIE_NAME = 'token';
const AUTH_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
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

/**
 * Determines whether cookies require secure HTTPS transmission.
 * Returns true if running in production, deployed on Vercel, or explicitly forced via COOKIE_SECURE=true.
 * Returns false if explicitly disabled via COOKIE_SECURE=false or in local/test environments.
 *
 * @returns Boolean flag indicating if secure HTTPS cookies should be enforced.
 */
export function IsCookieSecure(): boolean {
  if (process.env.COOKIE_SECURE !== undefined) {
    return process.env.COOKIE_SECURE === 'true';
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = Boolean(process.env.VERCEL);
  const secure = isProduction || isVercel;

  return secure;
}

/**
 * Resolves the SameSite attribute for authentication cookies.
 * In HTTPS environments (production or cross-origin Vercel deployment), defaults to 'none' to allow
 * cross-origin credentialed requests between frontend and backend.
 * In local HTTP development, defaults to 'lax' because browsers reject SameSite=None without Secure.
 * Can be overridden via the COOKIE_SAME_SITE environment variable ('lax' | 'strict' | 'none').
 *
 * @returns The resolved SameSite policy for the cookie.
 */
export function ResolveCookieSameSite(): 'lax' | 'strict' | 'none' {
  if (process.env.COOKIE_SAME_SITE) {
    const configured = process.env.COOKIE_SAME_SITE.toLowerCase();
    if (configured === 'lax' || configured === 'strict' || configured === 'none') {
      return configured;
    }
  }

  const secure = IsCookieSecure();
  const sameSite = secure ? 'none' : 'lax';

  return sameSite;
}

/**
 * Generates options for setting the authentication JWT session cookie.
 * Configures httpOnly, secure HTTPS, SameSite policy, path, and optional domain.
 *
 * @returns Express CookieOptions for issuing the session token cookie.
 */
export function GetAuthCookieOptions(): CookieOptions {
  const secure = IsCookieSecure();
  const sameSite = ResolveCookieSameSite();
  const configuredDomain = process.env.COOKIE_DOMAIN?.trim();

  const options: CookieOptions = {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
    ...(configuredDomain ? { domain: configuredDomain } : {}),
  };

  return options;
}

/**
 * Generates options for clearing the authentication JWT session cookie.
 * Matches the secure, sameSite, path, and domain attributes of the issued cookie so browsers clear it reliably.
 *
 * @returns Express CookieOptions for clearing the session token cookie.
 */
export function GetAuthClearCookieOptions(): CookieOptions {
  const secure = IsCookieSecure();
  const sameSite = ResolveCookieSameSite();
  const configuredDomain = process.env.COOKIE_DOMAIN?.trim();

  const options: CookieOptions = {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    ...(configuredDomain ? { domain: configuredDomain } : {}),
  };

  return options;
}

export const AUTH_COOKIE_OPTIONS: CookieOptions = GetAuthCookieOptions();

export const AUTH_CLEAR_COOKIE_OPTIONS: CookieOptions = GetAuthClearCookieOptions();

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
