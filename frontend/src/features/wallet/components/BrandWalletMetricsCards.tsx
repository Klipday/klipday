import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { BrandWalletMetricsCardsProps } from '../types';
import { FormatRupiah } from '../utils/wallet-format';

/**
 * Metric display cards for the Brand Wallet.
 * Clean, calm financial numbers: active balance, campaign allocation, and total creator payouts.
 *
 * @param props - Component properties.
 * @returns Rendered metric cards grid.
 */
export function BrandWalletMetricsCards({
  summary,
  isLoading,
  className,
}: BrandWalletMetricsCardsProps) {
  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="border-border/60 shadow-xs">
            <CardContent className="p-5 space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-7 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const activeBalance = summary?.metrics.activeBalance ?? 0;
  const lockedBalance = summary?.metrics.lockedBalance ?? 0;
  const totalCreatorPayout = summary?.metrics.totalCreatorPayout ?? 0;

  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {/* Saldo Aktif */}
      <Card className="border-border/60 bg-card shadow-xs">
        <CardContent className="p-5 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Saldo Aktif
          </p>
          <div className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl tabular-nums">
            {FormatRupiah(activeBalance)}
          </div>
        </CardContent>
      </Card>

      {/* Saldo Terkunci */}
      <Card className="border-border/60 bg-card shadow-xs">
        <CardContent className="p-5 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Saldo Terkunci
          </p>
          <div className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl tabular-nums">
            {FormatRupiah(lockedBalance)}
          </div>
        </CardContent>
      </Card>

      {/* Total Payout Kreator */}
      <Card className="border-border/60 bg-card shadow-xs">
        <CardContent className="p-5 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Total Payout Kreator
          </p>
          <div className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl tabular-nums">
            {FormatRupiah(totalCreatorPayout)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
