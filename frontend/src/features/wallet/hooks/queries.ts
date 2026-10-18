import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  GetActiveCreatorWithdrawals,
  GetActiveTopUpRequests,
  GetActiveWithdrawalRequests,
  GetBrandTransactions,
  GetBrandWalletSummary,
  GetCreatorPayoutAccounts,
  GetCreatorTransactions,
  GetCreatorWalletSummary,
} from '../api';
import type {
  BrandWalletSummary,
  CreatorPayoutAccountRecord,
  CreatorTransactionQueryParams,
  CreatorWalletSummary,
  PaginatedCreatorTransactionsResponse,
  PaginatedTransactionsResponse,
  PayoutRequestRecord,
  TopUpRequestRecord,
  TransactionQueryParams,
} from '../types';

/**
 * Custom TanStack Query hook that retrieves the brand wallet balance and metrics.
 *
 * @returns TanStack Query result with BrandWalletSummary.
 */
export function UseBrandWalletSummaryQuery(): UseQueryResult<BrandWalletSummary, Error> {
  const queryResult = useQuery({
    queryKey: ['brand-wallet-summary'],
    queryFn: GetBrandWalletSummary,
    staleTime: 30 * 1000,
  });

  return queryResult;
}

/**
 * Custom TanStack Query hook that retrieves paginated transaction history for the brand.
 * Uses keepPreviousData to ensure seamless tab transitions without empty flashes.
 *
 * @param params - Optional filter query parameters.
 * @returns TanStack Query result with PaginatedTransactionsResponse.
 */
export function UseBrandTransactionsQuery(
  params?: TransactionQueryParams,
): UseQueryResult<PaginatedTransactionsResponse, Error> {
  const queryResult = useQuery({
    queryKey: ['brand-transactions', params],
    queryFn: () => GetBrandTransactions(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  return queryResult;
}

/**
 * Custom TanStack Query hook that retrieves active unapproved top-up requests (pending/submitted).
 *
 * @returns TanStack Query result with list of TopUpRequestRecord.
 */
export function UseActiveTopUpRequestsQuery(): UseQueryResult<TopUpRequestRecord[], Error> {
  const queryResult = useQuery({
    queryKey: ['brand-active-top-ups'],
    queryFn: GetActiveTopUpRequests,
    staleTime: 15 * 1000,
  });

  return queryResult;
}

/**
 * Custom TanStack Query hook that retrieves active unapproved withdrawal requests (PENDING).
 *
 * @returns TanStack Query result with list of PayoutRequestRecord.
 */
export function UseActiveWithdrawalRequestsQuery(): UseQueryResult<PayoutRequestRecord[], Error> {
  const queryResult = useQuery({
    queryKey: ['brand-active-withdrawals'],
    queryFn: GetActiveWithdrawalRequests,
    staleTime: 15 * 1000,
  });

  return queryResult;
}

// =============================================================================
// Creator Wallet Queries
// =============================================================================

/**
 * Custom TanStack Query hook that retrieves creator wallet balance and earnings metrics.
 *
 * @returns TanStack Query result with CreatorWalletSummary.
 */
export function UseCreatorWalletSummaryQuery(): UseQueryResult<CreatorWalletSummary, Error> {
  const queryResult = useQuery({
    queryKey: ['creator-wallet-summary'],
    queryFn: GetCreatorWalletSummary,
    staleTime: 30 * 1000,
  });

  return queryResult;
}

/**
 * Custom TanStack Query hook that retrieves paginated transaction mutations for the creator.
 *
 * @param params - Optional filter and pagination query parameters.
 * @returns TanStack Query result with PaginatedCreatorTransactionsResponse.
 */
export function UseCreatorTransactionsQuery(
  params?: CreatorTransactionQueryParams,
): UseQueryResult<PaginatedCreatorTransactionsResponse, Error> {
  const queryResult = useQuery({
    queryKey: ['creator-transactions', params],
    queryFn: () => GetCreatorTransactions(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  return queryResult;
}

/**
 * Custom TanStack Query hook that retrieves all registered payout accounts for creator.
 *
 * @param options - Optional query options such as enabled flag.
 * @returns TanStack Query result with list of CreatorPayoutAccountRecord.
 */
export function UseCreatorPayoutAccountsQuery(options?: {
  enabled?: boolean;
}): UseQueryResult<
  CreatorPayoutAccountRecord[],
  Error
> {
  const queryResult = useQuery({
    queryKey: ['creator-payout-accounts'],
    queryFn: GetCreatorPayoutAccounts,
    staleTime: 30 * 1000,
    enabled: options?.enabled,
  });

  return queryResult;
}

/**
 * Custom TanStack Query hook that retrieves active pending withdrawals for creator.
 *
 * @returns TanStack Query result with list of PayoutRequestRecord.
 */
export function UseActiveCreatorWithdrawalsQuery(): UseQueryResult<
  PayoutRequestRecord[],
  Error
> {
  const queryResult = useQuery({
    queryKey: ['creator-active-withdrawals'],
    queryFn: GetActiveCreatorWithdrawals,
    staleTime: 15 * 1000,
  });

  return queryResult;
}



