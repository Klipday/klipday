import { cn } from '@/lib/utils';
import type { CreatorDashboardSkeletonProps } from '../types';

/**
 * Loading skeleton component for the Creator Monitoring Dashboard.
 * Synchronized 1:1 with the minimalist hairline-divided layout geometry
 * (header, 4-cell KPI strip, recent submissions, joined campaigns, top clips grid)
 * to eliminate Cumulative Layout Shift (CLS) during data fetching.
 *
 * @param props - Styling className property.
 * @returns Rendered skeleton element.
 */
export function CreatorDashboardSkeleton({
  className,
}: CreatorDashboardSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-muted/70 animate-pulse" />
          <div className="h-4 w-72 rounded-md bg-muted/50 animate-pulse" />
        </div>
        <div className="h-8 w-40 rounded-full bg-muted/50 animate-pulse" />
      </div>

      {/* Unified 4-Cell Hairline-Divided KPI Strip Skeleton */}
      <div className="rounded-xl border border-border/60 bg-border/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-card px-5 py-4.5 space-y-2.5">
            <div className="h-3.5 w-28 rounded bg-muted/60 animate-pulse" />
            <div className="h-7 w-32 rounded-md bg-muted/70 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Bento Grid Split: 7/8 cols & 5/4 cols */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Recent Submissions Widget Skeleton (7/8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-4 w-36 rounded bg-muted/70 animate-pulse" />
              <div className="h-3 w-48 rounded bg-muted/40 animate-pulse" />
            </div>
            <div className="h-4 w-20 rounded bg-muted/50 animate-pulse" />
          </div>
          <div className="divide-y divide-border/40">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-5 py-4 space-y-2.5">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1.5">
                    <div className="h-4 w-44 rounded bg-muted/60 animate-pulse" />
                    <div className="h-3 w-36 rounded bg-muted/40 animate-pulse" />
                  </div>
                  <div className="h-5 w-24 rounded-full bg-muted/60 animate-pulse shrink-0" />
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-3 w-20 rounded bg-muted/40 animate-pulse" />
                  <div className="h-3 w-28 rounded bg-muted/50 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Joined Campaigns Widget Skeleton (5/4 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-4 w-36 rounded bg-muted/70 animate-pulse" />
              <div className="h-3 w-32 rounded bg-muted/40 animate-pulse" />
            </div>
            <div className="h-4 w-20 rounded bg-muted/50 animate-pulse" />
          </div>
          <div className="divide-y divide-border/40">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="px-5 py-4 space-y-3">
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1.5">
                    <div className="h-4 w-36 rounded bg-muted/60 animate-pulse" />
                    <div className="h-3 w-28 rounded bg-muted/40 animate-pulse" />
                  </div>
                  <div className="h-5 w-20 rounded-md bg-muted/60 animate-pulse shrink-0" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <div className="h-3 w-24 rounded bg-muted/40 animate-pulse" />
                    <div className="h-3 w-10 rounded bg-muted/50 animate-pulse" />
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted/50 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Clips Widget Skeleton */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50 space-y-1.5">
          <div className="h-4 w-36 rounded bg-muted/70 animate-pulse" />
          <div className="h-3 w-56 rounded bg-muted/40 animate-pulse" />
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="w-full aspect-[4/5] max-h-56 rounded-lg bg-muted/50 border border-border/50 animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 rounded bg-muted/60 animate-pulse" />
                <div className="h-3 w-20 rounded bg-muted/40 animate-pulse" />
              </div>
              <div className="flex items-end justify-between pt-2.5 border-t border-border/40">
                <div className="space-y-1.5">
                  <div className="h-3 w-16 rounded bg-muted/50 animate-pulse" />
                  <div className="h-3 w-20 rounded bg-muted/40 animate-pulse" />
                </div>
                <div className="h-3 w-12 rounded bg-muted/40 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
