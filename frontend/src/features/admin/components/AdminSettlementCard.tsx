import { useNavigate } from 'react-router';
import { cn } from '@/lib/utils';
import type { AdminSettlementCardProps } from '../types';
import {
  FormatCompactViews,
  FormatRupiah,
  GetFreezeReasonLabel,
} from '../utils/formatters';

/**
 * Minimalist campaign settlement card for the Admin Settlement queue.
 * Uses pure typographic hierarchy without pill badges, bullet points, or neon amount colors.
 * Clicking navigates directly to `/campaigns/:id?tab=admin-submissions`.
 *
 * @param props - Component props containing the settlement campaign card DTO.
 * @returns The rendered campaign settlement card.
 */
export function AdminSettlementCard({ campaign }: AdminSettlementCardProps) {
  const navigate = useNavigate();

  const burnRatio =
    campaign.budget > 0
      ? Math.min(100, Math.round((campaign.allocatedEarnings / campaign.budget) * 100))
      : 0;

  const isBudgetFull = campaign.freezeReason === 'BUDGET_FULL' || burnRatio >= 100;
  const isFinished = campaign.campaignStatus === 'FINISHED';

  const activeClipCount = isFinished
    ? campaign.verifiedSubmissionsCount
    : campaign.approvedSubmissionsCount;

  const statusTextClassName = isFinished
    ? 'text-foreground'
    : isBudgetFull
      ? 'text-amber-500'
      : 'text-muted-foreground';

  const HandleNavigateToDetail = () => {
    navigate(`/campaigns/${campaign.id}?tab=admin-submissions`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={HandleNavigateToDetail}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          HandleNavigateToDetail();
        }
      }}
      className={cn(
        'group flex flex-col justify-between rounded-xl border border-border/60 bg-card p-5 text-left transition-colors',
        'hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer',
      )}
    >
      <div className="space-y-4">
        {/* Top Row: Brand Name & Plain Status Text */}
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-medium text-muted-foreground">
            {campaign.brand.companyName}
          </span>
          <span className={cn('shrink-0 text-xs font-medium', statusTextClassName)}>
            {GetFreezeReasonLabel(campaign.freezeReason)}
          </span>
        </div>

        {/* Campaign Title & CPM Rule */}
        <div className="space-y-1">
          <h3 className="line-clamp-1 text-[15px] font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
            {campaign.title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground tabular-nums">
            <span>CPM {FormatRupiah(campaign.cpm)} / 1K</span>
            <span>Min. {FormatCompactViews(campaign.minViews)} views</span>
          </div>
        </div>

        {/* Anggaran Terpakai Progress */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">Anggaran Terpakai</span>
            <span className="font-medium text-foreground tabular-nums">
              {FormatRupiah(campaign.allocatedEarnings)} / {FormatRupiah(campaign.budget)}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                isFinished
                  ? 'bg-emerald-500'
                  : isBudgetFull
                    ? 'bg-primary'
                    : 'bg-foreground/80',
              )}
              style={{ width: `${burnRatio}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer: Submissions & Remaining Refund */}
      <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
        <span>
          {activeClipCount} Video {isFinished ? 'Terverifikasi' : 'Disetujui'}
        </span>
        <span className="font-medium text-foreground tabular-nums">
          {campaign.remainingRefund > 0
            ? `Sisa ${FormatRupiah(campaign.remainingRefund)}`
            : 'Penuh (Sisa Rp 0)'}
        </span>
      </div>
    </div>
  );
}
