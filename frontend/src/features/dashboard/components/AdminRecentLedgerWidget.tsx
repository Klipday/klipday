import { FormatRupiah } from '@/features/wallet/utils/wallet-format';
import { cn } from '@/lib/utils';
import { ADMIN_DASHBOARD_MESSAGES } from '../constants';
import type { AdminRecentLedgerWidgetProps } from '../types';
import { FormatTimeAgo } from '../utils/dashboard-format';

/**
 * Maps backend WalletTransactionType enum into clean Indonesian cashflow labels.
 *
 * @param type - Raw transaction type string.
 * @returns Human-readable ledger label and directional sign indicator.
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
 * Full-width live platform ledger widget displaying the latest 5 wallet transactions.
 * Matches BrandTopClipsWidget and CreatorTopClipsWidget card framing with flat
 * hairline-divided rows and calm sans-serif tabular amounts.
 *
 * @param props - Recent transactions list and optional styling className.
 * @returns Rendered recent ledger widget element.
 */
export function AdminRecentLedgerWidget({
  transactions,
  className,
}: AdminRecentLedgerWidgetProps) {
  const hasTransactions = transactions.length > 0;

  return (
    <div
      className={cn(
        'rounded-xl border border-border/60 bg-card flex flex-col overflow-hidden',
        className,
      )}
    >
      <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-foreground truncate">
            {ADMIN_DASHBOARD_MESSAGES.LEDGER_WIDGET_TITLE}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {ADMIN_DASHBOARD_MESSAGES.LEDGER_WIDGET_SUBTITLE}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {!hasTransactions ? (
          <div className="py-12 px-5 text-center">
            <p className="text-sm font-medium text-foreground">
              {ADMIN_DASHBOARD_MESSAGES.LEDGER_EMPTY_TITLE}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              {ADMIN_DASHBOARD_MESSAGES.LEDGER_EMPTY_DESC}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {transactions.map((tx) => {
              const { label, isPositive } = GetTransactionTypeLabel(tx.type);
              const roleLabel = tx.userRole === 'BRAND' ? 'Brand' : 'Kreator';
              const timeAgo = FormatTimeAgo(tx.transactionDate || tx.createdAt);
              const sign = isPositive ? '+' : '-';
              const formattedAmount = `${sign}${FormatRupiah(tx.amount)}`;
              const metadataParts = [
                `${tx.userName} (${roleLabel})`,
                tx.referenceCode,
                timeAgo,
              ].filter((part): part is string => Boolean(part));

              return (
                <div
                  key={tx.id}
                  className="px-5 py-3.5 hover:bg-muted/25 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {label}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5 tabular-nums">
                      {metadataParts.map((part, index) => (
                        <span key={`${tx.id}-meta-${index}`} className="truncate">
                          {part}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={cn(
                        'text-sm font-medium tabular-nums',
                        isPositive ? 'text-foreground' : 'text-muted-foreground',
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
