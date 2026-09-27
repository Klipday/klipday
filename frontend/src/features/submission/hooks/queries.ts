import { useQuery } from '@tanstack/react-query';
import {
  GetCampaignSubmissions,
  GetConnectedSocialAccount,
  GetMyCampaignSubmission,
  GetRecentTikTokVideos,
} from '../api';
import type {
  CampaignSubmissionsPaginatedResponse,
  CampaignSubmissionsQueryParams,
  CreatorSocialAccount,
  MySubmissionData,
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
 * Query hook for retrieving creator's currently verified TikTok account.
 *
 * @returns Query state containing verified social account.
 */
export function UseConnectedSocialAccountQuery() {
  return useQuery<CreatorSocialAccount | null>({
    queryKey: ['connected-social-account'],
    queryFn: GetConnectedSocialAccount,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Query hook for fetching recent TikTok videos from the creator's connected account.
 * Segmented by username to prevent showing stale cached videos from a previous account.
 *
 * @param isEnabled - Whether the query is active.
 * @param username - Clean username handle of the connected account.
 * @returns Query state containing recent video gallery.
 */
export function UseRecentTikTokVideosQuery(isEnabled = true, username?: string) {
  return useQuery<SocialVideoItem[]>({
    queryKey: ['recent-tiktok-videos', username],
    queryFn: () => GetRecentTikTokVideos(username),
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
