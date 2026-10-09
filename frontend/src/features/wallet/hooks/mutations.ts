import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CancelTopUpRequest,
  CancelWithdrawalRequest,
  CreateTopUpRequest,
  CreateWithdrawalRequest,
  RequestWithdrawalCancellation,
  SimulateTopUpApproval,
  SimulateWithdrawalApproval,
  SubmitTopUpProof,
  UploadTopUpProof,
} from '../api';
import type {
  CreateTopUpPayload,
  CreateWithdrawalPayload,
  PayoutRequestRecord,
  SimulateApprovalResult,
  SimulateWithdrawalResult,
  SubmitTopUpProofPayload,
  TopUpRequestRecord,
} from '../types';


/**
 * Mutation hook for creating a new manual top-up request.
 *
 * @returns TanStack Query mutation object for CreateTopUpRequest.
 */
export function UseCreateTopUpMutation(): UseMutationResult<
  TopUpRequestRecord,
  Error,
  CreateTopUpPayload
> {
  const queryClient = useQueryClient();

  const mutationResult = useMutation({
    mutationFn: (payload: CreateTopUpPayload) => CreateTopUpRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-active-top-ups'] });
      queryClient.invalidateQueries({ queryKey: ['brand-wallet-summary'] });
      queryClient.invalidateQueries({ queryKey: ['brand-transactions'] });
      toast.success('Permintaan top-up berhasil dibuat.');
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal membuat permintaan top-up.');
    },
  });

  return mutationResult;
}

/**
 * Mutation hook for streaming top-up payment proof image directly to Supabase storage.
 *
 * @returns TanStack Query mutation object for UploadTopUpProof.
 */
export function UseUploadTopUpProofMutation(): UseMutationResult<
  string,
  Error,
  { file: File; onProgress?: (percent: number) => void }
> {
  const mutationResult = useMutation<
    string,
    Error,
    { file: File; onProgress?: (percent: number) => void }
  >({
    mutationFn: ({ file, onProgress }) => UploadTopUpProof(file, onProgress),
    onError: (error) => {
      toast.error(error.message || 'Gagal mengunggah bukti transfer.');
    },
  });

  return mutationResult;
}

/**
 * Mutation hook for simulating top-up approval in sandbox mode.
 *
 * @returns TanStack Query mutation object for SimulateTopUpApproval.
 */
export function UseSimulateTopUpApprovalMutation(): UseMutationResult<
  SimulateApprovalResult,
  Error,
  string
> {
  const queryClient = useQueryClient();

  const mutationResult = useMutation({
    mutationFn: (topUpId: string) => SimulateTopUpApproval(topUpId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-wallet-summary'] });
      queryClient.invalidateQueries({ queryKey: ['brand-transactions'] });
      toast.success('Simulasi top-up berhasil! Saldo aktif Anda telah ditambahkan.');
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal menyimulasikan top-up.');
    },
  });

  return mutationResult;
}

/**
 * Mutation hook for submitting payment proof for an active top-up request.
 *
 * @returns TanStack Query mutation object for SubmitTopUpProof.
 */
export function UseSubmitTopUpProofMutation(): UseMutationResult<
  TopUpRequestRecord,
  Error,
  { id: string; payload: SubmitTopUpProofPayload }
> {
  const queryClient = useQueryClient();

  const mutationResult = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SubmitTopUpProofPayload }) =>
      SubmitTopUpProof(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-active-top-ups'] });
      queryClient.invalidateQueries({ queryKey: ['brand-wallet-summary'] });
      queryClient.invalidateQueries({ queryKey: ['brand-transactions'] });
      toast.success('Bukti pembayaran berhasil dikirim. Menunggu verifikasi admin.');
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal mengirim konfirmasi bukti transfer.');
    },
  });

  return mutationResult;
}

/**
 * Mutation hook for cancelling/soft-deleting a pending top-up request.
 *
 * @returns TanStack Query mutation object for CancelTopUpRequest.
 */
export function UseCancelTopUpRequestMutation(): UseMutationResult<
  { id: string },
  Error,
  string
> {
  const queryClient = useQueryClient();

  const mutationResult = useMutation({
    mutationFn: (topUpId: string) => CancelTopUpRequest(topUpId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-active-top-ups'] });
      toast.success('Permintaan top-up berhasil dibatalkan.');
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal membatalkan permintaan top-up.');
    },
  });

  return mutationResult;
}

/**
 * Mutation hook for requesting a withdrawal of active brand funds.
 *
 * @returns TanStack Query mutation object for CreateWithdrawalRequest.
 */
export function UseCreateWithdrawalMutation(): UseMutationResult<
  PayoutRequestRecord,
  Error,
  CreateWithdrawalPayload
> {
  const queryClient = useQueryClient();

  const mutationResult = useMutation({
    mutationFn: (payload: CreateWithdrawalPayload) => CreateWithdrawalRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-active-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['brand-wallet-summary'] });
      queryClient.invalidateQueries({ queryKey: ['brand-transactions'] });
      toast.success('Permintaan penarikan saldo berhasil diajukan.');
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal mengajukan penarikan saldo.');
    },
  });

  return mutationResult;
}

/**
 * Mutation hook for cancelling a pending withdrawal request and refunding reserved funds.
 *
 * @returns TanStack Query mutation object for CancelWithdrawalRequest.
 */
export function UseCancelWithdrawalMutation(): UseMutationResult<
  { id: string },
  Error,
  string
> {
  const queryClient = useQueryClient();

  const mutationResult = useMutation({
    mutationFn: (withdrawalId: string) => CancelWithdrawalRequest(withdrawalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-active-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['brand-wallet-summary'] });
      toast.success('Permintaan penarikan saldo berhasil dibatalkan. Saldo telah dikembalikan.');
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal membatalkan permintaan penarikan.');
    },
  });

  return mutationResult;
}

/**
 * Mutation hook for requesting cancellation of a pending withdrawal request.
 * Funds remain safely locked until verified and approved by admin.
 *
 * @returns TanStack Query mutation object for RequestWithdrawalCancellation.
 */
export function UseRequestWithdrawalCancellationMutation(): UseMutationResult<
  PayoutRequestRecord,
  Error,
  { withdrawalId: string; reason?: string }
> {
  const queryClient = useQueryClient();

  const mutationResult = useMutation({
    mutationFn: ({ withdrawalId, reason }: { withdrawalId: string; reason?: string }) =>
      RequestWithdrawalCancellation(withdrawalId, reason ? { reason } : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-active-withdrawals'] });
      toast.success('Pengajuan pembatalan berhasil dikirim. Menunggu persetujuan admin.');
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal mengajukan pembatalan penarikan.');
    },
  });

  return mutationResult;
}

/**
 * Mutation hook for simulating admin approval and transfer of a withdrawal request in sandbox mode.
 *
 * @returns TanStack Query mutation object for SimulateWithdrawalApproval.
 */
export function UseSimulateWithdrawalApprovalMutation(): UseMutationResult<
  SimulateWithdrawalResult,
  Error,
  string
> {
  const queryClient = useQueryClient();

  const mutationResult = useMutation({
    mutationFn: (withdrawalId: string) => SimulateWithdrawalApproval(withdrawalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-active-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['brand-wallet-summary'] });
      queryClient.invalidateQueries({ queryKey: ['brand-transactions'] });
      toast.success('Simulasi penarikan saldo berhasil disetujui & ditransfer!');
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal menyimulasikan persetujuan penarikan.');
    },
  });

  return mutationResult;
}

