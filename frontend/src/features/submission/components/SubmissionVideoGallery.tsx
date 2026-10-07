import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SubmissionVideoGalleryProps } from '../types';
import { SubmissionVideoCard } from './SubmissionVideoCard';

/**
 * Reusable video gallery component for browsing and selecting TikTok clips.
 *
 * @param props - Gallery configuration and selection callbacks.
 * @returns Rendered gallery grid with states.
 */
export function SubmissionVideoGallery({
  recentVideos,
  selectedVideo,
  connectedAccount,
  isLoading,
  isError,
  error,
  isFetching,
  onSelectVideo,
  onRefetch,
  onSwitchToManual,
  className,
}: SubmissionVideoGalleryProps) {
  return (
    <div className={cn('space-y-3 pt-1', className)}>
      {/* Selection Status Notice */}
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
              onClick={onRefetch}
              disabled={isFetching}
              className="text-xs gap-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer">
              <RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} />
              <span>Coba Lagi</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSwitchToManual}
              className="text-xs rounded-lg cursor-pointer">
              Gunakan Tautan Langsung
            </Button>
          </div>
        </div>
      ) : isLoading ? (
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
              onClick={onRefetch}
              disabled={isFetching}
              className="text-xs rounded-lg gap-1.5 cursor-pointer">
              <RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} />
              <span>Segarkan Galeri</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onSwitchToManual}
              className="text-xs rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer">
              Gunakan Tautan Langsung
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
