import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { TRANSACTION_TYPE_CONFIG } from '../constants';
import type { BrandTransactionTableProps } from '../types';
import { FormatDateIndonesian, FormatRupiah } from '../utils/wallet-format';
import { BrandTransactionEmptyState } from './BrandTransactionEmptyState';

/**
 * Transaction history table displaying finalized mutations, reference codes, dates, and amounts.
 * Purely dedicated to displaying completed ledger transactions (WalletTransaction) in calm, neutral styling.
 *
 * @param props - Component properties.
 * @returns Rendered transaction table element.
 */
export function BrandTransactionTable({
  transactions,
  isLoading,
  page,
  totalPages,
  onPageChange,
  searchQuery = '',
  onResetSearch,
  className,
}: BrandTransactionTableProps) {
  const hasAnyRows = transactions.length > 0;
  const isSearchActive = searchQuery.trim().length > 0;

  return (
    <Card className={cn('border-border/60 bg-card shadow-xs overflow-hidden', className)}>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="divide-y divide-border/40 p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between py-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        ) : !hasAnyRows ? (
          <div className="p-6">
            <BrandTransactionEmptyState
              hasFilter={isSearchActive}
              onResetFilter={onResetSearch}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-border/40 bg-muted/30 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 sm:px-6">Tanggal</th>
                  <th scope="col" className="px-4 py-3 sm:px-6">Kode</th>
                  <th scope="col" className="px-4 py-3 sm:px-6">Jenis Transaksi</th>
                  <th scope="col" className="px-4 py-3 sm:px-6">Deskripsi</th>
                  <th scope="col" className="px-4 py-3 text-left sm:px-6">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {transactions.map((txn) => {
                  const typeConfig = TRANSACTION_TYPE_CONFIG[txn.type] ?? {
                    label: txn.type,
                    sign: '',
                  };

                  return (
                    <tr key={txn.id} className="transition-colors hover:bg-muted/20">
                      {/* Tanggal */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground sm:px-6">
                        {FormatDateIndonesian(txn.transactionDate)}
                      </td>

                      {/* Kode */}
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs font-medium text-foreground sm:px-6">
                        {txn.referenceCode || '-'}
                      </td>

                      {/* Jenis Transaksi */}
                      <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium',
                            typeConfig.badgeClass ?? 'border-border/60 bg-muted/40 text-foreground',
                          )}>
                          {typeConfig.label}
                        </span>
                      </td>

                      {/* Deskripsi */}
                      <td
                        className="max-w-sm truncate px-4 py-3.5 text-xs text-muted-foreground sm:px-6"
                        title={txn.description}>
                        {txn.description}
                      </td>

                      {/* Saldo */}
                      <td
                        className={cn(
                          'whitespace-nowrap px-4 py-3.5 text-left font-medium tabular-nums sm:px-6',
                          typeConfig.sign === '+'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : typeConfig.sign === '-'
                              ? 'text-rose-500 dark:text-rose-400'
                              : 'text-foreground',
                        )}>
                        {typeConfig.sign} {FormatRupiah(txn.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {hasAnyRows && (
          <div className="flex items-center justify-between border-t border-border/40 px-4 py-3 sm:px-6">
            <span className="text-xs text-muted-foreground">
              Halaman {page} dari {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1 || isLoading}
                className="cursor-pointer text-xs h-8 rounded-lg border-border/60">
                <ChevronLeft className="mr-1 size-3.5" />
                Sebelumnya
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages || isLoading}
                className="cursor-pointer text-xs h-8 rounded-lg border-border/60">
                Selanjutnya
                <ChevronRight className="ml-1 size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
