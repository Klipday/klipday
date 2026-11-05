import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ADMIN_DASHBOARD_MESSAGES } from '../constants';
import type { AdminDashboardHeaderProps } from '../types';

/**
 * Top operational header for the admin dashboard command center.
 * Displays admin greeting, concise operational subtitle, dynamic pending tasks status pill,
 * and an interactive reload button with smooth rotation feedback.
 *
 * @param props - Header props including admin name, total actionable count, and refresh callback.
 * @returns Rendered header element.
 */
export function AdminDashboardHeader({
  adminName,
  totalActionableCount,
  onRefresh,
  isRefreshing = false,
  className,
}: AdminDashboardHeaderProps) {
  const [isRotating, setIsRotating] = useState(false);

  const displayAdminName = adminName || ADMIN_DASHBOARD_MESSAGES.DEFAULT_ADMIN_NAME;
  const isClean = totalActionableCount === 0;

  const HandleRefreshClick = () => {
    setIsRotating(true);
    onRefresh();
    setTimeout(() => {
      setIsRotating(false);
    }, 600);
  };

  const statusPillClassName = isClean
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    : 'border-amber-500/30 bg-amber-500/10 text-amber-300';

  const dotClassName = isClean ? 'bg-emerald-400' : 'bg-amber-400';

  const statusText = isClean
    ? ADMIN_DASHBOARD_MESSAGES.ALL_CLEAN
    : `${totalActionableCount} ${ADMIN_DASHBOARD_MESSAGES.TASKS_WAITING_SUFFIX}`;

  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          {ADMIN_DASHBOARD_MESSAGES.TITLE_PREFIX}
          {displayAdminName}
        </h1>
        <p className="text-[13px] text-muted-foreground max-w-2xl">
          {ADMIN_DASHBOARD_MESSAGES.SUBTITLE}
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            statusPillClassName,
          )}
        >
          <span className={cn('size-1.5 rounded-full', dotClassName)} />
          <span>{statusText}</span>
        </span>

        <button
          type="button"
          onClick={HandleRefreshClick}
          disabled={isRefreshing}
          aria-label={ADMIN_DASHBOARD_MESSAGES.ACTION_REFRESH}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-3 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw
            className={cn(
              'size-3.5 text-muted-foreground transition-transform duration-500',
              (isRotating || isRefreshing) && 'animate-spin',
            )}
          />
          <span>{ADMIN_DASHBOARD_MESSAGES.ACTION_REFRESH}</span>
        </button>
      </div>
    </div>
  );
}
