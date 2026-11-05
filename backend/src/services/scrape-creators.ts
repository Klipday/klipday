export const SCRAPECREATORS_BASE_URL = 'https://api.scrapecreators.com';
export const DEFAULT_SCRAPE_TIMEOUT_MS = 15_000;

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
 * deleted, private, or missing TikTok videos (`isVideoUnavailable`).
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

export interface TikTokUserProfile {
  username: string;
  platformUserId?: string;
  displayName?: string;
  avatarUrl?: string;
  followersCount: number;
  bioDescription?: string;
}

export interface TikTokVideoItem {
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

interface ScrapeCreatorsProfileResponse {
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

const RETRYABLE_HTTP_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const UNAVAILABLE_HTTP_STATUS_CODES = new Set([404, 410]);

/**
 * Validates that a video URL string is well-formed, uses http/https, and belongs to a TikTok domain.
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
 * Retrieves and validates the ScrapeCreators API key from options or environment.
 *
 * @param customKey - Optional API key override.
 * @throws Error if no API key is found.
 * @returns Clean API key string.
 */
export function GetScrapeCreatorsApiKey(customKey?: string): string {
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
export async function ScrapeCreatorsRequest<T>(endpoint: string, options?: ScrapeCreatorsRequestOptions): Promise<T> {
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
 * Selects the best image URL from TikTok CDN's candidate list.
 * Prioritizes standard web formats (jpeg, jpg, webp, png) over iOS-specific .heic.
 *
 * @param urlList - Array of candidate image URLs from TikTok CDN.
 * @returns Best candidate URL, or undefined.
 */
function ExtractBestCoverUrl(urlList?: string[]): string | undefined {
  if (!urlList || urlList.length === 0) return undefined;
  const webImage = urlList.find((url) => /\.(jpeg|jpg|webp|png)(\?|$)/i.test(url));
  return webImage || urlList[0];
}

/**
 * Expands shortened TikTok links (vt.tiktok.com / vm.tiktok.com) to their full canonical web URL.
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
 * Retrieves public profile metadata and bio for a specific TikTok username using ScrapeCreators API.
 * Throws an error if SCRAPECREATORS_API_KEY is not configured.
 *
 * @param username - Social media handle with or without leading '@'.
 * @param options - Optional fetch configuration and credentials override.
 * @returns User profile details including bio and follower count.
 */
export async function GetTikTokUserProfile(username: string, options?: ScrapeCreatorsRequestOptions): Promise<TikTokUserProfile> {
  const cleanHandle = username.replace(/^@/, '').toLowerCase().trim();
  const endpoint = `/v1/tiktok/profile?handle=${encodeURIComponent(cleanHandle)}`;
  const payload = await ScrapeCreatorsRequest<ScrapeCreatorsProfileResponse>(endpoint, options);

  const user = payload.user;
  const stats = payload.stats;

  const profile: TikTokUserProfile = {
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
 * Throws an error if SCRAPECREATORS_API_KEY is not configured.
 *
 * @param username - Clean username handle with or without '@'.
 * @param limit - Maximum items to retrieve (default 12).
 * @param options - Optional fetch configuration and credentials override.
 * @returns Array of normalized video items.
 */
export async function GetTikTokRecentVideos(
  username: string,
  limit = 12,
  options?: ScrapeCreatorsRequestOptions
): Promise<TikTokVideoItem[]> {
  const cleanHandle = username.replace(/^@/, '').toLowerCase().trim();
  const endpoint = `/v3/tiktok/profile/videos?handle=${encodeURIComponent(cleanHandle)}`;
  const payload = await ScrapeCreatorsRequest<ScrapeCreatorsV3VideosResponse>(endpoint, options);

  // ScrapeCreators uses cursor pagination and only fetches the first page (~12-16 latest videos)
  // per request; it never dumps an entire 3,000-video catalog. Slicing caps that initial batch.
  const items = (payload.aweme_list || []).slice(0, limit);

  const videoItems: TikTokVideoItem[] = items.map((item) => {
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

    const videoItem: TikTokVideoItem = {
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
 * Retrieves metadata for a specific public video URL using ScrapeCreators API.
 * Throws an error if SCRAPECREATORS_API_KEY is not configured.
 *
 * @param videoUrl - Public TikTok video URL.
 * @param options - Optional fetch configuration and credentials override.
 * @returns Video item metadata.
 */
export async function GetTikTokVideoDetails(videoUrl: string, options?: ScrapeCreatorsRequestOptions): Promise<TikTokVideoItem> {
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

  const videoItem: TikTokVideoItem = {
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
