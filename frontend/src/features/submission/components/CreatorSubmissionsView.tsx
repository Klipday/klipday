import { useState } from 'react';
import {
  SquareTopDownIcon,
  VideocameraIcon,
} from '@solar-icons/react/linear';
import { Button } from '@/components/ui/button';
import { cn, SanitizeHttpUrl } from '@/lib/utils';
import { UseMyCampaignSubmissionQuery } from '../hooks';
import type {
  CreatorSubmissionItemCardProps,
  CreatorSubmissionsViewProps,
  SocialPlatform,
} from '../types';
import { FormatCompactCount } from '../utils/submission-utils';
import { RenderPlatformLogo } from './SocialPlatformIcons';

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  TIKTOK: 'TikTok',
  INSTAGRAM: 'Instagram Reels',
  YOUTUBE: 'YouTube Shorts',
};

/**
 * Single submitted video card inside the creator's "Video Kamu" tab.
 *
 * @param props - Submission record and resubmit callback.
 * @returns Rendered submission card element.
 */
function CreatorSubmissionItemCard({
  submission,
  onOpenSubmitDialog,
}: CreatorSubmissionItemCardProps) {
  const [hasThumbnailError, setHasThumbnailError] = useState(false);

  const status = submission.submissionStatus;
  const isPending = status === 'PENDING_REVIEW';
  const isApproved = status === 'APPROVED' || status === 'VERIFIED';
  const isRevision = status === 'REVISION_REQUESTED';
  const isRejected = status === 'REJECTED';
  const platformKey: SocialPlatform = submission.platform ?? submission.socialAccount?.platform ?? 'TIKTOK';
  const platformLabel = PLATFORM_LABELS[platformKey] ?? 'TikTok';

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 space-y-5">
      {/* Header with platform identity and status text */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          {RenderPlatformLogo(platformKey, 'size-4')}
          <span>{platformLabel}</span>
          {submission.socialAccount?.username && (
            <span className="text-xs font-normal text-muted-foreground">
              @{submission.socialAccount.username}
            </span>
          )}
        </div>

        <div className="flex items-center">
          {isPending && (
            <span className="text-xs font-medium text-amber-500">
              Menunggu Persetujuan Brand
            </span>
          )}
          {isApproved && (
            <span className="text-xs font-medium text-foreground">
              Disetujui, Pelacakan Views Aktif
            </span>
          )}
          {isRevision && (
            <span className="text-xs font-medium text-amber-500">
              Perlu Revisi
            </span>
          )}
          {isRejected && (
            <span className="text-xs font-medium text-destructive">
              Ditolak
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
                <VideocameraIcon className="size-5 text-muted-foreground/60" />
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

          {SanitizeHttpUrl(submission.liveVideoUrl) && (
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">Tautan Video:</span>
              <div>
                <a
                  href={SanitizeHttpUrl(submission.liveVideoUrl)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline break-all">
                  <span>{submission.liveVideoUrl}</span>
                  <SquareTopDownIcon className="size-3 shrink-0" />
                </a>
              </div>
            </div>
          )}

          {/* Performance Stats */}
          <div className="flex items-center gap-6 pt-2 border-t border-border/40 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Tayangan</span>
              <p className="font-semibold text-foreground tabular-nums">{FormatCompactCount(submission.verifiedViews)}</p>
            </div>
            <div className="h-6 w-px bg-border/40" />
            <div className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Estimasi Penghasilan</span>
              <p className="font-semibold text-foreground tabular-nums">
                Rp {Number(submission.earnings || 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Revision note from brand */}
          {isRevision && submission.reviewNote && (
            <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-3 space-y-1 text-xs">
              <span className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider block">
                Catatan Revisi dari Brand:
              </span>
              <p className="text-xs text-foreground leading-relaxed">{submission.reviewNote}</p>
            </div>
          )}

          {/* Re-submit action for revision */}
          {isRevision && (
            <Button
              type="button"
              size="sm"
              onClick={onOpenSubmitDialog}
              className="mt-2 text-xs rounded-xl font-medium cursor-pointer">
              Ajukan Ulang Video
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Creator submissions view rendered on the "Video Kamu" tab in Campaign Detail.
 * Displays all of the clipper's submitted videos across allowed platforms,
 * per-platform remaining quotas, and quick action to submit additional clips when permitted.
 *
 * @param props - Component properties containing campaignId and submit dialog handler.
 * @returns The rendered creator submission progress element.
 */
export function CreatorSubmissionsView({
  campaignId,
  onOpenSubmitDialog,
  className,
}: CreatorSubmissionsViewProps) {
  const { data: mySubmissionData } = UseMyCampaignSubmissionQuery(campaignId);
  const allSubmissions = mySubmissionData?.submissions?.length
    ? mySubmissionData.submissions
    : mySubmissionData?.submission
      ? [mySubmissionData.submission]
      : [];

  const isJoined = Boolean(mySubmissionData?.isJoined ?? allSubmissions.length > 0);
  const submittedItems = allSubmissions.filter((s) => s.submissionStatus !== 'JOINED');
  const canSubmitMore = Boolean(mySubmissionData?.canSubmitMore);

  if (isJoined && submittedItems.length === 0) {
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
            <VideocameraIcon className="size-3.5" />
            <span>Kirim Video</span>
          </Button>
        )}
      </div>
    );
  }

  if (submittedItems.length > 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-foreground">
              Video Pengajuan Kamu ({submittedItems.length})
            </h3>
            {mySubmissionData?.platformQuotas && mySubmissionData.platformQuotas.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
                {mySubmissionData.platformQuotas.map((q) => (
                  <span key={q.platform}>
                    {PLATFORM_LABELS[q.platform]}: {q.submittedCount}
                    {q.maxSubmissions === null ? ' video' : `/${q.maxSubmissions} video`}
                  </span>
                ))}
              </div>
            )}
          </div>

          {canSubmitMore && (
            <Button
              type="button"
              size="sm"
              onClick={onOpenSubmitDialog}
              className="gap-2 font-medium rounded-xl text-xs cursor-pointer shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
              <VideocameraIcon className="size-3.5" />
              <span>Kirim Video Lainnya</span>
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {submittedItems.map((item) => (
            <CreatorSubmissionItemCard
              key={item.id}
              submission={item}
              onOpenSubmitDialog={onOpenSubmitDialog}
            />
          ))}
        </div>
      </div>
    );
  }

  // Not joined state
  return (
    <div
      className={cn(
        'flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 p-8 text-center space-y-3.5',
        className,
      )}>
      <div className="flex size-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground border border-border/40">
        <VideocameraIcon className="size-5" />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-sm font-medium text-foreground">
          Belum Bergabung dengan Kampanye
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Kamu belum bergabung dengan kampanye ini. Klik tombol &quot;Gabung Kampanye&quot; di atas untuk mulai membuat dan mengirimkan video clipping.
        </p>
      </div>
    </div>
  );
}

export { CreatorSubmissionsView as CampaignDetailCreatorSubmissions };
