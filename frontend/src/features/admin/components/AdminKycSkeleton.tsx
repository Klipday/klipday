import { Skeleton } from '@/components/ui/skeleton';
import type { AdminKycSkeletonProps } from '../types';

/**
 * Loading skeleton list for the Admin KYC verification queue.
 *
 * @param props - Component props containing optional skeleton row count.
 * @returns The rendered skeleton placeholder list.
 */
export function AdminKycSkeleton({ count = 5 }: AdminKycSkeletonProps) {
  const placeholders = Array.from({ length: count }, (_, idx) => idx);

  return (
    <div className="space-y-3">
      {placeholders.map((idx) => (
        <div
          key={idx}
          className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 space-y-4"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </div>
            <Skeleton className="h-3.5 w-28" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-center">
            <div className="sm:col-span-7 flex items-center gap-3">
              <Skeleton className="size-11 rounded-full shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-52" />
              </div>
            </div>

            <div className="sm:col-span-5 flex flex-col sm:items-end space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-3">
            <Skeleton className="h-8 w-44 rounded-md" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-28 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
