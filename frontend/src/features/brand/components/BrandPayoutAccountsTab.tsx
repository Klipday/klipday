import { AddIcon } from '@solar-icons/react/linear';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BRAND_LIMITS } from '../constants';
import {
  UseDeleteBrandPayoutAccountMutation,
  UseSetPrimaryBrandPayoutAccountMutation,
} from '../hooks';
import type { BrandPayoutAccountsTabProps } from '../types';
import { PayoutAccountCard } from './PayoutAccountCard';

/**
 * Tab view managing the brand's verified payout accounts (KYC),
 * displaying registered bank accounts and e-wallets, verification statuses,
 * and entry point for registering new accounts.
 *
 * @param props - Component properties.
 * @returns The rendered payout accounts tab element.
 */
export function BrandPayoutAccountsTab({
  accounts,
  isLoading,
  onAddAccountClick,
}: BrandPayoutAccountsTabProps) {
  const setPrimaryMutation = UseSetPrimaryBrandPayoutAccountMutation();
  const deleteMutation = UseDeleteBrandPayoutAccountMutation();

  const isLimitReached = accounts.length >= BRAND_LIMITS.MAX_PAYOUT_ACCOUNTS;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Akun Penarikan Saldo
            </h2>
            <span className="inline-flex shrink-0 items-center rounded-full bg-muted/60 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground whitespace-nowrap">
              {accounts.length} / {BRAND_LIMITS.MAX_PAYOUT_ACCOUNTS} Akun
            </span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Daftarkan hingga 3 rekening bank atau e-wallet untuk keperluan pencairan saldo dompet brand Anda.
          </p>
        </div>

        <Button
          type="button"
          onClick={onAddAccountClick}
          disabled={isLimitReached}
          className="w-full sm:w-auto cursor-pointer font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs text-xs shrink-0">
          <AddIcon className="mr-1.5 size-4" />
          <span>Tambah Akun Baru</span>
        </Button>
      </div>

      {/* KYC Compliance Info Notice (Calm neutral callout, no decorative icon gutter) */}
      <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 sm:p-4 text-xs space-y-1">
        <p className="font-semibold text-foreground">
          Verifikasi Rekening & Kepatuhan KYC
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Demi keamanan dana dan kepatuhan regulasi finansial, setiap rekening yang baru ditambahkan akan diverifikasi oleh Admin Klipday dalam 1x24 jam kerja sebelum dapat digunakan untuk penarikan saldo aktif.
        </p>
      </div>

      {/* Accounts List / Empty State */}
      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 px-4 py-8 sm:p-10 text-center">
          <h3 className="text-sm font-semibold text-foreground">
            Belum Ada Akun Penarikan Terdaftar
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1.5 leading-relaxed">
            Anda belum mendaftarkan rekening bank atau e-wallet. Tambahkan akun penarikan sekarang agar saldo dompet Anda dapat ditarik sewaktu-waktu.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={onAddAccountClick}
            className="mt-4 cursor-pointer font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs text-xs">
            <AddIcon className="mr-1.5 size-3.5" />
            <span>Tambah Akun Penarikan</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {accounts.map((account) => (
            <PayoutAccountCard
              key={account.id}
              account={account}
              onSetPrimary={(id) => setPrimaryMutation.mutate(id)}
              onDelete={(id, isPendingCancel) => deleteMutation.mutate({ id, isPendingCancel })}
              isSettingPrimary={setPrimaryMutation.isPending}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
