import { CloseIcon, MagnifierIcon, RestartIcon } from '@solar-icons/react/linear';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { UseCampaignFilters } from '../hooks';
import type { CampaignFiltersToolbarProps } from '../types';
import {
  FILTER_CAMPAIGN_TYPE_OPTIONS,
  FILTER_CATEGORY_OPTIONS,
  FILTER_SORT_OPTIONS,
} from '../utils';
import { CampaignFilterSelect } from './CampaignFilterSelect';

/**
 * Search, sort, and filter toolbar for the campaign catalog.
 * Synchronizes search keywords, category, campaign type, and sort strategy
 * with URL search parameters while preserving external parameters (e.g. status).
 *
 * @param props - Toolbar configuration properties.
 * @returns The rendered filters toolbar element.
 */
export function CampaignFiltersToolbar({
  className,
  placeholder = 'Cari campaign atau brand...',
  showSort = true,
}: CampaignFiltersToolbarProps) {
  const {
    searchTerm,
    category,
    campaignType,
    sort,
    hasActiveFilters,
    HandleSearchChange,
    HandleSearchKeyDown,
    ClearSearch,
    UpdateParam,
    ResetFilters,
  } = UseCampaignFilters();

  /**
   * Handles category filter selection change.
   *
   * @param value - Selected category identifier.
   */
  const HandleCategoryChange = (value: string) => {
    UpdateParam('category', value);
  };

  /**
   * Handles campaign type filter selection change.
   *
   * @param value - Selected campaign type identifier.
   */
  const HandleCampaignTypeChange = (value: string) => {
    UpdateParam('campaignType', value);
  };

  /**
   * Handles sort strategy selection change.
   *
   * @param value - Selected sort strategy identifier.
   */
  const HandleSortChange = (value: string) => {
    UpdateParam('sort', value);
  };

  return (
    <div className={cn('flex flex-col gap-3 md:flex-row md:items-center md:justify-between w-full', className)}>
      {/* Search Bar with Leading Icon and Clear Button */}
      <div className="relative w-full md:w-72 md:shrink-0">
        <MagnifierIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
        <Input
          type="text"
          value={searchTerm}
          onChange={HandleSearchChange}
          onKeyDown={HandleSearchKeyDown}
          placeholder={placeholder}
          className="h-9 w-full pl-9 pr-8 rounded-xl bg-zinc-900/90 hover:bg-zinc-900 border border-border/40 hover:border-border/60 text-zinc-100 placeholder:text-zinc-400 focus-visible:border-zinc-500 focus-visible:ring-0 text-sm shadow-none transition-colors"
        />
        {searchTerm ? (
          <button
            type="button"
            onClick={ClearSearch}
            aria-label="Hapus pencarian"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer transition-colors">
            <CloseIcon className="size-3.5" />
          </button>
        ) : null}
      </div>

      {/* Filter and Sort Dropdowns */}
      <div className="flex flex-wrap items-center gap-2 md:shrink-0">
        <CampaignFilterSelect
          value={category}
          placeholder="Kategori"
          options={FILTER_CATEGORY_OPTIONS}
          onValueChange={HandleCategoryChange}
          className="min-w-[130px]"
          contentClassName="max-h-72"
        />

        <CampaignFilterSelect
          value={campaignType}
          placeholder="Tipe"
          options={FILTER_CAMPAIGN_TYPE_OPTIONS}
          onValueChange={HandleCampaignTypeChange}
          className="min-w-[110px]"
        />

        {showSort ? (
          <CampaignFilterSelect
            value={sort}
            placeholder="Urutkan"
            options={FILTER_SORT_OPTIONS}
            onValueChange={HandleSortChange}
            className="min-w-[125px]"
          />
        ) : null}

        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={ResetFilters}
            className="h-9 gap-1.5 px-3 rounded-xl bg-zinc-900/70 hover:bg-zinc-800 border border-border/40 hover:border-border/60 text-xs font-medium text-zinc-300 hover:text-white cursor-pointer transition-colors shadow-none">
            <RestartIcon className="size-3.5" />
            <span>Reset</span>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
