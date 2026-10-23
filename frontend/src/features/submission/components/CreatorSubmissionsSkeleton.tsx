import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface CreatorSubmissionsSkeletonProps {
  className?: string;
}

/**
 * Dedicated skeleton placeholder for Creator Submissions workspace list rows.
 * Mirrors the exact height and structure of CreatorSubmissionRowCard to prevent Cumulative Layout Shift (CLS).
 *
 * @param props - Component configuration containing optional className.
 * @returns Rendered skeleton element.
 */
export function CreatorSubmissionsSkeleton({ className }: CreatorSubmissionsSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-2xs">
          {/* Thumbnail Skeleton */}
          <Skeleton className="aspect-[3/4] w-20 sm:w-24 shrink-0 rounded-xl" />

          {/* Body Skeleton */}
          <div className="flex-1 min-w-0 space-y-2.5 w-full">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3.5 w-36 rounded-md" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>

            <Skeleton className="h-4.5 w-3/4 rounded-md" />
            <Skeleton className="h-3.5 w-1/2 rounded-md" />

            <div className="flex items-center gap-6 pt-1">
              <Skeleton className="h-3.5 w-20 rounded-md" />
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="h-3.5 w-28 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
