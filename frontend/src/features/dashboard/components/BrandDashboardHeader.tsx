import { cn } from '@/lib/utils';
import { DASHBOARD_MESSAGES } from '../constants';
import type { BrandDashboardHeaderProps } from '../types';

/**
 * Top header banner for the brand dashboard.
 * Displays brand greeting and clean monitoring subtitle without noisy action buttons.
 *
 * @param props - Header properties including brand name.
 * @returns Rendered header element.
 */
export function BrandDashboardHeader({
  brandName,
  className,
}: BrandDashboardHeaderProps) {
  const displayTitle = brandName
    ? `Halo, ${brandName}`
    : DASHBOARD_MESSAGES.TITLE;

  return (
    <div className={cn('space-y-1', className)}>
      <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
        {displayTitle}
      </h1>
      <p className="text-sm text-muted-foreground max-w-2xl">
        {DASHBOARD_MESSAGES.SUBTITLE}
      </p>
    </div>
  );
}
