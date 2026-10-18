import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { GetCreatorDashboardSummary } from '../api';
import type { CreatorDashboardResponse } from '../types';

/**
 * Custom TanStack Query hook that retrieves the creator monitoring dashboard summary.
 * Uses a 60-second staleTime to prevent redundant refetches during active navigation.
 *
 * @returns TanStack Query result containing CreatorDashboardResponse.
 */
export function UseCreatorDashboardQuery(): UseQueryResult<CreatorDashboardResponse, Error> {
  const queryResult = useQuery({
    queryKey: ['creator', 'dashboard'],
    queryFn: GetCreatorDashboardSummary,
    staleTime: 60 * 1000,
  });

  return queryResult;
}
