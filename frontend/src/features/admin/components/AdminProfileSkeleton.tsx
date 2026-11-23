import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { AdminProfileSkeletonProps } from '../types';

/**
 * Loading skeleton matching the layout of the administrator profile page cards.
 *
 * @param props - Optional layout class overrides.
 * @returns Placeholder cards preventing layout shift while fetching admin profile details.
 */
export function AdminProfileSkeleton({ className }: AdminProfileSkeletonProps) {
  return (
    <div className={cn('mx-auto max-w-4xl space-y-6', className)}>
      <div className="rounded-xl border border-border/60 bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Skeleton className="size-16 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6 space-y-5">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3.5 w-64" />
        </div>
        <div className="border-t border-border/40 pt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6 space-y-5">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3.5 w-80" />
        </div>
        <div className="border-t border-border/40 pt-5 space-y-5">
          <Skeleton className="h-10 w-full rounded-xl" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-9 w-40 rounded-md" />
        </div>
      </div>
    </div>
  );
}
