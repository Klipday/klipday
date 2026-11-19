import { z } from 'zod';
import {
  AUTH_VALIDATION_MESSAGES,
  MIN_PASSWORD_LENGTH,
  SIX_DIGIT_OTP_REGEX,
} from '../constants';

/**
 * Shared trimmed email field validator matching backend normalization rules.
 */
export const emailField = z
  .string()
  .trim()
  .pipe(z.email(AUTH_VALIDATION_MESSAGES.EMAIL_INVALID));

/**
 * Shared password strength validator matching the backend register & password-reset schemas.
 */
export const passwordField = z
  .string()
  .min(MIN_PASSWORD_LENGTH, AUTH_VALIDATION_MESSAGES.PASSWORD_MIN)
  .regex(/[A-Z]/, AUTH_VALIDATION_MESSAGES.PASSWORD_UPPERCASE)
  .regex(/[0-9]/, AUTH_VALIDATION_MESSAGES.PASSWORD_NUMBER)
  .regex(/[^A-Za-z0-9]/, AUTH_VALIDATION_MESSAGES.PASSWORD_SYMBOL);

/**
 * Validation schema for the email OTP verification form.
 */
export const verifyEmailSchema = z.object({
  email: emailField,
  code: z
    .string()
    .trim()
    .min(1, AUTH_VALIDATION_MESSAGES.OTP_REQUIRED)
    .regex(SIX_DIGIT_OTP_REGEX, AUTH_VALIDATION_MESSAGES.OTP_INVALID),
});

/**
 * Validation schema for the forgot password request form.
 */
export const forgotPasswordSchema = z.object({
  email: emailField,
});

/**
 * Validation schema for the password reset form with confirmation check.
 */
export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string(),
  })
  .superRefine((values, ctx) => {
    if (!values.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: AUTH_VALIDATION_MESSAGES.CONFIRM_PASSWORD_REQUIRED,
      });
    } else if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: AUTH_VALIDATION_MESSAGES.CONFIRM_PASSWORD_MISMATCH,
      });
    }
  });

export type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
