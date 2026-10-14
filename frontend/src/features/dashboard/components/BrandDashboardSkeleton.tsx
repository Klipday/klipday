import { cn } from '@/lib/utils';
import type { BrandDashboardSkeletonProps } from '../types';

/**
 * Loading skeleton component for the Brand Monitoring Dashboard.
 * Synchronized with the bento layout geometry (header, KPIs, active campaigns, horizontal reviews queue, top clips)
 * to completely eliminate Cumulative Layout Shift (CLS) during data fetching.
 *
 * @param props - Styling className property.
 * @returns Rendered skeleton element.
 */
export function BrandDashboardSkeleton({
  className,
}: BrandDashboardSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-muted/70 animate-pulse" />
        <div className="h-4 w-80 rounded-md bg-muted/50 animate-pulse" />
      </div>

      {/* 4 KPI Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-border/60 bg-card p-5 space-y-3"
          >
            <div className="h-3.5 w-24 rounded bg-muted/60 animate-pulse" />
            <div className="h-7 w-28 rounded-md bg-muted/70 animate-pulse" />
            <div className="h-3 w-36 rounded bg-muted/40 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Bento Grid Split: 7/8 cols & 5/4 cols */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Campaigns Widget Skeleton (7/8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-xl border border-border/60 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-border/40">
            <div className="space-y-1.5">
              <div className="h-5 w-36 rounded bg-muted/70 animate-pulse" />
              <div className="h-3 w-48 rounded bg-muted/40 animate-pulse" />
            </div>
            <div className="h-6 w-20 rounded bg-muted/50 animate-pulse" />
          </div>
          <div className="space-y-3 pt-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <div className="h-4 w-40 rounded bg-muted/60 animate-pulse" />
                    <div className="h-3 w-28 rounded bg-muted/40 animate-pulse" />
                  </div>
                  <div className="h-4 w-24 rounded bg-muted/60 animate-pulse" />
                </div>
                <div className="h-2 w-full rounded-full bg-muted/40 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Pending Reviews Queue Skeleton (5/4 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 rounded-xl border border-border/60 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-border/40">
            <div className="space-y-1.5">
              <div className="h-5 w-32 rounded bg-muted/70 animate-pulse" />
              <div className="h-3 w-28 rounded bg-muted/40 animate-pulse" />
            </div>
          </div>
          <div className="space-y-3 pt-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-20 rounded-lg bg-muted/60 animate-pulse shrink-0" />
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="h-3.5 w-24 rounded bg-muted/60 animate-pulse" />
                    <div className="h-3 w-28 rounded bg-muted/40 animate-pulse" />
                    <div className="h-3 w-36 rounded bg-muted/40 animate-pulse" />
                  </div>
                </div>
                <div className="h-8 w-full rounded-md bg-muted/50 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Clips Widget Skeleton */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <div className="space-y-1.5 pb-4 border-b border-border/40">
          <div className="h-5 w-36 rounded bg-muted/70 animate-pulse" />
          <div className="h-3 w-64 rounded bg-muted/40 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-3"
            >
              <div className="w-full h-48 sm:h-52 rounded-lg bg-muted/50 border border-border/60 animate-pulse" />
              <div className="space-y-2">
                <div className="h-3.5 w-28 rounded bg-muted/60 animate-pulse" />
                <div className="h-3 w-20 rounded bg-muted/40 animate-pulse" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <div className="h-3 w-20 rounded bg-muted/50 animate-pulse" />
                <div className="h-3 w-12 rounded bg-muted/40 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
