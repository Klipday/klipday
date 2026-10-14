import { apiClient, ExtractApiError } from '@/lib/api-client';
import type {
  ApiResponse,
  BrandPayoutAccount,
  BrandProfile,
  CreateBrandPayoutAccountPayload,
  UpdateBrandProfilePayload,
} from './types';

/**
 * Retrieves the profile information for the authenticated brand.
 *
 * @returns Brand profile details.
 * @throws Standardized API error if the request fails.
 */
export async function GetBrandProfile(): Promise<BrandProfile> {
  try {
    const response = await apiClient.get<ApiResponse<BrandProfile>>('/brand/profile');
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memuat profil brand.');
    throw apiError;
  }
}

/**
 * Updates basic brand information, website, social handles, and location.
 *
 * @param payload - Updated brand profile data.
 * @returns Updated brand profile details.
 * @throws Standardized API error if the request fails.
 */
export async function UpdateBrandProfile(
  payload: UpdateBrandProfilePayload,
): Promise<BrandProfile> {
  try {
    const response = await apiClient.patch<ApiResponse<BrandProfile>>(
      '/brand/profile',
      payload,
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memperbarui profil brand.');
    throw apiError;
  }
}

/**
 * Streams the brand logo image file directly to the backend storage endpoint.
 *
 * @param file - Image file to upload.
 * @param onProgress - Optional callback tracking upload progress percentage.
 * @returns Public URL of the uploaded logo.
 * @throws Standardized API error if the request fails.
 */
export async function UploadBrandLogo(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  try {
    const response = await apiClient.post<ApiResponse<{ url: string }>>(
      '/brand/profile/logo',
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
    const apiError = ExtractApiError(error, 'Gagal mengunggah logo brand.');
    throw apiError;
  }
}

/**
 * Streams the payout account verification proof photo directly to the storage endpoint.
 *
 * @param file - Image file to upload.
 * @param onProgress - Optional callback tracking upload progress percentage.
 * @returns Public URL of the uploaded proof.
 * @throws Standardized API error if the request fails.
 */
export async function UploadBrandPayoutProof(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  try {
    const response = await apiClient.post<ApiResponse<{ url: string }>>(
      '/brand/payout-accounts/proof',
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
    const apiError = ExtractApiError(error, 'Gagal mengunggah bukti kepemilikan rekening.');
    throw apiError;
  }
}

/**
 * Retrieves the list of payout accounts registered for the brand wallet.
 *
 * @returns Array of registered payout accounts.
 * @throws Standardized API error if the request fails.
 */
export async function GetBrandPayoutAccounts(): Promise<BrandPayoutAccount[]> {
  try {
    const response = await apiClient.get<ApiResponse<BrandPayoutAccount[]>>(
      '/brand/payout-accounts',
    );
    const result = response.data.data;
    return result ?? [];
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memuat akun penarikan brand.');
    throw apiError;
  }
}

/**
 * Registers a new bank or e-wallet payout account for verification.
 *
 * @param payload - Payout account details and proof URL.
 * @returns Created payout account record.
 * @throws Standardized API error if the request fails.
 */
export async function CreateBrandPayoutAccount(
  payload: CreateBrandPayoutAccountPayload,
): Promise<BrandPayoutAccount> {
  try {
    const response = await apiClient.post<ApiResponse<BrandPayoutAccount>>(
      '/brand/payout-accounts',
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
 * Updates a payout account to be the primary destination for withdrawals.
 *
 * @param accountId - UUID of the target payout account.
 * @returns Updated payout account record.
 * @throws Standardized API error if the request fails.
 */
export async function SetPrimaryBrandPayoutAccount(
  accountId: string,
): Promise<BrandPayoutAccount> {
  try {
    const response = await apiClient.patch<ApiResponse<BrandPayoutAccount>>(
      `/brand/payout-accounts/${accountId}/primary`,
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal mengubah akun utama.');
    throw apiError;
  }
}

/**
 * Soft-deletes or cancels verification for a payout account.
 *
 * @param accountId - UUID of the target payout account.
 * @param isPendingCancel - Whether the cancellation is specifically for a pending verification request.
 * @returns Deleted account ID payload.
 * @throws Standardized API error if the request fails.
 */
export async function DeleteBrandPayoutAccount(
  accountId: string,
  isPendingCancel = false,
): Promise<{ id: string }> {
  try {
    const url = isPendingCancel
      ? `/brand/payout-accounts/${accountId}?intent=cancel_pending`
      : `/brand/payout-accounts/${accountId}`;
    const response = await apiClient.delete<ApiResponse<{ id: string }>>(url);
    const result = response.data.data;
    return result;
  } catch (error) {
    const defaultMessage = isPendingCancel
      ? 'Gagal membatalkan pengajuan akun.'
      : 'Gagal menghapus akun penarikan.';
    const apiError = ExtractApiError(error, defaultMessage);
    throw apiError;
  }
}
