import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { FormatRupiah } from '@/features/wallet/utils/wallet-format';
import { cn } from '@/lib/utils';
import { ADMIN_DASHBOARD_MESSAGES } from '../constants';
import type { AdminActionQueuesGridProps } from '../types';

/**
 * 5-card actionable queue strip for the operational admin dashboard.
 * Provides live queue counts, Rupiah volume context, urgency warnings (e.g. cancellation requests),
 * and direct links into filtered review tabs.
 *
 * @param props - Queues data and optional styling className.
 * @returns Rendered 5-column actionable queue grid.
 */
export function AdminActionQueuesGrid({
  queues,
  className,
}: AdminActionQueuesGridProps) {
  const { campaigns, settlements, topUps, withdrawals, kyc } = queues;

  // 1. Campaign Moderation Card
  const campaignInReview = campaigns.inReviewCount;
  const campaignSubtext =
    campaignInReview > 0
      ? campaigns.manualPaymentSubmittedCount > 0
        ? `${campaigns.manualPaymentSubmittedCount} bukti transfer manual`
        : 'Menunggu review konten'
      : ADMIN_DASHBOARD_MESSAGES.QUEUE_CLEAN;

  // 2. Campaign Settlement Card
  const settlementCount = settlements.needSettlementCount;
  const settlementSubtext =
    settlementCount > 0
      ? `${settlements.budgetFullCount} kuota penuh • ${settlements.expiredCount} berakhir`
      : ADMIN_DASHBOARD_MESSAGES.QUEUE_CLEAN;

  // 3. Top Up Card
  const topUpCount = topUps.submittedCount;
  const topUpSubtext =
    topUpCount > 0
      ? `Senilai ${FormatRupiah(topUps.submittedTotalPayable)}`
      : ADMIN_DASHBOARD_MESSAGES.QUEUE_CLEAN;

  // 4. Withdrawal Card
  const withdrawalCount = withdrawals.pendingCount;
  const hasWithdrawalCancel = withdrawals.cancellationRequestedCount > 0;
  const withdrawalSubtext =
    withdrawalCount > 0
      ? `${FormatRupiah(withdrawals.pendingTotalAmount)}${
          hasWithdrawalCancel
            ? ` • ${withdrawals.cancellationRequestedCount} ${ADMIN_DASHBOARD_MESSAGES.WITHDRAWAL_CANCEL_ALERT_SUFFIX}`
            : ''
        }`
      : ADMIN_DASHBOARD_MESSAGES.QUEUE_CLEAN;

  // 5. KYC Card
  const kycCount = kyc.pendingCount;
  const kycSubtext =
    kycCount > 0
      ? `${kyc.pendingCreatorCount} Kreator • ${kyc.pendingBrandCount} Brand`
      : ADMIN_DASHBOARD_MESSAGES.QUEUE_CLEAN;

  const queueCards = [
    {
      id: 'moderation',
      title: ADMIN_DASHBOARD_MESSAGES.QUEUE_CAMPAIGN_MODERATION,
      count: campaignInReview,
      unit: ADMIN_DASHBOARD_MESSAGES.UNIT_CAMPAIGN,
      subtext: campaignSubtext,
      href: '/admin-dashboard/campaigns?filter=IN_REVIEW',
      isUrgent: false,
    },
    {
      id: 'settlement',
      title: ADMIN_DASHBOARD_MESSAGES.QUEUE_CAMPAIGN_SETTLEMENT,
      count: settlementCount,
      unit: ADMIN_DASHBOARD_MESSAGES.UNIT_CAMPAIGN,
      subtext: settlementSubtext,
      href: '/admin-dashboard/settlements?filter=NEED_SETTLEMENT',
      isUrgent: false,
    },
    {
      id: 'top-up',
      title: ADMIN_DASHBOARD_MESSAGES.QUEUE_TOP_UP,
      count: topUpCount,
      unit: ADMIN_DASHBOARD_MESSAGES.UNIT_TOP_UP,
      subtext: topUpSubtext,
      href: '/admin-dashboard/top-ups?filter=SUBMITTED',
      isUrgent: false,
    },
    {
      id: 'withdrawal',
      title: ADMIN_DASHBOARD_MESSAGES.QUEUE_WITHDRAWAL,
      count: withdrawalCount,
      unit: ADMIN_DASHBOARD_MESSAGES.UNIT_WITHDRAWAL,
      subtext: withdrawalSubtext,
      href: '/admin-dashboard/withdrawals?filter=PENDING',
      isUrgent: hasWithdrawalCancel,
    },
    {
      id: 'kyc',
      title: ADMIN_DASHBOARD_MESSAGES.QUEUE_KYC,
      count: kycCount,
      unit: ADMIN_DASHBOARD_MESSAGES.UNIT_KYC,
      subtext: kycSubtext,
      href: '/admin-dashboard/kyc?filter=PENDING',
      isUrgent: false,
    },
  ];

  return (
    <div className={cn('space-y-2.5', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {ADMIN_DASHBOARD_MESSAGES.ACTION_QUEUES_TITLE}
        </h2>
        <span className="text-[11px] text-muted-foreground/80">
          {ADMIN_DASHBOARD_MESSAGES.ACTION_QUEUES_HINT}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        {queueCards.map((card) => {
          const hasPending = card.count > 0;

          return (
            <Link
              key={card.id}
              to={card.href}
              className={cn(
                'group block rounded-xl border p-4 transition-colors hover:border-border',
                hasPending
                  ? 'border-border/90 bg-card/70'
                  : 'border-border/40 bg-card/30',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {card.title}
                </span>
                <ArrowUpRight className="size-3.5 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
              </div>

              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span
                  className={cn(
                    'font-mono tabular-nums text-2xl font-semibold tracking-tight',
                    hasPending ? 'text-foreground' : 'text-muted-foreground/50',
                  )}
                >
                  {card.count}
                </span>
                <span className="text-xs text-muted-foreground">{card.unit}</span>
              </div>

              <p
                className={cn(
                  'mt-1 text-[11px] truncate',
                  card.isUrgent
                    ? 'text-amber-400 font-medium'
                    : 'text-muted-foreground',
                )}
                title={card.subtext}
              >
                {card.subtext}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
