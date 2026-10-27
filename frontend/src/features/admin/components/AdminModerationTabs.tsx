import { useSearchParams } from 'react-router';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { AdminModerationTabsProps, ModerationFilterOption } from '../types';
import {
  ADMIN_MODERATION_TABS,
  VALID_MODERATION_FILTER_KEYS,
} from '../utils/formatters';

/**
 * Edge-to-edge segmented filter tabs for the Admin Campaign Moderation queue page.
 * Synchronizes active filter with the `?filter=` URL search parameter.
 *
 * @param props - Component props containing tab counts and optional className.
 * @returns The rendered segmented tabs bar.
 */
export function AdminModerationTabs({ counts, className }: AdminModerationTabsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawFilter = searchParams.get('filter') as ModerationFilterOption | null;
  const activeFilter: ModerationFilterOption =
    rawFilter && VALID_MODERATION_FILTER_KEYS.includes(rawFilter)
      ? rawFilter
      : 'IN_REVIEW';

  const HandleTabChange = (nextFilter: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('filter', nextFilter);
        next.delete('page');
        return next;
      },
      { replace: true },
    );
  };

  return (
    <div className={cn('w-full sm:w-auto', className)}>
      <Tabs value={activeFilter} onValueChange={HandleTabChange} className="w-full">
        <div className="flex items-center overflow-x-auto pb-1 sm:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="inline-flex h-9 items-stretch gap-0 rounded-lg border border-border/60 bg-card p-0 overflow-hidden divide-x divide-border/50">
            {ADMIN_MODERATION_TABS.map((tab) => {
              const count = counts ? counts[tab.countKey] : 0;
              const isSelected = activeFilter === tab.key;

              return (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className={cn(
                    'relative inline-flex h-full items-center justify-center gap-2 rounded-none px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap after:hidden',
                    'first:rounded-l-[7px] last:rounded-r-[7px]',
                    'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                    isSelected
                      ? 'bg-muted/70! text-foreground! font-semibold'
                      : 'bg-transparent',
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 font-mono text-[11px] font-medium leading-none tabular-nums transition-colors',
                      isSelected
                        ? 'bg-foreground/10 text-foreground'
                        : 'bg-muted/70 text-muted-foreground',
                    )}
                  >
                    {count}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
      </Tabs>
    </div>
  );
}
