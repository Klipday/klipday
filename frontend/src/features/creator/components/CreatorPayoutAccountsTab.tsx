import { useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Info,
  Plus,
  Star,
  Trash2,
  Wallet,
  XCircle,
} from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { AddPayoutAccountDialog } from '@/features/wallet/components';
import {
  UseCreatorPayoutAccountsQuery,
  UseDeleteCreatorPayoutAccountMutation,
  UseSetPrimaryCreatorPayoutAccountMutation,
} from '@/features/wallet/hooks';
import { cn } from '@/lib/utils';
import type { CreatorPayoutAccountsTabProps } from '../types';

/**
 * Tab component managing creator withdrawal accounts (banks and e-wallets).
 * Includes neutral KYC notice, list of registered payout destinations,
 * primary account switcher, and deletion confirmation dialog.
 *
 * @param props - Component configuration properties.
 * @returns The rendered creator payout accounts tab element.
 */
export function CreatorPayoutAccountsTab({ className }: CreatorPayoutAccountsTabProps) {
  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

  const { data: accounts = [], isLoading, refetch } = UseCreatorPayoutAccountsQuery();
  const setPrimaryMutation = UseSetPrimaryCreatorPayoutAccountMutation();
  const deleteAccountMutation = UseDeleteCreatorPayoutAccountMutation();

  const HandleConfirmDelete = () => {
    if (deletingAccountId) {
      deleteAccountMutation.mutate(deletingAccountId);
      setDeletingAccountId(null);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Tab Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Rekening & E-Wallet Penarikan Saldo
          </h2>
          <p className="text-xs text-muted-foreground">
            Daftarkan rekening bank atau e-wallet (DANA, GoPay, OVO) untuk menerima pencairan upah video.
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => setIsAddAccountDialogOpen(true)}
          disabled={accounts.length >= 5}
          className="cursor-pointer text-xs shrink-0">
          <Plus className="mr-1.5 size-3.5" />
          <span>Tambah Akun</span>
        </Button>
      </div>

      {/* Neutral KYC Notice (Anti-AI Slop: calm, muted neutral background) */}
      <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="space-y-1">
          <p className="font-medium text-foreground">
            Ketentuan Pencairan & Verifikasi Rekening
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Sesuai regulasi perbankan Indonesia, nama pemilik rekening atau e-wallet harus sama dengan nama lengkap pada identitas KTP Anda. Akun baru akan ditinjau oleh tim Klipday dalam 1×24 jam kerja.
          </p>
        </div>
      </div>

      {/* Payout Accounts List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-xl border border-border/40 p-4">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 p-8 text-center space-y-3">
          <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground border border-border/50">
            <Wallet className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">
              Belum ada akun penarikan
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Daftarkan rekening bank atau e-wallet Anda agar dapat mencairkan saldo hasil penayangan video.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddAccountDialogOpen(true)}
            className="cursor-pointer text-xs">
            <Plus className="mr-1.5 size-3.5" />
            <span>Tambah Rekening Baru</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((acc) => {
            const isVerified = acc.verificationStatus === 'VERIFIED';
            const isPending = acc.verificationStatus === 'PENDING';
            const isRejected = acc.verificationStatus === 'REJECTED';
            const isBank = acc.accountType === 'BANK_TRANSFER';

            return (
              <div
                key={acc.id}
                className={cn(
                  'flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 transition-colors',
                  acc.isPrimary
                    ? 'border-primary/40 bg-card shadow-2xs'
                    : 'border-border/60 bg-card hover:border-border',
                )}>
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-muted-foreground">
                    {isBank ? <Building2 className="size-5" /> : <Wallet className="size-5" />}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground tracking-tight">
                        {acc.provider}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {acc.accountNumber}
                      </span>

                      {/* Primary Badge */}
                      {acc.isPrimary ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
                          <Star className="size-3 fill-primary" />
                          <span>Utama</span>
                        </span>
                      ) : null}

                      {/* Verification Status Badge */}
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="size-3" />
                          <span>Terverifikasi</span>
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <Clock className="size-3" />
                          <span>Menunggu Verifikasi</span>
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive border border-destructive/20">
                          <XCircle className="size-3" />
                          <span>Ditolak</span>
                        </span>
                      ) : null}
                    </div>

                    <p className="text-xs text-muted-foreground truncate">
                      a.n. <span className="font-medium text-foreground/90">{acc.accountHolderName}</span>
                    </p>

                    {/* Rejection Note */}
                    {isRejected && acc.rejectionReason ? (
                      <p className="flex items-center gap-1 text-[11px] text-destructive pt-0.5">
                        <AlertCircle className="size-3 shrink-0" />
                        <span>Alasan: {acc.rejectionReason}</span>
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {/* Make Primary CTA */}
                  {isVerified && !acc.isPrimary ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPrimaryMutation.mutate(acc.id)}
                      disabled={setPrimaryMutation.isPending}
                      className="cursor-pointer text-xs h-8 text-muted-foreground hover:text-foreground">
                      <span>Jadikan Utama</span>
                    </Button>
                  ) : null}

                  {/* Delete Action Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingAccountId(acc.id)}
                    disabled={deleteAccountMutation.isPending}
                    className="size-8 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                    aria-label="Hapus rekening">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={Boolean(deletingAccountId)}
        onOpenChange={(open) => !open && setDeletingAccountId(null)}>
        <AlertDialogContent className="rounded-2xl border-border/80 bg-card p-6 shadow-xl max-w-md">
          <AlertDialogHeader className="space-y-2">
            <AlertDialogTitle className="text-base font-semibold text-foreground">
              Hapus Akun Penarikan?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Akun penarikan ini akan dihapus dari daftar tujuan pencairan saldo Anda. Anda dapat mendaftarkannya kembali kapan saja bila diperlukan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel className="cursor-pointer text-xs rounded-xl">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={HandleConfirmDelete}
              className="cursor-pointer text-xs rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus Akun
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Payout Account Dialog */}
      <AddPayoutAccountDialog
        open={isAddAccountDialogOpen}
        onOpenChange={setIsAddAccountDialogOpen}
        existingAccountsCount={accounts.length}
        role="CREATOR"
        onSuccess={() => {
          void refetch();
        }}
      />
    </div>
  );
}
