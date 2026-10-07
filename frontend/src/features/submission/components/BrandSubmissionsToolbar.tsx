import { RotateCcw, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type {
  BrandSubmissionsToolbarProps,
  SortFilterOption,
  StatusFilterOption,
  SubmissionSortOption,
  SubmissionStatus,
} from '../types';

const STATUS_FILTER_OPTIONS: StatusFilterOption[] = [
  { value: 'ALL', label: 'Semua Status' },
  { value: 'PENDING_REVIEW', label: 'Menunggu Review' },
  { value: 'APPROVED', label: 'Disetujui' },
  { value: 'REVISION_REQUESTED', label: 'Perlu Revisi' },
  { value: 'REJECTED', label: 'Ditolak' },
];

const SORT_OPTIONS: SortFilterOption[] = [
  { value: 'latest', label: 'Terbaru' },
  { value: 'oldest', label: 'Terlama' },
  { value: 'views_desc', label: 'Views Tertinggi' },
  { value: 'views_asc', label: 'Views Terendah' },
];

/**
 * Filter toolbar for brand campaign submissions review tab.
 * Provides search keyword input, review status filter, and view/time sort controls.
 *
 * @param props - Component configuration properties including values and change callbacks.
 * @returns The rendered submissions filter toolbar element.
 */
export function BrandSubmissionsToolbar({
  searchTerm,
  onSearchChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  onResetFilters,
  hasActiveFilters,
  className,
}: BrandSubmissionsToolbarProps) {
  const HandleStatusSelect = (value: string) => {
    onStatusChange(value as SubmissionStatus | 'ALL');
  };

  const HandleSortSelect = (value: string) => {
    onSortChange(value as SubmissionSortOption);
  };

  const HandleClearSearch = () => {
    onSearchChange('');
  };

  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full', className)}>
      {/* Search Input with Leading Icon and Clear Action */}
      <div className="relative w-full sm:w-72 md:w-80 sm:shrink-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari kreator, username, atau caption..."
          className="h-9 w-full pl-9 pr-8 rounded-xl bg-card border-border/60 text-foreground placeholder:text-muted-foreground text-xs focus-visible:ring-1 focus-visible:ring-primary/40 shadow-none transition-colors"
        />
        {searchTerm ? (
          <button
            type="button"
            onClick={HandleClearSearch}
            aria-label="Hapus pencarian"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors">
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      {/* Status & Sort Dropdowns + Optional Reset Button */}
      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
        {/* Status Filter */}
        <Select value={status} onValueChange={HandleStatusSelect}>
          <SelectTrigger className="h-9 w-auto min-w-[140px] rounded-xl border-border/60 bg-card text-xs font-medium text-foreground cursor-pointer">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/60 bg-popover text-popover-foreground shadow-lg">
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="text-xs cursor-pointer">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Filter */}
        <Select value={sort} onValueChange={HandleSortSelect}>
          <SelectTrigger className="h-9 w-auto min-w-[130px] rounded-xl border-border/60 bg-card text-xs font-medium text-foreground cursor-pointer">
            <SelectValue placeholder="Urutkan" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/60 bg-popover text-popover-foreground shadow-lg">
            {SORT_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="text-xs cursor-pointer">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-9 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer rounded-xl">
            <RotateCcw className="size-3.5" />
            <span>Reset</span>
          </Button>
        )}
      </div>
    </div>
  );
}

export { BrandSubmissionsToolbar as CampaignDetailBrandSubmissionsToolbar };
