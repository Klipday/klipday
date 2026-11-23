import { useEffect, useRef, useState } from 'react';
import {
  CheckIcon,
  CloseIcon,
  CopyIcon,
  EyeIcon,
} from '@solar-icons/react/linear';
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
 * Uses pure typographic hierarchy without pill badges, bullet separators, or colored data values.
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

  const statusLabel = isPending
    ? 'Perlu Verifikasi'
    : isVerified
      ? 'Terverifikasi'
      : 'Ditolak';

  const statusTextClassName = isPending
    ? 'text-amber-500'
    : isRejected
      ? 'text-destructive'
      : 'text-foreground';

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
      {/* Top Header: Provider & Context (left) vs Status & Timestamp (right) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-sm font-semibold text-foreground">{item.provider}</span>
          <span className="text-xs text-muted-foreground">{accountTypeLabel}</span>
          <span className="text-xs text-muted-foreground">{roleLabel}</span>
          {item.isPrimary && (
            <span className="text-xs text-muted-foreground">Utama</span>
          )}
        </div>

        <div className="flex items-center gap-x-4 text-xs">
          <span className={cn('font-medium', statusTextClassName)}>{statusLabel}</span>
          <span className="text-muted-foreground tabular-nums">{formattedCreatedAt}</span>
        </div>
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
            <AvatarFallback className="rounded-full bg-muted text-xs font-medium text-muted-foreground">
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

            <p className="text-xs text-muted-foreground tabular-nums">
              No. Telepon:{' '}
              <span className="text-foreground/90">
                {item.user.phoneNumber ?? 'Belum diisi'}
              </span>
            </p>
          </div>
        </div>

        {/* Right: Submitted Bank / E-Wallet Credentials */}
        <div className="sm:col-span-5 flex flex-col sm:items-end justify-center border-t border-border/40 pt-3 sm:border-t-0 sm:pt-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {item.accountNumber}
            </span>
            <button
              type="button"
              onClick={HandleCopyAccountNumber}
              title="Salin nomor rekening"
              className="inline-flex items-center gap-1 rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              {copied ? (
                <CheckIcon className="size-3 text-emerald-500" />
              ) : (
                <CopyIcon className="size-3" />
              )}
              <span>{copied ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            a.n. <strong className="font-medium text-foreground">{item.accountHolderName}</strong>
          </p>

          {isPending && isNameMismatch && (
            <p className="text-xs text-amber-500">Nama berbeda dengan profil</p>
          )}
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
          <EyeIcon className="size-3.5" />
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
                <CloseIcon className="mr-1 size-3.5" />
                <span>Tolak</span>
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => onReview(item, 'APPROVE')}
                className="h-8 text-xs cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <CheckIcon className="mr-1 size-3.5" />
                <span>Setujui KYC</span>
              </Button>
            </>
          )}

          {isVerified && formattedVerifiedAt && (
            <span className="text-xs text-muted-foreground tabular-nums">
              Diverifikasi pada {formattedVerifiedAt}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
