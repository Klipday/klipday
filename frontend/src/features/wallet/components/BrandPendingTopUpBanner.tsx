import { useState } from 'react';
import { ArrowRight, Clock, Loader2, Trash2 } from 'lucide-react';
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
import type { BrandPendingTopUpBannerProps } from '../types';
import { FormatDateIndonesian, FormatRupiah } from '../utils/wallet-format';
import { BrandTopUpRequestsSheet } from './BrandTopUpRequestsSheet';

/**
 * Top notification banner for active top-up requests, mirroring the campaign draft banner UX.
 * Displays the latest active request with quick resume / cancel actions, and provides a trigger
 * to open the slide-out sheet drawer when multiple pending requests exist.
 *
 * @param props - Component properties.
 * @returns Rendered pending top up banner element or null if no active requests exist.
 */
export function BrandPendingTopUpBanner({
  activeTopUps,
  onResumeTopUp,
  className,
}: BrandPendingTopUpBannerProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const cancelMutation = UseCancelTopUpRequestMutation();

  const count = activeTopUps.length;

  if (count === 0) {
    return null;
  }

  const latestTopUp = activeTopUps[0];
  const isPending = latestTopUp.status === 'PENDING';

  const HandleConfirmCancel = () => {
    setIsAlertOpen(false);
    cancelMutation.mutate(latestTopUp.id);
  };

  return (
    <>
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border border-border/70 bg-muted/25 p-4 sm:p-5 text-card-foreground transition-all duration-200 hover:border-border',
          className,
        )}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left Side: Essential Information */}
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Clock className="size-3.5" />
                Permintaan Top Up Aktif
              </span>
            </div>

            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-x-2 text-base font-semibold text-foreground">
                <span className="font-mono">{latestTopUp.referenceCode}</span>
                <span className="text-muted-foreground/60">&middot;</span>
                <span className="tabular-nums">{FormatRupiah(latestTopUp.totalPayable)}</span>
                <span className="text-muted-foreground/60">&middot;</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {latestTopUp.destinationBank}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                {count === 1
                  ? isPending
                    ? `Dibuat ${FormatDateIndonesian(latestTopUp.createdAt)}. Selesaikan transfer ke rekening BCA sebelum 24 jam.`
                    : `Dibuat ${FormatDateIndonesian(latestTopUp.createdAt)}. Bukti transfer sedang diverifikasi admin.`
                  : `Anda memiliki ${count} permintaan top up aktif. Terakhir dibuat ${FormatDateIndonesian(latestTopUp.createdAt)}.`}
              </p>
            </div>
          </div>

          {/* Right Side: Action Controls ONLY (No amount next to buttons) */}
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {count === 1 ? (
              <>
                {isPending && (
                  <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={cancelMutation.isPending}
                        className="h-9 px-3 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer">
                        <Trash2 className="size-3.5" />
                        <span className="ml-1.5">Batalkan</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent size="sm">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Batalkan Permintaan Top Up?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Permintaan transfer dengan kode referensi{' '}
                          <strong className="text-foreground">{latestTopUp.referenceCode}</strong>{' '}
                          sebesar{' '}
                          <strong className="text-foreground">
                            {FormatRupiah(latestTopUp.totalPayable)}
                          </strong>{' '}
                          akan dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={cancelMutation.isPending}>
                          Kembali
                        </AlertDialogCancel>
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
                )}

                <Button
                  type="button"
                  size="sm"
                  className="h-9 px-4 text-xs font-medium cursor-pointer"
                  onClick={() => onResumeTopUp(latestTopUp)}>
                  <span>{isPending ? 'Lanjutkan Transfer' : 'Lihat Detail'}</span>
                  <ArrowRight className="ml-1.5 size-3.5" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 text-xs cursor-pointer"
                  onClick={() => setIsSheetOpen(true)}>
                  <span>Lihat Semua Top Up ({count})</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  className="h-9 px-4 text-xs font-medium cursor-pointer"
                  onClick={() => onResumeTopUp(latestTopUp)}>
                  <span>Lanjutkan Terakhir</span>
                  <ArrowRight className="ml-1.5 size-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <BrandTopUpRequestsSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        activeTopUps={activeTopUps}
        onResumeTopUp={onResumeTopUp}
      />
    </>
  );
}
