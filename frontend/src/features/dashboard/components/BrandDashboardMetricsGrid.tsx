import { FormatCompactCount } from '@/features/submission/utils/submission-utils';
import { FormatNumber, FormatRupiah } from '@/features/wallet/utils/wallet-format';
import { cn } from '@/lib/utils';
import { DASHBOARD_MESSAGES } from '../constants';
import type { BrandDashboardMetricsGridProps } from '../types';

/**
 * 4-card KPI metric strip for brand monitoring dashboard.
 * Displays:
 * 1. Total Views Terverifikasi
 * 2. Kampanye Aktif (with status breakdown below)
 * 3. Total Saldo Terpakai
 * 4. Saldo Siap Pakai (with Saldo Terkunci below)
 *
 * @param props - Metrics data and optional styling className.
 * @returns Bento metric grid element.
 */
export function BrandDashboardMetricsGrid({
  metrics,
  className,
}: BrandDashboardMetricsGridProps) {
  const counts = metrics.campaignStatusCounts;
  const statusBreakdownText = counts
    ? `${counts.draft} Draf • ${counts.finished} Selesai • ${counts.inReview} Review`
    : 'Semua status kampanye';

  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {/* 1. Total Views Terverifikasi */}
      <div className="rounded-xl border border-border/60 bg-card p-5 transition-colors">
        <p className="text-xs font-medium text-muted-foreground">
          {DASHBOARD_MESSAGES.METRICS_TOTAL_VIEWS}
        </p>
        <div className="mt-3">
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {FormatCompactCount(metrics.totalVerifiedViews)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {FormatNumber(metrics.totalVerifiedViews)} views valid
          </p>
        </div>
      </div>

      {/* 2. Kampanye Aktif (with draft, selesai, review below) */}
      <div className="rounded-xl border border-border/60 bg-card p-5 transition-colors">
        <p className="text-xs font-medium text-muted-foreground">
          {DASHBOARD_MESSAGES.METRICS_ACTIVE_CAMPAIGNS}
        </p>
        <div className="mt-3">
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {metrics.activeCampaignsCount} Kampanye
          </p>
          <p className="mt-1 text-xs text-muted-foreground truncate" title={statusBreakdownText}>
            {statusBreakdownText}
          </p>
        </div>
      </div>

      {/* 3. Total Saldo Terpakai */}
      <div className="rounded-xl border border-border/60 bg-card p-5 transition-colors">
        <p className="text-xs font-medium text-muted-foreground">
          {DASHBOARD_MESSAGES.METRICS_TOTAL_SPENT}
        </p>
        <div className="mt-3">
          <p className="text-2xl font-semibold tracking-tight text-foreground truncate">
            {FormatRupiah(metrics.totalSpent)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {DASHBOARD_MESSAGES.METRICS_TOTAL_SPENT_HINT}
          </p>
        </div>
      </div>

      {/* 4. Saldo Siap Pakai (with Saldo Terkunci below, no redundant escrow wording) */}
      <div className="rounded-xl border border-border/60 bg-card p-5 transition-colors">
        <p className="text-xs font-medium text-muted-foreground">
          {DASHBOARD_MESSAGES.METRICS_WALLET_BALANCE}
        </p>
        <div className="mt-3">
          <p className="text-2xl font-semibold tracking-tight text-foreground truncate">
            {FormatRupiah(metrics.walletActiveBalance)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {DASHBOARD_MESSAGES.METRICS_LOCKED_BALANCE_PREFIX}
            {FormatRupiah(metrics.escrowLockedBalance)}
          </p>
        </div>
      </div>
    </div>
  );
}
