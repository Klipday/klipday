import { Link } from 'react-router';
import { ArrowUpRight, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FormatRupiah } from '@/features/wallet/utils/wallet-format';
import { cn } from '@/lib/utils';
import { ADMIN_DASHBOARD_MESSAGES } from '../constants';
import type { AdminActionableCampaignsWidgetProps } from '../types';
import { GetInitials } from '../utils/dashboard-format';

/**
 * Bento actionable campaigns widget (7 columns).
 * Displays up to 5 campaigns requiring moderation (IN_REVIEW) or final settlement (BUDGET_FULL / EXPIRED).
 *
 * @param props - Actionable campaigns list.
 * @returns Rendered actionable campaigns widget element.
 */
export function AdminActionableCampaignsWidget({
  campaigns,
  className,
}: AdminActionableCampaignsWidgetProps) {
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
            {ADMIN_DASHBOARD_MESSAGES.CAMPAIGNS_WIDGET_TITLE}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {ADMIN_DASHBOARD_MESSAGES.CAMPAIGNS_WIDGET_SUBTITLE}
          </p>
        </div>
        <Link
          to="/admin-dashboard/campaigns"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>{ADMIN_DASHBOARD_MESSAGES.ACTION_MANAGE}</span>
          <ArrowUpRight className="size-3" />
        </Link>
      </div>

      <div className="flex-1 mt-4 space-y-2.5">
        {campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="size-9 rounded-full border border-border bg-muted/40 flex items-center justify-center text-emerald-400 mb-2.5">
              <Check className="size-4" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {ADMIN_DASHBOARD_MESSAGES.CAMPAIGNS_EMPTY_TITLE}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              {ADMIN_DASHBOARD_MESSAGES.CAMPAIGNS_EMPTY_DESC}
            </p>
          </div>
        ) : (
          campaigns.map((c) => {
            const initials = GetInitials(c.brandName);
            const isSettlement = c.actionType === 'SETTLEMENT';
            const ctaHref = isSettlement
              ? `/campaigns/${c.id}?tab=admin-submissions`
              : `/campaigns/${c.id}`;
            const ctaLabel = isSettlement
              ? ADMIN_DASHBOARD_MESSAGES.ACTION_SETTLE
              : ADMIN_DASHBOARD_MESSAGES.ACTION_MODERATE;

            const tagStyle = isSettlement
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              : 'border-blue-500/30 bg-blue-500/10 text-blue-300';

            return (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/60 p-3.5 hover:border-border transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <Avatar className="size-9 rounded-full overflow-hidden border border-border bg-muted shrink-0">
                    {c.brandLogoUrl && (
                      <AvatarImage
                        src={c.brandLogoUrl}
                        alt={c.brandName}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="text-xs font-semibold text-muted-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate" title={c.title}>
                      {c.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[11px] text-muted-foreground">{c.brandName}</span>
                      <span
                        className={cn('rounded border px-1.5 py-0.5 text-[10px] font-medium', tagStyle)}
                      >
                        {c.tagLabel}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono tabular-nums text-muted-foreground mt-1">
                      Anggaran {FormatRupiah(c.budget)}
                    </p>
                  </div>
                </div>

                <Link
                  to={ctaHref}
                  className="inline-flex h-7 shrink-0 items-center justify-center rounded-lg border border-border bg-card px-2.5 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
                >
                  {ctaLabel}
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
