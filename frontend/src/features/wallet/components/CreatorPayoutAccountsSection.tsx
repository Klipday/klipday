import { useState } from 'react';
import { CheckCircle2, Clock, Plus, Star, Trash2, XCircle } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { CreatorPayoutAccountsSectionProps } from '../types';


/**
 * In-context payout accounts & e-wallets management card for Creator Wallet.
 * Creators do not have a dedicated payout account tab in profile, so KYC accounts are managed directly here.
 *
 * @param props - Component configuration properties.
 * @returns Rendered payout accounts card.
 */
export function CreatorPayoutAccountsSection({
  accounts,
  isLoading,
  onAddNewAccount,
  onSetPrimary,
  onDeleteAccount,
  className,
}: CreatorPayoutAccountsSectionProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const HandleOpenDelete = (id: string) => {
    setDeletingId(id);
  };

  const HandleConfirmDelete = () => {
    if (deletingId) {
      onDeleteAccount(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <>
      <Card className={cn('border-border/60 bg-card shadow-xs', className)}>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 p-4 sm:p-5">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-semibold text-foreground">
              Rekening & E-Wallet Penarikan
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Daftarkan rekening bank atau e-wallet (DANA, GoPay, OVO) untuk menerima pencairan upah video.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddNewAccount}
            disabled={accounts.length >= 5}
            className="cursor-pointer text-xs font-medium border-border/60 hover:bg-muted/40 shrink-0">
            <Plus className="mr-1.5 size-3.5" />
            <span>Tambah Akun</span>
          </Button>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl border border-border/40 p-3.5">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-6 text-center">
              <p className="text-sm font-medium text-foreground">
                Belum ada rekening atau e-wallet terdaftar
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tambahkan akun bank atau e-wallet Anda agar dapat mencairkan saldo pendapatan kampanye.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={onAddNewAccount}
                className="mt-4 cursor-pointer text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-1.5 size-3.5" />
                <span>Tambah Akun Sekarang</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => {
                const isVerified = account.verificationStatus === 'VERIFIED';
                const isPending = account.verificationStatus === 'PENDING';
                const isRejected = account.verificationStatus === 'REJECTED';

                return (
                  <div
                    key={account.id}
                    className="flex flex-col gap-3 rounded-xl border border-border/50 bg-background/60 p-3.5 sm:flex-row sm:items-center sm:justify-between transition-colors hover:border-border">
                    <div className="flex items-start gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">
                            {account.provider}
                          </span>
                          <span className="font-mono text-xs text-foreground/80">
                            {account.accountNumber}
                          </span>
                          {account.isPrimary && (
                            <span className="inline-flex items-center rounded-md border border-primary/40 bg-primary/10 text-primary text-[10px] font-medium px-1.5 py-0.5">
                              Utama
                            </span>
                          )}
                          {isVerified && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium px-1.5 py-0.5">
                              <CheckCircle2 className="size-3" />
                              Terverifikasi
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-medium px-1.5 py-0.5">
                              <Clock className="size-3" />
                              Menunggu Verifikasi
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-[10px] font-medium px-1.5 py-0.5">
                              <XCircle className="size-3" />
                              Ditolak
                            </span>
                          )}
                        </div>


                        <p className="text-xs text-muted-foreground">
                          a.n <span className="font-medium text-foreground">{account.accountHolderName}</span>
                          {account.rejectionReason && (
                            <span className="ml-2 text-destructive font-normal">
                              ({account.rejectionReason})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {!account.isPrimary && isVerified && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onSetPrimary(account.id)}
                          className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                          <Star className="mr-1.5 size-3.5" />
                          <span>Jadikan Utama</span>
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => HandleOpenDelete(account.id)}
                        className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer">
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">Hapus akun</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(deletingId)} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">
              Hapus Akun Penarikan?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Akun ini tidak dapat digunakan lagi untuk penarikan saldo. Anda dapat mendaftarkannya kembali kapan saja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer text-xs">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={HandleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer text-xs font-medium">
              Ya, Hapus Akun
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
