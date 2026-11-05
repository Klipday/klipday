import { AUTH_MESSAGES } from './auth.constants.js';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.schemas.js';
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  ResendVerificationInput,
  VerifyEmailInput,
} from './auth.types.js';

/**
 * Validates the register request body against the role-based register schema.
 *
 * @param body - Raw request body (`req.body`).
 * @returns The first validation error message when invalid, otherwise the parsed input.
 */
export function ValidateRegisterBody(body: unknown): RegisterInput | string {
  const result = registerSchema.safeParse(body);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const message = firstIssue?.message;

    if (!message || message.startsWith('Invalid discriminator') || message.startsWith('Invalid input')) {
      return AUTH_MESSAGES.INVALID_REQUEST;
    }

    return message;
  }

  return result.data;
}

/**
 * Validates the login request body against the login schema.
 *
 * @param body - Raw request body (`req.body`).
 * @returns The first validation error message when invalid, otherwise the parsed input.
 */
export function ValidateLoginBody(body: unknown): LoginInput | string {
  const result = loginSchema.safeParse(body);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const message = firstIssue?.message;

    if (!message || message.startsWith('Invalid input')) {
      return AUTH_MESSAGES.EMAIL_OR_PASSWORD_REQUIRED;
    }

    return message;
  }

  return result.data;
}

/**
 * Validates the verify-email request body.
 *
 * @param body - Raw request body (`req.body`).
 * @returns The first validation error message when invalid, otherwise the parsed input.
 */
export function ValidateVerifyEmailBody(body: unknown): VerifyEmailInput | string {
  const result = verifyEmailSchema.safeParse(body);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const message = firstIssue?.message ?? AUTH_MESSAGES.INVALID_REQUEST;
    return message;
  }

  return result.data;
}

/**
 * Validates the resend-verification request body.
 *
 * @param body - Raw request body (`req.body`).
 * @returns The first validation error message when invalid, otherwise the parsed input.
 */
export function ValidateResendVerificationBody(body: unknown): ResendVerificationInput | string {
  const result = resendVerificationSchema.safeParse(body);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const message = firstIssue?.message ?? AUTH_MESSAGES.INVALID_REQUEST;
    return message;
  }

  return result.data;
}

/**
 * Validates the forgot-password request body.
 *
 * @param body - Raw request body (`req.body`).
 * @returns The first validation error message when invalid, otherwise the parsed input.
 */
export function ValidateForgotPasswordBody(body: unknown): ForgotPasswordInput | string {
  const result = forgotPasswordSchema.safeParse(body);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const message = firstIssue?.message ?? AUTH_MESSAGES.INVALID_REQUEST;
    return message;
  }

  return result.data;
}

/**
 * Validates the reset-password request body.
 *
 * @param body - Raw request body (`req.body`).
 * @returns The first validation error message when invalid, otherwise the parsed input.
 */
export function ValidateResetPasswordBody(body: unknown): ResetPasswordInput | string {
  const result = resetPasswordSchema.safeParse(body);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const message = firstIssue?.message ?? AUTH_MESSAGES.INVALID_REQUEST;
    return message;
  }

  return result.data;
}
