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
import type { AdminApproveDialogProps } from '../types';
import { FormatRupiah } from '../utils/formatters';

/**
 * Confirmation dialog for approving and publishing a campaign to the creator marketplace.
 *
 * @param props - Dialog props.
 * @returns The rendered approval dialog.
 */
export function AdminApproveDialog({
  open,
  onOpenChange,
  isPending,
  campaignTitle,
  isManualPaymentPending,
  totalPayable,
  onConfirm,
}: AdminApproveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 space-y-4">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-base font-semibold tracking-tight">
            Setujui &amp; Tayangkan Kampanye?
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Anda akan menyetujui kampanye{' '}
            <strong className="text-foreground">"{campaignTitle}"</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2 text-xs">
          {isManualPaymentPending ? (
            <p className="text-muted-foreground leading-relaxed">
              Bukti transfer manual sebesar{' '}
              <strong className="font-mono text-foreground font-semibold">
                {FormatRupiah(totalPayable)}
              </strong>{' '}
              akan otomatis ditandai sebagai disetujui, dan status kampanye akan langsung
              berubah menjadi <strong className="text-emerald-500">AKTIF</strong> untuk dapat
              dijelajahi kreator.
            </p>
          ) : (
            <p className="text-muted-foreground leading-relaxed">
              Pembayaran telah lunas melalui saldo dompet. Kampanye akan langsung berstatus{' '}
              <strong className="text-emerald-500">AKTIF</strong> dan tayang di marketplace
              kreator Klipday.
            </p>
          )}
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
            size="sm"
            disabled={isPending}
            onClick={onConfirm}
            className="gap-2 text-xs font-semibold cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Menyetujui...</span>
              </>
            ) : (
              <span>Ya, Setujui &amp; Tayangkan</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
