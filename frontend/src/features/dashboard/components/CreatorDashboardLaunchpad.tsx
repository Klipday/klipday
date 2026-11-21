import { Link } from 'react-router';
import { ArrowRightIcon, CheckCircleIcon } from '@solar-icons/react/linear';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CREATOR_DASHBOARD_MESSAGES } from '../constants';
import type { CreatorDashboardLaunchpadProps } from '../types';

/**
 * 3-step onboarding launchpad rendered when a creator has zero campaign submissions.
 * Synchronized 1:1 with BrandDashboardLaunchpad using a calm, hairline-divided layout
 * guiding creators through connecting TikTok, joining a campaign, and withdrawing rewards.
 *
 * @param props - Launchpad properties including TikTok connection status.
 * @returns Rendered launchpad component.
 */
export function CreatorDashboardLaunchpad({
  isTikTokConnected,
  className,
}: CreatorDashboardLaunchpadProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/60 bg-card overflow-hidden',
        className,
      )}
    >
      <div className="px-6 py-5 border-b border-border/50 space-y-1.5">
        <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
          {CREATOR_DASHBOARD_MESSAGES.LAUNCHPAD_TITLE}
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          {CREATOR_DASHBOARD_MESSAGES.LAUNCHPAD_SUBTITLE}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/50">
        {/* Step 01: Connect TikTok */}
        <div className="bg-card p-6 flex flex-col justify-between gap-5">
          <div className="space-y-2">
            <span className="text-xs font-mono text-muted-foreground tabular-nums">
              01
            </span>
            <h3 className="text-sm font-medium text-foreground">
              {CREATOR_DASHBOARD_MESSAGES.LAUNCHPAD_STEP_1_TITLE}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {CREATOR_DASHBOARD_MESSAGES.LAUNCHPAD_STEP_1_DESC}
            </p>
          </div>

          {isTikTokConnected ? (
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 pt-1">
              <CheckCircleIcon className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{CREATOR_DASHBOARD_MESSAGES.LAUNCHPAD_STEP_1_CONNECTED}</span>
            </div>
          ) : (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="w-full h-9 gap-1.5 text-xs font-medium border-border/70 text-foreground hover:bg-muted/50"
            >
              <Link to="/creator-dashboard/profile?tab=social-accounts">
                <span>{CREATOR_DASHBOARD_MESSAGES.LAUNCHPAD_STEP_1_CTA}</span>
                <ArrowRightIcon className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          )}
        </div>

        {/* Step 02: Explore & Submit Campaign */}
        <div className="bg-card p-6 flex flex-col justify-between gap-5">
          <div className="space-y-2">
            <span className="text-xs font-mono text-muted-foreground tabular-nums">
              02
            </span>
            <h3 className="text-sm font-medium text-foreground">
              {CREATOR_DASHBOARD_MESSAGES.LAUNCHPAD_STEP_2_TITLE}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {CREATOR_DASHBOARD_MESSAGES.LAUNCHPAD_STEP_2_DESC}
            </p>
          </div>

          <Button
            asChild
            size="sm"
            className="w-full h-9 gap-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link to="/creator-dashboard/creator-campaigns">
              <span>{CREATOR_DASHBOARD_MESSAGES.LAUNCHPAD_STEP_2_CTA}</span>
              <ArrowRightIcon className="size-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        {/* Step 03: Monitor Views & Withdraw */}
        <div className="bg-card p-6 flex flex-col justify-between gap-5">
          <div className="space-y-2">
            <span className="text-xs font-mono text-muted-foreground tabular-nums">
              03
            </span>
            <h3 className="text-sm font-medium text-foreground">
              {CREATOR_DASHBOARD_MESSAGES.LAUNCHPAD_STEP_3_TITLE}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {CREATOR_DASHBOARD_MESSAGES.LAUNCHPAD_STEP_3_DESC}
            </p>
          </div>

          <p className="text-xs text-muted-foreground pt-1">
            {CREATOR_DASHBOARD_MESSAGES.LAUNCHPAD_STEP_3_BADGE}
          </p>
        </div>
      </div>
    </div>
  );
}
