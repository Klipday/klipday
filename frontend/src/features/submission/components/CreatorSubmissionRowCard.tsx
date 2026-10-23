import { useState } from 'react';
import { CheckCircle2, Clock, Eye, MessageSquare, Video } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';
import { FormatRupiah } from '@/features/wallet/utils/wallet-format';
import type { CreatorSubmissionRowCardProps } from '../types';
import { FormatCompactCount, FormatSubmissionDate } from '../utils/submission-utils';

/**
 * Clean, minimalist long card component representing one submitted video row in the creator workspace.
 * Taking 1 full row, whole-card clickable navigating directly to the campaign detail tab.
 * Polished with spacious height, clean typography, no divider lines, and uncluttered metrics.
 *
 * @param props - Component properties containing submission item and optional className.
 * @returns Rendered submission row card.
 */
export function CreatorSubmissionRowCard({
  submission,
  className,
}: CreatorSubmissionRowCardProps) {
  const [hasThumbnailError, setHasThumbnailError] = useState(false);

  const status = submission.submissionStatus;
  const isPending = status === 'PENDING_REVIEW';
  const isApproved = status === 'APPROVED';
  const isRevision = status === 'REVISION_REQUESTED';
  const isRejected = status === 'REJECTED';

  const formattedDate = FormatSubmissionDate(submission.submittedAt || submission.createdAt);
  const formattedViews = FormatCompactCount(submission.verifiedViews);
  const formattedCpm = FormatRupiah(submission.cpm);
  const formattedEarnings = FormatRupiah(submission.earnings);

  const targetUrl = `/campaigns/${submission.campaignId}?tab=my-videos`;

  return (
    <Link
      to={targetUrl}
      className={cn(
        'group block rounded-2xl border border-border/60 bg-card p-4 sm:p-5 transition-all duration-200 hover:border-border hover:bg-muted/20 hover:shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring',
        isRevision && 'border-orange-500/30 hover:border-orange-500/50',
        className,
      )}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
        {/* Video Thumbnail (3:4 Ratio, spacious & high definition) */}
        <div className="relative aspect-[3/4] w-20 sm:w-24 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/40">
          {submission.thumbnailUrl && !hasThumbnailError ? (
            <img
              src={submission.thumbnailUrl}
              alt={submission.campaignTitle}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setHasThumbnailError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
              <Video className="size-6" />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 space-y-2 w-full">
          {/* Top Meta & Status Pill Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
              <span className="font-medium text-foreground/90 truncate">{submission.brandName}</span>
              <span>•</span>
              <span className="shrink-0">{formattedDate}</span>
            </div>

            {/* Clean Status Badge */}
            <div className="shrink-0">
              {isPending && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <Clock className="size-3" />
                  <span>Menunggu Review</span>
                </span>
              )}
              {isApproved && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3" />
                  <span>Disetujui</span>
                </span>
              )}
              {isRevision && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-0.5 text-xs font-medium text-orange-600 dark:text-orange-400">
                  <span>Perlu Revisi</span>
                </span>
              )}
              {isRejected && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                  <span>Ditolak</span>
                </span>
              )}
            </div>
          </div>

          {/* Campaign Title & Caption */}
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
              {submission.campaignTitle}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2 font-normal leading-relaxed">
              {submission.videoCaption || submission.campaignDescription || 'Tidak ada deskripsi caption.'}
            </p>
          </div>

          {/* Contextual Revision Note (if brand requested changes) */}
          {isRevision && submission.reviewNote && (
            <div className="flex items-start gap-1.5 rounded-xl border border-orange-500/25 bg-orange-500/5 px-3 py-2 text-xs text-orange-600 dark:text-orange-300">
              <MessageSquare className="size-3.5 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                <strong className="font-semibold">Catatan Brand:</strong> {submission.reviewNote}
              </span>
            </div>
          )}

          {/* Bottom Financial Metrics Row (Clean, no divider line, no dot circles, no buka link) */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 pt-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-3.5 text-muted-foreground/70" />
              <span>Views:</span>
              <strong className="text-foreground font-semibold">{formattedViews}</strong>
            </span>

            <span>
              CPM: <strong className="text-foreground font-semibold">{formattedCpm}</strong>
            </span>

            <span>
              Reward: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{formattedEarnings}</strong>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
