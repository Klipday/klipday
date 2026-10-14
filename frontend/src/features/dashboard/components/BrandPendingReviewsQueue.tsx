import { ArrowUpRight, CheckCircle2, Video } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SanitizeHttpUrl, cn } from '@/lib/utils';
import { DASHBOARD_MESSAGES } from '../constants';
import type { BrandPendingReviewsQueueProps } from '../types';

/**
 * Action center widget displaying pending submissions requiring brand approval.
 * Formatted with a symmetrical horizontal media layout (thumbnail left, details center, review CTA right).
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
                  className="p-3 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/30 transition-colors flex items-center justify-between gap-2.5 sm:gap-3"
                >
                  <div className="flex-1 min-w-0 flex items-center gap-2.5 sm:gap-3">
                    {/* Video Thumbnail on the left */}
                    <div className="w-12 h-16 rounded-md overflow-hidden bg-muted/50 border border-border/60 shrink-0 relative flex items-center justify-center">
                      {cleanThumbnail ? (
                        <img
                          src={cleanThumbnail}
                          alt="Thumbnail klip"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Video className="size-5 text-muted-foreground/60" />
                      )}
                    </div>

                    {/* Middle: Creator details & caption */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Avatar className="size-4 rounded-full border border-border/60 shrink-0">
                          {cleanCreatorAvatar ? (
                            <AvatarImage
                              src={cleanCreatorAvatar}
                              alt={item.creator?.fullName || 'Kreator'}
                              referrerPolicy="no-referrer"
                            />
                          ) : null}
                          <AvatarFallback className="bg-muted text-muted-foreground text-[9px] font-medium">
                            {creatorInitial}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-foreground truncate">
                          {item.creator?.fullName || 'Kreator Klip'}
                        </span>
                        {item.socialAccount?.username && (
                          <span className="text-[11px] text-muted-foreground truncate">
                            @{item.socialAccount.username}
                          </span>
                        )}
                      </div>

                      {item.campaign?.title && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          Kampanye: {item.campaign.title}
                        </p>
                      )}

                      {item.videoCaption && (
                        <p className="text-xs text-foreground/80 line-clamp-1">
                          {item.videoCaption}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Vertically centered Tinjau button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReviewSubmission(item)}
                    className="h-8 px-2.5 sm:px-3 shrink-0 text-xs font-medium border-border/80 text-foreground hover:bg-muted/60 gap-1 self-center"
                  >
                    <span>{DASHBOARD_MESSAGES.ACTION_REVIEW}</span>
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
