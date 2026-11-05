import { apiClient, ExtractApiError } from '@/lib/api-client';
import { TranslateAuthError } from './utils';
import type {
  ApiResponse,
  CurrentAccountProfile,
  ForgotPasswordPayload,
  LoggedInAccount,
  LoginInput,
  RegisteredAccount,
  RegisterInput,
  ResetPasswordPayload,
  ResendVerificationPayload,
  VerifyEmailPayload,
} from './types';
export type {
  ApiResponse,
  AuthRole,
  BrandProfile,
  BrandRegisterInput,
  CreatorProfile,
  CreatorRegisterInput,
  CurrentAccountProfile,
  ForgotPasswordPayload,
  LoggedInAccount,
  LoginInput,
  RegisteredAccount,
  RegisterInput,
  ResetPasswordPayload,
  ResendVerificationPayload,
  VerifyEmailPayload,
} from './types';

/**
 * Sends a register request to the backend `POST /auth/register` endpoint using Axios.
 *
 * @param input - Validated register payload matching the backend schema.
 * @returns The newly created account.
 * @throws Error with the backend message when the request fails.
 */
export async function RegisterAccount(input: RegisterInput): Promise<RegisteredAccount> {
  try {
    const response = await apiClient.post<ApiResponse<RegisteredAccount>>('/auth/register', input);
    const result = response.data.data;
    return result;
  } catch (error) {
    const rawError = ExtractApiError(error, 'Registrasi gagal. Coba lagi.');
    const translatedMessage = TranslateAuthError(rawError.message, 'Registrasi gagal. Coba lagi.');
    const apiError = new Error(translatedMessage);
    throw apiError;
  }
}

/**
 * Sends a login request to the backend `POST /auth/login` endpoint using Axios.
 *
 * @param input - Validated login credentials (email and password).
 * @returns The authenticated account details.
 * @throws Error with the backend message when authentication fails.
 */
export async function LoginAccount(input: LoginInput): Promise<LoggedInAccount> {
  try {
    const response = await apiClient.post<ApiResponse<LoggedInAccount>>('/auth/login', input);
    const result = response.data.data;
    return result;
  } catch (error) {
    const rawError = ExtractApiError(error, 'Masuk gagal. Coba lagi.');
    const translatedMessage = TranslateAuthError(rawError.message, 'Masuk gagal. Coba lagi.');
    const apiError = new Error(translatedMessage);
    throw apiError;
  }
}

/**
 * Sends a request to the backend `GET /auth/me` endpoint to retrieve
 * the authenticated account's profile details based on active session cookies.
 *
 * @returns The active user's account and profile data.
 * @throws Error with the backend message when session is invalid or missing.
 */
export async function GetCurrentAccount(): Promise<CurrentAccountProfile> {
  try {
    const response = await apiClient.get<ApiResponse<CurrentAccountProfile>>('/auth/me');
    const result = response.data.data;
    return result;
  } catch (error) {
    const rawError = ExtractApiError(error, 'Gagal memuat profil akun.');
    const translatedMessage = TranslateAuthError(rawError.message, 'Gagal memuat profil akun.');
    const apiError = new Error(translatedMessage);
    throw apiError;
  }
}

/**
 * Sends a logout request to the backend `POST /auth/logout` endpoint to clear the session cookie.
 *
 * @returns A promise that resolves when the session cookie is removed.
 * @throws Error with the backend message when logout fails.
 */
export async function LogoutAccount(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } catch (error) {
    const rawError = ExtractApiError(error, 'Gagal keluar.');
    const translatedMessage = TranslateAuthError(rawError.message, 'Gagal keluar.');
    const apiError = new Error(translatedMessage);
    throw apiError;
  }
}

/**
 * Sends a verify email request with 6-digit OTP to `POST /auth/verify-email`.
 *
 * @param input - Recipient email and 6-digit OTP code.
 * @returns The authenticated account details upon successful verification.
 */
export async function VerifyEmailApi(input: VerifyEmailPayload): Promise<LoggedInAccount> {
  try {
    const response = await apiClient.post<ApiResponse<LoggedInAccount>>('/auth/verify-email', input);
    const result = response.data.data;
    return result;
  } catch (error) {
    const rawError = ExtractApiError(error, 'Verifikasi email gagal.');
    const translatedMessage = TranslateAuthError(rawError.message, 'Verifikasi email gagal.');
    const apiError = new Error(translatedMessage);
    throw apiError;
  }
}

/**
 * Requests a new 6-digit verification OTP code via `POST /auth/resend-verification`.
 *
 * @param input - Target email address.
 */
export async function ResendVerificationApi(input: ResendVerificationPayload): Promise<void> {
  try {
    await apiClient.post<ApiResponse<null>>('/auth/resend-verification', input);
  } catch (error) {
    const rawError = ExtractApiError(error, 'Gagal mengirim ulang kode verifikasi.');
    const translatedMessage = TranslateAuthError(rawError.message, 'Gagal mengirim ulang kode verifikasi.');
    const apiError = new Error(translatedMessage);
    throw apiError;
  }
}

/**
 * Dispatches a password reset link to user's email via `POST /auth/forgot-password`.
 *
 * @param input - Target email address.
 */
export async function ForgotPasswordApi(input: ForgotPasswordPayload): Promise<void> {
  try {
    await apiClient.post<ApiResponse<null>>('/auth/forgot-password', input);
  } catch (error) {
    const rawError = ExtractApiError(error, 'Gagal mengirim tautan atur ulang kata sandi.');
    const translatedMessage = TranslateAuthError(rawError.message, 'Gagal mengirim tautan atur ulang kata sandi.');
    const apiError = new Error(translatedMessage);
    throw apiError;
  }
}

/**
 * Sets a new account password with secret token via `POST /auth/reset-password`.
 *
 * @param input - Secret token and new password.
 */
export async function ResetPasswordApi(input: ResetPasswordPayload): Promise<void> {
  try {
    await apiClient.post<ApiResponse<null>>('/auth/reset-password', input);
  } catch (error) {
    const rawError = ExtractApiError(error, 'Gagal memperbarui kata sandi.');
    const translatedMessage = TranslateAuthError(rawError.message, 'Gagal memperbarui kata sandi.');
    const apiError = new Error(translatedMessage);
    throw apiError;
  }
}

