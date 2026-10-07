import { useState } from 'react';
import { ImageOff, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { CampaignCardProps } from '../types';
import {
  CalculateBudgetPercentage,
  FormatCpmDisplay,
  FormatJoinedCount,
  GetCampaignCategoryBadgeLabel,
  GetCampaignTypeBadgeLabel,
} from '../utils';

/**
 * Modern, high-performance campaign card component.
 * Displays campaign thumbnail, status badges, brand summary, title, CPM rate,
 * platform icon, category tag, joined creator count, and budget progress bar.
 * Designed with a refined dark aesthetic adhering to anti-AI-slop design principles.
 * Uses official shadcn/ui Card and CardContent primitives.
 *
 * @param props - Component properties containing the campaign item and optional interaction callbacks.
 * @returns The rendered campaign card element.
 */
export function CampaignCard({ campaign, onClick, className }: CampaignCardProps) {
  const [imageError, setImageError] = useState(false);

  const title = campaign.title?.trim() || 'Kampanye Tanpa Judul';
  const cpmDisplay = FormatCpmDisplay(campaign.cpm);
  const joinedCountDisplay = FormatJoinedCount(campaign._count?.submissions ?? 0);
  const budgetPercent = CalculateBudgetPercentage(campaign.budget);
  const categoryBadge = GetCampaignCategoryBadgeLabel(campaign.campaignCategory);
  const typeBadge = GetCampaignTypeBadgeLabel(campaign.campaignType);

  const brandName = campaign.brand?.companyName || 'Brand';
  const brandInitial = brandName.charAt(0).toUpperCase();

  const HandleCardClick = () => {
    onClick?.(campaign);
  };

  return (
    <Card
      onClick={HandleCardClick}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card p-0 py-0 gap-0 text-card-foreground shadow-xs transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 hover:z-10 will-change-transform',
        onClick && 'cursor-pointer',
        className
      )}>
      {/* Thumbnail Area with Aspect Ratio and Frosted Glass Badges */}
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden isolate rounded-t-2xl bg-muted/40 [contain:paint]">
        {campaign.thumbnailUrl && !imageError ? (
          <img
            src={campaign.thumbnailUrl}
            alt={title}
            onError={() => setImageError(true)}
            className="block h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 will-change-transform"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted/60 text-muted-foreground">
            <ImageOff className="size-8 opacity-40" />
          </div>
        )}

        {/* Ambient Dark Gradient for Legibility */}
        <div className="pointer-events-none absolute inset-x-0 -bottom-1 top-0 bg-gradient-to-t from-black/90 via-black/25 to-black/40" />

        {/* Bottom Overlay Row: Brand Identity & Campaign Type */}
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 z-10">
          {/* Brand Info */}
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="size-5 shrink-0 rounded-full bg-primary/25 border border-white/20 flex items-center justify-center text-[10px] font-bold text-white uppercase backdrop-blur-xs">
              {brandInitial}
            </div>
            <span className="text-xs font-medium text-white/95 truncate drop-shadow-xs">{brandName}</span>
          </div>

          {/* Type Badge (CLIPPING, UGC, etc.) */}
          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-white/90 bg-black/60 backdrop-blur-md border border-white/15 uppercase tracking-wider shadow-xs">
            {typeBadge}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <CardContent className="relative z-10 -mt-px flex flex-1 flex-col justify-between p-4 space-y-3.5 bg-card">
        <div className="space-y-2">
          {/* Title */}
          <h3 className="line-clamp-2 text-sm sm:text-base font-semibold text-foreground tracking-tight leading-snug">
            {title}
          </h3>

          {/* CPM Rate Display */}
          <div className="flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground">{cpmDisplay}</span>
            <span className="text-xs font-normal text-muted-foreground">/ 1K Views</span>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          {/* Metadata Row: Platform Icon + Category Tag + Joined Creators */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {/* Platform Icon */}
            <div className="flex items-center" title={campaign.platform || 'TikTok'}>
              <img src="/assets/icons/tiktok.svg" alt="TikTok" className="size-3.5 opacity-80 dark:invert" />
            </div>

            <span className="text-muted-foreground/40 text-[10px]">•</span>

            {/* Category Tag Pill */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground text-[10px] font-semibold uppercase tracking-wider border border-border/40">
              {categoryBadge}
            </span>

            {/* Joined Creators Pill */}
            <div
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground text-[10px] font-semibold border border-border/40 ml-auto"
              title={`${joinedCountDisplay} creator telah bergabung`}>
              <Users className="size-3 text-muted-foreground" />
              <span>{joinedCountDisplay}</span>
            </div>
          </div>

          {/* Budget Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Budget Tersisa</span>
              <span className="font-bold text-foreground">{budgetPercent}%</span>
            </div>

            <div className="h-1.5 w-full rounded-full bg-muted/70 overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${budgetPercent}%` }} />
            </div>
          </div>

          {/* Hover Action Button: "Lihat Detail" / "Bayar Sekarang" */}
          <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-300 ease-out group-hover:grid-rows-[1fr] group-hover:opacity-100 group-hover:pt-2">
            <div className="overflow-hidden">
              <Button
                type="button"
                size="default"
                className="w-full bg-primary text-primary-foreground font-semibold shadow-xs hover:bg-primary/90 rounded-xl h-9 text-xs sm:text-sm cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  HandleCardClick();
                }}>
                {campaign.campaignStatus === 'AWAITING_PAYMENT' ? 'Bayar Sekarang' : 'Lihat Detail'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
