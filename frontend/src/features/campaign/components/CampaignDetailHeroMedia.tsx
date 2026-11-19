import { useState } from 'react';
import { GalleryOffIcon } from '@solar-icons/react/linear';
import { cn } from '@/lib/utils';
import type { CampaignDetailHeroMediaProps } from '../types';

/**
 * Renders the prominent preview card for campaign media/thumbnail in the hero banner.
 * Employs a dark atmospheric gradient and subtle frosted glass tags,
 * matching the campaign visual identity.
 *
 * @param props - Component properties with thumbnail URL, campaign title, and type badge.
 * @returns The rendered hero media card element.
 */
export function CampaignDetailHeroMedia({
  thumbnailUrl,
  title,
  typeBadge = 'CLIPPING',
  brandName,
  className,
}: CampaignDetailHeroMediaProps) {
  const [imageError, setImageError] = useState(false);

  const fallbackTitle = title || 'Thumbnail Kampanye';

  return (
    <div
      className={cn(
        'relative aspect-[16/10] w-full max-w-sm sm:max-w-md lg:max-w-[420px] overflow-hidden rounded-2xl border border-white/20 bg-card shadow-2xl isolate ring-1 ring-white/10 group transition-all duration-300',
        className
      )}>
      {thumbnailUrl && !imageError ? (
        <img
          src={thumbnailUrl}
          alt={fallbackTitle}
          onError={() => setImageError(true)}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted/40 text-muted-foreground">
          <GalleryOffIcon className="size-10 opacity-40" />
        </div>
      )}

      {/* Subtle bottom shadow to ensure legibility of bottom metadata without darkening artwork */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      {/* Top pill: Campaign Type (matching Falcon Pictures / Wardah references) */}
      <div className="absolute top-3 right-3 z-10">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold text-amber-300 dark:text-amber-400 bg-black/60 backdrop-blur-md border border-white/15 uppercase tracking-wider shadow-sm">
          {typeBadge}
        </span>
      </div>

      {/* Bottom overlay: Brand identity pill */}
      {brandName && (
        <div className="absolute bottom-3 left-3 z-10 max-w-[80%]">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white shadow-xs">
            <div className="size-4 rounded-full bg-primary/30 text-[10px] font-bold flex items-center justify-center text-white">
              {brandName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium truncate drop-shadow-xs">{brandName}</span>
          </div>
        </div>
      )}
    </div>
  );
}
