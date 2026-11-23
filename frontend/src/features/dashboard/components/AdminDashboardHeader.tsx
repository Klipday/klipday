import { cn } from '@/lib/utils';
import { ADMIN_DASHBOARD_MESSAGES } from '../constants';
import type { AdminDashboardHeaderProps } from '../types';

/**
 * Top operational header for the admin dashboard.
 * Matches CreatorDashboardHeader typography and spacing on the left, paired with
 * a subtle neutral queue status pill on the right.
 *
 * @param props - Header properties including admin name and total actionable task count.
 * @returns Rendered header element.
 */
export function AdminDashboardHeader({
  adminName,
  totalActionableCount,
  className,
}: AdminDashboardHeaderProps) {
  const displayAdminName = adminName || ADMIN_DASHBOARD_MESSAGES.DEFAULT_ADMIN_NAME;
  const displayTitle = `${ADMIN_DASHBOARD_MESSAGES.TITLE_PREFIX}${displayAdminName}`;
  const isClean = totalActionableCount === 0;
  const dotClassName = isClean ? 'bg-emerald-500' : 'bg-amber-500';
  const statusText = isClean
    ? ADMIN_DASHBOARD_MESSAGES.ALL_CLEAN
    : `${totalActionableCount} ${ADMIN_DASHBOARD_MESSAGES.TASKS_WAITING_SUFFIX}`;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="space-y-1.5 min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground truncate">
          {displayTitle}
        </h1>
        <p className="text-sm text-muted-foreground">
          {ADMIN_DASHBOARD_MESSAGES.SUBTITLE}
        </p>
      </div>

      <div className="shrink-0 self-start sm:self-center">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className={cn('size-2 rounded-full shrink-0', dotClassName)} />
          <span className="text-foreground">{statusText}</span>
        </span>
      </div>
    </div>
  );
}
