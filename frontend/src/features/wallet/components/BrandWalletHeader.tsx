import { ArrowUpRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BrandWalletHeaderProps } from '../types';

/**
 * Top header component for Brand Wallet page.
 * Displays page title, description, and action CTA buttons for withdrawal and top-up.
 *
 * @param props - Component properties.
 * @returns Rendered header element.
 */
export function BrandWalletHeader({
  onOpenTopUp,
  onOpenWithdrawal,
  className,
}: BrandWalletHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Dompet Brand
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola saldo aktif, alokasi kampanye, dan riwayat transaksi akun brand.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          type="button"
          onClick={onOpenWithdrawal}
          variant="secondary"
          size="default"
          className="cursor-pointer font-medium shadow-xs border border-border/80 bg-secondary hover:bg-secondary/80 text-secondary-foreground">
          <ArrowUpRight className="mr-1.5 size-4" />
          <span>Tarik Saldo</span>
        </Button>


        <Button
          type="button"
          onClick={onOpenTopUp}
          size="default"
          className="cursor-pointer font-medium shadow-xs">
          <Plus className="mr-1.5 size-4" />
          <span>Top Up Saldo</span>
        </Button>
      </div>
    </div>
  );
}

