import { useEffect, useState } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UseCampaignSubmissionsQuery } from '@/features/submission/hooks';
import type { SubmissionSortOption, SubmissionStatus } from '@/features/submission/types';
import { cn } from '@/lib/utils';
import type { CampaignDetailBrandSubmissionsProps } from '../types';
import { CampaignDetailBrandSubmissionCard } from './CampaignDetailBrandSubmissionCard';
import { CampaignDetailBrandSubmissionsEmpty } from './CampaignDetailBrandSubmissionsEmpty';
import { CampaignDetailBrandSubmissionsPagination } from './CampaignDetailBrandSubmissionsPagination';
import { CampaignDetailBrandSubmissionsSkeleton } from './CampaignDetailBrandSubmissionsSkeleton';
import { CampaignDetailBrandSubmissionsToolbar } from './CampaignDetailBrandSubmissionsToolbar';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

/**
 * Brand campaign submissions tab orchestrator.
 * Connects to `GetCampaignSubmissions` API, manages search/filter/sort/pagination state,
 * and renders the 1-row submission cards list for brand owners.
 *
 * @param props - Component configuration containing campaignId.
 * @returns The rendered brand submissions review tab.
 */
export function CampaignDetailBrandSubmissions({
  campaignId,
  className,
}: CampaignDetailBrandSubmissionsProps) {
  const [page, setPage] = useState<number>(DEFAULT_PAGE);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [status, setStatus] = useState<SubmissionStatus | 'ALL'>('ALL');
  const [sort, setSort] = useState<SubmissionSortOption>('latest');

  // Debounce search term by 300ms to prevent query flooding
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(DEFAULT_PAGE);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const HandleStatusChange = (newStatus: SubmissionStatus | 'ALL') => {
    setStatus(newStatus);
    setPage(DEFAULT_PAGE);
  };

  const HandleSortChange = (newSort: SubmissionSortOption) => {
    setSort(newSort);
    setPage(DEFAULT_PAGE);
  };

  const HandleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setStatus('ALL');
    setSort('latest');
    setPage(DEFAULT_PAGE);
  };

  const hasActiveFilters = Boolean(searchTerm.trim() || status !== 'ALL' || sort !== 'latest');

  const { data, isLoading, isError, error, refetch } = UseCampaignSubmissionsQuery(
    campaignId,
    {
      page,
      limit: DEFAULT_LIMIT,
      search: debouncedSearch.trim() || undefined,
      status: status !== 'ALL' ? status : undefined,
      sort,
    },
  );

  const items = data?.items || [];
  const pagination = data?.pagination;
  const totalItems = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;

  const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat daftar pengajuan.';

  return (
    <div className={cn('space-y-6', className)}>
      {/* Top Search, Status, and Sort Toolbar */}
      <CampaignDetailBrandSubmissionsToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        status={status}
        onStatusChange={HandleStatusChange}
        sort={sort}
        onSortChange={HandleSortChange}
        onResetFilters={HandleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Loading Skeleton State */}
      {isLoading && <CampaignDetailBrandSubmissionsSkeleton />}

      {/* Error Recovery State */}
      {!isLoading && isError && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
            <AlertCircle className="size-5" />
          </div>
          <div className="max-w-md space-y-1">
            <h4 className="text-sm font-medium text-destructive">Gagal Memuat Pengajuan</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{errorMessage}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5 text-xs rounded-lg cursor-pointer border-border/60">
            <RotateCcw className="size-3.5" />
            <span>Coba Lagi</span>
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && items.length === 0 && (
        <CampaignDetailBrandSubmissionsEmpty
          hasFilters={hasActiveFilters}
          onResetFilters={HandleResetFilters}
        />
      )}

      {/* Submissions Card List */}
      {!isLoading && !isError && items.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-3.5">
            {items.map((item) => (
              <CampaignDetailBrandSubmissionCard key={item.id} submission={item} />
            ))}
          </div>

          {/* Pagination Controls */}
          <CampaignDetailBrandSubmissionsPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={DEFAULT_LIMIT}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
