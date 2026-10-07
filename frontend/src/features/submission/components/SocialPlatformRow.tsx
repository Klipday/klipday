import { Check, Lock, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SocialPlatformRowProps } from '../types';
import { FormatCompactCount } from '../utils/submission-utils';
import { RenderPlatformLogo } from './SocialPlatformIcons';

/**
 * Individual social media platform card row.
 * Handles three visual states:
 * 1. Unsupported platform: Disabled, muted, locked icon.
 * 2. Supported & connected account: Highlighted border, user avatar/handle, follower count, "Ganti Akun" action.
 * 3. Supported & unconnected account: Clean prompt with "+ Hubungkan Akun" button.
 *
 * @param props - Platform info, connectivity status, account details, and callback triggers.
 * @returns Rendered platform row element.
 */
export function SocialPlatformRow({
  platformId,
  platformName,
  isSupported,
  connectedAccount,
  onConnect,
  onSwitchAccount,
  className,
}: SocialPlatformRowProps) {
  // Case 1: Platform is not supported for this campaign
  if (!isSupported) {
    return (
      <div
        className={cn(
          'flex items-center justify-between p-4 rounded-xl border border-border/40 opacity-60 bg-muted/15 cursor-not-allowed select-none transition-opacity',
          className,
        )}>
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="size-10 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-center shrink-0 text-muted-foreground">
            {RenderPlatformLogo(platformId, 'size-5 opacity-50')}
          </div>
          <div className="min-w-0 space-y-0.5">
            <h4 className="text-sm font-semibold text-foreground/75 tracking-tight truncate">
              {platformName}
            </h4>
            <p className="text-xs text-muted-foreground">
              Tidak tersedia untuk campaign ini
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pl-3 shrink-0">
          <Lock className="size-4 text-muted-foreground" aria-label="Terkunci" />
        </div>
      </div>
    );
  }

  const hasConnectedAccount = Boolean(
    connectedAccount?.isVerified &&
      (connectedAccount.platform || 'TIKTOK').toUpperCase() === platformId.toUpperCase(),
  );

  // Case 2: Platform supported and creator has a verified connected account
  if (hasConnectedAccount && connectedAccount) {
    return (
      <div
        className={cn(
          'rounded-xl border border-foreground/25 bg-muted/20 hover:border-foreground/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs transition-all',
          className,
        )}>
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative size-11 shrink-0">
            <Avatar className="size-11 border border-border/80 bg-muted">
              {connectedAccount.avatarUrl ? (
                <AvatarImage
                  src={connectedAccount.avatarUrl}
                  alt={connectedAccount.username}
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="font-bold text-xs text-foreground bg-muted">
                {connectedAccount.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-background border border-border/80 flex items-center justify-center p-0.5 shadow-xs">
              {RenderPlatformLogo(platformId, 'size-2.5')}
            </div>
          </div>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground tracking-tight">
                {platformName}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                1 Akun terhubung
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              <span className="font-medium text-foreground/90">@{connectedAccount.username}</span>
              {' • '}
              <span>{FormatCompactCount(connectedAccount.followersCount)} Pengikut</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/30 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSwitchAccount}
            className="h-8 text-xs font-medium rounded-lg hover:bg-muted/80 cursor-pointer">
            Ganti Akun
          </Button>

          <div
            className="size-6 rounded-full bg-foreground text-background flex items-center justify-center shrink-0 shadow-xs"
            aria-label="Akun terpilih">
            <Check className="size-3.5 stroke-[2.5]" />
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Platform supported but creator has NOT connected an account yet
  return (
    <div
      className={cn(
        'rounded-xl border border-dashed border-border/80 hover:border-foreground/40 bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs transition-colors',
        className,
      )}>
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="size-10 rounded-xl bg-muted/60 border border-border/70 flex items-center justify-center shrink-0 text-foreground">
          {RenderPlatformLogo(platformId, 'size-5')}
        </div>
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-foreground tracking-tight">
              {platformName}
            </h4>
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-muted text-muted-foreground">
              Wajib untuk kampanye ini
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Hubungkan dan verifikasi bio akun {platformName} kamu
          </p>
        </div>
      </div>

      <div className="pt-2 sm:pt-0 border-t sm:border-t-0 border-border/30 shrink-0">
        <Button
          type="button"
          size="sm"
          onClick={onConnect}
          className="w-full sm:w-auto h-8 text-xs font-semibold rounded-lg gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
          <Plus className="size-3.5" />
          <span>Hubungkan Akun</span>
        </Button>
      </div>
    </div>
  );
}
