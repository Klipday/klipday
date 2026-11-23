import { Link } from 'react-router';
import { SquareTopDownIcon, VideocameraIcon } from '@solar-icons/react/linear';
import { FormatCompactCount } from '@/features/submission/utils/submission-utils';
import { FormatRupiah } from '@/features/wallet/utils/wallet-format';
import { SanitizeHttpUrl, cn } from '@/lib/utils';
import { CREATOR_DASHBOARD_MESSAGES } from '../constants';
import type { CreatorTopClipsWidgetProps } from '../types';

/**
 * Minimalist full-width Row 2 Bento widget displaying the creator's highest-performing verified clips.
 * Synchronized 1:1 with BrandTopClipsWidget using a frameless 4-column editorial media grid
 * with calm, high-contrast typography and neutral external links.
 *
 * @param props - Top verified clips array and optional styling className.
 * @returns Rendered creator top clips widget.
 */
export function CreatorTopClipsWidget({
  topClips,
  className,
}: CreatorTopClipsWidgetProps) {
  const hasClips = topClips.length > 0;

  return (
    <div
      className={cn(
        'rounded-xl border border-border/60 bg-card flex flex-col overflow-hidden',
        className,
      )}
    >
      <div className="px-5 py-4 border-b border-border/50">
        <h2 className="text-sm font-medium text-foreground">
          {CREATOR_DASHBOARD_MESSAGES.TOP_CLIPS_TITLE}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {CREATOR_DASHBOARD_MESSAGES.TOP_CLIPS_SUBTITLE}
        </p>
      </div>

      <div className="flex-1">
        {!hasClips ? (
          <div className="py-12 px-5 text-center">
            <p className="text-sm font-medium text-foreground">
              {CREATOR_DASHBOARD_MESSAGES.TOP_CLIPS_EMPTY_TITLE}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              {CREATOR_DASHBOARD_MESSAGES.TOP_CLIPS_EMPTY_DESC}
            </p>
          </div>
        ) : (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {topClips.map((clip) => {
              const cleanThumbnail = SanitizeHttpUrl(clip.videoThumbnailUrl);
              const cleanVideoUrl = SanitizeHttpUrl(clip.liveVideoUrl);
              const formattedViews = FormatCompactCount(clip.verifiedViews);
              const displayReward =
                clip.earnings > 0 ? clip.earnings : clip.estimatedEarnings;
              const formattedReward = FormatRupiah(displayReward);
              const campaignHref = `/campaigns/${clip.campaignId}?tab=my-videos`;

              return (
                <div
                  key={clip.id}
                  className="flex flex-col justify-between gap-3 min-w-0"
                >
                  {/* Vertical Video Thumbnail */}
                  <div className="w-full aspect-[4/5] max-h-56 rounded-lg overflow-hidden bg-muted/40 border border-border/50 shrink-0 relative flex items-center justify-center">
                    <VideocameraIcon
                      className="size-7 text-muted-foreground/60 shrink-0"
                      aria-hidden="true"
                    />
                    {cleanThumbnail && (
                      <img
                        src={cleanThumbnail}
                        alt="Thumbnail video"
                        className="absolute inset-0 w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                  </div>

                  {/* Campaign Info & Performance Footer */}
                  <div className="space-y-3 flex-1 flex flex-col justify-between min-w-0">
                    <div className="min-w-0">
                      <Link
                        to={campaignHref}
                        className="text-xs font-medium text-foreground hover:text-foreground/80 transition-colors truncate block"
                      >
                        {clip.campaignTitle || CREATOR_DASHBOARD_MESSAGES.DEFAULT_CAMPAIGN_TITLE}
                      </Link>
                      <div className="flex items-center gap-x-3 text-[11px] text-muted-foreground truncate mt-0.5">
                        <span className="truncate">{clip.brandName}</span>
                        {clip.socialUsername ? (
                          <span className="shrink-0">@{clip.socialUsername}</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-end justify-between gap-2 pt-2.5 border-t border-border/40">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground tabular-nums truncate">
                          {formattedViews} {CREATOR_DASHBOARD_MESSAGES.VIEWS_LABEL}
                        </p>
                        <p className="text-xs text-muted-foreground tabular-nums truncate mt-0.5">
                          {formattedReward}
                        </p>
                      </div>

                      {cleanVideoUrl && (
                        <a
                          href={cleanVideoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 shrink-0 pb-0.5"
                        >
                          <span>TikTok</span>
                          <SquareTopDownIcon className="size-3.5" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
