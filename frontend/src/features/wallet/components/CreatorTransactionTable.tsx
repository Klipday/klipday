import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { TRANSACTION_TYPE_CONFIG } from '../constants';
import type { CreatorTransactionTableProps } from '../types';
import { FormatDateIndonesian, FormatNumber, FormatRupiah } from '../utils/wallet-format';
import { CreatorTransactionEmptyState } from './CreatorTransactionEmptyState';

/**
 * Mutation ledger table for Creator Wallet.
 * Enriched with campaign titles, verified view counts, CPM rates, and video links.
 *
 * @param props - Component configuration properties.
 * @returns Rendered mutation table element.
 */
export function CreatorTransactionTable({
  transactions,
  isLoading,
  page,
  totalPages,
  onPageChange,
  searchQuery = '',
  onResetSearch,
  className,
}: CreatorTransactionTableProps) {
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
            <CreatorTransactionEmptyState
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
                  <th scope="col" className="px-4 py-3 sm:px-6">Jenis Mutasi</th>
                  <th scope="col" className="px-4 py-3 sm:px-6">Detail & Sumber</th>
                  <th scope="col" className="px-4 py-3 text-right sm:px-6">Nominal</th>
                  <th scope="col" className="px-4 py-3 text-right sm:px-6">Saldo Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {transactions.map((txn) => {
                  const typeConfig = TRANSACTION_TYPE_CONFIG[txn.type] ?? {
                    label: txn.type,
                    sign: '',
                    amountClass: 'text-foreground font-semibold',
                    badgeClass: 'border-border/60 bg-muted/40 text-muted-foreground',
                  };

                  const isEarning = txn.type === 'CAMPAIGN_EARNING';

                  return (
                    <tr key={txn.id} className="transition-colors hover:bg-muted/20">
                      {/* Tanggal */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground sm:px-6">
                        {FormatDateIndonesian(txn.transactionDate)}
                      </td>

                      {/* Kode Mutasi */}
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs font-medium text-foreground sm:px-6">
                        {txn.referenceCode || '-'}
                      </td>

                      {/* Jenis Mutasi Badge */}
                      <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium',
                            typeConfig.badgeClass,
                          )}>
                          {typeConfig.label}
                        </span>
                      </td>

                      {/* Detail & Sumber Konteks */}
                      <td className="px-4 py-3.5 sm:px-6">
                        <div className="space-y-0.5 max-w-md">
                          <p className="font-medium text-foreground text-xs leading-snug">
                            {txn.campaignTitle || txn.description}
                          </p>
                          {isEarning && (
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                              {txn.verifiedViews !== null && (
                                <span className="font-mono text-foreground/80">
                                  {FormatNumber(txn.verifiedViews)} views
                                </span>
                              )}
                              {txn.cpmRate !== null && (
                                <span>
                                  CPM: {FormatRupiah(txn.cpmRate)}/1k
                                </span>
                              )}
                              {txn.videoUrl && (
                                <a
                                  href={txn.videoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline font-medium transition-colors">
                                  <span>Tonton Video</span>
                                  <ExternalLink className="size-3" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Nominal */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-right sm:px-6">
                        <span className={cn('tabular-nums font-semibold', typeConfig.amountClass)}>
                          {typeConfig.sign} {FormatRupiah(txn.amount)}
                        </span>
                      </td>

                      {/* Saldo Akhir */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-medium tabular-nums text-foreground/80 sm:px-6">
                        {FormatRupiah(txn.balanceAfter)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {hasAnyRows && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/40 px-4 py-3 sm:px-6">
            <p className="text-xs text-muted-foreground">
              Halaman <span className="font-medium text-foreground">{page}</span> dari{' '}
              <span className="font-medium text-foreground">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1 || isLoading}
                className="h-8 cursor-pointer text-xs">
                <ChevronLeft className="mr-1 size-3.5" />
                <span>Sebelumnya</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages || isLoading}
                className="h-8 cursor-pointer text-xs">
                <span>Berikutnya</span>
                <ChevronRight className="ml-1 size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
