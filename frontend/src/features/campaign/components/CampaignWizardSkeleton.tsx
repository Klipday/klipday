import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CampaignStepSkeleton } from './CampaignStepSkeleton';

/**
 * Animated skeleton placeholder for the Campaign Wizard layout.
 * Mirrors the header navigation, multi-step progress stepper, and card form body
 * during asynchronous campaign data loading to eliminate Cumulative Layout Shift (CLS).
 *
 * @returns The rendered wizard loading skeleton.
 */
export function CampaignWizardSkeleton() {
  return (
    <div className="w-full max-w-5xl space-y-6 pb-12">
      {/* Top Header Skeleton */}
      <div className="flex flex-col gap-4">
        <div>
          <Skeleton className="h-8 w-44 rounded-md" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-md sm:h-9 sm:w-72" />
          <Skeleton className="h-4 w-96 max-w-full rounded-md" />
        </div>

        {/* Stepper Skeleton */}
        <div className="pt-2">
          {/* Mobile progress skeleton */}
          <div className="block space-y-2 sm:hidden">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>

          {/* Desktop steps skeleton */}
          <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-1.5 lg:gap-2.5 w-full overflow-hidden">
            {Array.from({ length: 6 }).map((_, index) => {
              const isLast = index === 5;
              return (
                <div key={index} className={cn('flex items-center gap-2 sm:gap-2.5 min-w-0', !isLast ? 'flex-1' : 'shrink-0')}>
                  <Skeleton className="size-7 lg:size-8 shrink-0 rounded-full" />
                  <div className="min-w-0 space-y-1">
                    <Skeleton className="h-3 w-16 sm:w-20 rounded-md" />
                    <Skeleton className="hidden xl:block h-2.5 w-24 rounded-md" />
                  </div>
                  {!isLast && <Skeleton className="mx-1 sm:mx-1.5 lg:mx-2.5 h-px flex-1 min-w-2" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form Content Card Skeleton */}
      <CampaignStepSkeleton />
    </div>
  );
}
