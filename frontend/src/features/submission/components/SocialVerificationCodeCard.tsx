import { Check, CheckCircle2, Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SocialVerificationCodeCardProps } from '../types';
import { FormatTimerSeconds } from '../utils/submission-utils';

/**
 * Reusable card presenting the active bio verification code, expiry countdown,
 * one-click copy button, and the scraper verification check button.
 *
 * @param props - Code card properties and action triggers.
 * @returns Rendered verification code card.
 */
export function SocialVerificationCodeCard({
  activeCode,
  platformDisplayName,
  isCodeExpired,
  expirySeconds,
  cooldownSeconds,
  isChecking,
  hasCopiedCode,
  onCopyCode,
  onCheckVerification,
  className,
}: SocialVerificationCodeCardProps) {
  return (
    <div className={cn('rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3.5', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">
          Kode Verifikasi Bio
        </span>
        <span
          className={cn(
            'text-[11px] font-mono',
            isCodeExpired
              ? 'text-destructive font-semibold'
              : expirySeconds <= 60
                ? 'text-amber-500 font-semibold'
                : 'text-muted-foreground',
          )}>
          {isCodeExpired ? 'Kedaluwarsa' : FormatTimerSeconds(expirySeconds)}
        </span>
      </div>

      {isCodeExpired ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2 text-center">
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            Kode verifikasi telah kedaluwarsa
          </p>
          <p className="text-[11px] text-muted-foreground">
            Silakan klik &quot;Minta Ulang&quot; di atas untuk mendapatkan kode verifikasi baru.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tempelkan kode di bawah ini ke bio profil akun {platformDisplayName} kamu, simpan profil, lalu klik tombol periksa verifikasi.
          </p>

          <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/60 bg-background">
            <span className="font-mono text-base sm:text-lg font-bold tracking-widest text-foreground select-all cursor-text">
              {activeCode}
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCopyCode}
              className="h-8 gap-1.5 text-xs rounded-lg cursor-pointer">
              {hasCopiedCode ? (
                <>
                  <Check className="size-3.5 text-emerald-500" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Salin</span>
                </>
              )}
            </Button>
          </div>

          <Button
            type="button"
            size="default"
            disabled={cooldownSeconds > 0 || isChecking}
            onClick={onCheckVerification}
            className="w-full h-10 rounded-xl text-xs font-semibold gap-2 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
            {isChecking ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Memeriksa Bio {platformDisplayName}...</span>
              </>
            ) : cooldownSeconds > 0 ? (
              <span>Tunggu sebentar ({cooldownSeconds}s)...</span>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                <span>Periksa Verifikasi Bio</span>
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}
