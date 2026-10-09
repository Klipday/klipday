import { useState } from 'react';
import { Loader2 } from 'lucide-react';
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
import { UseRequestWithdrawalCancellationMutation } from '../hooks';
import type { BrandWithdrawalRequestItemRowProps } from '../types';
import { FormatDateIndonesian, FormatRupiah } from '../utils/wallet-format';

/**
 * Renders an individual withdrawal request item row within the withdrawal drawer sheet.
 * Displays reference code, amount, status badge, destination bank account details,
 * creation timestamp, and action to submit a cancellation request.
 *
 * @param props - Component properties.
 * @returns Rendered withdrawal request row element.
 */
export function BrandWithdrawalRequestItemRow({
  withdrawal,
  className,
}: BrandWithdrawalRequestItemRowProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const requestCancelMutation = UseRequestWithdrawalCancellationMutation();

  const isPending = withdrawal.payoutStatus === 'PENDING';
  const isCancellationRequested = Boolean(withdrawal.cancellationRequestedAt);

  const HandleConfirmRequestCancel = () => {
    setIsAlertOpen(false);
    requestCancelMutation.mutate({ withdrawalId: withdrawal.id });
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
              {withdrawal.referenceCode}
            </h4>
            {isCancellationRequested ? (
              <span className="inline-flex shrink-0 items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                Menunggu Pembatalan
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center rounded-md border border-muted-foreground/30 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                Menunggu Proses
              </span>
            )}
          </div>

          <div className="text-base font-semibold tabular-nums text-foreground">
            {FormatRupiah(withdrawal.amount)}
          </div>

          <p className="text-xs text-muted-foreground">
            {withdrawal.accountProvider} ({withdrawal.accountNumber}) a.n {withdrawal.accountHolderName}
          </p>

          <p className="text-[11px] text-muted-foreground/80">
            Dibuat {FormatDateIndonesian(withdrawal.createdAt)}
          </p>
        </div>
      </div>

      {isPending && (
        <div className="mt-3 flex items-center justify-end border-t border-border/40 pt-3">
          {isCancellationRequested ? (
            <span className="text-xs text-muted-foreground/90 italic">
              Pengajuan pembatalan sedang ditinjau Admin
            </span>
          ) : (
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                  disabled={requestCancelMutation.isPending}>
                  <span>Ajukan Pembatalan</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent size="sm">
                <AlertDialogHeader>
                  <AlertDialogTitle>Ajukan Pembatalan Penarikan?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Pengajuan pembatalan untuk penarikan dengan kode referensi{' '}
                    <strong className="text-foreground">{withdrawal.referenceCode}</strong> sebesar{' '}
                    <strong className="text-foreground">{FormatRupiah(withdrawal.amount)}</strong>{' '}
                    akan ditinjau oleh Admin Klipday untuk memastikan dana belum ditransfer ke rekening tujuan.
                    Saldo aktif akan dikembalikan ke dompet setelah pembatalan disetujui.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={requestCancelMutation.isPending}>
                    Kembali
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={HandleConfirmRequestCancel}
                    disabled={requestCancelMutation.isPending}>
                    {requestCancelMutation.isPending ? (
                      <>
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        Mengajukan...
                      </>
                    ) : (
                      'Ya, Ajukan Pembatalan'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
    </div>
  );
}

