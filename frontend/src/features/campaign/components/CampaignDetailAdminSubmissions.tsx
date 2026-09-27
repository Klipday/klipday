import { ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CampaignDetailAdminSubmissionsProps } from '../types';
import { CampaignDetailBrandSubmissions } from './CampaignDetailBrandSubmissions';

/**
 * Admin campaign submissions tab view.
 * Dedicated view for platform administrators to inspect all submissions for a campaign.
 *
 * @param props - Component properties containing campaignId and className.
 * @returns The rendered admin submissions view.
 */
export function CampaignDetailAdminSubmissions({ campaignId, className }: CampaignDetailAdminSubmissionsProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/40 bg-muted/20 text-xs text-muted-foreground">
        <ShieldAlert className="size-4 text-primary shrink-0" />
        <span>Mode Tinjauan Administrator: Anda dapat melihat seluruh pengajuan video untuk kampanye ini.</span>
      </div>

      <CampaignDetailBrandSubmissions campaignId={campaignId} />
    </div>
  );
}
