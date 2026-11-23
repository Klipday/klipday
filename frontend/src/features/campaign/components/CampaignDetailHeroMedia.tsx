import { useState } from 'react';
import { GalleryOffIcon } from '@solar-icons/react/linear';
import { SanitizeHttpUrl, cn } from '@/lib/utils';
import type { CampaignDetailHeroMediaProps } from '../types';

/**
 * Renders a clean, frameless thumbnail card for campaign media in the detail header.
 * Keeps artwork completely unobstructed without floating overlay pills or gradient scrims.
 *
 * @param props - Component properties with thumbnail URL and campaign title.
 * @returns The rendered hero media card element.
 */
export function CampaignDetailHeroMedia({
  thumbnailUrl,
  title,
  className,
}: CampaignDetailHeroMediaProps) {
  const [imageError, setImageError] = useState(false);

  const fallbackTitle = title || 'Thumbnail Kampanye';
  const cleanThumbnailUrl = SanitizeHttpUrl(thumbnailUrl);

  return (
    <div
      className={cn(
        'relative aspect-[16/10] w-full max-w-sm sm:max-w-md lg:max-w-[380px] overflow-hidden rounded-xl border border-border/60 bg-card',
        className,
      )}
    >
      {cleanThumbnailUrl && !imageError ? (
        <img
          src={cleanThumbnailUrl}
          alt={fallbackTitle}
          onError={() => setImageError(true)}
          className="h-full w-full object-cover object-center"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted/40 text-muted-foreground">
          <GalleryOffIcon className="size-8 opacity-40" />
        </div>
      )}
    </div>
  );
}
