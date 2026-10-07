import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Wallet } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { UsePayCampaignWithWalletMutation } from '../hooks';
import type { CampaignPaymentWalletOptionProps } from '../types';
import { FormatRupiah } from '../utils';

/**
 * Wallet payment option component for Step 6 of campaign creation wizard.
 * Displays brand wallet balance, required budget deduction, and handles payment confirmation.
 *
 * @param props - Component properties containing campaignId, budget, balance, and status.
 * @returns The rendered wallet payment option element.
 */
export function CampaignPaymentWalletOption({
  campaignId,
  budget,
  walletBalance,
  canPay,
  className,
  onPaymentSuccess,
}: CampaignPaymentWalletOptionProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const payMutation = UsePayCampaignWithWalletMutation(campaignId, {
    onSuccess: () => {
      onPaymentSuccess?.();
    },
  });

  const remainingBalance = walletBalance - budget;
  const isPending = payMutation.isPending;

  const HandleConfirmPay = () => {
    setIsConfirmOpen(false);
    payMutation.mutate();
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden divide-y divide-border/40 shadow-xs">
        {/* ROW 1: HEADER SUMMARY */}
        <div className="p-5 sm:p-6 bg-muted/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-foreground tracking-tight">Saldo Dompet Akun</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Bayar langsung memotong saldo dompet akun Anda tanpa perlu transfer bank manual.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[11px] font-medium text-muted-foreground">Saldo Aktif</span>
            <p className="text-lg font-semibold font-mono tabular-nums text-foreground">{FormatRupiah(walletBalance)}</p>
          </div>
        </div>

        {/* ROW 2: LEDGER CALCULATION */}
        <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Saldo Tersedia</span>
            <p className="text-base sm:text-lg font-semibold text-foreground font-mono tabular-nums">
              {FormatRupiah(walletBalance)}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Anggaran Kampanye</span>
            <p className="text-base sm:text-lg font-semibold text-foreground font-mono tabular-nums">
              {FormatRupiah(budget)}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Sisa Saldo Setelah Bayar</span>
            <p
              className={cn(
                'text-base sm:text-lg font-semibold font-mono tabular-nums',
                canPay ? 'text-foreground' : 'text-muted-foreground'
              )}>
              {canPay ? FormatRupiah(remainingBalance) : 'Kurang ' + FormatRupiah(budget - walletBalance)}
            </p>
          </div>
        </div>

        {/* ROW 3: NOTICE */}
        <div className="p-5 sm:p-6 bg-muted/10">
          {canPay ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
              <span>Saldo dompet Anda mencukupi untuk mendanai kampanye ini.</span>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <p>
                Saldo dompet tidak mencukupi untuk mendanai kampanye ini. Silakan gunakan metode{' '}
                <strong className="text-foreground font-medium">Transfer Bank Manual</strong> untuk melanjutkan.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="button"
          disabled={!canPay || isPending}
          onClick={() => setIsConfirmOpen(true)}
          className="gap-2 font-semibold">
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Memproses Pembayaran...
            </>
          ) : (
            <>
              <Wallet className="size-4" />
              Bayar dengan Saldo Dompet ({FormatRupiah(budget)})
            </>
          )}
        </Button>
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pembayaran Dompet</AlertDialogTitle>
            <AlertDialogDescription>
              Saldo sebesar <strong className="text-foreground">{FormatRupiah(budget)}</strong> akan dipotong dari saldo dompet Anda. Kampanye akan langsung diteruskan ke tim review admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={HandleConfirmPay} disabled={isPending} className="gap-2">
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Konfirmasi & Bayar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
