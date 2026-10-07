import { useState } from 'react';
import { AlertCircle, ArrowLeft, Building2, Clock, Wallet } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { GetWizardStepPath } from '../config/wizard-steps';
import { UseCampaignPaymentDetailsQuery, UseCampaignWizardContext } from '../hooks';
import type { CampaignFormStep6Props } from '../types';
import { CampaignPaymentTransferOption } from './CampaignPaymentTransferOption';
import { CampaignPaymentWalletOption } from './CampaignPaymentWalletOption';

/**
 * Step 6 form orchestrator: Pembayaran Kampanye.
 * Manages method selection between Manual Bank Transfer and Klipday Wallet Balance,
 * displays previous rejection feedback, and coordinates payment confirmation.
 *
 * @param props - Component properties containing optional styling overrides.
 * @returns The rendered step 6 form element.
 */
export function CampaignFormStep6({ className }: CampaignFormStep6Props) {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { campaign } = UseCampaignWizardContext();

  const { data: paymentDetails, isLoading, isError, refetch } = UseCampaignPaymentDetailsQuery(id);
  const [activeTab, setActiveTab] = useState<'transfer' | 'wallet'>('transfer');

  if (!id) {
    return null;
  }

  const HandleBackToReview = () => {
    const targetPath = GetWizardStepPath('step-5', id);
    navigate(targetPath);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !paymentDetails) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-border/60 text-center space-y-3">
        <AlertCircle className="size-8 text-destructive opacity-80" />
        <h4 className="text-sm font-semibold text-foreground">Gagal Memuat Data Pembayaran</h4>
        <p className="text-xs text-muted-foreground max-w-sm">
          Terjadi kesalahan saat memuat rincian pembayaran dan saldo dompet Anda. Silakan coba muat ulang.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
          Coba Lagi
        </Button>
      </div>
    );
  }

  const payment = paymentDetails.payment;
  const isRejected = payment?.paymentStatus === 'REJECTED';
  const isSubmitted = payment?.paymentStatus === 'SUBMITTED';
  const resolvedBudget = paymentDetails.budget > 0 ? paymentDetails.budget : Number(campaign?.budget ?? 0);
  const totalPayable = payment ? Number(payment.totalPayable) : resolvedBudget;
  const uniqueCode = payment?.uniqueCode ?? 0;

  return (
    <div className={cn('space-y-8', className)}>
      {/* REJECTION ALERT BANNER */}
      {isRejected && payment?.rejectionReason && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-foreground">Pembayaran Sebelumnya Ditolak</h4>
            <p className="text-muted-foreground leading-relaxed">
              Catatan Admin: <strong className="text-destructive font-medium">{payment.rejectionReason}</strong>
            </p>
            <p className="text-muted-foreground">
              Harap periksa kembali nominal transfer atau unggah bukti transfer yang valid di bawah ini.
            </p>
          </div>
        </div>
      )}

      {/* AWAITING VERIFICATION ALERT BANNER */}
      {isSubmitted && !isRejected && (
        <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground">
          <Clock className="size-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-foreground">Bukti Pembayaran Sedang Diverifikasi</h4>
            <p className="leading-relaxed">
              Tim admin Klipday sedang memeriksa bukti transfer Anda. Jika Anda ingin memperbarui bukti atau melakukan transfer ulang, Anda dapat mengirimkan formulir baru di bawah.
            </p>
          </div>
        </div>
      )}

      {/* SEAMLESS EDGE-TO-EDGE SEGMENTED CONTROL TABS */}
      <div className="w-full">
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'transfer' | 'wallet')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-11 rounded-xl border border-border/60 bg-muted/20 p-0 overflow-hidden divide-x divide-border/40 shadow-xs">
            <TabsTrigger
              value="transfer"
              className={cn(
                'inline-flex h-full items-center justify-center gap-2 rounded-none text-xs sm:text-sm font-medium transition-colors cursor-pointer',
                'first:rounded-l-[11px]',
                'data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-xs'
              )}>
              <Building2 className="size-4 shrink-0" />
              <span>Transfer Bank Manual</span>
            </TabsTrigger>

            <TabsTrigger
              value="wallet"
              className={cn(
                'inline-flex h-full items-center justify-center gap-2 rounded-none text-xs sm:text-sm font-medium transition-colors cursor-pointer',
                'last:rounded-r-[11px]',
                'data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-xs'
              )}>
              <Wallet className="size-4 shrink-0" />
              <span>Saldo Dompet</span>
              {paymentDetails.canPayWithWallet && (
                <span className="size-2 rounded-full bg-emerald-500 inline-block shrink-0" title="Saldo cukup" />
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ACTIVE METHOD VIEW */}
      {activeTab === 'transfer' ? (
        <CampaignPaymentTransferOption
          campaignId={id}
          totalPayable={totalPayable}
          uniqueCode={uniqueCode}
          bankDetails={paymentDetails.bankDetails}
          existingPayment={payment}
        />
      ) : (
        <CampaignPaymentWalletOption
          campaignId={id}
          budget={resolvedBudget}
          walletBalance={paymentDetails.walletBalance}
          canPay={paymentDetails.canPayWithWallet}
        />
      )}

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-between pt-4 border-t border-border/60">
        <Button type="button" variant="outline" onClick={HandleBackToReview} className="gap-2 text-xs sm:text-sm">
          <ArrowLeft className="size-4" />
          Kembali ke Review Kampanye
        </Button>
      </div>
    </div>
  );
}
