import { cn } from '@/lib/utils';
import type { AdminDashboardSkeletonProps } from '../types';

/**
 * Loading skeleton component for the operational admin dashboard.
 * Mirrors the header + status pill, unified 4-cell hairline-divided KPI strip,
 * 7/8 + 5/4 Bento row, and full-width ledger card to eliminate CLS during data fetching.
 *
 * @param props - Styling className property.
 * @returns Rendered skeleton element.
 */
export function AdminDashboardSkeleton({ className }: AdminDashboardSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* 1. Header Skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-muted/70 animate-pulse" />
          <div className="h-4 w-80 max-w-full rounded-md bg-muted/50 animate-pulse" />
        </div>
        <div className="h-7 w-36 rounded-full bg-muted/60 animate-pulse shrink-0 self-start sm:self-center" />
      </div>

      {/* 2. Unified 4-Cell Hairline-Divided KPI Strip Skeleton */}
      <div className="rounded-xl border border-border/60 bg-border/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-card px-5 py-4.5 space-y-2.5">
            <div className="h-3.5 w-28 rounded bg-muted/60 animate-pulse" />
            <div className="h-7 w-32 rounded-md bg-muted/70 animate-pulse" />
          </div>
        ))}
      </div>

      {/* 3. Bento Row 1: Unified Action Queue (7/8 cols) + Queue Summary (5/4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 xl:col-span-8 rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1.5">
              <div className="h-4 w-40 rounded bg-muted/70 animate-pulse" />
              <div className="h-3 w-32 rounded bg-muted/40 animate-pulse" />
            </div>
            <div className="h-7 w-56 rounded-lg bg-muted/50 animate-pulse" />
          </div>
          <div className="divide-y divide-border/40">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="size-9 rounded-full bg-muted/60 animate-pulse shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-44 rounded bg-muted/60 animate-pulse" />
                    <div className="h-3 w-52 rounded bg-muted/40 animate-pulse" />
                  </div>
                </div>
                <div className="h-8 w-28 rounded-md bg-muted/50 animate-pulse shrink-0" />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 xl:col-span-4 rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50 space-y-1.5">
            <div className="h-4 w-28 rounded bg-muted/70 animate-pulse" />
            <div className="h-3 w-40 rounded bg-muted/40 animate-pulse" />
          </div>
          <div className="divide-y divide-border/40">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="h-4 w-36 rounded bg-muted/50 animate-pulse" />
                <div className="h-4 w-8 rounded bg-muted/50 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Bento Row 2: Full-Width Recent Ledger Skeleton */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50 space-y-1.5">
          <div className="h-4 w-36 rounded bg-muted/70 animate-pulse" />
          <div className="h-3 w-56 rounded bg-muted/40 animate-pulse" />
        </div>
        <div className="divide-y divide-border/40">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-5 py-3.5 flex items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="h-4 w-44 rounded bg-muted/60 animate-pulse" />
                <div className="h-3 w-64 rounded bg-muted/40 animate-pulse" />
              </div>
              <div className="h-4 w-28 rounded bg-muted/60 animate-pulse shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
