import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AdminModerationCampaignCard,
  AdminModerationEmptyState,
  AdminModerationSkeleton,
  AdminModerationTabs,
} from '../components';
import { UseAdminModerationCampaignsQuery } from '../hooks';
import type { ModerationFilterOption } from '../types';
import { VALID_MODERATION_FILTER_KEYS } from '../utils/formatters';

/**
 * Admin Campaign Moderation Queue page (`/admin-dashboard/campaigns`).
 * Houses the segmented moderation status tabs, left-aligned search bar,
 * and the campaign moderation card grid.
 *
 * @returns The rendered Admin Campaigns moderation page.
 */
export default function AdminCampaignsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const rawFilter = searchParams.get('filter') as ModerationFilterOption | null;
  const activeFilter: ModerationFilterOption =
    rawFilter && VALID_MODERATION_FILTER_KEYS.includes(rawFilter)
      ? rawFilter
      : 'IN_REVIEW';

  const { data, isLoading, isError, error, refetch } = UseAdminModerationCampaignsQuery({
    filter: activeFilter,
    search: debouncedSearch.trim() || undefined,
    page: 1,
    limit: 24,
  });

  const HandleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('filter', 'IN_REVIEW');
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
      : 'Gagal memuat daftar antrean moderasi kampanye.';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Moderasi Kampanye
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Tinjau pengajuan kampanye baru dari brand, verifikasi pembayaran, dan periksa
          kelengkapan materi sebelum ditayangkan ke kreator.
        </p>
      </div>

      {/* Left-Aligned Segmented Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <AdminModerationTabs counts={data?.counts} />

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
              onClick={() => {
                setSearchInput('');
                setDebouncedSearch('');
              }}
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
        <AdminModerationSkeleton count={6} />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-destructive">{errorMessage}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="mt-4 text-xs cursor-pointer"
          >
            Coba Lagi
          </Button>
        </div>
      ) : items.length === 0 ? (
        <AdminModerationEmptyState
          activeFilter={activeFilter}
          searchQuery={debouncedSearch}
          onResetFilters={HandleResetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((campaign) => (
            <AdminModerationCampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
