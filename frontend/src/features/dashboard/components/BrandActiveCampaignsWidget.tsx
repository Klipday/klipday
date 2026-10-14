import { Link } from 'react-router';
import { ArrowUpRight, Megaphone, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormatCompactCount } from '@/features/submission/utils/submission-utils';
import { FormatRupiah } from '@/features/wallet/utils/wallet-format';
import { cn } from '@/lib/utils';
import { DASHBOARD_MESSAGES } from '../constants';
import type { BrandActiveCampaignsWidgetProps } from '../types';
import { GetDashboardCategoryLabel } from '../utils/dashboard-format';

/**
 * Visual monitor widget for active running campaigns.
 * Displays real-time CPM, verified view performance, and spent budget progress.
 * Built with native Tailwind CSS primitives without external progress bar dependencies.
 *
 * @param props - Active campaigns list and optional styling className.
 * @returns Rendered active campaigns widget.
 */
export function BrandActiveCampaignsWidget({
  campaigns,
  className,
}: BrandActiveCampaignsWidgetProps) {
  const hasCampaigns = campaigns.length > 0;

  return (
    <div
      className={cn(
        'rounded-xl border border-border/60 bg-card p-5 flex flex-col',
        className,
      )}
    >
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {DASHBOARD_MESSAGES.ACTIVE_CAMPAIGNS_TITLE}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hasCampaigns
              ? `${campaigns.length} kampanye aktif berjalan`
              : 'Pantau penggunaan anggaran dan performa konten'}
          </p>
        </div>

        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground gap-1"
        >
          <Link to="/brand-dashboard/brand-campaigns">
            <span>Lihat Semua</span>
            <ArrowUpRight className="size-3.5" />
          </Link>
        </Button>
      </div>

      <div className="flex-1 mt-4">
        {!hasCampaigns ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="size-10 rounded-full border border-border/60 bg-muted/30 flex items-center justify-center text-muted-foreground mb-3">
              <Megaphone className="size-5" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {DASHBOARD_MESSAGES.ACTIVE_CAMPAIGNS_EMPTY}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mb-4">
              Luncurkan kampanye baru agar para kreator TikTok dapat mulai membuat klip promosi.
            </p>
            <Button
              asChild
              size="sm"
              className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link to="/brand-dashboard/brand-campaigns/create/step-1">
                <Plus className="size-3.5" />
                <span>Buat Kampanye</span>
              </Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/40 space-y-4">
            {campaigns.map((camp) => {
              const safeProgress = Math.min(
                100,
                Math.max(0, Math.round(camp.progressPercent || 0)),
              );
              const categoryLabel = GetDashboardCategoryLabel(camp.category);

              return (
                <div key={camp.id} className="pt-4 first:pt-0 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/brand-dashboard/brand-campaigns/${camp.id}`}
                        className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                      >
                        {camp.title || 'Kampanye Tanpa Judul'}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {categoryLabel}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          CPM {FormatRupiah(camp.cpm)}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          • {FormatCompactCount(camp.verifiedViews)} views
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-foreground">
                        {FormatRupiah(camp.spent)}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        dari {FormatRupiah(camp.budget)}
                      </p>
                    </div>
                  </div>

                  {/* Native Tailwind Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>
                        {DASHBOARD_MESSAGES.BUDGET_SPENT_LABEL} ({safeProgress}%)
                      </span>
                      <div className="flex items-center gap-2">
                        {camp.pendingSubmissionsCount > 0 && (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            {camp.pendingSubmissionsCount} perlu ditinjau
                          </span>
                        )}
                        <span>{camp.totalSubmissionsCount} submisi klip</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${safeProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
