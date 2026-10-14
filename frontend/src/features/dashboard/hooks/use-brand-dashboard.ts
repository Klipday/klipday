import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { GetBrandDashboardSummary } from '../api';
import type { BrandDashboardResponse } from '../types';

/**
 * Custom TanStack Query hook that retrieves the brand monitoring dashboard summary.
 * Uses a 60-second staleTime to prevent redundant refetches during active navigation.
 *
 * @returns TanStack Query result containing BrandDashboardResponse.
 */
export function UseBrandDashboardQuery(): UseQueryResult<BrandDashboardResponse, Error> {
  const queryResult = useQuery({
    queryKey: ['brand', 'dashboard'],
    queryFn: GetBrandDashboardSummary,
    staleTime: 60 * 1000,
  });

  return queryResult;
}
