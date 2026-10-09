import { useState } from 'react';
import { AlertCircle, ArrowUpRight, Loader2, Wallet } from 'lucide-react';
import { toast } from 'sonner';

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { WITHDRAWAL_LIMITS } from '../constants';
import { UseCreateWithdrawalMutation } from '../hooks';
import type { BrandWithdrawalDialogProps } from '../types';
import { FormatNumber, FormatRupiah, ParseFormattedRupiah } from '../utils/wallet-format';


/**
 * Withdrawal modal dialog for Brand accounts.
 * Allows brands to request a payout from their active balance to a destination bank or e-wallet.
 *
 * @param props - Component properties.
 * @returns Rendered withdrawal dialog element.
 */
export function BrandWithdrawalDialog({
  open,
  onOpenChange,
  activeBalance,
  onWithdrawalSuccess,
  defaultBank,
}: BrandWithdrawalDialogProps) {
  const [amount, setAmount] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>('');
  const [accountProvider, setAccountProvider] = useState<string>(
    defaultBank?.accountProvider ?? '',
  );
  const [accountNumber, setAccountNumber] = useState<string>(
    defaultBank?.accountNumber ?? '',
  );
  const [accountHolderName, setAccountHolderName] = useState<string>(
    defaultBank?.accountHolderName ?? '',
  );

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const createWithdrawalMutation = UseCreateWithdrawalMutation();

  const HandleAmountChange = (rawInput: string) => {
    const numericValue = ParseFormattedRupiah(rawInput);
    setAmount(numericValue);
    setInputValue(numericValue > 0 ? FormatNumber(numericValue) : '');
  };

  const HandleWithdrawAll = () => {
    if (activeBalance < WITHDRAWAL_LIMITS.MIN_AMOUNT) {
      toast.error(
        `Saldo aktif tidak mencukupi batas minimum penarikan (${FormatRupiah(WITHDRAWAL_LIMITS.MIN_AMOUNT)}).`,
      );
      return;
    }
    setAmount(activeBalance);
    setInputValue(FormatNumber(activeBalance));
  };

  const HandleResetForm = () => {
    setAmount(0);
    setInputValue('');
  };

  const HandleInitiateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (amount < WITHDRAWAL_LIMITS.MIN_AMOUNT) {
      toast.error(
        `Nominal penarikan minimum adalah ${FormatRupiah(WITHDRAWAL_LIMITS.MIN_AMOUNT)}.`,
      );
      return;
    }

    if (amount > activeBalance) {
      toast.error('Nominal penarikan tidak boleh melebihi saldo aktif Anda.');
      return;
    }

    if (accountProvider.trim().length < 2) {
      toast.error('Bank atau e-wallet tujuan wajib diisi (minimal 2 karakter).');
      return;
    }

    if (accountNumber.trim().length < 4) {
      toast.error('Nomor rekening atau nomor e-wallet wajib diisi (minimal 4 digit).');
      return;
    }

    if (accountHolderName.trim().length < 2) {
      toast.error('Nama pemilik rekening atau akun tujuan wajib diisi.');
      return;
    }

    setIsConfirmOpen(true);
  };

  const HandleConfirmSubmit = () => {
    createWithdrawalMutation.mutate(
      {
        amount,
        accountProvider: accountProvider.trim(),
        accountNumber: accountNumber.trim(),
        accountHolderName: accountHolderName.trim(),
      },
      {
        onSuccess: () => {
          setIsConfirmOpen(false);
          HandleResetForm();
          onOpenChange(false);
          onWithdrawalSuccess?.();
        },
      },
    );
  };

  const isInsufficient = amount > activeBalance;
  const isSubmitDisabled =
    createWithdrawalMutation.isPending ||
    amount < WITHDRAWAL_LIMITS.MIN_AMOUNT ||
    isInsufficient ||
    !accountProvider.trim() ||
    !accountNumber.trim() ||
    !accountHolderName.trim();


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>

      <DialogContent className="sm:max-w-lg p-6 sm:p-7">
        <DialogHeader className="space-y-1.5 pb-1">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg border border-border/60 bg-muted/30">
              <ArrowUpRight className="size-4 text-foreground" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold tracking-tight">
                Tarik Saldo Aktif
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Tarik saldo ke rekening bank atau e-wallet terdaftar Anda.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={HandleInitiateSubmit} className="space-y-5 pt-2">

          {/* Active Balance Card Indicator */}
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center gap-2.5">
              <Wallet className="size-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Saldo Aktif Tersedia</span>
            </div>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {FormatRupiah(activeBalance)}
            </span>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="withdrawal-amount" className="text-xs font-medium">
                Nominal Penarikan
              </Label>
              {activeBalance >= WITHDRAWAL_LIMITS.MIN_AMOUNT && (
                <button
                  type="button"
                  onClick={HandleWithdrawAll}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-4 cursor-pointer transition-colors">
                  Tarik Semua
                </button>
              )}
            </div>

            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                Rp
              </span>
              <Input
                id="withdrawal-amount"
                type="text"
                inputMode="numeric"
                value={inputValue}
                onChange={(e) => HandleAmountChange(e.target.value)}
                placeholder="0"
                className={cn(
                  'h-10 pl-10 text-base font-semibold tabular-nums',
                  isInsufficient && 'border-destructive focus-visible:ring-destructive',
                )}
              />
            </div>

            {isInsufficient && (
              <p className="text-xs text-destructive">
                Nominal melebihi saldo aktif Anda ({FormatRupiah(activeBalance)}).
              </p>
            )}
          </div>

          {/* Bank / Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="withdrawal-provider" className="text-xs font-medium">
              Bank / E-Wallet Tujuan
            </Label>
            <Input
              id="withdrawal-provider"
              type="text"
              value={accountProvider}
              onChange={(e) => setAccountProvider(e.target.value)}
              placeholder="Contoh: BCA, Mandiri, GoPay, OVO, Dana"
              className="h-9 text-xs"
            />
          </div>

          {/* Account Number & Holder Name */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="withdrawal-number" className="text-xs font-medium">
                Nomor Rekening / Akun
              </Label>
              <Input
                id="withdrawal-number"
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Contoh: 1234567890"
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdrawal-holder" className="text-xs font-medium">
                Nama Pemilik Rekening
              </Label>
              <Input
                id="withdrawal-holder"
                type="text"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="Sesuai buku tabungan"
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Notice info (Warning amber highlight for 24h verification) */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs space-y-1">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-medium text-amber-900 dark:text-amber-200">
                  Penarikan akan diverifikasi dan ditransfer admin ke rekening Anda dalam 1x24 jam kerja.
                </p>
                <p className="text-[11px] text-amber-700/90 dark:text-amber-400/90">
                  Saldo aktif akan langsung dikurangi untuk menjaga integritas transaksi.
                </p>
              </div>
            </div>
          </div>


          {/* Action Buttons - exactly matching BrandTopUpDialog */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => onOpenChange(false)}
              disabled={createWithdrawalMutation.isPending}
              className="cursor-pointer text-xs">
              Batal
            </Button>
            <Button
              type="submit"
              size="default"
              disabled={isSubmitDisabled}
              className="cursor-pointer font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs">
              {createWithdrawalMutation.isPending ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <ArrowUpRight className="mr-1.5 size-4" />
              )}
              <span>Tarik Saldo</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Confirmation Alert Dialog */}
    <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-semibold">
            Konfirmasi Penarikan Saldo
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground">
            Pastikan rekening dan nominal penarikan Anda sudah benar sebelum memproses.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Nominal Penarikan:</span>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {FormatRupiah(amount)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-border/40 pt-2">
            <span className="text-muted-foreground">Bank / E-Wallet:</span>
            <span className="font-semibold text-foreground">{accountProvider}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Nomor Rekening:</span>
            <span className="font-mono font-medium text-foreground">{accountNumber}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Nama Pemilik:</span>
            <span className="font-medium text-foreground">{accountHolderName}</span>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={createWithdrawalMutation.isPending}>
            Periksa Kembali
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={HandleConfirmSubmit}
            disabled={createWithdrawalMutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium cursor-pointer">
            {createWithdrawalMutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                Memproses...
              </>
            ) : (
              'Ya, Tarik Saldo'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

