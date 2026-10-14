import { Link } from 'react-router';
import { ArrowRight, CheckCircle2, Megaphone, Plus, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DASHBOARD_MESSAGES } from '../constants';
import type { BrandDashboardLaunchpadProps } from '../types';

/**
 * 3-step interactive onboarding launchpad rendered when a brand has zero campaigns.
 * Guides brand managers through depositing funds, creating a campaign brief,
 * and reviewing clipper submissions.
 *
 * @param props - Onboarding callbacks and styling className.
 * @returns Rendered launchpad component.
 */
export function BrandDashboardLaunchpad({
  onTopUpClick,
  className,
}: BrandDashboardLaunchpadProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/60 bg-card p-6 sm:p-8 space-y-8',
        className,
      )}
    >
      <div className="max-w-2xl space-y-2">
        <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          Panduan Memulai
        </span>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          {DASHBOARD_MESSAGES.LAUNCHPAD_TITLE}
        </h2>
        <p className="text-sm text-muted-foreground">
          {DASHBOARD_MESSAGES.LAUNCHPAD_SUBTITLE}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Step 1 */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground font-mono">
                LANGKAH 01
              </span>
              <Wallet className="size-4 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {DASHBOARD_MESSAGES.LAUNCHPAD_STEP_1_TITLE}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {DASHBOARD_MESSAGES.LAUNCHPAD_STEP_1_DESC}
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={onTopUpClick}
            className="w-full h-9 gap-1.5 text-xs font-medium border-border/80 text-foreground hover:bg-muted/50"
          >
            <Plus className="size-3.5" />
            <span>Isi Saldo Sekarang</span>
          </Button>
        </div>

        {/* Step 2 */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary font-mono">
                LANGKAH 02
              </span>
              <Megaphone className="size-4 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {DASHBOARD_MESSAGES.LAUNCHPAD_STEP_2_TITLE}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {DASHBOARD_MESSAGES.LAUNCHPAD_STEP_2_DESC}
            </p>
          </div>

          <Button
            asChild
            size="sm"
            className="w-full h-9 gap-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link to="/brand-dashboard/brand-campaigns/create/step-1">
              <span>Buat Kampanye</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        {/* Step 3 */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground font-mono">
                LANGKAH 03
              </span>
              <CheckCircle2 className="size-4 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {DASHBOARD_MESSAGES.LAUNCHPAD_STEP_3_TITLE}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {DASHBOARD_MESSAGES.LAUNCHPAD_STEP_3_DESC}
            </p>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/40 p-2.5 text-center">
            <span className="text-xs text-muted-foreground font-medium">
              Otomatis & Real-Time
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
