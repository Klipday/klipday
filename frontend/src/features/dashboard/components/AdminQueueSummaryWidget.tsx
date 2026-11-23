import { Link } from 'react-router';
import { ArrowRightUpIcon } from '@solar-icons/react/linear';
import { cn } from '@/lib/utils';
import { ADMIN_DASHBOARD_MESSAGES } from '../constants';
import type {
  AdminQueueSummaryRow,
  AdminQueueSummaryWidgetProps,
} from '../types';

/**
 * Compact right Bento widget (5/4 columns) listing the 5 operational admin queues
 * as flat hairline-divided rows with live pending counts and direct navigation links.
 *
 * @param props - Aggregated queue counts and optional styling className.
 * @returns Rendered queue summary widget.
 */
export function AdminQueueSummaryWidget({
  queues,
  className,
}: AdminQueueSummaryWidgetProps) {
  const { campaigns, settlements, topUps, withdrawals, kyc } = queues;

  const withdrawalAlertText =
    withdrawals.cancellationRequestedCount > 0
      ? `${withdrawals.cancellationRequestedCount} ${ADMIN_DASHBOARD_MESSAGES.WITHDRAWAL_CANCEL_ALERT_SUFFIX}`
      : undefined;

  const summaryRows: AdminQueueSummaryRow[] = [
    {
      id: 'moderation',
      label: ADMIN_DASHBOARD_MESSAGES.QUEUE_CAMPAIGN_MODERATION,
      count: campaigns.inReviewCount,
      href: '/admin-dashboard/campaigns?filter=IN_REVIEW',
    },
    {
      id: 'settlement',
      label: ADMIN_DASHBOARD_MESSAGES.QUEUE_CAMPAIGN_SETTLEMENT,
      count: settlements.needSettlementCount,
      href: '/admin-dashboard/settlements?filter=NEED_SETTLEMENT',
    },
    {
      id: 'top-up',
      label: ADMIN_DASHBOARD_MESSAGES.QUEUE_TOP_UP,
      count: topUps.submittedCount,
      href: '/admin-dashboard/top-ups?filter=SUBMITTED',
    },
    {
      id: 'withdrawal',
      label: ADMIN_DASHBOARD_MESSAGES.QUEUE_WITHDRAWAL,
      count: withdrawals.pendingCount,
      href: '/admin-dashboard/withdrawals?filter=PENDING',
      alertText: withdrawalAlertText,
    },
    {
      id: 'kyc',
      label: ADMIN_DASHBOARD_MESSAGES.QUEUE_KYC,
      count: kyc.pendingCount,
      href: '/admin-dashboard/kyc?filter=PENDING',
    },
  ];

  return (
    <div
      className={cn(
        'rounded-xl border border-border/60 bg-card flex flex-col overflow-hidden',
        className,
      )}
    >
      <div className="px-5 py-4 border-b border-border/50">
        <h2 className="text-sm font-medium text-foreground truncate">
          {ADMIN_DASHBOARD_MESSAGES.QUEUE_SUMMARY_TITLE}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {ADMIN_DASHBOARD_MESSAGES.QUEUE_SUMMARY_SUBTITLE}
        </p>
      </div>

      <div className="flex-1 divide-y divide-border/40">
        {summaryRows.map((row) => {
          const hasPending = row.count > 0;

          return (
            <Link
              key={row.id}
              to={row.href}
              className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/25 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {row.label}
                </p>
                {row.alertText && (
                  <p className="text-[11px] font-medium text-amber-500 mt-0.5 truncate">
                    {row.alertText}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={cn(
                    'text-sm font-semibold tabular-nums',
                    hasPending ? 'text-foreground' : 'text-muted-foreground/50',
                  )}
                >
                  {row.count}
                </span>
                <ArrowRightUpIcon
                  className="size-3.5 text-muted-foreground/60 group-hover:text-foreground transition-colors"
                  aria-hidden="true"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
