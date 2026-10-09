import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { BrandTransactionEmptyStateProps } from '../types';

/**
 * Empty state component displayed when no transactions are found matching active filters.
 *
 * @param props - Component properties.
 * @returns Rendered empty state element.
 */
export function BrandTransactionEmptyState({
  hasFilter,
  onResetFilter,
  className,
}: BrandTransactionEmptyStateProps) {
  return (
    <Card className={cn('border-dashed border-border/70 bg-card/50 text-center shadow-none', className)}>
      <CardContent className="flex flex-col items-center justify-center p-8 sm:p-12 space-y-3">
        <div className="space-y-1 max-w-sm">
          <p className="text-sm font-semibold text-foreground">
            {hasFilter ? 'Tidak Ada Transaksi yang Cocok' : 'Belum Ada Riwayat Transaksi'}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {hasFilter
              ? 'Tidak ditemukan riwayat mutasi dana dengan filter yang Anda tentukan. Coba ubah kata kunci pencarian atau pilih kategori lain.'
              : 'Semua mutasi top up, alokasi pembayaran kampanye, dan refund sisa anggaran akan tercatat rapi di sini.'}
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
