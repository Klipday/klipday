import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CONTENT_CATEGORY_OPTIONS, CREATOR_LIMITS, CREATOR_UI_MESSAGES } from '../constants';
import type { CreatorCategory, CreatorCategoryPickerProps } from '../types';

/**
 * Chip-based category selector for creator content niches (1–3 picks allowed).
 *
 * @param props - Selected categories array, change handler callback, disabled status, and optional className.
 * @returns The rendered category picker element.
 */
export function CreatorCategoryPicker({
  selectedCategories,
  onChange,
  disabled = false,
  className,
}: CreatorCategoryPickerProps) {
  const HandleToggle = (categoryValue: CreatorCategory) => {
    if (disabled) {
      return;
    }

    const isSelected = selectedCategories.includes(categoryValue);

    if (isSelected) {
      const nextCategories = selectedCategories.filter((val) => val !== categoryValue);
      onChange(nextCategories);
      return;
    }

    if (selectedCategories.length >= CREATOR_LIMITS.MAX_CATEGORIES) {
      toast.info(CREATOR_UI_MESSAGES.CATEGORY_MAX_REACHED);
      return;
    }

    const nextCategories = [...selectedCategories, categoryValue];
    onChange(nextCategories);
  };

  return (
    <div className={cn('space-y-2.5', className)}>
      <div className="flex flex-wrap gap-2">
        {CONTENT_CATEGORY_OPTIONS.map((option) => {
          const categoryValue = option.value as CreatorCategory;
          const isSelected = selectedCategories.includes(categoryValue);

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => HandleToggle(categoryValue)}
              className={cn(
                'inline-flex items-center rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer select-none',
                isSelected
                  ? 'border-primary/50 bg-primary/10 text-primary font-semibold shadow-2xs'
                  : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                disabled && 'pointer-events-none opacity-50 cursor-not-allowed',
              )}>
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Terpilih: {selectedCategories.length} dari maksimal {CREATOR_LIMITS.MAX_CATEGORIES} kategori niche.
      </p>
    </div>
  );
}
