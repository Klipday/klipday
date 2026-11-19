import { FormatNumber, FormatRupiah } from '@/features/wallet/utils/wallet-format';
import { cn } from '@/lib/utils';
import { DASHBOARD_MESSAGES } from '../constants';
import type {
  BrandDashboardMetricItem,
  BrandDashboardMetricsGridProps,
} from '../types';

/**
 * Minimalist 4-column hairline-divided KPI summary strip for the brand dashboard.
 * Displays strictly title and value inside each cell:
 * 1. Total Views
 * 2. Kampanye Tersubmit (Active + Selesai)
 * 3. Total Saldo Terpakai
 * 4. Total Video Tersubmit (Approved + Verified)
 *
 * @param props - Metrics data and optional styling className.
 * @returns Hairline-divided KPI summary strip element.
 */
export function BrandDashboardMetricsGrid({
  metrics,
  className,
}: BrandDashboardMetricsGridProps) {
  const counts = metrics.campaignStatusCounts;
  const fallbackSubmittedCampaigns = counts
    ? counts.active + counts.finished
    : 0;
  const submittedCampaignsCount =
    metrics.submittedCampaignsCount ?? fallbackSubmittedCampaigns;
  const submittedVideosCount = metrics.submittedVideosCount ?? 0;

  const formattedTotalViews = FormatNumber(metrics.totalVerifiedViews);
  const formattedSubmittedCampaigns = FormatNumber(submittedCampaignsCount);
  const formattedTotalSpent = FormatRupiah(metrics.totalSpent);
  const formattedSubmittedVideos = FormatNumber(submittedVideosCount);

  const metricItems: BrandDashboardMetricItem[] = [
    {
      label: DASHBOARD_MESSAGES.METRICS_TOTAL_VIEWS,
      value: formattedTotalViews,
    },
    {
      label: DASHBOARD_MESSAGES.METRICS_SUBMITTED_CAMPAIGNS,
      value: formattedSubmittedCampaigns,
    },
    {
      label: DASHBOARD_MESSAGES.METRICS_TOTAL_SPENT,
      value: formattedTotalSpent,
    },
    {
      label: DASHBOARD_MESSAGES.METRICS_SUBMITTED_VIDEOS,
      value: formattedSubmittedVideos,
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
        <div key={item.label} className="bg-card px-5 py-4.5">
          <p className="text-xs font-medium text-muted-foreground">
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
