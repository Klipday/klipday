import { Check } from 'lucide-react';
import { FormatRupiah } from '@/features/wallet/utils/wallet-format';
import { cn } from '@/lib/utils';
import { ADMIN_DASHBOARD_MESSAGES } from '../constants';
import type { AdminRecentLedgerWidgetProps } from '../types';
import { FormatTimeAgo } from '../utils/dashboard-format';

/**
 * Maps backend WalletTransactionType enum into clean Indonesian cashflow labels.
 *
 * @param type - Raw transaction type string.
 * @returns Human-readable ledger label.
 */
function GetTransactionTypeLabel(type: string): { label: string; isPositive: boolean } {
  switch (type) {
    case 'BRAND_DEPOSIT':
      return { label: 'Deposit Saldo Brand', isPositive: true };
    case 'CAMPAIGN_EARNING':
      return { label: 'Reward Settlement Kampanye', isPositive: true };
    case 'WITHDRAWAL':
      return { label: 'Penarikan Saldo Cair', isPositive: false };
    case 'CAMPAIGN_REFUND':
      return { label: 'Refund Sisa Anggaran', isPositive: true };
    case 'CAMPAIGN_PAYMENT':
      return { label: 'Pembayaran Anggaran Kampanye', isPositive: false };
    default:
      return { label: 'Mutasi Dompet', isPositive: true };
  }
}

/**
 * Bento live platform ledger widget (5 columns).
 * Displays latest 5 wallet transactions across all users for real-time cashflow visibility.
 *
 * @param props - Recent transactions list.
 * @returns Rendered recent ledger widget element.
 */
export function AdminRecentLedgerWidget({
  transactions,
  className,
}: AdminRecentLedgerWidgetProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/80 bg-card/50 p-5 flex flex-col',
        className,
      )}
    >
      <div className="border-b border-border/70 pb-4">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          {ADMIN_DASHBOARD_MESSAGES.LEDGER_WIDGET_TITLE}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {ADMIN_DASHBOARD_MESSAGES.LEDGER_WIDGET_SUBTITLE}
        </p>
      </div>

      <div className="flex-1 mt-4">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="size-9 rounded-full border border-border bg-muted/40 flex items-center justify-center text-emerald-400 mb-2.5">
              <Check className="size-4" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {ADMIN_DASHBOARD_MESSAGES.LEDGER_EMPTY_TITLE}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              {ADMIN_DASHBOARD_MESSAGES.LEDGER_EMPTY_DESC}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {transactions.map((tx) => {
              const { label, isPositive } = GetTransactionTypeLabel(tx.type);
              const roleLabel = tx.userRole === 'BRAND' ? 'Brand' : 'Kreator';
              const timeAgo = FormatTimeAgo(tx.transactionDate || tx.createdAt);
              const sign = isPositive ? '+' : '-';
              const formattedAmount = `${sign}${FormatRupiah(tx.amount)}`;

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {tx.userName} ({roleLabel})
                      {tx.referenceCode && (
                        <>
                          {' '}
                          •{' '}
                          <span className="font-mono tabular-nums text-muted-foreground/90">
                            {tx.referenceCode}
                          </span>
                        </>
                      )}{' '}
                      • {timeAgo}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={cn(
                        'font-mono tabular-nums text-xs font-semibold',
                        isPositive ? 'text-emerald-400' : 'text-foreground',
                      )}
                    >
                      {formattedAmount}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
