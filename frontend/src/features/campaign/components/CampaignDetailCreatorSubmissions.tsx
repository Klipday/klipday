import { useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, ExternalLink, RotateCcw, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UseMyCampaignSubmissionQuery } from '@/features/submission/hooks';
import { FormatCompactCount } from '@/features/submission/utils/submission-utils';
import { cn } from '@/lib/utils';
import type { CampaignDetailCreatorSubmissionsProps } from '../types';

/**
 * Creator submissions view rendered on the "Video Kamu" tab in Campaign Detail.
 * Displays the clipper's submitted video details, review status badge, live metrics,
 * or prompt to submit after joining.
 *
 * @param props - Component properties containing campaignId and submit dialog handler.
 * @returns The rendered creator submission progress element.
 */
export function CampaignDetailCreatorSubmissions({
  campaignId,
  onOpenSubmitDialog,
  className,
}: CampaignDetailCreatorSubmissionsProps) {
  const { data: mySubmissionData } = UseMyCampaignSubmissionQuery(campaignId);
  const [hasThumbnailError, setHasThumbnailError] = useState(false);
  const submission = mySubmissionData?.submission;

  if (submission) {
    const status = submission.submissionStatus;
    const isJoinedOnly = status === 'JOINED';
    const isPending = status === 'PENDING_REVIEW';
    const isApproved = status === 'APPROVED';
    const isRevision = status === 'REVISION_REQUESTED';
    const isRejected = status === 'REJECTED';

    if (isJoinedOnly) {
      return (
        <div
          className={cn(
            'flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 p-8 text-center space-y-3.5',
            className,
          )}>
          <div className="max-w-md space-y-1">
            <h3 className="text-sm font-medium text-foreground">
              Kamu Sudah Tergabung dalam Kampanye Ini
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Buat dan publikasikan videomu sesuai brief, lalu kirimkan tautannya melalui formulir pengajuan.
            </p>
          </div>
          {campaignId && (
            <Button
              type="button"
              size="default"
              onClick={onOpenSubmitDialog}
              className="gap-2 font-medium px-5 rounded-xl text-xs cursor-pointer">
              <Video className="size-3.5" />
              <span>Kirim Video</span>
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className={cn('rounded-2xl border border-border/60 bg-card p-5 sm:p-6 space-y-5', className)}>
        {/* Header with status badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
          <div>
            <h3 className="text-sm font-medium text-foreground">Video Pengajuan Kamu</h3>
          </div>

          <div className="flex items-center gap-2">
            {isPending && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <Clock className="size-3" />
                <span>Menunggu Persetujuan Brand</span>
              </span>
            )}
            {isApproved && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="size-3" />
                <span>Disetujui • Pelacakan Views Aktif</span>
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

        {/* Video Card Preview */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-4 flex justify-center">
            <div className="relative aspect-[3/4] w-full max-w-[180px] overflow-hidden rounded-xl border border-border/60 bg-muted/40 shadow-xs">
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
                  <Video className="size-5 text-muted-foreground/60" />
                  <span className="text-[11px]">Tanpa thumbnail</span>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-8 space-y-4">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">Caption Video:</span>
              <p className="text-xs text-foreground font-normal leading-relaxed">
                {submission.videoCaption || 'Tidak ada caption.'}
              </p>
            </div>

            {submission.liveVideoUrl && (
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Tautan Video:</span>
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

            {/* Performance metrics flattened */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/40">
              <div className="space-y-0.5">
                <span className="text-[11px] text-muted-foreground">Tayangan Terverifikasi</span>
                <p className="text-sm font-semibold text-foreground">
                  {FormatCompactCount(submission.verifiedViews)}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] text-muted-foreground">Estimasi Pendapatan</span>
                <p className="text-sm font-semibold text-foreground">
                  Rp {Number(submission.earnings || 0).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Revision feedback banner & action */}
        {isRevision && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium text-xs">
              <AlertCircle className="size-3.5" />
              <span>Catatan Revisi dari Brand:</span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              {submission.reviewNote || 'Harap periksa kembali brief kampanye dan perbarui video kamu.'}
            </p>
            {campaignId && (
              <div className="pt-1">
                <Button
                  type="button"
                  size="sm"
                  onClick={onOpenSubmitDialog}
                  className="gap-1.5 font-medium text-xs rounded-lg cursor-pointer">
                  <RotateCcw className="size-3.5" />
                  <span>Kirim Revisi Video</span>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 p-8 text-center',
        className,
      )}>
      <div className="max-w-md space-y-1">
        <h3 className="text-sm font-medium text-foreground">
          Progres Video Kamu
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Setelah kamu bergabung dan mengunggah video, status review dan estimasi tayangan akan dipantau di sini.
        </p>
      </div>
    </div>
  );
}
