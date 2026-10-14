import { z } from 'zod';
import {
  AUTH_VALIDATION_MESSAGES,
  INDONESIAN_PHONE_REGEX,
  INDUSTRY_OPTIONS,
  type Industry,
  MIN_PASSWORD_LENGTH,
} from '../constants';

export {
  AUTH_VALIDATION_MESSAGES,
  INDONESIAN_PHONE_REGEX,
  INDUSTRY_OPTIONS,
  type Industry,
};

// Mirrors the password strength rules enforced by the backend register schema,
// so invalid passwords are rejected before a request is ever sent.
const passwordField = z
  .string()
  .min(MIN_PASSWORD_LENGTH, AUTH_VALIDATION_MESSAGES.PASSWORD_MIN)
  .regex(/[A-Z]/, AUTH_VALIDATION_MESSAGES.PASSWORD_UPPERCASE)
  .regex(/[0-9]/, AUTH_VALIDATION_MESSAGES.PASSWORD_NUMBER)
  .regex(/[^A-Za-z0-9]/, AUTH_VALIDATION_MESSAGES.PASSWORD_SYMBOL);

/**
 * Flat shape for every field the form can hold. Which fields are required
 * depends on the chosen role and is enforced by the refinement below.
 */
const signUpBaseSchema = z.object({
  role: z.enum(['CREATOR', 'BRAND']),
  email: z.string().trim().email('Email tidak valid.'),
  password: passwordField,
  confirmPassword: z.string(),
  fullName: z.string().trim(),
  companyName: z.string().trim(),
  phoneNumber: z.string().trim(),
  industry: z.string().trim(),
});

export const signUpSchema = signUpBaseSchema.superRefine((values, ctx) => {
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

  // check field based on role
  if (values.role === 'CREATOR') {
    if (!values.fullName) {
      ctx.addIssue({
        code: 'custom',
        path: ['fullName'],
        message: AUTH_VALIDATION_MESSAGES.FULL_NAME_REQUIRED,
      });
    }
  } else if (values.role === 'BRAND') {
    if (!values.companyName) {
      ctx.addIssue({
        code: 'custom',
        path: ['companyName'],
        message: AUTH_VALIDATION_MESSAGES.COMPANY_NAME_REQUIRED,
      });
    }

    if (!values.phoneNumber) {
      ctx.addIssue({
        code: 'custom',
        path: ['phoneNumber'],
        message: AUTH_VALIDATION_MESSAGES.PHONE_REQUIRED,
      });
    } else if (!INDONESIAN_PHONE_REGEX.test(values.phoneNumber.replace(/[\s-]/g, ''))) {
      ctx.addIssue({
        code: 'custom',
        path: ['phoneNumber'],
        message: AUTH_VALIDATION_MESSAGES.PHONE_INVALID,
      });
    }

    if (!values.industry) {
      ctx.addIssue({
        code: 'custom',
        path: ['industry'],
        message: AUTH_VALIDATION_MESSAGES.INDUSTRY_REQUIRED,
      });
    } else if (!INDUSTRY_OPTIONS.includes(values.industry as Industry)) {
      ctx.addIssue({
        code: 'custom',
        path: ['industry'],
        message: AUTH_VALIDATION_MESSAGES.INDUSTRY_INVALID,
      });
    }
  }

  return;
});

export type SignUpFormValues = z.infer<typeof signUpBaseSchema>;
