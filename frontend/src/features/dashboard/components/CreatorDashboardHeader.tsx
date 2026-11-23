import { Link } from 'react-router';
import { ArrowRightUpIcon } from '@solar-icons/react/linear';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CREATOR_DASHBOARD_MESSAGES } from '../constants';
import type { CreatorDashboardHeaderProps } from '../types';

/**
 * Top header banner for the Creator Monitoring Dashboard.
 * Matches BrandDashboardHeader typography and spacing on the left, paired with
 * a subtle connected TikTok indicator or connection action on the right.
 *
 * @param props - Header properties including creator name and verified TikTok account summary.
 * @returns Rendered header element.
 */
export function CreatorDashboardHeader({
  creatorName,
  tiktokAccount,
  className,
}: CreatorDashboardHeaderProps) {
  const displayTitle = creatorName
    ? `Halo, ${creatorName}`
    : CREATOR_DASHBOARD_MESSAGES.TITLE;

  const isTikTokVerified = Boolean(tiktokAccount?.isVerified && tiktokAccount?.username);

  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="space-y-1.5 min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground truncate">
          {displayTitle}
        </h1>
        <p className="text-sm text-muted-foreground">
          {CREATOR_DASHBOARD_MESSAGES.SUBTITLE}
        </p>
      </div>

      <div className="shrink-0 self-start sm:self-center">
        {isTikTokVerified && tiktokAccount ? (
          <Link
            to="/creator-dashboard/profile?tab=social-accounts"
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-foreground font-medium truncate max-w-[140px]">
              @{tiktokAccount.username}
            </span>
            <span className="shrink-0">{CREATOR_DASHBOARD_MESSAGES.TIKTOK_VERIFIED_SUFFIX}</span>
          </Link>
        ) : (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-medium border-border/70 text-foreground hover:bg-muted/50"
          >
            <Link to="/creator-dashboard/profile?tab=social-accounts">
              <span>{CREATOR_DASHBOARD_MESSAGES.CONNECT_TIKTOK_ACTION}</span>
              <ArrowRightUpIcon className="size-3.5" aria-hidden="true" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
