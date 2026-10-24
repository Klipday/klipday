import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { AdminFinalizeSettlementDialogProps } from '../types';
import { FormatRupiah } from '../utils/formatters';

/**
 * Confirmation dialog for finalizing campaign settlement (`POST /admin/settlements/campaigns/:id/finalize`).
 * Presents the exact final ledger breakdown (Creator Rewards + Brand Refund = Total Budget Escrow)
 * before executing atomic wallet transfers.
 *
 * @param props - Dialog props from types.ts.
 * @returns The rendered AlertDialog component.
 */
export function AdminFinalizeSettlementDialog({
  summary,
  open,
  isPending,
  onOpenChange,
  onConfirm,
}: AdminFinalizeSettlementDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-semibold tracking-tight">
            Konfirmasi Penyelesaian Settlement
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs leading-relaxed text-muted-foreground">
            Tindakan ini bersifat final dan tidak dapat dibatalkan. Anggaran kampanye akan
            langsung didistribusikan ke dompet masing-masing pihak:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="divide-y divide-border/50 rounded-xl border border-border/60 bg-muted/20 text-xs">
          <div className="flex items-center justify-between px-3.5 py-2.5">
            <span className="text-muted-foreground">Total Anggaran Kampanye</span>
            <span className="font-mono font-medium text-foreground tabular-nums">
              {FormatRupiah(summary.budget)}
            </span>
          </div>
          <div className="flex items-center justify-between px-3.5 py-2.5">
            <span className="text-muted-foreground">
              Distribusi Reward ({summary.approvedCount} Video Kreator)
            </span>
            <span className="font-mono font-semibold text-foreground tabular-nums">
              {FormatRupiah(summary.allocatedCreatorRewards)}
            </span>
          </div>
          <div className="flex items-center justify-between px-3.5 py-2.5">
            <span className="text-muted-foreground">
              Budget Tersisa (Kembali ke {summary.brand.companyName})
            </span>
            <span className="font-mono font-semibold text-emerald-500 tabular-nums">
              {FormatRupiah(summary.brandRefundAmount)}
            </span>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} className="text-xs h-9">
            Periksa Kembali
          </AlertDialogCancel>
          <Button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-9"
          >
            {isPending ? 'Memproses Distribusi...' : 'Konfirmasi & Distribusi Dana'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
