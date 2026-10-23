import { z } from 'zod';
import { PayoutAccountType } from '../../generated/prisma/enums.js';
import { PROVIDER_ACCOUNT_RULES } from '../brand/brand.constants.js';
import {
  CREATOR_PAYOUT_LIMITS,
  CREATOR_WALLET_MESSAGES,
  TOP_UP_LIMITS,
  WITHDRAWAL_LIMITS,
  WALLET_MESSAGES,
} from './wallet.constants.js';

export const CreateTopUpSchema = z.object({
  amount: z
    .number({ error: WALLET_MESSAGES.INVALID_AMOUNT_RANGE })
    .int('Nominal harus berupa bilangan bulat')
    .min(TOP_UP_LIMITS.MIN_AMOUNT, WALLET_MESSAGES.INVALID_AMOUNT_RANGE)
    .max(TOP_UP_LIMITS.MAX_AMOUNT, WALLET_MESSAGES.INVALID_AMOUNT_RANGE),
  senderBank: z.string().trim().min(2, WALLET_MESSAGES.SENDER_BANK_REQUIRED),
  senderAccountName: z.string().trim().min(2, WALLET_MESSAGES.SENDER_NAME_REQUIRED),
  transferProofUrl: z.string().url('URL bukti transfer tidak valid').optional(),
});

export type CreateTopUpInput = z.infer<typeof CreateTopUpSchema>;

export const CreateWithdrawalSchema = z.object({
  amount: z
    .number({ error: WALLET_MESSAGES.INVALID_WITHDRAWAL_AMOUNT })
    .int('Nominal harus berupa bilangan bulat')
    .min(WITHDRAWAL_LIMITS.MIN_AMOUNT, WALLET_MESSAGES.INVALID_WITHDRAWAL_AMOUNT)
    .max(WITHDRAWAL_LIMITS.MAX_AMOUNT, WALLET_MESSAGES.INVALID_WITHDRAWAL_AMOUNT),
  payoutAccountId: z.string().uuid('ID akun penarikan tidak valid').optional(),
  accountProvider: z.string().trim().optional(),
  accountNumber: z.string().trim().optional(),
  accountHolderName: z.string().trim().optional(),
});

export type CreateWithdrawalInput = z.infer<typeof CreateWithdrawalSchema>;

export const TransactionQuerySchema = z.object({
  type: z
    .enum([
      'ALL',
      'BRAND_DEPOSIT',
      'CAMPAIGN_PAYMENT',
      'CAMPAIGN_REFUND',
      'CAMPAIGN_EARNING',
      'WITHDRAWAL',
    ])
    .default('ALL'),
  page: z.coerce.number().int().min(1).default(TOP_UP_LIMITS.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(TOP_UP_LIMITS.MAX_LIMIT).default(TOP_UP_LIMITS.DEFAULT_LIMIT),
  search: z.string().trim().optional(),
});

export type TransactionQueryInput = z.infer<typeof TransactionQuerySchema>;

export const SubmitTopUpProofSchema = z.object({
  transferProofUrl: z.string().url('URL bukti transfer tidak valid').optional(),
});

export type SubmitTopUpProofInput = z.infer<typeof SubmitTopUpProofSchema>;

export const RequestWithdrawalCancellationSchema = z.object({
  reason: z.string().trim().max(255).optional(),
});

export type RequestWithdrawalCancellationInput = z.infer<typeof RequestWithdrawalCancellationSchema>;

export const CreateCreatorPayoutAccountSchema = z
  .object({
    accountType: z.nativeEnum(PayoutAccountType),
    provider: z
      .string()
      .trim()
      .min(CREATOR_PAYOUT_LIMITS.MIN_PROVIDER_LENGTH, CREATOR_WALLET_MESSAGES.PROVIDER_REQUIRED),
    accountNumber: z
      .string()
      .trim()
      .min(CREATOR_PAYOUT_LIMITS.MIN_ACCOUNT_NUMBER_LENGTH, CREATOR_WALLET_MESSAGES.ACCOUNT_NUMBER_INVALID)
      .max(CREATOR_PAYOUT_LIMITS.MAX_ACCOUNT_NUMBER_LENGTH, CREATOR_WALLET_MESSAGES.ACCOUNT_NUMBER_INVALID),
    accountHolderName: z
      .string()
      .trim()
      .min(CREATOR_PAYOUT_LIMITS.MIN_ACCOUNT_HOLDER_LENGTH, CREATOR_WALLET_MESSAGES.ACCOUNT_HOLDER_REQUIRED)
      .max(CREATOR_PAYOUT_LIMITS.MAX_ACCOUNT_HOLDER_LENGTH, CREATOR_WALLET_MESSAGES.ACCOUNT_HOLDER_REQUIRED),
    proofUrl: z.string().url(CREATOR_WALLET_MESSAGES.PROOF_URL_REQUIRED),
    isPrimary: z.boolean().optional().default(false),
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

export type CreateCreatorPayoutAccountInput = z.infer<typeof CreateCreatorPayoutAccountSchema>;

export const CreateCreatorWithdrawalSchema = z.object({
  amount: z
    .number({ error: CREATOR_WALLET_MESSAGES.INVALID_WITHDRAWAL_AMOUNT })
    .int('Nominal harus berupa bilangan bulat')
    .min(WITHDRAWAL_LIMITS.MIN_AMOUNT, CREATOR_WALLET_MESSAGES.INVALID_WITHDRAWAL_AMOUNT)
    .max(WITHDRAWAL_LIMITS.MAX_AMOUNT, WALLET_MESSAGES.INVALID_AMOUNT_RANGE),
  payoutAccountId: z.string().uuid('ID akun penarikan wajib berupa UUID yang valid.'),
});

export type CreateCreatorWithdrawalInput = z.infer<typeof CreateCreatorWithdrawalSchema>;

export const CreatorTransactionQuerySchema = z.object({
  type: z.enum(['ALL', 'CAMPAIGN_EARNING', 'WITHDRAWAL']).default('ALL'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().optional(),
});

export type CreatorTransactionQueryInput = z.infer<typeof CreatorTransactionQuerySchema>;

export const SimulateCreatorEarningSchema = z.object({
  amount: z.number().int().positive('Nominal perolehan saldo harus lebih dari 0'),
  campaignTitle: z.string().trim().optional(),
  verifiedViews: z.number().int().nonnegative().optional(),
  cpmRate: z.number().positive().optional(),
});

export type SimulateCreatorEarningInput = z.infer<typeof SimulateCreatorEarningSchema>;



