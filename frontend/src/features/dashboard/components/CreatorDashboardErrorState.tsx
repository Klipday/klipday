import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CREATOR_DASHBOARD_MESSAGES } from '../constants';
import type { CreatorDashboardErrorStateProps } from '../types';

/**
 * Dedicated error state card for creator monitoring dashboard failures.
 * Provides clear explanation and a 1-click retry recovery action.
 *
 * @param props - Retry handler and optional styling className.
 * @returns Rendered error state component.
 */
export function CreatorDashboardErrorState({
  onRetry,
  className,
}: CreatorDashboardErrorStateProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-4 max-w-lg mx-auto',
        className,
      )}
    >
      <div className="size-12 rounded-full border border-destructive/30 bg-destructive/10 flex items-center justify-center text-destructive mx-auto">
        <AlertCircle className="size-6" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-foreground">
          {CREATOR_DASHBOARD_MESSAGES.ERROR_TITLE}
        </h3>
        <p className="text-xs text-muted-foreground">
          {CREATOR_DASHBOARD_MESSAGES.FETCH_ERROR}
        </p>
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={onRetry}
        className="h-8 gap-1.5 text-xs font-medium border-border/80 text-foreground hover:bg-muted/60"
      >
        <RotateCcw className="size-3.5" />
        <span>{CREATOR_DASHBOARD_MESSAGES.ACTION_RETRY}</span>
      </Button>
    </div>
  );
}
