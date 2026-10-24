import { Button } from '@/components/ui/button';
import type { AdminSettlementsEmptyStateProps } from '../types';

/**
 * Contextual empty state card for the Admin Settlement queue.
 *
 * @param props - Component props containing activeFilter, searchQuery, and onResetFilters callback.
 * @returns The rendered empty state component.
 */
export function AdminSettlementsEmptyState({
  activeFilter,
  searchQuery,
  onResetFilters,
}: AdminSettlementsEmptyStateProps) {
  const hasFilters = activeFilter !== 'NEED_SETTLEMENT' || searchQuery.trim().length > 0;

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-card px-6 py-14 text-center">
      <h3 className="text-sm font-semibold tracking-tight text-foreground">
        Tidak ada kampanye pada kategori ini
      </h3>
      <p className="mt-1.5 max-w-md text-xs text-muted-foreground leading-relaxed">
        {searchQuery.trim().length > 0
          ? `Tidak ditemukan kampanye yang cocok dengan kata kunci "${searchQuery}".`
          : activeFilter === 'FINISHED'
            ? 'Belum ada kampanye yang telah diselesaikan proses settlement-nya.'
            : 'Saat ini belum ada kampanye aktif yang mencapai 100% batas anggaran atau melewati batas waktu berakhir.'}
      </p>
      {hasFilters && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onResetFilters}
          className="mt-4 h-8 text-xs"
        >
          Reset Filter
        </Button>
      )}
    </div>
  );
}
