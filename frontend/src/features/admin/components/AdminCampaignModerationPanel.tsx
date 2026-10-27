import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UseModerateCampaignMutation } from '../hooks';
import type { AdminCampaignModerationPanelProps } from '../types';
import { FormatCompactViews, FormatRupiah } from '../utils/formatters';
import { AdminApproveDialog } from './AdminApproveDialog';
import { AdminRejectDialog } from './AdminRejectDialog';
import { AdminRevisionDialog } from './AdminRevisionDialog';
import { AdminTransferProofDialog } from './AdminTransferProofDialog';

/**
 * Calculates calendar day duration between start and end date strings.
 *
 * @param startIso - Start date ISO string or null.
 * @param endIso - End date ISO string or null.
 * @returns Duration in days or null.
 */
function CalculateDurationDays(startIso?: string | null, endIso?: string | null): number | null {
  if (!startIso || !endIso) return null;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Formats a concise Indonesian date range (e.g. `28 Okt – 15 Nov 2026`).
 *
 * @param startIso - Start date ISO string.
 * @param endIso - End date ISO string.
 * @returns Formatted date range string.
 */
function FormatPeriod(startIso?: string | null, endIso?: string | null): string {
  if (!startIso && !endIso) return 'Jadwal Fleksibel';
  const formatter = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const start = startIso ? formatter.format(new Date(startIso)) : null;
  const end = endIso ? formatter.format(new Date(endIso)) : null;
  if (start && end) return `${start} – ${end}`;
  return start || end || '-';
}

/**
 * Moderation Action Panel rendered at the top of CampaignDetail for administrators.
 * Provides a unified 4-column hairline bar for payment verification and campaign approval/revision/rejection.
 *
 * @param props - Component props containing campaign data and optional moderation success callback.
 * @returns The rendered moderation panel element.
 */
export function AdminCampaignModerationPanel({
  campaign,
  onModerationSuccess,
  className,
}: AdminCampaignModerationPanelProps) {
  const [isProofOpen, setIsProofOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const moderateMutation = UseModerateCampaignMutation(campaign.id, {
    onSuccess: onModerationSuccess,
  });

  const latestPayment = campaign.payments?.[0];
  const isManualPayment =
    latestPayment?.paymentStatus === 'SUBMITTED' ||
    Boolean(latestPayment?.transferProofUrl || latestPayment?.senderProviderName);
  const isManualPending = latestPayment?.paymentStatus === 'SUBMITTED';

  const budgetNum = Number(campaign.budget ?? 0);
  const totalPayableNum = Number(latestPayment?.totalPayable ?? budgetNum);
  const cpmNum = Number(campaign.cpm ?? 0);
  const minViewsNum = Number(campaign.minViews ?? 0);

  const materialsCount = campaign.materials?.length ?? 0;
  const brief = campaign.brief;
  const isBriefComplete = Boolean(
    brief && (brief.guidelines || brief.narration || brief.requiredCaption),
  );

  const durationDays = CalculateDurationDays(campaign.startDate, campaign.endDate);
  const periodText = FormatPeriod(campaign.startDate, campaign.endDate);

  const HandleConfirmApprove = () => {
    moderateMutation.mutate(
      { action: 'APPROVE' },
      {
        onSettled: () => setIsApproveOpen(false),
      },
    );
  };

  const HandleConfirmRevision = (adminNote: string) => {
    moderateMutation.mutate(
      { action: 'REVISION', adminNote },
      {
        onSettled: () => setIsRevisionOpen(false),
      },
    );
  };

  const HandleConfirmReject = (payload: {
    action: 'REJECT_PAYMENT' | 'REJECT_CAMPAIGN';
    adminNote: string;
    refundConfirmedManualPayment: boolean;
  }) => {
    moderateMutation.mutate(
      {
        action: payload.action,
        adminNote: payload.adminNote,
        refundConfirmedManualPayment: payload.refundConfirmedManualPayment,
      },
      {
        onSettled: () => setIsRejectOpen(false),
      },
    );
  };

  return (
    <>
      <div
        className={cn(
          'grid grid-cols-1 divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-card sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4',
          className,
        )}
      >
        {/* Column 1: Metode & Status Pembayaran */}
        <div className="p-5 space-y-1.5 flex flex-col justify-center">
          <p className="text-xs text-muted-foreground font-medium">Metode &amp; Status Pembayaran</p>
          {isManualPending ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-500">
                Transfer Manual (Menunggu Verifikasi)
              </p>
              <p className="text-xs text-muted-foreground">
                <span>
                  {latestPayment?.senderProviderName ?? 'Bank'} a.n{' '}
                  {latestPayment?.senderAccountName ?? '-'}
                </span>
                {latestPayment?.transferProofUrl && (
                  <>
                    {' · '}
                    <button
                      type="button"
                      onClick={() => setIsProofOpen(true)}
                      className="inline-flex items-center gap-1 font-medium text-foreground underline hover:text-primary cursor-pointer transition-colors"
                    >
                      <span>Lihat Bukti Struk</span>
                      <ExternalLink className="size-3" />
                    </button>
                  </>
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-emerald-500">
                {isManualPayment ? 'Transfer Manual (Lunas)' : 'Saldo Dompet Klipday (Lunas)'}
              </p>
              <p className="text-xs text-muted-foreground">
                <span>
                  {isManualPayment
                    ? 'Pembayaran transfer telah diverifikasi admin'
                    : 'Dana telah dipotong otomatis dari saldo aktif brand'}
                </span>
                {latestPayment?.transferProofUrl && (
                  <>
                    {' · '}
                    <button
                      type="button"
                      onClick={() => setIsProofOpen(true)}
                      className="inline-flex items-center gap-1 font-medium text-foreground underline hover:text-primary cursor-pointer transition-colors"
                    >
                      <span>Lihat Bukti Struk</span>
                      <ExternalLink className="size-3" />
                    </button>
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Column 2: Total Anggaran Kampanye */}
        <div className="p-5 space-y-1 flex flex-col justify-center">
          <p className="text-xs text-muted-foreground font-medium">Total Anggaran Kampanye</p>
          <p className="font-mono text-xl font-semibold tracking-tight text-foreground">
            {FormatRupiah(isManualPending ? totalPayableNum : budgetNum)}
          </p>
          <p className="text-xs text-muted-foreground">
            CPM {FormatRupiah(cpmNum)} / 1K · Min. {FormatCompactViews(minViewsNum)} views
          </p>
        </div>

        {/* Column 3: Kelengkapan Konten & Materi */}
        <div className="p-5 space-y-1 flex flex-col justify-center">
          <p className="text-xs text-muted-foreground font-medium">Kelengkapan Konten &amp; Materi</p>
          <p className="text-sm font-semibold text-foreground">
            {materialsCount} Materi Clipping ·{' '}
            <span className={isBriefComplete ? 'text-emerald-500' : 'text-amber-500'}>
              {isBriefComplete ? 'Brief Lengkap' : 'Brief Belum Lengkap'}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {periodText}
            {durationDays != null ? ` (${durationDays} Hari)` : ''}
          </p>
        </div>

        {/* Column 4: Keputusan Moderasi Admin */}
        <div className="flex flex-col justify-center gap-2 bg-muted/20 p-4">
          <Button
            type="button"
            onClick={() => setIsApproveOpen(true)}
            disabled={moderateMutation.isPending}
            className="h-9 w-full text-xs font-semibold cursor-pointer"
          >
            Setujui &amp; Tayangkan
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRevisionOpen(true)}
              disabled={moderateMutation.isPending}
              className="h-8 text-xs font-medium cursor-pointer"
            >
              Minta Revisi
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRejectOpen(true)}
              disabled={moderateMutation.isPending}
              className="h-8 text-xs font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
            >
              Tolak
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog Modals */}
      <AdminTransferProofDialog
        open={isProofOpen}
        onOpenChange={setIsProofOpen}
        proofUrl={latestPayment?.transferProofUrl ?? null}
        senderBank={latestPayment?.senderProviderName}
        senderName={latestPayment?.senderAccountName}
        totalPayable={latestPayment?.totalPayable ?? budgetNum}
      />

      <AdminApproveDialog
        open={isApproveOpen}
        onOpenChange={setIsApproveOpen}
        isPending={moderateMutation.isPending}
        campaignTitle={campaign.title ?? 'Kampanye'}
        isManualPaymentPending={isManualPending}
        totalPayable={totalPayableNum}
        onConfirm={HandleConfirmApprove}
      />

      <AdminRevisionDialog
        open={isRevisionOpen}
        onOpenChange={setIsRevisionOpen}
        isPending={moderateMutation.isPending}
        campaignTitle={campaign.title ?? 'Kampanye'}
        onConfirm={HandleConfirmRevision}
      />

      <AdminRejectDialog
        open={isRejectOpen}
        onOpenChange={setIsRejectOpen}
        isPending={moderateMutation.isPending}
        campaignTitle={campaign.title ?? 'Kampanye'}
        budget={isManualPending ? totalPayableNum : budgetNum}
        isManualPaymentPending={isManualPending}
        onConfirm={HandleConfirmReject}
      />
    </>
  );
}
