import { useState } from 'react';
import { Clock } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CreatorPendingWithdrawalBannerProps, PayoutRequestRecord } from '../types';
import { FormatDateIndonesian, FormatRupiah } from '../utils/wallet-format';


/**
 * Notice banner showing active pending withdrawal requests for creator.
 * Lets the creator track the transfer processing status and request cancellation.
 *
 * @param props - Component properties.
 * @returns Rendered banner or null if no pending withdrawals.
 */
export function CreatorPendingWithdrawalBanner({
  activeWithdrawals,
  onCancelRequest,
  className,
}: CreatorPendingWithdrawalBannerProps) {
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<PayoutRequestRecord | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  if (!activeWithdrawals || activeWithdrawals.length === 0) {
    return null;
  }

  const HandleOpenCancel = (item: PayoutRequestRecord) => {
    setSelectedWithdrawal(item);
    setIsCancelDialogOpen(true);
  };

  const HandleConfirmCancel = () => {
    if (selectedWithdrawal && onCancelRequest) {
      onCancelRequest(selectedWithdrawal.id);
    }
    setIsCancelDialogOpen(false);
    setSelectedWithdrawal(null);
  };

  return (
    <>
      <div className={cn('space-y-3', className)}>
        {activeWithdrawals.map((withdrawal) => {
          const isCancellationRequested = Boolean(withdrawal.cancellationRequestedAt);

          return (
            <div
              key={withdrawal.id}
              className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between text-xs">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full p-1 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Clock className="size-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">
                      Pengajuan Penarikan Sedang Diproses
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      ({withdrawal.referenceCode})
                    </span>
                    {isCancellationRequested && (
                      <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                        Pembatalan Ditinjau
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground">
                    Penarikan sebesar{' '}
                    <span className="font-semibold text-foreground">
                      {FormatRupiah(withdrawal.amount)}
                    </span>{' '}
                    ke {withdrawal.accountProvider} ({withdrawal.accountNumber} a.n{' '}
                    {withdrawal.accountHolderName}) diajukan pada{' '}
                    {FormatDateIndonesian(withdrawal.createdAt)}.
                  </p>
                </div>
              </div>

              {!isCancellationRequested && onCancelRequest && (
                <div className="flex items-center justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => HandleOpenCancel(withdrawal)}
                    className="h-8 text-xs border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 cursor-pointer">
                    Batalkan Pengajuan
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">
              Batalkan Pengajuan Penarikan?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Pengajuan pembatalan akan dikirimkan kepada tim Admin. Setelah disetujui, saldo sebesar{' '}
              <span className="font-semibold text-foreground">
                {selectedWithdrawal ? FormatRupiah(selectedWithdrawal.amount) : ''}
              </span>{' '}
              akan dikembalikan ke saldo dompet Anda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer text-xs">
              Kembali
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={HandleConfirmCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer text-xs font-medium">
              Ya, Batalkan Penarikan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
