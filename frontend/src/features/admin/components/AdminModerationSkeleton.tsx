import { Skeleton } from '@/components/ui/skeleton';
import type { AdminModerationSkeletonProps } from '../types';

/**
 * Loading skeleton grid for the Admin Campaign Moderation queue page.
 *
 * @param props - Component props containing optional card count.
 * @returns The rendered skeleton grid.
 */
export function AdminModerationSkeleton({ count = 6 }: AdminModerationSkeletonProps) {
  const placeholders = Array.from({ length: count }, (_, idx) => idx);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {placeholders.map((idx) => (
        <div
          key={idx}
          className="flex flex-col justify-between rounded-xl border border-border/60 bg-card p-5 space-y-4"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-5 w-36 rounded-md" />
            </div>

            <div className="space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>

            <div className="grid grid-cols-2 divide-x divide-border/60 rounded-lg border border-border/60 bg-muted/20 p-2.5">
              <div className="pr-2 space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="pl-2.5 space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
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
