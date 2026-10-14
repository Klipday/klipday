import { z } from 'zod';
import {
  PAYOUT_ACCOUNT_LIMITS,
  PAYOUT_ACCOUNT_MESSAGES,
  PROVIDER_ACCOUNT_RULES,
} from '../constants';

export const PayoutAccountFormSchema = z
  .object({
    accountType: z.enum(['BANK_TRANSFER', 'E_WALLET']),
    provider: z
      .string()
      .trim()
      .min(PAYOUT_ACCOUNT_LIMITS.MIN_PROVIDER_LENGTH, PAYOUT_ACCOUNT_MESSAGES.PROVIDER_REQUIRED),
    accountNumber: z
      .string()
      .trim()
      .min(PAYOUT_ACCOUNT_LIMITS.MIN_ACCOUNT_NUMBER_LENGTH, PAYOUT_ACCOUNT_MESSAGES.ACCOUNT_NUMBER_MIN)
      .max(PAYOUT_ACCOUNT_LIMITS.MAX_ACCOUNT_NUMBER_LENGTH, PAYOUT_ACCOUNT_MESSAGES.ACCOUNT_NUMBER_MAX)
      .regex(/^[0-9]+$/, PAYOUT_ACCOUNT_MESSAGES.ACCOUNT_NUMBER_NUMERIC),
    accountHolderName: z
      .string()
      .trim()
      .min(PAYOUT_ACCOUNT_LIMITS.MIN_ACCOUNT_HOLDER_LENGTH, PAYOUT_ACCOUNT_MESSAGES.ACCOUNT_HOLDER_MIN)
      .max(PAYOUT_ACCOUNT_LIMITS.MAX_ACCOUNT_HOLDER_LENGTH, PAYOUT_ACCOUNT_MESSAGES.ACCOUNT_HOLDER_MAX),
    proofUrl: z.string().url(PAYOUT_ACCOUNT_MESSAGES.PROOF_URL_REQUIRED),
    isPrimary: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const providerRule = PROVIDER_ACCOUNT_RULES[data.provider.toUpperCase().trim()];
    if (providerRule && !providerRule.regex.test(data.accountNumber.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['accountNumber'],
        message: providerRule.description,
      });
    }
  });

export type PayoutAccountFormValues = z.infer<typeof PayoutAccountFormSchema>;
