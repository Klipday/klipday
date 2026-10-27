import { Button } from '@/components/ui/button';
import type { AdminModerationEmptyStateProps } from '../types';

/**
 * Contextual empty state card for the Admin Campaign Moderation queue.
 *
 * @param props - Component props containing activeFilter, searchQuery, and onResetFilters callback.
 * @returns The rendered empty state component.
 */
export function AdminModerationEmptyState({
  activeFilter,
  searchQuery,
  onResetFilters,
}: AdminModerationEmptyStateProps) {
  const hasFilters = activeFilter !== 'IN_REVIEW' || searchQuery.trim().length > 0;

  let descriptionText = 'Saat ini tidak ada kampanye baru yang menunggu peninjauan moderasi.';
  if (searchQuery.trim().length > 0) {
    descriptionText = `Tidak ditemukan kampanye yang cocok dengan kata kunci "${searchQuery}".`;
  } else if (activeFilter === 'REVISION') {
    descriptionText = 'Saat ini tidak ada kampanye yang sedang dalam status revisi brand.';
  } else if (activeFilter === 'ACTIVE') {
    descriptionText = 'Belum ada kampanye aktif yang berjalan di marketplace.';
  } else if (activeFilter === 'REJECTED') {
    descriptionText = 'Belum ada kampanye yang ditolak.';
  } else if (activeFilter === 'ALL') {
    descriptionText = 'Belum ada data kampanye.';
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-card px-6 py-14 text-center">
      <h3 className="text-sm font-semibold tracking-tight text-foreground">
        Tidak ada kampanye pada kategori ini
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
