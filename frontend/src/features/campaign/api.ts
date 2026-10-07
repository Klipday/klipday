import { apiClient, ExtractApiError } from '@/lib/api-client';
import type {
  AdminVerifyPaymentPayload,
  ApiResponse,
  BankTransferPaymentPayload,
  Campaign,
  CampaignCardItem,
  CampaignEditInput,
  CampaignPaymentDetailsResponse,
  CampaignQueryParams,
  CampaignsPaginatedData,
  CampaignStatusCounts,
  InitializeCampaignResponse,
} from './types';

/**
 * Sends a POST request to `/campaigns` to initialize an empty draft campaign.
 *
 * @returns The initialized campaign data containing its ID.
 * @throws Standardized API error if the request fails.
 */
export async function InitializeCampaign(): Promise<InitializeCampaignResponse> {
  try {
    const response = await apiClient.post<ApiResponse<InitializeCampaignResponse>>('/campaigns');
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal membuat kampanye baru. Silakan coba lagi.');
    throw apiError;
  }
}

/**
 * Sends a GET request to `/campaigns/:id` to retrieve details of a specific campaign.
 *
 * @param id - The UUID of the campaign to retrieve.
 * @returns The campaign details.
 * @throws Error if id is missing or standardized API error if the request fails.
 */
export async function GetCampaignById(id?: string): Promise<Campaign> {
  if (!id) {
    throw new Error('Campaign ID is required.');
  }

  try {
    const response = await apiClient.get<ApiResponse<Campaign>>(`/campaigns/${id}`);
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memuat informasi kampanye. Silakan coba lagi.');
    throw apiError;
  }
}

/**
 * Sends a PATCH request to `/campaigns/:id/edit` to update specific fields of a campaign.
 *
 * @param id - The UUID of the campaign to edit.
 * @param data - The partial fields to update.
 * @returns The updated campaign details.
 * @throws Error if id is missing or standardized API error if the request fails.
 */
export async function EditCampaign(id: string, data: CampaignEditInput): Promise<Campaign> {
  if (!id) {
    throw new Error('Campaign ID is required.');
  }

  try {
    const response = await apiClient.patch<ApiResponse<Campaign>>(`/campaigns/${id}/edit`, data);
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal menyimpan perubahan kampanye. Silakan coba lagi.');
    throw apiError;
  }
}

/**
 * Sends a POST request to `/campaigns/:id/submit` to submit a campaign for admin review.
 *
 * @param id - The UUID of the campaign to submit.
 * @returns The updated campaign details with IN_REVIEW status.
 * @throws Error if id is missing or standardized API error if the request fails.
 */
export async function SubmitCampaign(id: string): Promise<Campaign> {
  if (!id) {
    throw new Error('Campaign ID is required.');
  }

  try {
    const response = await apiClient.post<ApiResponse<Campaign>>(`/campaigns/${id}/submit`);
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal mengajukan kampanye untuk review. Silakan coba lagi.');
    throw apiError;
  }
}

/**
 * Uploads a thumbnail image for a specific campaign using direct binary streaming.
 *
 * @param id - The UUID of the campaign.
 * @param file - The image File to stream to the backend.
 * @param onProgress - Optional callback notifying upload progress (0-100).
 * @returns The public URL of the uploaded thumbnail in Supabase Storage.
 * @throws Error if id is missing or standardized API error if upload fails.
 */
export async function UploadCampaignThumbnail(id: string, file: File, onProgress?: (percent: number) => void): Promise<string> {
  if (!id) {
    throw new Error('Campaign ID is required.');
  }

  try {
    const response = await apiClient.post<ApiResponse<{ url: string }>>(`/campaigns/${id}/thumbnail`, file, {
      headers: {
        'Content-Type': file.type,
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress?.(percent);
        }
      },
    });

    const publicUrl = response.data.data.url;
    return publicUrl;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal mengunggah gambar thumbnail. Silakan coba lagi.');
    throw apiError;
  }
}

/**
 * Sends a GET request to `/campaigns` to retrieve a paginated list of campaigns.
 * For authenticated brand accounts, the backend automatically scopes results to campaigns owned by the brand.
 *
 * @param query - Optional query filters (pagination, search, status, etc.).
 * @returns Paginated campaign data containing items and metadata.
 * @throws Standardized API error if the request fails.
 */
export async function GetCampaigns(query?: CampaignQueryParams): Promise<CampaignsPaginatedData> {
  try {
    const response = await apiClient.get<ApiResponse<CampaignsPaginatedData>>('/campaigns', {
      params: query,
    });
    
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memuat daftar kampanye. Silakan coba lagi.');
    throw apiError;
  }
}

/**
 * Sends a DELETE request to `/campaigns/:id` to soft-delete a campaign and cascade
 * soft-deletion to its materials, brief, and submissions.
 *
 * @param id - The UUID of the campaign to delete.
 * @returns A promise that resolves when the deletion is completed.
 * @throws Error if id is missing or standardized API error if the request fails.
 */
export async function DeleteCampaign(id?: string): Promise<void> {
  if (!id) {
    throw new Error('Campaign ID is required.');
  }

  try {
    await apiClient.delete<ApiResponse<null>>(`/campaigns/${id}`);
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal menghapus kampanye. Silakan coba lagi.');
    throw apiError;
  }
}

/**
 * Sends a GET request to `/campaigns/counts` to retrieve campaign counts grouped by lifecycle status.
 *
 * @returns The aggregated campaign status counts.
 * @throws Standardized API error if the request fails.
 */
export async function GetCampaignStatusCounts(): Promise<CampaignStatusCounts> {
  try {
    const response = await apiClient.get<ApiResponse<CampaignStatusCounts>>('/campaigns/counts');
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memuat jumlah status kampanye. Silakan coba lagi.');
    throw apiError;
  }
}

/**
 * Sends a GET request to `/campaigns/featured` to retrieve 3-5 featured campaigns for the hero carousel.
 *
 * @returns The array of featured campaign items.
 * @throws Standardized API error if the request fails.
 */
export async function GetFeaturedCampaigns(): Promise<CampaignCardItem[]> {
  try {
    const response = await apiClient.get<ApiResponse<CampaignCardItem[]>>('/campaigns/featured');
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memuat kampanye unggulan. Silakan coba lagi.');
    throw apiError;
  }
}

/**
 * Sends a GET request to `/campaigns/:id/payment` to retrieve campaign payment details,
 * destination bank snapshot, and brand wallet balance.
 *
 * @param id - The UUID of the campaign.
 * @returns The campaign payment details response.
 * @throws Error if id is missing or standardized API error if request fails.
 */
export async function GetCampaignPaymentDetails(id?: string): Promise<CampaignPaymentDetailsResponse> {
  if (!id) {
    throw new Error('Campaign ID is required.');
  }

  try {
    const response = await apiClient.get<ApiResponse<CampaignPaymentDetailsResponse>>(`/campaigns/${id}/payment`);
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memuat rincian pembayaran kampanye. Silakan coba lagi.');
    throw apiError;
  }
}

/**
 * Sends a POST request to `/campaigns/:id/payment/wallet` to pay campaign budget via brand wallet.
 *
 * @param id - The UUID of the campaign.
 * @returns The updated campaign entity.
 * @throws Error if id is missing or standardized API error if request fails.
 */
export async function PayCampaignWithWallet(id: string): Promise<Campaign> {
  if (!id) {
    throw new Error('Campaign ID is required.');
  }

  try {
    const response = await apiClient.post<ApiResponse<Campaign>>(`/campaigns/${id}/payment/wallet`);
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal melakukan pembayaran menggunakan saldo dompet. Silakan coba lagi.');
    throw apiError;
  }
}

/**
 * Streams payment receipt image directly to Supabase Storage.
 *
 * @param id - The UUID of the campaign.
 * @param file - The image receipt File to upload.
 * @param onProgress - Optional callback notifying upload progress (0-100).
 * @returns The public URL of the uploaded transfer receipt.
 * @throws Error if id is missing or standardized API error if upload fails.
 */
export async function UploadPaymentProof(id: string, file: File, onProgress?: (percent: number) => void): Promise<string> {
  if (!id) {
    throw new Error('Campaign ID is required.');
  }

  try {
    const response = await apiClient.post<ApiResponse<{ url: string }>>(`/campaigns/${id}/payment/proof`, file, {
      headers: {
        'Content-Type': file.type,
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress?.(percent);
        }
      },
    });

    const publicUrl = response.data.data.url;
    return publicUrl;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal mengunggah bukti pembayaran. Silakan coba lagi.');
    throw apiError;
  }
}

/**
 * Sends a POST request to `/campaigns/:id/payment/confirm` to confirm manual bank transfer details.
 *
 * @param id - The UUID of the campaign.
 * @param data - The bank transfer sender information and receipt URL.
 * @returns The updated campaign entity.
 * @throws Error if id is missing or standardized API error if request fails.
 */
export async function ConfirmBankTransferPayment(id: string, data: BankTransferPaymentPayload): Promise<Campaign> {
  if (!id) {
    throw new Error('Campaign ID is required.');
  }

  try {
    const response = await apiClient.post<ApiResponse<Campaign>>(`/campaigns/${id}/payment/confirm`, data);
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal mengonfirmasi transfer pembayaran. Silakan coba lagi.');
    throw apiError;
  }
}

/**
 * Sends a POST request to `/campaigns/:id/payment/verify` for Admin to approve or reject payment.
 *
 * @param id - The UUID of the campaign.
 * @param data - Action payload (APPROVE or REJECT with rejectionReason).
 * @returns The updated campaign entity.
 * @throws Error if id is missing or standardized API error if request fails.
 */
export async function VerifyCampaignPayment(id: string, data: AdminVerifyPaymentPayload): Promise<Campaign> {
  if (!id) {
    throw new Error('Campaign ID is required.');
  }

  try {
    const response = await apiClient.post<ApiResponse<Campaign>>(`/campaigns/${id}/payment/verify`, data);
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memverifikasi pembayaran kampanye. Silakan coba lagi.');
    throw apiError;
  }
}


