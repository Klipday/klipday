import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  BrandPendingTopUpBanner,
  BrandPendingWithdrawalBanner,
  BrandTopUpDialog,
  BrandTransactionTable,
  BrandTransactionTypeFilter,
  BrandWalletHeader,
  BrandWalletMetricsCards,
  BrandWithdrawalDialog,
} from '../components';
import {
  UseActiveTopUpRequestsQuery,
  UseActiveWithdrawalRequestsQuery,
  UseBrandTransactionsQuery,
  UseBrandWalletSummaryQuery,
} from '../hooks';
import type { TopUpRequestRecord, WalletTransactionType } from '../types';

/**
 * Pure orchestrator page for the Brand Wallet.
 * Composes wallet balance metrics, transaction filters, mutation ledger table,
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

  const {
    data: transactionsData,
    isLoading: isTransactionsLoading,
    refetch: refetchTransactions,
  } = UseBrandTransactionsQuery({
    type: activeType,
    page,
    limit: 10,
    search: debouncedSearch.trim() || undefined,
  });

  const HandleTypeChange = (nextType: WalletTransactionType) => {
    setActiveType(nextType);
    setPage(1);
  };

  const HandleSearchChange = (nextSearch: string) => {
    setSearchQuery(nextSearch);
  };

  const HandleOpenNewTopUp = () => {
    setSelectedTopUp(null);
    setIsTopUpOpen(true);
  };

  const HandleResumeTopUp = (topUp: TopUpRequestRecord) => {
    setSelectedTopUp(topUp);
    setIsTopUpOpen(true);
  };

  const HandleTopUpOpenChange = (open: boolean) => {
    setIsTopUpOpen(open);
    if (!open) {
      setSelectedTopUp(null);
    }
  };

  const HandleTopUpSuccess = () => {
    refetchSummary();
    refetchTransactions();
    refetchActiveTopUps();
    refetchActiveWithdrawals();
  };

  const HandleWithdrawalSuccess = () => {
    refetchSummary();
    refetchTransactions();
    refetchActiveWithdrawals();
  };

  const transactions = transactionsData?.transactions ?? [];
  const totalPages = transactionsData?.pagination.totalPages ?? 1;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <BrandWalletHeader
        onOpenTopUp={HandleOpenNewTopUp}
        onOpenWithdrawal={() => setIsWithdrawalOpen(true)}
      />

      {/* Metric Cards (Saldo Aktif, Saldo Terkunci, Total Payout) */}
      <BrandWalletMetricsCards summary={summary} isLoading={isSummaryLoading} />

      {/* Active Pending Top-Up Banner (Draft-style) */}
      <BrandPendingTopUpBanner
        activeTopUps={activeTopUps}
        onResumeTopUp={HandleResumeTopUp}
      />

      {/* Active Pending Withdrawal Banner */}
      <BrandPendingWithdrawalBanner
        activeWithdrawals={activeWithdrawals}
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
                  onClick={() => HandleSearchChange('')}
                  aria-label="Hapus pencarian"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>

            {/* Filter button for type of transaction */}
            <BrandTransactionTypeFilter
              activeType={activeType}
              onTypeChange={HandleTypeChange}
            />
          </div>
        </div>

        <BrandTransactionTable
          transactions={transactions}
          isLoading={isTransactionsLoading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          searchQuery={searchQuery}
          onResetSearch={() => HandleSearchChange('')}
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
      <BrandWithdrawalDialog
        open={isWithdrawalOpen}
        onOpenChange={setIsWithdrawalOpen}
        activeBalance={summary?.metrics.activeBalance ?? 0}
        onWithdrawalSuccess={HandleWithdrawalSuccess}
      />
    </div>
  );
}

