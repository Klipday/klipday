import { useQuery } from '@tanstack/react-query';
import {
  GetAllConnectedSocialAccounts,
  GetCampaignSubmissions,
  GetConnectedSocialAccount,
  GetMyCampaignSubmission,
  GetMySubmissions,
  GetRecentTikTokVideos,
} from '../api';
import type {
  CampaignSubmissionsPaginatedResponse,
  CampaignSubmissionsQueryParams,
  CreatorSocialAccount,
  CreatorSubmissionsPaginatedResponse,
  CreatorSubmissionsQueryParams,
  MySubmissionData,
  SocialPlatform,
  SocialVideoItem,
} from '../types';

/**
 * Query hook for retrieving current creator's submission progress and connected TikTok handle.
 *
 * @param campaignId - Target campaign UUID.
 * @returns Query state containing submission details.
 */
export function UseMyCampaignSubmissionQuery(campaignId?: string) {
  return useQuery<MySubmissionData>({
    queryKey: ['my-campaign-submission', campaignId],
    queryFn: () => {
      if (!campaignId) {
        throw new Error('Campaign ID is required.');
      }
      return GetMyCampaignSubmission(campaignId);
    },
    enabled: Boolean(campaignId),
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Query hook for retrieving creator's currently verified social account for a specific platform.
 *
 * @param platform - Optional social platform (defaults to TIKTOK).
 * @returns Query state containing verified social account.
 */
export function UseConnectedSocialAccountQuery(platform?: SocialPlatform) {
  return useQuery<CreatorSocialAccount | null>({
    queryKey: platform ? ['connected-social-account', platform] : ['connected-social-account'],
    queryFn: () => GetConnectedSocialAccount(platform),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Query hook for retrieving all active verified social accounts (TikTok, Instagram, YouTube) connected by the creator.
 *
 * @returns Query state containing array of verified social accounts across all platforms.
 */
export function UseAllConnectedSocialAccountsQuery() {
  return useQuery<CreatorSocialAccount[]>({
    queryKey: ['connected-social-accounts'],
    queryFn: GetAllConnectedSocialAccounts,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Query hook for fetching recent videos/reels/shorts from the creator's connected account on a given platform.
 * Segmented by platform and username to prevent showing stale cached videos from another account.
 *
 * @param isEnabled - Whether the query is active.
 * @param username - Clean username handle of the connected account.
 * @param platform - Target social platform (defaults to TIKTOK).
 * @returns Query state containing recent video gallery.
 */
export function UseRecentTikTokVideosQuery(
  isEnabled = true,
  username?: string,
  platform: SocialPlatform = 'TIKTOK',
) {
  return useQuery<SocialVideoItem[]>({
    queryKey: ['recent-tiktok-videos', platform, username],
    queryFn: () => GetRecentTikTokVideos(username, platform),
    enabled: Boolean(isEnabled && username),
    staleTime: 1000 * 30, // 30 seconds
    retry: 2,
  });
}

/**
 * Query hook for retrieving paginated and filtered submissions for a campaign (Brand/Admin review queue).
 *
 * @param campaignId - Target campaign UUID.
 * @param params - Query parameters for pagination, status filter, search, and sorting.
 * @returns TanStack Query result containing submission review items and pagination metadata.
 */
export function UseCampaignSubmissionsQuery(
  campaignId?: string,
  params?: CampaignSubmissionsQueryParams,
) {
  return useQuery<CampaignSubmissionsPaginatedResponse>({
    queryKey: ['campaign-submissions', campaignId, params],
    queryFn: () => {
      if (!campaignId) {
        throw new Error('Campaign ID is required.');
      }
      return GetCampaignSubmissions(campaignId, params);
    },
    enabled: Boolean(campaignId),
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Query hook for retrieving the creator's submitted campaign videos with status filter and search.
 *
 * @param params - Query parameters for pagination, status filter, search, and sorting.
 * @returns TanStack Query result containing creator submissions and status counts.
 */
export function UseMySubmissionsQuery(params?: CreatorSubmissionsQueryParams) {
  return useQuery<CreatorSubmissionsPaginatedResponse>({
    queryKey: ['my-submissions', params],
    queryFn: () => GetMySubmissions(params),
    staleTime: 1000 * 30, // 30 seconds
  });
}

