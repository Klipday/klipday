import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  BrandPendingTopUpBanner,
  BrandTopUpDialog,
  WalletHeader,
  WalletMetricsCards,
  WalletPendingWithdrawalBanner,
  WalletTransactionTable,
  WalletTransactionTypeFilter,
  WalletWithdrawalDialog,
} from '../components';
import { WALLET_TRANSACTION_TABS } from '../constants';
import {
  UseActiveTopUpRequestsQuery,
  UseActiveWithdrawalRequestsQuery,
  UseBrandTransactionsQuery,
  UseBrandWalletSummaryQuery,
} from '../hooks';
import type { TopUpRequestRecord, WalletMetricItem, WalletTransactionType } from '../types';

/**
 * Pure orchestrator page for the Brand Wallet.
 * Composes shared wallet balance metrics, transaction filters, mutation ledger table,
 * active top-up queue, active withdrawal queue, top-up modal dialog, and withdrawal dialog.
 *
 * @returns Rendered Brand Wallet page.
 */
export default function BrandWalletPage() {
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);
  const [selectedTopUp, setSelectedTopUp] = useState<TopUpRequestRecord | null>(null);

  const [activeType, setActiveType] = useState<WalletTransactionType>('ALL');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search query by 300ms to avoid flooding queries on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch((prev) => {
        if (prev !== searchQuery) {
          setPage(1);
          return searchQuery;
        }
        return prev;
      });
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const { data: summary, isLoading: isSummaryLoading, refetch: refetchSummary } =
    UseBrandWalletSummaryQuery();

  const {
    data: activeTopUps = [],
    refetch: refetchActiveTopUps,
  } = UseActiveTopUpRequestsQuery();

  const {
    data: activeWithdrawals = [],
    refetch: refetchActiveWithdrawals,
  } = UseActiveWithdrawalRequestsQuery();

  const trimmedDebouncedSearch = debouncedSearch.trim();
  const {
    data: transactionsData,
    isLoading: isTransactionsLoading,
    refetch: refetchTransactions,
  } = UseBrandTransactionsQuery({
    type: activeType,
    page,
    limit: 10,
    search: trimmedDebouncedSearch || undefined,
  });

  /**
   * Updates the active transaction type filter and resets pagination to page 1.
   *
   * @param nextType - Selected transaction type filter.
   */
  const HandleTypeChange = (nextType: WalletTransactionType) => {
    setActiveType(nextType);
    setPage(1);
  };

  /**
   * Updates the search input value.
   *
   * @param nextSearch - Search text entered by the user.
   */
  const HandleSearchChange = (nextSearch: string) => {
    setSearchQuery(nextSearch);
  };

  /**
   * Clears both immediate and debounced search queries and resets pagination.
   */
  const HandleResetSearch = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setPage(1);
  };

  /**
   * Resets all active transaction filters (search query and transaction type) and pagination.
   */
  const HandleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setActiveType('ALL');
    setPage(1);
  };

  /**
   * Opens the manual top-up dialog in fresh creation mode.
   */
  const HandleOpenNewTopUp = () => {
    setSelectedTopUp(null);
    setIsTopUpOpen(true);
  };

  /**
   * Resumes an existing pending top-up request inside the top-up dialog.
   *
   * @param topUp - Existing top-up record to resume.
   */
  const HandleResumeTopUp = (topUp: TopUpRequestRecord) => {
    setSelectedTopUp(topUp);
    setIsTopUpOpen(true);
  };

  /**
   * Controls top-up dialog visibility and clears selected top-up upon close.
   *
   * @param open - Dialog open state.
   */
  const HandleTopUpOpenChange = (open: boolean) => {
    setIsTopUpOpen(open);
    if (!open) {
      setSelectedTopUp(null);
    }
  };

  /**
   * Refetches wallet data after a top-up operation succeeds.
   */
  const HandleTopUpSuccess = () => {
    refetchSummary();
    refetchTransactions();
    refetchActiveTopUps();
    refetchActiveWithdrawals();
  };

  /**
   * Refetches wallet data after a withdrawal request succeeds.
   */
  const HandleWithdrawalSuccess = () => {
    refetchSummary();
    refetchTransactions();
    refetchActiveWithdrawals();
  };

  const activeBalance = summary?.metrics.activeBalance ?? 0;
  const lockedBalance = summary?.metrics.lockedBalance ?? 0;
  const totalCreatorPayout = summary?.metrics.totalCreatorPayout ?? 0;
  const metricItems: WalletMetricItem[] = [
    { label: 'Saldo Aktif', value: activeBalance },
    { label: 'Saldo Terkunci', value: lockedBalance },
    { label: 'Total Payout Kreator', value: totalCreatorPayout },
  ];

  const transactions = transactionsData?.transactions ?? [];
  const totalPages = transactionsData?.pagination.totalPages ?? 1;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <WalletHeader
        title="Dompet Brand"
        description="Kelola saldo aktif, alokasi kampanye, dan riwayat transaksi akun brand."
        onOpenTopUp={HandleOpenNewTopUp}
        onOpenWithdrawal={() => setIsWithdrawalOpen(true)}
      />

      {/* Metric Cards (Saldo Aktif, Saldo Terkunci, Total Payout) */}
      <WalletMetricsCards items={metricItems} isLoading={isSummaryLoading} />

      {/* Active Pending Top-Up Banner (Draft-style) */}
      <BrandPendingTopUpBanner
        activeTopUps={activeTopUps}
        onResumeTopUp={HandleResumeTopUp}
      />

      {/* Active Pending Withdrawal Banner */}
      <WalletPendingWithdrawalBanner
        activeWithdrawals={activeWithdrawals}
        role="BRAND"
      />

      {/* Transaction History Section */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Riwayat Transaksi
          </h2>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => HandleSearchChange(e.target.value)}
                placeholder="Cari transaksi..."
                className="h-9 w-full pl-9 pr-8 text-xs rounded-xl border-border/60 bg-card text-foreground placeholder:text-muted-foreground shadow-xs transition-colors"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={HandleResetSearch}
                  aria-label="Hapus pencarian"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>

            {/* Filter button for type of transaction */}
            <WalletTransactionTypeFilter
              activeType={activeType}
              onTypeChange={HandleTypeChange}
              options={WALLET_TRANSACTION_TABS}
            />
          </div>
        </div>

        <WalletTransactionTable
          transactions={transactions}
          isLoading={isTransactionsLoading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          activeType={activeType}
          searchQuery={searchQuery}
          onResetSearch={HandleResetFilters}
        />
      </div>

      {/* Manual Top Up Dialog */}
      <BrandTopUpDialog
        open={isTopUpOpen}
        onOpenChange={HandleTopUpOpenChange}
        onTopUpSuccess={HandleTopUpSuccess}
        initialTopUp={selectedTopUp}
      />

      {/* Active Balance Withdrawal Dialog */}
      <WalletWithdrawalDialog
        open={isWithdrawalOpen}
        onOpenChange={setIsWithdrawalOpen}
        activeBalance={activeBalance}
        onWithdrawalSuccess={HandleWithdrawalSuccess}
        role="BRAND"
      />
    </div>
  );
}
