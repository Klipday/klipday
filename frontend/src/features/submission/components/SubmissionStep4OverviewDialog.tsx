import { useState } from 'react';
import { ExternalLink, Info, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SubmissionStep4OverviewDialogProps } from '../types';

/**
 * Step 4 dialog body component: "Konfirmasi & Kirim".
 * Presents final overview of the selected video, thumbnail, caption, and creator credentials
 * prior to dispatching the final submission to the server.
 *
 * @param props - Component properties containing campaign, selectedVideo, and connectedAccount.
 * @returns Rendered confirmation preview interface.
 */
export function SubmissionStep4OverviewDialog({
  campaign,
  selectedVideo,
  connectedAccount,
  className,
}: SubmissionStep4OverviewDialogProps) {
  const [hasThumbnailError, setHasThumbnailError] = useState(false);
  const liveVideoUrl = selectedVideo?.url;
  const thumbnailUrl = selectedVideo?.thumbnailUrl;
  const videoCaption = selectedVideo?.caption;

  return (
    <div className={cn('space-y-5', className)}>
      {/* Step Heading */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Konfirmasi &amp; Kirim
        </h1>
        <p className="text-xs text-muted-foreground">
          Periksa kembali detail video yang akan kamu ajukan sebelum dikirim ke brand.
        </p>
      </div>

      {/* Campaign & Creator Overview Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl border border-border/60 bg-muted/15 text-xs">
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
            Kampanye
          </span>
          <p className="font-semibold text-foreground truncate max-w-sm">
            {campaign.title || 'Kampanye'}
          </p>
        </div>

        <div className="space-y-0.5 sm:text-right">
          <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
            Akun Kreator
          </span>
          <p className="font-semibold text-foreground">
            @{connectedAccount?.username || selectedVideo?.authorUsername || 'kreator'}
          </p>
        </div>
      </div>

      {/* Video Details Card */}
      <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
          {/* Thumbnail preview */}
          <div className="sm:col-span-4 flex justify-center sm:justify-start">
            <div className="relative aspect-3/4 w-full max-w-[150px] overflow-hidden rounded-xl border border-border/60 bg-muted/30 shadow-xs">
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

          {/* Video Metadata */}
          <div className="sm:col-span-8 space-y-3">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">Caption Video:</span>
              <p className="text-xs text-foreground font-normal leading-relaxed max-h-24 overflow-y-auto pr-1">
                {videoCaption || 'Tidak ada caption video.'}
              </p>
            </div>

            {liveVideoUrl && (
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Tautan Video:</span>
                <div>
                  <a
                    href={liveVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-foreground/90 hover:text-foreground hover:underline break-all font-medium">
                    <span>{liveVideoUrl}</span>
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quiet Review Notice */}
      <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5 flex items-start gap-2.5">
        <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Setelah dikirim, brand akan meninjau video kamu dalam 1×24 jam kerja. Pastikan video tidak di-private atau dihapus selama periode kampanye berlangsung agar pelacakan views tetap berjalan.
        </p>
      </div>
    </div>
  );
}
