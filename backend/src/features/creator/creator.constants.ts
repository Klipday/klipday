/**
 * Domain constants, limits, and projection selectors for the creator feature module.
 */

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

export const ALLOWED_AVATAR_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const CREATOR_MESSAGES = {
  AUTH_REQUIRED: 'Autentikasi diperlukan.',
  UNAUTHORIZED_ROLE: 'Akses ditolak. Fitur ini hanya dapat diakses oleh akun kreator.',
  CREATOR_NOT_FOUND: 'Profil kreator tidak ditemukan.',
  PROFILE_FETCH_SUCCESS: 'Profil kreator berhasil diambil.',
  PROFILE_UPDATE_SUCCESS: 'Profil kreator berhasil diperbarui.',
  AVATAR_UPLOAD_SUCCESS: 'Foto profil kreator berhasil diperbarui.',
  INVALID_PAYLOAD: 'Data profil yang dikirimkan tidak valid.',
  FULL_NAME_REQUIRED: 'Nama lengkap wajib diisi.',
  FULL_NAME_TOO_LONG: `Nama lengkap maksimal ${CREATOR_LIMITS.MAX_FULL_NAME_LENGTH} karakter.`,
  INVALID_DATE_OF_BIRTH: 'Format tanggal lahir tidak valid.',
  MIN_AGE_REQUIRED: `Usia kreator harus minimal ${CREATOR_LIMITS.MIN_AGE} tahun.`,
  FUTURE_DATE_NOT_ALLOWED: 'Tanggal lahir tidak boleh berada di masa depan.',
  INVALID_PHONE_NUMBER: 'Nomor telepon harus diawali dengan 62 (contoh: 628123456789).',
  BIO_TOO_LONG: `Bio maksimal ${CREATOR_LIMITS.MAX_BIO_LENGTH} karakter.`,
  CATEGORY_COUNT_INVALID: `Pilih antara ${CREATOR_LIMITS.MIN_CATEGORIES} hingga ${CREATOR_LIMITS.MAX_CATEGORIES} kategori konten.`,
  DUPLICATE_CATEGORIES: 'Kategori konten tidak boleh duplikat.',
  UNSUPPORTED_FILE_TYPE: 'Format file tidak didukung. Harap unggah foto JPEG, PNG, atau WebP.',
  FILE_SIZE_EXCEEDED: 'Ukuran foto profil melebihi batas maksimal 5 MB.',
  CONTENT_LENGTH_REQUIRED: 'Header Content-Length wajib disertakan pada permintaan pengunggahan.',
  STORAGE_CONFIG_MISSING: 'Konfigurasi penyimpanan server belum lengkap.',
  STORAGE_UPLOAD_FAILED: 'Gagal mengunggah foto profil ke cloud storage.',
} as const;
