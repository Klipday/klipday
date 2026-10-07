import type { Prisma } from '../../generated/prisma/client.js';
import { CampaignStatus, Status } from '../../generated/prisma/enums.js';

/**
 * Whitelist of scalar fields copied 1:1 from the campaign edit payload into Prisma update queries.
 */
export const SCALAR_FIELDS = [
  'title',
  'description',
  'campaignType',
  'campaignCategory',
  'thumbnailUrl',
  'platform',
  'mainMediaUrl',
  'cpm',
  'minViews',
  'maxViews',
  'budget',
  'startDate',
  'endDate',
] as const;

export const MAX_THUMBNAIL_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_THUMBNAIL_MIME_TYPES = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

export const SUBMITTABLE_CAMPAIGN_STATUSES = [CampaignStatus.DRAFT, CampaignStatus.REVISION, CampaignStatus.AWAITING_PAYMENT] as const;

export const FEATURED_CAMPAIGNS_LIMIT = 5;
export const FEATURED_CAMPAIGNS_MIN_COUNT = 3;

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

export const CAMPAIGN_SORT_OPTIONS = ['latest', 'highest_cpm', 'lowest_cpm', 'highest_total_budget', 'highest_maximum_views'] as const;

/**
 * Truly lean select projection for campaign card feeds (GET /campaigns, GET /campaigns/featured).
 * Fetches only basic campaign info, brand summary, and submissions count without pulling heavy brief or materials relations.
 */
export const CAMPAIGN_CARD_SELECT = {
  id: true,
  title: true,
  description: true,
  campaignType: true,
  campaignCategory: true,
  thumbnailUrl: true,
  platform: true,
  mainMediaUrl: true,
  cpm: true,
  minViews: true,
  maxViews: true,
  budget: true,
  startDate: true,
  endDate: true,
  status: true,
  campaignStatus: true,
  isFeatured: true,
  featuredBannerUrl: true,
  featuredOrder: true,
  featuredUntil: true,
  createdAt: true,
  updatedAt: true,
  brandId: true,
  brand: {
    select: {
      id: true,
      companyName: true,
      industry: true,
    },
  },
  _count: {
    select: {
      submissions: {
        where: { status: Status.ACTIVE },
      },
    },
  },
} as const satisfies Prisma.CampaignSelect;

/**
 * Full select projection for single campaign detail view (GET /campaigns/:id).
 * Includes active materials, brief guidelines, brand details, and submissions count.
 */
export const CAMPAIGN_DETAIL_SELECT = {
  ...CAMPAIGN_CARD_SELECT,
  materials: {
    where: { status: Status.ACTIVE },
    select: {
      id: true,
      name: true,
      type: true,
      url: true,
      status: true,
    },
  },
  brief: {
    where: { status: Status.ACTIVE },
    select: {
      id: true,
      purpose: true,
      keyMessage: true,
      narration: true,
      impression: true,
      callToAction: true,
      requiredCaption: true,
      hashtags: true,
      mentionTags: true,
      dos: true,
      donts: true,
      guidelines: true,
      status: true,
    },
  },
  payments: {
    where: { status: Status.ACTIVE },
    orderBy: { createdAt: 'desc' },
    take: 1,
    select: {
      id: true,
      campaignId: true,
      amount: true,
      uniqueCode: true,
      totalPayable: true,
      destinationBank: true,
      destinationAccount: true,
      senderProviderName: true,
      senderAccountName: true,
      transferProofUrl: true,
      paymentStatus: true,
      rejectionReason: true,
      verifiedByAdminId: true,
      verifiedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} as const satisfies Prisma.CampaignSelect;

export const DEFAULT_KLIPDAY_BANK_NAME = 'BCA';
export const DEFAULT_KLIPDAY_BANK_ACCOUNT_NO = '1234567890';
export const DEFAULT_KLIPDAY_BANK_ACCOUNT_NAME = 'PT Klipday Media Indonesia';

export const WALLET_PAYMENT_DESTINATION_BANK = 'SALDO_KLIPDAY';
export const WALLET_PAYMENT_DESTINATION_ACCOUNT = 'WALLET';

export const ADMIN_PAYMENT_VERIFY_ACTIONS = ['APPROVE', 'REJECT'] as const;

export const MAX_PAYMENT_PROOF_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_PAYMENT_PROOF_MIME_TYPES = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

export const CAMPAIGN_MESSAGES = {
  // Success messages
  INITIALIZE_SUCCESS: 'Campaign initialized successfully.',
  UPDATE_SUCCESS: 'Campaign updated successfully.',
  RETRIEVED_SUCCESS: 'Campaigns retrieved successfully.',
  DETAIL_RETRIEVED_SUCCESS: 'Campaign retrieved successfully.',
  FEATURED_RETRIEVED_SUCCESS: 'Featured campaigns retrieved successfully.',
  STATUS_COUNTS_RETRIEVED_SUCCESS: 'Campaign status counts retrieved successfully.',
  SUBMIT_SUCCESS: 'Campaign submitted for review successfully.',
  THUMBNAIL_UPLOAD_SUCCESS: 'Thumbnail uploaded successfully.',
  DELETE_SUCCESS: 'Campaign successfully deleted.',

  // Guard & error messages
  AUTH_REQUIRED: 'Authentication required.',
  UNAUTHORIZED_ROLE: 'Unauthorized role.',
  ONLY_BRANDS_CAN_CREATE: 'Only brands can create campaigns.',
  ONLY_BRANDS_CAN_EDIT: 'Only brands can edit campaigns.',
  ONLY_BRANDS_CAN_SUBMIT: 'Only brands can submit campaigns.',
  ONLY_BRANDS_CAN_UPLOAD_THUMBNAIL: 'Only brands can upload campaign thumbnails.',
  CAMPAIGN_NOT_FOUND: 'Campaign not found.',
  CANNOT_SUBMIT_CURRENT_STATUS: 'Campaign cannot be submitted in its current status.',
  INVALID_REQUEST_BODY: 'Invalid request body.',
  INVALID_QUERY_PARAMS: 'Invalid query parameters.',

  // Wizard completeness validations
  STEP_1_INCOMPLETE: 'Step 1 incomplete: Title, description, category, platform, main media URL, and thumbnail URL are required.',
  STEP_2_NO_MATERIALS: 'Step 2 incomplete: At least one active campaign material is required.',
  STEP_2_INVALID_MATERIALS: 'Step 2 incomplete: All campaign materials must have a valid name, type, and URL.',
  STEP_3_NO_BRIEF: 'Step 3 incomplete: Campaign brief and guidelines are required.',
  STEP_3_INCOMPLETE_BRIEF: 'Step 3 incomplete: Purpose, key message, and call-to-action are required.',
  STEP_4_INVALID_CPM: 'Step 4 incomplete: CPM rate must be greater than 0.',
  STEP_4_INVALID_BUDGET: 'Step 4 incomplete: Total budget must be greater than or equal to CPM rate.',
  STEP_4_INVALID_VIEWS: 'Step 4 incomplete: Minimum and maximum view limits are invalid.',
  STEP_4_NO_DATES: 'Step 4 incomplete: Start date and end date are required.',
  STEP_4_INVALID_DATES: 'Step 4 incomplete: End date must be strictly after start date.',

  // Reward & date logic
  REWARD_MAX_LESS_THAN_MIN: 'Max views cannot be less than min views.',
  REWARD_BUDGET_LESS_THAN_CPM: 'Budget cannot be less than CPM.',
  DATE_START_PAST: 'Start date cannot be less than today.',
  DATE_END_BEFORE_START: 'End date must be greater than start date.',

  // Thumbnail upload & storage
  CONTENT_LENGTH_REQUIRED: 'Content-Length header is required.',
  FILE_SIZE_EXCEEDED: 'File size must not exceed 5MB.',
  UNSUPPORTED_FILE_TYPE: 'Unsupported file format. Please upload JPG, PNG, or WEBP images.',
  STORAGE_CONFIG_MISSING: 'Supabase storage service is not configured on the server.',
  STORAGE_UPLOAD_FAILED: 'Failed to upload thumbnail to cloud storage.',

  // Zod schema field validation messages
  TITLE_REQUIRED: 'Title is required.',
  DESCRIPTION_REQUIRED: 'Description is required.',
  THUMBNAIL_URL_INVALID: 'A valid thumbnail URL is required.',
  MAIN_MEDIA_URL_INVALID: 'A valid main media URL is required.',
  CPM_NUMBER_REQUIRED: 'CPM must be a number.',
  CPM_POSITIVE: 'CPM must be greater than 0.',
  MIN_VIEWS_NUMBER_REQUIRED: 'Min views must be a number.',
  MIN_VIEWS_INTEGER: 'Min views must be an integer.',
  MIN_VIEWS_POSITIVE: 'Min views must be greater than 0.',
  MAX_VIEWS_NUMBER_REQUIRED: 'Max views must be a number.',
  MAX_VIEWS_INTEGER: 'Max views must be an integer.',
  MAX_VIEWS_POSITIVE: 'Max views must be greater than 0.',
  BUDGET_NUMBER_REQUIRED: 'Budget must be a number.',
  BUDGET_POSITIVE: 'Budget must be greater than 0.',
  START_DATE_REQUIRED: 'A valid start date is required.',
  START_DATE_EMPTY: 'Start date cannot be empty.',
  END_DATE_REQUIRED: 'A valid end date is required.',
  END_DATE_EMPTY: 'End date cannot be empty.',
  MATERIAL_TYPE_INVALID: 'Invalid material type selected.',
  MATERIAL_NAME_REQUIRED: 'Material name is required.',
  MATERIAL_URL_INVALID: 'A valid material URL is required.',
  MATERIALS_REQUIRED: 'At least one material is required.',
  BRIEF_PURPOSE_EMPTY: 'Purpose cannot be empty.',
  BRIEF_KEY_MESSAGE_EMPTY: 'Key message cannot be empty.',
  BRIEF_NARRATION_EMPTY: 'Narration cannot be empty.',
  BRIEF_IMPRESSION_EMPTY: 'Impression cannot be empty.',
  BRIEF_CALL_TO_ACTION_EMPTY: 'Call to action cannot be empty.',
  BRIEF_REQUIRED_CAPTION_EMPTY: 'Required caption cannot be empty.',
  BRIEF_HASHTAG_EMPTY: 'Hashtag item cannot be empty.',
  BRIEF_MENTION_TAG_EMPTY: 'Mention tag cannot be empty.',
  BRIEF_DO_GUIDELINE_EMPTY: 'Do guideline cannot be empty.',
  BRIEF_DONT_GUIDELINE_EMPTY: "Don't guideline cannot be empty.",
  BRIEF_GUIDELINES_EMPTY: 'Guidelines cannot be empty.',
  CAMPAIGN_TYPE_INVALID: 'Invalid campaign type selected.',
  CAMPAIGN_CATEGORY_INVALID: 'Invalid campaign category selected.',
  PLATFORM_INVALID: 'Invalid platform selected.',
  PAGE_NUMBER_REQUIRED: 'Page must be a number.',
  PAGE_INTEGER: 'Page must be an integer.',
  PAGE_POSITIVE: 'Page must be greater than 0.',
  LIMIT_NUMBER_REQUIRED: 'Limit must be a number.',
  LIMIT_INTEGER: 'Limit must be an integer.',
  LIMIT_POSITIVE: 'Limit must be greater than 0.',
  LIMIT_MAX_EXCEEDED: 'Limit cannot exceed 100.',
  SEARCH_MAX_EXCEEDED: 'Search query cannot exceed 100 characters.',
  SORT_INVALID: 'Invalid sort parameter. Allowed values: latest, highest_cpm, lowest_cpm, highest_total_budget, highest_maximum_views.',
  CATEGORY_FILTER_INVALID: 'Invalid category filter selected.',
  CAMPAIGN_TYPE_FILTER_INVALID: 'Invalid campaign type filter selected.',
  PLATFORM_FILTER_INVALID: 'Invalid platform filter selected.',
  CAMPAIGN_STATUS_FILTER_INVALID: 'Invalid campaign status filter selected.',

  // Payment workflow messages
  PAYMENT_INITIALIZED_SUCCESS: 'Campaign payment initialized successfully.',
  PAYMENT_RETRIEVED_SUCCESS: 'Campaign payment details retrieved successfully.',
  WALLET_PAYMENT_SUCCESS: 'Payment completed successfully using wallet balance.',
  TRANSFER_PAYMENT_SUBMITTED_SUCCESS: 'Bank transfer payment submitted successfully.',
  PAYMENT_PROOF_UPLOAD_SUCCESS: 'Payment receipt uploaded successfully.',
  PAYMENT_VERIFIED_SUCCESS: 'Campaign payment verified successfully.',
  ONLY_DRAFT_CAN_BE_DELETED: 'Only draft campaigns can be deleted.',
  CAMPAIGN_NOT_AWAITING_PAYMENT: 'Campaign is not awaiting payment.',
  INSUFFICIENT_WALLET_BALANCE: 'Insufficient wallet balance to pay for this campaign.',
  WALLET_NOT_FOUND: 'Wallet not found for this account.',
  PAYMENT_PROOF_REQUIRED: 'Payment receipt image is required.',
  SENDER_PROVIDER_REQUIRED: 'Sender bank or e-wallet provider is required.',
  SENDER_ACCOUNT_NAME_REQUIRED: 'Sender account holder name is required.',
  PAYMENT_NOT_FOUND: 'Campaign payment record not found.',
  PAYMENT_NOT_SUBMITTED: 'Campaign payment is not in submitted status.',
  REJECTION_REASON_REQUIRED: 'Rejection reason is required when rejecting payment.',
  ADMIN_ACTION_INVALID: 'Invalid admin verification action. Allowed values: APPROVE, REJECT.',
  ADMIN_NOT_FOUND: 'Admin profile not found.',
} as const;
