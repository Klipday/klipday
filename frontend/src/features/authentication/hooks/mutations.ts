import { useMutation, useQueryClient, type UseMutationOptions, type UseMutationResult } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  ForgotPasswordApi,
  LoginAccount,
  LogoutAccount,
  RegisterAccount,
  ResetPasswordApi,
  ResendVerificationApi,
  VerifyEmailApi,
  type ForgotPasswordPayload,
  type LoggedInAccount,
  type LoginInput,
  type RegisteredAccount,
  type RegisterInput,
  type ResetPasswordPayload,
  type ResendVerificationPayload,
  type VerifyEmailPayload,
} from '../api';
import { GetDashboardRouteByRole } from '../utils';

export type RegisterMutationOptions = Omit<UseMutationOptions<RegisteredAccount, Error, RegisterInput>, 'mutationFn'>;
export type LoginMutationOptions = Omit<UseMutationOptions<LoggedInAccount, Error, LoginInput>, 'mutationFn'>;
export type LogoutMutationOptions = Omit<UseMutationOptions<void, Error, void>, 'mutationFn'>;
export type VerifyEmailMutationOptions = Omit<UseMutationOptions<LoggedInAccount, Error, VerifyEmailPayload>, 'mutationFn'>;
export type ResendVerificationMutationOptions = Omit<UseMutationOptions<void, Error, ResendVerificationPayload>, 'mutationFn'>;
export type ForgotPasswordMutationOptions = Omit<UseMutationOptions<void, Error, ForgotPasswordPayload>, 'mutationFn'>;
export type ResetPasswordMutationOptions = Omit<UseMutationOptions<void, Error, ResetPasswordPayload>, 'mutationFn'>;

/**
 * Custom TanStack Query mutation hook for registering a new Creator or Brand account.
 * Automatically displays a success toast and redirects to the verification screen upon success.
 *
 * @param options - Optional mutation options to override or extend behavior.
 * @returns The TanStack Query mutation object for registering accounts.
 */
export function UseRegisterMutation(options?: RegisterMutationOptions): UseMutationResult<RegisteredAccount, Error, RegisterInput> {
  const navigate = useNavigate();
  const { onSuccess, ...mutationOptions } = options ?? {};

  const mutation = useMutation({
    ...mutationOptions,
    mutationFn: RegisterAccount,
    onSuccess: (data, variables, onMutateResult, context) => {
      toast.success('Pendaftaran berhasil! Silakan masukkan kode verifikasi email Anda.');
      navigate(`/verify-email?email=${encodeURIComponent(variables.email)}`);

      onSuccess?.(data, variables, onMutateResult, context);
    },
  });

  return mutation;
}

/**
 * Custom TanStack Query mutation hook for logging into an existing account.
 * Automatically displays a success toast and redirects to the dashboard page upon success,
 * while supporting custom mutation callbacks if provided.
 *
 * @param options - Optional mutation options to override or extend behavior.
 * @returns The TanStack Query mutation object for logging in.
 */
export function UseLoginMutation(options?: LoginMutationOptions): UseMutationResult<LoggedInAccount, Error, LoginInput> {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { onSuccess, ...mutationOptions } = options ?? {};

  const mutation = useMutation({
    ...mutationOptions,
    mutationFn: LoginAccount,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ['current-account'] });

      toast.success('Berhasil masuk!');
      const redirectPath = GetDashboardRouteByRole(data.role);
      navigate(redirectPath);

      onSuccess?.(data, variables, onMutateResult, context);
    },
  });

  return mutation;
}

/**
 * Custom TanStack Query mutation hook for logging out of the current account.
 * Clears cached user state, shows a toast notification, and redirects to the sign-in page.
 *
 * @param options - Optional mutation options to override or extend behavior.
 * @returns The TanStack Query mutation object for logging out.
 */
export function UseLogoutMutation(options?: LogoutMutationOptions): UseMutationResult<void, Error, void> {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { onSuccess, ...mutationOptions } = options ?? {};

  const mutation = useMutation({
    ...mutationOptions,
    mutationFn: LogoutAccount,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.clear();

      toast.success('Berhasil keluar.');
      navigate('/signin');

      onSuccess?.(data, variables, onMutateResult, context);
    },
  });

  return mutation;
}

/**
 * Custom TanStack Query mutation hook for verifying email via 6-digit OTP code.
 * Upon success, automatically invalidates session query, displays a toast, and redirects to dashboard.
 *
 * @param options - Optional mutation options to override or extend behavior.
 * @returns TanStack Query mutation object for verifying email.
 */
export function UseVerifyEmailMutation(options?: VerifyEmailMutationOptions): UseMutationResult<LoggedInAccount, Error, VerifyEmailPayload> {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { onSuccess, ...mutationOptions } = options ?? {};

  const mutation = useMutation({
    ...mutationOptions,
    mutationFn: VerifyEmailApi,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ['current-account'] });
      toast.success('Email berhasil diverifikasi! Selamat datang di Klipday.');

      const redirectPath = GetDashboardRouteByRole(data.role);
      navigate(redirectPath);

      onSuccess?.(data, variables, onMutateResult, context);
    },
  });

  return mutation;
}

/**
 * Custom TanStack Query mutation hook for requesting a new 6-digit verification OTP code.
 *
 * @param options - Optional mutation options to override or extend behavior.
 * @returns TanStack Query mutation object for resending verification code.
 */
export function UseResendVerificationMutation(options?: ResendVerificationMutationOptions): UseMutationResult<void, Error, ResendVerificationPayload> {
  const { onSuccess, ...mutationOptions } = options ?? {};

  const mutation = useMutation({
    ...mutationOptions,
    mutationFn: ResendVerificationApi,
    onSuccess: (data, variables, onMutateResult, context) => {
      toast.success('Kode verifikasi baru telah dikirimkan ke email Anda.');
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });

  return mutation;
}

/**
 * Custom TanStack Query mutation hook for requesting a password reset email.
 *
 * @param options - Optional mutation options to override or extend behavior.
 * @returns TanStack Query mutation object for requesting password reset.
 */
export function UseForgotPasswordMutation(options?: ForgotPasswordMutationOptions): UseMutationResult<void, Error, ForgotPasswordPayload> {
  const { onSuccess, ...mutationOptions } = options ?? {};

  const mutation = useMutation({
    ...mutationOptions,
    mutationFn: ForgotPasswordApi,
    onSuccess: (data, variables, onMutateResult, context) => {
      toast.success('Instruksi pengaturan ulang kata sandi telah dikirimkan ke email Anda.');
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });

  return mutation;
}

/**
 * Custom TanStack Query mutation hook for setting a new password using a secret reset token.
 *
 * @param options - Optional mutation options to override or extend behavior.
 * @returns TanStack Query mutation object for resetting password.
 */
export function UseResetPasswordMutation(options?: ResetPasswordMutationOptions): UseMutationResult<void, Error, ResetPasswordPayload> {
  const navigate = useNavigate();
  const { onSuccess, ...mutationOptions } = options ?? {};

  const mutation = useMutation({
    ...mutationOptions,
    mutationFn: ResetPasswordApi,
    onSuccess: (data, variables, onMutateResult, context) => {
      toast.success('Kata sandi berhasil diperbarui! Silakan masuk kembali.');
      navigate('/signin');

      onSuccess?.(data, variables, onMutateResult, context);
    },
  });

  return mutation;
}

