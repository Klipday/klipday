import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CreatorTransactionEmptyStateProps } from '../types';

/**
 * Empty state component displayed when creator has no transactions matching active filters.
 *
 * @param props - Component configuration properties.
 * @returns Rendered empty state card element.
 */
export function CreatorTransactionEmptyState({
  hasFilter,
  onResetFilter,
  className,
}: CreatorTransactionEmptyStateProps) {
  return (
    <Card className={cn('border-dashed border-border/70 bg-card/50 text-center shadow-none', className)}>
      <CardContent className="flex flex-col items-center justify-center p-8 sm:p-12 space-y-3">
        <div className="space-y-1 max-w-sm">
          <p className="text-sm font-semibold text-foreground">
            {hasFilter ? 'Tidak Ada Mutasi yang Cocok' : 'Belum Ada Riwayat Mutasi'}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {hasFilter
              ? 'Tidak ditemukan riwayat mutasi dengan filter yang Anda tentukan. Coba ubah kata kunci pencarian atau pilih kategori lain.'
              : 'Semua pendapatan views video kampanye dan mutasi penarikan saldo Anda akan tercatat otomatis di sini.'}
          </p>
        </div>

        {hasFilter && onResetFilter && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetFilter}
            className="cursor-pointer text-xs font-medium">
            Reset Filter
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
