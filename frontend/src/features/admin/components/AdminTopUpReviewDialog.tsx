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
import type { AdminTopUpReviewDialogProps } from '../types';
import { FormatRupiah } from '../utils/formatters';

/**
 * Modal dialog for confirming approval or rejection of a brand manual top-up request.
 * Approving credits `totalPayable` to wallet balance atomically.
 * Rejecting requires an explicit reason (min 5 chars, max 500 chars) for brand re-upload.
 *
 * @param props - Dialog props.
 * @returns The rendered review confirmation dialog.
 */
export function AdminTopUpReviewDialog({
  open,
  onOpenChange,
  topUp,
  decision,
  isPending,
  onConfirm,
}: AdminTopUpReviewDialogProps) {
  const [reason, setReason] = useState('');

  if (!topUp || !decision) {
    return null;
  }

  const isApprove = decision === 'APPROVE';
  const trimmedReason = reason.trim();
  const isRejectValid = !isApprove ? trimmedReason.length >= 5 && trimmedReason.length <= 500 : true;

  const HandleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setReason('');
    }
    onOpenChange(nextOpen);
  };

  const HandleSubmit = () => {
    if (!isRejectValid || isPending) return;
    onConfirm(isApprove ? undefined : trimmedReason);
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={HandleOpenChange}>
      <DialogContent className="max-w-md p-6 space-y-4">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold tracking-tight">
            {isApprove ? 'Setujui Permintaan Top Up' : 'Tolak Permintaan Top Up'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isApprove
              ? 'Saldo aktif brand akan otomatis bertambah sebesar total nominal yang ditransfer.'
              : 'Berikan alasan penolakan agar brand dapat memperbaiki atau mengunggah ulang bukti transfer.'}
          </DialogDescription>
        </DialogHeader>

        {/* Top-Up Context Card */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Kode Referensi</span>
            <span className="font-mono font-medium text-foreground">{topUp.referenceCode}</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Brand</span>
            <span className="font-medium text-foreground truncate max-w-[200px]">
              {topUp.brand.companyName}
            </span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Pengirim</span>
            <span className="font-medium text-foreground truncate max-w-[200px]">
              {topUp.senderBank ?? '-'} a.n {topUp.senderAccountName ?? '-'}
            </span>
          </div>
          <div className="border-t border-border/50 pt-2 flex items-center justify-between">
            <span className="font-medium text-foreground">
              {isApprove ? 'Saldo Dikreditkan' : 'Total Tagihan'}
            </span>
            <div className="text-right">
              <span className="font-mono text-sm font-semibold text-foreground">
                {FormatRupiah(topUp.totalPayable)}
              </span>
              <p className="text-[10px] text-muted-foreground">
                (Nominal: {FormatRupiah(topUp.amount)} + Kode Unik: {topUp.uniqueCode})
              </p>
            </div>
          </div>
        </div>

        {/* Rejection Reason Form */}
        {!isApprove && (
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-medium text-foreground">
              Alasan Penolakan <span className="text-destructive">*</span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isPending}
              placeholder="Contoh: Nominal pada struk transfer tidak sesuai dengan total tagihan, atau mutasi bank belum masuk."
              rows={3}
              maxLength={500}
              className="text-xs resize-none"
            />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Minimal 5 karakter.</span>
              <span className={trimmedReason.length > 500 ? 'text-destructive font-medium' : ''}>
                {trimmedReason.length} / 500
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="pt-2 sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => HandleOpenChange(false)}
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
              Setujui & Tambah Saldo
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
              Tolak Top Up
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
