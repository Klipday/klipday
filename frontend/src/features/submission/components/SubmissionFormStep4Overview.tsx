import { useState } from 'react';
import { ExternalLink, Loader2, SendHorizontal, Video } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UseFinalSubmitVideoMutation } from '../hooks';
import type { SubmissionFormStep4OverviewProps } from '../types';

/**
 * Step 4 component: Video Submission Overview & Final Confirmation.
 * Displays video preview, author metadata, and submission confirmation.
 * Submitting transitions the status from JOINED to PENDING_REVIEW and redirects to Campaign Detail.
 *
 * @param props - Component props with campaign, draft submission, and connected account data.
 * @returns Rendered overview and submit card.
 */
export function SubmissionFormStep4Overview({
  campaign,
  submission,
  connectedAccount,
  className,
}: SubmissionFormStep4OverviewProps) {
  const [hasThumbnailError, setHasThumbnailError] = useState(false);
  const navigate = useNavigate();
  const finalSubmitMutation = UseFinalSubmitVideoMutation(campaign.id);

  const liveVideoUrl = submission?.liveVideoUrl;
  const thumbnailUrl = submission?.thumbnailUrl;
  const videoCaption = submission?.videoCaption;

  const HandleFinalSubmit = async () => {
    if (!liveVideoUrl) {
      toast.error('URL video belum dipilih. Silakan kembali ke langkah sebelumnya.');
      return;
    }

    try {
      await finalSubmitMutation.mutateAsync({
        liveVideoUrl,
        thumbnailUrl: thumbnailUrl ?? undefined,
        videoCaption: videoCaption ?? undefined,
        socialAccountId: connectedAccount?.id,
      });

      toast.success('Pengajuan video berhasil dikirimkan!');
      navigate(`/campaigns/${campaign.id}?tab=my-videos`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim pengajuan video.';
      toast.error(msg);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Campaign & Creator Metadata Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div className="space-y-0.5">
          <span className="text-[11px] text-muted-foreground">Kampanye:</span>
          <p className="text-sm font-medium text-foreground">{campaign.title}</p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Kreator:</span>
          <span className="font-medium text-foreground">
            @{connectedAccount?.username || 'kreator'}
          </span>
        </div>
      </div>

      {/* Media & Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
        {/* Thumbnail preview */}
        <div className="sm:col-span-4 flex justify-center sm:justify-start">
          <div className="relative aspect-[3/4] w-full max-w-[180px] overflow-hidden rounded-xl border border-border/60 bg-muted/30 shadow-xs">
            {thumbnailUrl && !hasThumbnailError ? (
              <img
                src={thumbnailUrl}
                alt={videoCaption || 'Thumbnail video'}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
                onError={() => setHasThumbnailError(true)}
              />
            ) : (
              <div className="flex flex-col h-full w-full items-center justify-center gap-1.5 p-3 text-center text-xs text-muted-foreground">
                <Video className="size-5 text-muted-foreground/60" />
                <span className="text-[11px]">Tanpa pratinjau</span>
              </div>
            )}
          </div>
        </div>

        {/* Video information */}
        <div className="sm:col-span-8 space-y-3.5">
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium">Caption Video</span>
            <p className="text-xs text-foreground font-normal leading-relaxed">
              {videoCaption || 'Tidak ada caption.'}
            </p>
          </div>

          {liveVideoUrl && (
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium">Tautan Video</span>
              <div>
                <a
                  href={liveVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline break-all">
                  <span>{liveVideoUrl}</span>
                  <ExternalLink className="size-3 shrink-0" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quiet Review Footnote */}
      <div className="border-t border-border/40 pt-3">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Video akan ditinjau oleh brand dalam 1×24 jam kerja sebelum pelacakan views aktif.
        </p>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-1">
        <Button
          type="button"
          variant="ghost"
          size="default"
          onClick={() => navigate(`/campaigns/${campaign.id}/submit/step-3`)}
          disabled={finalSubmitMutation.isPending}
          className="text-xs text-muted-foreground hover:text-foreground rounded-xl">
          <span>Ganti Video</span>
        </Button>

        <Button
          type="button"
          size="default"
          onClick={HandleFinalSubmit}
          disabled={finalSubmitMutation.isPending || !liveVideoUrl}
          className="gap-2 font-medium px-5 rounded-xl">
          {finalSubmitMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Mengirimkan...</span>
            </>
          ) : (
            <>
              <SendHorizontal className="size-4" />
              <span>Kirim Pengajuan Video</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
