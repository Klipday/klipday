import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { GetCampaignById, GetCampaignPaymentDetails, GetCampaigns, GetCampaignStatusCounts, GetFeaturedCampaigns } from '../api';
import type {
  Campaign,
  CampaignCardItem,
  CampaignPaymentDetailsResponse,
  CampaignQueryParams,
  CampaignsPaginatedData,
  CampaignStatusCounts,
} from '../types';

/**
 * Custom TanStack Query hook that fetches a single campaign's details by its ID.
 * Enabled only when a valid campaign ID is provided.
 *
 * @param id - The UUID of the campaign to fetch.
 * @returns TanStack Query result containing the campaign data or error.
 */
export function UseCampaignQuery(id: string | undefined): UseQueryResult<Campaign, Error> {
  const queryResult = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => GetCampaignById(id),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });

  return queryResult;
}

/**
 * Custom TanStack Query hook that fetches a paginated list of campaigns for the current authenticated brand.
 *
 * @param query - Optional query parameters (pagination, search, sort, filters).
 * @returns TanStack Query result containing the paginated campaigns data.
 */
export function UseCampaignsQuery(query?: CampaignQueryParams): UseQueryResult<CampaignsPaginatedData, Error> {
  const queryResult = useQuery({
    queryKey: ['campaigns', query],
    queryFn: () => GetCampaigns(query),
    staleTime: 60 * 1000,
  });

  return queryResult;
}

/**
 * Custom TanStack Query hook that fetches campaign counts grouped by lifecycle status for the authenticated brand.
 *
 * @returns TanStack Query result containing campaign status counts.
 */
export function UseCampaignStatusCountsQuery(): UseQueryResult<CampaignStatusCounts, Error> {
  const queryResult = useQuery({
    queryKey: ['campaign-counts'],
    queryFn: () => GetCampaignStatusCounts(),
    staleTime: 30 * 1000,
  });

  return queryResult;
}

/**
 * Custom TanStack Query hook that fetches a list of 3-5 featured campaigns for the hero carousel.
 *
 * @returns TanStack Query result containing the list of featured campaign items.
 */
export function UseFeaturedCampaignsQuery(): UseQueryResult<CampaignCardItem[], Error> {
  const queryResult = useQuery({
    queryKey: ['campaigns', 'featured'],
    queryFn: () => GetFeaturedCampaigns(),
    staleTime: 60 * 1000,
  });

  return queryResult;
}

/**
 * Custom TanStack Query hook that fetches payment details for a campaign.
 *
 * @param id - The UUID of the campaign.
 * @returns TanStack Query result containing the campaign payment details.
 */
export function UseCampaignPaymentDetailsQuery(id: string | undefined): UseQueryResult<CampaignPaymentDetailsResponse, Error> {
  const queryResult = useQuery({
    queryKey: ['campaign-payment', id],
    queryFn: () => GetCampaignPaymentDetails(id),
    enabled: Boolean(id),
    staleTime: 15 * 1000,
  });

  return queryResult;
}


