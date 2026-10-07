import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  UseConnectedSocialAccountQuery,
  UseRequestTikTokVerificationCodeMutation,
  UseVerifyTikTokBioMutation,
} from '../hooks';
import type { SocialAccountConnectDialogProps } from '../types';
import { ConnectGuideInfographic } from './ConnectGuideInfographic';
import { RenderPlatformLogo } from './SocialPlatformIcons';
import { SocialVerificationCodeCard } from './SocialVerificationCodeCard';

/**
 * Internal body and state controller for social account connection and bio verification.
 * Mounts freshly whenever the dialog is opened, guaranteeing clean initial state.
 *
 * @param props - Dialog open state, platform, verification callback, and styling.
 * @returns Rendered dialog modal content.
 */
function SocialAccountConnectDialogInner({
  onOpenChange,
  platform = 'TIKTOK',
  connectedAccount: propConnectedAccount,
  onAccountVerified,
  className,
}: SocialAccountConnectDialogProps) {
  const queryClient = useQueryClient();
  const { data: queriedAccount } = UseConnectedSocialAccountQuery();
  const effectiveAccount = queriedAccount ?? propConnectedAccount ?? null;

  const requestCodeMutation = UseRequestTikTokVerificationCodeMutation();
  const verifyBioMutation = UseVerifyTikTokBioMutation();

  const isTikTok = (platform || 'TIKTOK').toUpperCase() === 'TIKTOK';
  const platformDisplayName = isTikTok
    ? 'TikTok'
    : platform
      ? platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase()
      : 'TikTok';

  // Initialize username from connected account or empty
  const [username, setUsername] = useState<string>(() => {
    return effectiveAccount?.username ?? '';
  });

  // Initialize active verification code if an unexpired pending code exists in database
  const [activeCode, setActiveCode] = useState<string | null>(() => {
    if (effectiveAccount && !effectiveAccount.isVerified && effectiveAccount.verificationCode) {
      const expTime = effectiveAccount.verificationExpiresAt
        ? new Date(effectiveAccount.verificationExpiresAt).getTime()
        : 0;
      if (expTime > Date.now()) {
        return effectiveAccount.verificationCode;
      }
    }
    return null;
  });

  // Initialize expiry timestamp if active code exists
  const [targetExpiresAt, setTargetExpiresAt] = useState<number | null>(() => {
    if (effectiveAccount && !effectiveAccount.isVerified && effectiveAccount.verificationExpiresAt) {
      const expTime = new Date(effectiveAccount.verificationExpiresAt).getTime();
      if (expTime > Date.now()) {
        return expTime;
      }
    }
    return null;
  });

  const [cooldownTarget, setCooldownTarget] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [hasCopiedCode, setHasCopiedCode] = useState(false);

  const isTimerActive =
    (targetExpiresAt !== null && targetExpiresAt > now) ||
    (cooldownTarget !== null && cooldownTarget > now);

  useEffect(() => {
    if (!isTimerActive) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isTimerActive]);

  const expirySeconds = targetExpiresAt ? Math.max(0, Math.floor((targetExpiresAt - now) / 1000)) : 0;
  const cooldownSeconds = cooldownTarget ? Math.max(0, Math.floor((cooldownTarget - now) / 1000)) : 0;
  const isCodeExpired = Boolean(activeCode && targetExpiresAt && targetExpiresAt <= now);

  /**
   * Handles requesting a new bio verification token from backend API.
   * If the user enters the same username that is already connected and verified,
   * skips generating a new code, displays an informative toast, and closes the dialog.
   *
   * @param e - Form submission event.
   */
  const HandleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.replace(/^@/, '').trim();
    if (!cleanUsername) {
      toast.error(`Harap masukkan username ${platformDisplayName} kamu.`);
      return;
    }

    // Check if the entered username matches the currently connected verified account
    const isSameAsConnected =
      effectiveAccount !== null &&
      Boolean(effectiveAccount.isVerified || effectiveAccount.verifiedAt) &&
      effectiveAccount.username.toLowerCase() === cleanUsername.toLowerCase() &&
      (effectiveAccount.platform || 'TIKTOK').toUpperCase() === (platform || 'TIKTOK').toUpperCase();

    if (isSameAsConnected && effectiveAccount) {
      toast.info(`Akun @${effectiveAccount.username} sudah terhubung.`);
      onAccountVerified?.(effectiveAccount);
      onOpenChange(false);
      return;
    }

    try {
      const response = await requestCodeMutation.mutateAsync({ username: cleanUsername });

      if (response.alreadyVerified && response.account) {
        queryClient.setQueryData(['connected-social-account'], response.account);
        await queryClient.invalidateQueries({ queryKey: ['connected-social-account'] });
        await queryClient.invalidateQueries({ queryKey: ['recent-tiktok-videos'] });
        toast.success(`Akun @${response.account.username} berhasil diaktifkan kembali!`);
        onAccountVerified?.(response.account);
        onOpenChange(false);
        return;
      }

      if (response.code) {
        setActiveCode(response.code);
        const resolvedExpiresAt = response.expiresAt
          ? new Date(response.expiresAt).getTime()
          : Date.now() + 10 * 60 * 1000;
        setTargetExpiresAt(resolvedExpiresAt);
        setCooldownTarget(Date.now() + 60 * 1000);
        setNow(Date.now());
        toast.success(`Kode verifikasi berhasil dibuat: ${response.code}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal meminta kode verifikasi.';
      toast.error(errorMsg);
    }
  };

  /**
   * Copies the active verification code to user's system clipboard with feedback.
   */
  const HandleCopyCode = async () => {
    if (!activeCode) return;
    try {
      await navigator.clipboard.writeText(activeCode);
      setHasCopiedCode(true);
      toast.info('Kode verifikasi disalin ke clipboard.');
      setTimeout(() => setHasCopiedCode(false), 2000);
    } catch {
      toast.error('Gagal menyalin kode ke clipboard.');
    }
  };

  /**
   * Triggers scraper verification to confirm bio contains the active code token.
   */
  const HandleCheckVerification = async () => {
    const cleanUsername = username.replace(/^@/, '').trim();
    if (!cleanUsername) return;

    try {
      const verified = await verifyBioMutation.mutateAsync({ username: cleanUsername });
      queryClient.setQueryData(['connected-social-account'], verified);
      await queryClient.invalidateQueries({ queryKey: ['connected-social-account'] });
      toast.success(`Akun ${platformDisplayName} berhasil terhubung dan terverifikasi!`);
      onAccountVerified?.(verified);
      onOpenChange(false);
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : `Kode verifikasi belum terdeteksi di bio ${platformDisplayName}.`;
      toast.error(errorMsg);
    }
  };

  /**
   * Clears the current active code and unlocks the username input to change handles.
   */
  const HandleResetCode = () => {
    setActiveCode(null);
    setTargetExpiresAt(null);
    setCooldownTarget(null);
  };

  return (
    <DialogContent
      showCloseButton={false}
      className={cn(
        'w-[95vw] sm:max-w-3xl max-h-[90vh] sm:max-h-[85vh] p-0 overflow-hidden rounded-2xl bg-card border border-border/70 shadow-2xl flex flex-col z-[60]',
        className,
      )}>
      {/* Modal Header */}
      <DialogHeader className="px-5 sm:px-6 pt-5 pb-4 border-b border-border/40 flex flex-row items-center justify-between shrink-0">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <div className="size-5 shrink-0 flex items-center justify-center">
              {RenderPlatformLogo(platform, 'size-4')}
            </div>
            <DialogTitle className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
              Tambahkan Akun {platformDisplayName}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Verifikasi akun kamu untuk memastikan video yang diajukan benar-benar milikmu.
          </DialogDescription>
        </div>

        <DialogClose asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-full text-muted-foreground hover:text-foreground cursor-pointer shrink-0">
            <X className="size-4" />
            <span className="sr-only">Tutup</span>
          </Button>
        </DialogClose>
      </DialogHeader>

      {/* Modal 2-Column Split Content */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-y-auto divide-y md:divide-y-0 md:divide-x divide-border/40">
        {/* Left Column: 4-Step Visual Infographic Guide */}
        <div className="md:col-span-5">
          <ConnectGuideInfographic platformDisplayName={platformDisplayName} />
        </div>

        {/* Right Column: Verification Action Form */}
        <div className="md:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-5">
          {!isTikTok ? (
            /* Non-TikTok Unsupported Notice */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-3">
              <div className="size-12 rounded-xl bg-muted/50 border border-border/60 flex items-center justify-center text-muted-foreground">
                {RenderPlatformLogo(platform, 'size-6')}
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm font-semibold text-foreground tracking-tight">
                  Integrasi {platformDisplayName} Segera Hadir
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Saat ini Klipday mendukung verifikasi bio otomatis untuk kampanye TikTok. Integrasi akun {platformDisplayName} sedang dalam proses pengembangan.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 text-xs rounded-lg mt-2 cursor-pointer">
                Tutup
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Username Input Form */}
              <form onSubmit={HandleRequestCode} className="space-y-2">
                <Label htmlFor="connect-account-username" className="text-xs font-semibold text-foreground">
                  Username Akun {platformDisplayName}
                </Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium select-none">
                      @
                    </span>
                    <Input
                      id="connect-account-username"
                      type="text"
                      placeholder={`username_${(platform || 'tiktok').toLowerCase()}`}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={requestCodeMutation.isPending || Boolean(activeCode && !isCodeExpired)}
                      className="pl-7 h-10 rounded-xl text-xs"
                    />
                  </div>

                  {(!activeCode || isCodeExpired) && (
                    <Button
                      type="submit"
                      disabled={requestCodeMutation.isPending || !username.trim()}
                      className="h-10 rounded-xl px-4 text-xs font-medium shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
                      {requestCodeMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : isCodeExpired ? (
                        'Minta Ulang'
                      ) : (
                        'Dapatkan Kode'
                      )}
                    </Button>
                  )}

                  {activeCode && !isCodeExpired && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={HandleResetCode}
                      className="h-10 rounded-xl px-3 text-xs gap-1.5 text-muted-foreground shrink-0 cursor-pointer">
                      <RefreshCw className="size-3.5" />
                      <span>Ganti</span>
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Pastikan akun {platformDisplayName} kamu bersifat publik agar video dapat divalidasi sistem.
                </p>
              </form>

              {/* Active Verification Code Box */}
              {activeCode && (
                <SocialVerificationCodeCard
                  activeCode={activeCode}
                  platformDisplayName={platformDisplayName}
                  isCodeExpired={isCodeExpired}
                  expirySeconds={expirySeconds}
                  cooldownSeconds={cooldownSeconds}
                  isChecking={verifyBioMutation.isPending}
                  hasCopiedCode={hasCopiedCode}
                  onCopyCode={HandleCopyCode}
                  onCheckVerification={HandleCheckVerification}
                />
              )}
            </div>
          )}

          <p className="text-[11px] text-muted-foreground italic border-t border-border/30 pt-3">
            Setelah terverifikasi, akun kamu akan otomatis terhubung ke sistem Klipday.
          </p>
        </div>
      </div>
    </DialogContent>
  );
}

/**
 * Dedicated connect and verify modal dialog for creator social accounts.
 * Provides a structured 2-column layout with 4-step infographic guide and bio-code verification form.
 * Mounts freshly on open to guarantee clean state synchronization.
 *
 * @param props - Dialog open state, platform, verification callback, and styling.
 * @returns Rendered social account connect dialog modal or null when closed.
 */
export function SocialAccountConnectDialog(props: SocialAccountConnectDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      {props.open && <SocialAccountConnectDialogInner {...props} />}
    </Dialog>
  );
}
