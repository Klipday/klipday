import { FormatCompactCount } from '@/features/submission/utils/submission-utils';
import { FormatNumber, FormatRupiah } from '@/features/wallet/utils/wallet-format';
import { cn } from '@/lib/utils';
import { CREATOR_DASHBOARD_MESSAGES } from '../constants';
import type { CreatorDashboardMetricsGridProps } from '../types';

/**
 * 4-card KPI metric strip for the Creator Monitoring Dashboard.
 * Displays:
 * 1. Total Views Terverifikasi
 * 2. Total Pendapatan Video
 * 3. Saldo Siap Ditarik (with Total dicairkan subtext)
 * 4. Status Submisi Klip (approved count with review/revisi/diikuti breakdown)
 *
 * @param props - Creator KPI metrics data and optional styling className.
 * @returns Bento metric grid element.
 */
export function CreatorDashboardMetricsGrid({
  metrics,
  className,
}: CreatorDashboardMetricsGridProps) {
  const counts = metrics.submissionStatusCounts;
  const approvedTotal = counts.approved + counts.posted + counts.verified;
  const statusBreakdownText = `${counts.pendingReview} Review • ${counts.revisionRequested} Revisi • ${counts.joined} Diikuti`;

  const compactViews = FormatCompactCount(metrics.totalVerifiedViews);
  const fullViews = FormatNumber(metrics.totalVerifiedViews);
  const formattedTotalEarnings = FormatRupiah(metrics.totalEarnings);
  const formattedActiveBalance = FormatRupiah(metrics.walletActiveBalance);
  const formattedWithdrawn = FormatRupiah(metrics.totalWithdrawn);

  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {/* 1. Total Views Terverifikasi */}
      <div className="rounded-xl border border-border/60 bg-card p-5 transition-colors">
        <p className="text-xs font-medium text-muted-foreground">
          {CREATOR_DASHBOARD_MESSAGES.METRICS_TOTAL_VIEWS}
        </p>
        <div className="mt-3">
          <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {compactViews}
          </p>
          <p className="mt-1 text-xs text-muted-foreground truncate tabular-nums">
            {fullViews} {CREATOR_DASHBOARD_MESSAGES.METRICS_VALID_VIEWS_SUFFIX}
          </p>
        </div>
      </div>

      {/* 2. Total Pendapatan Video */}
      <div className="rounded-xl border border-border/60 bg-card p-5 transition-colors">
        <p className="text-xs font-medium text-muted-foreground">
          {CREATOR_DASHBOARD_MESSAGES.METRICS_TOTAL_EARNINGS}
        </p>
        <div className="mt-3">
          <p className="text-2xl font-semibold tracking-tight text-foreground truncate tabular-nums">
            {formattedTotalEarnings}
          </p>
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {CREATOR_DASHBOARD_MESSAGES.METRICS_TOTAL_EARNINGS_HINT}
          </p>
        </div>
      </div>

      {/* 3. Saldo Siap Ditarik (single balance card with Total dicairkan below) */}
      <div className="rounded-xl border border-border/60 bg-card p-5 transition-colors">
        <p className="text-xs font-medium text-muted-foreground">
          {CREATOR_DASHBOARD_MESSAGES.METRICS_WALLET_BALANCE}
        </p>
        <div className="mt-3">
          <p className="text-2xl font-semibold tracking-tight text-foreground truncate tabular-nums">
            {formattedActiveBalance}
          </p>
          <p className="mt-1 text-xs text-muted-foreground truncate tabular-nums">
            {CREATOR_DASHBOARD_MESSAGES.METRICS_TOTAL_WITHDRAWN_PREFIX}
            {formattedWithdrawn}
          </p>
        </div>
      </div>

      {/* 4. Status Submisi Klip */}
      <div className="rounded-xl border border-border/60 bg-card p-5 transition-colors">
        <p className="text-xs font-medium text-muted-foreground">
          {CREATOR_DASHBOARD_MESSAGES.METRICS_SUBMISSION_STATUS}
        </p>
        <div className="mt-3">
          <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {approvedTotal} {CREATOR_DASHBOARD_MESSAGES.METRICS_APPROVED_CLIPS_SUFFIX}
          </p>
          <p className="mt-1 text-xs text-muted-foreground truncate" title={statusBreakdownText}>
            {statusBreakdownText}
          </p>
        </div>
      </div>
    </div>
  );
}
