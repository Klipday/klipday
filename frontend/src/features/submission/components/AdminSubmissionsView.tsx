import { AdminCampaignSettlementView } from '@/features/admin/components';
import { cn } from '@/lib/utils';
import type { AdminSubmissionsViewProps } from '../types';

/**
 * Admin campaign settlement & FIFO submissions tab view.
 * Renders the 4-column Settlement Ledger Bar, FIFO submission queue,
 * and Disqualification Reshuffle controls for platform administrators.
 *
 * @param props - Component properties containing campaignId and className.
 * @returns The rendered admin settlement & submissions view.
 */
export function AdminSubmissionsView({ campaignId, className }: AdminSubmissionsViewProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <AdminCampaignSettlementView campaignId={campaignId} />
    </div>
  );
}

export { AdminSubmissionsView as CampaignDetailAdminSubmissions };
