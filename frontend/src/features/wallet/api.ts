import { apiClient, ExtractApiError } from '@/lib/api-client';
import type {
  ApiResponse,
  BrandWalletSummary,
  CreateCreatorPayoutAccountPayload,
  CreateCreatorWithdrawalPayload,
  CreateTopUpPayload,
  CreateWithdrawalPayload,
  CreatorPayoutAccountRecord,
  CreatorTransactionQueryParams,
  CreatorWalletSummary,
  PaginatedCreatorTransactionsResponse,
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

// =============================================================================
// Creator Wallet API Functions
// =============================================================================

/**
 * Retrieves the creator wallet balance and aggregated metrics (active balance,
 * total earnings, total withdrawn, pending withdrawals).
 *
 * @returns Creator wallet summary with metrics.
 * @throws Standardized API error if the request fails.
 */
export async function GetCreatorWalletSummary(): Promise<CreatorWalletSummary> {
  try {
    const response = await apiClient.get<ApiResponse<CreatorWalletSummary>>(
      '/wallet/creator/summary',
    );
    const result = response.data.data;
    if (!result) {
      throw new Error('Respon ringkasan dompet kreator tidak valid.');
    }
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memuat ringkasan dompet kreator.');
    throw apiError;
  }
}

/**
 * Retrieves paginated transaction mutations for the authenticated creator,
 * enriched with campaign and video view details.
 *
 * @param params - Optional query filter parameters (type, page, limit, search).
 * @returns Paginated creator transaction records.
 * @throws Standardized API error if the request fails.
 */
export async function GetCreatorTransactions(
  params?: CreatorTransactionQueryParams,
): Promise<PaginatedCreatorTransactionsResponse> {
  try {
    const response = await apiClient.get<ApiResponse<PaginatedCreatorTransactionsResponse>>(
      '/wallet/creator/transactions',
      { params },
    );
    const result = response.data.data;
    if (!result) {
      throw new Error('Respon riwayat mutasi kreator tidak valid.');
    }
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memuat riwayat mutasi kreator.');
    throw apiError;
  }
}

/**
 * Retrieves all registered payout accounts (bank and e-wallet) for the authenticated creator.
 *
 * @returns List of creator payout account records.
 * @throws Standardized API error if the request fails.
 */
export async function GetCreatorPayoutAccounts(): Promise<CreatorPayoutAccountRecord[]> {
  try {
    const response = await apiClient.get<ApiResponse<CreatorPayoutAccountRecord[]>>(
      '/wallet/creator/payout-accounts',
    );
    const result = response.data.data;
    return result ?? [];
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memuat daftar rekening penarikan kreator.');
    throw apiError;
  }
}

/**
 * Registers a new bank account or e-wallet for creator withdrawals.
 *
 * @param payload - Payout account details including proof screenshot URL.
 * @returns Created payout account record.
 * @throws Standardized API error if the request fails.
 */
export async function CreateCreatorPayoutAccount(
  payload: CreateCreatorPayoutAccountPayload,
): Promise<CreatorPayoutAccountRecord> {
  try {
    const response = await apiClient.post<ApiResponse<CreatorPayoutAccountRecord>>(
      '/wallet/creator/payout-accounts',
      payload,
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal mendaftarkan akun penarikan.');
    throw apiError;
  }
}

/**
 * Streams passbook photo or e-wallet profile screenshot binary to cloud storage.
 *
 * @param file - Image file to upload.
 * @param onProgress - Optional upload progress callback.
 * @returns Public URL of uploaded proof image.
 * @throws Standardized API error if upload fails.
 */
export async function UploadCreatorPayoutProof(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  try {
    const response = await apiClient.post<ApiResponse<{ url: string }>>(
      '/wallet/creator/payout-accounts/proof',
      file,
      {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        },
      },
    );
    const result = response.data.data.url;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal mengunggah foto bukti akun penarikan.');
    throw apiError;
  }
}

/**
 * Sets a specific payout account as the primary default account for withdrawals.
 *
 * @param accountId - UUID of the payout account.
 * @returns Updated payout account record.
 * @throws Standardized API error if request fails.
 */
export async function SetPrimaryCreatorPayoutAccount(
  accountId: string,
): Promise<CreatorPayoutAccountRecord> {
  try {
    const response = await apiClient.patch<ApiResponse<CreatorPayoutAccountRecord>>(
      `/wallet/creator/payout-accounts/${accountId}/primary`,
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal menetapkan akun utama.');
    throw apiError;
  }
}

/**
 * Deletes / deactivates a payout account for the authenticated creator.
 *
 * @param accountId - UUID of the payout account.
 * @throws Standardized API error if deletion fails.
 */
export async function DeleteCreatorPayoutAccount(accountId: string): Promise<void> {
  try {
    await apiClient.delete<ApiResponse<null>>(
      `/wallet/creator/payout-accounts/${accountId}`,
    );
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal menghapus akun penarikan.');
    throw apiError;
  }
}

/**
 * Retrieves active pending withdrawal requests for the authenticated creator.
 *
 * @returns List of active payout request records.
 * @throws Standardized API error if the request fails.
 */
export async function GetActiveCreatorWithdrawals(): Promise<PayoutRequestRecord[]> {
  try {
    const response = await apiClient.get<ApiResponse<PayoutRequestRecord[]>>(
      '/wallet/creator/withdrawals/active',
    );
    const result = response.data.data;
    return result ?? [];
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memuat antrean penarikan aktif.');
    throw apiError;
  }
}

/**
 * Submits a new withdrawal request for the authenticated creator.
 *
 * @param payload - Withdrawal amount and destination payout account ID.
 * @returns Created payout request record.
 * @throws Standardized API error if request fails.
 */
export async function CreateCreatorWithdrawal(
  payload: CreateCreatorWithdrawalPayload,
): Promise<PayoutRequestRecord> {
  try {
    const response = await apiClient.post<ApiResponse<PayoutRequestRecord>>(
      '/wallet/creator/withdraw',
      payload,
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal mengajukan penarikan saldo.');
    throw apiError;
  }
}

/**
 * Requests cancellation of a pending withdrawal request for the creator.
 *
 * @param withdrawalId - UUID of the payout request.
 * @param reason - Optional cancellation reason.
 * @returns Updated payout request record.
 * @throws Standardized API error if request fails.
 */
export async function RequestCreatorWithdrawalCancellation(
  withdrawalId: string,
  reason?: string,
): Promise<PayoutRequestRecord> {
  try {
    const response = await apiClient.post<ApiResponse<PayoutRequestRecord>>(
      `/wallet/creator/withdraw/${withdrawalId}/request-cancel`,
      { reason },
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal mengajukan pembatalan penarikan.');
    throw apiError;
  }
}

/**
 * Simulates crediting campaign video views earnings to creator wallet for testing / QA.
 *
 * @param payload - Earning details (amount, optional campaignTitle, verifiedViews, cpmRate).
 * @returns Updated wallet balance.
 * @throws Standardized API error if simulation fails.
 */
export async function SimulateCreatorEarning(payload: {
  amount: number;
  campaignTitle?: string;
  verifiedViews?: number;
  cpmRate?: number;
}): Promise<{ balance: number }> {
  try {
    const response = await apiClient.post<ApiResponse<{ balance: number }>>(
      '/wallet/creator/simulate-earning',
      payload,
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal menyimulasikan perolehan saldo kreator.');
    throw apiError;
  }
}


