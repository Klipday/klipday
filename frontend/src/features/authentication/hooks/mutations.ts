import { useMutation, useQueryClient, type UseMutationOptions, type UseMutationResult } from '@tanstack/react-query';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import {
  ForgotPasswordApi,
  GetCurrentAccount,
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
  type VerifyEmailResponse,
} from '../api';
import type { AuthLocationState } from '../types';
import { GetDashboardRouteByRole, ResolveSafeRedirectPath } from '../utils';

export type RegisterMutationOptions = Omit<UseMutationOptions<RegisteredAccount, Error, RegisterInput>, 'mutationFn'>;
export type LoginMutationOptions = Omit<UseMutationOptions<LoggedInAccount, Error, LoginInput>, 'mutationFn'>;
export type LogoutMutationOptions = Omit<UseMutationOptions<void, Error, void>, 'mutationFn'>;
export type VerifyEmailMutationOptions = Omit<UseMutationOptions<VerifyEmailResponse, Error, VerifyEmailPayload>, 'mutationFn'>;
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
      const targetUrl = `/verify-email?email=${encodeURIComponent(variables.email)}`;
      navigate(targetUrl, { state: { otpJustSent: true } satisfies AuthLocationState });

      onSuccess?.(data, variables, onMutateResult, context);
    },
  });

  return mutation;
}

/**
 * Custom TanStack Query mutation hook for logging into an existing account.
 * Clears any stale tenant cache, fetches the fresh account profile before navigating,
 * and redirects to the safe deep link or role-specific dashboard.
 *
 * @param options - Optional mutation options to override or extend behavior.
 * @returns The TanStack Query mutation object for logging in.
 */
export function UseLoginMutation(options?: LoginMutationOptions): UseMutationResult<LoggedInAccount, Error, LoginInput> {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { onSuccess, ...mutationOptions } = options ?? {};

  const mutation = useMutation({
    ...mutationOptions,
    mutationFn: LoginAccount,
    onSuccess: async (data, variables, onMutateResult, context) => {
      queryClient.clear();

      try {
        await queryClient.fetchQuery({
          queryKey: ['current-account'],
          queryFn: GetCurrentAccount,
        });
      } catch {
        // ProtectedRoute will handle retry or redirect if profile bootstrap transiently fails
      }

      const queryRedirect = ResolveSafeRedirectPath(searchParams.get('redirect'));
      const locationState = location.state as AuthLocationState | null;
      const stateRedirect = ResolveSafeRedirectPath(locationState?.from);
      const fallbackDashboard = GetDashboardRouteByRole(data.role);
      const redirectPath = queryRedirect ?? stateRedirect ?? fallbackDashboard;

      toast.success('Berhasil masuk!');
      navigate(redirectPath, { replace: true });

      onSuccess?.(data, variables, onMutateResult, context);
    },
  });

  return mutation;
}

/**
 * Custom TanStack Query mutation hook for logging out of the current account.
 * Cancels active queries, clears cached user state, shows a toast notification,
 * and redirects to the sign-in page.
 *
 * @param options - Optional mutation options to override or extend behavior.
 * @returns The TanStack Query mutation object for logging out.
 */
export function UseLogoutMutation(options?: LogoutMutationOptions): UseMutationResult<void, Error, void> {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { onSuccess, onError, ...mutationOptions } = options ?? {};

  const mutation = useMutation({
    ...mutationOptions,
    mutationFn: LogoutAccount,
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.cancelQueries();
      queryClient.clear();

      toast.success('Berhasil keluar.');
      navigate('/signin', { replace: true });

      onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      const message = error.message || 'Gagal keluar. Silakan coba lagi.';
      toast.error(message);

      onError?.(error, variables, onMutateResult, context);
    },
  });

  return mutation;
}

/**
 * Custom TanStack Query mutation hook for verifying email via 6-digit OTP code.
 * Handles both initial verification (hydrating profile cache and redirecting to dashboard)
 * and already-verified links (routing cleanly to sign-in).
 *
 * @param options - Optional mutation options to override or extend behavior.
 * @returns TanStack Query mutation object for verifying email.
 */
export function UseVerifyEmailMutation(options?: VerifyEmailMutationOptions): UseMutationResult<VerifyEmailResponse, Error, VerifyEmailPayload> {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { onSuccess, ...mutationOptions } = options ?? {};

  const mutation = useMutation({
    ...mutationOptions,
    mutationFn: VerifyEmailApi,
    onSuccess: async (data, variables, onMutateResult, context) => {
      if ('alreadyVerified' in data) {
        toast.info('Email Anda sudah terverifikasi. Silakan masuk.');
        navigate('/signin', { replace: true });
        onSuccess?.(data, variables, onMutateResult, context);
        return;
      }

      queryClient.clear();

      try {
        await queryClient.fetchQuery({
          queryKey: ['current-account'],
          queryFn: GetCurrentAccount,
        });
      } catch {
        // ProtectedRoute will handle retry or redirect if profile bootstrap transiently fails
      }

      toast.success('Email berhasil diverifikasi! Selamat datang di Klipday.');

      const redirectPath = GetDashboardRouteByRole(data.role);
      navigate(redirectPath, { replace: true });

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
      navigate('/signin', { replace: true });

      onSuccess?.(data, variables, onMutateResult, context);
    },
  });

  return mutation;
}
