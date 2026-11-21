import { Link } from 'react-router';
import { ArrowRightUpIcon } from '@solar-icons/react/linear';
import { Button } from '@/components/ui/button';
import { FormatRupiah } from '@/features/wallet/utils/wallet-format';
import { cn } from '@/lib/utils';
import { CREATOR_DASHBOARD_MESSAGES } from '../constants';
import type { CreatorJoinedCampaignsWidgetProps } from '../types';
import { GetDashboardCategoryLabel } from '../utils/dashboard-format';

/**
 * Minimalist right Bento widget displaying active campaigns that the creator has joined
 * (`submissionStatus: 'JOINED'`) and has not yet submitted a video for.
 * Styled consistently with Brand dashboard widgets using flat hairline-divided rows
 * and strictly showing budget remaining percentage (0-100%) without exposing raw campaign budgets.
 *
 * @param props - Active joined campaigns list and optional styling className.
 * @returns Rendered joined campaigns widget.
 */
export function CreatorJoinedCampaignsWidget({
  campaigns,
  className,
}: CreatorJoinedCampaignsWidgetProps) {
  const hasCampaigns = campaigns.length > 0;

  return (
    <div
      className={cn(
        'rounded-xl border border-border/60 bg-card flex flex-col overflow-hidden',
        className,
      )}
    >
      <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-foreground truncate">
            {CREATOR_DASHBOARD_MESSAGES.JOINED_CAMPAIGNS_TITLE}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 tabular-nums truncate">
            {hasCampaigns
              ? `${campaigns.length} kampanye menunggu video`
              : CREATOR_DASHBOARD_MESSAGES.JOINED_CAMPAIGNS_SUBTITLE}
          </p>
        </div>

        <Link
          to="/creator-dashboard/creator-campaigns"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 shrink-0"
        >
          <span>{CREATOR_DASHBOARD_MESSAGES.ACTION_FIND_CAMPAIGNS}</span>
          <ArrowRightUpIcon className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="flex-1 flex flex-col">
        {!hasCampaigns ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-5 text-center">
            <p className="text-sm font-medium text-foreground">
              {CREATOR_DASHBOARD_MESSAGES.JOINED_CAMPAIGNS_EMPTY_TITLE}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[240px] mb-4">
              {CREATOR_DASHBOARD_MESSAGES.JOINED_CAMPAIGNS_EMPTY_DESC}
            </p>
            <Button
              asChild
              size="sm"
              className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link to="/creator-dashboard/creator-campaigns">
                <span>{CREATOR_DASHBOARD_MESSAGES.ACTION_EXPLORE_CAMPAIGNS}</span>
                <ArrowRightUpIcon className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {campaigns.map((camp) => {
              const rawCategory =
                camp.brandIndustry && camp.brandIndustry !== 'OTHER'
                  ? camp.brandIndustry
                  : camp.category;
              const categoryLabel = GetDashboardCategoryLabel(rawCategory);
              const formattedCpm = FormatRupiah(camp.cpm);
              const clampedPercent = Math.min(
                100,
                Math.max(0, Math.round(camp.remainingPercent)),
              );
              const campaignHref = `/campaigns/${camp.id}`;

              return (
                <Link
                  key={camp.submissionId}
                  to={campaignHref}
                  className="block px-5 py-4 hover:bg-muted/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {camp.title || CREATOR_DASHBOARD_MESSAGES.DEFAULT_CAMPAIGN_TITLE}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {camp.brandName} • {categoryLabel}
                      </p>
                    </div>

                    <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground tabular-nums shrink-0">
                      CPM {formattedCpm}
                    </span>
                  </div>

                  {/* Progress bar showing strictly 0-100% remaining budget without exposing nominal rupiah */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground tabular-nums">
                      <span className="truncate">
                        {CREATOR_DASHBOARD_MESSAGES.BUDGET_REMAINING_LABEL}
                      </span>
                      <span className="font-medium text-foreground shrink-0">
                        {clampedPercent}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${clampedPercent}%` }}
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
