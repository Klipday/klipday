import { z } from 'zod';
import { TOP_UP_LIMITS, WITHDRAWAL_LIMITS, WALLET_MESSAGES } from './wallet.constants.js';

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
  accountProvider: z.string().trim().min(2, WALLET_MESSAGES.ACCOUNT_PROVIDER_REQUIRED),
  accountNumber: z.string().trim().min(3, WALLET_MESSAGES.ACCOUNT_NUMBER_REQUIRED),
  accountHolderName: z.string().trim().min(2, WALLET_MESSAGES.ACCOUNT_HOLDER_REQUIRED),
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

