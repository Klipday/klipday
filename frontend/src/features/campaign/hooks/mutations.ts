import { useMutation, useQueryClient, type UseMutationOptions, type UseMutationResult } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  ConfirmBankTransferPayment,
  DeleteCampaign,
  EditCampaign,
  GetCampaignById,
  InitializeCampaign,
  PayCampaignWithWallet,
  SubmitCampaign,
  VerifyCampaignPayment,
} from '../api';
import type {
  AdminVerifyPaymentPayload,
  BankTransferPaymentPayload,
  Campaign,
  CampaignEditInput,
  InitializeCampaignResponse,
} from '../types';
import { ResolveCampaignWizardStepPath } from '../utils';

export type InitializeCampaignMutationOptions = Omit<UseMutationOptions<InitializeCampaignResponse, Error, void>, 'mutationFn'>;

export type EditCampaignMutationOptions = Omit<UseMutationOptions<Campaign, Error, CampaignEditInput>, 'mutationFn'> & {
  successMessage?: string;
};

/**
 * Mutation hook for initiating a new draft campaign.
 * Calls `POST /campaigns`, shows a success toast, retrieves campaign details via
 * `GET /campaigns/:id`, and navigates to the appropriate wizard step based on campaign data.
 *
 * @param options - Optional mutation options to extend default behavior.
 * @returns TanStack Query mutation object for initializing a campaign.
 */
export function UseInitializeCampaignMutation(
  options?: InitializeCampaignMutationOptions
): UseMutationResult<InitializeCampaignResponse, Error, void> {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { onSuccess, onError, ...restOptions } = options ?? {};

  const mutation = useMutation({
    ...restOptions,
    mutationFn: InitializeCampaign,
    onSuccess: async (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-counts'] });
      toast.success('Campaign created successfully');

      try {
        const campaign = await GetCampaignById(data.id);

        queryClient.setQueryData(['campaign', data.id], campaign);
        const targetPath = ResolveCampaignWizardStepPath(campaign);

        navigate(targetPath, {
          state: { campaignId: data.id },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Gagal memuat detail kampanye.';
        toast.error(message);
      }

      onSuccess?.(data, variables, onMutateResult, context);
    },

    onError: (error, variables, onMutateResult, context) => {
      toast.error(error.message);
      onError?.(error, variables, onMutateResult, context);
    },
  });

  return mutation;
}

/**
 * Mutation hook for editing an existing campaign.
 * Calls `PATCH /campaigns/:id/edit`, updates the query cache, shows user feedback,
 * and navigates to the next appropriate wizard step based on updated campaign state.
 *
 * @param campaignId - The UUID of the campaign being edited.
 * @param options - Optional mutation options to extend default behavior.
 * @returns TanStack Query mutation object for editing a campaign.
 */
export function UseEditCampaignMutation(
  campaignId?: string,
  options?: EditCampaignMutationOptions
): UseMutationResult<Campaign, Error, CampaignEditInput> {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { onSuccess, onError, ...restOptions } = options ?? {};

  const mutation = useMutation({
    ...restOptions,
    mutationFn: (data: CampaignEditInput) => {
      if (!campaignId) {
        throw new Error('Campaign ID is required.');
      }
      return EditCampaign(campaignId, data);
    },
    onSuccess: (updatedCampaign, variables, onMutateResult, context) => {
      if (campaignId) {
        queryClient.setQueryData(['campaign', campaignId], updatedCampaign);
      }
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });

      const message = options?.successMessage ?? 'Informasi dasar berhasil disimpan.';
      toast.success(message);

      const targetPath = ResolveCampaignWizardStepPath(updatedCampaign);
      navigate(targetPath, {
        state: { campaignId: updatedCampaign.id },
      });

      onSuccess?.(updatedCampaign, variables, onMutateResult, context);
    },

    onError: (error, variables, onMutateResult, context) => {
      toast.error(error.message);
      onError?.(error, variables, onMutateResult, context);
    },
  });

  return mutation;
}

export type SubmitCampaignMutationOptions = Omit<UseMutationOptions<Campaign, Error, void>, 'mutationFn'>;

/**
 * Mutation hook for submitting a campaign for admin review.
 * Calls `POST /campaigns/:id/submit`, updates the query cache, shows user feedback,
 * and navigates to the campaigns list.
 *
 * @param campaignId - The UUID of the campaign being submitted.
 * @param options - Optional mutation options to extend default behavior.
 * @returns TanStack Query mutation object for submitting a campaign.
 */
export function UseSubmitCampaignMutation(
  campaignId?: string,
  options?: SubmitCampaignMutationOptions
): UseMutationResult<Campaign, Error, void> {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { onSuccess, onError, ...restOptions } = options ?? {};

  const mutation = useMutation({
    ...restOptions,
    mutationFn: () => {
      if (!campaignId) {
        throw new Error('Campaign ID is required.');
      }
      return SubmitCampaign(campaignId);
    },
    onSuccess: (submittedCampaign, variables, onMutateResult, context) => {
      if (campaignId) {
        queryClient.setQueryData(['campaign', campaignId], submittedCampaign);
      }
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-counts'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-payment', campaignId] });

      if (submittedCampaign.campaignStatus === 'IN_REVIEW') {
        toast.success('Perubahan kampanye berhasil diajukan untuk review admin.');
        navigate('/brand-dashboard/brand-campaigns?status=IN_REVIEW', { replace: true });
      } else {
        toast.success('Draf kampanye disimpan. Silakan selesaikan pembayaran.');
        navigate(`/brand-dashboard/brand-campaigns/${campaignId}/create/step-6`);
      }

      onSuccess?.(submittedCampaign, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(error.message);
      onError?.(error, variables, onMutateResult, context);
    },
  });

  return mutation;
}

export type PayCampaignWithWalletMutationOptions = Omit<UseMutationOptions<Campaign, Error, void>, 'mutationFn'>;

/**
 * Mutation hook for paying campaign budget using brand wallet balance.
 *
 * @param campaignId - The UUID of the campaign being paid.
 * @param options - Optional mutation options.
 * @returns TanStack Query mutation object for wallet payment.
 */
export function UsePayCampaignWithWalletMutation(
  campaignId?: string,
  options?: PayCampaignWithWalletMutationOptions
): UseMutationResult<Campaign, Error, void> {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { onSuccess, onError, ...restOptions } = options ?? {};

  const mutation = useMutation({
    ...restOptions,
    mutationFn: () => {
      if (!campaignId) {
        throw new Error('Campaign ID is required.');
      }
      return PayCampaignWithWallet(campaignId);
    },
    onSuccess: (updatedCampaign, variables, onMutateResult, context) => {
      if (campaignId) {
        queryClient.setQueryData(['campaign', campaignId], updatedCampaign);
      }
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-counts'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-payment', campaignId] });

      toast.success('Pembayaran menggunakan saldo dompet berhasil. Kampanye diteruskan untuk review.');
      navigate('/brand-dashboard/brand-campaigns?status=IN_REVIEW', { replace: true });

      onSuccess?.(updatedCampaign, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(error.message);
      onError?.(error, variables, onMutateResult, context);
    },
  });

  return mutation;
}

export type ConfirmBankTransferPaymentMutationOptions = Omit<UseMutationOptions<Campaign, Error, BankTransferPaymentPayload>, 'mutationFn'>;

/**
 * Mutation hook for submitting manual bank transfer details and receipt proof.
 *
 * @param campaignId - The UUID of the campaign being paid.
 * @param options - Optional mutation options.
 * @returns TanStack Query mutation object for bank transfer confirmation.
 */
export function UseConfirmBankTransferPaymentMutation(
  campaignId?: string,
  options?: ConfirmBankTransferPaymentMutationOptions
): UseMutationResult<Campaign, Error, BankTransferPaymentPayload> {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { onSuccess, onError, ...restOptions } = options ?? {};

  const mutation = useMutation({
    ...restOptions,
    mutationFn: (data: BankTransferPaymentPayload) => {
      if (!campaignId) {
        throw new Error('Campaign ID is required.');
      }
      return ConfirmBankTransferPayment(campaignId, data);
    },
    onSuccess: (updatedCampaign, variables, onMutateResult, context) => {
      if (campaignId) {
        queryClient.setQueryData(['campaign', campaignId], updatedCampaign);
      }
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-counts'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-payment', campaignId] });

      toast.success('Bukti pembayaran berhasil dikirim. Menunggu verifikasi admin.');
      navigate('/brand-dashboard/brand-campaigns?status=IN_REVIEW', { replace: true });

      onSuccess?.(updatedCampaign, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(error.message);
      onError?.(error, variables, onMutateResult, context);
    },
  });

  return mutation;
}

export type VerifyCampaignPaymentMutationOptions = Omit<UseMutationOptions<Campaign, Error, AdminVerifyPaymentPayload>, 'mutationFn'>;

/**
 * Mutation hook for Admin payment approval or rejection.
 *
 * @param campaignId - The UUID of the campaign being verified.
 * @param options - Optional mutation options.
 * @returns TanStack Query mutation object for admin payment verification.
 */
export function UseVerifyCampaignPaymentMutation(
  campaignId?: string,
  options?: VerifyCampaignPaymentMutationOptions
): UseMutationResult<Campaign, Error, AdminVerifyPaymentPayload> {
  const queryClient = useQueryClient();
  const { onSuccess, onError, ...restOptions } = options ?? {};

  const mutation = useMutation({
    ...restOptions,
    mutationFn: (data: AdminVerifyPaymentPayload) => {
      if (!campaignId) {
        throw new Error('Campaign ID is required.');
      }
      return VerifyCampaignPayment(campaignId, data);
    },
    onSuccess: (updatedCampaign, variables, onMutateResult, context) => {
      if (campaignId) {
        queryClient.setQueryData(['campaign', campaignId], updatedCampaign);
      }
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-counts'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-payment', campaignId] });

      const msg = variables.action === 'APPROVE'
        ? 'Pembayaran berhasil diverifikasi. Kampanye kini berstatus AKTIF.'
        : 'Pembayaran ditolak. Kampanye dikembalikan ke status Menunggu Pembayaran.';
      toast.success(msg);

      onSuccess?.(updatedCampaign, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(error.message);
      onError?.(error, variables, onMutateResult, context);
    },
  });

  return mutation;
}

export type DeleteCampaignMutationOptions = Omit<UseMutationOptions<void, Error, string>, 'mutationFn'> & {
  successMessage?: string;
};

/**
 * Mutation hook for soft-deleting a campaign.
 * Calls `DELETE /campaigns/:id`, invalidates `['campaigns']` and `['campaign-counts']`,
 * and shows user feedback toast notifications.
 *
 * @param options - Optional mutation options to extend default behavior.
 * @returns TanStack Query mutation object for deleting a campaign.
 */
export function UseDeleteCampaignMutation(
  options?: DeleteCampaignMutationOptions
): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  const { onSuccess, onError, ...restOptions } = options ?? {};

  const mutation = useMutation({
    ...restOptions,
    mutationFn: (id: string) => DeleteCampaign(id),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-counts'] });

      const message = options?.successMessage ?? 'Kampanye berhasil dihapus.';
      toast.success(message);

      onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(error.message);
      onError?.(error, variables, onMutateResult, context);
    },
  });

  return mutation;
}

