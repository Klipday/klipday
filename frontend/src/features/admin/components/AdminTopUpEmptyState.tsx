import { Button } from '@/components/ui/button';
import type { AdminTopUpEmptyStateProps } from '../types';

/**
 * Contextual empty state card for the Admin Top-Up Verification queue.
 *
 * @param props - Component props containing filter, searchQuery, and onResetFilters callback.
 * @returns The rendered empty state component.
 */
export function AdminTopUpEmptyState({
  filter,
  searchQuery,
  onResetFilters,
}: AdminTopUpEmptyStateProps) {
  const hasFilters = filter !== 'SUBMITTED' || searchQuery.trim().length > 0;

  let descriptionText = 'Saat ini tidak ada permintaan top up yang menunggu verifikasi admin.';
  if (searchQuery.trim().length > 0) {
    descriptionText = `Tidak ditemukan permintaan top up yang cocok dengan kata kunci "${searchQuery}".`;
  } else if (filter === 'PENDING') {
    descriptionText = 'Saat ini tidak ada permintaan top up yang menunggu transfer dari brand.';
  } else if (filter === 'APPROVED') {
    descriptionText = 'Belum ada permintaan top up yang telah disetujui.';
  } else if (filter === 'REJECTED') {
    descriptionText = 'Belum ada permintaan top up yang ditolak.';
  } else if (filter === 'ALL') {
    descriptionText = 'Belum ada data permintaan top up saldo.';
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-card px-6 py-14 text-center">
      <h3 className="text-sm font-semibold tracking-tight text-foreground">
        Tidak ada permintaan top up
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
