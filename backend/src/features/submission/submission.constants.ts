import { Platform, SubmissionStatus } from '../../generated/prisma/enums.js';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;
export const MAX_CAPTION_LENGTH = 2000;
export const MAX_SEARCH_LENGTH = 100;
export const MAX_REVIEW_NOTE_LENGTH = 1000;
export const CPM_VIEW_DIVISOR = 1000;
export const BUDGET_DECIMAL_PLACES = 2;
export const MAX_CONCURRENT_PENDING_REVIEW_PER_CAMPAIGN = 5;

export const ALLOWED_TIKTOK_VIDEO_HOSTS = [
  'tiktok.com',
  'www.tiktok.com',
  'm.tiktok.com',
  'vm.tiktok.com',
  'vt.tiktok.com',
] as const;

export const ALLOWED_INSTAGRAM_VIDEO_HOSTS = [
  'instagram.com',
  'www.instagram.com',
  'm.instagram.com',
] as const;

export const ALLOWED_YOUTUBE_VIDEO_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
] as const;

export const ALLOWED_THUMBNAIL_HOST_SUFFIXES = [
  'tiktokcdn.com',
  'tiktokcdn-us.com',
  'tiktokcdn-eu.com',
  'tiktokv.com',
  'ibytedtos.com',
  'muscdn.com',
  'cdninstagram.com',
  'fbcdn.net',
  'img.youtube.com',
  'ytimg.com',
  'ggpht.com',
  'googleusercontent.com',
  'supabase.co',
] as const;

export const SUBMISSION_PLATFORM_DISPLAY_NAMES: Record<Platform, string> = {
  [Platform.TIKTOK]: 'TikTok',
  [Platform.INSTAGRAM]: 'Instagram Reels',
  [Platform.YOUTUBE]: 'YouTube Shorts',
};

export const ALL_STATUS_FILTER = 'ALL' as const;

export const SUBMISSION_SORT = {
  LATEST: 'latest',
  OLDEST: 'oldest',
  VIEWS_DESC: 'views_desc',
  VIEWS_ASC: 'views_asc',
  EARNINGS_DESC: 'earnings_desc',
} as const;

export const SUBMISSION_SORT_OPTIONS = [
  SUBMISSION_SORT.LATEST,
  SUBMISSION_SORT.OLDEST,
  SUBMISSION_SORT.VIEWS_DESC,
  SUBMISSION_SORT.VIEWS_ASC,
  SUBMISSION_SORT.EARNINGS_DESC,
] as const;

export type SubmissionSortOption = (typeof SUBMISSION_SORT_OPTIONS)[number];

export const REVIEWABLE_SUBMISSION_STATUSES = [
  SubmissionStatus.PENDING_REVIEW,
  SubmissionStatus.APPROVED,
  SubmissionStatus.VERIFIED,
  SubmissionStatus.REVISION_REQUESTED,
  SubmissionStatus.REJECTED,
] as const;

export const SUBMISSION_MESSAGES = {
  // Authentication & Role Boundaries
  AUTH_REQUIRED: 'Authentication required.',
  ONLY_CREATORS_CAN_JOIN: 'Only creators can join campaigns.',
  ONLY_CREATORS_CAN_ACCESS_SUBMISSIONS: 'Only creators can access their campaign submissions.',
  ONLY_CREATORS_CAN_DRAFT: 'Only creators can save submission drafts.',
  ONLY_CREATORS_CAN_SUBMIT: 'Only creators can submit videos.',
  ONLY_BRANDS_AND_ADMINS_CAN_REVIEW: 'Only brands and admins can review campaign submissions.',

  // Campaign & Resource Lookups
  CAMPAIGN_NOT_FOUND: 'Campaign not found.',
  CAMPAIGN_NOT_FOUND_OR_INACTIVE: 'Campaign not found or not active.',
  CAMPAIGN_ENDED: 'This campaign has ended and is no longer accepting new submissions.',
  CAMPAIGN_BUDGET_FULL:
    'Anggaran kampanye ini telah habis dialokasikan dan tidak lagi menerima pengajuan baru.',
  BUDGET_BELOW_MINIMUM: 'Campaign budget is below the minimum required payout.',
  CREATOR_NOT_FOUND: 'Creator profile not found.',
  SUBMISSION_NOT_FOUND: 'Campaign submission record not found.',
  NOT_JOINED: 'You have not joined this campaign.',

  // Submission Workflow & Status Guards
  CANNOT_MODIFY_UNDER_REVIEW: 'Your video submission is currently under review and cannot be modified.',
  UNDER_REVIEW_BY_BRAND: 'Your video submission is currently under review by the brand.',
  ALREADY_APPROVED: 'Your video submission has already been approved.',
  ALREADY_REJECTED: 'Your video submission has already been rejected.',
  STATUS_NOT_ALLOW_DRAFT: 'Draft cannot be modified in the current submission status.',
  SUBMISSION_STATUS_NOT_RESUBMITTABLE: 'Submission cannot be submitted in the current status.',
  SUBMISSION_STATUS_NOT_REVIEWABLE: 'Video submission cannot be reviewed in its current status.',
  SUBMISSION_RACE_CONFLICT: 'Status pengajuan video telah berubah secara bersamaan. Harap muat ulang halaman.',
  REJECTED_CANNOT_RESUBMIT: 'This submission has been rejected and cannot be modified or resubmitted.',

  // Social Account & Video Ownership Validation
  SOCIAL_ACCOUNT_INVALID: 'Social account is invalid or does not belong to your profile.',
  SOCIAL_ACCOUNT_NOT_VERIFIED: 'Akun media sosial belum terverifikasi atau sudah tidak aktif.',
  SOCIAL_ACCOUNT_ID_REQUIRED: 'Social account ID is required.',
  SOCIAL_ACCOUNT_ID_INVALID: 'Invalid social account ID.',
  PLATFORM_NOT_ALLOWED: 'Platform ini tidak diizinkan pada kampanye ini.',
  PLATFORM_QUOTA_REACHED: (platformName: string, limit: number) =>
    `Batas maksimal pengajuan untuk ${platformName} (${limit} video) telah tercapai.`,
  PENDING_REVIEW_CAP_REACHED: (limit: number) =>
    `Anda sudah memiliki ${limit} video yang menunggu tinjauan pada kampanye ini. Tunggu hasil tinjauan sebelum mengirim video baru.`,
  VIDEO_URL_PLATFORM_MISMATCH: 'Tautan video tidak sesuai dengan platform akun media sosial yang dipilih.',
  YOUTUBE_SHORTS_ONLY: 'Hanya tautan YouTube Shorts (/shorts/...) yang diperbolehkan.',
  VIDEO_VERIFY_FAILED:
    'Gagal memverifikasi tautan video. Pastikan video bersifat publik dan tautan benar.',
  VIDEO_AUTHOR_MISMATCH: (author: string, verified: string, platformName = 'TikTok') =>
    `Video ini milik @${author}, bukan akun ${platformName} terverifikasi Anda (@${verified}).`,
  VIDEO_ALREADY_SUBMITTED:
    'Video ini sudah pernah diajukan dan tidak dapat digunakan ulang.',
  CAMPAIGN_NOT_ACTIVE_FOR_APPROVAL:
    'Kampanye ini sudah tidak aktif sehingga pengajuan video tidak dapat disetujui.',

  // Zod Validation & Schema Constraints
  VIDEO_URL_REQUIRED: 'Video URL is required.',
  VIDEO_URL_INVALID: 'Video URL must be a valid URL.',
  TIKTOK_URL_REQUIRED: 'Video URL is required.',
  TIKTOK_URL_INVALID: 'Video URL must be a valid URL.',
  TIKTOK_URL_HOST_INVALID:
    'URL video harus berupa tautan TikTok, Instagram Reels, atau YouTube Shorts (/shorts/...) yang valid.',
  THUMBNAIL_URL_INVALID: 'Invalid thumbnail URL.',
  THUMBNAIL_URL_HOST_INVALID: 'URL thumbnail tidak valid atau bukan berasal dari sumber yang diizinkan.',
  CAPTION_MAX_EXCEEDED: 'Caption is too long.',
  REVIEW_NOTE_REQUIRED: 'A review note is required when requesting a revision.',
  REVIEW_NOTE_MAX_EXCEEDED: 'Review note cannot exceed 1000 characters.',
  INVALID_PAYLOAD: 'Invalid request payload.',

  // Pagination & Query Filters
  PAGE_NUMBER_REQUIRED: 'Page must be a valid number.',
  PAGE_INTEGER: 'Page must be an integer.',
  PAGE_POSITIVE: 'Page must be greater than zero.',
  LIMIT_NUMBER_REQUIRED: 'Limit must be a valid number.',
  LIMIT_INTEGER: 'Limit must be an integer.',
  LIMIT_POSITIVE: 'Limit must be greater than zero.',
  LIMIT_MAX_EXCEEDED: 'Limit cannot exceed 100.',
  SEARCH_MAX_EXCEEDED: 'Search query cannot exceed 100 characters.',
  SORT_INVALID: 'Invalid sort option.',
  STATUS_FILTER_INVALID: 'Invalid submission status filter.',

  // Success Responses
  JOIN_SUCCESS: 'Successfully joined the campaign.',
  GET_MY_SUBMISSION_SUCCESS: 'Campaign submission details retrieved successfully.',
  GET_CREATOR_SUBMISSIONS_SUCCESS: 'Creator submissions retrieved successfully.',
  DRAFT_SAVED: 'Submission draft saved successfully.',
  SUBMIT_SUCCESS: 'Video submission sent successfully for brand review.',
  GET_SUBMISSIONS_SUCCESS: 'Campaign submissions retrieved successfully.',
  ACCEPT_SUBMISSION_SUCCESS: 'Video submission approved successfully.',
  REJECT_SUBMISSION_SUCCESS: 'Video submission rejected successfully.',
  REVISE_SUBMISSION_SUCCESS: 'Revision requested successfully.',
} as const;
