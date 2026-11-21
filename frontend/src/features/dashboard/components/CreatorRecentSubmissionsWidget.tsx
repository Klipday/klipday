import { Link } from 'react-router';
import { ArrowRightUpIcon } from '@solar-icons/react/linear';
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
 * Minimalist left Bento widget displaying the creator's submitted campaigns.
 * Styled identically to BrandActiveCampaignsWidget using flat hairline-divided rows
 * with whole-row navigation, status badge, verified views, and estimated earnings.
 *
 * @param props - Recent submitted campaign items and optional styling className.
 * @returns Rendered recent submissions widget.
 */
export function CreatorRecentSubmissionsWidget({
  submissions,
  className,
}: CreatorRecentSubmissionsWidgetProps) {
  const hasSubmissions = submissions.length > 0;
  const headerActionHref = hasSubmissions
    ? '/creator-dashboard/submissions'
    : '/creator-dashboard/creator-campaigns';
  const headerActionLabel = hasSubmissions
    ? CREATOR_DASHBOARD_MESSAGES.ACTION_VIEW_ALL
    : CREATOR_DASHBOARD_MESSAGES.ACTION_EXPLORE_CAMPAIGNS;

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
            {CREATOR_DASHBOARD_MESSAGES.RECENT_SUBMISSIONS_TITLE}
          </h2>
          <p className="text-xs text-muted-foreground tabular-nums mt-0.5 truncate">
            {hasSubmissions
              ? `${submissions.length} submisi kampanye terbaru`
              : CREATOR_DASHBOARD_MESSAGES.RECENT_SUBMISSIONS_SUBTITLE}
          </p>
        </div>

        <Link
          to={headerActionHref}
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 shrink-0"
        >
          <span>{headerActionLabel}</span>
          <ArrowRightUpIcon className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="flex-1 flex flex-col">
        {!hasSubmissions ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-5 text-center">
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
                <ArrowRightUpIcon className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
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
                  className="block px-5 py-4 hover:bg-muted/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.campaignTitle || CREATOR_DASHBOARD_MESSAGES.DEFAULT_CAMPAIGN_TITLE}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
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

                  <div className="flex items-center justify-between gap-3 text-xs tabular-nums">
                    <span className="text-muted-foreground shrink-0">
                      {formattedViews} {CREATOR_DASHBOARD_MESSAGES.VIEWS_LABEL}
                    </span>
                    <span className="font-medium text-foreground truncate">
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
