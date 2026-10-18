import { Link } from 'react-router';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CREATOR_DASHBOARD_MESSAGES } from '../constants';
import type { CreatorDashboardLaunchpadProps } from '../types';

/**
 * 3-step onboarding launchpad rendered when a creator has zero campaign submissions.
 * Guides creators through connecting their TikTok account, picking an active campaign,
 * and withdrawing verified view earnings.
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
        'rounded-2xl border border-border/60 bg-card p-6 sm:p-8 space-y-8',
        className,
      )}
    >
      <div className="max-w-2xl space-y-2">
        <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {CREATOR_DASHBOARD_MESSAGES.LAUNCHPAD_BADGE}
        </span>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          {CREATOR_DASHBOARD_MESSAGES.LAUNCHPAD_TITLE}
        </h2>
        <p className="text-sm text-muted-foreground">
          {CREATOR_DASHBOARD_MESSAGES.LAUNCHPAD_SUBTITLE}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Step 1: Connect TikTok */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <span className="inline-block text-xs font-semibold text-muted-foreground font-mono">
              LANGKAH 01
            </span>
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              {CREATOR_DASHBOARD_MESSAGES.LAUNCHPAD_STEP_1_TITLE}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {CREATOR_DASHBOARD_MESSAGES.LAUNCHPAD_STEP_1_DESC}
            </p>
          </div>

          {isTikTokConnected ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 flex items-center justify-center gap-1.5 text-center">
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {CREATOR_DASHBOARD_MESSAGES.LAUNCHPAD_STEP_1_CONNECTED}
              </span>
            </div>
          ) : (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="w-full h-9 gap-1.5 text-xs font-medium border-border/80 text-foreground hover:bg-muted/50"
            >
              <Link to="/creator-dashboard/profile?tab=social-accounts">
                <span>{CREATOR_DASHBOARD_MESSAGES.LAUNCHPAD_STEP_1_CTA}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          )}
        </div>

        {/* Step 2: Explore & Submit Campaign */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <span className="inline-block text-xs font-semibold text-muted-foreground font-mono">
              LANGKAH 02
            </span>
            <h3 className="text-base font-semibold tracking-tight text-foreground">
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
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        {/* Step 3: Monitor Views & Withdraw */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <span className="inline-block text-xs font-semibold text-muted-foreground font-mono">
              LANGKAH 03
            </span>
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              {CREATOR_DASHBOARD_MESSAGES.LAUNCHPAD_STEP_3_TITLE}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {CREATOR_DASHBOARD_MESSAGES.LAUNCHPAD_STEP_3_DESC}
            </p>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/40 p-2.5 text-center">
            <span className="text-xs text-muted-foreground font-medium">
              {CREATOR_DASHBOARD_MESSAGES.LAUNCHPAD_STEP_3_BADGE}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
