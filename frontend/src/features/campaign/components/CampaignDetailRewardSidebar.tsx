import { CalendarIcon } from '@solar-icons/react/linear';
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
export function CampaignDetailRewardSidebar({
  campaign,
  userRole,
  className,
}: CampaignDetailRewardSidebarProps) {
  const budgetPercent =
    typeof campaign.remainingBudgetPercent === 'number'
      ? Math.max(0, Math.min(100, Math.round(campaign.remainingBudgetPercent)))
      : CalculateBudgetPercentage(campaign.budget, campaign.allocatedBudget);
  const canViewBudgetAmounts = userRole !== 'CREATOR' && campaign.budget != null;
  const totalBudgetDisplay = canViewBudgetAmounts ? FormatRupiah(Number(campaign.budget) || 0) : '';
  const allocatedBudgetDisplay = canViewBudgetAmounts
    ? FormatRupiah(Number(campaign.allocatedBudget) || 0)
    : '';
  const cpmDisplay = FormatCpmDisplay(campaign.cpm);
  const minViewsDisplay = FormatNumber(campaign.minViews);
  const maxViewsDisplay = FormatNumber(campaign.maxViews);
  const maxEarningsPerClip = CalculateMaxEarningsPerClip(campaign.cpm, campaign.maxViews);
  const maxEarningsDisplay = FormatRupiah(maxEarningsPerClip);

  const daysRemaining = CalculateDaysRemaining(campaign.endDate);
  const dateRangeDisplay = FormatDateRangeDisplay(campaign.startDate, campaign.endDate);

  return (
    <aside className={cn('space-y-4 lg:sticky lg:top-6', className)}>
      <Card className="border-border/60 bg-card shadow-sm rounded-2xl overflow-hidden p-0 py-0">
        <CardContent className="p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* Budget Progress Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-foreground">Budget Tersisa</span>
              <span className="font-bold text-foreground tabular-nums">{budgetPercent}%</span>
            </div>

            {/* Progress track */}
            <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                style={{ width: `${budgetPercent}%` }}
              />
            </div>

            {canViewBudgetAmounts && (
              <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between text-xs text-muted-foreground pt-0.5">
                <span className="shrink-0">Anggaran Terpakai</span>
                <span className="font-medium text-foreground tabular-nums">
                  {allocatedBudgetDisplay} / {totalBudgetDisplay}
                </span>
              </div>
            )}
          </div>

          {/* 2x2 Reward Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* Top Left: Mulai Dibayar (Ambang Min Views) */}
            <div className="space-y-2 min-w-0">
              <span className="text-xs text-muted-foreground font-medium block">Mulai Dibayar</span>
              <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
                <p className="text-sm sm:text-base font-semibold text-foreground truncate tabular-nums">
                  {minViewsDisplay} Views
                </p>
              </div>
            </div>

            {/* Top Right: Batas Maks. Views */}
            <div className="space-y-2 min-w-0">
              <span className="text-xs text-muted-foreground font-medium block">Batas Maksimum</span>
              <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
                <p className="text-sm sm:text-base font-semibold text-foreground truncate tabular-nums">
                  {maxViewsDisplay} Views
                </p>
              </div>
            </div>

            {/* Bottom Left: CPM Rate */}
            <div className="space-y-2 min-w-0">
              <span className="text-xs text-muted-foreground font-medium block">Tarif CPM (/1K Views)</span>
              <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
                <p className="text-sm sm:text-base font-semibold text-foreground truncate tabular-nums">
                  {cpmDisplay}
                </p>
              </div>
            </div>

            {/* Bottom Right: Maks. per Klip */}
            <div className="space-y-2 min-w-0">
              <span className="text-xs text-muted-foreground font-medium block">Maks. per Klip</span>
              <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
                <p className="text-sm sm:text-base font-semibold text-foreground truncate tabular-nums">
                  {maxEarningsDisplay}
                </p>
              </div>
            </div>
          </div>

          {/* Campaign Schedule & Timeline */}
          <div className="border-t border-border/40 pt-5 space-y-2.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground font-medium">Batas Video per Platform</span>
              <span className="font-semibold text-foreground">
                {campaign.maxSubmissionsPerPlatform === null
                  ? 'Tanpa Batas'
                  : `${campaign.maxSubmissionsPerPlatform ?? 1} video`}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                <CalendarIcon className="size-3.5 text-muted-foreground shrink-0" />
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
