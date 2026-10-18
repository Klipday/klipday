import { useState } from 'react';
import { ArrowRight, Clock, Loader2 } from 'lucide-react';
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
import type { WalletPendingWithdrawalBannerProps } from '../types';
import { ResolveEffectiveRole } from '../utils/payout-account.utils';
import { FormatDateIndonesian, FormatRupiah } from '../utils/wallet-format';
import { WalletWithdrawalRequestsSheet } from './WalletWithdrawalRequestsSheet';

/**
 * Shared top notification banner for active withdrawal requests across Brand and Creator wallets.
 * Displays the latest active withdrawal request with quick cancellation request and detail view actions,
 * and provides a trigger to open the slide-out sheet drawer when pending requests exist.
 *
 * @param props - Component properties.
 * @returns Rendered pending withdrawal banner element or null if no active requests exist.
 */
export function WalletPendingWithdrawalBanner({
  activeWithdrawals,
  role,
  className,
}: WalletPendingWithdrawalBannerProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const location = useLocation();
  const { data: accountProfile } = UseCurrentAccountQuery();
  const effectiveRole = ResolveEffectiveRole(role, accountProfile?.role, location.pathname);
  const isCreator = effectiveRole === 'CREATOR';

  const brandCancelMutation = UseRequestWithdrawalCancellationMutation();
  const creatorCancelMutation = UseRequestCreatorWithdrawalCancellationMutation();
  const requestCancelMutation = isCreator ? creatorCancelMutation : brandCancelMutation;

  const count = activeWithdrawals.length;

  if (count === 0) {
    return null;
  }

  const latestWithdrawal = activeWithdrawals[0];
  const isCancellationRequested = Boolean(latestWithdrawal.cancellationRequestedAt);
  const formattedAmount = FormatRupiah(latestWithdrawal.amount);
  const formattedDate = FormatDateIndonesian(latestWithdrawal.createdAt);
  const bannerClassName = cn(
    'relative overflow-hidden rounded-xl border border-border/70 bg-muted/25 p-4 sm:p-5 text-card-foreground transition-all duration-200 hover:border-border',
    className,
  );

  /**
   * Confirms and submits the cancellation request for the latest active withdrawal.
   */
  const HandleConfirmRequestCancel = () => {
    setIsAlertOpen(false);
    requestCancelMutation.mutate({ withdrawalId: latestWithdrawal.id });
  };

  return (
    <>
      <div className={bannerClassName}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left Side: Essential Information */}
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Clock className="size-3.5" />
                Permintaan Penarikan Saldo Aktif
              </span>
              {isCancellationRequested && (
                <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                  Menunggu Pembatalan
                </span>
              )}
            </div>

            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-x-2 text-base font-semibold text-foreground">
                <span className="font-mono">{latestWithdrawal.referenceCode}</span>
                <span className="text-muted-foreground/60">&middot;</span>
                <span className="tabular-nums">{formattedAmount}</span>
                <span className="text-muted-foreground/60">&middot;</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {latestWithdrawal.accountProvider}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                {count === 1
                  ? isCancellationRequested
                    ? `Dibuat ${formattedDate}. Pengajuan pembatalan sedang ditinjau oleh Admin.`
                    : `Dibuat ${formattedDate}. Dana sedang dalam proses verifikasi dan transfer oleh Admin.`
                  : `Anda memiliki ${count} permintaan penarikan aktif. Terakhir dibuat ${formattedDate}.`}
              </p>
            </div>
          </div>

          {/* Right Side: Action Controls */}
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {count === 1 ? (
              <>
                {!isCancellationRequested && (
                  <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={requestCancelMutation.isPending}
                        className="h-9 px-3 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer">
                        <span>Ajukan Pembatalan</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="sm:max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Ajukan Pembatalan Penarikan?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Pengajuan pembatalan untuk penarikan dengan kode referensi{' '}
                          <strong className="text-foreground">{latestWithdrawal.referenceCode}</strong>{' '}
                          sebesar{' '}
                          <strong className="text-foreground">
                            {formattedAmount}
                          </strong>{' '}
                          akan ditinjau oleh Admin Klipday untuk memastikan dana belum ditransfer ke rekening Anda.
                          Saldo aktif akan dikembalikan setelah pembatalan disetujui.
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

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 text-xs cursor-pointer border-border/70 hover:bg-muted/40"
                  onClick={() => setIsSheetOpen(true)}>
                  <span>Lihat Detail</span>
                  <ArrowRight className="ml-1.5 size-3.5" />
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs cursor-pointer border-border/70 hover:bg-muted/40"
                onClick={() => setIsSheetOpen(true)}>
                <span>Lihat Semua Penarikan ({count})</span>
                <ArrowRight className="ml-1.5 size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <WalletWithdrawalRequestsSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        activeWithdrawals={activeWithdrawals}
        role={effectiveRole}
      />
    </>
  );
}
