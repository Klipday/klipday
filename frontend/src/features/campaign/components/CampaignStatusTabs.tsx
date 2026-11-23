import { useSearchParams } from 'react-router';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UseCampaignStatusCountsQuery } from '../hooks';
import { CAMPAIGN_STATUS_TABS } from '../config/status-tabs';

/**
 * Campaign status navigation tabs component.
 * Allows brand users to switch between campaign lifecycle states (Aktif, Menunggu Review,
 * Perlu Revisi, and Selesai) with URL query parameter synchronization (?status=...).
 * Self-contained component that reads and updates the URL and fetches live count badges.
 *
 * @returns The rendered campaign status tabs element.
 */
export function CampaignStatusTabs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: counts } = UseCampaignStatusCountsQuery();

  const urlStatus = searchParams.get('status');
  const validStatusKeys = CAMPAIGN_STATUS_TABS.map((tab) => tab.key);
  const currentStatus = urlStatus && validStatusKeys.includes(urlStatus) ? urlStatus : 'ACTIVE';

  const HandleTabChange = (nextStatus: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('status', nextStatus);
        return next;
      },
      { replace: true }
    );
  };

  return (
    <div className="w-full">
      <Tabs value={currentStatus} onValueChange={HandleTabChange} className="w-full">
        <div className="w-full overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="inline-flex w-max shrink-0 justify-start h-10 items-stretch gap-0 rounded-xl border border-border/60 bg-muted/20 p-0 overflow-hidden divide-x divide-border/40 shadow-xs">
            {CAMPAIGN_STATUS_TABS.map((tab) => {
              const count = counts ? counts[tab.countKey] : 0;
              const isSelected = currentStatus === tab.key;
              const hasWarning = Boolean(tab.alertOnCount && count > 0);

              return (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className={cn(
                    'relative inline-flex shrink-0 flex-none h-full items-center justify-center gap-2 rounded-none px-3.5 sm:px-4 py-2 text-xs font-medium transition-colors sm:text-sm cursor-pointer whitespace-nowrap after:hidden',
                    'first:rounded-l-[11px] last:rounded-r-[11px]',
                    'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                    isSelected ? 'bg-card! text-foreground! font-semibold shadow-xs' : 'bg-transparent',
                    hasWarning && !isSelected && 'text-amber-500 hover:text-amber-400'
                  )}>
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'text-xs tabular-nums transition-colors',
                      hasWarning
                        ? 'text-amber-500 font-medium'
                        : isSelected
                          ? 'text-foreground/80 font-medium'
                          : 'text-muted-foreground'
                    )}>
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
