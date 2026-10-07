import { useEffect, useState } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UseCampaignSubmissionsQuery } from '../hooks';
import type {
  BrandSubmissionsViewProps,
  CampaignSubmissionReviewItem,
  SubmissionSortOption,
  SubmissionStatus,
} from '../types';
import { BrandSubmissionCard } from './BrandSubmissionCard';
import { BrandSubmissionsEmptyState } from './BrandSubmissionsEmptyState';
import { BrandSubmissionsPagination } from './BrandSubmissionsPagination';
import { BrandSubmissionsSkeleton } from './BrandSubmissionsSkeleton';
import { BrandSubmissionsToolbar } from './BrandSubmissionsToolbar';
import { SubmissionReviewDialog } from './SubmissionReviewDialog';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

/**
 * Brand campaign submissions tab orchestrator.
 * Connects to `GetCampaignSubmissions` API, manages search/filter/sort/pagination state,
 * and renders the submission cards list for brand owners.
 *
 * @param props - Component configuration containing campaignId.
 * @returns The rendered brand submissions review tab.
 */
export function BrandSubmissionsView({
  campaignId,
  className,
}: BrandSubmissionsViewProps) {
  const [page, setPage] = useState<number>(DEFAULT_PAGE);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [status, setStatus] = useState<SubmissionStatus | 'ALL'>('ALL');
  const [sort, setSort] = useState<SubmissionSortOption>('latest');
  const [reviewingSubmission, setReviewingSubmission] = useState<CampaignSubmissionReviewItem | null>(null);

  // Debounce search term by 300ms to prevent query flooding
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch((prev) => {
        if (prev !== searchTerm) {
          setPage(DEFAULT_PAGE);
          return searchTerm;
        }
        return prev;
      });
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
      <BrandSubmissionsToolbar
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
      {isLoading && <BrandSubmissionsSkeleton />}

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
        <BrandSubmissionsEmptyState
          hasFilters={hasActiveFilters}
          onResetFilters={HandleResetFilters}
        />
      )}

      {/* Submissions Card List */}
      {!isLoading && !isError && items.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-3.5">
            {items.map((item) => (
              <BrandSubmissionCard
                key={item.id}
                submission={item}
                onReview={(reviewItem) => setReviewingSubmission(reviewItem)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          <BrandSubmissionsPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={DEFAULT_LIMIT}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Centralized In-Context Review Decision Dialog */}
      {reviewingSubmission && (
        <SubmissionReviewDialog
          open={Boolean(reviewingSubmission)}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setReviewingSubmission(null);
            }
          }}
          submission={reviewingSubmission}
        />
      )}
    </div>
  );
}

export { BrandSubmissionsView as CampaignDetailBrandSubmissions };
