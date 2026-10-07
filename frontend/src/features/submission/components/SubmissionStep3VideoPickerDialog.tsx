import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { UseRecentTikTokVideosQuery, UseValidateTikTokVideoUrlMutation } from '../hooks';
import type {
  SubmissionStep3VideoPickerDialogProps,
  VideoPickerTab,
} from '../types';
import { RenderPlatformLogo } from './SocialPlatformIcons';
import { SubmissionManualVideoForm } from './SubmissionManualVideoForm';
import { SubmissionVideoGallery } from './SubmissionVideoGallery';

/**
 * Step 3 dialog body component: "Pilih Video".
 * Presents a modern, clean segmented picker composing focused subcomponents:
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

  const HandleValidateManualUrl = async (cleanUrl: string) => {
    try {
      const validatedVideo = await validateUrlMutation.mutateAsync({
        videoUrl: cleanUrl,
      });
      onSelectVideo(validatedVideo);
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
        <SubmissionVideoGallery
          recentVideos={recentVideos}
          selectedVideo={selectedVideo}
          connectedAccount={connectedAccount}
          isLoading={isLoadingVideos}
          isError={isError}
          error={error}
          isFetching={isFetching}
          onSelectVideo={onSelectVideo}
          onRefetch={() => void refetch()}
          onSwitchToManual={() => setActiveTab('MANUAL')}
        />
      )}

      {/* Tab 2: Tautan Langsung */}
      {activeTab === 'MANUAL' && (
        <SubmissionManualVideoForm
          selectedVideo={selectedVideo}
          connectedAccount={connectedAccount}
          isPending={validateUrlMutation.isPending}
          onValidateUrl={HandleValidateManualUrl}
          onClearSelectedVideo={() => onSelectVideo(null)}
        />
      )}
    </div>
  );
}
