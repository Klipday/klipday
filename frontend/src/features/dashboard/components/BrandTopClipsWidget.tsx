import { ExternalLink, Video } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FormatCompactCount } from '@/features/submission/utils/submission-utils';
import { FormatRupiah } from '@/features/wallet/utils/wallet-format';
import { SanitizeHttpUrl, cn } from '@/lib/utils';
import { DASHBOARD_MESSAGES } from '../constants';
import type { BrandTopClipsWidgetProps } from '../types';

/**
 * Top verified TikTok clips widget displaying top performing videos.
 * Formatted with calm, high-contrast typography and neutral accent links.
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
        'rounded-xl border border-border/60 bg-card p-5 flex flex-col',
        className,
      )}
    >
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {DASHBOARD_MESSAGES.TOP_CLIPS_TITLE}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {DASHBOARD_MESSAGES.TOP_CLIPS_SUBTITLE}
          </p>
        </div>
      </div>

      <div className="flex-1 mt-4">
        {!hasClips ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="size-10 rounded-full border border-border/60 bg-muted/30 flex items-center justify-center text-muted-foreground mb-3">
              <Video className="size-5" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {DASHBOARD_MESSAGES.TOP_CLIPS_EMPTY}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Klip yang telah disetujui dan diverifikasi penayangannya akan otomatis terperingkat di sini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {topClips.map((clip) => {
              const creatorInitial =
                clip.creatorName?.charAt(0).toUpperCase() || 'K';
              const cleanThumbnail = SanitizeHttpUrl(clip.videoThumbnailUrl);
              const cleanVideoUrl = SanitizeHttpUrl(clip.liveVideoUrl);
              const cleanAvatar = SanitizeHttpUrl(
                clip.creatorAvatarUrl || clip.socialAvatarUrl,
              );

              return (
                <div
                  key={clip.id}
                  className="rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/30 transition-colors p-3.5 flex flex-col justify-between space-y-3"
                >
                  {/* Large Vertical Video Thumbnail */}
                  <div className="w-full h-48 sm:h-52 rounded-lg overflow-hidden bg-muted/40 border border-border/60 shrink-0 relative flex items-center justify-center">
                    <Video className="size-8 text-muted-foreground/60 shrink-0" />
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

                  {/* Creator Info & Performance Footer */}
                  <div className="space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="size-5 rounded-full border border-border/60 shrink-0">
                          {cleanAvatar ? (
                            <AvatarImage
                              src={cleanAvatar}
                              alt={clip.creatorName || DASHBOARD_MESSAGES.DEFAULT_CREATOR_NAME}
                              referrerPolicy="no-referrer"
                            />
                          ) : null}
                          <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-medium">
                            {creatorInitial}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {clip.creatorName || DASHBOARD_MESSAGES.DEFAULT_CREATOR_NAME}
                          </p>
                          {clip.socialUsername && (
                            <p className="text-[11px] text-muted-foreground truncate">
                              @{clip.socialUsername}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-end justify-between gap-2 pt-2.5 border-t border-border/40">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground tracking-tight truncate">
                          {FormatCompactCount(clip.verifiedViews)} {DASHBOARD_MESSAGES.VIEWS_LABEL}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {DASHBOARD_MESSAGES.REWARD_PREFIX}{FormatRupiah(clip.earnings)}
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
                          <ExternalLink className="size-3.5" />
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
