import { apiClient, ExtractApiError } from '@/lib/api-client';
import { CREATOR_DASHBOARD_MESSAGES, DASHBOARD_MESSAGES } from './constants';
import type {
  ApiResponse,
  BrandDashboardResponse,
  CreatorDashboardResponse,
} from './types';

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

/**
 * Retrieves the comprehensive creator monitoring dashboard summary.
 * Aggregates verified views, video earnings, withdrawable balance, recent submissions,
 * active joined campaigns awaiting video submission, and top verified clips in a single roundtrip.
 *
 * @returns Complete creator dashboard summary.
 * @throws Standardized API error if the request fails.
 */
export async function GetCreatorDashboardSummary(): Promise<CreatorDashboardResponse> {
  try {
    const response = await apiClient.get<ApiResponse<CreatorDashboardResponse>>('/creator/dashboard');
    const result = response.data.data;
    if (!result) {
      throw new Error(CREATOR_DASHBOARD_MESSAGES.FETCH_ERROR);
    }
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, CREATOR_DASHBOARD_MESSAGES.FETCH_ERROR);
    throw apiError;
  }
}

