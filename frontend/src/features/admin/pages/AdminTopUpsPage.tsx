import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { Input } from '@/components/ui/input';
import {
  AdminTopUpEmptyState,
  AdminTopUpErrorState,
  AdminTopUpItemRow,
  AdminTopUpProofDialog,
  AdminTopUpReviewDialog,
  AdminTopUpSkeleton,
  AdminTopUpStatusTabs,
} from '../components';
import {
  UseAdminTopUpsQuery,
  UseReviewBrandTopUpMutation,
} from '../hooks';
import type {
  AdminTopUpItem,
  AdminTopUpReviewAction,
  AdminTopUpStatusFilter,
} from '../types';
import { VALID_TOPUP_FILTER_KEYS } from '../utils/formatters';

/**
 * Admin Brand Top-Up Verification Queue page (`/admin-dashboard/top-ups`).
 * Displays segmented status tabs, left-aligned search bar, paginated top-up request list,
 * receipt inspection dialog, and approval/rejection review workflow.
 *
 * @returns The rendered Admin Top-Up page.
 */
export function AdminTopUpsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Dialog states
  const [inspectingTopUp, setInspectingTopUp] = useState<AdminTopUpItem | null>(null);
  const [reviewingTopUp, setReviewingTopUp] = useState<AdminTopUpItem | null>(null);
  const [reviewDecision, setReviewDecision] = useState<AdminTopUpReviewAction | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const rawFilter = searchParams.get('filter') as AdminTopUpStatusFilter | null;
  const activeFilter: AdminTopUpStatusFilter =
    rawFilter && VALID_TOPUP_FILTER_KEYS.includes(rawFilter)
      ? rawFilter
      : 'SUBMITTED';

  const { data, isLoading, isError, error, refetch } = UseAdminTopUpsQuery({
    filter: activeFilter,
    search: debouncedSearch.trim() || undefined,
    page: 1,
    limit: 25,
  });

  const reviewMutation = UseReviewBrandTopUpMutation({
    onSuccess: () => {
      setReviewingTopUp(null);
      setReviewDecision(null);
    },
  });

  const HandleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('filter', 'SUBMITTED');
        next.delete('page');
        return next;
      },
      { replace: true },
    );
  };

  const HandleOpenProof = (topUp: AdminTopUpItem) => {
    setInspectingTopUp(topUp);
  };

  const HandleInitiateReview = (topUp: AdminTopUpItem, decision: AdminTopUpReviewAction) => {
    setReviewingTopUp(topUp);
    setReviewDecision(decision);
  };

  const HandleConfirmReview = (rejectionReason?: string) => {
    if (!reviewingTopUp || !reviewDecision) return;

    reviewMutation.mutate({
      id: reviewingTopUp.id,
      decision: reviewDecision,
      rejectionReason,
    });
  };

  const items = data?.items ?? [];
  const defaultCounts = {
    submitted: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    all: 0,
  };
  const counts = data?.counts ?? defaultCounts;

  const errorMessage =
    error instanceof Error
      ? error.message
      : 'Gagal memuat daftar antrean top up brand.';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Verifikasi Top Up Brand
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Tinjau dan verifikasi setoran saldo aktif dari brand via transfer bank manual
          sebelum dana dikreditkan ke dompet mereka.
        </p>
      </div>

      {/* Left-Aligned Segmented Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <AdminTopUpStatusTabs counts={counts} />

        <div className="relative w-full sm:w-80 md:w-96">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari kode referensi, nama brand, atau pengirim..."
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
      </div>

      {/* Queue Content State */}
      {isLoading ? (
        <AdminTopUpSkeleton count={5} />
      ) : isError ? (
        <AdminTopUpErrorState message={errorMessage} onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <AdminTopUpEmptyState
          filter={activeFilter}
          searchQuery={debouncedSearch}
          onResetFilters={HandleResetFilters}
        />
      ) : (
        <div className="space-y-3">
          {items.map((topUp) => (
            <AdminTopUpItemRow
              key={topUp.id}
              topUp={topUp}
              onOpenProof={HandleOpenProof}
              onReview={HandleInitiateReview}
            />
          ))}
        </div>
      )}

      {/* Proof Inspection Dialog */}
      <AdminTopUpProofDialog
        open={Boolean(inspectingTopUp)}
        onOpenChange={(open) => {
          if (!open) setInspectingTopUp(null);
        }}
        topUp={inspectingTopUp}
      />

      {/* Approval / Rejection Confirmation Dialog */}
      <AdminTopUpReviewDialog
        open={Boolean(reviewingTopUp && reviewDecision)}
        onOpenChange={(open) => {
          if (!open) {
            setReviewingTopUp(null);
            setReviewDecision(null);
          }
        }}
        topUp={reviewingTopUp}
        decision={reviewDecision}
        isPending={reviewMutation.isPending}
        onConfirm={HandleConfirmReview}
      />
    </div>
  );
}

export default AdminTopUpsPage;
