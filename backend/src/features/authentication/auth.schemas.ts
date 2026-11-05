import { z } from 'zod';
import { Industry, Role } from '../../generated/prisma/enums.js';
import {
  AUTH_MESSAGES,
  INDONESIAN_PHONE_REGEX,
  MIN_PASSWORD_LENGTH,
  SIX_DIGIT_OTP_REGEX,
} from './auth.constants.js';

// Register-only strength rules; login uses min(1) so old or weaker passwords
// can still be checked against their stored hash.
const passwordField = z
  .string({ error: AUTH_MESSAGES.PASSWORD_REQUIRED })
  .min(MIN_PASSWORD_LENGTH, AUTH_MESSAGES.PASSWORD_MIN_LENGTH)
  .regex(/[A-Z]/, AUTH_MESSAGES.PASSWORD_UPPERCASE)
  .regex(/[0-9]/, AUTH_MESSAGES.PASSWORD_NUMBER)
  .regex(/[^A-Za-z0-9]/, AUTH_MESSAGES.PASSWORD_SYMBOL);

// Trim and lowercase run before the email format check, otherwise an email
// with surrounding whitespace would be rejected instead of normalized.
const emailField = z
  .string({ error: AUTH_MESSAGES.EMAIL_REQUIRED })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: AUTH_MESSAGES.EMAIL_INVALID }));

const phoneNumberField = z
  .string({ error: AUTH_MESSAGES.PHONE_REQUIRED })
  .trim()
  .min(1, AUTH_MESSAGES.PHONE_REQUIRED)
  .refine((val) => INDONESIAN_PHONE_REGEX.test(val.replace(/[\s-]/g, '')), {
    message: AUTH_MESSAGES.PHONE_INVALID,
  })
  .transform((val) => val.replace(/[\s-]/g, ''));

const registerBrandSchema = z.object({
  role: z.literal(Role.BRAND),
  email: emailField,
  password: passwordField,
  companyName: z.string({ error: AUTH_MESSAGES.COMPANY_NAME_REQUIRED }).trim().min(1, AUTH_MESSAGES.COMPANY_NAME_REQUIRED),
  phoneNumber: phoneNumberField,
  industry: z.enum(Industry, { error: AUTH_MESSAGES.INDUSTRY_INVALID }),
});

const registerCreatorSchema = z.object({
  role: z.literal(Role.CREATOR),
  email: emailField,
  password: passwordField,
  fullName: z.string({ error: AUTH_MESSAGES.FULL_NAME_REQUIRED }).trim().min(1, AUTH_MESSAGES.FULL_NAME_REQUIRED),
});

export const registerSchema = z.discriminatedUnion('role', [registerBrandSchema, registerCreatorSchema]);

export const loginSchema = z.object({
  email: emailField,
  password: z.string({ error: AUTH_MESSAGES.PASSWORD_REQUIRED }).min(1, AUTH_MESSAGES.PASSWORD_REQUIRED),
});

export const verifyEmailSchema = z.object({
  email: emailField,
  code: z
    .string({ error: AUTH_MESSAGES.CODE_REQUIRED })
    .trim()
    .regex(SIX_DIGIT_OTP_REGEX, AUTH_MESSAGES.CODE_INVALID),
});

export const resendVerificationSchema = z.object({
  email: emailField,
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z.object({
  token: z
    .string({ error: AUTH_MESSAGES.TOKEN_REQUIRED })
    .trim()
    .min(1, AUTH_MESSAGES.TOKEN_REQUIRED),
  password: passwordField,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
