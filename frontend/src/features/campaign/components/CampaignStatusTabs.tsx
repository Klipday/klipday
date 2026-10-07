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
        <div className="flex items-center overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="inline-flex h-10 items-stretch gap-0 rounded-xl border border-border/60 bg-muted/20 p-0 overflow-hidden divide-x divide-border/40 shadow-xs">
            {CAMPAIGN_STATUS_TABS.map((tab) => {
              const count = counts ? counts[tab.countKey] : 0;
              const isSelected = currentStatus === tab.key;
              const hasWarning = Boolean(tab.alertOnCount && count > 0);

              return (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className={cn(
                    'relative inline-flex h-full items-center justify-center gap-2 rounded-none px-4 py-2 text-xs font-medium transition-colors sm:text-sm cursor-pointer whitespace-nowrap after:hidden',
                    'first:rounded-l-[11px] last:rounded-r-[11px]',
                    'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                    isSelected ? 'bg-card! text-foreground! font-semibold shadow-xs' : 'bg-transparent',
                    hasWarning && !isSelected && 'text-amber-500 hover:text-amber-400'
                  )}>
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none tabular-nums transition-colors',
                      hasWarning
                        ? 'border border-amber-500/40 bg-amber-500/20 text-amber-500 dark:text-amber-400 font-bold'
                        : isSelected
                          ? 'bg-primary/15 text-primary'
                          : 'bg-muted/80 text-muted-foreground'
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
