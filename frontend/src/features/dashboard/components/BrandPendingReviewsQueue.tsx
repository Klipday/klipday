import { ArrowUpRight, CheckCircle2, Video } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SanitizeHttpUrl, cn } from '@/lib/utils';
import { DASHBOARD_MESSAGES } from '../constants';
import type { BrandPendingReviewsQueueProps } from '../types';

/**
 * Action center widget displaying pending submissions requiring brand approval.
 * Formatted with a 2-tier card layout (thumbnail and uncramped details on top, full-width review CTA below)
 * to ensure creator details and campaign titles never truncate.
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
            {DASHBOARD_MESSAGES.PENDING_REVIEWS_TITLE}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hasSubmissions
              ? `${submissions.length} klip menunggu keputusan`
              : 'Tidak ada antrean tertunda'}
          </p>
        </div>

        {hasSubmissions && (
          <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {submissions.length} Klip
          </span>
        )}
      </div>

      <div className="flex-1 mt-4">
        {!hasSubmissions ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="size-10 rounded-full border border-border/60 bg-muted/30 flex items-center justify-center text-muted-foreground mb-3">
              <CheckCircle2 className="size-5" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {DASHBOARD_MESSAGES.PENDING_REVIEWS_EMPTY}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Klip baru yang diajukan oleh kreator akan otomatis muncul di sini untuk ditinjau.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((item) => {
              const creatorInitial =
                item.creator?.fullName?.charAt(0).toUpperCase() || 'K';
              const cleanThumbnail = SanitizeHttpUrl(item.thumbnailUrl);
              const cleanCreatorAvatar = SanitizeHttpUrl(
                item.creator?.avatarUrl || item.socialAccount?.avatarUrl,
              );

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/30 transition-colors space-y-3"
                >
                  {/* Tier 1: Thumbnail + Uncramped Details */}
                  <div className="flex items-start gap-3">
                    {/* Video Thumbnail */}
                    <div className="w-14 h-20 rounded-lg overflow-hidden bg-muted/50 border border-border/60 shrink-0 relative flex items-center justify-center">
                      <Video className="size-5 text-muted-foreground/60 shrink-0" />
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

                    {/* Details: Ample horizontal width, zero text squishing */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Avatar className="size-4 rounded-full border border-border/60 shrink-0">
                          {cleanCreatorAvatar ? (
                            <AvatarImage
                              src={cleanCreatorAvatar}
                              alt={item.creator?.fullName || DASHBOARD_MESSAGES.DEFAULT_CREATOR_NAME}
                              referrerPolicy="no-referrer"
                            />
                          ) : null}
                          <AvatarFallback className="bg-muted text-muted-foreground text-[9px] font-medium">
                            {creatorInitial}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-semibold text-foreground truncate">
                          {item.creator?.fullName || DASHBOARD_MESSAGES.DEFAULT_CREATOR_NAME}
                        </span>
                      </div>

                      {item.socialAccount?.username && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          @{item.socialAccount.username}
                        </p>
                      )}

                      {item.campaign?.title && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {DASHBOARD_MESSAGES.CAMPAIGN_LABEL_PREFIX}{item.campaign.title}
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
                    className="w-full h-8 text-xs font-medium border-border/80 text-foreground hover:bg-muted/60 gap-1.5"
                  >
                    <span>{DASHBOARD_MESSAGES.ACTION_REVIEW_VIDEO}</span>
                    <ArrowUpRight className="size-3.5" />
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
