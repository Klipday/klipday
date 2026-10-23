import { useEffect, useState } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  CreatorSubmissionRowCard,
  CreatorSubmissionsEmptyState,
  CreatorSubmissionsSkeleton,
  CreatorSubmissionsToolbar,
} from '../components';
import { UseMySubmissionsQuery } from '../hooks';
import type { CreatorSubmissionsPageProps, SubmissionStatus } from '../types';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 15;

/**
 * Pure orchestrator page for Creator Submissions workspace.
 * Displays a clean, noise-free, 1-row card list of all campaign videos submitted by the creator.
 *
 * @param props - Component configuration containing optional className.
 * @returns Rendered Creator Submissions page.
 */
export default function CreatorSubmissionsPage({ className }: CreatorSubmissionsPageProps) {
  const [page, setPage] = useState<number>(DEFAULT_PAGE);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [status, setStatus] = useState<SubmissionStatus | 'ALL'>('ALL');

  // Debounce search input by 300ms to avoid flooding queries
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

  const HandleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const HandleResetSearch = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setPage(DEFAULT_PAGE);
  };

  const HandleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setStatus('ALL');
    setPage(DEFAULT_PAGE);
  };

  const hasFilters = Boolean(searchTerm.trim() || status !== 'ALL');

  const { data, isLoading, isError, error, refetch } = UseMySubmissionsQuery({
    page,
    limit: DEFAULT_LIMIT,
    status: status !== 'ALL' ? status : undefined,
    search: debouncedSearch.trim() || undefined,
    sort: 'latest',
  });

  const items = data?.items || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  const errorMessage =
    error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat daftar submisi.';

  return (
    <div className={cn('space-y-6 pb-12', className)}>
      {/* Clean Workspace Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Submisi Video
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
          Daftar seluruh video klip kampanye yang telah kamu kirimkan. Pantau status kurasi brand, perbaiki video jika ada catatan revisi, dan lacak akumulasi tayangan.
        </p>
      </div>

      {/* Minimalist Toolbar: Status Filter Tabs + Search */}
      <CreatorSubmissionsToolbar
        searchTerm={searchTerm}
        status={status}
        counts={data?.counts}
        onSearchChange={HandleSearchChange}
        onResetSearch={HandleResetSearch}
        onStatusChange={HandleStatusChange}
      />

      {/* Main Content Area */}
      {isLoading ? (
        <CreatorSubmissionsSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3">
          <AlertCircle className="size-5 text-destructive" />
          <p className="text-xs text-destructive font-medium">{errorMessage}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            className="gap-1.5 rounded-xl text-xs h-8 cursor-pointer">
            <RotateCcw className="size-3.5" />
            <span>Coba Lagi</span>
          </Button>
        </div>
      ) : items.length === 0 ? (
        <CreatorSubmissionsEmptyState
          hasFilters={hasFilters}
          onResetFilters={HandleResetFilters}
        />
      ) : (
        <div className="space-y-3">
          {items.map((sub) => (
            <CreatorSubmissionRowCard key={sub.id} submission={sub} />
          ))}
        </div>
      )}

      {/* Simple Pagination Footer if > 1 page */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <span>
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 rounded-xl text-xs px-3 cursor-pointer">
              Sebelumnya
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 rounded-xl text-xs px-3 cursor-pointer">
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
