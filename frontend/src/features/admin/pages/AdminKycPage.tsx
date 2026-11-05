import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  AdminKycEmptyState,
  AdminKycErrorState,
  AdminKycItemRow,
  AdminKycProofDialog,
  AdminKycReviewDialog,
  AdminKycSkeleton,
  AdminKycStatusTabs,
} from '../components';
import { UseAdminKycQuery, UseReviewAdminKycMutation } from '../hooks';
import type {
  AdminKycFilter,
  AdminKycItem,
  AdminKycReviewAction,
  AdminKycRoleFilter,
} from '../types';
import { ADMIN_KYC_ROLE_OPTIONS, VALID_KYC_FILTER_KEYS } from '../utils/formatters';

/**
 * Admin KYC Verification Queue page orchestrator (`/admin-dashboard/kyc`).
 * Composes segmented verification status tabs, left-aligned search bar, role filter pills,
 * paginated KYC payout account list, proof document lightbox, and approve/reject review dialog.
 *
 * @returns The rendered Admin KYC verification page.
 */
export function AdminKycPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Proof inspection dialog state
  const [isProofDialogOpen, setIsProofDialogOpen] = useState(false);
  const [inspectingItem, setInspectingItem] = useState<AdminKycItem | null>(null);
  const proofCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Review confirmation dialog state
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewingItem, setReviewingItem] = useState<AdminKycItem | null>(null);
  const [reviewDecision, setReviewDecision] = useState<AdminKycReviewAction | null>(null);
  const [reviewSessionKey, setReviewSessionKey] = useState(0);
  const reviewCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchInput === debouncedSearch) {
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setSearchParams(
        (prev) => {
          if (!prev.has('page')) {
            return prev;
          }
          const next = new URLSearchParams(prev);
          next.delete('page');
          return next;
        },
        { replace: true },
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, debouncedSearch, setSearchParams]);

  useEffect(() => {
    return () => {
      if (proofCloseTimerRef.current) {
        clearTimeout(proofCloseTimerRef.current);
      }
      if (reviewCloseTimerRef.current) {
        clearTimeout(reviewCloseTimerRef.current);
      }
    };
  }, []);

  const rawFilter = searchParams.get('filter') as AdminKycFilter | null;
  const activeFilter: AdminKycFilter =
    rawFilter && VALID_KYC_FILTER_KEYS.includes(rawFilter) ? rawFilter : 'PENDING';

  const rawRole = searchParams.get('role') as AdminKycRoleFilter | null;
  const roleFilter: AdminKycRoleFilter =
    rawRole === 'CREATOR' || rawRole === 'BRAND' ? rawRole : 'ALL';

  const rawPage = searchParams.get('page');
  const parsedPage = rawPage !== null ? Number(rawPage) : 1;
  const page = Number.isFinite(parsedPage) ? Math.max(1, Math.floor(parsedPage)) : 1;

  const { data, isLoading, isError, error, refetch } = UseAdminKycQuery({
    filter: activeFilter,
    role: roleFilter,
    search: debouncedSearch.trim() || undefined,
    page,
    limit: 25,
  });

  const isOutOfBoundsPage = Boolean(
    !isLoading && !isError && data && page > data.pagination.totalPages,
  );

  useEffect(() => {
    if (!isOutOfBoundsPage || !data) {
      return;
    }

    const clampedPage = Math.max(1, data.pagination.totalPages);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (clampedPage <= 1) {
          next.delete('page');
        } else {
          next.set('page', String(clampedPage));
        }
        return next;
      },
      { replace: true },
    );
  }, [isOutOfBoundsPage, data, setSearchParams]);

  /**
   * Closes the review dialog while keeping selected state mounted briefly for exit animations.
   *
   * @returns void
   */
  const CloseReviewDialogCleanly = (): void => {
    setIsReviewDialogOpen(false);
    if (reviewCloseTimerRef.current) {
      clearTimeout(reviewCloseTimerRef.current);
    }
    reviewCloseTimerRef.current = setTimeout(() => {
      setReviewingItem(null);
      setReviewDecision(null);
    }, 200);
  };

  const reviewMutation = UseReviewAdminKycMutation();

  /**
   * Updates the search keyword input; pagination resets together with the debounced search commit.
   *
   * @param nextValue - Next search input string.
   * @returns void
   */
  const HandleSearchInputChange = (nextValue: string): void => {
    setSearchInput(nextValue);
  };

  /**
   * Clears the search input immediately and resets pagination to page 1.
   *
   * @returns void
   */
  const HandleClearSearch = (): void => {
    setSearchInput('');
    setDebouncedSearch('');
    if (searchParams.has('page')) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('page');
          return next;
        },
        { replace: true },
      );
    }
  };

  /**
   * Updates the role filter pill (`ALL`, `CREATOR`, `BRAND`) and resets pagination.
   *
   * @param nextRole - Selected role filter value.
   * @returns void
   */
  const HandleRoleChange = (nextRole: AdminKycRoleFilter): void => {
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

  /**
   * Navigates to a target page number in the KYC queue.
   *
   * @param targetPage - Destination 1-indexed page number.
   * @returns void
   */
  const HandlePageChange = (targetPage: number): void => {
    const safePage = Number.isFinite(targetPage) ? Math.max(1, Math.floor(targetPage)) : 1;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (safePage <= 1) {
          next.delete('page');
        } else {
          next.set('page', String(safePage));
        }
        return next;
      },
      { replace: true },
    );
  };

  /**
   * Resets status tab, role filter, search query, and pagination to default `PENDING` view.
   *
   * @returns void
   */
  const HandleResetFilters = (): void => {
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

  /**
   * Opens the KYC proof document lightbox modal for a specific item.
   *
   * @param item - Target KYC submission item.
   * @returns void
   */
  const HandleOpenProof = (item: AdminKycItem): void => {
    if (proofCloseTimerRef.current) {
      clearTimeout(proofCloseTimerRef.current);
    }
    setInspectingItem(item);
    setIsProofDialogOpen(true);
  };

  /**
   * Handles open/close transitions for the proof inspection dialog.
   *
   * @param open - Next open boolean state.
   * @returns void
   */
  const HandleProofOpenChange = (open: boolean): void => {
    setIsProofDialogOpen(open);
    if (!open) {
      if (proofCloseTimerRef.current) {
        clearTimeout(proofCloseTimerRef.current);
      }
      proofCloseTimerRef.current = setTimeout(() => {
        setInspectingItem(null);
      }, 200);
    }
  };

  /**
   * Opens the review confirmation modal for approving or rejecting a KYC item.
   *
   * @param item - Target KYC submission item.
   * @param decision - Selected review action ('APPROVE' or 'REJECT').
   * @returns void
   */
  const HandleInitiateReview = (
    item: AdminKycItem,
    decision: AdminKycReviewAction,
  ): void => {
    if (reviewCloseTimerRef.current) {
      clearTimeout(reviewCloseTimerRef.current);
    }
    setReviewSessionKey((prev) => prev + 1);
    setReviewingItem(item);
    setReviewDecision(decision);
    setIsReviewDialogOpen(true);
  };

  /**
   * Handles open/close transitions for the review confirmation dialog.
   *
   * @param open - Next open boolean state.
   * @returns void
   */
  const HandleReviewOpenChange = (open: boolean): void => {
    if (!open) {
      if (reviewMutation.isPending) {
        return;
      }
      CloseReviewDialogCleanly();
    } else {
      setIsReviewDialogOpen(true);
    }
  };

  /**
   * Executes the review mutation for the active KYC submission.
   *
   * @param rejectionReason - Optional rejection reason when decision is 'REJECT'.
   * @returns void
   */
  const HandleConfirmReview = (rejectionReason?: string): void => {
    if (!reviewingItem || !reviewDecision) {
      return;
    }

    reviewMutation.mutate(
      {
        id: reviewingItem.id,
        decision: reviewDecision,
        rejectionReason,
      },
      {
        onSuccess: () => {
          CloseReviewDialogCleanly();
        },
      },
    );
  };

  const items = data?.items ?? [];
  const defaultCounts = {
    pending: 0,
    verified: 0,
    rejected: 0,
    all: 0,
  };
  const counts = data?.counts ?? defaultCounts;
  const totalPages = data?.pagination.totalPages ?? 1;

  const errorMessage =
    error instanceof Error
      ? error.message
      : 'Gagal memuat daftar antrean verifikasi rekening KYC.';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Verifikasi Identitas &amp; Rekening (KYC)
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Periksa kesesuaian identitas pengguna dengan foto bukti buku tabungan atau akun
          e-wallet sebelum mengizinkan penarikan saldo.
        </p>
      </div>

      {/* Left-Aligned Segmented Status Tabs & Search + Role Filter Bar */}
      <div className="space-y-3">
        <AdminKycStatusTabs counts={counts} />

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-80 md:w-96">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => HandleSearchInputChange(e.target.value)}
              placeholder="Cari nama pemilik rekening, no. rek, bank, atau email..."
              className="h-9 w-full pl-9 pr-8 rounded-xl bg-card border-border/60 text-xs sm:text-sm shadow-none"
            />
            {searchInput.length > 0 && (
              <button
                type="button"
                onClick={HandleClearSearch}
                aria-label="Hapus pencarian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Role Segment Filter Pills */}
          <div className="inline-flex items-center rounded-lg border border-border/60 bg-card p-0 overflow-hidden divide-x divide-border/50">
            {ADMIN_KYC_ROLE_OPTIONS.map((opt) => {
              const isSelected = roleFilter === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => HandleRoleChange(opt.key)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
                    'first:rounded-l-[7px] last:rounded-r-[7px]',
                    isSelected
                      ? 'bg-muted/70 text-foreground font-semibold'
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
      {isLoading || isOutOfBoundsPage ? (
        <AdminKycSkeleton count={5} />
      ) : isError ? (
        <AdminKycErrorState message={errorMessage} onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <AdminKycEmptyState
          filter={activeFilter}
          searchQuery={debouncedSearch}
          roleFilter={roleFilter}
          page={page}
          onResetFilters={HandleResetFilters}
        />
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {items.map((item) => (
              <AdminKycItemRow
                key={item.id}
                item={item}
                onOpenProof={HandleOpenProof}
                onReview={HandleInitiateReview}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/40 pt-4">
              <span className="text-xs text-muted-foreground">
                Halaman <strong className="font-medium text-foreground">{page}</strong> dari{' '}
                <strong className="font-medium text-foreground">{totalPages}</strong>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => HandlePageChange(page - 1)}
                  className="h-8 gap-1 text-xs cursor-pointer"
                >
                  <ChevronLeft className="size-3.5" />
                  <span>Sebelumnya</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => HandlePageChange(page + 1)}
                  className="h-8 gap-1 text-xs cursor-pointer"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KYC Proof Document Lightbox Dialog */}
      <AdminKycProofDialog
        open={isProofDialogOpen}
        onOpenChange={HandleProofOpenChange}
        item={inspectingItem}
      />

      {/* Approve / Reject Review Confirmation Dialog */}
      <AdminKycReviewDialog
        open={isReviewDialogOpen}
        onOpenChange={HandleReviewOpenChange}
        item={reviewingItem}
        decision={reviewDecision}
        isPending={reviewMutation.isPending}
        sessionKey={reviewSessionKey}
        onConfirm={HandleConfirmReview}
      />
    </div>
  );
}

export default AdminKycPage;
