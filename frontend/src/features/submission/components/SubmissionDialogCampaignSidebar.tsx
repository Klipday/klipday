import { cn } from '@/lib/utils';
import { CAMPAIGN_PLATFORM_LABELS, type CampaignPlatformOption } from '@/features/campaign/schemas';
import {
  FormatCpmDisplay,
  GetCampaignCategoryBadgeLabel,
  GetCampaignTypeBadgeLabel,
} from '@/features/campaign/utils';
import type { SubmissionDialogCampaignSidebarProps } from '../types';
import { RenderPlatformLogo } from './SocialPlatformIcons';

/**
 * Left sidebar column component for the Submission Dialog.
 * Renders the atmospheric campaign preview card including poster banner,
 * brand credentials, category/platform badges, CPM rate, and view threshold metrics.
 *
 * @param props - Component properties containing campaign data.
 * @returns Rendered campaign overview sidebar.
 */
export function SubmissionDialogCampaignSidebar({
  campaign,
  className,
}: SubmissionDialogCampaignSidebarProps) {
  const brandName = campaign.brand?.companyName || 'Brand';
  const brandInitial = brandName.charAt(0).toUpperCase();
  const title = campaign.title?.trim() || 'Kampanye Tanpa Judul';
  const cpmDisplay = FormatCpmDisplay(campaign.cpm);
  const typeBadge = GetCampaignTypeBadgeLabel(campaign.campaignType);
  const categoryBadge = GetCampaignCategoryBadgeLabel(campaign.campaignCategory);
  const rawMinViews = campaign.minViews ? Number(campaign.minViews) : 10000;
  const minViewsDisplay = `${rawMinViews.toLocaleString('id-ID')} Views`;

  return (
    <aside
      className={cn(
        'w-full md:w-[320px] lg:w-[350px] shrink-0 border-b md:border-b-0 md:border-r border-border/40 bg-card/60 p-5 flex flex-col justify-between overflow-y-auto max-h-[220px] md:max-h-none h-full',
        className,
      )}>
      {/* Top Group: Media Banner, Brand & Campaign Core Details */}
      <div className="space-y-3.5">
        {/* Top Poster / Artwork Banner */}
        <div className="relative aspect-16/10 w-full overflow-hidden rounded-xl border border-border/60 bg-muted/40">
          {campaign.thumbnailUrl ? (
            <img
              src={campaign.thumbnailUrl}
              alt={title}
              className="h-full w-full object-cover object-center"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
              Banner Kampanye
            </div>
          )}
        </div>

        {/* Brand Identity Row & Type Label */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-6 rounded-full bg-muted text-foreground text-[10px] font-semibold flex items-center justify-center uppercase shrink-0 border border-border/80">
              {brandInitial}
            </div>
            <span className="text-xs font-semibold text-foreground truncate">
              {brandName}
            </span>
          </div>

          <span className="text-xs text-muted-foreground shrink-0">
            {typeBadge || 'CLIPPING'}
          </span>
        </div>

        {/* Campaign Title */}
        <h2 className="text-sm sm:text-base font-semibold text-foreground leading-snug tracking-tight line-clamp-2" title={title}>
          {title}
        </h2>

        {/* Prominent Rate / CPM */}
        <div className="flex items-baseline gap-1.5 pt-0.5">
          <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {cpmDisplay}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            / 1K views
          </span>
        </div>

        {/* Platform & Category Indicator Row */}
        <div className="flex items-center gap-x-3 text-xs text-muted-foreground pt-0.5 flex-wrap">
          <div className="inline-flex items-center gap-1.5 text-foreground font-medium">
            {(campaign.platforms?.length ? campaign.platforms : ['TIKTOK']).map((platformKey) => {
              const label =
                CAMPAIGN_PLATFORM_LABELS[platformKey as CampaignPlatformOption] ?? platformKey;
              return (
                <span key={platformKey} title={label} className="inline-flex items-center">
                  {RenderPlatformLogo(platformKey, 'size-3.5 opacity-90')}
                </span>
              );
            })}
          </div>

          <span>{categoryBadge}</span>
        </div>
      </div>

      {/* Bottom Group: Key Metric KPI Cards (Anchored to base matching Image 2) */}
      <div className="mt-auto pt-4 border-t border-border/40">
        <div className="grid grid-cols-2 gap-2.5">
          {/* Min View to Claim */}
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block text-center">
              Min View to Claim
            </span>
            <div className="rounded-xl border border-border/60 bg-muted/20 px-2.5 py-2 text-center shadow-2xs">
              <span className="text-xs sm:text-sm font-bold text-foreground truncate block">
                {minViewsDisplay}
              </span>
            </div>
          </div>

          {/* CPM (Rate /1K Views) */}
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block text-center">
              CPM (Rate /1K Views)
            </span>
            <div className="rounded-xl border border-border/60 bg-muted/20 px-2.5 py-2 text-center shadow-2xs">
              <span className="text-xs sm:text-sm font-bold text-foreground truncate block">
                {cpmDisplay}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
