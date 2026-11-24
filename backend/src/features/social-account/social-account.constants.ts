import { Platform } from '../../generated/prisma/enums.js';

export const VERIFICATION_CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export const SOCIAL_ACCOUNT_SWITCH_COOLDOWN_DAYS = 30;
export const SOCIAL_ACCOUNT_SWITCH_COOLDOWN_MS =
  SOCIAL_ACCOUNT_SWITCH_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export const TIKTOK_RECENT_VIDEOS_DEFAULT_LIMIT = 12;

export const SOCIAL_PLATFORM_DISPLAY_NAMES: Record<Platform, string> = {
  [Platform.TIKTOK]: 'TikTok',
  [Platform.INSTAGRAM]: 'Instagram',
  [Platform.YOUTUBE]: 'YouTube',
};

export const SOCIAL_ACCOUNT_MESSAGES = {
  // Authentication & Guards
  AUTH_REQUIRED: 'Authentication required.',
  ONLY_CREATORS_CAN_CONNECT: 'Only creators can connect social media accounts.',
  ONLY_CREATORS_CAN_ACCESS_VIDEOS: 'Only creators can access recent social videos.',
  ONLY_CREATORS_CAN_VALIDATE_VIDEOS: 'Only creators can validate social videos.',
  CREATOR_NOT_FOUND: 'Creator profile not found.',
  INVALID_PAYLOAD: 'Invalid request payload.',
  UNSUPPORTED_PLATFORM: 'Platform media sosial tidak didukung. Gunakan TikTok, Instagram, atau YouTube.',

  // Verification code request
  USERNAME_ALREADY_CONNECTED: 'This TikTok username is already connected to another creator.',
  USERNAME_ALREADY_CONNECTED_PLATFORM: (platformName: string) =>
    `Username ${platformName} ini sudah terhubung dengan kreator lain.`,
  ACCOUNT_ALREADY_VERIFIED: (username: string) =>
    `Account @${username} is already verified and reactivated successfully.`,
  ACCOUNT_SWITCH_COOLDOWN: (remainingDays: number, availableDateLabel: string, platformName = 'TikTok') =>
    `Anda baru dapat mengganti akun ${platformName} dalam ${remainingDays} hari lagi (${availableDateLabel}).`,
  CODE_REQUEST_SUCCESS: 'Bio verification code generated successfully.',

  // Verification check
  CHALLENGE_NOT_FOUND: 'Please request a verification code first.',
  CODE_EXPIRED: 'Verification code has expired. Please request a new code.',
  CODE_NOT_FOUND_IN_BIO: (code: string, username: string, platformName = 'TikTok') =>
    `Verification code [${code}] was not detected in @${username}'s ${platformName} bio. Please ensure your bio is saved and try again.`,
  PROFILE_ACCESS_FAILED: (username: string, platformName = 'TikTok') =>
    `Unable to access ${platformName} profile @${username}. Please make sure your account is public and try again.`,
  PROFILE_PRIVATE: (username: string, platformName: string) =>
    `Akun ${platformName} @${username} bersifat privat. Ubah akun menjadi Publik terlebih dahulu agar dapat diverifikasi.`,
  VERIFY_SUCCESS: 'TikTok account verified successfully. You may now remove the code from your bio.',
  VERIFY_SUCCESS_PLATFORM: (platformName: string) =>
    `Akun ${platformName} berhasil diverifikasi. Anda sekarang dapat menghapus kode dari bio Anda.`,

  // Account status & retrieval
  CONNECTED_ACCOUNT_RETRIEVED: 'Connected social account retrieved successfully.',
  CONNECTED_ACCOUNTS_RETRIEVED: 'Connected social accounts retrieved successfully.',
  NO_VERIFIED_TIKTOK: 'No verified TikTok account found.',
  NO_VERIFIED_PLATFORM_ACCOUNT: (platformName: string) =>
    `Belum ada akun ${platformName} yang terverifikasi.`,
  ACCOUNT_NOT_VERIFIED: 'Please verify your TikTok account first.',
  ACCOUNT_NOT_VERIFIED_PLATFORM: (platformName: string) =>
    `Harap verifikasi akun ${platformName} Anda terlebih dahulu.`,

  // Video fetching & validation
  RECENT_VIDEOS_FAILED:
    'Failed to retrieve recent videos. You can enter a video link manually or try again.',
  RECENT_VIDEOS_SUCCESS: 'Recent videos retrieved successfully.',
  VIDEO_VERIFY_FAILED:
    'Unable to verify video link. Please ensure the link is correct and the video is public.',
  VIDEO_AUTHOR_MISMATCH: (author: string, verified: string, platformName = 'TikTok') =>
    `This video belongs to @${author}, not your verified ${platformName} account (@${verified}).`,
  VIDEO_VALID_SUCCESS: 'Video link is valid.',

  // Zod validation messages
  USERNAME_REQUIRED: 'Username media sosial wajib diisi.',
  USERNAME_TOO_LONG: 'Username tidak boleh melebihi 50 karakter.',
  USERNAME_INVALID_FORMAT:
    'Username hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda hubung.',
  VIDEO_URL_INVALID: 'Tautan video tidak valid.',
  VIDEO_URL_MUST_BE_TIKTOK: 'URL must be a valid TikTok video link (tiktok.com).',
  VIDEO_URL_MUST_BE_INSTAGRAM: 'Tautan harus berupa link Instagram Reels yang valid (instagram.com/reel/...).',
  VIDEO_URL_MUST_BE_YOUTUBE_SHORTS: 'Hanya tautan YouTube Shorts yang diperbolehkan (youtube.com/shorts/...).',
} as const;
