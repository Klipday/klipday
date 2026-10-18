import { Link } from 'react-router';
import { ArrowUpRight, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormatRupiah } from '@/features/wallet/utils/wallet-format';
import { cn } from '@/lib/utils';
import { CREATOR_DASHBOARD_MESSAGES } from '../constants';
import type { CreatorJoinedCampaignsWidgetProps } from '../types';
import { GetDashboardCategoryLabel } from '../utils/dashboard-format';

/**
 * Right Bento widget displaying active campaigns that the creator has joined (`submissionStatus: 'JOINED'`)
 * and has not yet submitted a video for.
 * Each campaign card is a clean, whole-card clickable link to `/campaigns/:id`, showing:
 * Campaign Title, Brand & Industry Category, right-aligned CPM badge, and a Budget Tersisa progress bar.
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
        'rounded-xl border border-border/60 bg-card p-5 flex flex-col',
        className,
      )}
    >
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div className="space-y-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {CREATOR_DASHBOARD_MESSAGES.JOINED_CAMPAIGNS_TITLE}
          </h2>
          <p className="text-xs text-muted-foreground">
            {hasCampaigns
              ? `${campaigns.length} kampanye menunggu pengajuan video`
              : CREATOR_DASHBOARD_MESSAGES.JOINED_CAMPAIGNS_SUBTITLE}
          </p>
        </div>

        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground gap-1"
        >
          <Link to="/creator-dashboard/creator-campaigns">
            <span>{CREATOR_DASHBOARD_MESSAGES.ACTION_FIND_CAMPAIGNS}</span>
            <ArrowUpRight className="size-3.5" />
          </Link>
        </Button>
      </div>

      <div className="flex-1 mt-4">
        {!hasCampaigns ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="size-10 rounded-full border border-border/60 bg-muted/30 flex items-center justify-center text-muted-foreground mb-3">
              <Megaphone className="size-5" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {CREATOR_DASHBOARD_MESSAGES.JOINED_CAMPAIGNS_EMPTY_TITLE}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mb-4">
              {CREATOR_DASHBOARD_MESSAGES.JOINED_CAMPAIGNS_EMPTY_DESC}
            </p>
            <Button
              asChild
              size="sm"
              className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link to="/creator-dashboard/creator-campaigns">
                <span>{CREATOR_DASHBOARD_MESSAGES.ACTION_EXPLORE_CAMPAIGNS}</span>
                <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((camp) => {
              const rawCategory =
                camp.brandIndustry && camp.brandIndustry !== 'OTHER'
                  ? camp.brandIndustry
                  : camp.category;
              const categoryLabel = GetDashboardCategoryLabel(rawCategory);
              const formattedCpm = FormatRupiah(camp.cpm);
              const formattedRemaining = FormatRupiah(camp.remainingBudget);
              const formattedBudget = FormatRupiah(camp.budget);

              return (
                <Link
                  key={camp.submissionId}
                  to={`/campaigns/${camp.id}`}
                  className="block p-4 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/30 hover:border-border transition-colors group space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {camp.title || CREATOR_DASHBOARD_MESSAGES.DEFAULT_CAMPAIGN_TITLE}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {camp.brandName} • {categoryLabel}
                      </p>
                    </div>

                    <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-foreground tabular-nums shrink-0">
                      CPM {formattedCpm}
                    </span>
                  </div>

                  {/* Native Tailwind Progress Bar for Remaining Budget */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
                      <span>
                        {CREATOR_DASHBOARD_MESSAGES.BUDGET_REMAINING_LABEL} ({camp.remainingPercent}%)
                      </span>
                      <span className="font-medium text-foreground">
                        {formattedRemaining} / {formattedBudget}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${camp.remainingPercent}%` }}
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
