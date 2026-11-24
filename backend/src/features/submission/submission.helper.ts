import type { Prisma } from '../../generated/prisma/client.js';
import { Platform, Status, SubmissionStatus } from '../../generated/prisma/enums.js';
import {
  ALL_STATUS_FILTER,
  ALLOWED_INSTAGRAM_VIDEO_HOSTS,
  ALLOWED_THUMBNAIL_HOST_SUFFIXES,
  ALLOWED_TIKTOK_VIDEO_HOSTS,
  ALLOWED_YOUTUBE_VIDEO_HOSTS,
  SUBMISSION_SORT,
} from './submission.constants.js';
import type {
  CampaignSubmissionReviewItemDto,
  RawSubmissionInput,
  SubmissionDetailDto,
  SubmissionQueryInput,
} from './submission.types.js';

/**
 * Maps a Prisma submission row to a clean, strongly-typed SubmissionDetailDto.
 * Ensures Decimal earnings are consistently converted to strings and strips internal database fields.
 *
 * @param submission - Prisma submission row with optional relations.
 * @returns Serialized SubmissionDetailDto.
 */
export function FormatSubmissionResponse(submission: RawSubmissionInput): SubmissionDetailDto {
  const earningsString = submission.earnings.toString();
  const resolvedPlatform = submission.platform ?? submission.socialAccount?.platform ?? Platform.TIKTOK;

  const formatted: SubmissionDetailDto = {
    id: submission.id,
    campaignId: submission.campaignId,
    creatorId: submission.creatorId,
    platform: resolvedPlatform,
    externalVideoId: submission.externalVideoId ?? null,
    draftVideoUrl: submission.draftVideoUrl,
    liveVideoUrl: submission.liveVideoUrl,
    thumbnailUrl: submission.thumbnailUrl,
    videoCaption: submission.videoCaption,
    submissionStatus: submission.submissionStatus,
    reviewNote: submission.reviewNote,
    verifiedViews: submission.verifiedViews,
    earnings: earningsString,
    submittedAt: submission.submittedAt,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
    socialAccount: submission.socialAccount ?? null,
  };
  return formatted;
}

/**
 * Maps a Prisma submission row with creator and social account relations into CampaignSubmissionReviewItemDto.
 *
 * @param row - Prisma submission row including creator and socialAccount.
 * @returns Serialized CampaignSubmissionReviewItemDto.
 */
export function FormatCampaignSubmissionReviewItem(row: {
  id: string;
  campaignId: string;
  creatorId: string;
  platform?: Platform;
  draftVideoUrl: string | null;
  liveVideoUrl: string | null;
  thumbnailUrl: string | null;
  videoCaption: string | null;
  submissionStatus: SubmissionStatus;
  reviewNote: string | null;
  verifiedViews: number;
  earnings: { toString(): string } | number | string;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  creator: { id: string; fullName: string; avatarUrl: string | null };
  socialAccount: {
    id: string;
    platform?: Platform;
    username: string;
    avatarUrl: string | null;
    followersCount: number;
  } | null;
}): CampaignSubmissionReviewItemDto {
  const earningsString = row.earnings.toString();
  const resolvedPlatform = row.platform ?? row.socialAccount?.platform ?? Platform.TIKTOK;

  const item: CampaignSubmissionReviewItemDto = {
    id: row.id,
    campaignId: row.campaignId,
    creatorId: row.creatorId,
    platform: resolvedPlatform,
    draftVideoUrl: row.draftVideoUrl,
    liveVideoUrl: row.liveVideoUrl,
    thumbnailUrl: row.thumbnailUrl,
    videoCaption: row.videoCaption,
    submissionStatus: row.submissionStatus,
    reviewNote: row.reviewNote,
    verifiedViews: row.verifiedViews,
    earnings: earningsString,
    submittedAt: row.submittedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    creator: row.creator,
    socialAccount: row.socialAccount,
  };
  return item;
}

/**
 * Constructs a Prisma where clause for filtering campaign video submissions.
 *
 * @param campaignId - Target campaign UUID.
 * @param query - Validated query parameters.
 * @returns Prisma where object for submission queries.
 */
export function BuildSubmissionsWhereClause(
  campaignId: string,
  query: SubmissionQueryInput,
): Prisma.SubmissionWhereInput {
  const where: Prisma.SubmissionWhereInput = {
    campaignId,
    status: Status.ACTIVE,
  };

  // Status filtering (default excludes JOINED creators without submitted videos)
  if (query.status && query.status !== ALL_STATUS_FILTER) {
    where.submissionStatus = query.status;
  } else {
    where.submissionStatus = { not: SubmissionStatus.JOINED };
  }

  // Case-insensitive search across caption, social account username, and creator full name
  if (query.search && query.search.trim().length > 0) {
    const term = query.search.trim();
    where.OR = [
      { videoCaption: { contains: term, mode: 'insensitive' } },
      { socialAccount: { username: { contains: term, mode: 'insensitive' } } },
      { creator: { fullName: { contains: term, mode: 'insensitive' } } },
    ];
  }

  return where;
}

/**
 * Determines the database sorting order based on the requested sort option.
 *
 * @param sort - Requested sort key ('latest', 'oldest', 'views_desc', 'views_asc').
 * @returns Prisma orderBy object.
 */
export function BuildSubmissionsOrderBy(sort?: string): Prisma.SubmissionOrderByWithRelationInput {
  if (sort === SUBMISSION_SORT.VIEWS_DESC) {
    return { verifiedViews: 'desc' };
  }
  if (sort === SUBMISSION_SORT.VIEWS_ASC) {
    return { verifiedViews: 'asc' };
  }
  if (sort === SUBMISSION_SORT.OLDEST) {
    return { submittedAt: 'asc' };
  }
  return { submittedAt: 'desc' };
}

/**
 * Validates that a URL is an HTTPS link pointing to an official TikTok hostname.
 *
 * @param rawUrl - Candidate video URL string.
 * @returns True if the URL is an allowed HTTPS TikTok video host.
 */
export function IsAllowedTikTokVideoUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    const isAllowed = ALLOWED_TIKTOK_VIDEO_HOSTS.some((host) => hostname === host);
    return isAllowed;
  } catch {
    return false;
  }
}

/**
 * Validates that a URL is an HTTPS link pointing to an Instagram Reel or video post.
 *
 * @param rawUrl - Candidate video URL string.
 * @returns True if the URL is a valid Instagram Reel/post URL.
 */
export function IsAllowedInstagramVideoUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    const isHostAllowed = ALLOWED_INSTAGRAM_VIDEO_HOSTS.some((host) => hostname === host);
    if (!isHostAllowed) {
      return false;
    }
    const isReelOrPostPath = /\/(reel|reels|p)\/[A-Za-z0-9_-]+/i.test(parsed.pathname);
    return isReelOrPostPath;
  } catch {
    return false;
  }
}

/**
 * Validates that a URL is strictly an HTTPS YouTube Shorts link (`/shorts/<id>`).
 *
 * @param rawUrl - Candidate video URL string.
 * @returns True if the URL is a valid YouTube Shorts URL.
 */
export function IsAllowedYouTubeShortsUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    const isHostAllowed = ALLOWED_YOUTUBE_VIDEO_HOSTS.some((host) => hostname === host);
    if (!isHostAllowed) {
      return false;
    }
    const isShortsPath = /^\/shorts\/[A-Za-z0-9_-]{6,}/i.test(parsed.pathname);
    return isShortsPath;
  } catch {
    return false;
  }
}

/**
 * Validates that a URL is an HTTPS link belonging to any supported platform (TikTok, Instagram Reels, or YouTube Shorts).
 *
 * @param rawUrl - Candidate video URL string.
 * @returns True if the URL matches one of the supported social video formats.
 */
export function IsAllowedSocialVideoUrl(rawUrl: string): boolean {
  const isAllowed =
    IsAllowedTikTokVideoUrl(rawUrl) ||
    IsAllowedInstagramVideoUrl(rawUrl) ||
    IsAllowedYouTubeShortsUrl(rawUrl);
  return isAllowed;
}

/**
 * Checks whether a video URL matches the domain and path rules of a specific social platform.
 *
 * @param rawUrl - Candidate video URL string.
 * @param platform - Target social platform enum.
 * @returns True if the URL matches the given platform.
 */
export function DoesVideoUrlMatchPlatform(rawUrl: string, platform: Platform): boolean {
  if (platform === Platform.INSTAGRAM) {
    return IsAllowedInstagramVideoUrl(rawUrl);
  }
  if (platform === Platform.YOUTUBE) {
    return IsAllowedYouTubeShortsUrl(rawUrl);
  }
  return IsAllowedTikTokVideoUrl(rawUrl);
}

/**
 * Validates that a thumbnail URL is an HTTPS link from an allowlisted social CDN
 * or the configured Supabase Storage host to prevent SSRF via server-side fetch.
 *
 * @param rawUrl - Candidate thumbnail URL string.
 * @returns True if the thumbnail URL is safe to fetch server-side.
 */
export function IsAllowedThumbnailUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();

    const configuredSupabaseUrl = process.env.SUPABASE_URL;
    if (configuredSupabaseUrl) {
      try {
        const supabaseHost = new URL(configuredSupabaseUrl).hostname.toLowerCase();
        if (hostname === supabaseHost) {
          return true;
        }
      } catch {
        // Ignore malformed env var and fall through to static allowlist
      }
    }

    const isAllowed = ALLOWED_THUMBNAIL_HOST_SUFFIXES.some(
      (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`),
    );
    return isAllowed;
  } catch {
    return false;
  }
}

/**
 * Extracts the numeric TikTok video ID from a canonical or standard TikTok video URL.
 *
 * @param rawUrl - TikTok video URL (e.g. "https://www.tiktok.com/@user/video/7412345678901234567").
 * @returns Extracted numeric video ID string, or null if not found.
 */
export function ExtractTikTokVideoId(rawUrl: string): string | null {
  const match = /\/(?:video|photo)\/(\d+)/i.exec(rawUrl);
  const videoId = match?.[1] ?? null;
  return videoId;
}

/**
 * Extracts the normalized platform-specific video identifier from a video URL.
 *
 * @param platform - Target social platform enum.
 * @param rawUrl - Canonical or raw video URL.
 * @returns Extracted platform video ID or shortcode, or null if not found.
 */
export function ExtractPlatformVideoId(platform: Platform, rawUrl: string): string | null {
  if (platform === Platform.INSTAGRAM) {
    const match = /\/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/i.exec(rawUrl);
    return match?.[1] ?? null;
  }

  if (platform === Platform.YOUTUBE) {
    const match = /\/shorts\/([A-Za-z0-9_-]{6,})/i.exec(rawUrl);
    return match?.[1] ?? null;
  }

  const tiktokId = ExtractTikTokVideoId(rawUrl);
  return tiktokId;
}
