import { ArrowRightUpIcon, VideocameraIcon } from '@solar-icons/react/linear';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SanitizeHttpUrl, cn } from '@/lib/utils';
import { DASHBOARD_MESSAGES } from '../constants';
import type { BrandPendingReviewsQueueProps } from '../types';

/**
 * Minimalist action center widget displaying pending submissions requiring brand approval.
 * Uses flat hairline-divided rows with a 2-tier compact layout (thumbnail and uncramped details
 * above, full-width review CTA below) so creator details never truncate.
 *
 * @param props - Pending submissions array and review selection handler.
 * @returns Rendered action queue component.
 */
export function BrandPendingReviewsQueue({
  submissions,
  onReviewSubmission,
  className,
}: BrandPendingReviewsQueueProps) {
  const hasSubmissions = submissions.length > 0;
  const subtitleText = hasSubmissions
    ? `${submissions.length} klip menunggu keputusan`
    : 'Tidak ada antrean tertunda';

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
            {DASHBOARD_MESSAGES.PENDING_REVIEWS_TITLE}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
            {subtitleText}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {!hasSubmissions ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-5 text-center">
            <p className="text-sm font-medium text-foreground">
              {DASHBOARD_MESSAGES.PENDING_REVIEWS_EMPTY}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
              Klip baru dari kreator akan muncul di sini untuk ditinjau.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {submissions.map((item) => {
              const creatorInitial =
                item.creator?.fullName?.charAt(0).toUpperCase() || 'K';
              const cleanThumbnail = SanitizeHttpUrl(item.thumbnailUrl);
              const cleanCreatorAvatar = SanitizeHttpUrl(
                item.creator?.avatarUrl || item.socialAccount?.avatarUrl,
              );
              const creatorName =
                item.creator?.fullName || DASHBOARD_MESSAGES.DEFAULT_CREATOR_NAME;

              return (
                <div
                  key={item.id}
                  className="p-4 hover:bg-muted/25 transition-colors space-y-3"
                >
                  {/* Tier 1: Thumbnail + Uncramped Details */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-16 rounded-md overflow-hidden bg-muted/40 border border-border/50 shrink-0 relative flex items-center justify-center">
                      <VideocameraIcon className="size-4 text-muted-foreground/60 shrink-0" aria-hidden="true" />
                      {cleanThumbnail && (
                        <img
                          src={cleanThumbnail}
                          alt="Thumbnail klip"
                          className="absolute inset-0 w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Avatar className="size-4 rounded-full border border-border/60 shrink-0">
                          {cleanCreatorAvatar ? (
                            <AvatarImage
                              src={cleanCreatorAvatar}
                              alt={creatorName}
                              referrerPolicy="no-referrer"
                            />
                          ) : null}
                          <AvatarFallback className="bg-muted text-muted-foreground text-[9px] font-medium">
                            {creatorInitial}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-foreground truncate">
                          {creatorName}
                        </span>
                      </div>

                      {item.socialAccount?.username && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          @{item.socialAccount.username}
                        </p>
                      )}

                      {item.campaign?.title && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {DASHBOARD_MESSAGES.CAMPAIGN_LABEL_PREFIX}
                          {item.campaign.title}
                        </p>
                      )}

                      {item.videoCaption && (
                        <p className="text-xs text-foreground/80 line-clamp-2 pt-0.5 break-words">
                          {item.videoCaption}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tier 2: Symmetrical Full-Width Action Button */}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onReviewSubmission(item)}
                    className="w-full h-8 text-xs font-medium border-border/70 text-foreground hover:bg-muted/50 gap-1.5"
                  >
                    <span>{DASHBOARD_MESSAGES.ACTION_REVIEW_VIDEO}</span>
                    <ArrowRightUpIcon className="size-3.5" aria-hidden="true" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
