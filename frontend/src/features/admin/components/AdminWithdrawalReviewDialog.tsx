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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FieldLengthTracker } from '@/features/campaign/components/FieldLengthTracker';
import type {
  AdminWithdrawalReviewDialogContentProps,
  AdminWithdrawalReviewDialogProps,
} from '../types';
import { FormatRupiah } from '../utils/formatters';

/**
 * Inner content component mounted fresh whenever the review dialog opens.
 * Initializes form state purely from withdrawal properties with zero effect-based state synchronization.
 *
 * @param props - Component props containing withdrawal, decision, isPending, onConfirm, and onClose.
 * @returns The rendered modal content.
 */
function AdminWithdrawalReviewDialogContent({
  withdrawal,
  decision,
  isPending,
  onConfirm,
  onClose,
}: AdminWithdrawalReviewDialogContentProps) {
  const initialReason = withdrawal.cancellationReason
    ? `Disetujui pembatalan: ${withdrawal.cancellationReason}`
    : '';

  const [rejectionReason, setRejectionReason] = useState(initialReason);
  const [adminNote, setAdminNote] = useState('');
  const [transferProofUrl, setTransferProofUrl] = useState('');

  const isApprove = decision === 'APPROVE';
  const isCancellation = Boolean(withdrawal.cancellationRequestedAt);
  const trimmedReason = rejectionReason.trim();
  const isRejectValid = !isApprove
    ? trimmedReason.length >= 5 && trimmedReason.length <= 500
    : true;

  const HandleSubmit = () => {
    if (!isRejectValid || isPending) return;

    onConfirm({
      rejectionReason: isApprove ? undefined : trimmedReason,
      adminNote: adminNote.trim() || undefined,
      transferProofUrl: transferProofUrl.trim() || undefined,
    });
  };

  return (
    <DialogContent className="max-w-md p-6 space-y-4">
      <DialogHeader>
        <DialogTitle className="text-base font-semibold tracking-tight">
          {isApprove
            ? 'Konfirmasi Sudah Transfer Dana'
            : isCancellation
              ? 'Setujui Pembatalan Penarikan'
              : 'Tolak Permintaan Penarikan'}
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          {isApprove
            ? 'Pastikan transfer manual ke rekening bank atau e-wallet tujuan telah berhasil diproses sebelum melakukan konfirmasi.'
            : 'Dana penarikan saldo akan otomatis dikembalikan (refund) ke dompet aktif pemohon secara utuh.'}
        </DialogDescription>
      </DialogHeader>

      {/* User Cancellation Callout if Present */}
      {!isApprove && withdrawal.cancellationReason && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300 space-y-0.5">
          <span className="font-semibold">Alasan Pembatalan dari Pemohon:</span>
          <p className="text-[11px] leading-relaxed">{withdrawal.cancellationReason}</p>
        </div>
      )}

      {/* Withdrawal Details Context Card */}
      <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2 text-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Kode Referensi</span>
          <span className="font-mono font-medium text-foreground">
            {withdrawal.referenceCode}
          </span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Pemohon</span>
          <span className="font-medium text-foreground truncate max-w-[200px]">
            {withdrawal.user.displayName}{' '}
            <span className="text-[11px] text-muted-foreground">
              ({withdrawal.user.role === 'CREATOR' ? 'Kreator' : 'Brand'})
            </span>
          </span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Rekening Tujuan</span>
          <span className="font-medium text-foreground truncate max-w-[200px]">
            {withdrawal.accountProvider} &middot; {withdrawal.accountNumber}
          </span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Nama Pemilik Rekening</span>
          <span className="font-medium text-foreground truncate max-w-[200px]">
            {withdrawal.accountHolderName}
          </span>
        </div>
        <div className="border-t border-border/50 pt-2 flex items-center justify-between">
          <span className="font-medium text-foreground">
            {isApprove ? 'Nominal Ditransfer' : 'Saldo Dikembalikan'}
          </span>
          <span className="font-mono text-sm font-semibold text-foreground">
            {FormatRupiah(withdrawal.amount)}
          </span>
        </div>
      </div>

      {/* Approve Form Inputs */}
      {isApprove && (
        <div className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">
                Catatan Admin / No. Ref Bank{' '}
                <span className="text-muted-foreground font-normal">(opsional)</span>
              </label>
              <FieldLengthTracker current={adminNote.length} max={500} />
            </div>
            <Input
              type="text"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              disabled={isPending}
              placeholder="Contoh: Transfer via KlikBCA No. Ref 8912301"
              maxLength={500}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              URL Bukti Transfer{' '}
              <span className="text-muted-foreground font-normal">(opsional)</span>
            </label>
            <Input
              type="url"
              value={transferProofUrl}
              onChange={(e) => setTransferProofUrl(e.target.value)}
              disabled={isPending}
              placeholder="https://storage.klipday.com/transfer/..."
              className="h-9 text-xs"
            />
          </div>
        </div>
      )}

      {/* Rejection Reason Form */}
      {!isApprove && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground">
              Alasan Penolakan / Pembatalan <span className="text-destructive">*</span>
            </label>
            <FieldLengthTracker current={trimmedReason.length} max={500} />
          </div>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            disabled={isPending}
            placeholder="Contoh: Nomor rekening tidak valid, bank menolak transfer, atau pembatalan atas permintaan pemohon."
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
            Konfirmasi Sudah Transfer
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
            {isCancellation ? 'Setujui Pembatalan & Refund' : 'Tolak & Kembalikan Saldo'}
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}

/**
 * Modal dialog for reviewing a creator or brand withdrawal request.
 * On APPROVE: confirms manual bank/e-wallet transfer completion and records optional transfer proof / admin note.
 * On REJECT: requires rejection reason and atomically refunds funds back to the user's active wallet balance.
 *
 * @param props - Dialog props.
 * @returns The rendered review confirmation dialog.
 */
export function AdminWithdrawalReviewDialog({
  open,
  onOpenChange,
  withdrawal,
  decision,
  isPending,
  onConfirm,
}: AdminWithdrawalReviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && withdrawal && decision && (
        <AdminWithdrawalReviewDialogContent
          withdrawal={withdrawal}
          decision={decision}
          isPending={isPending}
          onConfirm={onConfirm}
          onClose={() => onOpenChange(false)}
        />
      )}
    </Dialog>
  );
}
