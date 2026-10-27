import { useNavigate } from 'react-router';
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
 * Displays brand name, payment status pill, campaign title, metrics, and material count.
 *
 * @param props - Component props containing campaign data.
 * @returns The rendered moderation card.
 */
export function AdminModerationCampaignCard({ campaign }: AdminModerationCampaignCardProps) {
  const navigate = useNavigate();

  const isWallet = campaign.payment?.isWalletPayment;
  const paymentStatus = campaign.payment?.paymentStatus;
  const campaignStatus = campaign.campaignStatus;

  let paymentBadgeText = 'Saldo Dompet · Lunas';
  let paymentBadgeClass = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500';

  if (campaignStatus === 'REJECTED') {
    paymentBadgeText = 'Ditolak';
    paymentBadgeClass = 'border-rose-500/30 bg-rose-500/10 text-rose-500';
  } else if (campaignStatus === 'REVISION') {
    paymentBadgeText = 'Menunggu Revisi Brand';
    paymentBadgeClass = 'border-amber-500/30 bg-amber-500/10 text-amber-500';
  } else if (isWallet || paymentStatus === 'APPROVED') {
    paymentBadgeText = isWallet ? 'Saldo Dompet · Lunas' : 'Transfer Manual · Lunas';
    paymentBadgeClass = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500';
  } else if (paymentStatus === 'SUBMITTED') {
    paymentBadgeText = 'Transfer Manual · Cek Bukti';
    paymentBadgeClass = 'border-amber-500/30 bg-amber-500/10 text-amber-500';
  } else {
    paymentBadgeText = 'Menunggu Pembayaran';
    paymentBadgeClass = 'border-border/60 bg-muted/40 text-muted-foreground';
  }

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
        {/* Header: Brand Name + Payment Status Badge */}
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-medium text-muted-foreground">
            {campaign.brand.companyName}
          </span>
          <span
            className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium ${paymentBadgeClass}`}
          >
            {paymentBadgeText}
          </span>
        </div>

        {/* Title & Metadata */}
        <div className="space-y-1">
          <h3 className="line-clamp-1 text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
            {campaign.title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {campaign.campaignType} · {campaign.campaignCategory} · {dateRangeText}
          </p>
        </div>

        {/* 2-Column Hairline Metrics */}
        <div className="grid grid-cols-2 divide-x divide-border/60 rounded-lg border border-border/60 bg-background/50 p-2.5 text-xs">
          <div className="pr-2">
            <p className="text-xs text-muted-foreground">
              {paymentStatus === 'SUBMITTED' ? 'Total Transfer' : 'Total Anggaran'}
            </p>
            <p className="mt-0.5 font-mono font-semibold text-foreground">
              {FormatRupiah(amountToDisplay)}
            </p>
          </div>
          <div className="pl-2.5">
            <p className="text-xs text-muted-foreground">Tarif CPM</p>
            <p className="mt-0.5 font-mono font-medium text-foreground">
              {FormatRupiah(campaign.cpm)} / 1K
            </p>
          </div>
        </div>
      </div>

      {/* Footer: Material/Brief completeness + CTA */}
      <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
        <span>
          {campaign.materialsCount} Materi ·{' '}
          {campaign.isBriefComplete ? 'Brief Lengkap' : 'Brief Perlu Dilengkapi'}
        </span>
        <span className="font-medium text-foreground group-hover:translate-x-0.5 transition-transform">
          Tinjau Kampanye →
        </span>
      </div>
    </div>
  );
}
