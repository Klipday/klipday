import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { BrandSubmissionsSkeletonProps } from '../types';

/**
 * Skeleton loading placeholder for the brand submissions list.
 * Mimics the 1-row submission card structure to prevent layout shifts during query fetches.
 *
 * @param props - Optional className override.
 * @returns Rendered skeleton card rows.
 */
export function BrandSubmissionsSkeleton({
  className,
}: BrandSubmissionsSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {[1, 2, 3].map((key) => (
        <div
          key={key}
          className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 space-y-4 animate-pulse">
          {/* Header Row Skeleton */}
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>

          {/* Content Row Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            <div className="md:col-span-3 flex justify-center md:justify-start">
              <Skeleton className="aspect-[3/4] w-full max-w-[150px] rounded-xl" />
            </div>

            <div className="md:col-span-9 space-y-3">
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
              </div>

              <div className="space-y-1.5 pt-1">
                <Skeleton className="h-3 w-24 rounded-md" />
                <Skeleton className="h-4 w-48 rounded-md" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/40">
                <Skeleton className="h-9 w-full rounded-md" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export { BrandSubmissionsSkeleton as CampaignDetailBrandSubmissionsSkeleton };
