import { Skeleton } from '@/components/ui/skeleton';
import type { AdminTopUpSkeletonProps } from '../types';

/**
 * Loading skeleton list for the Admin Brand Top-Up verification queue.
 *
 * @param props - Component props containing optional skeleton count.
 * @returns The rendered skeleton list.
 */
export function AdminTopUpSkeleton({ count = 5 }: AdminTopUpSkeletonProps) {
  const placeholders = Array.from({ length: count }, (_, idx) => idx);

  return (
    <div className="space-y-3">
      {placeholders.map((idx) => (
        <div
          key={idx}
          className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20 rounded-md" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="space-y-1 text-right">
              <Skeleton className="h-4 w-28 ml-auto" />
              <Skeleton className="h-3 w-20 ml-auto" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24 rounded-md" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
