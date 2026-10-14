import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { CreatorProfileSkeletonProps } from '../types';

/**
 * Dedicated skeleton placeholder component for the creator profile page,
 * mirroring the header banner, tab navigation bar, and form card to prevent CLS.
 *
 * @param props - Optional className.
 * @returns The rendered skeleton placeholder.
 */
export function CreatorProfileSkeleton({ className }: CreatorProfileSkeletonProps) {
  return (
    <div className={cn('container max-w-5xl py-6 sm:py-8 space-y-6 sm:space-y-8', className)}>
      {/* Header Banner Skeleton */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="size-20 rounded-full shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 rounded-lg" />
              <Skeleton className="h-4 w-36 rounded-md" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
            </div>
          </div>
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Tabs List Skeleton */}
      <div className="border-b border-border/40 pb-1">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-44 rounded-xl" />
        </div>
      </div>

      {/* Form Content Card Skeleton */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}
