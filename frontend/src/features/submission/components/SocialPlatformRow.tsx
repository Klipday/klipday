import { AddIcon, CheckIcon, LockIcon } from '@solar-icons/react/linear';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SocialPlatformRowProps } from '../types';
import { FormatCompactCount } from '../utils/submission-utils';
import { RenderPlatformLogo } from './SocialPlatformIcons';

/**
 * Individual social media platform card row.
 * Handles four visual states:
 * 1. Unsupported platform: Disabled, muted, locked icon.
 * 2. Quota reached: Muted state showing submitted count out of max allowed.
 * 3. Supported & connected account: Selectable card with avatar/handle, quota indicator, "Ganti Akun" action.
 * 4. Supported & unconnected account: Clean prompt with "+ Hubungkan Akun" button.
 *
 * @param props - Platform info, connectivity status, selection state, quota, account details, and callbacks.
 * @returns Rendered platform row element.
 */
export function SocialPlatformRow({
  platformId,
  platformName,
  isSupported,
  isSelected,
  quota,
  connectedAccount,
  onSelect,
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
          <LockIcon className="size-4 text-muted-foreground" aria-label="Terkunci" />
        </div>
      </div>
    );
  }

  const isQuotaExhausted = Boolean(quota && !quota.canSubmit);
  const quotaLabel = quota
    ? quota.maxSubmissions === null
      ? `${quota.submittedCount} video terkirim`
      : `${quota.submittedCount}/${quota.maxSubmissions} video`
    : null;

  // Case 2: Platform supported, but creator already reached the campaign's per-platform video limit
  if (isQuotaExhausted) {
    return (
      <div
        className={cn(
          'flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20 opacity-75 cursor-not-allowed select-none',
          className,
        )}>
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="size-10 rounded-xl bg-muted/60 border border-border/60 flex items-center justify-center shrink-0 text-muted-foreground">
            {RenderPlatformLogo(platformId, 'size-5')}
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-x-3 flex-wrap">
              <h4 className="text-sm font-semibold text-foreground tracking-tight truncate">
                {platformName}
              </h4>
              <span className="text-xs font-medium text-muted-foreground">
                Batas Tercapai ({quotaLabel})
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Kamu sudah mencapai batas maksimal pengajuan video untuk platform ini.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pl-3 shrink-0">
          <CheckIcon className="size-4 text-emerald-500" aria-label="Batas tercapai" />
        </div>
      </div>
    );
  }

  const hasConnectedAccount = Boolean(
    connectedAccount?.isVerified &&
      (connectedAccount.platform || 'TIKTOK').toUpperCase() === platformId.toUpperCase(),
  );

  // Case 3: Platform supported and creator has a verified connected account
  if (hasConnectedAccount && connectedAccount) {
    const isSwitchOnCooldown =
      connectedAccount.canSwitchAccount === false &&
      Boolean(connectedAccount.nextSwitchAvailableAt);

    const cooldownDateLabel =
      isSwitchOnCooldown && connectedAccount.nextSwitchAvailableAt
        ? new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }).format(new Date(connectedAccount.nextSwitchAvailableAt))
        : null;

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect();
          }
        }}
        className={cn(
          'rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs transition-all cursor-pointer',
          isSelected
            ? 'border-foreground/50 bg-muted/35'
            : 'border-border/60 bg-card hover:border-foreground/30',
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
            <div className="flex items-center gap-x-3 flex-wrap">
              <span className="text-sm font-semibold text-foreground tracking-tight">
                {platformName}
              </span>
              <span className="text-xs font-medium text-foreground">
                Terhubung
              </span>
              {quotaLabel && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {quotaLabel}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground truncate">
              <span className="font-medium text-foreground/90">@{connectedAccount.username}</span>
              <span>{FormatCompactCount(connectedAccount.followersCount)} Pengikut</span>
            </div>
            {cooldownDateLabel && (
              <p className="text-[11px] text-muted-foreground/80">
                Ganti akun tersedia kembali pada {cooldownDateLabel}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/30 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSwitchOnCooldown}
            title={
              cooldownDateLabel
                ? `Anda dapat mengganti akun kembali pada ${cooldownDateLabel}`
                : undefined
            }
            onClick={(e) => {
              e.stopPropagation();
              onSwitchAccount();
            }}
            className="h-8 text-xs font-medium rounded-lg hover:bg-muted/80 cursor-pointer disabled:cursor-not-allowed">
            Ganti Akun
          </Button>

          <div
            className={cn(
              'size-6 rounded-full flex items-center justify-center shrink-0 transition-colors',
              isSelected
                ? 'bg-foreground text-background shadow-xs'
                : 'border border-border/80 bg-transparent text-transparent',
            )}
            aria-label={isSelected ? 'Akun terpilih' : 'Pilih akun'}>
            <CheckIcon className="size-3.5 stroke-[2.5]" />
          </div>
        </div>
      </div>
    );
  }

  // Case 4: Platform supported but creator has NOT connected an account yet
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
          <div className="flex items-center gap-x-2.5 flex-wrap">
            <h4 className="text-sm font-semibold text-foreground tracking-tight">
              {platformName}
            </h4>
            {quotaLabel && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {quotaLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Hubungkan dan verifikasi akun {platformName} kamu
          </p>
        </div>
      </div>

      <div className="pt-2 sm:pt-0 border-t sm:border-t-0 border-border/30 shrink-0">
        <Button
          type="button"
          size="sm"
          onClick={onConnect}
          className="w-full sm:w-auto h-8 text-xs font-semibold rounded-lg gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
          <AddIcon className="size-3.5" />
          <span>Hubungkan Akun</span>
        </Button>
      </div>
    </div>
  );
}
