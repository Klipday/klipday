import { Button } from '@/components/ui/button';
import type { AdminWithdrawalEmptyStateProps } from '../types';

/**
 * Contextual empty state card for the Admin Withdrawal verification queue.
 *
 * @param props - Component props containing filter, searchQuery, roleFilter, and onResetFilters callback.
 * @returns The rendered empty state component.
 */
export function AdminWithdrawalEmptyState({
  filter,
  searchQuery,
  roleFilter,
  onResetFilters,
}: AdminWithdrawalEmptyStateProps) {
  const hasFilters =
    filter !== 'PENDING' || roleFilter !== 'ALL' || searchQuery.trim().length > 0;

  let descriptionText =
    'Saat ini tidak ada permintaan penarikan saldo yang perlu diproses.';
  if (searchQuery.trim().length > 0) {
    descriptionText = `Tidak ditemukan permintaan penarikan saldo yang cocok dengan kata kunci "${searchQuery}".`;
  } else if (filter === 'CANCELLATION') {
    descriptionText =
      'Saat ini tidak ada pengajuan pembatalan penarikan saldo dari kreator atau brand.';
  } else if (filter === 'APPROVED') {
    descriptionText = 'Belum ada permintaan penarikan saldo yang telah selesai ditransfer.';
  } else if (filter === 'REJECTED') {
    descriptionText = 'Belum ada permintaan penarikan saldo yang ditolak atau dibatalkan.';
  } else if (filter === 'ALL') {
    descriptionText = 'Belum ada riwayat permintaan penarikan saldo.';
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-card px-6 py-14 text-center">
      <h3 className="text-sm font-semibold tracking-tight text-foreground">
        Tidak ada permintaan penarikan saldo
      </h3>
      <p className="mt-1.5 max-w-md text-xs text-muted-foreground leading-relaxed">
        {descriptionText}
      </p>
      {hasFilters && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onResetFilters}
          className="mt-4 h-8 text-xs cursor-pointer"
        >
          Reset Filter
        </Button>
      )}
    </div>
  );
}
