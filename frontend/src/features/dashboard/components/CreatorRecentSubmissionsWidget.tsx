import { Link } from 'react-router';
import { ArrowUpRight, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormatCompactCount } from '@/features/submission/utils/submission-utils';
import { FormatRupiah } from '@/features/wallet/utils/wallet-format';
import { cn } from '@/lib/utils';
import {
  CREATOR_DASHBOARD_MESSAGES,
  CREATOR_SUBMISSION_STATUS_CONFIG,
} from '../constants';
import type { CreatorRecentSubmissionsWidgetProps } from '../types';
import { GetDashboardCategoryLabel } from '../utils/dashboard-format';

/**
 * Left Bento widget displaying the creator's submitted campaigns.
 * Each card is a clean, noise-free, whole-card clickable link navigating directly
 * to the campaign detail page (`?tab=my-videos`), showing strictly 5 data points:
 * Campaign Title, Brand & Industry Category, right-aligned Status Pill Badge,
 * Views on the bottom-left, and Estimasi Earning on the bottom-right.
 *
 * @param props - Recent submitted campaign items and optional styling className.
 * @returns Rendered recent submissions widget.
 */
export function CreatorRecentSubmissionsWidget({
  submissions,
  className,
}: CreatorRecentSubmissionsWidgetProps) {
  const hasSubmissions = submissions.length > 0;

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
            {CREATOR_DASHBOARD_MESSAGES.RECENT_SUBMISSIONS_TITLE}
          </h2>
          <p className="text-xs text-muted-foreground">
            {hasSubmissions
              ? `${submissions.length} submisi kampanye terbaru`
              : CREATOR_DASHBOARD_MESSAGES.RECENT_SUBMISSIONS_SUBTITLE}
          </p>
        </div>

        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground gap-1"
        >
          <Link to="/creator-dashboard/creator-campaigns">
            <span>{CREATOR_DASHBOARD_MESSAGES.ACTION_EXPLORE_CAMPAIGNS}</span>
            <ArrowUpRight className="size-3.5" />
          </Link>
        </Button>
      </div>

      <div className="flex-1 mt-4">
        {!hasSubmissions ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="size-10 rounded-full border border-border/60 bg-muted/30 flex items-center justify-center text-muted-foreground mb-3">
              <Video className="size-5" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {CREATOR_DASHBOARD_MESSAGES.RECENT_SUBMISSIONS_EMPTY_TITLE}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mb-4">
              {CREATOR_DASHBOARD_MESSAGES.RECENT_SUBMISSIONS_EMPTY_DESC}
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
            {submissions.map((item) => {
              const rawCategory =
                item.brandIndustry && item.brandIndustry !== 'OTHER'
                  ? item.brandIndustry
                  : item.category;
              const categoryLabel = GetDashboardCategoryLabel(rawCategory);
              const statusConfig =
                CREATOR_SUBMISSION_STATUS_CONFIG[item.submissionStatus] ??
                CREATOR_SUBMISSION_STATUS_CONFIG.PENDING_REVIEW;
              const targetHref =
                item.submissionStatus === 'JOINED'
                  ? `/campaigns/${item.campaignId}`
                  : `/campaigns/${item.campaignId}?tab=my-videos`;
              const formattedViews = FormatCompactCount(item.verifiedViews);
              const formattedEstimate = FormatRupiah(item.estimatedEarnings);

              return (
                <Link
                  key={item.id}
                  to={targetHref}
                  className="block p-4 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/30 hover:border-border transition-colors group space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {item.campaignTitle || CREATOR_DASHBOARD_MESSAGES.DEFAULT_CAMPAIGN_TITLE}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {item.brandName} • {categoryLabel}
                      </p>
                    </div>

                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium shrink-0',
                        statusConfig.badgeClassName,
                      )}
                    >
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-border/40 text-xs">
                    <span className="text-muted-foreground font-medium tabular-nums">
                      {formattedViews} {CREATOR_DASHBOARD_MESSAGES.VIEWS_LABEL}
                    </span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {CREATOR_DASHBOARD_MESSAGES.ESTIMATED_EARNING_PREFIX}
                      {formattedEstimate}
                    </span>
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
