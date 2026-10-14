import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { CREATOR_WALLET_TRANSACTION_TABS } from '../constants';
import type { CreatorTransactionTypeFilterProps } from '../types';

/**
 * Filter tabs for creator mutation history with edge-to-edge segmented styling.
 * Allows switching between Semua Mutasi, Pendapatan Video, and Penarikan Saldo.
 *
 * @param props - Component properties.
 * @returns Rendered segmented control element.
 */
export function CreatorTransactionTypeFilter({
  activeType,
  onTypeChange,
  className,
}: CreatorTransactionTypeFilterProps) {
  const HandleValueChange = (nextValue: string) => {
    onTypeChange(nextValue as 'ALL' | 'CAMPAIGN_EARNING' | 'WITHDRAWAL');
  };

  return (
    <div
      className={cn(
        'w-full overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}>
      <Tabs value={activeType} onValueChange={HandleValueChange} className="w-auto">
        <TabsList className="inline-flex h-10 items-stretch gap-0 rounded-xl border border-border/60 bg-muted/20 p-0 overflow-hidden divide-x divide-border/40 shadow-xs">
          {CREATOR_WALLET_TRANSACTION_TABS.map((tab) => {
            const isSelected = activeType === tab.key;

            return (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className={cn(
                  'relative inline-flex h-full items-center justify-center gap-2 rounded-none px-4 py-2 text-xs font-medium transition-colors sm:text-sm cursor-pointer whitespace-nowrap after:hidden',
                  'first:rounded-l-[11px] last:rounded-r-[11px]',
                  'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                  isSelected
                    ? 'bg-card! text-foreground! font-semibold shadow-xs'
                    : 'bg-transparent',
                )}>
                <span>{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}
