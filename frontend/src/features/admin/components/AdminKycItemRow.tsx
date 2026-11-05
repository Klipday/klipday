import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AdminKycItemRowProps } from '../types';
import {
  FormatSubmissionTimestamp,
  GetKycAccountTypeLabel,
  GetKycRoleLabel,
  GetKycUserInitials,
  IsAccountHolderNameMismatch,
  IsSafeHttpUrl,
} from '../utils/formatters';

/**
 * Renders an individual payout account KYC submission row in the Admin KYC verification queue.
 * Displays provider, account type, role pill, primary badge, status pill, circular user avatar,
 * side-by-side profile identity vs bank/e-wallet credentials with 1-click copy, and review actions.
 *
 * @param props - Component props containing item, onOpenProof, onReview, and optional className.
 * @returns The rendered KYC queue row card.
 */
export function AdminKycItemRow({
  item,
  onOpenProof,
  onReview,
  className,
}: AdminKycItemRowProps) {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const isPending = item.verificationStatus === 'PENDING';
  const isVerified = item.verificationStatus === 'VERIFIED';
  const isRejected = item.verificationStatus === 'REJECTED';

  const accountTypeLabel = GetKycAccountTypeLabel(item.accountType);
  const roleLabel = GetKycRoleLabel(item.user.role);
  const isNameMismatch = IsAccountHolderNameMismatch(
    item.user.displayName,
    item.accountHolderName,
  );
  const formattedCreatedAt = FormatSubmissionTimestamp(item.createdAt);
  const formattedVerifiedAt = item.verifiedAt
    ? FormatSubmissionTimestamp(item.verifiedAt)
    : null;
  const userInitial = GetKycUserInitials(item.user.displayName);
  const safeAvatarUrl =
    item.user.avatarUrl && IsSafeHttpUrl(item.user.avatarUrl)
      ? item.user.avatarUrl.trim()
      : undefined;

  /**
   * Copies the submitted bank or e-wallet account number to the clipboard.
   *
   * @returns Promise resolving after copying and displaying toast feedback.
   */
  const HandleCopyAccountNumber = async (): Promise<void> => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(item.accountNumber);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = item.accountNumber;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      toast.success('Nomor rekening berhasil disalin!');
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = setTimeout(() => {
        setCopied(false);
        copyTimerRef.current = null;
      }, 2000);
    } catch {
      toast.error('Gagal menyalin nomor rekening.');
    }
  };

  return (
    <div
      className={cn(
        'group rounded-xl border border-border/60 bg-card p-4 sm:p-5 transition-colors hover:border-border space-y-4',
        className,
      )}
    >
      {/* Top Header: Provider + Type, Role Pill, Primary Badge, Status Pill, Submission Date */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{item.provider}</span>
          <span className="text-xs text-muted-foreground">&middot; {accountTypeLabel}</span>

          <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-foreground">
            {roleLabel}
          </span>

          {item.isPrimary && (
            <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              Akun Utama
            </span>
          )}

          {isPending && (
            <span className="inline-flex items-center rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:text-blue-400">
              Perlu Verifikasi
            </span>
          )}
          {isVerified && (
            <span className="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              Terverifikasi
            </span>
          )}
          {isRejected && (
            <span className="inline-flex items-center rounded-md border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
              Ditolak
            </span>
          )}
        </div>

        <span className="text-xs text-muted-foreground">{formattedCreatedAt}</span>
      </div>

      {/* Middle Grid: User Profile Identity (7 cols) vs Submitted Bank/E-Wallet Credentials (5 cols) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-center">
        {/* Left: Registered User Identity */}
        <div className="sm:col-span-7 flex items-start gap-3 min-w-0">
          <Avatar className="size-11 shrink-0 rounded-full border border-border/60 bg-muted overflow-hidden">
            <AvatarImage
              src={safeAvatarUrl}
              alt={item.user.displayName}
              className="rounded-full object-cover"
            />
            <AvatarFallback className="rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {userInitial}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <h4 className="text-sm font-medium text-foreground truncate">
                {item.user.displayName}
              </h4>
              <span className="text-xs text-muted-foreground truncate">
                {item.user.email}
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              No. Telepon Akun:{' '}
              <span className="font-mono tabular-nums text-foreground/90">
                {item.user.phoneNumber ?? 'Belum diisi'}
              </span>
            </p>
          </div>
        </div>

        {/* Right: Submitted Bank / E-Wallet Credentials */}
        <div className="sm:col-span-5 flex flex-col sm:items-end justify-center border-t border-border/40 pt-3 sm:border-t-0 sm:pt-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
              {item.accountNumber}
            </span>
            <button
              type="button"
              onClick={HandleCopyAccountNumber}
              title="Salin nomor rekening"
              className="inline-flex items-center gap-1 rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              {copied ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-3" />
              )}
              <span>{copied ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            a.n.{' '}
            <strong
              className={cn(
                'font-medium',
                isNameMismatch
                  ? 'text-amber-600 dark:text-amber-300'
                  : 'text-foreground/90',
              )}
            >
              {item.accountHolderName}
            </strong>
          </p>
        </div>
      </div>

      {/* Rejection Reason Banner if Rejected */}
      {isRejected && item.rejectionReason && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-xs text-destructive">
          <span className="font-medium">Alasan Penolakan: </span>
          <span>{item.rejectionReason}</span>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onOpenProof(item)}
          className="h-8 gap-1.5 text-xs cursor-pointer"
        >
          <Eye className="size-3.5" />
          <span>Lihat Foto Bukti Rekening</span>
        </Button>

        <div className="flex items-center gap-2 ml-auto">
          {isPending && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onReview(item, 'REJECT')}
                className="h-8 text-xs cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive border-border/60"
              >
                <X className="mr-1 size-3.5" />
                <span>Tolak</span>
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => onReview(item, 'APPROVE')}
                className="h-8 text-xs cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Check className="mr-1 size-3.5" />
                <span>Setujui KYC</span>
              </Button>
            </>
          )}

          {isVerified && formattedVerifiedAt && (
            <span className="text-xs text-muted-foreground">
              Diverifikasi pada {formattedVerifiedAt}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
