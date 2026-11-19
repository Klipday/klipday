import { AddIcon, ArrowRightIcon } from '@solar-icons/react/linear';
import { Button } from '@/components/ui/button';
import { CreateCampaignDialog } from '@/features/campaign/components';
import { cn } from '@/lib/utils';
import { DASHBOARD_MESSAGES } from '../constants';
import type { BrandDashboardLaunchpadProps } from '../types';

/**
 * 3-step onboarding launchpad rendered when a brand has zero campaigns.
 * Uses a calm, hairline-divided layout to guide brand managers through
 * depositing funds, creating a campaign brief, and reviewing submissions.
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
        'rounded-xl border border-border/60 bg-card overflow-hidden',
        className,
      )}
    >
      <div className="px-6 py-5 border-b border-border/50 space-y-1.5">
        <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
          {DASHBOARD_MESSAGES.LAUNCHPAD_TITLE}
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          {DASHBOARD_MESSAGES.LAUNCHPAD_SUBTITLE}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/50">
        {/* Step 01 */}
        <div className="bg-card p-6 flex flex-col justify-between gap-5">
          <div className="space-y-2">
            <span className="text-xs font-mono text-muted-foreground tabular-nums">
              01
            </span>
            <h3 className="text-sm font-medium text-foreground">
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
            className="w-full h-9 gap-1.5 text-xs font-medium border-border/70 text-foreground hover:bg-muted/50"
          >
            <AddIcon className="size-3.5" aria-hidden="true" />
            <span>Isi Saldo Sekarang</span>
          </Button>
        </div>

        {/* Step 02 */}
        <div className="bg-card p-6 flex flex-col justify-between gap-5">
          <div className="space-y-2">
            <span className="text-xs font-mono text-muted-foreground tabular-nums">
              02
            </span>
            <h3 className="text-sm font-medium text-foreground">
              {DASHBOARD_MESSAGES.LAUNCHPAD_STEP_2_TITLE}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {DASHBOARD_MESSAGES.LAUNCHPAD_STEP_2_DESC}
            </p>
          </div>

          <CreateCampaignDialog>
            <Button
              size="sm"
              className="w-full h-9 gap-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <span>{DASHBOARD_MESSAGES.ACTION_CREATE_CAMPAIGN}</span>
              <ArrowRightIcon className="size-3.5" aria-hidden="true" />
            </Button>
          </CreateCampaignDialog>
        </div>

        {/* Step 03 */}
        <div className="bg-card p-6 flex flex-col justify-between gap-5">
          <div className="space-y-2">
            <span className="text-xs font-mono text-muted-foreground tabular-nums">
              03
            </span>
            <h3 className="text-sm font-medium text-foreground">
              {DASHBOARD_MESSAGES.LAUNCHPAD_STEP_3_TITLE}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {DASHBOARD_MESSAGES.LAUNCHPAD_STEP_3_DESC}
            </p>
          </div>

          <p className="text-xs text-muted-foreground pt-1">
            Pemantauan otomatis
          </p>
        </div>
      </div>
    </div>
  );
}
