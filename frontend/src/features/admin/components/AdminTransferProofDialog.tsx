import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { AdminTransferProofDialogProps } from '../types';
import { FormatRupiah } from '../utils/formatters';

/**
 * Modal dialog for inspecting the brand's uploaded bank transfer receipt.
 *
 * @param props - Dialog props containing open state, proof URL, and sender metadata.
 * @returns The rendered transfer proof dialog.
 */
export function AdminTransferProofDialog({
  open,
  onOpenChange,
  proofUrl,
  senderBank,
  senderName,
  totalPayable,
}: AdminTransferProofDialogProps) {
  const numericPayable = typeof totalPayable === 'string' ? Number(totalPayable) : (totalPayable ?? 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 space-y-4">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold tracking-tight">
            Bukti Struk Transfer Bank Manual
          </DialogTitle>
        </DialogHeader>

        {/* Sender Summary Pill */}
        <div className="grid grid-cols-2 divide-x divide-border/60 rounded-lg border border-border/60 bg-muted/20 p-3 text-xs">
          <div className="pr-2 space-y-0.5">
            <p className="text-muted-foreground">Rekening Pengirim</p>
            <p className="font-semibold text-foreground">
              {senderBank ?? '-'} a.n {senderName ?? '-'}
            </p>
          </div>
          <div className="pl-2.5 space-y-0.5">
            <p className="text-muted-foreground">Total Nominal Ditagih</p>
            <p className="font-mono font-semibold text-foreground">
              {FormatRupiah(numericPayable)}
            </p>
          </div>
        </div>

        {/* Image Preview Container */}
        <div className="flex max-h-[60vh] items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-background/50 p-2">
          {proofUrl ? (
            <img
              src={proofUrl}
              alt="Bukti Struk Transfer"
              className="max-h-[55vh] w-auto rounded-lg object-contain"
            />
          ) : (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Tidak ada gambar bukti transfer yang terlampir.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          {proofUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
              className="gap-2 text-xs cursor-pointer"
            >
              <a href={proofUrl} target="_blank" rel="noopener noreferrer">
                <span>Buka Ukuran Penuh</span>
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="ml-auto text-xs cursor-pointer"
          >
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
