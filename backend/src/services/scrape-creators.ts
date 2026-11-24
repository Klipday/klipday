import { Platform } from '../generated/prisma/enums.js';

const SCRAPECREATORS_BASE_URL = 'https://api.scrapecreators.com';
const DEFAULT_SCRAPE_TIMEOUT_MS = 15_000;
const MAX_YOUTUBE_SHORT_DURATION_SECONDS = 185;

export interface ScrapeCreatorsRequestOptions extends RequestInit {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export interface ScrapeCreatorsErrorParams {
  message: string;
  statusCode?: number | undefined;
  isRetryable?: boolean | undefined;
  isVideoUnavailable?: boolean | undefined;
}

/**
 * Structured error class for ScrapeCreators HTTP and payload resolution failures.
 * Classifies transient rate-limit/upstream errors (`isRetryable`) separately from
 * deleted, private, or missing social videos (`isVideoUnavailable`).
 */
export class ScrapeCreatorsApiError extends Error {
  public readonly statusCode: number | undefined;
  public readonly isRetryable: boolean;
  public readonly isVideoUnavailable: boolean;

  constructor(params: ScrapeCreatorsErrorParams) {
    super(params.message);
    this.name = 'ScrapeCreatorsApiError';
    this.statusCode = params.statusCode;
    this.isRetryable = Boolean(params.isRetryable);
    this.isVideoUnavailable = Boolean(params.isVideoUnavailable);
  }
}

export interface SocialUserProfile {
  username: string;
  platformUserId?: string;
  displayName?: string;
  avatarUrl?: string;
  followersCount: number;
  bioDescription?: string;
  isPrivate?: boolean;
}

export interface SocialVideoItem {
  id: string;
  url: string;
  authorUsername: string;
  authorPlatformUserId?: string;
  title?: string;
  caption?: string;
  thumbnailUrl?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  publishedAt?: Date;
}

export type TikTokUserProfile = SocialUserProfile;
export type TikTokVideoItem = SocialVideoItem;

interface ScrapeCreatorsTikTokProfileResponse {
  user?: {
    uniqueId?: string;
    id?: string;
    nickname?: string;
    avatarLarger?: string;
    avatarThumb?: string;
    signature?: string;
  };
  stats?: {
    followerCount?: number;
    followingCount?: number;
    heartCount?: number;
    videoCount?: number;
  };
}

interface ScrapeCreatorsAwemeItem {
  aweme_id?: string;
  desc?: string;
  create_time?: number;
  status?: {
    is_delete?: boolean;
    is_private?: boolean;
    private_status?: number;
  };
  author?: {
    unique_id?: string;
    nickname?: string;
    uid?: string;
  };
  video?: {
    cover?: {
      url_list?: string[];
    };
    origin_cover?: {
      url_list?: string[];
    };
    dynamic_cover?: {
      url_list?: string[];
    };
  };
  statistics?: {
    play_count?: number;
    digg_count?: number;
    comment_count?: number;
    share_count?: number;
  };
}

interface ScrapeCreatorsV3VideosResponse {
  success?: boolean;
  aweme_list?: ScrapeCreatorsAwemeItem[];
}

interface ScrapeCreatorsV2VideoDetailsResponse {
  success?: boolean;
  aweme_detail?: ScrapeCreatorsAwemeItem;
}

interface ScrapeCreatorsInstagramUserNode {
  id?: string;
  pk?: string;
  username?: string;
  full_name?: string;
  biography?: string;
  profile_pic_url_hd?: string;
  profile_pic_url?: string;
  is_private?: boolean;
  follower_count?: number;
  edge_followed_by?: {
    count?: number;
  };
}

interface ScrapeCreatorsInstagramProfileResponse {
  success?: boolean;
  data?: ScrapeCreatorsInstagramUserNode & {
    user?: ScrapeCreatorsInstagramUserNode;
  };
  user?: ScrapeCreatorsInstagramUserNode;
}

interface ScrapeCreatorsInstagramReelMedia {
  pk?: string;
  id?: string;
  code?: string;
  shortcode?: string;
  media_type?: number;
  is_video?: boolean;
  play_count?: number;
  ig_play_count?: number;
  video_play_count?: number;
  video_view_count?: number;
  like_count?: number;
  comment_count?: number;
  taken_at?: number;
  taken_at_timestamp?: number;
  created_at?: string;
  display_uri?: string;
  display_url?: string;
  thumbnail_src?: string;
  video_url?: string;
  image_versions2?: {
    candidates?: Array<{ url?: string }>;
    additional_candidates?: {
      first_frame?: { url?: string };
      igtv_first_frame?: { url?: string };
    };
  };
  caption?: {
    text?: string;
  } | null;
  edge_media_to_caption?: {
    edges?: Array<{ node?: { text?: string } }>;
  };
  edge_media_preview_like?: {
    count?: number;
  };
  edge_media_to_parent_comment?: {
    count?: number;
  };
  edge_media_to_comment?: {
    count?: number;
  };
  user?: {
    pk?: string;
    id?: string;
    username?: string;
  };
  owner?: {
    id?: string;
    pk?: string;
    username?: string;
    is_private?: boolean;
  };
}

interface ScrapeCreatorsInstagramReelsResponse {
  success?: boolean;
  items?: Array<{
    media?: ScrapeCreatorsInstagramReelMedia;
  } & ScrapeCreatorsInstagramReelMedia>;
}

interface ScrapeCreatorsInstagramPostResponse {
  success?: boolean;
  data?: {
    xdt_shortcode_media?: ScrapeCreatorsInstagramReelMedia;
  } & ScrapeCreatorsInstagramReelMedia;
  item?: ScrapeCreatorsInstagramReelMedia;
  media?: ScrapeCreatorsInstagramReelMedia;
}

interface ScrapeCreatorsYouTubeImageSource {
  url?: string;
}

interface ScrapeCreatorsYouTubeChannelResponse {
  success?: boolean;
  channelId?: string;
  id?: string;
  handle?: string;
  name?: string;
  title?: string;
  description?: string;
  about?: string;
  subscriberCount?: number;
  subscriberCountInt?: number;
  avatar?:
    | string
    | {
        image?: {
          sources?: ScrapeCreatorsYouTubeImageSource[];
        };
      };
  thumbnails?: ScrapeCreatorsYouTubeImageSource[];
}

interface ScrapeCreatorsYouTubeShortItem {
  id?: string;
  videoId?: string;
  url?: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  thumbnails?: ScrapeCreatorsYouTubeImageSource[];
  views?: number | string | null;
  viewCount?: number | string | null;
  viewCountInt?: number | null;
  likeCountInt?: number | null;
  commentCountInt?: number | null;
  publishDate?: string | null;
  publishedTime?: string | null;
  type?: string;
  durationMs?: number | null;
  approxDurationMs?: number | string | null;
  lengthSeconds?: number | string | null;
  channel?: {
    id?: string;
    handle?: string;
    url?: string;
    title?: string;
  };
}

interface ScrapeCreatorsYouTubeShortsListResponse {
  success?: boolean;
  shorts?: ScrapeCreatorsYouTubeShortItem[];
  videos?: ScrapeCreatorsYouTubeShortItem[];
  items?: ScrapeCreatorsYouTubeShortItem[];
}

const RETRYABLE_HTTP_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const UNAVAILABLE_HTTP_STATUS_CODES = new Set([404, 410]);

/**
 * Safely parses a raw numeric or string count into a non-negative integer.
 *
 * @param value - Raw count from a social API response.
 * @returns Non-negative integer count, defaulting to 0 when nullish or invalid.
 */
function ParseSafeCount(value: number | string | null | undefined): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (!cleaned) return 0;
    const parsed = Number.parseInt(cleaned, 10);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }

  return 0;
}

/**
 * Normalizes a social media handle by stripping leading `@`, trimming whitespace, and lowercasing.
 *
 * @param handle - Raw social username or handle.
 * @returns Normalized lowercase handle.
 */
function NormalizeHandle(handle: string): string {
  const normalized = handle.trim().replace(/^@+/, '').toLowerCase();
  return normalized;
}

/**
 * Validates that a video URL string is well-formed, uses HTTP/HTTPS, and belongs to a TikTok domain.
 *
 * @param url - Video URL string to validate.
 * @returns Clean, trimmed URL string.
 * @throws Error if the URL is empty, malformed, or not a TikTok URL.
 */
export function ValidateTikTokVideoUrl(url: string): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    throw new Error('Video URL must be a non-empty string.');
  }

  const cleanUrl = url.trim();

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(cleanUrl);
  } catch {
    throw new Error('Invalid video URL format. Must be a valid URL.');
  }

  const isHttpProtocol = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  if (!isHttpProtocol) {
    throw new Error('Video URL must use HTTP or HTTPS protocol.');
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const isTikTokDomain = hostname === 'tiktok.com' || hostname.endsWith('.tiktok.com');
  if (!isTikTokDomain) {
    throw new Error('Invalid video URL. Must be a valid TikTok link.');
  }

  return cleanUrl;
}

/**
 * Validates that a video URL string is a valid Instagram Reel or video post link.
 *
 * @param url - Video URL string to validate.
 * @returns Clean, trimmed URL string.
 * @throws Error if the URL is not a valid Instagram reel/post URL.
 */
export function ValidateInstagramVideoUrl(url: string): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    throw new Error('Tautan video Instagram tidak boleh kosong.');
  }

  const cleanUrl = url.trim();

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(cleanUrl);
  } catch {
    throw new Error('Format tautan Instagram tidak valid.');
  }

  const isHttpProtocol = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  if (!isHttpProtocol) {
    throw new Error('Tautan video harus menggunakan protokol HTTP atau HTTPS.');
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const isInstagramDomain = hostname === 'instagram.com' || hostname.endsWith('.instagram.com');
  if (!isInstagramDomain) {
    throw new Error('Tautan tidak valid. Harap masukkan tautan Instagram Reels yang valid.');
  }

  const isReelOrPostPath = /\/(reel|reels|p)\/[A-Za-z0-9_-]+/i.test(parsedUrl.pathname);
  if (!isReelOrPostPath) {
    throw new Error('Tautan Instagram harus mengarah ke Reel atau postingan video (/reel/...).');
  }

  return cleanUrl;
}

/**
 * Validates that a video URL string is strictly a YouTube Shorts link (`/shorts/<id>`).
 * Rejects standard long-form `/watch?v=...` and shortened `youtu.be/...` links.
 *
 * @param url - Video URL string to validate.
 * @returns Clean, trimmed URL string.
 * @throws Error if the URL is not a valid YouTube Shorts URL.
 */
export function ValidateYouTubeShortsUrl(url: string): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    throw new Error('Tautan YouTube Shorts tidak boleh kosong.');
  }

  const cleanUrl = url.trim();

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(cleanUrl);
  } catch {
    throw new Error('Format tautan YouTube Shorts tidak valid.');
  }

  const isHttpProtocol = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  if (!isHttpProtocol) {
    throw new Error('Tautan video harus menggunakan protokol HTTP atau HTTPS.');
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const isYouTubeDomain = hostname === 'youtube.com' || hostname.endsWith('.youtube.com');
  if (!isYouTubeDomain) {
    throw new Error('Tautan tidak valid. Harap masukkan tautan YouTube Shorts (/shorts/...).');
  }

  const shortsMatch = /^\/shorts\/([A-Za-z0-9_-]{6,})/i.exec(parsedUrl.pathname);
  if (!shortsMatch) {
    throw new Error('Hanya tautan YouTube Shorts (/shorts/...) yang diperbolehkan.');
  }

  return cleanUrl;
}

/**
 * Validates a video URL against the domain and path rules of the specified social platform.
 *
 * @param platform - Target social platform enum.
 * @param url - Raw video URL string.
 * @returns Clean, trimmed URL string.
 */
export function ValidateSocialVideoUrl(platform: Platform, url: string): string {
  switch (platform) {
    case Platform.TIKTOK: {
      const validated = ValidateTikTokVideoUrl(url);
      return validated;
    }
    case Platform.INSTAGRAM: {
      const validated = ValidateInstagramVideoUrl(url);
      return validated;
    }
    case Platform.YOUTUBE: {
      const validated = ValidateYouTubeShortsUrl(url);
      return validated;
    }
    default: {
      const validated = ValidateTikTokVideoUrl(url);
      return validated;
    }
  }
}

/**
 * Retrieves and validates the ScrapeCreators API key from options or environment.
 *
 * @param customKey - Optional API key override.
 * @throws Error if no API key is found.
 * @returns Clean API key string.
 */
function GetScrapeCreatorsApiKey(customKey?: string): string {
  const apiKey = customKey ?? process.env.SCRAPECREATORS_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('SCRAPECREATORS_API_KEY is not configured in the environment.');
  }

  return apiKey.trim();
}

/**
 * Core functional HTTP client for making authenticated requests to ScrapeCreators.
 * Enforces bounded socket timeouts via AbortSignal and classifies upstream errors.
 *
 * @param endpoint - API path with query parameters (e.g. '/v1/tiktok/profile?handle=john').
 * @param options - Optional fetch configuration, timeout, and credentials.
 * @returns Parsed JSON response payload.
 */
async function ScrapeCreatorsRequest<T>(endpoint: string, options?: ScrapeCreatorsRequestOptions): Promise<T> {
  const apiKey = GetScrapeCreatorsApiKey(options?.apiKey);
  const baseUrl = options?.baseUrl ?? SCRAPECREATORS_BASE_URL;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_SCRAPE_TIMEOUT_MS;
  const targetUrl = `${baseUrl}${endpoint}`;

  const {
    apiKey: _apiKey,
    baseUrl: _baseUrl,
    timeoutMs: _timeoutMs,
    headers: customHeaders,
    signal: customSignal,
    ...fetchInit
  } = options ?? {};

  const requestSignal = customSignal ?? AbortSignal.timeout(timeoutMs);

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      ...fetchInit,
      method: fetchInit.method ?? 'GET',
      signal: requestSignal,
      headers: {
        'x-api-key': apiKey,
        Accept: 'application/json',
        ...customHeaders,
      },
    });
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : 'Network request failed';
    throw new ScrapeCreatorsApiError({
      message: `ScrapeCreators network error: ${rawMessage}`,
      isRetryable: true,
      isVideoUnavailable: false,
    });
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    const isRetryable = RETRYABLE_HTTP_STATUS_CODES.has(response.status);
    const isVideoUnavailable = UNAVAILABLE_HTTP_STATUS_CODES.has(response.status);
    throw new ScrapeCreatorsApiError({
      message: `ScrapeCreators API error (${response.status} ${response.statusText}): ${errorText || 'Unknown error'}`,
      statusCode: response.status,
      isRetryable,
      isVideoUnavailable,
    });
  }

  const payload = (await response.json()) as T;
  return payload;
}

/**
 * Selects the best image URL from a CDN candidate list, prioritizing standard web formats over `.heic`.
 *
 * @param urlList - Array of candidate image URLs.
 * @returns Best candidate URL, or undefined.
 */
function ExtractBestCoverUrl(urlList?: string[]): string | undefined {
  if (!urlList || urlList.length === 0) return undefined;
  const webImage = urlList.find((url) => /\.(jpeg|jpg|webp|png)(\?|$)/i.test(url));
  return webImage || urlList[0];
}

/**
 * Expands shortened TikTok links (`vt.tiktok.com` / `vm.tiktok.com`) to their full canonical web URL.
 *
 * @param url - Raw video URL entered by the user.
 * @param timeoutMs - Maximum timeout in milliseconds for redirect expansion.
 * @returns Resolved full URL or original URL.
 */
async function ResolveTikTokUrl(url: string, timeoutMs = DEFAULT_SCRAPE_TIMEOUT_MS): Promise<string> {
  const trimmedUrl = url.trim();

  if (trimmedUrl.includes('vt.tiktok.com') || trimmedUrl.includes('vm.tiktok.com')) {
    try {
      const response = await fetch(trimmedUrl, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(timeoutMs),
      });
      return response.url || trimmedUrl;
    } catch {
      return trimmedUrl;
    }
  }

  return trimmedUrl;
}

/**
 * Extracts the best avatar URL from a ScrapeCreators YouTube channel payload.
 *
 * @param payload - Raw YouTube channel response payload.
 * @returns Best available avatar URL, or undefined.
 */
function ExtractYouTubeAvatarUrl(payload: ScrapeCreatorsYouTubeChannelResponse): string | undefined {
  if (typeof payload.avatar === 'string' && payload.avatar.trim() !== '') {
    return payload.avatar.trim();
  }

  if (payload.avatar && typeof payload.avatar === 'object') {
    const sources = payload.avatar.image?.sources ?? [];
    const lastSource = sources[sources.length - 1]?.url;
    if (lastSource) return lastSource;
  }

  const thumbnails = payload.thumbnails ?? [];
  const lastThumb = thumbnails[thumbnails.length - 1]?.url;
  return lastThumb;
}

/**
 * Extracts duration in seconds from a ScrapeCreators YouTube video item when present.
 *
 * @param item - Raw YouTube video payload.
 * @returns Duration in seconds, or null if unavailable.
 */
function ExtractYouTubeDurationSeconds(item: ScrapeCreatorsYouTubeShortItem): number | null {
  if (typeof item.durationMs === 'number' && Number.isFinite(item.durationMs)) {
    return Math.ceil(item.durationMs / 1000);
  }

  if (item.approxDurationMs !== undefined && item.approxDurationMs !== null) {
    const ms = Number(item.approxDurationMs);
    if (Number.isFinite(ms) && ms > 0) {
      return Math.ceil(ms / 1000);
    }
  }

  if (item.lengthSeconds !== undefined && item.lengthSeconds !== null) {
    const seconds = Number(item.lengthSeconds);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.ceil(seconds);
    }
  }

  return null;
}

// ============================================================================
// TIKTOK ADAPTERS
// ============================================================================

/**
 * Retrieves public profile metadata and bio for a TikTok username using ScrapeCreators API.
 *
 * @param username - Social media handle with or without leading '@'.
 * @param options - Optional fetch configuration and credentials override.
 * @returns User profile details including bio and follower count.
 */
export async function GetTikTokUserProfile(username: string, options?: ScrapeCreatorsRequestOptions): Promise<SocialUserProfile> {
  const cleanHandle = NormalizeHandle(username);
  const endpoint = `/v1/tiktok/profile?handle=${encodeURIComponent(cleanHandle)}`;
  const payload = await ScrapeCreatorsRequest<ScrapeCreatorsTikTokProfileResponse>(endpoint, options);

  const user = payload.user;
  const stats = payload.stats;

  const profile: SocialUserProfile = {
    username: user?.uniqueId?.toLowerCase() || cleanHandle,
    platformUserId: user?.id,
    displayName: user?.nickname || cleanHandle,
    avatarUrl: user?.avatarLarger || user?.avatarThumb,
    followersCount: stats?.followerCount ?? 0,
    bioDescription: user?.signature || '',
  };

  return profile;
}

/**
 * Retrieves latest public TikTok videos for a user using ScrapeCreators API.
 *
 * @param username - Clean username handle with or without '@'.
 * @param limit - Maximum items to retrieve (default 12).
 * @param options - Optional fetch configuration and credentials override.
 * @returns Array of normalized video items.
 */
export async function GetTikTokRecentVideos(
  username: string,
  limit = 12,
  options?: ScrapeCreatorsRequestOptions,
): Promise<SocialVideoItem[]> {
  const cleanHandle = NormalizeHandle(username);
  const endpoint = `/v3/tiktok/profile/videos?handle=${encodeURIComponent(cleanHandle)}`;
  const payload = await ScrapeCreatorsRequest<ScrapeCreatorsV3VideosResponse>(endpoint, options);

  // ScrapeCreators returns the first page (~12-16 latest videos); slicing caps that initial batch.
  const items = (payload.aweme_list || []).slice(0, limit);

  const videoItems: SocialVideoItem[] = items.map((item) => {
    const videoId = item.aweme_id || '';
    const authorHandle = item.author?.unique_id?.toLowerCase() || cleanHandle;
    const authorPlatformUserId = item.author?.uid;
    const canonicalUrl = `https://www.tiktok.com/@${authorHandle}/video/${videoId}`;
    const title = item.desc?.slice(0, 40) || 'TikTok Video';
    const caption = item.desc || '';
    const publishedAt = item.create_time ? new Date(item.create_time * 1000) : new Date();
    const thumbnailUrl =
      ExtractBestCoverUrl(item.video?.cover?.url_list) ||
      ExtractBestCoverUrl(item.video?.origin_cover?.url_list) ||
      ExtractBestCoverUrl(item.video?.dynamic_cover?.url_list);

    const viewCount = item.statistics?.play_count ?? 0;
    const likeCount = item.statistics?.digg_count ?? 0;
    const commentCount = item.statistics?.comment_count ?? 0;
    const shareCount = item.statistics?.share_count ?? 0;

    const videoItem: SocialVideoItem = {
      id: videoId,
      url: canonicalUrl,
      authorUsername: authorHandle,
      authorPlatformUserId,
      title,
      caption,
      thumbnailUrl,
      viewCount,
      likeCount,
      commentCount,
      shareCount,
      publishedAt,
    };

    return videoItem;
  });

  return videoItems;
}

/**
 * Retrieves metadata for a specific public TikTok video URL using ScrapeCreators API.
 *
 * @param videoUrl - Public TikTok video URL.
 * @param options - Optional fetch configuration and credentials override.
 * @returns Video item metadata.
 */
export async function GetTikTokVideoDetails(videoUrl: string, options?: ScrapeCreatorsRequestOptions): Promise<SocialVideoItem> {
  const validatedUrl = ValidateTikTokVideoUrl(videoUrl);
  const timeoutMs = options?.timeoutMs ?? DEFAULT_SCRAPE_TIMEOUT_MS;
  const resolvedUrl = await ResolveTikTokUrl(validatedUrl, timeoutMs);
  const endpoint = `/v2/tiktok/video?url=${encodeURIComponent(resolvedUrl)}`;
  const payload = await ScrapeCreatorsRequest<ScrapeCreatorsV2VideoDetailsResponse>(endpoint, options);
  const item = payload.aweme_detail;

  if (!item || !item.aweme_id) {
    throw new ScrapeCreatorsApiError({
      message: 'Video details could not be resolved from URL.',
      isRetryable: false,
      isVideoUnavailable: true,
    });
  }

  const isDeletedOrPrivate =
    Boolean(item.status?.is_delete) ||
    Boolean(item.status?.is_private) ||
    (typeof item.status?.private_status === 'number' && item.status.private_status !== 0);

  if (isDeletedOrPrivate) {
    throw new ScrapeCreatorsApiError({
      message: 'TikTok video is deleted or set to private.',
      isRetryable: false,
      isVideoUnavailable: true,
    });
  }

  const videoId = item.aweme_id;
  const authorHandle = item.author?.unique_id?.toLowerCase() || '';
  const authorPlatformUserId = item.author?.uid;
  const canonicalUrl = `https://www.tiktok.com/@${authorHandle}/video/${videoId}`;
  const title = item.desc?.slice(0, 40) || 'TikTok Video';
  const caption = item.desc || '';
  const publishedAt = item.create_time ? new Date(item.create_time * 1000) : new Date();
  const thumbnailUrl =
    ExtractBestCoverUrl(item.video?.cover?.url_list) ||
    ExtractBestCoverUrl(item.video?.origin_cover?.url_list) ||
    ExtractBestCoverUrl(item.video?.dynamic_cover?.url_list);

  const viewCount = item.statistics?.play_count ?? 0;
  const likeCount = item.statistics?.digg_count ?? 0;
  const commentCount = item.statistics?.comment_count ?? 0;
  const shareCount = item.statistics?.share_count ?? 0;

  const videoItem: SocialVideoItem = {
    id: videoId,
    url: canonicalUrl,
    authorUsername: authorHandle,
    authorPlatformUserId,
    title,
    caption,
    thumbnailUrl,
    viewCount,
    likeCount,
    commentCount,
    shareCount,
    publishedAt,
  };

  return videoItem;
}

// ============================================================================
// INSTAGRAM REELS ADAPTERS
// ============================================================================

/**
 * Retrieves public profile metadata and bio for an Instagram handle using ScrapeCreators API.
 *
 * @param username - Instagram handle with or without leading '@'.
 * @param options - Optional fetch configuration and credentials override.
 * @returns Normalized social user profile.
 */
export async function GetInstagramUserProfile(
  username: string,
  options?: ScrapeCreatorsRequestOptions,
): Promise<SocialUserProfile> {
  const cleanHandle = NormalizeHandle(username);
  const endpoint = `/v1/instagram/profile?handle=${encodeURIComponent(cleanHandle)}`;
  const payload = await ScrapeCreatorsRequest<ScrapeCreatorsInstagramProfileResponse>(endpoint, options);
  const userNode = payload.data?.user ?? payload.data ?? payload.user;

  if (!userNode || (!userNode.username && !userNode.id && !userNode.pk)) {
    throw new ScrapeCreatorsApiError({
      message: 'Profil Instagram tidak ditemukan atau tidak dapat diakses.',
      isRetryable: false,
      isVideoUnavailable: true,
    });
  }

  const profile: SocialUserProfile = {
    username: userNode.username ? NormalizeHandle(userNode.username) : cleanHandle,
    platformUserId: userNode.id ?? userNode.pk,
    displayName: userNode.full_name || userNode.username || cleanHandle,
    avatarUrl: userNode.profile_pic_url_hd || userNode.profile_pic_url,
    followersCount: ParseSafeCount(userNode.edge_followed_by?.count ?? userNode.follower_count),
    bioDescription: userNode.biography || '',
    isPrivate: Boolean(userNode.is_private),
  };

  return profile;
}

/**
 * Retrieves recent public Instagram Reels for a handle using ScrapeCreators API.
 * Always passes `require_play_counts=true` to guarantee play count metrics are populated.
 *
 * @param username - Instagram handle with or without leading '@'.
 * @param limit - Maximum number of reels to return (default 12).
 * @param options - Optional fetch configuration and credentials override.
 * @returns Array of normalized Instagram Reel items.
 */
export async function GetInstagramRecentReels(
  username: string,
  limit = 12,
  options?: ScrapeCreatorsRequestOptions,
): Promise<SocialVideoItem[]> {
  const cleanHandle = NormalizeHandle(username);
  const endpoint = `/v1/instagram/user/reels?handle=${encodeURIComponent(cleanHandle)}&require_play_counts=true`;
  const payload = await ScrapeCreatorsRequest<ScrapeCreatorsInstagramReelsResponse>(endpoint, options);
  const rawItems = (payload.items || []).slice(0, limit);

  const videoItems: SocialVideoItem[] = [];

  for (const entry of rawItems) {
    const media = entry.media ?? entry;
    const shortcode = media.code || media.shortcode || '';
    const mediaId = shortcode || media.pk || media.id || '';

    if (!mediaId) continue;

    const authorHandle = media.user?.username
      ? NormalizeHandle(media.user.username)
      : media.owner?.username
        ? NormalizeHandle(media.owner.username)
        : cleanHandle;
    const authorPlatformUserId = media.user?.pk ?? media.user?.id ?? media.owner?.id ?? media.owner?.pk;
    const canonicalUrl = shortcode
      ? `https://www.instagram.com/reel/${shortcode}/`
      : `https://www.instagram.com/${authorHandle}/reels/`;

    const captionText =
      media.caption?.text ?? media.edge_media_to_caption?.edges?.[0]?.node?.text ?? '';
    const title = captionText.slice(0, 40) || 'Instagram Reel';
    const thumbnailUrl =
      media.display_uri ||
      media.display_url ||
      media.thumbnail_src ||
      media.image_versions2?.candidates?.[0]?.url ||
      media.image_versions2?.additional_candidates?.first_frame?.url ||
      media.image_versions2?.additional_candidates?.igtv_first_frame?.url;

    const publishedTimestamp = media.taken_at ?? media.taken_at_timestamp;
    const publishedAt = publishedTimestamp
      ? new Date(publishedTimestamp * 1000)
      : media.created_at
        ? new Date(media.created_at)
        : new Date();

    const viewCount = ParseSafeCount(
      media.play_count ?? media.ig_play_count ?? media.video_play_count ?? media.video_view_count,
    );
    const likeCount = ParseSafeCount(media.like_count ?? media.edge_media_preview_like?.count);
    const commentCount = ParseSafeCount(
      media.comment_count ??
        media.edge_media_to_parent_comment?.count ??
        media.edge_media_to_comment?.count,
    );

    const videoItem: SocialVideoItem = {
      id: mediaId,
      url: canonicalUrl,
      authorUsername: authorHandle,
      authorPlatformUserId,
      title,
      caption: captionText,
      thumbnailUrl,
      viewCount,
      likeCount,
      commentCount,
      shareCount: 0,
      publishedAt,
    };

    videoItems.push(videoItem);
  }

  return videoItems;
}

/**
 * Retrieves full metadata and play counts for a specific public Instagram Reel URL using ScrapeCreators API.
 *
 * @param videoUrl - Public Instagram Reel or video post URL.
 * @param options - Optional fetch configuration and credentials override.
 * @returns Normalized social video metadata.
 */
export async function GetInstagramVideoDetails(
  videoUrl: string,
  options?: ScrapeCreatorsRequestOptions,
): Promise<SocialVideoItem> {
  const validatedUrl = ValidateInstagramVideoUrl(videoUrl);
  const endpoint = `/v1/instagram/post?url=${encodeURIComponent(validatedUrl)}&include_play_count=true`;
  const payload = await ScrapeCreatorsRequest<ScrapeCreatorsInstagramPostResponse>(endpoint, options);
  const media = payload.data?.xdt_shortcode_media ?? payload.item ?? payload.media ?? payload.data;

  const shortcode = media?.shortcode || media?.code || '';
  const mediaId = shortcode || media?.pk || media?.id || '';

  if (!media || !mediaId) {
    throw new ScrapeCreatorsApiError({
      message: 'Detail Instagram Reel tidak ditemukan atau konten telah dihapus.',
      isRetryable: false,
      isVideoUnavailable: true,
    });
  }

  if (media.owner?.is_private) {
    throw new ScrapeCreatorsApiError({
      message: 'Akun Instagram bersifat privat sehingga metrik video tidak dapat diverifikasi.',
      isRetryable: false,
      isVideoUnavailable: true,
    });
  }

  const isExplicitNonVideo = media.is_video === false && media.media_type !== 2 && !media.video_url;
  if (isExplicitNonVideo) {
    throw new ScrapeCreatorsApiError({
      message: 'Tautan Instagram tersebut bukan video atau Reel.',
      isRetryable: false,
      isVideoUnavailable: true,
    });
  }

  const authorHandle = media.owner?.username
    ? NormalizeHandle(media.owner.username)
    : media.user?.username
      ? NormalizeHandle(media.user.username)
      : '';
  const authorPlatformUserId = media.owner?.id ?? media.owner?.pk ?? media.user?.pk ?? media.user?.id;
  const canonicalUrl = shortcode ? `https://www.instagram.com/reel/${shortcode}/` : validatedUrl;

  const captionText =
    media.edge_media_to_caption?.edges?.[0]?.node?.text ?? media.caption?.text ?? '';
  const title = captionText.slice(0, 40) || 'Instagram Reel';
  const thumbnailUrl =
    media.display_url ||
    media.thumbnail_src ||
    media.display_uri ||
    media.image_versions2?.candidates?.[0]?.url ||
    media.image_versions2?.additional_candidates?.first_frame?.url ||
    media.image_versions2?.additional_candidates?.igtv_first_frame?.url;

  const publishedTimestamp = media.taken_at_timestamp ?? media.taken_at;
  const publishedAt = publishedTimestamp
    ? new Date(publishedTimestamp * 1000)
    : media.created_at
      ? new Date(media.created_at)
      : new Date();

  const viewCount = ParseSafeCount(
    media.video_play_count ?? media.play_count ?? media.ig_play_count ?? media.video_view_count,
  );
  const likeCount = ParseSafeCount(media.edge_media_preview_like?.count ?? media.like_count);
  const commentCount = ParseSafeCount(
    media.edge_media_to_parent_comment?.count ??
      media.edge_media_to_comment?.count ??
      media.comment_count,
  );

  const videoItem: SocialVideoItem = {
    id: mediaId,
    url: canonicalUrl,
    authorUsername: authorHandle,
    authorPlatformUserId,
    title,
    caption: captionText,
    thumbnailUrl,
    viewCount,
    likeCount,
    commentCount,
    shareCount: 0,
    publishedAt,
  };

  return videoItem;
}

// ============================================================================
// YOUTUBE SHORTS ADAPTERS
// ============================================================================

/**
 * Retrieves public channel metadata and description ("About") for a YouTube handle using ScrapeCreators API.
 *
 * @param username - YouTube channel handle (with or without leading '@') or channel ID (`UC...`).
 * @param options - Optional fetch configuration and credentials override.
 * @returns Normalized social user profile.
 */
export async function GetYouTubeChannelProfile(
  username: string,
  options?: ScrapeCreatorsRequestOptions,
): Promise<SocialUserProfile> {
  const trimmed = username.trim();
  const isChannelId = /^UC[A-Za-z0-9_-]{20,}$/.test(trimmed);
  const cleanHandle = NormalizeHandle(trimmed);
  const queryParam = isChannelId
    ? `channelId=${encodeURIComponent(trimmed)}`
    : `handle=${encodeURIComponent(cleanHandle)}`;
  const endpoint = `/v1/youtube/channel?${queryParam}`;
  const payload = await ScrapeCreatorsRequest<ScrapeCreatorsYouTubeChannelResponse>(endpoint, options);

  const resolvedChannelId = payload.channelId ?? payload.id;
  if (!resolvedChannelId && !payload.handle && !payload.name && !payload.title) {
    throw new ScrapeCreatorsApiError({
      message: 'Channel YouTube tidak ditemukan atau tidak dapat diakses.',
      isRetryable: false,
      isVideoUnavailable: true,
    });
  }

  const resolvedHandle = payload.handle ? NormalizeHandle(payload.handle) : cleanHandle;
  const avatarUrl = ExtractYouTubeAvatarUrl(payload);

  const profile: SocialUserProfile = {
    username: resolvedHandle,
    platformUserId: resolvedChannelId,
    displayName: payload.name || payload.title || resolvedHandle,
    avatarUrl,
    followersCount: ParseSafeCount(payload.subscriberCountInt ?? payload.subscriberCount),
    bioDescription: payload.description || payload.about || '',
  };

  return profile;
}

/**
 * Retrieves latest public YouTube Shorts for a channel using ScrapeCreators API.
 *
 * @param username - YouTube handle (with or without '@') or channel ID (`UC...`).
 * @param limit - Maximum number of Shorts to retrieve (default 12).
 * @param options - Optional fetch configuration and credentials override.
 * @returns Array of normalized YouTube Shorts items.
 */
export async function GetYouTubeChannelShorts(
  username: string,
  limit = 12,
  options?: ScrapeCreatorsRequestOptions,
): Promise<SocialVideoItem[]> {
  const trimmed = username.trim();
  const isChannelId = /^UC[A-Za-z0-9_-]{20,}$/.test(trimmed);
  const cleanHandle = NormalizeHandle(trimmed);
  const queryParam = isChannelId
    ? `channelId=${encodeURIComponent(trimmed)}`
    : `handle=${encodeURIComponent(cleanHandle)}`;
  const endpoint = `/v1/youtube/channel/shorts?${queryParam}`;
  const payload = await ScrapeCreatorsRequest<ScrapeCreatorsYouTubeShortsListResponse>(endpoint, options);

  const rawList =
    Array.isArray(payload.shorts) && payload.shorts.length > 0
      ? payload.shorts
      : (payload.videos ?? payload.items ?? []);
  const rawItems = rawList.slice(0, limit);
  const videoItems: SocialVideoItem[] = [];

  for (const item of rawItems) {
    const videoId = item.id || item.videoId || '';
    if (!videoId) continue;

    const authorHandle = item.channel?.handle ? NormalizeHandle(item.channel.handle) : cleanHandle;
    const authorPlatformUserId = item.channel?.id;
    const canonicalUrl = `https://www.youtube.com/shorts/${videoId}`;
    const title = item.title?.slice(0, 60) || 'YouTube Short';
    const caption = item.description || item.title || '';
    const rawThumb =
      item.thumbnail ||
      item.thumbnails?.[item.thumbnails.length - 1]?.url;
    // maxresdefault.jpg frequently 404s on mobile-uploaded Shorts; hqdefault.jpg is guaranteed to exist
    const thumbnailUrl =
      rawThumb && !rawThumb.includes('/maxresdefault.jpg')
        ? rawThumb
        : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    const parsedDate = item.publishDate ? new Date(item.publishDate) : new Date();
    const publishedAt = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

    const viewCount = ParseSafeCount(item.viewCountInt ?? item.viewCount ?? item.views);
    const likeCount = ParseSafeCount(item.likeCountInt);
    const commentCount = ParseSafeCount(item.commentCountInt);

    const videoItem: SocialVideoItem = {
      id: videoId,
      url: canonicalUrl,
      authorUsername: authorHandle,
      authorPlatformUserId,
      title,
      caption,
      thumbnailUrl,
      viewCount,
      likeCount,
      commentCount,
      shareCount: 0,
      publishedAt,
    };

    videoItems.push(videoItem);
  }

  return videoItems;
}

/**
 * Retrieves detailed metrics for a specific YouTube Shorts URL using ScrapeCreators API.
 * Enforces strict YouTube Shorts validation (rejects regular long-form videos).
 *
 * @param videoUrl - Public YouTube Shorts URL (`/shorts/<id>`).
 * @param options - Optional fetch configuration and credentials override.
 * @returns Normalized social video metadata.
 */
export async function GetYouTubeShortDetails(
  videoUrl: string,
  options?: ScrapeCreatorsRequestOptions,
): Promise<SocialVideoItem> {
  const validatedUrl = ValidateYouTubeShortsUrl(videoUrl);
  const endpoint = `/v1/youtube/video?url=${encodeURIComponent(validatedUrl)}`;
  const item = await ScrapeCreatorsRequest<ScrapeCreatorsYouTubeShortItem>(endpoint, options);

  const videoId = item.id || item.videoId || '';
  if (!videoId) {
    throw new ScrapeCreatorsApiError({
      message: 'Video YouTube Shorts tidak ditemukan atau telah dihapus.',
      isRetryable: false,
      isVideoUnavailable: true,
    });
  }

  // Guard against regular long-form YouTube videos manually rewritten to /shorts/<id>
  const durationSeconds = ExtractYouTubeDurationSeconds(item);
  const isLongFormNonShort =
    item.type !== 'short' &&
    durationSeconds !== null &&
    durationSeconds > MAX_YOUTUBE_SHORT_DURATION_SECONDS;

  if (isLongFormNonShort) {
    throw new ScrapeCreatorsApiError({
      message: 'Video ini bukan YouTube Shorts. Harap pilih video YouTube Shorts yang valid.',
      isRetryable: false,
      isVideoUnavailable: true,
    });
  }

  const authorHandle = item.channel?.handle ? NormalizeHandle(item.channel.handle) : '';
  const authorPlatformUserId = item.channel?.id;
  const canonicalUrl = `https://www.youtube.com/shorts/${videoId}`;
  const title = item.title?.slice(0, 60) || 'YouTube Short';
  const caption = item.description || item.title || '';
  const rawThumb =
    item.thumbnail ||
    item.thumbnails?.[item.thumbnails.length - 1]?.url;
  const thumbnailUrl =
    rawThumb && !rawThumb.includes('/maxresdefault.jpg')
      ? rawThumb
      : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  const parsedDate = item.publishDate ? new Date(item.publishDate) : new Date();
  const publishedAt = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  // Treat null viewCountInt ("No views") safely as 0
  const viewCount = ParseSafeCount(item.viewCountInt ?? item.viewCount ?? item.views);
  const likeCount = ParseSafeCount(item.likeCountInt);
  const commentCount = ParseSafeCount(item.commentCountInt);

  const videoItem: SocialVideoItem = {
    id: videoId,
    url: canonicalUrl,
    authorUsername: authorHandle,
    authorPlatformUserId,
    title,
    caption,
    thumbnailUrl,
    viewCount,
    likeCount,
    commentCount,
    shareCount: 0,
    publishedAt,
  };

  return videoItem;
}

// ============================================================================
// UNIFIED MULTI-PLATFORM DISPATCHERS
// ============================================================================

/**
 * Fetches public profile metadata and bio/description for a handle on the requested platform.
 *
 * @param platform - Target social platform (`TIKTOK`, `INSTAGRAM`, `YOUTUBE`).
 * @param username - Social handle or YouTube channel ID.
 * @param options - Optional fetch configuration and credentials override.
 * @returns Normalized social user profile.
 */
export async function GetSocialUserProfile(
  platform: Platform,
  username: string,
  options?: ScrapeCreatorsRequestOptions,
): Promise<SocialUserProfile> {
  switch (platform) {
    case Platform.INSTAGRAM: {
      const profile = await GetInstagramUserProfile(username, options);
      return profile;
    }
    case Platform.YOUTUBE: {
      const profile = await GetYouTubeChannelProfile(username, options);
      return profile;
    }
    case Platform.TIKTOK:
    default: {
      const profile = await GetTikTokUserProfile(username, options);
      return profile;
    }
  }
}

/**
 * Fetches recent public videos/reels/shorts for a handle on the requested platform.
 *
 * @param platform - Target social platform (`TIKTOK`, `INSTAGRAM`, `YOUTUBE`).
 * @param username - Social handle or YouTube channel ID.
 * @param limit - Maximum number of videos to return (default 12).
 * @param options - Optional fetch configuration and credentials override.
 * @returns Array of normalized video items.
 */
export async function GetSocialRecentVideos(
  platform: Platform,
  username: string,
  limit = 12,
  options?: ScrapeCreatorsRequestOptions,
): Promise<SocialVideoItem[]> {
  switch (platform) {
    case Platform.INSTAGRAM: {
      const videos = await GetInstagramRecentReels(username, limit, options);
      return videos;
    }
    case Platform.YOUTUBE: {
      const videos = await GetYouTubeChannelShorts(username, limit, options);
      return videos;
    }
    case Platform.TIKTOK:
    default: {
      const videos = await GetTikTokRecentVideos(username, limit, options);
      return videos;
    }
  }
}

/**
 * Fetches live video metrics and ownership metadata for a video URL on the requested platform.
 *
 * @param platform - Target social platform (`TIKTOK`, `INSTAGRAM`, `YOUTUBE`).
 * @param videoUrl - Public video URL matching the platform.
 * @param options - Optional fetch configuration and credentials override.
 * @returns Normalized social video item.
 */
export async function GetSocialVideoDetails(
  platform: Platform,
  videoUrl: string,
  options?: ScrapeCreatorsRequestOptions,
): Promise<SocialVideoItem> {
  switch (platform) {
    case Platform.INSTAGRAM: {
      const details = await GetInstagramVideoDetails(videoUrl, options);
      return details;
    }
    case Platform.YOUTUBE: {
      const details = await GetYouTubeShortDetails(videoUrl, options);
      return details;
    }
    case Platform.TIKTOK:
    default: {
      const details = await GetTikTokVideoDetails(videoUrl, options);
      return details;
    }
  }
}
