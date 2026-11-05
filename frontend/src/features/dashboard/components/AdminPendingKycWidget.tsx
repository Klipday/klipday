import { Link } from 'react-router';
import { ArrowUpRight, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ADMIN_DASHBOARD_MESSAGES } from '../constants';
import type { AdminPendingKycWidgetProps } from '../types';
import { FormatTimeAgo, GetInitials } from '../utils/dashboard-format';

/**
 * Bento KYC verification queue widget (5 columns).
 * Displays up to 5 oldest pending bank/e-wallet KYC submissions with circular avatars,
 * role indicators, subtle mismatch detection alerts, and direct review links.
 *
 * @param props - Pending KYC requests list.
 * @returns Rendered KYC verification widget element.
 */
export function AdminPendingKycWidget({
  kycRequests,
  className,
}: AdminPendingKycWidgetProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/80 bg-card/50 p-5 flex flex-col',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border/70 pb-4">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            {ADMIN_DASHBOARD_MESSAGES.KYC_WIDGET_TITLE}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {ADMIN_DASHBOARD_MESSAGES.KYC_WIDGET_SUBTITLE}
          </p>
        </div>
        <Link
          to="/admin-dashboard/kyc?filter=PENDING"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>{ADMIN_DASHBOARD_MESSAGES.ACTION_VIEW_ALL}</span>
          <ArrowUpRight className="size-3" />
        </Link>
      </div>

      <div className="flex-1 mt-4 space-y-2.5">
        {kycRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="size-9 rounded-full border border-border bg-muted/40 flex items-center justify-center text-emerald-400 mb-2.5">
              <Check className="size-4" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {ADMIN_DASHBOARD_MESSAGES.KYC_EMPTY_TITLE}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              {ADMIN_DASHBOARD_MESSAGES.KYC_EMPTY_DESC}
            </p>
          </div>
        ) : (
          kycRequests.map((item) => {
            const initials = GetInitials(item.userName);
            const roleLabel = item.userRole === 'BRAND' ? 'Brand' : 'Kreator';
            const timeAgo = FormatTimeAgo(item.createdAt);

            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/60 p-3.5 hover:border-border transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
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
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {item.userName}
                      </span>
                      <span className="rounded border border-border/80 bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {roleLabel}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono tabular-nums text-foreground/90 mt-0.5 truncate">
                      {item.provider} • {item.accountNumber}
                    </p>
                    <p
                      className={cn(
                        'text-[11px] truncate',
                        item.isHolderNameMismatch
                          ? 'text-amber-400 font-medium'
                          : 'text-muted-foreground',
                      )}
                      title={`a.n. ${item.accountHolderName}`}
                    >
                      a.n. {item.accountHolderName} • {timeAgo}
                    </p>
                  </div>
                </div>

                <Link
                  to="/admin-dashboard/kyc?filter=PENDING"
                  className="inline-flex h-7 shrink-0 items-center justify-center rounded-lg border border-border bg-card px-2.5 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
                >
                  {ADMIN_DASHBOARD_MESSAGES.ACTION_REVIEW}
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
