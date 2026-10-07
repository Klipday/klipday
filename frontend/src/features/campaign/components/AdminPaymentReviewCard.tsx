import { useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { UseVerifyCampaignPaymentMutation } from '../hooks';
import type { AdminPaymentReviewCardProps } from '../types';
import { FormatRupiah } from '../utils';

/**
 * Admin payment review card component.
 * Allows Admin to inspect submitted bank transfer proof and either approve or reject the payment.
 *
 * @param props - Component properties containing the campaign entity and success callback.
 * @returns The rendered admin payment review card.
 */
export function AdminPaymentReviewCard({
  campaign,
  className,
  onVerificationSuccess,
}: AdminPaymentReviewCardProps) {
  const latestPayment = campaign.payments?.[0];

  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  const verifyMutation = UseVerifyCampaignPaymentMutation(campaign.id, {
    onSuccess: () => {
      onVerificationSuccess?.();
    },
  });

  if (!latestPayment || latestPayment.paymentStatus !== 'SUBMITTED') {
    return null;
  }

  const isPending = verifyMutation.isPending;

  const HandleConfirmApprove = () => {
    setIsApproveOpen(false);
    verifyMutation.mutate({ action: 'APPROVE' });
  };

  const HandleConfirmReject = () => {
    if (!rejectionReason.trim()) {
      setRejectionError('Alasan penolakan wajib diisi.');
      return;
    }

    setRejectionError(null);
    setIsRejectOpen(false);
    verifyMutation.mutate({
      action: 'REJECT',
      rejectionReason: rejectionReason.trim(),
    });
  };

  return (
    <Card className={cn('border-primary/30 bg-primary/5 shadow-xs', className)}>
      <CardHeader className="pb-3 border-b border-primary/10">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary shrink-0" />
            <CardTitle className="text-base font-semibold text-foreground tracking-tight">
              Verifikasi Pembayaran Manual
            </CardTitle>
          </div>
          <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            Menunggu Verifikasi Admin
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LEFT: PAYMENT DETAILS */}
          <div className="space-y-3 rounded-xl border border-border/60 bg-background/80 p-4 text-xs">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Bank/E-Wallet Pengirim:</span>
              <span className="font-semibold text-foreground">{latestPayment.senderProviderName || '-'}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Nama Pemilik Rekening:</span>
              <span className="font-semibold text-foreground">{latestPayment.senderAccountName || '-'}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Anggaran Kampanye:</span>
              <span className="font-semibold text-foreground">{FormatRupiah(Number(latestPayment.amount))}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Kode Unik:</span>
              <span className="font-semibold text-primary">+{latestPayment.uniqueCode}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Total yang Harus Dibayar:</span>
              <span className="text-sm font-bold text-foreground tabular-nums">
                {FormatRupiah(Number(latestPayment.totalPayable))}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Diajukan Pada:</span>
              <span className="text-muted-foreground">
                {new Date(latestPayment.updatedAt).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* RIGHT: RECEIPT PROOF IMAGE */}
          <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-background/80 p-4 space-y-3">
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Bukti Struk Transfer:</span>
              {latestPayment.transferProofUrl ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border/50 bg-muted">
                  <img
                    src={latestPayment.transferProofUrl}
                    alt="Bukti Struk Transfer"
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Tidak ada URL bukti transfer.</p>
              )}
            </div>

            {latestPayment.transferProofUrl && (
              <a
                href={latestPayment.transferProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                <span>Buka Bukti Gambar Ukuran Penuh</span>
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => setIsRejectOpen(true)}
            className="gap-2 text-xs sm:text-sm text-destructive hover:bg-destructive/10 hover:text-destructive">
            <XCircle className="size-4" />
            Tolak Pembayaran
          </Button>

          <Button
            type="button"
            disabled={isPending}
            onClick={() => setIsApproveOpen(true)}
            className="gap-2 text-xs sm:text-sm font-semibold">
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Memverifikasi...
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                Setujui & Aktifkan Kampanye
              </>
            )}
          </Button>
        </div>
      </CardContent>

      {/* APPROVE CONFIRMATION DIALOG */}
      <AlertDialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Setujui Pembayaran Kampanye?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin telah memverifikasi struk pembayaran sebesar{' '}
              <strong className="text-foreground">{FormatRupiah(Number(latestPayment.totalPayable))}</strong>? Status kampanye akan langsung diubah menjadi{' '}
              <strong className="text-foreground">ACTIVE</strong> dan siap diikuti kreator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={HandleConfirmApprove} disabled={isPending} className="gap-2">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Ya, Setujui Sekarang'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* REJECT CONFIRMATION DIALOG */}
      <AlertDialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Pembayaran Kampanye?</AlertDialogTitle>
            <AlertDialogDescription>
              Kampanye akan dikembalikan ke status <strong className="text-foreground">Menunggu Pembayaran</strong> sehingga brand dapat mengirimkan bukti transfer yang benar tanpa kehilangan data kampanye.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-1.5 py-2">
            <Label htmlFor="rejectionReason" className="text-xs font-medium">
              Alasan Penolakan <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="rejectionReason"
              placeholder="Contoh: Nominal transfer tidak sesuai kode unik atau struk buram/tidak terbaca."
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                setRejectionError(null);
              }}
              rows={3}
              className="text-xs sm:text-sm"
            />
            {rejectionError && <p className="text-xs text-destructive">{rejectionError}</p>}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={HandleConfirmReject}
              disabled={isPending}
              className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Tolak Pembayaran'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
