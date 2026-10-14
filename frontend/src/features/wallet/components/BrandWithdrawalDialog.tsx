import { useState } from 'react';
import { AlertCircle, Info, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
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
import { Skeleton } from '@/components/ui/skeleton';
import { UseBrandPayoutAccountsQuery } from '@/features/brand/hooks';
import { cn } from '@/lib/utils';
import { WITHDRAWAL_LIMITS } from '../constants';
import { UseCreateWithdrawalMutation } from '../hooks';
import type { BrandWithdrawalDialogProps } from '../types';
import { FormatNumber, FormatRupiah, ParseFormattedRupiah } from '../utils/wallet-format';

/**
 * Withdrawal modal dialog for Brand accounts.
 * Allows brands to request a payout from their active balance to a verified destination account.
 *
 * @param props - Component properties.
 * @returns Rendered withdrawal dialog element.
 */
export function BrandWithdrawalDialog({
  open,
  onOpenChange,
  activeBalance,
  onWithdrawalSuccess,
}: BrandWithdrawalDialogProps) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { data: payoutAccounts = [], isLoading: isAccountsLoading } = UseBrandPayoutAccountsQuery();
  const verifiedAccounts = payoutAccounts.filter((acc) => acc.verificationStatus === 'VERIFIED');

  const createWithdrawalMutation = UseCreateWithdrawalMutation();

  const defaultAccountId = verifiedAccounts.find((acc) => acc.isPrimary)?.id ?? verifiedAccounts[0]?.id ?? '';
  const effectiveAccountId = selectedAccountId || defaultAccountId;
  const selectedAccount = verifiedAccounts.find((acc) => acc.id === effectiveAccountId);

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

    if (!selectedAccount) {
      toast.error('Pilih rekening atau e-wallet tujuan yang sudah terverifikasi.');
      return;
    }

    setIsConfirmOpen(true);
  };

  const HandleConfirmSubmit = () => {
    if (!selectedAccount) return;

    createWithdrawalMutation.mutate(
      {
        amount,
        payoutAccountId: selectedAccount.id,
        accountProvider: selectedAccount.provider,
        accountNumber: selectedAccount.accountNumber,
        accountHolderName: selectedAccount.accountHolderName,
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
    !selectedAccount ||
    verifiedAccounts.length === 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-1 pb-1">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Tarik Saldo Aktif
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tarik saldo ke rekening bank atau e-wallet terverifikasi Anda.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={HandleInitiateSubmit} className="space-y-5 pt-2">
            {/* Active Balance Card Indicator (Text-only, calm and clean) */}
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-4">
              <span className="text-xs font-medium text-muted-foreground">Saldo Aktif Tersedia</span>
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

            {/* Verified Payout Account Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Rekening / E-Wallet Tujuan</Label>
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    navigate('/brand-dashboard/profile?tab=payout-accounts');
                  }}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-4 cursor-pointer transition-colors">
                  + Kelola Akun
                </button>
              </div>

              {isAccountsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>
              ) : verifiedAccounts.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {verifiedAccounts.map((acc) => {
                    const isSelected = effectiveAccountId === acc.id;
                    const isBank = acc.accountType === 'BANK_TRANSFER';

                    return (
                      <div
                        key={acc.id}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onClick={() => setSelectedAccountId(acc.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedAccountId(acc.id);
                          }
                        }}
                        className={cn(
                          'flex items-center justify-between rounded-xl border p-3.5 text-xs transition-colors cursor-pointer',
                          isSelected
                            ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/20'
                            : 'border-border/60 hover:bg-muted/30',
                        )}>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground">{acc.provider}</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                              {isBank ? 'Transfer Bank' : 'E-Wallet'}
                            </span>
                            {acc.isPrimary ? (
                              <span className="rounded-full bg-primary/20 px-1.5 py-0.2 text-[9px] font-semibold text-primary">
                                Utama
                              </span>
                            ) : null}
                          </div>
                          <p className="font-mono text-muted-foreground tabular-nums">
                            {acc.accountNumber}
                            <span className="font-sans text-muted-foreground/80"> • a.n. {acc.accountHolderName}</span>
                          </p>
                        </div>

                        <div
                          className={cn(
                            'size-4 rounded-full border flex items-center justify-center shrink-0',
                            isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40',
                          )}>
                          {isSelected ? <div className="size-1.5 rounded-full bg-white" /> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* No verified accounts alert prompt */
                <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-center space-y-2">
                  <AlertCircle className="size-5 text-muted-foreground mx-auto" />
                  <p className="text-xs font-semibold text-foreground">
                    Belum Ada Akun Penarikan Terverifikasi
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {payoutAccounts.length > 0
                      ? 'Akun penarikan Anda masih dalam tahap verifikasi admin Klipday (1x24 jam). Harap tunggu hingga verifikasi selesai sebelum menarik saldo.'
                      : 'Anda wajib mendaftarkan dan memverifikasi rekening bank atau e-wallet sebelum dapat melakukan penarikan saldo.'}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      navigate('/brand-dashboard/profile?tab=payout-accounts');
                    }}
                    className="mt-1 cursor-pointer text-xs">
                    <span>Daftarkan Akun Penarikan</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Notice info */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 text-xs space-y-1">
              <div className="flex items-start gap-2.5">
                <Info className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">
                    Penarikan akan ditransfer admin ke rekening Anda dalam 1x24 jam kerja.
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Saldo aktif akan langsung dikurangi untuk menjaga integritas transaksi.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
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
                  <>
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Tarik Saldo</span>
                )}
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
              Pastikan rekening tujuan dan nominal penarikan Anda sudah sesuai.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedAccount ? (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Nominal Penarikan:</span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {FormatRupiah(amount)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border/40 pt-2">
                <span className="text-muted-foreground">Bank / E-Wallet:</span>
                <span className="font-semibold text-foreground">{selectedAccount.provider}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Nomor Rekening:</span>
                <span className="font-mono font-medium text-foreground">{selectedAccount.accountNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Nama Pemilik:</span>
                <span className="font-medium text-foreground">{selectedAccount.accountHolderName}</span>
              </div>
            </div>
          ) : null}

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
