import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { CampaignDetailSkeletonProps } from '../types';

/**
 * Loading skeleton component for the campaign detail page.
 * Replicates the hero banner, navigation tabs, and 2-column detail grid layout
 * to eliminate layout shifts (CLS) while query data loads.
 *
 * @param props - Component properties containing class overrides.
 * @returns The rendered campaign detail skeleton element.
 */
export function CampaignDetailSkeleton({ className }: CampaignDetailSkeletonProps) {
  return (
    <div className={cn('w-full pb-12 animate-pulse', className)} data-testid="campaign-detail-skeleton">
      {/* Hero Header Skeleton - Full Width */}
      <div className="-mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] lg:w-[calc(100%+4rem)] px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8 pb-8 sm:pb-10 lg:pb-12 bg-muted/10 space-y-6">
        {/* Top bar skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>

        {/* Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-9 w-3/4 rounded-lg" />
            <Skeleton className="h-8 w-44 rounded-lg" />
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-7 w-24 rounded-md" />
              <Skeleton className="h-7 w-28 rounded-md" />
              <Skeleton className="h-7 w-32 rounded-md" />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Skeleton className="h-10 w-36 rounded-xl" />
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
          </div>
          <div className="lg:col-span-5 xl:col-span-4 flex justify-start lg:justify-end">
            <Skeleton className="aspect-[16/10] w-full max-w-sm sm:max-w-md lg:max-w-[420px] rounded-2xl" />
          </div>
        </div>
      </div>

      <div className="w-full space-y-6 pt-2 sm:pt-4">
        {/* Tabs Skeleton */}
        <div className="flex gap-8 border-b border-border/40 pb-3">
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="h-6 w-28 rounded-md" />
        </div>

      {/* 2-Column Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
        {/* Left Column (7 cols on xl) */}
        <div className="lg:col-span-6 xl:col-span-7 space-y-6">
          {/* About */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-40 rounded-md" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>

          {/* Brief */}
          <div className="space-y-4 pt-4 border-t border-border/40">
            <Skeleton className="h-6 w-48 rounded-md" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
            <Skeleton className="h-32 rounded-xl" />
          </div>

          {/* Materials */}
          <div className="space-y-3 pt-4 border-t border-border/40">
            <Skeleton className="h-6 w-44 rounded-md" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Right Column (5 cols on xl) */}
        <div className="lg:col-span-6 xl:col-span-5 space-y-4">
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  </div>
);
}
