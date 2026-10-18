import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useLocation } from 'react-router';
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
import { UseCurrentAccountQuery } from '@/features/authentication/hooks';
import { cn } from '@/lib/utils';
import {
  UseRequestCreatorWithdrawalCancellationMutation,
  UseRequestWithdrawalCancellationMutation,
} from '../hooks';
import type { WalletWithdrawalRequestItemRowProps } from '../types';
import { ResolveEffectiveRole } from '../utils/payout-account.utils';
import { FormatDateIndonesian, FormatRupiah } from '../utils/wallet-format';

/**
 * Renders an individual withdrawal request item row within the shared withdrawal drawer sheet.
 * Displays reference code, amount, status badge, destination account details,
 * creation timestamp, and action to submit a cancellation request for Brand or Creator.
 *
 * @param props - Component properties.
 * @returns Rendered withdrawal request row element.
 */
export function WalletWithdrawalRequestItemRow({
  withdrawal,
  role,
  className,
}: WalletWithdrawalRequestItemRowProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const location = useLocation();
  const { data: accountProfile } = UseCurrentAccountQuery();
  const effectiveRole = ResolveEffectiveRole(role, accountProfile?.role, location.pathname);
  const isCreator = effectiveRole === 'CREATOR';

  const brandCancelMutation = UseRequestWithdrawalCancellationMutation();
  const creatorCancelMutation = UseRequestCreatorWithdrawalCancellationMutation();
  const requestCancelMutation = isCreator ? creatorCancelMutation : brandCancelMutation;

  const isPending = withdrawal.payoutStatus === 'PENDING';
  const isCancellationRequested = Boolean(withdrawal.cancellationRequestedAt);
  const formattedAmount = FormatRupiah(withdrawal.amount);
  const formattedDate = FormatDateIndonesian(withdrawal.createdAt);
  const rowClassName = cn(
    'group rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-border',
    className,
  );

  /**
   * Confirms and submits the cancellation request for this withdrawal item.
   */
  const HandleConfirmRequestCancel = () => {
    setIsAlertOpen(false);
    requestCancelMutation.mutate({ withdrawalId: withdrawal.id });
  };

  return (
    <div className={rowClassName}>
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
            {formattedAmount}
          </div>

          <p className="text-xs text-muted-foreground">
            {withdrawal.accountProvider} ({withdrawal.accountNumber}) a.n {withdrawal.accountHolderName}
          </p>

          <p className="text-[11px] text-muted-foreground/80">
            Dibuat {formattedDate}
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
              <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Ajukan Pembatalan Penarikan?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Pengajuan pembatalan untuk penarikan dengan kode referensi{' '}
                    <strong className="text-foreground">{withdrawal.referenceCode}</strong> sebesar{' '}
                    <strong className="text-foreground">{formattedAmount}</strong>{' '}
                    akan ditinjau oleh Admin Klipday untuk memastikan dana belum ditransfer ke rekening tujuan.
                    Saldo aktif akan dikembalikan ke dompet setelah pembatalan disetujui.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-2.5">
                  <AlertDialogCancel
                    disabled={requestCancelMutation.isPending}
                    className="w-full sm:w-auto sm:min-w-[90px] cursor-pointer">
                    Kembali
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={HandleConfirmRequestCancel}
                    disabled={requestCancelMutation.isPending}
                    className="w-full sm:w-auto px-5 sm:min-w-[200px] font-medium cursor-pointer">
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
