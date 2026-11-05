import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FieldLengthTracker } from '@/features/campaign/components/FieldLengthTracker';
import { cn } from '@/lib/utils';
import type {
  AdminKycReviewDialogContentProps,
  AdminKycReviewDialogProps,
} from '../types';
import {
  GetKycAccountTypeLabel,
  GetKycRoleLabel,
  IsAccountHolderNameMismatch,
} from '../utils/formatters';

/**
 * Inner content component mounted fresh whenever the KYC review dialog opens.
 * Initializes local state cleanly without effect-based state synchronization.
 *
 * @param props - Component props containing item, decision, isPending, onConfirm, and onClose.
 * @returns The rendered review confirmation form content.
 */
function AdminKycReviewDialogContent({
  item,
  decision,
  isPending,
  onConfirm,
  onClose,
}: AdminKycReviewDialogContentProps) {
  const [rejectionReason, setRejectionReason] = useState('');

  const isApprove = decision === 'APPROVE';
  const trimmedReason = rejectionReason.trim();
  const isRejectValid = !isApprove
    ? trimmedReason.length >= 5 && trimmedReason.length <= 500
    : true;

  const accountTypeLabel = GetKycAccountTypeLabel(item.accountType);
  const roleLabel = GetKycRoleLabel(item.user.role);
  const isNameMismatch = IsAccountHolderNameMismatch(
    item.user.displayName,
    item.accountHolderName,
  );

  /**
   * Validates and submits the Admin KYC review decision.
   *
   * @returns void
   */
  const HandleSubmit = (): void => {
    if (!isRejectValid || isPending) {
      return;
    }

    onConfirm(isApprove ? undefined : trimmedReason);
  };

  return (
    <DialogContent
      showCloseButton={!isPending}
      onEscapeKeyDown={(event) => {
        if (isPending) {
          event.preventDefault();
        }
      }}
      onInteractOutside={(event) => {
        if (isPending) {
          event.preventDefault();
        }
      }}
      className="max-w-md p-6 space-y-4"
    >
      <DialogHeader className="space-y-1">
        <DialogTitle className="text-base font-semibold tracking-tight">
          {isApprove
            ? 'Setujui Verifikasi Rekening KYC?'
            : 'Tolak Pengajuan Rekening KYC?'}
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          {isApprove
            ? 'Setelah disetujui, pengguna dapat langsung menggunakan rekening ini untuk mencairkan saldo dompet.'
            : 'Pengguna akan melihat alasan penolakan pada halaman profilnya dan dapat mengajukan ulang rekening yang sesuai.'}
        </DialogDescription>
      </DialogHeader>

      {/* Account & Profile Summary Card */}
      <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2 text-xs">
        <div className="flex items-center justify-between gap-2 text-muted-foreground">
          <span>Nama Profil Akun</span>
          <span className="font-medium text-foreground truncate max-w-[220px]">
            {item.user.displayName}{' '}
            <span className="text-[11px] text-muted-foreground">({roleLabel})</span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-muted-foreground">
          <span>Bank / E-Wallet</span>
          <span className="font-medium text-foreground truncate max-w-[220px]">
            {item.provider} ({accountTypeLabel})
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-muted-foreground">
          <span>Nomor Rekening</span>
          <span className="font-mono font-semibold tabular-nums text-foreground">
            {item.accountNumber}
          </span>
        </div>
        <div className="border-t border-border/50 pt-2 flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Nama Pemilik Rekening</span>
          <span
            className={cn(
              'font-semibold truncate max-w-[220px]',
              isNameMismatch
                ? 'text-amber-600 dark:text-amber-300'
                : 'text-foreground',
            )}
          >
            {item.accountHolderName}
          </span>
        </div>
      </div>

      {/* Required Rejection Reason Field */}
      {!isApprove && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <label
              htmlFor="kyc-rejection-reason"
              className="text-xs font-medium text-foreground"
            >
              Alasan Penolakan KYC <span className="text-destructive">*</span>
            </label>
            <FieldLengthTracker current={rejectionReason.length} max={500} />
          </div>
          <Textarea
            id="kyc-rejection-reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            disabled={isPending}
            placeholder="Contoh: Nama pemilik pada foto buku tabungan berbeda dengan nama lengkap profil akun Anda..."
            rows={3}
            maxLength={500}
            className="text-xs resize-none"
          />
          <p className="text-[11px] text-muted-foreground">Minimal 5 karakter.</p>
        </div>
      )}

      <DialogFooter className="pt-2 sm:justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={isPending}
          className="text-xs cursor-pointer"
        >
          Batal
        </Button>

        {isApprove ? (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={HandleSubmit}
            disabled={isPending}
            className="text-xs cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isPending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
            Ya, Setujui Rekening KYC
          </Button>
        ) : (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={HandleSubmit}
            disabled={!isRejectValid || isPending}
            className="text-xs cursor-pointer"
          >
            {isPending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
            Tolak Pengajuan KYC
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}

/**
 * Confirmation modal dialog for approving (`VERIFIED`) or rejecting (`REJECTED`)
 * a Creator or Brand payout account KYC submission.
 *
 * @param props - Dialog props containing open state, target item, review decision, and handlers.
 * @returns The rendered KYC review confirmation dialog.
 */
export function AdminKycReviewDialog({
  open,
  onOpenChange,
  item,
  decision,
  isPending,
  sessionKey,
  onConfirm,
}: AdminKycReviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {item && decision && (
        <AdminKycReviewDialogContent
          key={`${item.id}-${decision}-${sessionKey ?? 0}`}
          item={item}
          decision={decision}
          isPending={isPending}
          onConfirm={onConfirm}
          onClose={() => onOpenChange(false)}
        />
      )}
    </Dialog>
  );
}
