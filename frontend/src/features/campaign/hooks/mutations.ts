import { useMutation, useQueryClient, type QueryClient, type UseMutationOptions, type UseMutationResult } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  ConfirmBankTransferPayment,
  DeleteCampaign,
  EditCampaign,
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
  WalletPaymentPayload,
  WizardStepSlug,
} from '../types';
import { GetWizardStepPath } from '../config/wizard-steps';
import {
  IsCampaignConflictError,
  NotifyCampaignUpdatedAcrossTabs,
  ResolveCampaignWizardStepPath,
} from '../utils';

export type InitializeCampaignMutationOptions = Omit<UseMutationOptions<InitializeCampaignResponse, Error, void>, 'mutationFn'>;

export type EditCampaignMutationOptions = Omit<UseMutationOptions<Campaign, Error, CampaignEditInput>, 'mutationFn'> & {
  successMessage?: string;
  nextStepSlug?: WizardStepSlug;
};

/**
 * Refetches campaign and payment caches immediately when a concurrent 409 Conflict occurs
 * so the user sees the latest saved state without manual reload.
 *
 * @param queryClient - Active TanStack QueryClient instance.
 * @param error - Mutation error thrown by API call.
 * @param campaignId - Optional campaign identifier to revalidate.
 */
function HandleConflictStateRefresh(queryClient: QueryClient, error: unknown, campaignId?: string): void {
  if (!IsCampaignConflictError(error)) {
    return;
  }

  if (campaignId) {
    void queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
    void queryClient.invalidateQueries({ queryKey: ['campaign-payment', campaignId] });
  }
  void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
  void queryClient.invalidateQueries({ queryKey: ['campaign-counts'] });
}

/**
 * Mutation hook for initiating a new draft campaign.
 * Calls `POST /campaigns`, seeds minimal draft cache, and navigates directly to Step 1
 * without executing an extra blocking `GET /campaigns/:id` roundtrip.
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
    onSuccess: (data, variables, onMutateResult, context) => {
      onSuccess?.(data, variables, onMutateResult, context);

      queryClient.setQueryData<Campaign>(['campaign', data.id], {
        id: data.id,
        campaignStatus: 'DRAFT',
      });
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      void queryClient.invalidateQueries({ queryKey: ['campaign-counts'] });
      void queryClient.invalidateQueries({ queryKey: ['brand', 'dashboard'] });
      NotifyCampaignUpdatedAcrossTabs(data.id);

      toast.success('Draf kampanye baru berhasil dibuat.');

      const targetPath = GetWizardStepPath('step-1', data.id);
      navigate(targetPath, {
        state: { campaignId: data.id },
      });
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
 * broadcasts cross-tab sync, and navigates to the next appropriate wizard step.
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
        void queryClient.invalidateQueries({ queryKey: ['campaign-payment', campaignId] });
      }
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      void queryClient.invalidateQueries({ queryKey: ['campaign-counts'] });
      void queryClient.invalidateQueries({ queryKey: ['brand', 'dashboard'] });
      NotifyCampaignUpdatedAcrossTabs(updatedCampaign.id);

      const message = options?.successMessage ?? 'Informasi dasar berhasil disimpan.';
      toast.success(message);

      const targetPath = options?.nextStepSlug
        ? GetWizardStepPath(options.nextStepSlug, updatedCampaign.id)
        : ResolveCampaignWizardStepPath(updatedCampaign);

      navigate(targetPath, {
        state: { campaignId: updatedCampaign.id },
      });

      onSuccess?.(updatedCampaign, variables, onMutateResult, context);
    },

    onError: (error, variables, onMutateResult, context) => {
      toast.error(error.message);
      HandleConflictStateRefresh(queryClient, error, campaignId);
      onError?.(error, variables, onMutateResult, context);
    },
  });

  return mutation;
}

export type SubmitCampaignMutationOptions = Omit<UseMutationOptions<Campaign, Error, void>, 'mutationFn'>;

/**
 * Mutation hook for submitting a campaign for admin review.
 * Calls `POST /campaigns/:id/submit`, updates query cache, synchronizes other tabs,
 * and navigates cleanly to Step 6 payment or IN_REVIEW status view.
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
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      void queryClient.invalidateQueries({ queryKey: ['campaign-counts'] });
      void queryClient.invalidateQueries({ queryKey: ['campaign-payment', campaignId] });
      void queryClient.invalidateQueries({ queryKey: ['brand', 'dashboard'] });
      NotifyCampaignUpdatedAcrossTabs(campaignId);

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
      HandleConflictStateRefresh(queryClient, error, campaignId);
      onError?.(error, variables, onMutateResult, context);
    },
  });

  return mutation;
}

export type PayCampaignWithWalletMutationOptions = Omit<
  UseMutationOptions<Campaign, Error, WalletPaymentPayload | undefined>,
  'mutationFn'
>;

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
): UseMutationResult<Campaign, Error, WalletPaymentPayload | undefined> {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { onSuccess, onError, ...restOptions } = options ?? {};

  const mutation = useMutation({
    ...restOptions,
    mutationFn: (payload?: WalletPaymentPayload) => {
      if (!campaignId) {
        throw new Error('Campaign ID is required.');
      }
      return PayCampaignWithWallet(campaignId, payload);
    },
    onSuccess: (updatedCampaign, variables, onMutateResult, context) => {
      if (campaignId) {
        queryClient.setQueryData(['campaign', campaignId], updatedCampaign);
      }
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      void queryClient.invalidateQueries({ queryKey: ['campaign-counts'] });
      void queryClient.invalidateQueries({ queryKey: ['campaign-payment', campaignId] });
      void queryClient.invalidateQueries({ queryKey: ['brand-wallet-summary'] });
      void queryClient.invalidateQueries({ queryKey: ['brand-transactions'] });
      void queryClient.invalidateQueries({ queryKey: ['brand', 'dashboard'] });
      NotifyCampaignUpdatedAcrossTabs(campaignId);

      toast.success('Pembayaran menggunakan saldo dompet berhasil. Kampanye diteruskan untuk review.');
      navigate('/brand-dashboard/brand-campaigns?status=IN_REVIEW', { replace: true });

      onSuccess?.(updatedCampaign, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(error.message);
      HandleConflictStateRefresh(queryClient, error, campaignId);
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
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      void queryClient.invalidateQueries({ queryKey: ['campaign-counts'] });
      void queryClient.invalidateQueries({ queryKey: ['campaign-payment', campaignId] });
      void queryClient.invalidateQueries({ queryKey: ['brand', 'dashboard'] });
      NotifyCampaignUpdatedAcrossTabs(campaignId);

      toast.success('Bukti pembayaran berhasil dikirim. Menunggu verifikasi admin.');
      navigate('/brand-dashboard/brand-campaigns?status=IN_REVIEW', { replace: true });

      onSuccess?.(updatedCampaign, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(error.message);
      HandleConflictStateRefresh(queryClient, error, campaignId);
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
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      void queryClient.invalidateQueries({ queryKey: ['campaign-counts'] });
      void queryClient.invalidateQueries({ queryKey: ['campaign-payment', campaignId] });
      NotifyCampaignUpdatedAcrossTabs(campaignId);

      const msg = variables.action === 'APPROVE'
        ? 'Pembayaran berhasil diverifikasi. Kampanye kini berstatus AKTIF.'
        : 'Pembayaran ditolak. Kampanye dikembalikan ke status Menunggu Pembayaran.';
      toast.success(msg);

      onSuccess?.(updatedCampaign, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(error.message);
      HandleConflictStateRefresh(queryClient, error, campaignId);
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
 * Calls `DELETE /campaigns/:id`, invalidates campaign & dashboard queries, broadcasts cross-tab deletion,
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
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      void queryClient.invalidateQueries({ queryKey: ['campaign-counts'] });
      void queryClient.invalidateQueries({ queryKey: ['brand', 'dashboard'] });
      NotifyCampaignUpdatedAcrossTabs(variables);

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

