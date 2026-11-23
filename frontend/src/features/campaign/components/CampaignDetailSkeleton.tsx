import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { CampaignDetailSkeletonProps } from '../types';

/**
 * Loading skeleton component for the campaign detail page.
 * Mirrors the flat header, navigation tabs, and 2-column detail grid layout
 * to eliminate layout shifts (CLS) while query data loads.
 *
 * @param props - Component properties containing class overrides.
 * @returns The rendered campaign detail skeleton element.
 */
export function CampaignDetailSkeleton({ className }: CampaignDetailSkeletonProps) {
  return (
    <div className={cn('w-full pb-12 animate-pulse', className)} data-testid="campaign-detail-skeleton">
      {/* Flat Header Skeleton */}
      <div className="space-y-5 pb-6 border-b border-border/50">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center">
          <div className="md:col-span-7 lg:col-span-8 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="size-5 rounded-full" />
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>
            <Skeleton className="h-8 w-3/4 rounded-lg" />
            <Skeleton className="h-7 w-40 rounded-lg" />
            <Skeleton className="h-4 w-72 max-w-full rounded-md" />
          </div>
          <div className="md:col-span-5 lg:col-span-4 flex justify-start md:justify-end">
            <Skeleton className="aspect-[16/10] w-full max-w-sm sm:max-w-md lg:max-w-[380px] rounded-xl" />
          </div>
        </div>
      </div>

      <div className="w-full space-y-6 pt-4">
        {/* Tabs Skeleton */}
        <div className="flex gap-8 border-b border-border/40 pb-3">
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="h-6 w-28 rounded-md" />
        </div>

        {/* 2-Column Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
          <div className="lg:col-span-6 xl:col-span-7 space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-40 rounded-md" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>

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
          </div>

          <div className="lg:col-span-6 xl:col-span-5 space-y-4">
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
