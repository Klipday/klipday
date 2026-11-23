import { FormatNumber, FormatRupiah } from '@/features/wallet/utils/wallet-format';
import { cn } from '@/lib/utils';
import { ADMIN_DASHBOARD_MESSAGES } from '../constants';
import type {
  AdminDashboardMetricItem,
  AdminPlatformMetricsGridProps,
} from '../types';

/**
 * Minimalist 4-column hairline-divided KPI summary strip for the admin dashboard.
 * Synchronized 1:1 with BrandDashboardMetricsGrid and CreatorDashboardMetricsGrid,
 * displaying strictly title and value inside each cell:
 * 1. Dana Kampanye Aktif
 * 2. Saldo Dompet Pengguna
 * 3. Reward Kreator Cair
 * 4. Total Pengguna
 *
 * @param props - Platform metrics data and optional styling className.
 * @returns Hairline-divided KPI summary strip element.
 */
export function AdminPlatformMetricsGrid({
  metrics,
  className,
}: AdminPlatformMetricsGridProps) {
  const totalUsersCount = metrics.totalCreatorsCount + metrics.totalBrandsCount;

  const formattedLockedBudget = FormatRupiah(metrics.lockedCampaignBudget);
  const formattedUserBalance = FormatRupiah(metrics.totalUserWalletBalance);
  const formattedRewardsPaid = FormatRupiah(metrics.totalCreatorRewardsPaid);
  const formattedTotalUsers = FormatNumber(totalUsersCount);

  const metricItems: AdminDashboardMetricItem[] = [
    {
      label: ADMIN_DASHBOARD_MESSAGES.METRICS_LOCKED_BUDGET,
      value: formattedLockedBudget,
    },
    {
      label: ADMIN_DASHBOARD_MESSAGES.METRICS_TOTAL_USER_BALANCE,
      value: formattedUserBalance,
    },
    {
      label: ADMIN_DASHBOARD_MESSAGES.METRICS_REWARDS_PAID,
      value: formattedRewardsPaid,
    },
    {
      label: ADMIN_DASHBOARD_MESSAGES.METRICS_TOTAL_USERS,
      value: formattedTotalUsers,
    },
  ];

  return (
    <div
      className={cn(
        'rounded-xl border border-border/60 bg-border/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden',
        className,
      )}
    >
      {metricItems.map((item) => (
        <div key={item.label} className="bg-card px-5 py-4.5 min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">
            {item.label}
          </p>
          <p
            className="mt-2 text-2xl sm:text-[26px] font-semibold tracking-tight text-foreground tabular-nums leading-tight truncate"
            title={item.value}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
