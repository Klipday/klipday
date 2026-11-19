import { Link } from 'react-router';
import { AddIcon, ArrowRightUpIcon } from '@solar-icons/react/linear';
import { Button } from '@/components/ui/button';
import { CreateCampaignDialog } from '@/features/campaign/components';
import { FormatCompactCount } from '@/features/submission/utils/submission-utils';
import { FormatRupiah } from '@/features/wallet/utils/wallet-format';
import { cn } from '@/lib/utils';
import { DASHBOARD_MESSAGES } from '../constants';
import type { BrandActiveCampaignsWidgetProps } from '../types';
import { GetDashboardCategoryLabel } from '../utils/dashboard-format';

/**
 * Minimalist monitor widget for active running campaigns.
 * Displays flat hairline-divided campaign rows with whole-row navigation,
 * real-time CPM, verified views, and actual spent budget progress.
 *
 * @param props - Active campaigns list and optional styling className.
 * @returns Rendered active campaigns widget.
 */
export function BrandActiveCampaignsWidget({
  campaigns,
  className,
}: BrandActiveCampaignsWidgetProps) {
  const hasCampaigns = campaigns.length > 0;

  return (
    <div
      className={cn(
        'rounded-xl border border-border/60 bg-card flex flex-col overflow-hidden',
        className,
      )}
    >
      <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-foreground">
            {DASHBOARD_MESSAGES.ACTIVE_CAMPAIGNS_TITLE}
          </h2>
          {hasCampaigns && (
            <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
              {campaigns.length} kampanye berjalan
            </p>
          )}
        </div>

        <Link
          to="/brand-dashboard/brand-campaigns"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 shrink-0"
        >
          <span>Lihat semua</span>
          <ArrowRightUpIcon className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="flex-1 flex flex-col">
        {!hasCampaigns ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-5 text-center">
            <p className="text-sm font-medium text-foreground">
              {DASHBOARD_MESSAGES.ACTIVE_CAMPAIGNS_EMPTY}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mb-4">
              Luncurkan kampanye baru agar kreator TikTok mulai membuat klip promosi.
            </p>
            <CreateCampaignDialog>
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <AddIcon className="size-3.5" aria-hidden="true" />
                <span>{DASHBOARD_MESSAGES.ACTION_CREATE_CAMPAIGN}</span>
              </Button>
            </CreateCampaignDialog>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {campaigns.map((camp) => {
              const spentPercent =
                camp.budget > 0
                  ? Math.min(
                      100,
                      Math.max(0, Math.round((camp.spent / camp.budget) * 100)),
                    )
                  : 0;
              const campaignHref = `/brand-dashboard/brand-campaigns/${camp.id}`;
              const categoryLabel = GetDashboardCategoryLabel(camp.category);
              const formattedCpm = FormatRupiah(camp.cpm);
              const formattedViews = FormatCompactCount(camp.verifiedViews);
              const formattedSpent = FormatRupiah(camp.spent);
              const formattedBudget = FormatRupiah(camp.budget);

              return (
                <Link
                  key={camp.id}
                  to={campaignHref}
                  className="block px-5 py-4 hover:bg-muted/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {camp.title || DASHBOARD_MESSAGES.DEFAULT_CAMPAIGN_TITLE}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-x-3 gap-y-1 flex-wrap tabular-nums">
                        <span>{categoryLabel}</span>
                        <span>CPM {formattedCpm}</span>
                        <span>
                          {formattedViews} {DASHBOARD_MESSAGES.VIEWS_LABEL}
                        </span>
                      </p>
                    </div>

                    <div className="text-right shrink-0 tabular-nums">
                      <p className="text-sm font-medium text-foreground">
                        {formattedSpent}{' '}
                        <span className="text-xs font-normal text-muted-foreground">
                          / {formattedBudget}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                      <span>
                        {DASHBOARD_MESSAGES.BUDGET_SPENT_LABEL} ({spentPercent}%)
                      </span>
                      {camp.pendingSubmissionsCount > 0 && (
                        <span className="text-amber-500 font-medium">
                          {camp.pendingSubmissionsCount}{' '}
                          {DASHBOARD_MESSAGES.SUBMISSIONS_NEED_REVIEW}
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${spentPercent}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
