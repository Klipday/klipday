import { cn } from '@/lib/utils';
import type { AdminDashboardSkeletonProps } from '../types';

/**
 * Loading skeleton component for the operational admin dashboard.
 * Perfectly mirrors the 5-queue strip, 4-KPI cards, and 2-row 12-column Bento workspace
 * to eliminate Cumulative Layout Shift (CLS) during initial fetch.
 *
 * @param props - Styling className property.
 * @returns Rendered skeleton element.
 */
export function AdminDashboardSkeleton({ className }: AdminDashboardSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* 1. Header Skeleton */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-muted/70 animate-pulse" />
          <div className="h-4 w-80 max-w-full rounded-md bg-muted/50 animate-pulse" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-36 rounded-full bg-muted/60 animate-pulse" />
          <div className="h-8 w-24 rounded-lg bg-muted/50 animate-pulse" />
        </div>
      </div>

      {/* 2. 5 Queue Cards Skeleton */}
      <div className="space-y-2.5">
        <div className="h-4 w-36 rounded bg-muted/50 animate-pulse" />
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-2.5"
            >
              <div className="flex justify-between items-center">
                <div className="h-3 w-24 rounded bg-muted/60 animate-pulse" />
                <div className="size-3.5 rounded bg-muted/40 animate-pulse" />
              </div>
              <div className="h-7 w-16 rounded bg-muted/70 animate-pulse" />
              <div className="h-3 w-28 rounded bg-muted/40 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* 3. 4 Platform KPI Cards Skeleton */}
      <div className="space-y-2.5">
        <div className="h-4 w-44 rounded bg-muted/50 animate-pulse" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-border/60 bg-card/40 p-5 space-y-3"
            >
              <div className="h-3.5 w-28 rounded bg-muted/60 animate-pulse" />
              <div className="h-7 w-36 rounded bg-muted/70 animate-pulse" />
              <div className="h-3 w-40 rounded bg-muted/40 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Bento Row 1: Finance (7 cols) + KYC (5 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-7 rounded-xl border border-border/60 bg-card/40 p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-border/60 pb-4">
            <div className="space-y-1">
              <div className="h-5 w-40 rounded bg-muted/70 animate-pulse" />
              <div className="h-3 w-64 rounded bg-muted/40 animate-pulse" />
            </div>
            <div className="h-7 w-36 rounded-lg bg-muted/50 animate-pulse" />
          </div>
          <div className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl border border-border/40 bg-muted/20 animate-pulse"
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-xl border border-border/60 bg-card/40 p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-border/60 pb-4">
            <div className="space-y-1">
              <div className="h-5 w-36 rounded bg-muted/70 animate-pulse" />
              <div className="h-3 w-48 rounded bg-muted/40 animate-pulse" />
            </div>
            <div className="h-4 w-12 rounded bg-muted/40 animate-pulse" />
          </div>
          <div className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl border border-border/40 bg-muted/20 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>

      {/* 5. Bento Row 2: Actionable Campaigns (7 cols) + Cashflow Ledger (5 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-7 rounded-xl border border-border/60 bg-card/40 p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-border/60 pb-4">
            <div className="space-y-1">
              <div className="h-5 w-48 rounded bg-muted/70 animate-pulse" />
              <div className="h-3 w-60 rounded bg-muted/40 animate-pulse" />
            </div>
            <div className="h-4 w-12 rounded bg-muted/40 animate-pulse" />
          </div>
          <div className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl border border-border/40 bg-muted/20 animate-pulse"
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-xl border border-border/60 bg-card/40 p-5 space-y-4">
          <div className="border-b border-border/60 pb-4 space-y-1">
            <div className="h-5 w-36 rounded bg-muted/70 animate-pulse" />
            <div className="h-3 w-48 rounded bg-muted/40 animate-pulse" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-10 rounded bg-muted/20 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
