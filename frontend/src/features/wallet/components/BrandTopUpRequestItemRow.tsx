import { useState } from 'react';
import { ArrowRight, Loader2, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UseCancelTopUpRequestMutation } from '../hooks';
import type { BrandTopUpRequestItemRowProps } from '../types';
import { FormatDateIndonesian, FormatRupiah } from '../utils/wallet-format';

/**
 * Renders an individual top-up request item row within the top-up drawer sheet.
 * Displays reference code, amount, status pill, destination bank, creation timestamp,
 * and actions to resume payment/verification or cancel the request.
 *
 * @param props - Component properties.
 * @returns Rendered top-up request row element.
 */
export function BrandTopUpRequestItemRow({
  topUp,
  onResumeTopUp,
  className,
}: BrandTopUpRequestItemRowProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const cancelMutation = UseCancelTopUpRequestMutation();

  const isPending = topUp.status === 'PENDING';

  const HandleConfirmCancel = () => {
    setIsAlertOpen(false);
    cancelMutation.mutate(topUp.id);
  };

  return (
    <div
      className={cn(
        'group rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-border',
        className,
      )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-mono text-sm font-semibold text-foreground">
              {topUp.referenceCode}
            </h4>
            {isPending ? (
              <span className="inline-flex shrink-0 items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                Menunggu Transfer
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:text-blue-400">
                Menunggu Verifikasi
              </span>
            )}
          </div>

          <div className="text-base font-semibold tabular-nums text-foreground">
            {FormatRupiah(topUp.totalPayable)}
          </div>

          <p className="text-xs text-muted-foreground">
            {topUp.destinationBank} &middot; Dibuat {FormatDateIndonesian(topUp.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/40 pt-3">
        {isPending ? (
          <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                disabled={cancelMutation.isPending}>
                <Trash2 className="mr-1.5 size-3.5" />
                <span>Batalkan</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Batalkan Permintaan Top Up?</AlertDialogTitle>
                <AlertDialogDescription>
                  Permintaan transfer dengan kode referensi{' '}
                  <strong className="text-foreground">{topUp.referenceCode}</strong> sebesar{' '}
                  <strong className="text-foreground">{FormatRupiah(topUp.totalPayable)}</strong>{' '}
                  akan dibatalkan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={cancelMutation.isPending}>Kembali</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={HandleConfirmCancel}
                  disabled={cancelMutation.isPending}>
                  {cancelMutation.isPending ? (
                    <>
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      Membatalkan...
                    </>
                  ) : (
                    'Ya, Batalkan'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <div />
        )}

        <Button
          type="button"
          size="sm"
          variant="default"
          onClick={() => onResumeTopUp(topUp)}
          className="h-8 px-3 text-xs font-medium cursor-pointer shadow-xs">
          <span>{isPending ? 'Lanjutkan Transfer' : 'Lihat Detail'}</span>
          <ArrowRight className="ml-1.5 size-3.5" />
        </Button>
      </div>
    </div>
  );
}
