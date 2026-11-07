import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import type { CampaignDetailRewardSidebarProps } from '../types';
import {
  CalculateBudgetPercentage,
  CalculateDaysRemaining,
  CalculateMaxEarningsPerClip,
  FormatCpmDisplay,
  FormatDateRangeDisplay,
  FormatNumber,
  FormatRupiah,
} from '../utils';

/**
 * Right-hand sticky sidebar card for the campaign detail view.
 * Displays real-time budget burn progress, reward breakdown grid (CPM, min views, max views,
 * earnings cap), and campaign active timeline.
 *
 * @param props - Component properties containing the full campaign entity.
 * @returns The rendered reward summary sidebar element.
 */
export function CampaignDetailRewardSidebar({ campaign, className }: CampaignDetailRewardSidebarProps) {
  const budgetPercent = CalculateBudgetPercentage(campaign.budget, campaign.allocatedBudget);
  const totalBudgetDisplay = FormatRupiah(Number(campaign.budget) || 0);
  const cpmDisplay = FormatCpmDisplay(campaign.cpm);
  const minViewsDisplay = FormatNumber(campaign.minViews);
  const maxViewsDisplay = FormatNumber(campaign.maxViews);
  const maxEarningsPerClip = CalculateMaxEarningsPerClip(campaign.cpm, campaign.maxViews);
  const maxEarningsDisplay = FormatRupiah(maxEarningsPerClip);

  const daysRemaining = CalculateDaysRemaining(campaign.endDate);
  const dateRangeDisplay = FormatDateRangeDisplay(campaign.startDate, campaign.endDate);

  return (
    <aside className={cn('space-y-4 lg:sticky lg:top-6', className)}>
      <Card className="border-border/60 bg-card shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-5 sm:p-6 space-y-5">
          {/* Budget Progress Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-semibold text-foreground">Budget Tersisa</span>
              <span className="font-bold text-foreground">{budgetPercent}%</span>
            </div>

            {/* Progress track */}
            <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                style={{ width: `${budgetPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
              <span>Anggaran Terpakai</span>
              <span className="font-medium text-foreground">
                {FormatRupiah(Number(campaign.allocatedBudget) || 0)} dari {totalBudgetDisplay}
              </span>
            </div>
          </div>

          {/* 2x2 Reward Breakdown Grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {/* Top Left: Mulai Dibayar (Ambang Min Views) */}
            <div className="rounded-xl border border-border/40 bg-muted/20 p-3 space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium block">Mulai Dibayar</span>
              <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                {minViewsDisplay} Views
              </p>
            </div>

            {/* Top Right: Batas Maks. Views */}
            <div className="rounded-xl border border-border/40 bg-muted/20 p-3 space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium block">Batas Maksimum</span>
              <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                {maxViewsDisplay} Views
              </p>
            </div>

            {/* Bottom Left: CPM Rate */}
            <div className="rounded-xl border border-border/40 bg-muted/20 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground font-medium block">
                  Tarif CPM
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">/ 1K Views</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                {cpmDisplay}
              </p>
            </div>

            {/* Bottom Right: Maks. per Klip */}
            <div className="rounded-xl border border-border/40 bg-muted/20 p-3 space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium block">
                Maks. per Klip
              </span>
              <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                {maxEarningsDisplay}
              </p>
            </div>
          </div>

          {/* Max reward callout - neutral styling without red background */}
          <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 flex items-center justify-between gap-2">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Maksimal per Klip
              </span>
              <p className="text-xs text-muted-foreground">Potensi reward tertinggi per video</p>
            </div>
            <span className="text-sm sm:text-base font-bold text-foreground shrink-0">
              {maxEarningsDisplay}
            </span>
          </div>

          {/* Campaign Schedule & Timeline */}
          <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                <Calendar className="size-3.5 text-muted-foreground" />
                <span>Periode Kampanye</span>
              </div>
              <span className="font-semibold text-foreground">{daysRemaining.label}</span>
            </div>
            <p className="text-xs text-muted-foreground">{dateRangeDisplay}</p>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
