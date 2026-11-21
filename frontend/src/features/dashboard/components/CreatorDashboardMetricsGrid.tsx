import { FormatNumber, FormatRupiah } from '@/features/wallet/utils/wallet-format';
import { cn } from '@/lib/utils';
import { CREATOR_DASHBOARD_MESSAGES } from '../constants';
import type {
  CreatorDashboardMetricItem,
  CreatorDashboardMetricsGridProps,
} from '../types';

/**
 * Minimalist 4-column hairline-divided KPI summary strip for the creator dashboard.
 * Synchronized 1:1 with BrandDashboardMetricsGrid, displaying strictly title and value:
 * 1. Total Views
 * 2. Total Video
 * 3. Total Pendapatan
 * 4. Total Saldo
 *
 * @param props - Creator KPI metrics data and optional styling className.
 * @returns Hairline-divided KPI summary strip element.
 */
export function CreatorDashboardMetricsGrid({
  metrics,
  className,
}: CreatorDashboardMetricsGridProps) {
  const totalVideosCount = metrics.submissionStatusCounts?.submittedTotal ?? 0;

  const formattedTotalViews = FormatNumber(metrics.totalVerifiedViews);
  const formattedTotalVideos = FormatNumber(totalVideosCount);
  const formattedTotalEarnings = FormatRupiah(metrics.totalEarnings);
  const formattedTotalBalance = FormatRupiah(metrics.walletActiveBalance);

  const metricItems: CreatorDashboardMetricItem[] = [
    {
      label: CREATOR_DASHBOARD_MESSAGES.METRICS_TOTAL_VIEWS,
      value: formattedTotalViews,
    },
    {
      label: CREATOR_DASHBOARD_MESSAGES.METRICS_TOTAL_VIDEOS,
      value: formattedTotalVideos,
    },
    {
      label: CREATOR_DASHBOARD_MESSAGES.METRICS_TOTAL_EARNINGS,
      value: formattedTotalEarnings,
    },
    {
      label: CREATOR_DASHBOARD_MESSAGES.METRICS_TOTAL_BALANCE,
      value: formattedTotalBalance,
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
