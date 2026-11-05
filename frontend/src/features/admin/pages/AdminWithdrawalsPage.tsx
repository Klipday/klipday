import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  AdminWithdrawalEmptyState,
  AdminWithdrawalErrorState,
  AdminWithdrawalItemRow,
  AdminWithdrawalKycDialog,
  AdminWithdrawalReviewDialog,
  AdminWithdrawalSkeleton,
  AdminWithdrawalStatusTabs,
} from '../components';
import {
  UseAdminWithdrawalsQuery,
  UseReviewAdminWithdrawalMutation,
} from '../hooks';
import type {
  AdminWithdrawalFilter,
  AdminWithdrawalItem,
  AdminWithdrawalReviewAction,
  AdminWithdrawalRoleFilter,
} from '../types';
import { VALID_WITHDRAWAL_FILTER_KEYS } from '../utils/formatters';

const ROLE_OPTIONS: { key: AdminWithdrawalRoleFilter; label: string }[] = [
  { key: 'ALL', label: 'Semua Role' },
  { key: 'CREATOR', label: 'Kreator' },
  { key: 'BRAND', label: 'Brand' },
];

/**
 * Admin Withdrawal Verification Queue page (`/admin-dashboard/withdrawals`).
 * Displays segmented status tabs, left-aligned search bar, role filter pills,
 * paginated withdrawal request list, KYC passbook inspection lightbox, and review/disbursement modal.
 *
 * @returns The rendered Admin Withdrawals page.
 */
export function AdminWithdrawalsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Dialog states
  const [inspectingWithdrawal, setInspectingWithdrawal] = useState<AdminWithdrawalItem | null>(null);
  const [reviewingWithdrawal, setReviewingWithdrawal] = useState<AdminWithdrawalItem | null>(null);
  const [reviewDecision, setReviewDecision] = useState<AdminWithdrawalReviewAction | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const rawFilter = searchParams.get('filter') as AdminWithdrawalFilter | null;
  const activeFilter: AdminWithdrawalFilter =
    rawFilter && VALID_WITHDRAWAL_FILTER_KEYS.includes(rawFilter)
      ? rawFilter
      : 'PENDING';

  const rawRole = searchParams.get('role') as AdminWithdrawalRoleFilter | null;
  const roleFilter: AdminWithdrawalRoleFilter =
    rawRole === 'CREATOR' || rawRole === 'BRAND' ? rawRole : 'ALL';

  const rawPage = searchParams.get('page');
  const page = Math.max(1, Number(rawPage) || 1);

  const { data, isLoading, isError, error, refetch } = UseAdminWithdrawalsQuery({
    filter: activeFilter,
    role: roleFilter,
    search: debouncedSearch.trim() || undefined,
    page,
    limit: 25,
  });

  const reviewMutation = UseReviewAdminWithdrawalMutation({
    onSuccess: () => {
      setReviewingWithdrawal(null);
      setReviewDecision(null);
    },
  });

  const HandleRoleChange = (nextRole: AdminWithdrawalRoleFilter) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (nextRole === 'ALL') {
          next.delete('role');
        } else {
          next.set('role', nextRole);
        }
        next.delete('page');
        return next;
      },
      { replace: true },
    );
  };

  const HandleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('filter', 'PENDING');
        next.delete('role');
        next.delete('page');
        return next;
      },
      { replace: true },
    );
  };

  const HandleOpenKyc = (withdrawal: AdminWithdrawalItem) => {
    setInspectingWithdrawal(withdrawal);
  };

  const HandleInitiateReview = (
    withdrawal: AdminWithdrawalItem,
    decision: AdminWithdrawalReviewAction,
  ) => {
    setReviewingWithdrawal(withdrawal);
    setReviewDecision(decision);
  };

  const HandleConfirmReview = (payload: {
    rejectionReason?: string;
    adminNote?: string;
    transferProofUrl?: string;
  }) => {
    if (!reviewingWithdrawal || !reviewDecision) return;

    reviewMutation.mutate({
      id: reviewingWithdrawal.id,
      decision: reviewDecision,
      rejectionReason: payload.rejectionReason,
      adminNote: payload.adminNote,
      transferProofUrl: payload.transferProofUrl,
    });
  };

  const items = data?.items ?? [];
  const defaultCounts = {
    pending: 0,
    cancellation: 0,
    approved: 0,
    rejected: 0,
    all: 0,
  };
  const counts = data?.counts ?? defaultCounts;

  const errorMessage =
    error instanceof Error
      ? error.message
      : 'Gagal memuat daftar antrean penarikan saldo.';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Verifikasi Penarikan Saldo (Withdraw)
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Tinjau dan verifikasi pencairan dana saldo aktif kreator dan brand ke rekening bank atau e-wallet tujuan.
        </p>
      </div>

      {/* Segmented Filter Tabs */}
      <div className="space-y-3">
        <AdminWithdrawalStatusTabs counts={counts} />

        {/* Search Bar & Role Filter Pills Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-80 md:w-96">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari kode referensi, nama pemohon, atau no. rek..."
              className="h-9 w-full pl-9 pr-8 rounded-xl bg-card border-border/60 text-xs sm:text-sm shadow-none"
            />
            {searchInput.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setDebouncedSearch('');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Quick Role Filter Pills */}
          <div className="inline-flex items-center rounded-lg border border-border/60 bg-card p-0.5 divide-x divide-border/40">
            {ROLE_OPTIONS.map((opt) => {
              const isSelected = roleFilter === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => HandleRoleChange(opt.key)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
                    'first:rounded-l-md last:rounded-r-md',
                    isSelected
                      ? 'bg-muted/70 text-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground',
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Queue Content State */}
      {isLoading ? (
        <AdminWithdrawalSkeleton count={5} />
      ) : isError ? (
        <AdminWithdrawalErrorState message={errorMessage} onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <AdminWithdrawalEmptyState
          filter={activeFilter}
          searchQuery={debouncedSearch}
          roleFilter={roleFilter}
          onResetFilters={HandleResetFilters}
        />
      ) : (
        <div className="space-y-3">
          {items.map((withdrawal) => (
            <AdminWithdrawalItemRow
              key={withdrawal.id}
              withdrawal={withdrawal}
              onOpenKyc={HandleOpenKyc}
              onReview={HandleInitiateReview}
            />
          ))}
        </div>
      )}

      {/* KYC Proof Lightbox Dialog */}
      <AdminWithdrawalKycDialog
        open={Boolean(inspectingWithdrawal)}
        onOpenChange={(open) => {
          if (!open) setInspectingWithdrawal(null);
        }}
        withdrawal={inspectingWithdrawal}
      />

      {/* Approval / Rejection Review Dialog */}
      <AdminWithdrawalReviewDialog
        open={Boolean(reviewingWithdrawal && reviewDecision)}
        onOpenChange={(open) => {
          if (!open) {
            setReviewingWithdrawal(null);
            setReviewDecision(null);
          }
        }}
        withdrawal={reviewingWithdrawal}
        decision={reviewDecision}
        isPending={reviewMutation.isPending}
        onConfirm={HandleConfirmReview}
      />
    </div>
  );
}

export default AdminWithdrawalsPage;
