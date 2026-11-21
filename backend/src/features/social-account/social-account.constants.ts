export const VERIFICATION_CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export const SOCIAL_ACCOUNT_SWITCH_COOLDOWN_DAYS = 30;
export const SOCIAL_ACCOUNT_SWITCH_COOLDOWN_MS =
  SOCIAL_ACCOUNT_SWITCH_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export const TIKTOK_RECENT_VIDEOS_DEFAULT_LIMIT = 12;

export const SOCIAL_ACCOUNT_MESSAGES = {
  // Authentication & Guards
  AUTH_REQUIRED: 'Authentication required.',
  ONLY_CREATORS_CAN_CONNECT: 'Only creators can connect TikTok accounts.',
  ONLY_CREATORS_CAN_ACCESS_VIDEOS: 'Only creators can access recent TikTok videos.',
  ONLY_CREATORS_CAN_VALIDATE_VIDEOS: 'Only creators can validate TikTok videos.',
  CREATOR_NOT_FOUND: 'Creator profile not found.',
  INVALID_PAYLOAD: 'Invalid request payload.',

  // Verification code request
  USERNAME_ALREADY_CONNECTED: 'This TikTok username is already connected to another creator.',
  ACCOUNT_ALREADY_VERIFIED: (username: string) =>
    `Account @${username} is already verified and reactivated successfully.`,
  ACCOUNT_SWITCH_COOLDOWN: (remainingDays: number, availableDateLabel: string) =>
    `Anda baru dapat mengganti akun TikTok dalam ${remainingDays} hari lagi (${availableDateLabel}).`,
  CODE_REQUEST_SUCCESS: 'Bio verification code generated successfully.',

  // Verification check
  CHALLENGE_NOT_FOUND: 'Please request a verification code first.',
  CODE_EXPIRED: 'Verification code has expired. Please request a new code.',
  CODE_NOT_FOUND_IN_BIO: (code: string, username: string) =>
    `Verification code [${code}] was not detected in @${username}'s TikTok bio. Please ensure your bio is saved and try again.`,
  PROFILE_ACCESS_FAILED: (username: string) =>
    `Unable to access TikTok profile @${username}. Please make sure your account is public and try again.`,
  VERIFY_SUCCESS: 'TikTok account verified successfully. You may now remove the code from your bio.',

  // Account status & retrieval
  CONNECTED_ACCOUNT_RETRIEVED: 'Connected social account retrieved successfully.',
  NO_VERIFIED_TIKTOK: 'No verified TikTok account found.',
  ACCOUNT_NOT_VERIFIED: 'Please verify your TikTok account first.',

  // Video fetching & validation
  RECENT_VIDEOS_FAILED:
    'Failed to retrieve recent TikTok videos. You can enter a video link manually or try again.',
  RECENT_VIDEOS_SUCCESS: 'Recent TikTok videos retrieved successfully.',
  VIDEO_VERIFY_FAILED:
    'Unable to verify TikTok video link. Please ensure the link is correct and the video is public.',
  VIDEO_AUTHOR_MISMATCH: (author: string, verified: string) =>
    `This video belongs to @${author}, not your verified TikTok account (@${verified}).`,
  VIDEO_VALID_SUCCESS: 'Video link is valid.',

  // Zod validation messages
  USERNAME_REQUIRED: 'TikTok username is required.',
  USERNAME_TOO_LONG: 'TikTok username cannot exceed 50 characters.',
  USERNAME_INVALID_FORMAT:
    'TikTok username may only contain letters, numbers, periods, and underscores.',
  VIDEO_URL_INVALID: 'Invalid TikTok video URL.',
  VIDEO_URL_MUST_BE_TIKTOK: 'URL must be a valid TikTok video link (tiktok.com).',
} as const;
