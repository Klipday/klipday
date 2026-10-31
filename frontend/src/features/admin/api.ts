import { apiClient, ExtractApiError } from '@/lib/api-client';
import type { ApiResponse, Campaign } from '@/features/campaign/types';
import type {
  AdminCampaignSettlementSummaryDto,
  AdminModerateCampaignPayload,
  AdminModerationCampaignsPaginatedDto,
  AdminModerationQueryParams,
  AdminSettlementCampaignsPaginatedDto,
  AdminSettlementQueryParams,
  AdminTopUpItem,
  AdminTopUpsPaginated,
  DisqualifySettlementSubmissionPayload,
  GetAdminTopUpsParams,
  ReviewBrandTopUpPayload,
  UpdateSettlementSubmissionViewsPayload,
} from './types';

/**
 * Fetches paginated campaigns ready for settlement review (`GET /admin/settlements`).
 *
 * @param params - Filter, search, page, and limit query parameters.
 * @returns Paginated settlement campaign cards and tab counts.
 */
export async function GetAdminSettlementCampaigns(
  params?: AdminSettlementQueryParams,
): Promise<AdminSettlementCampaignsPaginatedDto> {
  try {
    const response = await apiClient.get<ApiResponse<AdminSettlementCampaignsPaginatedDto>>(
      '/admin/settlements',
      { params },
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(
      error,
      'Gagal memuat daftar kampanye settlement. Silakan coba lagi.',
    );
    throw apiError;
  }
}

/**
 * Fetches the FIFO settlement ledger and ordered submissions for a specific campaign
 * (`GET /admin/settlements/campaigns/:id`).
 *
 * @param campaignId - Target campaign UUID.
 * @returns Complete settlement summary and FIFO submission queue.
 */
export async function GetAdminCampaignSettlementSummary(
  campaignId: string,
): Promise<AdminCampaignSettlementSummaryDto> {
  try {
    const response = await apiClient.get<ApiResponse<AdminCampaignSettlementSummaryDto>>(
      `/admin/settlements/campaigns/${campaignId}`,
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(
      error,
      'Gagal memuat rincian settlement kampanye.',
    );
    throw apiError;
  }
}

/**
 * Disqualifies an APPROVED submission during settlement audit and triggers a FIFO reward reshuffle
 * (`POST /admin/settlements/submissions/:id/disqualify`).
 *
 * @param payload - Target submission ID, campaign ID, and optional review note.
 * @returns Updated campaign settlement summary after FIFO reshuffle.
 */
export async function DisqualifySettlementSubmission(
  payload: DisqualifySettlementSubmissionPayload,
): Promise<AdminCampaignSettlementSummaryDto> {
  try {
    const response = await apiClient.post<ApiResponse<AdminCampaignSettlementSummaryDto>>(
      `/admin/settlements/submissions/${payload.submissionId}/disqualify`,
      { reviewNote: payload.reviewNote },
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(
      error,
      'Gagal mendiskualifikasi pengajuan video. Silakan coba lagi.',
    );
    throw apiError;
  }
}

/**
 * Updates verified views for a submission during settlement audit and recalculates FIFO allocations
 * (`PATCH /admin/settlements/submissions/:id/views`).
 *
 * @param payload - Submission ID, campaign ID, and updated verified views integer.
 * @returns Updated campaign settlement summary.
 */
export async function UpdateSettlementSubmissionViews(
  payload: UpdateSettlementSubmissionViewsPayload,
): Promise<AdminCampaignSettlementSummaryDto> {
  try {
    const response = await apiClient.patch<ApiResponse<AdminCampaignSettlementSummaryDto>>(
      `/admin/settlements/submissions/${payload.submissionId}/views`,
      { verifiedViews: payload.verifiedViews },
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(
      error,
      'Gagal memperbarui tayangan terverifikasi.',
    );
    throw apiError;
  }
}

/**
 * Recalculates and syncs FIFO reward allocations across all APPROVED submissions on a campaign
 * (`POST /admin/settlements/campaigns/:id/recalculate`).
 *
 * @param campaignId - Target campaign UUID.
 * @returns Updated campaign settlement summary.
 */
export async function RecalculateCampaignSettlementFifo(
  campaignId: string,
): Promise<AdminCampaignSettlementSummaryDto> {
  try {
    const response = await apiClient.post<ApiResponse<AdminCampaignSettlementSummaryDto>>(
      `/admin/settlements/campaigns/${campaignId}/recalculate`,
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(
      error,
      'Gagal menghitung ulang alokasi reward FIFO.',
    );
    throw apiError;
  }
}

/**
 * Finalizes campaign settlement: distributes verified creator rewards, refunds unspent budget to the brand,
 * and marks the campaign as FINISHED (`POST /admin/settlements/campaigns/:id/finalize`).
 *
 * @param campaignId - Target campaign UUID.
 * @returns Finalized campaign settlement summary.
 */
export async function FinalizeCampaignSettlement(
  campaignId: string,
): Promise<AdminCampaignSettlementSummaryDto> {
  try {
    const response = await apiClient.post<ApiResponse<AdminCampaignSettlementSummaryDto>>(
      `/admin/settlements/campaigns/${campaignId}/finalize`,
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(
      error,
      'Gagal menyelesaikan settlement kampanye. Silakan coba lagi.',
    );
    throw apiError;
  }
}

/**
 * Fetches the paginated list of campaigns for admin moderation review (`GET /admin/campaigns`).
 *
 * @param params - Filter, search, page, and limit query parameters.
 * @returns Paginated campaign cards and tab counts.
 */
export async function GetAdminModerationCampaigns(
  params?: AdminModerationQueryParams,
): Promise<AdminModerationCampaignsPaginatedDto> {
  try {
    const response = await apiClient.get<ApiResponse<AdminModerationCampaignsPaginatedDto>>(
      '/admin/campaigns',
      { params },
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(
      error,
      'Gagal memuat antrean moderasi kampanye. Silakan coba lagi.',
    );
    throw apiError;
  }
}

/**
 * Submits an administrative campaign moderation decision (`POST /admin/campaigns/:id/moderate`).
 * Handles APPROVE, REVISION, REJECT_PAYMENT, or REJECT_CAMPAIGN.
 *
 * @param campaignId - Target campaign UUID.
 * @param payload - Action decision and optional note / refund confirmation.
 * @returns Updated campaign detail data.
 */
export async function ModerateCampaign(
  campaignId: string,
  payload: AdminModerateCampaignPayload,
): Promise<Campaign> {
  try {
    const response = await apiClient.post<ApiResponse<Campaign>>(
      `/admin/campaigns/${campaignId}/moderate`,
      payload,
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(
      error,
      'Gagal memproses keputusan moderasi kampanye.',
    );
    throw apiError;
  }
}

/**
 * Fetches paginated manual top-up requests across brands (`GET /admin/top-ups`).
 *
 * @param params - Filter, search, page, and limit query parameters.
 * @returns Paginated top-up request items, tab counts, and pagination metadata.
 */
export async function GetAdminTopUps(
  params?: GetAdminTopUpsParams,
): Promise<AdminTopUpsPaginated> {
  try {
    const response = await apiClient.get<ApiResponse<AdminTopUpsPaginated>>(
      '/admin/top-ups',
      { params },
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(
      error,
      'Gagal memuat daftar antrean top up brand. Silakan coba lagi.',
    );
    throw apiError;
  }
}

/**
 * Submits an administrative review decision (APPROVE or REJECT) for a manual top-up request
 * (`POST /admin/top-ups/:id/review`).
 *
 * @param payload - Target top-up ID, decision, and optional rejection reason.
 * @returns Updated top-up request record.
 */
export async function ReviewBrandTopUp(
  payload: ReviewBrandTopUpPayload,
): Promise<AdminTopUpItem> {
  try {
    const response = await apiClient.post<ApiResponse<AdminTopUpItem>>(
      `/admin/top-ups/${payload.id}/review`,
      {
        decision: payload.decision,
        rejectionReason: payload.rejectionReason,
      },
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(
      error,
      'Gagal memproses verifikasi top up. Silakan coba lagi.',
    );
    throw apiError;
  }
}

