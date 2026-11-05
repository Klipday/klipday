import { Button } from '@/components/ui/button';
import type { AdminKycEmptyStateProps } from '../types';
import { GetKycRoleLabel } from '../utils/formatters';

/**
 * Contextual empty state card for the Admin KYC verification queue.
 *
 * @param props - Component props containing filter, searchQuery, roleFilter, and onResetFilters callback.
 * @returns The rendered empty state card.
 */
export function AdminKycEmptyState({
  filter,
  searchQuery,
  roleFilter,
  page = 1,
  onResetFilters,
}: AdminKycEmptyStateProps) {
  const trimmedSearch = searchQuery.trim();
  const hasFilters =
    filter !== 'PENDING' ||
    roleFilter !== 'ALL' ||
    trimmedSearch.length > 0 ||
    page > 1;

  let descriptionText =
    'Saat ini tidak ada pengajuan verifikasi rekening bank atau e-wallet baru yang perlu diperiksa.';
  if (trimmedSearch.length > 0) {
    descriptionText = `Tidak ditemukan pengajuan rekening KYC yang cocok dengan kata kunci "${trimmedSearch}".`;
  } else if (roleFilter !== 'ALL') {
    const roleLabel = GetKycRoleLabel(roleFilter);
    descriptionText = `Tidak ada pengajuan rekening KYC dari pengguna ${roleLabel} pada kategori ini.`;
  } else if (page > 1) {
    descriptionText = 'Halaman ini sudah tidak memiliki pengajuan rekening KYC.';
  } else if (filter === 'VERIFIED') {
    descriptionText = 'Belum ada rekening bank atau e-wallet pengguna yang terverifikasi.';
  } else if (filter === 'REJECTED') {
    descriptionText = 'Belum ada pengajuan rekening KYC yang ditolak.';
  } else if (filter === 'ALL') {
    descriptionText = 'Belum ada riwayat pengajuan rekening bank atau e-wallet pengguna.';
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-card px-6 py-14 text-center">
      <h3 className="text-sm font-semibold tracking-tight text-foreground">
        Tidak ada pengajuan rekening KYC
      </h3>
      <p className="mt-1.5 max-w-md text-xs text-muted-foreground leading-relaxed">
        {descriptionText}
      </p>
      {hasFilters && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onResetFilters}
          className="mt-4 h-8 text-xs cursor-pointer"
        >
          Reset Filter
        </Button>
      )}
    </div>
  );
}
