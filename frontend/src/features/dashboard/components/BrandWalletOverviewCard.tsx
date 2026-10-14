import { Link } from 'react-router';
import { ArrowUpRight, Plus, ShieldCheck, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormatRupiah } from '@/features/wallet/utils/wallet-format';
import { cn } from '@/lib/utils';
import type { BrandWalletOverviewCardProps } from '../types';

/**
 * Escrow and wallet overview card in the bottom bento row.
 * Displays active balance, locked campaign escrow, and total spent
 * with 1-click trigger to top-up funds.
 *
 * @param props - Balances and top-up callback.
 * @returns Rendered wallet overview card.
 */
export function BrandWalletOverviewCard({
  walletActiveBalance,
  escrowLockedBalance,
  totalSpent,
  onTopUpClick,
  className,
}: BrandWalletOverviewCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/60 bg-card p-5 flex flex-col justify-between',
        className,
      )}
    >
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-border/40">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Dompet & Escrow
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Status keuangan dan alokasi dana kampanye
            </p>
          </div>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground gap-1"
          >
            <Link to="/brand-dashboard/wallet">
              <span>Rincian</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="mt-4 space-y-3.5">
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Saldo Aktif Siap Pakai</span>
              <Wallet className="size-3.5" />
            </div>
            <p className="text-xl font-bold text-foreground">
              {FormatRupiah(walletActiveBalance)}
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-border/30">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary" />
                Escrow Terkunci
              </span>
              <span className="font-semibold text-foreground">
                {FormatRupiah(escrowLockedBalance)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-border/30">
              <span className="text-muted-foreground">Total Payout Klip</span>
              <span className="font-semibold text-foreground">
                {FormatRupiah(totalSpent)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-border/40">
        <Button
          size="sm"
          onClick={onTopUpClick}
          className="w-full h-9 gap-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-3.5" />
          <span>Top-Up Saldo Dompet</span>
        </Button>
      </div>
    </div>
  );
}
