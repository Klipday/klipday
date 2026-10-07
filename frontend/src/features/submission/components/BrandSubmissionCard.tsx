import { useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, ExternalLink, Video } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn, SanitizeHttpUrl } from '@/lib/utils';
import type { BrandSubmissionCardProps } from '../types';
import { FormatCompactCount, FormatSubmissionDate } from '../utils/submission-utils';
import { SubmissionReviewDialog } from './SubmissionReviewDialog';

/**
 * Brand review submission card representing one submitted video row.
 * Self-contained component that displays creator profile credentials, review status badge,
 * video preview thumbnail, live caption, TikTok URL link, and tracking metrics.
 *
 * @param props - Component properties containing submission review item.
 * @returns The rendered brand submission card element.
 */
export function BrandSubmissionCard({ submission, onReview, className }: BrandSubmissionCardProps) {
  const [hasThumbnailError, setHasThumbnailError] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const status = submission.submissionStatus;
  const isPending = status === 'PENDING_REVIEW';
  const isApproved = status === 'APPROVED';
  const isRevision = status === 'REVISION_REQUESTED';
  const isRejected = status === 'REJECTED';

  const creatorInitial = submission.creator?.fullName?.charAt(0).toUpperCase() || 'K';
  const formattedDate = FormatSubmissionDate(submission.submittedAt);
  const formattedViews = FormatCompactCount(submission.verifiedViews);
  const formattedEarnings = Number(submission.earnings || 0).toLocaleString('id-ID');

  return (
    <div className={cn('rounded-2xl border border-border/60 bg-card p-5 sm:p-6 space-y-4 shadow-2xs transition-colors', className)}>
      {/* Header with Creator Credentials & Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
        {/* Creator Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="size-10 rounded-full border border-border/60 shrink-0">
            {submission.creator?.avatarUrl ? (
              <AvatarImage
                src={submission.creator.avatarUrl}
                alt={submission.creator?.fullName || 'Kreator'}
                referrerPolicy="no-referrer"
              />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{creatorInitial}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 space-y-0.5">
            <h4 className="text-sm font-semibold text-foreground truncate">{submission.creator?.fullName || 'Kreator Tanpa Nama'}</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">@{submission.socialAccount?.username || 'unknown'}</span>
              {submission.socialAccount?.followersCount !== undefined && (
                <>
                  <span>•</span>
                  <span>{FormatCompactCount(submission.socialAccount.followersCount)} followers</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status Badge & Timestamp */}
        <div className="flex flex-wrap items-center gap-2.5 sm:self-center">
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">{formattedDate}</span>

          {isPending && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <Clock className="size-3" />
              <span>Menunggu Review</span>
            </span>
          )}
          {isApproved && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="size-3" />
              <span>Disetujui</span>
            </span>
          )}
          {isRevision && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30">
              <AlertCircle className="size-3" />
              <span>Perlu Revisi</span>
            </span>
          )}
          {isRejected && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/30">
              <AlertCircle className="size-3" />
              <span>Ditolak</span>
            </span>
          )}
        </div>
      </div>

      {/* Video Content & Performance Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Thumbnail Preview */}
        <div className="md:col-span-3 flex justify-center md:justify-start">
          <div className="relative aspect-[3/4] w-full max-w-[150px] overflow-hidden rounded-xl border border-border/60 bg-muted/40 shadow-2xs">
            {submission.thumbnailUrl && !hasThumbnailError ? (
              <img
                src={submission.thumbnailUrl}
                alt={submission.videoCaption || 'Thumbnail video'}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
                onError={() => setHasThumbnailError(true)}
              />
            ) : (
              <div className="flex flex-col h-full w-full items-center justify-center gap-1.5 p-3 text-center text-xs text-muted-foreground">
                <Video className="size-6 text-muted-foreground/60" />
                <span className="text-[11px]">Tanpa thumbnail</span>
              </div>
            )}
          </div>
        </div>

        {/* Video Caption & Performance Stats */}
        <div className="md:col-span-9 flex flex-col justify-between h-full space-y-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">Caption Video:</span>
              <p className="text-xs text-foreground font-normal leading-relaxed line-clamp-3">
                {submission.videoCaption || 'Tidak ada caption.'}
              </p>
            </div>

            {SanitizeHttpUrl(submission.liveVideoUrl) && (
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Tautan TikTok:</span>
                <div>
                  <a
                    href={SanitizeHttpUrl(submission.liveVideoUrl)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline break-all">
                    <span>{submission.liveVideoUrl}</span>
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                </div>
              </div>
            )}

            {/* Revision Note Callout */}
            {submission.reviewNote && (
              <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-1 text-xs">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Catatan Review:
                </span>
                <p className="text-xs text-foreground/90 leading-relaxed">{submission.reviewNote}</p>
              </div>
            )}
          </div>

          {/* Performance Bar & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/40">
            <div className="flex items-center gap-4 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Tayangan</span>
                <p className="font-semibold text-foreground">{formattedViews}</p>
              </div>
              <div className="h-6 w-px bg-border/40" />
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Estimasi Reward</span>
                <p className="font-semibold text-foreground">Rp{formattedEarnings}</p>
              </div>
            </div>

            {isPending && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (onReview) {
                    onReview(submission);
                  } else {
                    setIsReviewDialogOpen(true);
                  }
                }}
                className="text-xs rounded-xl font-medium cursor-pointer self-end sm:self-auto">
                Review Klip
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* In-Context Review Decision Dialog (fallback when used without parent list controller) */}
      {!onReview && (
        <SubmissionReviewDialog
          open={isReviewDialogOpen}
          onOpenChange={setIsReviewDialogOpen}
          submission={submission}
        />
      )}
    </div>
  );
}

export { BrandSubmissionCard as CampaignDetailBrandSubmissionCard };
