import { apiClient, ExtractApiError } from '@/lib/api-client';
import type {
  ApiResponse,
  BrandWalletSummary,
  CreateTopUpPayload,
  CreateWithdrawalPayload,
  PaginatedTransactionsResponse,
  PayoutRequestRecord,
  RequestWithdrawalCancellationPayload,
  SimulateApprovalResult,
  SimulateWithdrawalResult,
  SubmitTopUpProofPayload,
  TopUpRequestRecord,
  TransactionQueryParams,
} from './types';


/**
 * Retrieves the wallet balance and aggregated metrics (active, locked, creator payouts)
 * for the authenticated brand.
 *
 * @returns Wallet summary with metrics.
 * @throws Standardized API error if the request fails.
 */
export async function GetBrandWalletSummary(): Promise<BrandWalletSummary> {
  try {
    const response = await apiClient.get<ApiResponse<BrandWalletSummary>>('/wallet/summary');
    const result = response.data.data;
    if (!result) {
      throw new Error('Respon ringkasan dompet tidak valid.');
    }
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memuat ringkasan dompet brand.');
    throw apiError;
  }
}

/**
 * Retrieves paginated transaction history for the authenticated brand.
 *
 * @param params - Optional query filter parameters (type, page, limit, search).
 * @returns Paginated transactions and pagination metadata.
 * @throws Standardized API error if the request fails.
 */
export async function GetBrandTransactions(
  params?: TransactionQueryParams,
): Promise<PaginatedTransactionsResponse> {
  try {
    const response = await apiClient.get<ApiResponse<PaginatedTransactionsResponse>>(
      '/wallet/transactions',
      { params },
    );
    const result = response.data.data;
    if (!result) {
      throw new Error('Respon riwayat transaksi tidak valid.');
    }
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memuat riwayat transaksi dompet.');
    throw apiError;
  }
}

/**
 * Submits a new manual top-up request to generate payment details and unique code.
 *
 * @param payload - Top-up payload with amount and optional sender details.
 * @returns Created top-up request record.
 * @throws Standardized API error if the request fails.
 */
export async function CreateTopUpRequest(
  payload: CreateTopUpPayload,
): Promise<TopUpRequestRecord> {
  try {
    const response = await apiClient.post<ApiResponse<TopUpRequestRecord>>(
      '/wallet/top-up',
      payload,
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal membuat permintaan top-up.');
    throw apiError;
  }
}

/**
 * Streams the transfer proof image binary directly to the backend storage endpoint.
 *
 * @param file - File image to upload.
 * @param onProgress - Optional callback tracking upload progress percentage.
 * @returns Public URL of the uploaded proof.
 * @throws Standardized API error if the request fails.
 */
export async function UploadTopUpProof(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  try {
    const response = await apiClient.post<ApiResponse<{ url: string }>>(
      '/wallet/top-up/proof',
      file,
      {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress?.(percent);
          }
        },
      },
    );
    const result = response.data.data.url;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal mengunggah bukti transfer.');
    throw apiError;
  }
}

/**
 * Simulates sandbox approval of a manual top-up request, crediting the active balance immediately.
 *
 * @param topUpId - UUID of the top-up request.
 * @returns Result of the simulation containing the updated wallet and transaction.
 * @throws Standardized API error if the request fails.
 */
export async function SimulateTopUpApproval(
  topUpId: string,
): Promise<SimulateApprovalResult> {
  try {
    const response = await apiClient.post<ApiResponse<SimulateApprovalResult>>(
      `/wallet/top-up/${topUpId}/approve`,
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal menyimulasikan konfirmasi top-up.');
    throw apiError;
  }
}

/**
 * Retrieves active unapproved top-up requests (PENDING or SUBMITTED) within 24 hours.
 *
 * @returns Array of active top-up records.
 * @throws Standardized API error if the request fails.
 */
export async function GetActiveTopUpRequests(): Promise<TopUpRequestRecord[]> {
  try {
    const response = await apiClient.get<ApiResponse<TopUpRequestRecord[]>>('/wallet/top-up/active');
    const result = response.data.data;
    return result ?? [];
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memuat antrean transaksi top-up aktif.');
    throw apiError;
  }
}

/**
 * Submits proof of payment for an active top-up request to advance status to SUBMITTED.
 *
 * @param topUpId - UUID of the top-up request.
 * @param payload - Optional proof payload.
 * @returns Updated top-up request record.
 * @throws Standardized API error if the request fails.
 */
export async function SubmitTopUpProof(
  topUpId: string,
  payload: SubmitTopUpProofPayload,
): Promise<TopUpRequestRecord> {
  try {
    const response = await apiClient.post<ApiResponse<TopUpRequestRecord>>(
      `/wallet/top-up/${topUpId}/submit`,
      payload,
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal mengirim konfirmasi bukti transfer.');
    throw apiError;
  }
}

/**
 * Cancels / soft-deletes a pending top-up request.
 *
 * @param topUpId - UUID of the top-up request.
 * @returns Cancellation response data.
 * @throws Standardized API error if the request fails.
 */
export async function CancelTopUpRequest(
  topUpId: string,
): Promise<{ id: string }> {
  try {
    const response = await apiClient.delete<ApiResponse<{ id: string }>>(
      `/wallet/top-up/${topUpId}`,
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal membatalkan permintaan top-up.');
    throw apiError;
  }
}

/**
 * Retrieves active unapproved withdrawal requests (PENDING) for the authenticated brand.
 *
 * @returns Array of active withdrawal records.
 * @throws Standardized API error if the request fails.
 */
export async function GetActiveWithdrawalRequests(): Promise<PayoutRequestRecord[]> {
  try {
    const response = await apiClient.get<ApiResponse<PayoutRequestRecord[]>>(
      '/wallet/withdrawals/active',
    );
    const result = response.data.data;
    return result ?? [];
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memuat antrean penarikan saldo aktif.');
    throw apiError;
  }
}

/**
 * Submits a new withdrawal request, reserving active funds immediately.
 *
 * @param payload - Withdrawal payload with amount and destination bank details.
 * @returns Created payout request record.
 * @throws Standardized API error if the request fails.
 */
export async function CreateWithdrawalRequest(
  payload: CreateWithdrawalPayload,
): Promise<PayoutRequestRecord> {
  try {
    const response = await apiClient.post<ApiResponse<PayoutRequestRecord>>(
      '/wallet/withdraw',
      payload,
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal membuat permintaan penarikan saldo.');
    throw apiError;
  }
}

/**
 * Cancels a pending withdrawal request, refunding the reserved funds back to the brand wallet.
 *
 * @param withdrawalId - UUID of the payout request.
 * @returns Cancellation response data.
 * @throws Standardized API error if the request fails.
 */
export async function CancelWithdrawalRequest(
  withdrawalId: string,
): Promise<{ id: string }> {
  try {
    const response = await apiClient.delete<ApiResponse<{ id: string }>>(
      `/wallet/withdraw/${withdrawalId}`,
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal membatalkan permintaan penarikan saldo.');
    throw apiError;
  }
}

/**
 * Submits a cancellation request for a pending withdrawal to be reviewed by Klipday Admin.
 *
 * @param withdrawalId - UUID of the payout request.
 * @param payload - Optional reason for cancellation.
 * @returns Updated payout request record.
 * @throws Standardized API error if the request fails.
 */
export async function RequestWithdrawalCancellation(
  withdrawalId: string,
  payload?: RequestWithdrawalCancellationPayload,
): Promise<PayoutRequestRecord> {
  try {
    const response = await apiClient.post<ApiResponse<PayoutRequestRecord>>(
      `/wallet/withdraw/${withdrawalId}/request-cancel`,
      payload ?? {},
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal mengajukan pembatalan penarikan saldo.');
    throw apiError;
  }
}

/**
 * Simulates sandbox admin approval and disbursement of a pending withdrawal request.
 *
 * @param withdrawalId - UUID of the payout request.
 * @returns Simulation result with updated payout, wallet, and transaction ledger record.
 * @throws Standardized API error if the request fails.
 */
export async function SimulateWithdrawalApproval(
  withdrawalId: string,
): Promise<SimulateWithdrawalResult> {
  try {
    const response = await apiClient.post<ApiResponse<SimulateWithdrawalResult>>(
      `/wallet/withdraw/${withdrawalId}/approve`,
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal menyimulasikan persetujuan penarikan saldo.');
    throw apiError;
  }
}

