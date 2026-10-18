import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CreateBrandPayoutAccount,
  DeleteBrandPayoutAccount,
  GetBrandPayoutAccounts,
  GetBrandProfile,
  SetPrimaryBrandPayoutAccount,
  UpdateBrandProfile,
  UploadBrandLogo,
  UploadBrandPayoutProof,
} from '../api';
import type {
  BrandPayoutAccount,
  BrandProfile,
  CreateBrandPayoutAccountPayload,
  UpdateBrandProfilePayload,
} from '../types';

export const BRAND_QUERY_KEYS = {
  PROFILE: ['brand-profile'] as const,
  PAYOUT_ACCOUNTS: ['brand-payout-accounts'] as const,
};

/**
 * Hook to retrieve profile details for the authenticated brand.
 *
 * @returns Query result containing the brand profile.
 */
export function UseBrandProfileQuery() {
  return useQuery<BrandProfile, Error>({
    queryKey: BRAND_QUERY_KEYS.PROFILE,
    queryFn: GetBrandProfile,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to update brand profile information.
 *
 * @returns Mutation hook for updating brand profile.
 */
export function UseUpdateBrandProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation<BrandProfile, Error, UpdateBrandProfilePayload>({
    mutationFn: (payload) => UpdateBrandProfile(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(BRAND_QUERY_KEYS.PROFILE, data);
      queryClient.invalidateQueries({ queryKey: BRAND_QUERY_KEYS.PROFILE });
      queryClient.invalidateQueries({ queryKey: ['current-account'] });
      toast.success('Profil brand berhasil diperbarui.');
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal memperbarui profil brand.');
    },
  });
}

/**
 * Hook to upload and update brand logo image.
 *
 * @returns Mutation hook for streaming brand logo.
 */
export function UseUploadBrandLogoMutation() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, { file: File; onProgress?: (percent: number) => void }>({
    mutationFn: ({ file, onProgress }) => UploadBrandLogo(file, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRAND_QUERY_KEYS.PROFILE });
      queryClient.invalidateQueries({ queryKey: ['current-account'] });
      toast.success('Logo brand berhasil diperbarui.');
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal mengunggah logo brand.');
    },
  });
}

/**
 * Hook to retrieve registered payout accounts for the brand wallet.
 *
 * @param options - Optional query options such as enabled flag.
 * @returns Query result with list of registered payout accounts.
 */
export function UseBrandPayoutAccountsQuery(options?: { enabled?: boolean }) {
  return useQuery<BrandPayoutAccount[], Error>({
    queryKey: BRAND_QUERY_KEYS.PAYOUT_ACCOUNTS,
    queryFn: GetBrandPayoutAccounts,
    staleTime: 60 * 1000,
    enabled: options?.enabled,
  });
}

/**
 * Hook to upload KYC proof photo for payout account registration.
 *
 * @returns Mutation hook for uploading payout account proof.
 */
export function UseUploadBrandPayoutProofMutation() {
  return useMutation<string, Error, { file: File; onProgress?: (percent: number) => void }>({
    mutationFn: ({ file, onProgress }) => UploadBrandPayoutProof(file, onProgress),
    onError: (error) => {
      toast.error(error.message || 'Gagal mengunggah bukti kepemilikan rekening.');
    },
  });
}

/**
 * Hook to register a new payout account for verification.
 *
 * @returns Mutation hook for registering a payout account.
 */
export function UseCreateBrandPayoutAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation<BrandPayoutAccount, Error, CreateBrandPayoutAccountPayload>({
    mutationFn: (payload) => CreateBrandPayoutAccount(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRAND_QUERY_KEYS.PAYOUT_ACCOUNTS });
      toast.success('Akun penarikan berhasil didaftarkan dan menunggu verifikasi.');
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal mendaftarkan akun penarikan.');
    },
  });
}

/**
 * Hook to set a payout account as the primary account.
 *
 * @returns Mutation hook for setting primary payout account.
 */
export function UseSetPrimaryBrandPayoutAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation<BrandPayoutAccount, Error, string>({
    mutationFn: (id) => SetPrimaryBrandPayoutAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRAND_QUERY_KEYS.PAYOUT_ACCOUNTS });
      toast.success('Akun utama penarikan berhasil diubah.');
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal mengubah akun utama.');
    },
  });
}

/**
 * Hook to delete a payout account or cancel a pending verification submission.
 *
 * @returns Mutation hook for deleting payout account.
 */
export function UseDeleteBrandPayoutAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation<{ id: string }, Error, { id: string; isPendingCancel?: boolean }>({
    mutationFn: ({ id, isPendingCancel }) => DeleteBrandPayoutAccount(id, isPendingCancel),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: BRAND_QUERY_KEYS.PAYOUT_ACCOUNTS });
      if (variables.isPendingCancel) {
        toast.success('Pengajuan verifikasi rekening berhasil dibatalkan.');
      } else {
        toast.success('Akun penarikan berhasil dihapus.');
      }
    },
    onError: (error) => {
      // Invalidate queries so that if backend rejected due to 409 (already verified), UI auto-refetches immediately!
      queryClient.invalidateQueries({ queryKey: BRAND_QUERY_KEYS.PAYOUT_ACCOUNTS });
      toast.error(error.message || 'Gagal memproses penghapusan akun penarikan.');
    },
  });
}
