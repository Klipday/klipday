import { useState } from 'react';
import { Link } from 'react-router';
import { Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FormatRupiah } from '@/features/wallet/utils/wallet-format';
import { cn } from '@/lib/utils';
import { ADMIN_DASHBOARD_MESSAGES } from '../constants';
import type { AdminFinanceTab, AdminPendingFinanceWidgetProps } from '../types';
import { FormatWaitDuration, GetInitials } from '../utils/dashboard-format';

/**
 * Bento finance triage widget (7 columns).
 * Displays up to 5 oldest waiting withdrawals or manual top-up requests with seamless
 * segmented control toggle, priority cancellation badges, and direct action shortcuts.
 *
 * @param props - Pending withdrawals and top-ups lists.
 * @returns Rendered finance triage widget element.
 */
export function AdminPendingFinanceWidget({
  withdrawals,
  topUps,
  className,
}: AdminPendingFinanceWidgetProps) {
  const [activeTab, setActiveTab] = useState<AdminFinanceTab>('WITHDRAW');

  const isWithdraw = activeTab === 'WITHDRAW';
  const currentListLength = isWithdraw ? withdrawals.length : topUps.length;

  return (
    <div
      className={cn(
        'rounded-xl border border-border/80 bg-card/50 p-5 flex flex-col',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            {ADMIN_DASHBOARD_MESSAGES.FINANCE_WIDGET_TITLE}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {ADMIN_DASHBOARD_MESSAGES.FINANCE_WIDGET_SUBTITLE}
          </p>
        </div>

        {/* Seamless Edge-to-Edge Segmented Control */}
        <div className="inline-flex rounded-lg border border-border bg-background p-0 overflow-hidden divide-x divide-border text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('WITHDRAW')}
            className={cn(
              'px-3 py-1.5 transition-colors cursor-pointer first:rounded-l-[7px]',
              isWithdraw
                ? 'bg-muted text-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground font-medium',
            )}
          >
            Withdraw ({withdrawals.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('TOPUP')}
            className={cn(
              'px-3 py-1.5 transition-colors cursor-pointer last:rounded-r-[7px]',
              !isWithdraw
                ? 'bg-muted text-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground font-medium',
            )}
          >
            Top Up ({topUps.length})
          </button>
        </div>
      </div>

      <div className="flex-1 mt-4 space-y-2.5">
        {currentListLength === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="size-9 rounded-full border border-border bg-muted/40 flex items-center justify-center text-emerald-400 mb-2.5">
              <Check className="size-4" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {ADMIN_DASHBOARD_MESSAGES.FINANCE_EMPTY_TITLE}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              {ADMIN_DASHBOARD_MESSAGES.FINANCE_EMPTY_DESC}
            </p>
          </div>
        ) : isWithdraw ? (
          withdrawals.map((item) => {
            const initials = GetInitials(item.userName);
            const roleLabel = item.userRole === 'BRAND' ? 'Brand' : 'Kreator';
            const waitTime = FormatWaitDuration(item.createdAt);
            const isCancelRequested = Boolean(item.cancellationRequestedAt);

            return (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/60 p-3.5 hover:border-border transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="size-9 rounded-full overflow-hidden border border-border bg-muted shrink-0">
                    {item.userAvatarUrl && (
                      <AvatarImage
                        src={item.userAvatarUrl}
                        alt={item.userName}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="text-xs font-semibold text-muted-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {item.userName}
                      </span>
                      <span className="rounded border border-border/80 bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {roleLabel}
                      </span>
                      {isCancelRequested && (
                        <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                          Minta Batal
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono tabular-nums text-muted-foreground mt-0.5 truncate">
                      {item.bankName} • {item.accountNumber} • {waitTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-auto">
                  <span className="font-mono tabular-nums text-xs font-semibold text-foreground">
                    {FormatRupiah(item.amount)}
                  </span>
                  <Link
                    to="/admin-dashboard/withdrawals?filter=PENDING"
                    className="inline-flex h-7 items-center justify-center rounded-lg border border-border bg-card px-2.5 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    {ADMIN_DASHBOARD_MESSAGES.ACTION_PROCESS}
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          topUps.map((item) => {
            const initials = GetInitials(item.brandName);
            const waitTime = FormatWaitDuration(item.createdAt);
            const senderInfo =
              item.senderBank && item.senderAccountName
                ? `${item.senderBank} a.n. ${item.senderAccountName}`
                : 'Bukti transfer diunggah';

            return (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/60 p-3.5 hover:border-border transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="size-9 rounded-full overflow-hidden border border-border bg-muted shrink-0">
                    {item.brandLogoUrl && (
                      <AvatarImage
                        src={item.brandLogoUrl}
                        alt={item.brandName}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="text-xs font-semibold text-muted-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {item.brandName}
                      </span>
                      <span className="font-mono tabular-nums text-[11px] text-muted-foreground">
                        {item.referenceCode}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {senderInfo} • {waitTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-auto">
                  <span className="font-mono tabular-nums text-xs font-semibold text-foreground">
                    {FormatRupiah(item.totalPayable)}
                  </span>
                  <Link
                    to="/admin-dashboard/top-ups?filter=SUBMITTED"
                    className="inline-flex h-7 items-center justify-center rounded-lg border border-border bg-card px-2.5 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    {ADMIN_DASHBOARD_MESSAGES.ACTION_VERIFY}
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
