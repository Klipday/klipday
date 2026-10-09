import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Copy, ExternalLink, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
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
import {
  KLIPDAY_DESTINATION_BANK,
  TOP_UP_LIMITS,
} from '../constants';
import {
  UseCreateTopUpMutation,
  UseSubmitTopUpProofMutation,
  UseUploadTopUpProofMutation,
} from '../hooks';
import type { BrandTopUpDialogProps, TopUpRequestRecord } from '../types';
import { FormatNumber, FormatRupiah, ParseFormattedRupiah } from '../utils/wallet-format';

/**
 * Top-up modal dialog for brand accounts.
 * Provides custom amount formatting, unique code generation,
 * bank destination details, and transfer proof upload.
 *
 * @param props - Component properties.
 * @returns Rendered top-up dialog element.
 */
export function BrandTopUpDialog({
  open,
  onOpenChange,
  onTopUpSuccess,
  initialTopUp,
}: BrandTopUpDialogProps) {
  const [amount, setAmount] = useState<number>(1_000_000);
  const [inputValue, setInputValue] = useState<string>(FormatNumber(1_000_000));
  const [senderBank, setSenderBank] = useState<string>('');
  const [senderAccountName, setSenderAccountName] = useState<string>('');
  const [activeTopUp, setActiveTopUp] = useState<TopUpRequestRecord | null>(initialTopUp ?? null);
  const [prevInitialTopUp, setPrevInitialTopUp] = useState<TopUpRequestRecord | null | undefined>(initialTopUp);

  if (initialTopUp !== prevInitialTopUp) {
    setPrevInitialTopUp(initialTopUp);
    if (initialTopUp) {
      setActiveTopUp(initialTopUp);
    }
  }

  const [copiedField, setCopiedField] = useState<'account' | 'total' | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const createTopUpMutation = UseCreateTopUpMutation();
  const uploadProofMutation = UseUploadTopUpProofMutation();
  const submitProofMutation = UseSubmitTopUpProofMutation();

  const HandleAmountChange = (rawInput: string) => {
    const numericValue = ParseFormattedRupiah(rawInput);
    setAmount(numericValue);
    setInputValue(numericValue > 0 ? FormatNumber(numericValue) : '');
  };

  const HandleCreateTopUp = () => {
    if (amount < TOP_UP_LIMITS.MIN_AMOUNT || amount > TOP_UP_LIMITS.MAX_AMOUNT) {
      toast.error('Nominal top-up harus antara Rp 50.000 dan Rp 100.000.000.');
      return;
    }

    if (senderBank.trim().length < 2) {
      toast.error('Bank atau e-wallet pengirim wajib diisi (minimal 2 karakter).');
      return;
    }

    if (senderAccountName.trim().length < 2) {
      toast.error('Nama pemilik akun pengirim wajib diisi (minimal 2 karakter).');
      return;
    }

    createTopUpMutation.mutate(
      {
        amount,
        senderBank: senderBank.trim(),
        senderAccountName: senderAccountName.trim(),
      },
      {
        onSuccess: (data) => {
          setActiveTopUp(data);
          onTopUpSuccess?.();
        },
      },
    );
  };

  const HandleCopyText = (text: string, field: 'account' | 'total') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Berhasil disalin ke clipboard');
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const HandleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeTopUp) return;

    if (file.size > TOP_UP_LIMITS.MAX_PROOF_SIZE_BYTES) {
      toast.error('Ukuran file maksimal 5 MB.');
      return;
    }

    uploadProofMutation.mutate(
      { file },
      {
        onSuccess: (url) => {
          setActiveTopUp((prev) => (prev ? { ...prev, transferProofUrl: url } : null));
          toast.success('Bukti transfer berhasil diunggah.');
        },
      },
    );
  };

  const HandleConfirmSubmission = () => {
    if (!activeTopUp) return;

    submitProofMutation.mutate(
      {
        id: activeTopUp.id,
        payload: {
          transferProofUrl: activeTopUp.transferProofUrl || undefined,
        },
      },
      {
        onSuccess: () => {
          onTopUpSuccess?.();
          HandleClose();
        },
      },
    );
  };

  const HandleResetForm = () => {
    setActiveTopUp(null);
    setSenderBank('');
    setSenderAccountName('');
    setAmount(1_000_000);
    setInputValue(FormatNumber(1_000_000));
  };

  const HandleClose = () => {
    onOpenChange(false);
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }
    // Delay resetting internal form state until after the 150ms Radix exit animation completes
    resetTimerRef.current = setTimeout(() => {
      HandleResetForm();
      resetTimerRef.current = null;
    }, 200);
  };

  const HandleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      HandleClose();
    } else {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
        HandleResetForm();
      }
      onOpenChange(true);
    }
  };

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const isFormValid =
    amount >= TOP_UP_LIMITS.MIN_AMOUNT &&
    amount <= TOP_UP_LIMITS.MAX_AMOUNT &&
    senderBank.trim().length >= 2 &&
    senderAccountName.trim().length >= 2;

  const isReadOnly = Boolean(
    activeTopUp && (activeTopUp.status === 'SUBMITTED' || activeTopUp.status === 'APPROVED'),
  );

  return (
    <Dialog open={open} onOpenChange={HandleOpenChange}>
      <DialogContent className="max-w-lg p-6 sm:p-7">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {isReadOnly
              ? 'Detail Permintaan Top Up'
              : activeTopUp
              ? 'Instruksi Transfer Top Up'
              : 'Top Up Saldo Dompet'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isReadOnly
              ? 'Permintaan transfer telah terkirim dan sedang menunggu verifikasi oleh admin.'
              : activeTopUp
              ? 'Transfer tepat sesuai nominal yang tertera agar saldo aktif langsung bertambah.'
              : 'Isi nominal top-up saldo aktif untuk membiayai kampanye baru Anda.'}
          </DialogDescription>
        </DialogHeader>

        {!activeTopUp ? (
          /* Step 1: Input Form */
          <div className="space-y-5 pt-2">
            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="top-up-amount" className="text-xs font-medium text-foreground">
                Nominal Top Up (IDR) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                  Rp
                </span>
                <Input
                  id="top-up-amount"
                  value={inputValue}
                  onChange={(e) => HandleAmountChange(e.target.value)}
                  placeholder="50.000"
                  className="pl-10 text-base font-semibold tracking-tight"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Minimal top up Rp 50.000
              </p>
            </div>

            {/* Required Sender Info */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sender-bank" className="text-xs font-medium text-foreground">
                  Bank atau E-Wallet Pengirim <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sender-bank"
                  value={senderBank}
                  onChange={(e) => setSenderBank(e.target.value)}
                  placeholder="Contoh: BCA, Mandiri, GoPay, OVO, Dana"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sender-name" className="text-xs font-medium text-foreground">
                  Nama Pemilik Akun <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sender-name"
                  value={senderAccountName}
                  onChange={(e) => setSenderAccountName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="text-xs"
                />
              </div>
            </div>

            {/* Destination Info Card */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Bank Tujuan:</span>
                <span className="font-semibold text-foreground">
                  {KLIPDAY_DESTINATION_BANK.bankName} (Manual Transfer)
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Atas Nama:</span>
                <span className="font-medium text-foreground">
                  {KLIPDAY_DESTINATION_BANK.accountHolderName}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={HandleClose}
                className="cursor-pointer text-xs">
                Batal
              </Button>
              <Button
                type="button"
                size="default"
                onClick={HandleCreateTopUp}
                disabled={!isFormValid || createTopUpMutation.isPending}
                className="cursor-pointer font-medium">
                {createTopUpMutation.isPending ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-1.5 size-4" />
                )}
                Lanjutkan Pembayaran
              </Button>
            </div>
          </div>
        ) : (
          /* Step 2: Confirmation & Instructions */
          <div className="space-y-5 pt-1">
            {/* Total Payable Hero Section (Neutral, High-Contrast, No Clunky Box) */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Total yang Harus Ditransfer
                </span>
                <div className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl tabular-nums">
                  {FormatRupiah(activeTopUp.totalPayable)}
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => HandleCopyText(String(activeTopUp.totalPayable), 'total')}
                className="self-start sm:self-center cursor-pointer text-xs h-8">
                {copiedField === 'total' ? (
                  <Check className="mr-1.5 size-3.5 text-emerald-600" />
                ) : (
                  <Copy className="mr-1.5 size-3.5" />
                )}
                Salin Nominal
              </Button>
            </div>

            {/* Flat Transfer Destination Specification (Clean Hairline Dividers) */}
            <div className="divide-y divide-border/40 border-y border-border/40 text-xs">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-muted-foreground">Bank Tujuan</span>
                <span className="font-medium text-foreground">
                  {activeTopUp.destinationBank} (Transfer Bank)
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="text-muted-foreground">Nomor Rekening</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold tracking-wider text-foreground">
                    {activeTopUp.destinationAccount}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => HandleCopyText(activeTopUp.destinationAccount, 'account')}
                    className="h-7 cursor-pointer px-2 text-xs text-muted-foreground hover:text-foreground">
                    {copiedField === 'account' ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    <span className="ml-1 sr-only sm:not-sr-only">Salin</span>
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="text-muted-foreground">Atas Nama</span>
                <span className="font-medium text-foreground">
                  {activeTopUp.destinationHolderName}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="text-muted-foreground">Kode Referensi</span>
                <span className="font-mono font-medium text-muted-foreground">
                  {activeTopUp.referenceCode}
                </span>
              </div>
            </div>

            {/* Proof Upload / Read-Only View */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor={isReadOnly ? undefined : 'proof-upload'}
                  className="text-xs font-medium text-foreground">
                  {isReadOnly ? 'Bukti Transfer' : 'Unggah Bukti Transfer'}
                </Label>
                {activeTopUp.transferProofUrl && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <Check className="size-3" />
                    Tersimpan
                  </span>
                )}
              </div>

              {isReadOnly ? (
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-medium text-foreground">
                      {activeTopUp.transferProofUrl
                        ? 'Bukti transfer berhasil diunggah'
                        : 'Menunggu verifikasi admin'}
                    </span>
                  </div>
                  {activeTopUp.transferProofUrl && (
                    <a
                      href={activeTopUp.transferProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-xs text-primary hover:underline cursor-pointer">
                      Lihat Berkas
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              ) : (
                <>
                  <label
                    htmlFor="proof-upload"
                    className={cn(
                      'flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground',
                      uploadProofMutation.isPending && 'pointer-events-none opacity-60',
                    )}>
                    {uploadProofMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : activeTopUp.transferProofUrl ? (
                      <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Upload className="size-4 text-muted-foreground" />
                    )}
                    <span>
                      {uploadProofMutation.isPending
                        ? 'Mengunggah bukti transfer...'
                        : activeTopUp.transferProofUrl
                        ? 'Bukti transfer berhasil diunggah'
                        : 'Pilih file gambar bukti transfer (JPG, PNG, WEBP)'}
                    </span>
                  </label>
                  <input
                    id="proof-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={HandleProofUpload}
                    className="hidden"
                  />
                </>
              )}
            </div>

            {activeTopUp.status === 'SUBMITTED' && (
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-700 dark:text-blue-400">
                <p className="font-medium">Bukti Transfer Telah Terkirim</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Permintaan top up Anda sedang diverifikasi oleh admin. Saldo akan otomatis bertambah setelah disetujui.
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={HandleClose}
                className="cursor-pointer text-xs">
                {activeTopUp.status === 'PENDING' ? 'Bayar Nanti' : 'Tutup'}
              </Button>

              {activeTopUp.status === 'PENDING' && (
                <Button
                  type="button"
                  variant="default"
                  size="default"
                  onClick={HandleConfirmSubmission}
                  disabled={submitProofMutation.isPending}
                  className="cursor-pointer font-medium text-xs">
                  {submitProofMutation.isPending ? (
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                  ) : (
                    <Check className="mr-1.5 size-4" />
                  )}
                  Saya Sudah Transfer
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
