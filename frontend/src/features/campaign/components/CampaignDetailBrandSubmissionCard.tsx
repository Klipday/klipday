import { AlertCircle, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FormatCompactCount, FormatSubmissionDate } from '@/features/submission/utils/submission-utils';
import { cn } from '@/lib/utils';
import type { CampaignDetailBrandSubmissionCardProps } from '../types';

/**
 * Brand review submission card representing one submitted video row.
 * Self-contained component that displays creator profile credentials, review status badge,
 * video preview thumbnail, live caption, TikTok URL link, and tracking metrics.
 *
 * @param props - Component properties containing submission review item.
 * @returns The rendered brand submission card element.
 */
export function CampaignDetailBrandSubmissionCard({ submission, className }: CampaignDetailBrandSubmissionCardProps) {
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
              <span>Disetujui • Pelacakan Aktif</span>
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
            {submission.thumbnailUrl ? (
              <img
                src={submission.thumbnailUrl}
                alt={submission.videoCaption || 'Thumbnail video'}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Tanpa thumbnail</div>
            )}
          </div>
        </div>

        {/* Video Details & Metrics */}
        <div className="md:col-span-9 space-y-3.5">
          {/* Caption */}
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">Caption Video:</span>
            <p className="text-xs text-foreground font-normal leading-relaxed break-words">
              {submission.videoCaption || 'Tidak ada caption.'}
            </p>
          </div>

          {/* TikTok Live URL */}
          {submission.liveVideoUrl && (
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">Tautan Video TikTok:</span>
              <div>
                <a
                  href={submission.liveVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline break-all">
                  <span>{submission.liveVideoUrl}</span>
                  <ExternalLink className="size-3 shrink-0" />
                </a>
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/40">
            <div className="space-y-0.5">
              <span className="text-[11px] text-muted-foreground">Tayangan Terverifikasi</span>
              <p className="text-sm font-semibold text-foreground">{formattedViews}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] text-muted-foreground">Estimasi Pendapatan Kreator</span>
              <p className="text-sm font-semibold text-foreground">Rp {formattedEarnings}</p>
            </div>
          </div>

          {/* Feedback Note Callout if present */}
          {submission.reviewNote && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium text-xs">
                <AlertCircle className="size-3" />
                <span>Catatan Review:</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">{submission.reviewNote}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
