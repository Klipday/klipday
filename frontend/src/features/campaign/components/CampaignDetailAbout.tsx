import { useState } from 'react';
import { AltArrowDownIcon, AltArrowUpIcon } from '@solar-icons/react/linear';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { CampaignDetailAboutProps } from '../types';

const COLLAPSE_THRESHOLD = 280;

/**
 * Section 1 of the Campaign Detail view: "Tentang Campaign".
 * Displays the comprehensive campaign overview and background with an accessible
 * "Lihat selengkapnya" / "Sembunyikan" toggle when the text exceeds standard threshold.
 *
 * @param props - Component properties containing campaign description text.
 * @returns The rendered about campaign section element.
 */
export function CampaignDetailAbout({ description, className }: CampaignDetailAboutProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const cleanDescription = description?.trim() || 'Deskripsi kampanye belum dicantumkan.';
  const isLong = cleanDescription.length > COLLAPSE_THRESHOLD;

  const ToggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <section className={cn('space-y-2.5', className)}>
      <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
        Tentang Campaign
      </h2>

      <div className="relative">
        <p
          className={cn(
            'text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line',
            !isExpanded && isLong && 'line-clamp-4'
          )}>
          {cleanDescription}
        </p>

        {isLong && (
          <div className="pt-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={ToggleExpanded}
              className="h-7 px-0 text-xs font-medium text-primary hover:text-primary/80 hover:bg-transparent inline-flex items-center gap-1 cursor-pointer">
              <span>{isExpanded ? 'Sembunyikan' : 'Lihat selengkapnya'}</span>
              {isExpanded ? <AltArrowUpIcon className="size-3.5" /> : <AltArrowDownIcon className="size-3.5" />}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
