import { useNavigate } from 'react-router';
import {
  GetCampaignCategoryBadgeLabel,
  GetCampaignTypeBadgeLabel,
} from '@/features/campaign/utils/campaign-card';
import { cn } from '@/lib/utils';
import type { AdminModerationCampaignCardProps } from '../types';
import { FormatRupiah } from '../utils/formatters';

/**
 * Formats start and end dates into a concise Indonesian range (e.g. `28 Okt – 15 Nov 2026`).
 *
 * @param startIso - Start date ISO string or null.
 * @param endIso - End date ISO string or null.
 * @returns Formatted date range string.
 */
function FormatCampaignDateRange(startIso: string | null, endIso: string | null): string {
  if (!startIso && !endIso) {
    return 'Jadwal Fleksibel';
  }

  const formatter = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const startFormatted = startIso ? formatter.format(new Date(startIso)) : null;
  const endFormatted = endIso ? formatter.format(new Date(endIso)) : null;

  if (startFormatted && endFormatted) {
    return `${startFormatted} – ${endFormatted}`;
  }
  return startFormatted || endFormatted || '-';
}

/**
 * Minimalist campaign moderation queue card.
 * Displays brand name, plain status text, campaign title, metadata, and metrics
 * without bordered pills or bullet separators.
 *
 * @param props - Component props containing campaign data.
 * @returns The rendered moderation card.
 */
export function AdminModerationCampaignCard({ campaign }: AdminModerationCampaignCardProps) {
  const navigate = useNavigate();

  const isWallet = campaign.payment?.isWalletPayment;
  const paymentStatus = campaign.payment?.paymentStatus;
  const campaignStatus = campaign.campaignStatus;

  let statusText = 'Dompet (Lunas)';
  let statusTextClass = 'text-foreground';

  if (campaignStatus === 'REJECTED') {
    statusText = 'Ditolak';
    statusTextClass = 'text-destructive';
  } else if (campaignStatus === 'REVISION') {
    statusText = 'Perlu Revisi';
    statusTextClass = 'text-amber-500';
  } else if (isWallet || paymentStatus === 'APPROVED') {
    statusText = isWallet ? 'Dompet (Lunas)' : 'Transfer (Lunas)';
    statusTextClass = 'text-foreground';
  } else if (paymentStatus === 'SUBMITTED') {
    statusText = 'Cek Bukti Transfer';
    statusTextClass = 'text-amber-500';
  } else {
    statusText = 'Menunggu Pembayaran';
    statusTextClass = 'text-muted-foreground';
  }

  const typeLabel = GetCampaignTypeBadgeLabel(campaign.campaignType);
  const categoryLabel = GetCampaignCategoryBadgeLabel(campaign.campaignCategory);
  const dateRangeText = FormatCampaignDateRange(campaign.startDate, campaign.endDate);
  const amountToDisplay =
    paymentStatus === 'SUBMITTED' && campaign.payment?.totalPayable
      ? campaign.payment.totalPayable
      : campaign.budget;

  return (
    <div
      onClick={() => navigate(`/campaigns/${campaign.id}`)}
      className="group flex flex-col justify-between rounded-xl border border-border/60 bg-card p-5 transition-colors hover:border-foreground/40 cursor-pointer"
    >
      <div className="space-y-4">
        {/* Header: Brand Name + Plain Status Text */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="truncate text-xs font-medium text-muted-foreground">
              {campaign.brand.companyName}
            </span>
            {campaign.isFeatured && (
              <span className="shrink-0 text-xs font-medium text-amber-500">
                Featured #{campaign.featuredOrder ?? 1}
              </span>
            )}
          </div>
          <span className={cn('shrink-0 text-xs font-medium', statusTextClass)}>
            {statusText}
          </span>
        </div>

        {/* Title & Metadata */}
        <div className="space-y-1">
          <h3 className="line-clamp-1 text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
            {campaign.title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{typeLabel}</span>
            <span>{categoryLabel}</span>
            <span>{dateRangeText}</span>
          </div>
        </div>

        {/* 2-Column Hairline Metrics */}
        <div className="grid grid-cols-2 divide-x divide-border/60 rounded-lg border border-border/60 bg-background/50 p-2.5 text-xs">
          <div className="pr-2">
            <p className="text-xs text-muted-foreground">
              {paymentStatus === 'SUBMITTED' ? 'Total Transfer' : 'Total Anggaran'}
            </p>
            <p className="mt-0.5 font-semibold text-foreground tabular-nums">
              {FormatRupiah(amountToDisplay)}
            </p>
          </div>
          <div className="pl-2.5">
            <p className="text-xs text-muted-foreground">Tarif CPM</p>
            <p className="mt-0.5 font-medium text-foreground tabular-nums">
              {FormatRupiah(campaign.cpm)} / 1K
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
