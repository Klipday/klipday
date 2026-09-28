import { useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Link as LinkIcon, Loader2, Video } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  UseRecentTikTokVideosQuery,
  UseSaveDraftSubmissionMutation,
  UseValidateTikTokVideoUrlMutation,
} from '../hooks';
import type { SocialVideoItem, SubmissionFormStep3VideoPickerProps } from '../types';
import { SubmissionVideoCard } from './SubmissionVideoCard';

/**
 * Step 3 component: Video Selection from TikTok.
 * Features a visual recent video gallery and manual direct URL fallback with author validation.
 * Selected video is automatically saved as a draft row to allow resume-on-refresh.
 *
 * @param props - Component props with campaignId, currentDraft, and connectedAccount.
 * @returns Rendered video picker interface.
 */
export function SubmissionFormStep3VideoPicker({
  campaignId,
  currentDraft,
  connectedAccount,
  className,
}: SubmissionFormStep3VideoPickerProps) {
  const navigate = useNavigate();
  const [hasSelectedThumbnailError, setHasSelectedThumbnailError] = useState(false);

  const { data: recentVideos, isLoading: isLoadingVideos } = UseRecentTikTokVideosQuery(
    Boolean(connectedAccount?.isVerified),
    connectedAccount?.username,
  );
  const saveDraftMutation = UseSaveDraftSubmissionMutation(campaignId);
  const validateUrlMutation = UseValidateTikTokVideoUrlMutation();

  const draftFallback: SocialVideoItem | null = currentDraft?.liveVideoUrl
    ? {
        id: 'draft-video',
        url: currentDraft.liveVideoUrl,
        authorUsername: connectedAccount?.username || 'creator',
        caption: currentDraft.videoCaption || undefined,
        thumbnailUrl: currentDraft.thumbnailUrl || undefined,
      }
    : null;

  const [pickedVideo, setPickedVideo] = useState<SocialVideoItem | null>(null);
  const [isSelectionCleared, setIsSelectionCleared] = useState(false);

  const selectedVideo = isSelectionCleared ? null : (pickedVideo ?? draftFallback);

  const [isManualAccordionOpen, setIsManualAccordionOpen] = useState(false);
  const [manualUrlInput, setManualUrlInput] = useState('');

  const HandleSelectVideo = async (video: SocialVideoItem | null) => {
    if (!video) {
      setPickedVideo(null);
      setIsSelectionCleared(true);
      return;
    }

    setPickedVideo(video);
    setIsSelectionCleared(false);

    try {
      await saveDraftMutation.mutateAsync({
        liveVideoUrl: video.url,
        thumbnailUrl: video.thumbnailUrl,
        videoCaption: video.caption,
        socialAccountId: connectedAccount?.id,
      });
      toast.success('Video dipilih dan draf tersimpan.');
    } catch {
      toast.error('Gagal menyimpan pilihan video.');
    }
  };

  const HandleValidateManualUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleanUrl = manualUrlInput.trim();
    if (!cleanUrl) {
      toast.error('Harap masukkan tautan video.');
      return;
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    try {
      const validatedVideo = await validateUrlMutation.mutateAsync({
        videoUrl: cleanUrl,
      });
      await HandleSelectVideo(validatedVideo);
      setManualUrlInput('');
      setIsManualAccordionOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Tautan video tidak valid.';
      toast.error(msg);
    }
  };

  const HandleContinue = () => {
    if (!selectedVideo) {
      toast.error('Harap pilih video terlebih dahulu.');
      return;
    }
    navigate(`/campaigns/${campaignId}/submit/step-4`);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header instructions */}
      <div className="border-b border-border/40 pb-3">
        <p className="text-xs text-muted-foreground">
          Pilih video dari galeri akun @{connectedAccount?.username} di bawah atau masukkan tautan secara manual.
        </p>
      </div>

      {/* Currently Selected Video Preview Banner (Neutralized) */}
      {selectedVideo && (
        <div className="rounded-xl border border-border/70 bg-muted/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {selectedVideo.thumbnailUrl && !hasSelectedThumbnailError ? (
              <img
                src={selectedVideo.thumbnailUrl}
                alt="Thumbnail terpilih"
                referrerPolicy="no-referrer"
                className="size-14 rounded-lg object-cover border border-border/60 shrink-0"
                onError={() => setHasSelectedThumbnailError(true)}
              />
            ) : (
              <div className="size-14 rounded-lg bg-muted/60 border border-border/60 flex flex-col items-center justify-center text-[10px] text-muted-foreground shrink-0 gap-0.5">
                <Video className="size-4 text-muted-foreground/60" />
                <span className="text-[9px]">Video</span>
              </div>
            )}
            <div className="min-w-0 space-y-0.5">
              <span className="text-xs font-medium text-foreground">
                Video Terpilih
              </span>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {selectedVideo.caption || selectedVideo.url}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setPickedVideo(null);
              setIsSelectionCleared(true);
            }}
            className="text-xs text-muted-foreground hover:text-foreground shrink-0">
            Ganti Video
          </Button>
        </div>
      )}

      {/* Video Gallery Grid */}
      {isLoadingVideos ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="aspect-[3/4] rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : recentVideos && recentVideos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {recentVideos.map((video) => {
            const isSelected = selectedVideo?.url === video.url;
            return (
              <SubmissionVideoCard
                key={video.id || video.url}
                video={video}
                isSelected={isSelected}
                onSelect={HandleSelectVideo}
              />
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 p-8 text-center space-y-2 bg-muted/10">
          <p className="text-xs font-medium text-foreground">Belum ada video publik ditemukan di akun kamu.</p>
          <p className="text-[11px] text-muted-foreground">
            Jika video baru saja diunggah, kamu dapat memasukkan tautannya secara manual di bawah.
          </p>
        </div>
      )}

      {/* Manual Link Fallback Accordion */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsManualAccordionOpen((prev) => !prev)}
          className="flex w-full items-center justify-between p-3.5 text-left hover:bg-muted/20 transition-colors cursor-pointer">
          <div className="flex items-center gap-2">
            <LinkIcon className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">
              Masukkan tautan video secara manual
            </span>
          </div>
          {isManualAccordionOpen ? (
            <ChevronUp className="size-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          )}
        </button>

        {isManualAccordionOpen && (
          <div className="p-4 pt-2 border-t border-border/40 bg-muted/10 space-y-3">
            <form onSubmit={HandleValidateManualUrl} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="manual-video-url" className="text-xs font-medium text-foreground">
                  Tautan Video
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="manual-video-url"
                    type="url"
                    placeholder="https://..."
                    value={manualUrlInput}
                    onChange={(e) => setManualUrlInput(e.target.value)}
                    disabled={validateUrlMutation.isPending}
                    className="h-10 rounded-xl text-xs"
                  />
                  <Button
                    type="submit"
                    disabled={validateUrlMutation.isPending || !manualUrlInput.trim()}
                    className="h-10 rounded-xl px-4 text-xs font-medium shrink-0">
                    {validateUrlMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      'Periksa Tautan'
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Hanya video yang diunggah oleh akun @{connectedAccount?.username} yang dapat diverifikasi.
              </p>
            </form>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <Button
          type="button"
          variant="ghost"
          size="default"
          onClick={() => navigate(`/campaigns/${campaignId}/submit/step-2`)}
          className="gap-2 text-xs text-muted-foreground hover:text-foreground rounded-xl">
          <ArrowLeft className="size-3.5" />
          <span>Kembali</span>
        </Button>

        <Button
          type="button"
          size="default"
          onClick={HandleContinue}
          disabled={!selectedVideo || saveDraftMutation.isPending}
          className="gap-2 font-medium px-5 rounded-xl">
          <span>Lanjut ke Pratinjau</span>
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
