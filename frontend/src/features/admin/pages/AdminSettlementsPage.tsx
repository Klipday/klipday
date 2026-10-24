import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { Input } from '@/components/ui/input';
import {
  AdminSettlementCard,
  AdminSettlementsEmptyState,
  AdminSettlementsErrorState,
  AdminSettlementsSkeleton,
  AdminSettlementTabs,
} from '../components';
import { UseAdminSettlementCampaignsQuery } from '../hooks';
import type { SettlementFilterOption } from '../types';
import { VALID_SETTLEMENT_FILTER_KEYS } from '../utils/formatters';

/**
 * Admin Campaign Settlement queue page (`/admin-dashboard/settlements`).
 * Pure page orchestrator that composes segmented filter tabs, left-aligned search bar,
 * and the campaign settlement card grid.
 *
 * @returns The rendered Admin Settlements page.
 */
export default function AdminSettlementsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');

  const rawFilter = searchParams.get('filter') as SettlementFilterOption | null;
  const activeFilter: SettlementFilterOption =
    rawFilter && VALID_SETTLEMENT_FILTER_KEYS.includes(rawFilter)
      ? rawFilter
      : 'NEED_SETTLEMENT';

  const { data, isLoading, isError, error, refetch } = UseAdminSettlementCampaignsQuery({
    filter: activeFilter,
    search: searchInput.trim() || undefined,
    page: 1,
    limit: 24,
  });

  const HandleResetFilters = () => {
    setSearchInput('');
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('filter', 'NEED_SETTLEMENT');
        next.delete('page');
        return next;
      },
      { replace: true },
    );
  };

  const items = data?.items ?? [];
  const errorMessage =
    error instanceof Error
      ? error.message
      : 'Gagal memuat daftar kampanye settlement.';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Verifikasi & Settlement
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Tinjau kampanye yang telah berakhir atau mencapai 100% batas anggaran sebelum
          pencairan reward ke kreator dan pengembalian sisa saldo ke brand.
        </p>
      </div>

      {/* Left-Aligned Segmented Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <AdminSettlementTabs counts={data?.counts} />

        <div className="relative w-full sm:w-80 md:w-96">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari judul kampanye atau nama brand..."
            className="h-9 w-full pl-9 pr-8 rounded-xl bg-card border-border/60 text-xs sm:text-sm shadow-none"
          />
          {searchInput.length > 0 && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              aria-label="Hapus pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <AdminSettlementsSkeleton count={6} />
      ) : isError ? (
        <AdminSettlementsErrorState
          message={errorMessage}
          onRetry={() => refetch()}
        />
      ) : items.length === 0 ? (
        <AdminSettlementsEmptyState
          activeFilter={activeFilter}
          searchQuery={searchInput}
          onResetFilters={HandleResetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((campaign) => (
            <AdminSettlementCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
