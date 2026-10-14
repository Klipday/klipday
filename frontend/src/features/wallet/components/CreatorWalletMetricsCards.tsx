import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { CreatorWalletMetricsCardsProps } from '../types';
import { FormatRupiah } from '../utils/wallet-format';

/**
 * Financial metrics display cards for the Creator Wallet.
 * Features 3 clean, calm financial metrics: Saldo Siap Ditarik, Total Pendapatan Video, and Total Dicairkan.
 *
 * @param props - Component properties.
 * @returns Rendered metric cards grid.
 */
export function CreatorWalletMetricsCards({
  summary,
  isLoading,
  className,
}: CreatorWalletMetricsCardsProps) {
  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="border-border/60 shadow-xs">
            <CardContent className="p-5 space-y-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-7 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const activeBalance = summary?.balance ?? 0;
  const totalEarnings = summary?.metrics.totalEarnings ?? 0;
  const totalWithdrawn = summary?.metrics.totalWithdrawn ?? 0;

  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {/* Saldo Siap Ditarik */}
      <Card className="border-border/60 bg-card shadow-xs">
        <CardContent className="p-5 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              Saldo Siap Ditarik
            </p>
            <span className="text-[10px] font-medium text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md border border-border/40">
              Min. Rp 50.000
            </span>
          </div>
          <div className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl tabular-nums">
            {FormatRupiah(activeBalance)}
          </div>
        </CardContent>
      </Card>

      {/* Total Pendapatan Video */}
      <Card className="border-border/60 bg-card shadow-xs">
        <CardContent className="p-5 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Total Pendapatan Video
          </p>
          <div className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl tabular-nums">
            {FormatRupiah(totalEarnings)}
          </div>
        </CardContent>
      </Card>

      {/* Total Dicairkan */}
      <Card className="border-border/60 bg-card shadow-xs">
        <CardContent className="p-5 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Total Dicairkan
          </p>
          <div className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl tabular-nums">
            {FormatRupiah(totalWithdrawn)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
