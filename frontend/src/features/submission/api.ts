import { apiClient, ExtractApiError } from '@/lib/api-client';
import type { ApiResponse } from '../campaign/types';
import type {
  CampaignSubmissionsPaginatedResponse,
  CampaignSubmissionsQueryParams,
  CreatorSocialAccount,
  FinalSubmitVideoInput,
  MySubmissionData,
  RequestVerificationCodeInput,
  RequestVerificationCodeResponse,
  SaveDraftSubmissionInput,
  SocialVideoItem,
  Submission,
  ValidateVideoUrlInput,
  VerifyBioInput,
} from './types';

/**
 * Sends a POST request to `/campaigns/:id/join` to register the creator for the campaign.
 *
 * @param campaignId - Target campaign UUID.
 * @returns Initial submission row with status JOINED.
 */
export async function JoinCampaign(campaignId: string): Promise<Submission> {
  try {
    const response = await apiClient.post<ApiResponse<Submission>>(`/campaigns/${campaignId}/join`);
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal bergabung dengan kampanye. Silakan coba lagi.');
    throw apiError;
  }
}

/**
 * Sends a GET request to `/campaigns/:id/my-submission` to retrieve current submission progress.
 *
 * @param campaignId - Target campaign UUID.
 * @returns The creator's submission and connected TikTok account data.
 */
export async function GetMyCampaignSubmission(campaignId: string): Promise<MySubmissionData> {
  try {
    const response = await apiClient.get<ApiResponse<MySubmissionData>>(
      `/campaigns/${campaignId}/my-submission`,
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memuat status pendaftaran kampanye.');
    throw apiError;
  }
}

/**
 * Sends a PATCH request to `/campaigns/:id/submission/draft` to autosave video details.
 *
 * @param campaignId - Target campaign UUID.
 * @param input - Video draft details.
 * @returns Updated submission row.
 */
export async function SaveDraftSubmission(
  campaignId: string,
  input: SaveDraftSubmissionInput,
): Promise<Submission> {
  try {
    const response = await apiClient.patch<ApiResponse<Submission>>(
      `/campaigns/${campaignId}/submission/draft`,
      input,
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal menyimpan draf pengajuan video.');
    throw apiError;
  }
}

/**
 * Sends a POST request to `/campaigns/:id/submission/submit` to finalize video submission.
 *
 * @param campaignId - Target campaign UUID.
 * @param input - Final video parameters.
 * @returns Finalized submission with status PENDING_REVIEW.
 */
export async function FinalSubmitVideo(
  campaignId: string,
  input: FinalSubmitVideoInput,
): Promise<Submission> {
  try {
    const response = await apiClient.post<ApiResponse<Submission>>(
      `/campaigns/${campaignId}/submission/submit`,
      input,
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal mengirim pengajuan video.');
    throw apiError;
  }
}

/**
 * Sends a GET request to `/social-accounts/connected` to retrieve the creator's verified TikTok account.
 *
 * @returns Verified account record or null if not yet verified.
 */
export async function GetConnectedSocialAccount(): Promise<CreatorSocialAccount | null> {
  try {
    const response = await apiClient.get<ApiResponse<CreatorSocialAccount | null>>(
      '/social-accounts/connected',
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memuat informasi akun media sosial.');
    throw apiError;
  }
}

/**
 * Sends a POST request to `/social-accounts/tiktok/request-code` to generate a bio verification token.
 *
 * @param input - TikTok username.
 * @returns Verification code and expiry timestamp.
 */
export async function RequestTikTokVerificationCode(
  input: RequestVerificationCodeInput,
): Promise<RequestVerificationCodeResponse> {
  try {
    const response = await apiClient.post<ApiResponse<RequestVerificationCodeResponse>>(
      '/social-accounts/tiktok/request-code',
      input,
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal meminta kode verifikasi.');
    throw apiError;
  }
}

/**
 * Sends a POST request to `/social-accounts/tiktok/verify` to confirm bio verification code.
 *
 * @param input - TikTok username.
 * @returns Verified social account details.
 */
export async function VerifyTikTokBio(input: VerifyBioInput): Promise<CreatorSocialAccount> {
  try {
    const response = await apiClient.post<ApiResponse<CreatorSocialAccount>>(
      '/social-accounts/tiktok/verify',
      input,
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memverifikasi bio TikTok.');
    throw apiError;
  }
}

/**
 * Sends a GET request to `/social-accounts/tiktok/recent-videos` to fetch recent public videos.
 *
 * @param username - Optional TikTok username handle to filter by.
 * @returns Array of recent video items.
 */
export async function GetRecentTikTokVideos(username?: string): Promise<SocialVideoItem[]> {
  try {
    const url = username
      ? `/social-accounts/tiktok/recent-videos?username=${encodeURIComponent(username.replace(/^@/, ''))}`
      : '/social-accounts/tiktok/recent-videos';
    const response = await apiClient.get<ApiResponse<SocialVideoItem[]>>(url);
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memuat galeri video TikTok terbaru.');
    throw apiError;
  }
}

/**
 * Sends a POST request to `/social-accounts/tiktok/validate-video-url` to check a direct TikTok video link.
 *
 * @param input - Public video URL.
 * @returns Extracted video metadata.
 */
export async function ValidateTikTokVideoUrl(
  input: ValidateVideoUrlInput,
): Promise<SocialVideoItem> {
  try {
    const response = await apiClient.post<ApiResponse<SocialVideoItem>>(
      '/social-accounts/tiktok/validate-video-url',
      input,
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Tautan video TikTok tidak valid atau tidak cocok.');
    throw apiError;
  }
}

/**
 * Retrieves paginated, filtered, and sorted campaign submissions for brand/admin review.
 *
 * @param campaignId - Target campaign UUID.
 * @param params - Optional query filter and pagination parameters.
 * @returns Paginated campaign submissions review data.
 */
export async function GetCampaignSubmissions(
  campaignId: string,
  params?: CampaignSubmissionsQueryParams,
): Promise<CampaignSubmissionsPaginatedResponse> {
  try {
    const response = await apiClient.get<ApiResponse<CampaignSubmissionsPaginatedResponse>>(
      `/campaigns/${campaignId}/submissions`,
      { params },
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memuat daftar pengajuan klip.');
    throw apiError;
  }
}
