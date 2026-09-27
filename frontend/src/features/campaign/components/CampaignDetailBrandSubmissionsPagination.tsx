import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CampaignDetailBrandSubmissionsPaginationProps } from '../types';

/**
 * Pagination navigation bar for brand campaign submissions queue.
 * Displays items range summary and previous/next page navigation buttons.
 *
 * @param props - Pagination state and callback handlers.
 * @returns The rendered pagination controls element.
 */
export function CampaignDetailBrandSubmissionsPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: CampaignDetailBrandSubmissionsPaginationProps) {
  if (totalItems <= 0) {
    return null;
  }

  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  const HandlePrevious = () => {
    if (!isFirstPage) {
      onPageChange(currentPage - 1);
    }
  };

  const HandleNext = () => {
    if (!isLastPage) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border/40',
        className,
      )}>
      {/* Item Range Counter */}
      <p className="text-xs text-muted-foreground">
        Menampilkan <span className="font-medium text-foreground">{startItem}</span>–
        <span className="font-medium text-foreground">{endItem}</span> dari{' '}
        <span className="font-medium text-foreground">{totalItems}</span> pengajuan
      </p>

      {/* Page Navigation Controls */}
      <div className="flex items-center gap-2 self-end sm:self-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={HandlePrevious}
          disabled={isFirstPage}
          className="h-8 gap-1 px-3 text-xs rounded-lg cursor-pointer border-border/60">
          <ChevronLeft className="size-3.5" />
          <span>Sebelumnya</span>
        </Button>

        <span className="px-2 text-xs font-medium text-muted-foreground tabular-nums">
          {currentPage} / {totalPages}
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={HandleNext}
          disabled={isLastPage}
          className="h-8 gap-1 px-3 text-xs rounded-lg cursor-pointer border-border/60">
          <span>Selanjutnya</span>
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
