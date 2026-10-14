import { useState } from 'react';
import { ArrowUpRight, Loader2, Plus } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { WITHDRAWAL_LIMITS } from '../constants';
import { UseCreateCreatorWithdrawalMutation } from '../hooks';
import type { CreatorWithdrawalDialogProps } from '../types';
import { FormatNumber, FormatRupiah, ParseFormattedRupiah } from '../utils/wallet-format';
import { AddPayoutAccountDialog } from './AddPayoutAccountDialog';

/**
 * Withdrawal modal dialog for Creator accounts.
 * Allows clippers to withdraw their verified video earnings to their primary bank or e-wallet.
 *
 * @param props - Component configuration properties.
 * @returns Rendered withdrawal dialog element.
 */
export function CreatorWithdrawalDialog({
  open,
  onOpenChange,
  activeBalance,
  payoutAccounts,
  onWithdrawalSuccess,
  onAddNewAccount,
}: CreatorWithdrawalDialogProps) {
  const [amount, setAmount] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);

  const createWithdrawalMutation = UseCreateCreatorWithdrawalMutation();

  const verifiedAccounts = payoutAccounts.filter((acc) => acc.verificationStatus === 'VERIFIED');
  const defaultAccountId =
    verifiedAccounts.find((acc) => acc.isPrimary)?.id ?? verifiedAccounts[0]?.id ?? '';
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
        `Saldo tidak mencukupi batas minimum penarikan (${FormatRupiah(WITHDRAWAL_LIMITS.MIN_AMOUNT)}).`,
      );
      return;
    }
    setAmount(activeBalance);
    setInputValue(FormatNumber(activeBalance));
  };

  const HandleSelectPreset = (presetAmount: number) => {
    if (presetAmount > activeBalance) {
      toast.error('Nominal melebihi saldo siap ditarik.');
      return;
    }
    setAmount(presetAmount);
    setInputValue(FormatNumber(presetAmount));
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
      toast.error('Nominal penarikan tidak boleh melebihi saldo siap ditarik.');
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

  const hasInsufficientBalance = amount > activeBalance;
  const isBelowMinimum = amount > 0 && amount < WITHDRAWAL_LIMITS.MIN_AMOUNT;
  const isSubmitDisabled =
    amount <= 0 ||
    isBelowMinimum ||
    hasInsufficientBalance ||
    !selectedAccount ||
    createWithdrawalMutation.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">
              Tarik Saldo Pendapatan
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cairkan saldo upah video kampanye ke rekening bank atau akun e-wallet Anda.
            </DialogDescription>
          </DialogHeader>

          {verifiedAccounts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 bg-muted/10 p-6 text-center space-y-3">
              <p className="text-sm font-medium text-foreground">
                Belum ada rekening / e-wallet yang terverifikasi
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Anda harus mendaftarkan rekening bank atau akun e-wallet (DANA, GoPay, OVO) dan menunggu verifikasi admin sebelum dapat melakukan penarikan dana.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (onAddNewAccount) {
                    onOpenChange(false);
                    onAddNewAccount();
                  } else {
                    setIsAddAccountOpen(true);
                  }
                }}
                className="cursor-pointer text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-1.5 size-3.5" />
                <span>Daftarkan Akun Sekarang</span>
              </Button>
            </div>
          ) : (
            <form onSubmit={HandleInitiateSubmit} className="space-y-4">
              {/* Info Saldo Siap Ditarik */}
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                <span className="text-xs font-medium text-muted-foreground">
                  Saldo Siap Ditarik:
                </span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {FormatRupiah(activeBalance)}
                </span>
              </div>

              {/* Pilihan Akun Rekening / E-Wallet */}
              <div className="space-y-2">
                <Label htmlFor="destination-account" className="text-xs font-medium text-foreground">
                  Rekening / E-Wallet Tujuan
                </Label>
                <Select
                  value={effectiveAccountId}
                  onValueChange={(val) => setSelectedAccountId(val)}>
                  <SelectTrigger
                    id="destination-account"
                    className="h-10 w-full rounded-xl border-border/60 bg-card text-xs cursor-pointer">
                    <SelectValue placeholder="Pilih Akun Tujuan" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/60 text-xs">
                    {verifiedAccounts.map((acc) => (
                      <SelectItem
                        key={acc.id}
                        value={acc.id}
                        className="cursor-pointer py-2 text-xs">
                        {acc.provider} - {acc.accountNumber} ({acc.accountHolderName})
                        {acc.isPrimary ? ' [Utama]' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Input Nominal Penarikan */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="withdrawal-amount" className="text-xs font-medium text-foreground">
                    Nominal Penarikan (Rp)
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={HandleWithdrawAll}
                    disabled={activeBalance < WITHDRAWAL_LIMITS.MIN_AMOUNT}
                    className="h-6 text-[11px] font-medium text-primary hover:text-primary/90 p-0 cursor-pointer">
                    Tarik Semua
                  </Button>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs font-medium text-muted-foreground">
                    Rp
                  </div>
                  <Input
                    id="withdrawal-amount"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={inputValue}
                    onChange={(e) => HandleAmountChange(e.target.value)}
                    className="h-10 rounded-xl pl-9 text-sm tabular-nums font-medium border-border/60"
                  />
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {[50_000, 100_000, 250_000, 500_000, 1_000_000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => HandleSelectPreset(preset)}
                      className={cn(
                        'rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer',
                        amount === preset
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                      )}>
                      {FormatRupiah(preset)}
                    </button>
                  ))}
                </div>

                {isBelowMinimum && (
                  <p className="text-[11px] text-destructive">
                    Nominal minimum penarikan adalah {FormatRupiah(WITHDRAWAL_LIMITS.MIN_AMOUNT)}.
                  </p>
                )}
                {hasInsufficientBalance && (
                  <p className="text-[11px] text-destructive">
                    Nominal penarikan melebihi saldo aktif Anda.
                  </p>
                )}
              </div>

              {/* Rincian Ringkas */}
              {selectedAccount && amount >= WITHDRAWAL_LIMITS.MIN_AMOUNT && !hasInsufficientBalance && (
                <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Biaya Transfer:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Gratis (Rp 0)</span>
                  </div>
                  <div className="flex justify-between border-t border-border/40 pt-2 font-medium text-foreground">
                    <span>Total Diterima:</span>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {FormatRupiah(amount)}
                    </span>
                  </div>
                </div>
              )}

              {/* Tombol Aksi */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => onOpenChange(false)}
                  disabled={createWithdrawalMutation.isPending}
                  className="cursor-pointer text-xs font-medium">
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="default"
                  disabled={isSubmitDisabled}
                  className="cursor-pointer text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90">
                  <ArrowUpRight className="mr-1.5 size-4" />
                  <span>Ajukan Penarikan</span>
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Penarikan */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">
              Konfirmasi Penarikan Saldo
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Periksa kembali nominal dan rekening tujuan sebelum memproses pengajuan penarikan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedAccount && (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Nominal Penarikan:</span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {FormatRupiah(amount)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border/40 pt-2">
                <span className="text-muted-foreground">Penyedia:</span>
                <span className="font-semibold text-foreground">{selectedAccount.provider}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Nomor Akun:</span>
                <span className="font-mono font-medium text-foreground">{selectedAccount.accountNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Nama Penerima:</span>
                <span className="font-medium text-foreground">{selectedAccount.accountHolderName}</span>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={createWithdrawalMutation.isPending}>
              Periksa Kembali
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={HandleConfirmSubmit}
              disabled={createWithdrawalMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium cursor-pointer text-xs">
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

      <AddPayoutAccountDialog
        open={isAddAccountOpen}
        onOpenChange={setIsAddAccountOpen}
        existingAccountsCount={payoutAccounts.length}
        role="CREATOR"
        onSuccess={() => {
          onWithdrawalSuccess?.();
        }}
      />
    </>
  );
}
