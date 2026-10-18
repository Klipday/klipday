import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { WalletMetricsCardsProps } from '../types';
import { FormatRupiah } from '../utils/wallet-format';

/**
 * Shared financial metric display cards for Brand and Creator Wallets.
 * Renders a 3-column financial KPI grid in a clean, neutral layout.
 *
 * @param props - Component properties containing metric items and loading state.
 * @returns Rendered metric cards grid.
 */
export function WalletMetricsCards({
  items,
  isLoading,
  className,
}: WalletMetricsCardsProps) {
  const gridClassName = cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3', className);

  if (isLoading) {
    const skeletonIndices = Array.from({ length: 3 });

    return (
      <div className={gridClassName}>
        {skeletonIndices.map((_, index) => (
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

  return (
    <div className={gridClassName}>
      {items.map((item) => {
        const formattedValue = FormatRupiah(item.value);

        return (
          <Card key={item.label} className="border-border/60 bg-card shadow-xs">
            <CardContent className="p-5 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                {item.label}
              </p>
              <div className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl tabular-nums">
                {formattedValue}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
