/**
 * Domain constants, limits, options, and query keys for the creator feature module.
 */

import type { ContentCategoryOption } from './types';

export const CREATOR_QUERY_KEYS = {
  PROFILE: ['creator-profile'] as const,
} as const;

export const CREATOR_LIMITS = {
  MIN_AGE: 18,
  MAX_FULL_NAME_LENGTH: 100,
  MAX_BIO_LENGTH: 160,
  MIN_CATEGORIES: 1,
  MAX_CATEGORIES: 3,
  MAX_AVATAR_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
} as const;

/**
 * Regex for validating Indonesian mobile phone numbers starting with 62.
 * Validates prefix 628 followed by a non-zero digit and 7-11 trailing digits (total 11-15 digits).
 */
export const INDONESIAN_PHONE_REGEX = /^628[1-9][0-9]{7,11}$/;

export const CONTENT_CATEGORY_OPTIONS: ContentCategoryOption[] = [
  { value: 'BEAUTY_SKINCARE', label: 'Beauty & Skincare' },
  { value: 'FASHION_STYLE', label: 'Fashion & Style' },
  { value: 'FOOD_BEVERAGE', label: 'Food & Beverage' },
  { value: 'HEALTH_FITNESS', label: 'Health & Fitness' },
  { value: 'TECHNOLOGY_GADGETS', label: 'Technology & Gadgets' },
  { value: 'LIFESTYLE', label: 'Lifestyle' },
  { value: 'GAMING', label: 'Gaming' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'OTHER', label: 'Lainnya' },
];

export const CREATOR_UI_MESSAGES = {
  PROFILE_FETCH_ERROR: 'Gagal memuat profil kreator.',
  PROFILE_UPDATE_SUCCESS: 'Perubahan profil berhasil disimpan.',
  PROFILE_UPDATE_ERROR: 'Gagal memperbarui profil kreator.',
  AVATAR_UPLOAD_SUCCESS: 'Foto profil berhasil diperbarui.',
  AVATAR_UPLOAD_ERROR: 'Gagal mengunggah foto profil.',
  AVATAR_SIZE_ERROR: 'Ukuran foto maksimal 5 MB.',
  CATEGORY_MAX_REACHED: 'Anda hanya dapat memilih maksimal 3 kategori niche.',
  INVALID_PHONE_NUMBER: 'Nomor telepon harus diawali dengan 62 (contoh: 628123456789).',
} as const;
