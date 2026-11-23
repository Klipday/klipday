import { useState } from 'react';
import {
  LoaderIcon,
  SquareTopDownIcon,
  StarIcon,
  TrashBinTrashIcon,
} from '@solar-icons/react/linear';
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
import type { PayoutAccountCardProps } from '../types';

/**
 * Card item representing an individual registered payout account.
 * Displays provider details, verification badges, primary indicator, and management actions.
 * Eliminates decorative icon spam and separates pending application cancellation from verified account deletion.
 *
 * @param props - Component properties.
 * @returns The rendered payout account card.
 */
export function PayoutAccountCard({
  account,
  onSetPrimary,
  onDelete,
  isSettingPrimary,
  isDeleting,
}: PayoutAccountCardProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const isBank = account.accountType === 'BANK_TRANSFER';
  const isPending = account.verificationStatus === 'PENDING';
  const isVerified = account.verificationStatus === 'VERIFIED';

  const RenderStatusText = () => {
    switch (account.verificationStatus) {
      case 'VERIFIED':
        return (
          <span className="text-xs font-medium text-foreground">
            Terverifikasi
          </span>
        );
      case 'PENDING':
        return (
          <span className="text-xs font-medium text-amber-500">
            Menunggu Verifikasi
          </span>
        );
      case 'REJECTED':
        return (
          <span className="text-xs font-medium text-destructive">
            Verifikasi Ditolak
          </span>
        );
    }
  };

  const HandleConfirmAction = () => {
    onDelete(account.id, isPending);
  };

  return (
    <>
      <div
        className={cn(
          'flex flex-col justify-between rounded-2xl border bg-card p-4 sm:p-5 shadow-xs transition-colors',
          account.isPrimary
            ? 'border-primary/50 ring-1 ring-primary/20'
            : 'border-border/60 hover:border-border',
        )}>
        <div className="space-y-4">
          {/* Header row: provider typography + plain status text */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-base text-foreground tracking-tight">
                {account.provider}
              </span>
              <span className="block text-xs text-muted-foreground">
                {isBank ? 'Transfer Bank' : 'E-Wallet'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {account.isPrimary ? (
                <span className="text-xs font-medium text-foreground">
                  Utama
                </span>
              ) : null}
              {RenderStatusText()}
            </div>
          </div>

          {/* Account credentials */}
          <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-1">
            <span className="text-sm sm:text-base font-semibold tracking-wider tabular-nums text-foreground break-all">
              {account.accountNumber}
            </span>
            <p className="text-xs font-medium text-muted-foreground">
              a.n. <span className="text-foreground">{account.accountHolderName}</span>
            </p>
          </div>

          {/* Rejection notice if any */}
          {account.verificationStatus === 'REJECTED' && account.rejectionReason ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <p className="font-semibold text-[11px]">Catatan Verifikasi Admin:</p>
              <p className="mt-0.5 text-[11px] leading-relaxed">{account.rejectionReason}</p>
            </div>
          ) : null}

          {/* Pending verification helper notice */}
          {isPending ? (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
              <p className="text-[11px] leading-relaxed">
                Dokumen rekening sedang dalam antrean verifikasi tim admin Klipday (maks. 1x24 jam kerja).
              </p>
            </div>
          ) : null}

          {/* Link to view uploaded proof */}
          {account.proofUrl ? (
            <a
              href={account.proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4">
              <span>Lihat Foto Bukti Rekening</span>
              <SquareTopDownIcon className="size-3" />
            </a>
          ) : null}
        </div>

        {/* Action buttons row */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-4 mt-4">
          {isVerified && !account.isPrimary ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSetPrimary(account.id)}
              disabled={isSettingPrimary || isDeleting}
              className="cursor-pointer text-xs h-8">
              {isSettingPrimary ? (
                <LoaderIcon className="mr-1.5 size-3 animate-spin" />
              ) : (
                <StarIcon className="mr-1.5 size-3 text-muted-foreground" />
              )}
              <span>Jadikan Utama</span>
            </Button>
          ) : (
            <div />
          )}

          {isPending ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAlertOpen(true)}
              disabled={isDeleting || isSettingPrimary}
              className="cursor-pointer text-xs h-8 text-muted-foreground hover:text-foreground hover:bg-muted/60">
              <span>Batalkan Pengajuan</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAlertOpen(true)}
              disabled={isDeleting || isSettingPrimary}
              className="cursor-pointer text-xs h-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
              <TrashBinTrashIcon className="mr-1.5 size-3.5" />
              <span>Hapus</span>
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation dialog: Cancel Submission vs Delete Verified Account */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">
              {isPending ? 'Batalkan Pengajuan Akun?' : 'Hapus Akun Penarikan?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              {isPending
                ? `Pengajuan verifikasi akun ${account.provider} (${account.accountNumber}) a.n. ${account.accountHolderName} akan dibatalkan dan ditarik dari antrean verifikasi admin.`
                : `Akun ${account.provider} (${account.accountNumber}) a.n. ${account.accountHolderName} akan dihapus dari daftar akun penarikan brand Anda.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Tutup</AlertDialogCancel>
            <AlertDialogAction
              onClick={HandleConfirmAction}
              disabled={isDeleting}
              className={cn(
                'font-medium cursor-pointer',
                isPending
                  ? 'bg-muted-foreground/20 text-foreground hover:bg-muted-foreground/30'
                  : 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
              )}>
              {isDeleting
                ? 'Memproses...'
                : isPending
                  ? 'Ya, Batalkan Pengajuan'
                  : 'Ya, Hapus Akun'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
