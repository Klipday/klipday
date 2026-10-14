import { apiClient, ExtractApiError } from '@/lib/api-client';
import { DASHBOARD_MESSAGES } from './constants';
import type { ApiResponse, BrandDashboardResponse } from './types';

/**
 * Retrieves the comprehensive brand monitoring dashboard summary.
 * Aggregates wallet balance, locked escrow, active campaigns, pending submissions queue,
 * and viral top clips in a single roundtrip.
 *
 * @returns Complete brand dashboard summary.
 * @throws Standardized API error if the request fails.
 */
export async function GetBrandDashboardSummary(): Promise<BrandDashboardResponse> {
  try {
    const response = await apiClient.get<ApiResponse<BrandDashboardResponse>>('/brand/dashboard');
    const result = response.data.data;
    if (!result) {
      throw new Error(DASHBOARD_MESSAGES.FETCH_ERROR);
    }
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, DASHBOARD_MESSAGES.FETCH_ERROR);
    throw apiError;
  }
}
