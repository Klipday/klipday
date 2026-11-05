import { FormatCompactCount } from '@/features/submission/utils/submission-utils';
import { FormatRupiah } from '@/features/wallet/utils/wallet-format';
import { cn } from '@/lib/utils';
import { ADMIN_DASHBOARD_MESSAGES } from '../constants';
import type { AdminPlatformMetricsGridProps } from '../types';
import { FormatShortMillionRupiah } from '../utils/dashboard-format';

/**
 * 4-card financial & ecosystem KPI grid for the operational admin dashboard.
 * Summarizes locked campaign budgets, total platform wallet liability, disbursed rewards,
 * and verified community growth.
 *
 * @param props - Metrics data and optional styling className.
 * @returns Rendered 4-card platform summary grid.
 */
export function AdminPlatformMetricsGrid({
  metrics,
  className,
}: AdminPlatformMetricsGridProps) {
  const totalUsers = metrics.totalCreatorsCount + metrics.totalBrandsCount;

  return (
    <div className={cn('space-y-2.5', className)}>
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {ADMIN_DASHBOARD_MESSAGES.METRICS_SECTION_TITLE}
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Dana Kampanye Aktif */}
        <div className="rounded-xl border border-border/80 bg-card/50 p-5 transition-colors">
          <p className="text-xs font-medium text-muted-foreground">
            {ADMIN_DASHBOARD_MESSAGES.METRICS_LOCKED_BUDGET}
          </p>
          <p className="mt-3 font-mono tabular-nums text-2xl font-semibold tracking-tight text-foreground truncate">
            {FormatRupiah(metrics.lockedCampaignBudget)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {metrics.activeCampaignsCount} kampanye aktif • {metrics.finishedCampaignsCount} selesai
          </p>
        </div>

        {/* 2. Total Saldo Dompet Pengguna */}
        <div className="rounded-xl border border-border/80 bg-card/50 p-5 transition-colors">
          <p className="text-xs font-medium text-muted-foreground">
            {ADMIN_DASHBOARD_MESSAGES.METRICS_TOTAL_USER_BALANCE}
          </p>
          <p className="mt-3 font-mono tabular-nums text-2xl font-semibold tracking-tight text-foreground truncate">
            {FormatRupiah(metrics.totalUserWalletBalance)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground truncate">
            Brand {FormatShortMillionRupiah(metrics.brandWalletBalance)} • Kreator{' '}
            {FormatShortMillionRupiah(metrics.creatorWalletBalance)}
          </p>
        </div>

        {/* 3. Total Reward Kreator Cair */}
        <div className="rounded-xl border border-border/80 bg-card/50 p-5 transition-colors">
          <p className="text-xs font-medium text-muted-foreground">
            {ADMIN_DASHBOARD_MESSAGES.METRICS_REWARDS_PAID}
          </p>
          <p className="mt-3 font-mono tabular-nums text-2xl font-semibold tracking-tight text-foreground truncate">
            {FormatRupiah(metrics.totalCreatorRewardsPaid)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {FormatRupiah(metrics.totalApprovedWithdrawalsAmount)} telah ditransfer keluar
          </p>
        </div>

        {/* 4. Pengguna & Penayangan Valid */}
        <div className="rounded-xl border border-border/80 bg-card/50 p-5 transition-colors">
          <p className="text-xs font-medium text-muted-foreground">
            {ADMIN_DASHBOARD_MESSAGES.METRICS_USERS_AND_VIEWS}
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground truncate">
            {totalUsers} Pengguna
          </p>
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {metrics.totalCreatorsCount} Kreator • {metrics.totalBrandsCount} Brand •{' '}
            {FormatCompactCount(metrics.totalVerifiedViews)} views
          </p>
        </div>
      </div>
    </div>
  );
}
