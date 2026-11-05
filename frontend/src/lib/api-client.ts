import axios, { type AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

/**
 * Shared Axios instance configured with base URL, credentials, and default headers
 * for all communication with the Klipday backend API.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? '';
      const isAuthEndpoint =
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/me') ||
        url.includes('/auth/logout');

      if (!isAuthEndpoint && typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/signin') && !currentPath.includes('/signup')) {
          window.location.href = `/signin?expired=true&redirect=${encodeURIComponent(currentPath)}`;
        }
      }
    }

    return Promise.reject(error);
  }
);

export interface ApiError extends Error {
  code?: string;
  data?: unknown;
  status?: number;
}

/**
 * Extracts a descriptive Error instance from an unknown error or Axios response.
 * Inspects the backend's standard `{ message }` response payload, falling back to
 * the Axios network error message or the provided fallback message.
 *
 * @param error - The caught error of unknown type.
 * @param fallbackMessage - Default message to use when no server or error message is available.
 * @returns A standardized Error object containing the resolved message and optional response data.
 */
export function ExtractApiError(error: unknown, fallbackMessage = 'Terjadi kesalahan sistem. Silakan coba lagi.'): ApiError {
  // if error is an AxiosError, extract the message from the response
  if (axios.isAxiosError<{ message?: string; data?: { code?: string; [key: string]: unknown } }>(error)) {
    const serverMessage = error.response?.data?.message;
    const networkMessage = error.message;
    const resolvedMessage = serverMessage ?? networkMessage ?? fallbackMessage;

    const apiError: ApiError = new Error(resolvedMessage);
    const responsePayload = error.response?.data;

    if (responsePayload && typeof responsePayload === 'object' && 'data' in responsePayload) {
      apiError.data = responsePayload.data;
      if (responsePayload.data && typeof responsePayload.data === 'object' && 'code' in responsePayload.data) {
        apiError.code = (responsePayload.data as { code?: string }).code;
      }
    }

    apiError.status = error.response?.status;
    return apiError;
  }

  // if error is an Error instance, return it
  if (error instanceof Error) {
    return error as ApiError;
  }

  // if error is neither an AxiosError nor an Error, return the fallback message
  const fallbackError: ApiError = new Error(fallbackMessage);
  return fallbackError;
}
