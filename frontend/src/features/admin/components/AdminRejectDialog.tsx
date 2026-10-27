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
import type { AdminRejectDialogProps } from '../types';
import { FormatRupiah } from '../utils/formatters';

/**
 * Modal dialog for rejecting a campaign permanently with automatic wallet refund,
 * or rejecting only the manual transfer receipt to request a new upload.
 *
 * @param props - Dialog props.
 * @returns The rendered rejection dialog.
 */
export function AdminRejectDialog({
  open,
  onOpenChange,
  isPending,
  campaignTitle,
  budget,
  isManualPaymentPending,
  onConfirm,
}: AdminRejectDialogProps) {
  const [rejectAction, setRejectAction] = useState<'REJECT_PAYMENT' | 'REJECT_CAMPAIGN'>(
    isManualPaymentPending ? 'REJECT_PAYMENT' : 'REJECT_CAMPAIGN',
  );
  const [refundConfirmed, setRefundConfirmed] = useState(true);
  const [note, setNote] = useState('');

  const trimmed = note.trim();
  const isValid = trimmed.length > 0 && trimmed.length <= 1000;

  const HandleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setRejectAction(isManualPaymentPending ? 'REJECT_PAYMENT' : 'REJECT_CAMPAIGN');
      setRefundConfirmed(true);
      setNote('');
    }
    onOpenChange(nextOpen);
  };

  const HandleSubmit = () => {
    if (!isValid || isPending) return;
    onConfirm({
      action: isManualPaymentPending ? rejectAction : 'REJECT_CAMPAIGN',
      adminNote: trimmed,
      refundConfirmedManualPayment: refundConfirmed,
    });
    setNote('');
  };

  return (
    <Dialog open={open} onOpenChange={HandleOpenChange}>
      <DialogContent className="max-w-md p-6 space-y-4">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-base font-semibold tracking-tight text-rose-500">
            {isManualPaymentPending && rejectAction === 'REJECT_PAYMENT'
              ? 'Tolak Bukti Transfer Manual'
              : 'Tolak Kampanye Permanen'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Tindakan untuk kampanye <strong className="text-foreground">"{campaignTitle}"</strong>.
          </DialogDescription>
        </DialogHeader>

        {/* Action Toggle if manual transfer is pending */}
        {isManualPaymentPending && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Jenis Penolakan</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRejectAction('REJECT_PAYMENT')}
                className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition-colors cursor-pointer ${
                  rejectAction === 'REJECT_PAYMENT'
                    ? 'border-amber-500/60 bg-amber-500/10'
                    : 'border-border/60 bg-muted/20 hover:bg-muted/40'
                }`}
              >
                <span className="text-xs font-semibold text-foreground">Tolak Bukti Saja</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  Kembalikan ke menunggu pembayaran
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRejectAction('REJECT_CAMPAIGN')}
                className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition-colors cursor-pointer ${
                  rejectAction === 'REJECT_CAMPAIGN'
                    ? 'border-rose-500/60 bg-rose-500/10'
                    : 'border-border/60 bg-muted/20 hover:bg-muted/40'
                }`}
              >
                <span className="text-xs font-semibold text-foreground">Tolak Permanen</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  Kampanye ditolak dan auto-refund
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Contextual Notice */}
        {isManualPaymentPending ? (
          rejectAction === 'REJECT_PAYMENT' ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-muted-foreground leading-relaxed">
              Bukti transfer akan ditandai ditolak. Kampanye akan dikembalikan ke status{' '}
              <strong className="text-foreground">Menunggu Pembayaran</strong> sehingga brand dapat
              mengunggah ulang bukti transfer yang benar di Step 6.
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={refundConfirmed}
                  onChange={(e) => setRefundConfirmed(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-border"
                />
                <div className="space-y-0.5">
                  <p className="font-semibold text-foreground">
                    Dana transfer manual sudah masuk ke rekening Klipday (Refund ke Saldo Dompet Brand)
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Jika dicentang, dana transfer manual sebesar {FormatRupiah(budget)} akan diverifikasi
                    dan otomatis dikembalikan (refund) ke Saldo Dompet Klipday milik brand (CAMPAIGN_REFUND).
                  </p>
                </div>
              </label>
            </div>
          )
        ) : (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-muted-foreground leading-relaxed">
            Dana anggaran sebesar{' '}
            <strong className="text-foreground font-mono">{FormatRupiah(budget)}</strong> yang telah
            lunas akan otomatis dikembalikan (refund) ke Saldo Dompet Brand secara instan (CAMPAIGN_REFUND).
          </div>
        )}

        {/* Reason Textarea */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">
            Alasan Penolakan <span className="text-rose-500">*</span>
          </label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isPending}
            placeholder={
              rejectAction === 'REJECT_PAYMENT'
                ? 'Contoh: Bukti struk transfer terpotong dan nominal transfer tidak terlihat jelas.'
                : 'Contoh: Kampanye melanggar panduan komunitas Klipday terkait produk terlarang.'
            }
            rows={3}
            maxLength={1000}
            className="text-xs resize-none"
          />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Alasan ini akan ditampilkan kepada brand</span>
            <span className={note.length > 900 ? 'text-amber-500' : ''}>{note.length}/1000</span>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            className="text-xs cursor-pointer"
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={!isValid || isPending}
            onClick={HandleSubmit}
            className="gap-2 text-xs font-semibold cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>
                {rejectAction === 'REJECT_PAYMENT' ? 'Tolak Bukti Transfer' : 'Tolak & Kembalikan Dana'}
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
