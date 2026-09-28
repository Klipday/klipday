import { useState } from 'react';
import { AlertCircle, Check, Loader2, RefreshCw, Video } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { UseRecentTikTokVideosQuery, UseValidateTikTokVideoUrlMutation } from '../hooks';
import type { SubmissionStep3VideoPickerDialogProps } from '../types';
import { RenderPlatformLogo } from './SocialPlatformIcons';
import { SubmissionVideoCard } from './SubmissionVideoCard';

type VideoPickerTab = 'GALLERY' | 'MANUAL';

/**
 * Step 3 dialog body component: "Pilih Video".
 * Presents a modern, clean segmented picker:
 * - Tab 1: Profile video gallery with direct in-place card selection.
 * - Tab 2: Focused direct TikTok link submission with author verification.
 *
 * @param props - Component properties containing account, selectedVideo, onSelectVideo, and onSwitchAccount.
 * @returns Rendered video picker dialog interface.
 */
export function SubmissionStep3VideoPickerDialog({
  connectedAccount,
  selectedVideo,
  onSelectVideo,
  onSwitchAccount,
  className,
}: SubmissionStep3VideoPickerDialogProps) {
  const {
    data: recentVideos,
    isLoading: isLoadingVideos,
    isError,
    error,
    refetch,
    isFetching,
  } = UseRecentTikTokVideosQuery(
    Boolean(connectedAccount?.isVerified),
    connectedAccount?.username,
  );
  const validateUrlMutation = UseValidateTikTokVideoUrlMutation();

  const [activeTab, setActiveTab] = useState<VideoPickerTab>('GALLERY');
  const [manualUrlInput, setManualUrlInput] = useState('');
  const [hasManualThumbnailError, setHasManualThumbnailError] = useState(false);

  const HandleValidateManualUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleanUrl = manualUrlInput.trim();
    if (!cleanUrl) {
      toast.error('Harap masukkan tautan video TikTok.');
      return;
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    try {
      const validatedVideo = await validateUrlMutation.mutateAsync({
        videoUrl: cleanUrl,
      });
      onSelectVideo(validatedVideo);
      setManualUrlInput('');
      toast.success('Video TikTok berhasil diverifikasi dan dipilih!');
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Tautan video TikTok tidak valid atau milik akun lain.';
      toast.error(msg);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header Row: Title & Connected Account Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Pilih Video
          </h1>
          <p className="text-xs text-muted-foreground">
            Pilih video yang sudah kamu unggah untuk kampanye ini.
          </p>
        </div>

        {connectedAccount && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/70 bg-muted/20 shrink-0 self-start sm:self-auto">
            <div className="size-4 shrink-0 flex items-center justify-center">
              {RenderPlatformLogo(connectedAccount.platform || 'TIKTOK', 'size-3.5')}
            </div>
            <span className="text-xs font-semibold text-foreground">
              @{connectedAccount.username}
            </span>
            {onSwitchAccount && (
              <button
                type="button"
                onClick={onSwitchAccount}
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground hover:underline ml-1 cursor-pointer">
                Ganti
              </button>
            )}
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Segarkan galeri video"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground ml-1.5 pl-1.5 border-l border-border/60 cursor-pointer disabled:opacity-50">
              <RefreshCw className={cn('size-3', isFetching && 'animate-spin')} />
              <span>{isFetching ? 'Memuat...' : 'Segarkan'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Segmented Control Tabs (Edge-to-Edge styling) */}
      <div className="inline-flex w-full sm:w-auto p-0 overflow-hidden border border-border/70 rounded-xl divide-x divide-border/60 bg-muted/20 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('GALLERY')}
          className={cn(
            'flex-1 sm:flex-initial px-4 py-2 text-center transition-colors cursor-pointer first:rounded-l-xl',
            activeTab === 'GALLERY'
              ? 'bg-foreground text-background font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
          )}>
          Galeri Profil {recentVideos && recentVideos.length > 0 ? `(${recentVideos.length})` : ''}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('MANUAL')}
          className={cn(
            'flex-1 sm:flex-initial px-4 py-2 text-center transition-colors cursor-pointer last:rounded-r-xl',
            activeTab === 'MANUAL'
              ? 'bg-foreground text-background font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
          )}>
          Tautan Langsung
        </button>
      </div>

      {/* Tab 1: Galeri Profil */}
      {activeTab === 'GALLERY' && (
        <div className="space-y-3 pt-1">
          {/* Subtle Selection Status Notice (Replaces the clunky duplicate box) */}
          {selectedVideo && (
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-muted/40 border border-border/70 text-xs">
              <span className="text-foreground truncate pr-2">
                Terpilih: <span className="font-semibold">{selectedVideo.caption || selectedVideo.url}</span>
              </span>
              <button
                type="button"
                onClick={() => onSelectVideo(null)}
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground hover:underline shrink-0 cursor-pointer">
                Batalkan
              </button>
            </div>
          )}

          {isError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
              <div className="size-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                <AlertCircle className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Gagal Memuat Galeri Video TikTok
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {error instanceof Error
                    ? error.message
                    : 'Sistem sedang kesulitan mengambil daftar video dari TikTok. Silakan coba lagi atau gunakan tautan langsung.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="text-xs gap-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground">
                  <RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} />
                  <span>Coba Lagi</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('MANUAL')}
                  className="text-xs rounded-lg">
                  Gunakan Tautan Langsung
                </Button>
              </div>
            </div>
          ) : isLoadingVideos ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-pulse">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="aspect-[3/4] rounded-xl bg-muted/40" />
              ))}
            </div>
          ) : recentVideos && recentVideos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[340px] overflow-y-auto pr-1">
              {recentVideos.map((video) => {
                const isSelected = selectedVideo?.url === video.url;
                return (
                  <SubmissionVideoCard
                    key={video.id || video.url}
                    video={video}
                    isSelected={isSelected}
                    onSelect={onSelectVideo}
                  />
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/70 p-8 text-center space-y-2 bg-muted/10">
              <p className="text-sm font-semibold text-foreground">
                Belum ada video publik ditemukan di akun @{connectedAccount?.username || 'kamu'}.
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Jika video baru saja diunggah ke TikTok, klik segarkan galeri atau tempelkan tautan videonya secara langsung.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="text-xs rounded-lg gap-1.5">
                  <RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} />
                  <span>Segarkan Galeri</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setActiveTab('MANUAL')}
                  className="text-xs rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground">
                  Gunakan Tautan Langsung
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Tautan Langsung */}
      {activeTab === 'MANUAL' && (
        <div className="space-y-4 pt-1">
          {/* Verified Manual Video Preview Card */}
          {selectedVideo ? (
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
                  onSelectVideo(null);
                  setManualUrlInput('');
                }}
                className="text-xs h-8 px-3 rounded-lg text-muted-foreground hover:text-foreground shrink-0">
                Ganti Tautan
              </Button>
            </div>
          ) : (
            <form onSubmit={HandleValidateManualUrl} className="space-y-3.5 max-w-lg">
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
                    disabled={validateUrlMutation.isPending}
                    className="h-10 rounded-xl text-xs"
                  />
                  <Button
                    type="submit"
                    disabled={validateUrlMutation.isPending || !manualUrlInput.trim()}
                    className="h-10 rounded-xl px-4 text-xs font-medium shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
                    {validateUrlMutation.isPending ? (
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
      )}
    </div>
  );
}
