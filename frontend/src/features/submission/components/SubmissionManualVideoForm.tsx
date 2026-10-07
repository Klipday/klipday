import { useState } from 'react';
import { Check, Loader2, Video } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { SubmissionManualVideoFormProps } from '../types';

/**
 * Reusable form component for direct manual TikTok URL submission and validation.
 *
 * @param props - URL validation state, callbacks, and selected video preview.
 * @returns Rendered manual URL form or verified video card.
 */
export function SubmissionManualVideoForm({
  selectedVideo,
  connectedAccount,
  isPending,
  onValidateUrl,
  onClearSelectedVideo,
  className,
}: SubmissionManualVideoFormProps) {
  const [manualUrlInput, setManualUrlInput] = useState('');
  const [hasManualThumbnailError, setHasManualThumbnailError] = useState(false);

  const HandleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleanUrl = manualUrlInput.trim();
    if (!cleanUrl) {
      toast.error('Harap masukkan tautan video TikTok.');
      return;
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    await onValidateUrl(cleanUrl);
    setManualUrlInput('');
  };

  return (
    <div className={cn('space-y-4 pt-1', className)}>
      {selectedVideo ? (
        /* Verified Manual Video Preview Card */
        <div className="rounded-xl border border-border/80 bg-muted/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5 min-w-0">
            {selectedVideo.thumbnailUrl && !hasManualThumbnailError ? (
              <img
                src={selectedVideo.thumbnailUrl}
                alt="Thumbnail terpilih"
                referrerPolicy="no-referrer"
                className="size-16 rounded-lg object-cover border border-border/60 shrink-0"
                onError={() => setHasManualThumbnailError(true)}
              />
            ) : (
              <div className="size-16 rounded-lg bg-muted/60 border border-border/60 flex flex-col items-center justify-center text-xs text-muted-foreground shrink-0 gap-1">
                <Video className="size-5 text-muted-foreground/60" />
                <span className="text-[10px]">Video</span>
              </div>
            )}
            <div className="min-w-0 space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-foreground text-background">
                <Check className="size-3 stroke-[2.5]" />
                <span>Tautan Terverifikasi</span>
              </div>
              <p className="text-xs font-semibold text-foreground line-clamp-1">
                {selectedVideo.caption || selectedVideo.url}
              </p>
              <p className="text-[11px] text-muted-foreground">
                @{selectedVideo.authorUsername}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onClearSelectedVideo();
              setManualUrlInput('');
            }}
            className="text-xs h-8 px-3 rounded-lg text-muted-foreground hover:text-foreground shrink-0 cursor-pointer">
            Ganti Tautan
          </Button>
        </div>
      ) : (
        <form onSubmit={HandleSubmit} className="space-y-3.5 max-w-lg">
          <div className="space-y-1.5">
            <Label
              htmlFor="manual-tiktok-dialog-url"
              className="text-xs font-medium text-foreground">
              Tempel Tautan Video TikTok
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="manual-tiktok-dialog-url"
                type="url"
                placeholder="https://www.tiktok.com/@username/video/..."
                value={manualUrlInput}
                onChange={(e) => setManualUrlInput(e.target.value)}
                disabled={isPending}
                className="h-10 rounded-xl text-xs"
              />
              <Button
                type="submit"
                disabled={isPending || !manualUrlInput.trim()}
                className="h-10 rounded-xl px-4 text-xs font-medium shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  'Periksa'
                )}
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Pastikan video bersifat publik dan diunggah langsung oleh akun{' '}
            <span className="font-semibold text-foreground">
              @{connectedAccount?.username || 'kamu'}
            </span>
            .
          </p>
        </form>
      )}
    </div>
  );
}
