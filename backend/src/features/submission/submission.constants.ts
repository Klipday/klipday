import { SubmissionStatus } from '../../generated/prisma/enums.js';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;
export const MAX_CAPTION_LENGTH = 2000;
export const MAX_SEARCH_LENGTH = 100;
export const MAX_REVIEW_NOTE_LENGTH = 1000;
export const CPM_VIEW_DIVISOR = 1000;
export const BUDGET_DECIMAL_PLACES = 2;

export const ALL_STATUS_FILTER = 'ALL' as const;

export const SUBMISSION_SORT = {
  LATEST: 'latest',
  OLDEST: 'oldest',
  VIEWS_DESC: 'views_desc',
  VIEWS_ASC: 'views_asc',
} as const;

export const SUBMISSION_SORT_OPTIONS = [
  SUBMISSION_SORT.LATEST,
  SUBMISSION_SORT.OLDEST,
  SUBMISSION_SORT.VIEWS_DESC,
  SUBMISSION_SORT.VIEWS_ASC,
] as const;

export type SubmissionSortOption = (typeof SUBMISSION_SORT_OPTIONS)[number];

export const REVIEWABLE_SUBMISSION_STATUSES = [
  SubmissionStatus.PENDING_REVIEW,
  SubmissionStatus.APPROVED,
  SubmissionStatus.REVISION_REQUESTED,
  SubmissionStatus.REJECTED,
] as const;

export const SUBMISSION_FILTER_STATUS_OPTIONS = [
  ...REVIEWABLE_SUBMISSION_STATUSES,
  ALL_STATUS_FILTER,
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
  REJECTED_CANNOT_RESUBMIT: 'This submission has been rejected and cannot be modified or resubmitted.',

  // Social Account Validation
  SOCIAL_ACCOUNT_INVALID: 'Social account is invalid or does not belong to your profile.',
  SOCIAL_ACCOUNT_ID_REQUIRED: 'Social account ID is required.',
  SOCIAL_ACCOUNT_ID_INVALID: 'Invalid social account ID.',

  // Zod Validation & Schema Constraints
  VIDEO_URL_REQUIRED: 'Video URL is required.',
  VIDEO_URL_INVALID: 'Video URL must be a valid URL.',
  TIKTOK_URL_REQUIRED: 'TikTok video URL is required.',
  TIKTOK_URL_INVALID: 'TikTok video URL must be a valid URL.',
  THUMBNAIL_URL_INVALID: 'Invalid thumbnail URL.',
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
  DRAFT_SAVED: 'Submission draft saved successfully.',
  SUBMIT_SUCCESS: 'Video submission sent successfully for brand review.',
  GET_SUBMISSIONS_SUCCESS: 'Campaign submissions retrieved successfully.',
  ACCEPT_SUBMISSION_SUCCESS: 'Video submission approved successfully.',
  REJECT_SUBMISSION_SUCCESS: 'Video submission rejected successfully.',
  REVISE_SUBMISSION_SUCCESS: 'Revision requested successfully.',
} as const;
