import { useState } from 'react';
import { Check, Eye, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SubmissionVideoCardProps } from '../types';
import { FormatCompactCount } from '../utils/submission-utils';

/**
 * Interactive card component representing a TikTok video item in the gallery.
 *
 * @param props - Card properties with video metadata, selection state, and select callback.
 * @returns Rendered video selector card.
 */
export function SubmissionVideoCard({
  video,
  isSelected,
  onSelect,
  className,
}: SubmissionVideoCardProps) {
  const [hasError, setHasError] = useState(false);

  const HandleClick = () => {
    if (isSelected) {
      onSelect(null);
    } else {
      onSelect(video);
    }
  };

  const viewCountDisplay = FormatCompactCount(video.viewCount);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={HandleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          HandleClick();
        }
      }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all cursor-pointer text-left focus-visible:ring-2 focus-visible:ring-ring outline-none select-none',
        isSelected
          ? 'border-foreground/80 ring-1 ring-foreground/20 bg-muted/20 shadow-xs'
          : 'border-border/60 hover:border-foreground/40 hover:bg-muted/10 hover:shadow-xs',
        className,
      )}>
      {/* Thumbnail Aspect 3/4 Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted/40">
        {video.thumbnailUrl && !hasError ? (
          <img
            src={video.thumbnailUrl}
            alt={video.caption || 'Thumbnail video'}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setHasError(true)}
          />
        ) : (
          <div className="flex flex-col h-full w-full items-center justify-center gap-1 bg-muted/50 text-muted-foreground text-xs p-2 text-center">
            <Video className="size-5 text-muted-foreground/60" />
            <span className="text-[10px]">Tidak ada pratinjau</span>
          </div>
        )}

        {/* Top-right selection badge */}
        <div
          className={cn(
            'absolute top-2 right-2 flex items-center justify-center transition-all',
            isSelected
              ? 'size-6 rounded-full bg-foreground text-background shadow-xs'
              : 'size-6 rounded-full border border-white/60 bg-black/30 text-transparent opacity-0 group-hover:opacity-100 backdrop-blur-xs',
          )}>
          <Check className="size-3.5 stroke-[2.5]" />
        </div>

        {/* Bottom view count pill */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-xs">
          <Eye className="size-3" />
          <span>{viewCountDisplay} views</span>
        </div>
      </div>

      {/* Caption snippet */}
      <div className="flex flex-col p-2.5 gap-0.5">
        <p className="text-xs text-foreground font-medium line-clamp-2 leading-snug">
          {video.caption || 'Tanpa caption video.'}
        </p>
        <span className="text-[10px] text-muted-foreground truncate">
          @{video.authorUsername}
        </span>
      </div>
    </div>
  );
}
