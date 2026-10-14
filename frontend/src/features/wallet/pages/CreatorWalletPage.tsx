import { useEffect, useState } from 'react';
import { Search, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AddPayoutAccountDialog,
  CreatorPayoutAccountsSection,
  CreatorPendingWithdrawalBanner,
  CreatorSimulateEarningDialog,
  CreatorTransactionTable,
  CreatorTransactionTypeFilter,
  CreatorWalletHeader,
  CreatorWalletMetricsCards,
  CreatorWithdrawalDialog,
} from '../components';
import {
  UseActiveCreatorWithdrawalsQuery,
  UseCreatorPayoutAccountsQuery,
  UseCreatorTransactionsQuery,
  UseCreatorWalletSummaryQuery,
  UseDeleteCreatorPayoutAccountMutation,
  UseRequestCreatorWithdrawalCancellationMutation,
  UseSetPrimaryCreatorPayoutAccountMutation,
} from '../hooks';

/**
 * Pure orchestrator page for Creator Wallet / Pendapatan.
 * Composes wallet balance metrics, in-context payout accounts (KYC),
 * transaction mutations ledger with view contexts, and withdrawal dialogs.
 *
 * @returns Rendered Creator Wallet page.
 */
export default function CreatorWalletPage() {
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);

  const [activeType, setActiveType] = useState<'ALL' | 'CAMPAIGN_EARNING' | 'WITHDRAWAL'>('ALL');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // 300ms debounce on search query
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

  // Queries
  const {
    data: summary,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = UseCreatorWalletSummaryQuery();

  const {
    data: payoutAccounts = [],
    isLoading: isAccountsLoading,
    refetch: refetchAccounts,
  } = UseCreatorPayoutAccountsQuery();

  const {
    data: activeWithdrawals = [],
    refetch: refetchActiveWithdrawals,
  } = UseActiveCreatorWithdrawalsQuery();

  const {
    data: transactionsData,
    isLoading: isTransactionsLoading,
    refetch: refetchTransactions,
  } = UseCreatorTransactionsQuery({
    type: activeType,
    page,
    limit: 10,
    search: debouncedSearch.trim() || undefined,
  });

  // Mutations
  const setPrimaryMutation = UseSetPrimaryCreatorPayoutAccountMutation();
  const deleteAccountMutation = UseDeleteCreatorPayoutAccountMutation();
  const cancelWithdrawalMutation = UseRequestCreatorWithdrawalCancellationMutation();

  const HandleTypeChange = (nextType: 'ALL' | 'CAMPAIGN_EARNING' | 'WITHDRAWAL') => {
    setActiveType(nextType);
    setPage(1);
  };

  const HandleSearchChange = (val: string) => {
    setSearchQuery(val);
  };

  const HandleResetSearch = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setPage(1);
  };

  const HandleWithdrawalSuccess = () => {
    refetchSummary();
    refetchTransactions();
    refetchActiveWithdrawals();
  };

  const HandleAccountSuccess = () => {
    refetchAccounts();
  };

  const HandleSetPrimary = (accountId: string) => {
    setPrimaryMutation.mutate(accountId);
  };

  const HandleDeleteAccount = (accountId: string) => {
    deleteAccountMutation.mutate(accountId);
  };

  const HandleCancelWithdrawal = (withdrawalId: string) => {
    cancelWithdrawalMutation.mutate({ withdrawalId });
  };

  const verifiedAccounts = payoutAccounts.filter((acc) => acc.verificationStatus === 'VERIFIED');
  const transactions = transactionsData?.transactions ?? [];
  const totalPages = transactionsData?.pagination.totalPages ?? 1;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CreatorWalletHeader
          onOpenWithdrawal={() => setIsWithdrawalOpen(true)}
          hasVerifiedAccount={verifiedAccounts.length > 0}
          className="flex-1"
        />
        {/* Sandbox simulation shortcut for QA testing */}
        <div className="self-end sm:self-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsSimulateOpen(true)}
            className="cursor-pointer text-xs border-dashed border-border/80 text-muted-foreground hover:text-foreground">
            <Sparkles className="mr-1.5 size-3.5 text-primary" />
            <span>Simulasi QA</span>
          </Button>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <CreatorWalletMetricsCards summary={summary} isLoading={isSummaryLoading} />

      {/* Active Pending Withdrawals Banner */}
      <CreatorPendingWithdrawalBanner
        activeWithdrawals={activeWithdrawals}
        onCancelRequest={HandleCancelWithdrawal}
      />

      {/* In-Context Payout Accounts (KYC) Management */}
      <CreatorPayoutAccountsSection
        accounts={payoutAccounts}
        isLoading={isAccountsLoading}
        onAddNewAccount={() => setIsAddAccountOpen(true)}
        onSetPrimary={HandleSetPrimary}
        onDeleteAccount={HandleDeleteAccount}
      />

      {/* Transaction Mutations Section */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Riwayat Mutasi & Pendapatan Video
            </h2>
            <p className="text-xs text-muted-foreground">
              Daftar kredit pendapatan penayangan video terverifikasi dan riwayat pencairan saldo.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari kode atau judul kampanye..."
              value={searchQuery}
              onChange={(e) => HandleSearchChange(e.target.value)}
              className="h-9 rounded-xl pl-8.5 pr-8 text-xs border-border/60 bg-card"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={HandleResetSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
                <span className="sr-only">Hapus pencarian</span>
              </button>
            )}
          </div>
        </div>

        {/* Segmented Type Filter */}
        <CreatorTransactionTypeFilter
          activeType={activeType}
          onTypeChange={HandleTypeChange}
        />

        {/* Mutation Table */}
        <CreatorTransactionTable
          transactions={transactions}
          isLoading={isTransactionsLoading}
          page={page}
          totalPages={totalPages}
          onPageChange={(nextPage) => setPage(nextPage)}
          searchQuery={debouncedSearch}
          onResetSearch={HandleResetSearch}
        />
      </div>

      {/* Dialogs */}
      <CreatorWithdrawalDialog
        open={isWithdrawalOpen}
        onOpenChange={setIsWithdrawalOpen}
        activeBalance={summary?.balance ?? 0}
        payoutAccounts={payoutAccounts}
        onWithdrawalSuccess={HandleWithdrawalSuccess}
        onAddNewAccount={() => setIsAddAccountOpen(true)}
      />

      <AddPayoutAccountDialog
        open={isAddAccountOpen}
        onOpenChange={setIsAddAccountOpen}
        existingAccountsCount={payoutAccounts.length}
        role="CREATOR"
        onSuccess={HandleAccountSuccess}
      />

      <CreatorSimulateEarningDialog
        open={isSimulateOpen}
        onOpenChange={setIsSimulateOpen}
        onSuccess={() => {
          refetchSummary();
          refetchTransactions();
        }}
      />
    </div>
  );
}
