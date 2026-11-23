import { useState } from 'react';
import { SquareTopDownIcon } from '@solar-icons/react/linear';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UseModerateCampaignMutation } from '../hooks';
import type { AdminCampaignModerationPanelProps } from '../types';
import { AdminApproveDialog } from './AdminApproveDialog';
import { AdminFeaturedCampaignDialog } from './AdminFeaturedCampaignDialog';
import { AdminRejectDialog } from './AdminRejectDialog';
import { AdminRevisionDialog } from './AdminRevisionDialog';
import { AdminTransferProofDialog } from './AdminTransferProofDialog';

/**
 * Single-row operational moderation bar rendered for administrators on CampaignDetail.
 * Displays payment verification status, receipt proof shortcut, and contextual
 * moderation or featured-placement actions without redundant metadata clutter.
 *
 * @param props - Component props containing campaign data and optional moderation success callback.
 * @returns The rendered single-row moderation bar element.
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
  const [isFeaturedOpen, setIsFeaturedOpen] = useState(false);

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

  const paymentStatusLabel = isManualPending
    ? 'Transfer Manual — Menunggu Verifikasi'
    : isManualPayment
      ? 'Transfer Manual (Lunas)'
      : 'Saldo Dompet (Lunas)';

  const featuredButtonLabel = campaign.isFeatured
    ? `Featured #${campaign.featuredOrder ?? 1}`
    : 'Kelola Featured';

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
          'rounded-xl border border-border/60 bg-card px-5 py-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5',
          className,
        )}
      >
        {/* Payment verification strip */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground min-w-0">
          <span className="font-medium text-foreground">{paymentStatusLabel}</span>

          {isManualPending &&
            (latestPayment?.senderProviderName || latestPayment?.senderAccountName) && (
              <span>
                {latestPayment?.senderProviderName ?? 'Bank'} a.n{' '}
                {latestPayment?.senderAccountName ?? '-'}
              </span>
            )}

          {latestPayment?.transferProofUrl && (
            <button
              type="button"
              onClick={() => setIsProofOpen(true)}
              className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground underline underline-offset-4 cursor-pointer transition-colors"
            >
              <span>Lihat Struk</span>
              <SquareTopDownIcon className="size-3" />
            </button>
          )}
        </div>

        {/* Contextual actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {campaign.campaignStatus === 'IN_REVIEW' && (
            <>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsApproveOpen(true)}
                disabled={moderateMutation.isPending}
                className="h-8 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                Setujui &amp; Tayangkan
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsRevisionOpen(true)}
                disabled={moderateMutation.isPending}
                className="h-8 text-xs font-medium border-border/70 cursor-pointer"
              >
                Minta Revisi
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsRejectOpen(true)}
                disabled={moderateMutation.isPending}
                className="h-8 text-xs font-medium border-border/70 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
              >
                Tolak
              </Button>
            </>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsFeaturedOpen(true)}
            className="h-8 text-xs font-medium border-border/70 text-foreground hover:bg-muted/50 cursor-pointer"
          >
            {featuredButtonLabel}
          </Button>
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

      <AdminFeaturedCampaignDialog
        open={isFeaturedOpen}
        onOpenChange={setIsFeaturedOpen}
        campaignId={campaign.id}
        campaignTitle={campaign.title ?? 'Kampanye'}
        isFeatured={campaign.isFeatured}
        featuredOrder={campaign.featuredOrder}
        featuredUntil={campaign.featuredUntil}
        onSuccess={onModerationSuccess}
      />
    </>
  );
}
