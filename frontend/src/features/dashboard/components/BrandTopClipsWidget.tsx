import { SquareTopDownIcon, VideocameraIcon } from '@solar-icons/react/linear';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FormatCompactCount } from '@/features/submission/utils/submission-utils';
import { FormatRupiah } from '@/features/wallet/utils/wallet-format';
import { SanitizeHttpUrl, cn } from '@/lib/utils';
import { DASHBOARD_MESSAGES } from '../constants';
import type { BrandTopClipsWidgetProps } from '../types';

/**
 * Minimalist top verified TikTok clips widget displaying highest-performing videos
 * in a frameless 4-column editorial media grid with calm, neutral metrics and links.
 *
 * @param props - Top clips array and optional styling className.
 * @returns Rendered top clips widget.
 */
export function BrandTopClipsWidget({
  topClips,
  className,
}: BrandTopClipsWidgetProps) {
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
          {DASHBOARD_MESSAGES.TOP_CLIPS_TITLE}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {DASHBOARD_MESSAGES.TOP_CLIPS_SUBTITLE}
        </p>
      </div>

      <div className="flex-1">
        {!hasClips ? (
          <div className="py-12 px-5 text-center">
            <p className="text-sm font-medium text-foreground">
              {DASHBOARD_MESSAGES.TOP_CLIPS_EMPTY}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Klip yang disetujui dan diverifikasi penayangannya akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {topClips.map((clip) => {
              const creatorInitial =
                clip.creatorName?.charAt(0).toUpperCase() || 'K';
              const cleanThumbnail = SanitizeHttpUrl(clip.videoThumbnailUrl);
              const cleanVideoUrl = SanitizeHttpUrl(clip.liveVideoUrl);
              const cleanAvatar = SanitizeHttpUrl(
                clip.creatorAvatarUrl || clip.socialAvatarUrl,
              );
              const creatorName =
                clip.creatorName || DASHBOARD_MESSAGES.DEFAULT_CREATOR_NAME;
              const formattedViews = FormatCompactCount(clip.verifiedViews);
              const formattedEarnings = FormatRupiah(clip.earnings);

              return (
                <div
                  key={clip.id}
                  className="flex flex-col justify-between gap-3"
                >
                  <div className="w-full aspect-[4/5] max-h-56 rounded-lg overflow-hidden bg-muted/40 border border-border/50 shrink-0 relative flex items-center justify-center">
                    <VideocameraIcon className="size-7 text-muted-foreground/60 shrink-0" aria-hidden="true" />
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

                  <div className="space-y-3 flex-1 flex flex-col justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="size-6 rounded-full border border-border/60 shrink-0">
                        {cleanAvatar ? (
                          <AvatarImage
                            src={cleanAvatar}
                            alt={creatorName}
                            referrerPolicy="no-referrer"
                          />
                        ) : null}
                        <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-medium">
                          {creatorInitial}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">
                          {creatorName}
                        </p>
                        {clip.socialUsername && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            @{clip.socialUsername}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-end justify-between gap-2 pt-2.5 border-t border-border/40">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground tabular-nums truncate">
                          {formattedViews} {DASHBOARD_MESSAGES.VIEWS_LABEL}
                        </p>
                        <p className="text-xs text-muted-foreground tabular-nums truncate mt-0.5">
                          {formattedEarnings}
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
