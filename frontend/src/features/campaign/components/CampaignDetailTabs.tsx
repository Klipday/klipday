import { cn } from '@/lib/utils';
import type { CampaignDetailTabsProps } from '../types';

/**
 * Segmented navigation tabs for the campaign detail page.
 * Displays "Detail" as the primary tab across all roles.
 * Contextually displays secondary tabs based on authenticated role:
 * - CREATOR: "Detail" and "Video Kamu" (progress of clipper's submitted video).
 * - BRAND: "Detail" and "Pengajuan Klip" (submissions received from clippers).
 * - ADMIN: "Detail", "Pengajuan Klip", and "Video Kamu".
 *
 * Implements a modern hairline underline indicator matching clippo and konten.com patterns.
 *
 * @param props - Component properties with activeTab, onTabChange callback, and userRole.
 * @returns The rendered campaign detail tab bar element.
 */
export function CampaignDetailTabs({ activeTab, onTabChange, userRole, className }: CampaignDetailTabsProps) {
  const tabs = [{ key: 'detail', label: 'Detail' }];

  if (userRole === 'CREATOR') {
    tabs.push({ key: 'my-videos', label: 'Video Kamu' });
  } else if (userRole === 'BRAND') {
    tabs.push({ key: 'submissions', label: 'Pengajuan Klip' });
  } else if (userRole === 'ADMIN') {
    tabs.push({ key: 'admin-submissions', label: 'Pengajuan Klip' });
  }

  return (
    <div className={cn('w-full border-b border-border/40', className)}>
      <nav className="flex space-x-6 sm:space-x-8" aria-label="Campaign Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={cn(
                'relative py-3.5 text-sm font-medium transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                isActive ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
              )}>
              {tab.label}
              {isActive && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary rounded-full transition-all" />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
