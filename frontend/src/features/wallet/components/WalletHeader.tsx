import { ArrowUpRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WalletHeaderProps } from '../types';

/**
 * Shared header component for Brand and Creator Wallet pages.
 * Displays page title, description, and action CTA buttons for withdrawal and optional top-up.
 *
 * @param props - Component configuration properties.
 * @returns Rendered header element.
 */
export function WalletHeader({
  title,
  description,
  onOpenWithdrawal,
  onOpenTopUp,
  className,
}: WalletHeaderProps) {
  const hasTopUpAction = Boolean(onOpenTopUp);
  const containerClassName = cn(
    'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
    className,
  );
  const withdrawalButtonClassName = cn(
    'cursor-pointer font-medium shadow-xs',
    hasTopUpAction
      ? 'border border-border/80 bg-secondary hover:bg-secondary/80 text-secondary-foreground'
      : 'bg-primary text-primary-foreground hover:bg-primary/90',
  );

  return (
    <div className={containerClassName}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          type="button"
          onClick={onOpenWithdrawal}
          variant={hasTopUpAction ? 'secondary' : 'default'}
          size="default"
          className={withdrawalButtonClassName}>
          <ArrowUpRight className="mr-1.5 size-4" />
          <span>Tarik Saldo</span>
        </Button>

        {onOpenTopUp ? (
          <Button
            type="button"
            onClick={onOpenTopUp}
            size="default"
            className="cursor-pointer font-medium shadow-xs">
            <Plus className="mr-1.5 size-4" />
            <span>Top Up Saldo</span>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
