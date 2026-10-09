import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  GetActiveTopUpRequests,
  GetActiveWithdrawalRequests,
  GetBrandTransactions,
  GetBrandWalletSummary,
} from '../api';
import type {
  BrandWalletSummary,
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

