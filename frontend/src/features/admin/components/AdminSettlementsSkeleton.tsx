import { Skeleton } from '@/components/ui/skeleton';
import type { AdminSettlementsSkeletonProps } from '../types';

/**
 * Loading skeleton grid for the Admin Settlement queue page.
 *
 * @param props - Component props containing optional card count.
 * @returns The rendered skeleton grid.
 */
export function AdminSettlementsSkeleton({ count = 6 }: AdminSettlementsSkeletonProps) {
  const placeholders = Array.from({ length: count }, (_, idx) => idx);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {placeholders.map((idx) => (
        <div
          key={idx}
          className="flex flex-col justify-between rounded-xl border border-border/60 bg-card p-5 space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-5 w-32 rounded-md" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3.5 w-36" />
              </div>
              <Skeleton className="h-1 w-full rounded-full" />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border/40 pt-3">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
