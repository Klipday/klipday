import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CreatorWalletHeaderProps } from '../types';

/**
 * Header component for Creator Wallet / Pendapatan page.
 * Displays page title, concise explanation of earnings and payouts,
 * and the primary action button to trigger withdrawal.
 *
 * @param props - Component configuration properties.
 * @returns Rendered header element.
 */
export function CreatorWalletHeader({
  onOpenWithdrawal,
  hasVerifiedAccount: _hasVerifiedAccount,
  className,
}: CreatorWalletHeaderProps) {

  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Pendapatan Kreator
        </h1>
        <p className="text-sm text-muted-foreground">
          Pantau pendapatan dari penayangan video terverifikasi dan ajukan pencairan ke rekening atau e-wallet Anda.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          type="button"
          onClick={onOpenWithdrawal}
          size="default"
          className="cursor-pointer font-medium shadow-xs bg-primary text-primary-foreground hover:bg-primary/90">
          <ArrowUpRight className="mr-1.5 size-4" />
          <span>Tarik Saldo</span>
        </Button>
      </div>
    </div>
  );
}
