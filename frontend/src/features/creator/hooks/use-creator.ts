import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  GetCreatorProfile,
  UpdateCreatorProfile,
  UploadCreatorAvatar,
} from '../api';
import { CREATOR_QUERY_KEYS, CREATOR_UI_MESSAGES } from '../constants';
import type { CreatorProfile, UpdateCreatorProfilePayload } from '../types';

/**
 * Hook to retrieve profile details for the authenticated creator.
 *
 * @returns Query result containing the creator profile.
 */
export function UseCreatorProfileQuery() {
  return useQuery<CreatorProfile, Error>({
    queryKey: CREATOR_QUERY_KEYS.PROFILE,
    queryFn: GetCreatorProfile,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to update creator profile information.
 *
 * @returns Mutation hook for updating creator profile.
 */
export function UseUpdateCreatorProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation<CreatorProfile, Error, UpdateCreatorProfilePayload>({
    mutationFn: (payload) => UpdateCreatorProfile(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(CREATOR_QUERY_KEYS.PROFILE, data);
      queryClient.invalidateQueries({ queryKey: CREATOR_QUERY_KEYS.PROFILE });
      queryClient.invalidateQueries({ queryKey: ['current-account'] });
      toast.success(CREATOR_UI_MESSAGES.PROFILE_UPDATE_SUCCESS);
    },
    onError: (error) => {
      toast.error(error.message || CREATOR_UI_MESSAGES.PROFILE_UPDATE_ERROR);
    },
  });
}

/**
 * Hook to stream upload creator avatar image.
 *
 * @returns Mutation hook for uploading profile picture.
 */
export function UseUploadCreatorAvatarMutation() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, { file: File; onProgress?: (percent: number) => void }>({
    mutationFn: ({ file, onProgress }) => UploadCreatorAvatar(file, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CREATOR_QUERY_KEYS.PROFILE });
      queryClient.invalidateQueries({ queryKey: ['current-account'] });
      toast.success(CREATOR_UI_MESSAGES.AVATAR_UPLOAD_SUCCESS);
    },
    onError: (error) => {
      toast.error(error.message || CREATOR_UI_MESSAGES.AVATAR_UPLOAD_ERROR);
    },
  });
}
