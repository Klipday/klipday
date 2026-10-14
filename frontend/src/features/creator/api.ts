import { apiClient, ExtractApiError } from '@/lib/api-client';
import { CREATOR_UI_MESSAGES } from './constants';
import type { ApiResponse, CreatorProfile, UpdateCreatorProfilePayload } from './types';

/**
 * Retrieves the full profile information for the authenticated creator.
 *
 * @returns Creator profile record including linked TikTok account.
 * @throws Standardized API error if the request fails.
 */
export async function GetCreatorProfile(): Promise<CreatorProfile> {
  try {
    const response = await apiClient.get<ApiResponse<CreatorProfile>>('/creator/profile');
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, CREATOR_UI_MESSAGES.PROFILE_FETCH_ERROR);
    throw apiError;
  }
}

/**
 * Updates creator personal information, date of birth, location, bio, and niche categories.
 *
 * @param payload - Updated creator profile data.
 * @returns Updated creator profile record.
 * @throws Standardized API error if the request fails.
 */
export async function UpdateCreatorProfile(
  payload: UpdateCreatorProfilePayload,
): Promise<CreatorProfile> {
  try {
    const response = await apiClient.patch<ApiResponse<CreatorProfile>>(
      '/creator/profile',
      payload,
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    const apiError = ExtractApiError(error, CREATOR_UI_MESSAGES.PROFILE_UPDATE_ERROR);
    throw apiError;
  }
}

/**
 * Streams the creator's custom profile avatar file directly to the backend storage endpoint.
 *
 * @param file - Image file to upload.
 * @param onProgress - Optional callback tracking upload progress percentage.
 * @returns Public URL of the uploaded avatar.
 * @throws Standardized API error if the request fails.
 */
export async function UploadCreatorAvatar(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  try {
    const response = await apiClient.post<ApiResponse<{ url: string }>>(
      '/creator/profile/avatar',
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
    const apiError = ExtractApiError(error, CREATOR_UI_MESSAGES.AVATAR_UPLOAD_ERROR);
    throw apiError;
  }
}
