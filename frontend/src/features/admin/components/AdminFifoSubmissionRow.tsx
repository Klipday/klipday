import { DangerTriangleIcon } from '@solar-icons/react/linear';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AdminFifoSubmissionRowProps } from '../types';
import {
  FormatRupiah,
  FormatSubmissionTimestamp,
  FormatViewsCount,
} from '../utils/formatters';

/**
 * Single row in the Settlement submission queue (`#1`, `#2`, `#3`, ...).
 * Displays order rank, creator identity, submission timestamp, external TikTok video link,
 * verified views, allocated reward, and Disqualify action.
 *
 * @param props - Row props from types.ts.
 * @returns The rendered settlement submission row.
 */
export function AdminFifoSubmissionRow({
  submission,
  isSettled,
  isDisqualifying,
  onRequestDisqualify,
}: AdminFifoSubmissionRowProps) {
  const isRejected = submission.submissionStatus === 'REJECTED';
  const isApproved = submission.submissionStatus === 'APPROVED';
  const isVerified = submission.submissionStatus === 'VERIFIED';
  const isPending =
    submission.submissionStatus === 'PENDING_REVIEW' ||
    submission.submissionStatus === 'REVISION_REQUESTED';

  const HandleDisqualifyClick = () => {
    onRequestDisqualify(submission);
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-4 px-5 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between',
        isRejected
          ? 'bg-muted/15 opacity-55'
          : 'hover:bg-muted/20',
      )}
    >
      {/* Left + Center: Rank & Creator Details */}
      <div className="flex items-start gap-4 min-w-0 flex-1">
        <span className="w-7 shrink-0 pt-0.5 text-xs font-medium text-muted-foreground tabular-nums">
          {submission.fifoOrder !== null ? `#${submission.fifoOrder}` : '—'}
        </span>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={cn(
                'text-sm font-medium text-foreground truncate',
                isRejected && 'line-through text-muted-foreground',
              )}
            >
              {submission.creatorName}
            </span>
            {submission.socialUsername && (
              <span className="text-xs text-muted-foreground">
                @{submission.socialUsername}
              </span>
            )}
            {submission.isFlaggedUnavailable && !isRejected && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-500">
                <DangerTriangleIcon className="size-3.5" />
                Video Privat / Dihapus
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Disubmit {FormatSubmissionTimestamp(submission.submittedAt ?? submission.createdAt)}</span>
            {submission.liveVideoUrl && (
              <a
                href={submission.liveVideoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
              >
                Lihat Video TikTok ↗
              </a>
            )}
          </div>

          {isRejected && submission.reviewNote && (
            <p className="text-xs text-muted-foreground italic line-clamp-1">
              Catatan: {submission.reviewNote}
            </p>
          )}

          {submission.isFlaggedUnavailable && !isRejected && submission.lastSyncError && (
            <p className="text-xs text-amber-500 font-medium line-clamp-1">
              Kendala: {submission.lastSyncError} (Gagal sinkron {submission.syncFailureStreak ?? 1}x, tayangan dibekukan)
            </p>
          )}
        </div>
      </div>

      {/* Right: Verified Views, Allocated Reward & Disqualify Action */}
      <div className="flex flex-wrap items-center justify-between gap-6 sm:justify-end sm:shrink-0 pl-11 sm:pl-0">
        {/* Tayangan */}
        <div className="text-left sm:text-right min-w-[100px]">
          <p className="text-xs text-muted-foreground">Tayangan</p>
          <p className="mt-0.5 text-sm font-medium text-foreground tabular-nums">
            {FormatViewsCount(submission.verifiedViews)} views
          </p>
        </div>

        {/* Alokasi Reward */}
        <div className="text-left sm:text-right min-w-[140px]">
          <p className="text-xs text-muted-foreground">Alokasi Reward</p>
          <p
            className={cn(
              'mt-0.5 text-sm font-semibold tabular-nums',
              isRejected
                ? 'text-muted-foreground line-through'
                : submission.allocatedEarnings > 0
                  ? 'text-foreground'
                  : 'text-muted-foreground',
            )}
          >
            {FormatRupiah(submission.allocatedEarnings)}
          </p>
          {submission.isCappedByBudget && !isRejected && (
            <p className="text-xs text-amber-500 tabular-nums">
              (Tertahan sisa budget, hak {FormatRupiah(submission.targetEarnings)})
            </p>
          )}
        </div>

        {/* Action / Status Column */}
        <div className="flex items-center justify-end min-w-[125px]">
          {isApproved && !isSettled ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDisqualifying}
              onClick={HandleDisqualifyClick}
              className="h-8 px-3 text-xs text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            >
              Diskualifikasi
            </Button>
          ) : isVerified ? (
            <span className="text-xs font-medium text-emerald-500">
              Terverifikasi
            </span>
          ) : isRejected ? (
            <span className="text-xs font-medium text-destructive">
              Didiskualifikasi
            </span>
          ) : isPending ? (
            <span className="text-xs font-medium text-muted-foreground">
              Belum Direview
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
