import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { GetAdminDashboardSummary } from '../api';
import type { AdminDashboardResponse } from '../types';

export const ADMIN_DASHBOARD_QUERY_KEY = ['admin', 'dashboard'] as const;

/**
 * Custom TanStack Query hook that retrieves the operational admin dashboard summary.
 * Uses a 30-second staleTime for fast background updates without spamming the server.
 *
 * @returns TanStack Query result containing AdminDashboardResponse.
 */
export function UseAdminDashboardQuery(): UseQueryResult<AdminDashboardResponse, Error> {
  const queryResult = useQuery({
    queryKey: ADMIN_DASHBOARD_QUERY_KEY,
    queryFn: GetAdminDashboardSummary,
    staleTime: 30 * 1000,
  });

  return queryResult;
}
