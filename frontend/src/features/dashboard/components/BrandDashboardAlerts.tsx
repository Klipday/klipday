import { AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DASHBOARD_MESSAGES } from '../constants';
import type { BrandDashboardAlertsProps } from '../types';

/**
 * Urgent action notification banner for brand managers.
 * Renders high-priority action alerts only when the active wallet balance is depleted.
 * Pending submission review notifications are managed in the dedicated action queue to prevent banner noise.
 *
 * @param props - Wallet balance and top-up trigger callback.
 * @returns Alert banner element or null if wallet balance is healthy.
 */
export function BrandDashboardAlerts({
  walletActiveBalance,
  onTopUpClick,
  className,
}: BrandDashboardAlertsProps) {
  const hasZeroBalance = walletActiveBalance <= 0;

  if (!hasZeroBalance) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-foreground">
        <div className="flex items-start gap-3 min-w-0">
          <AlertCircle className="size-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-medium text-foreground">
              {DASHBOARD_MESSAGES.ALERT_ZERO_BALANCE_TITLE}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {DASHBOARD_MESSAGES.ALERT_ZERO_BALANCE_DESC}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={onTopUpClick}
          className="h-8 shrink-0 border-border text-foreground hover:bg-muted/60 gap-1 text-xs font-medium self-start sm:self-auto"
        >
          <span>{DASHBOARD_MESSAGES.ACTION_TOP_UP}</span>
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
