import { apiClient, ExtractApiError } from '@/lib/api-client';
import type { ApiResponse } from '../campaign/types';
import type {
  CampaignSubmissionReviewItem,
  CampaignSubmissionsPaginatedResponse,
  CampaignSubmissionsQueryParams,
  CreatorSocialAccount,
  CreatorSubmissionsPaginatedResponse,
  CreatorSubmissionsQueryParams,
  FinalSubmitVideoInput,
  MySubmissionData,
  RequestVerificationCodeInput,
  RequestVerificationCodeResponse,
  SaveDraftSubmissionInput,
  SocialPlatform,
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
    const response = await apiClient.get<ApiResponse<MySubmissionData>>(`/campaigns/${campaignId}/my-submission`);
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
export async function SaveDraftSubmission(campaignId: string, input: SaveDraftSubmissionInput): Promise<Submission> {
  try {
    const response = await apiClient.patch<ApiResponse<Submission>>(`/campaigns/${campaignId}/submission/draft`, input);
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
export async function FinalSubmitVideo(campaignId: string, input: FinalSubmitVideoInput): Promise<Submission> {
  try {
    const response = await apiClient.post<ApiResponse<Submission>>(`/campaigns/${campaignId}/submission/submit`, input);
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal mengirim pengajuan video.');
    throw apiError;
  }
}

/**
 * Sends a GET request to `/social-accounts/connected` to retrieve the creator's verified social account
 * for a specific platform (defaults to TIKTOK).
 *
 * @param platform - Optional target social platform.
 * @returns Verified account record or null if not yet verified.
 */
export async function GetConnectedSocialAccount(platform?: SocialPlatform): Promise<CreatorSocialAccount | null> {
  try {
    const url = platform
      ? `/social-accounts/connected?platform=${encodeURIComponent(platform)}`
      : '/social-accounts/connected';
    const response = await apiClient.get<ApiResponse<CreatorSocialAccount | null>>(url);
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memuat informasi akun media sosial.');
    throw apiError;
  }
}

/**
 * Sends a GET request to `/social-accounts/connected/all` to retrieve all verified social accounts
 * (TikTok, Instagram, YouTube) connected by the creator.
 *
 * @returns Array of verified social accounts across all platforms.
 */
export async function GetAllConnectedSocialAccounts(): Promise<CreatorSocialAccount[]> {
  try {
    const response = await apiClient.get<ApiResponse<CreatorSocialAccount[]>>('/social-accounts/connected/all');
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memuat daftar akun media sosial.');
    throw apiError;
  }
}

/**
 * Sends a POST request to `/social-accounts/:platform/request-code` to generate a bio verification token.
 *
 * @param input - Social username and target platform.
 * @returns Verification code and expiry timestamp.
 */
export async function RequestTikTokVerificationCode(input: RequestVerificationCodeInput): Promise<RequestVerificationCodeResponse> {
  try {
    const platformSlug = (input.platform ?? 'TIKTOK').toLowerCase();
    const response = await apiClient.post<ApiResponse<RequestVerificationCodeResponse>>(
      `/social-accounts/${platformSlug}/request-code`,
      { username: input.username },
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal meminta kode verifikasi.');
    throw apiError;
  }
}

/**
 * Sends a POST request to `/social-accounts/:platform/verify` to confirm bio verification code.
 *
 * @param input - Social username and target platform.
 * @returns Verified social account details.
 */
export async function VerifyTikTokBio(input: VerifyBioInput): Promise<CreatorSocialAccount> {
  try {
    const platformSlug = (input.platform ?? 'TIKTOK').toLowerCase();
    const response = await apiClient.post<ApiResponse<CreatorSocialAccount>>(
      `/social-accounts/${platformSlug}/verify`,
      { username: input.username },
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memverifikasi bio akun media sosial.');
    throw apiError;
  }
}

/**
 * Sends a GET request to `/social-accounts/:platform/recent-videos` to fetch recent public videos/reels/shorts.
 *
 * @param username - Optional username handle to filter by.
 * @param platform - Target social platform (defaults to TIKTOK).
 * @returns Array of recent video items.
 */
export async function GetRecentTikTokVideos(
  username?: string,
  platform: SocialPlatform = 'TIKTOK',
): Promise<SocialVideoItem[]> {
  try {
    const platformSlug = platform.toLowerCase();
    const url = username
      ? `/social-accounts/${platformSlug}/recent-videos?username=${encodeURIComponent(username.replace(/^@/, ''))}`
      : `/social-accounts/${platformSlug}/recent-videos`;
    const response = await apiClient.get<ApiResponse<SocialVideoItem[]>>(url);
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memuat galeri video terbaru.');
    throw apiError;
  }
}

/**
 * Sends a POST request to `/social-accounts/:platform/validate-video-url` to check a direct video link.
 *
 * @param input - Public video URL and target platform.
 * @returns Extracted video metadata.
 */
export async function ValidateTikTokVideoUrl(input: ValidateVideoUrlInput): Promise<SocialVideoItem> {
  try {
    const platformSlug = (input.platform ?? 'TIKTOK').toLowerCase();
    const response = await apiClient.post<ApiResponse<SocialVideoItem>>(
      `/social-accounts/${platformSlug}/validate-video-url`,
      { videoUrl: input.videoUrl },
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Tautan video tidak valid atau tidak cocok.');
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
  params?: CampaignSubmissionsQueryParams
): Promise<CampaignSubmissionsPaginatedResponse> {
  try {
    const response = await apiClient.get<ApiResponse<CampaignSubmissionsPaginatedResponse>>(`/campaigns/${campaignId}/submissions`, {
      params,
    });
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memuat daftar pengajuan klip.');
    throw apiError;
  }
}

/**
 * Sends a POST request to `/submissions/:id/accept` to approve a video submission.
 *
 * @param submissionId - Target submission UUID.
 * @returns Updated submission review item with APPROVED status.
 */
export async function AcceptSubmission(submissionId: string): Promise<CampaignSubmissionReviewItem> {
  try {
    const response = await apiClient.post<ApiResponse<CampaignSubmissionReviewItem>>(`/submissions/${submissionId}/accept`);
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal menyetujui pengajuan video.');
    throw apiError;
  }
}

/**
 * Sends a POST request to `/submissions/:id/reject` to reject a video submission.
 *
 * @param submissionId - Target submission UUID.
 * @param reviewNote - Optional reason or note for rejection.
 * @returns Updated submission review item with REJECTED status.
 */
export async function RejectSubmission(submissionId: string, reviewNote?: string): Promise<CampaignSubmissionReviewItem> {
  try {
    const payload = reviewNote?.trim() ? { reviewNote: reviewNote.trim() } : {};
    const response = await apiClient.post<ApiResponse<CampaignSubmissionReviewItem>>(`/submissions/${submissionId}/reject`, payload);
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal menolak pengajuan video.');
    throw apiError;
  }
}

/**
 * Sends a POST request to `/submissions/:id/revision` to request video revision from creator.
 *
 * @param submissionId - Target submission UUID.
 * @param reviewNote - Mandatory instructions explaining needed revisions.
 * @returns Updated submission review item with REVISION_REQUESTED status.
 */
export async function RequestSubmissionRevision(submissionId: string, reviewNote: string): Promise<CampaignSubmissionReviewItem> {
  try {
    const response = await apiClient.post<ApiResponse<CampaignSubmissionReviewItem>>(`/submissions/${submissionId}/revision`, {
      reviewNote: reviewNote.trim(),
    });
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal meminta revisi video.');
    throw apiError;
  }
}

/**
 * Sends a GET request to `/submissions/my` to retrieve the creator's submitted campaign videos.
 *
 * @param params - Optional query parameters for pagination, status filter, search, and sort.
 * @returns Paginated list of creator submissions and status counts.
 */
export async function GetMySubmissions(params?: CreatorSubmissionsQueryParams): Promise<CreatorSubmissionsPaginatedResponse> {
  try {
    const response = await apiClient.get<ApiResponse<CreatorSubmissionsPaginatedResponse>>('/submissions/my', {
      params,
    });
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, 'Gagal memuat daftar submisi video kamu.');
    throw apiError;
  }
}

