import { useState, useRef } from 'react';
import { Check, Copy, Loader2, SendHorizontal, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrandBankCombobox } from '@/features/brand/components';
import { SUPPORTED_EWALLETS } from '@/features/brand/constants';
import { UseBrandPayoutAccountsQuery } from '@/features/brand/hooks';
import type { BrandPayoutAccount } from '@/features/brand/types';
import { cn } from '@/lib/utils';
import { UploadPaymentProof } from '../api';
import { UseConfirmBankTransferPaymentMutation } from '../hooks';
import type { CampaignPaymentTransferOptionProps } from '../types';
import { FormatRupiah } from '../utils';
import { CampaignPaymentSenderAssistant } from './CampaignPaymentSenderAssistant';

/**
 * Manual bank transfer payment option component for Step 6 of campaign wizard.
 * Displays Klipday destination account, unique code, total payable, and handles receipt upload.
 *
 * @param props - Component properties containing campaignId, totalPayable, uniqueCode, and bankDetails.
 * @returns The rendered manual bank transfer payment component.
 */
export function CampaignPaymentTransferOption({
  campaignId,
  totalPayable,
  uniqueCode: _uniqueCode,
  bankDetails,
  existingPayment,
  className,
  onPaymentSuccess,
}: CampaignPaymentTransferOptionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [senderProviderName, setSenderProviderName] = useState(existingPayment?.senderProviderName ?? '');
  const [senderAccountName, setSenderAccountName] = useState(existingPayment?.senderAccountName ?? '');
  const [transferProofUrl, setTransferProofUrl] = useState(existingPayment?.transferProofUrl ?? '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copiedField, setCopiedField] = useState<'account' | 'amount' | null>(null);

  const initialIsEwallet = Boolean(
    existingPayment?.senderProviderName &&
      SUPPORTED_EWALLETS.some(
        (wallet) =>
          wallet.code.toUpperCase() === existingPayment.senderProviderName?.toUpperCase() ||
          wallet.name.toUpperCase() === existingPayment.senderProviderName?.toUpperCase(),
      ),
  );
  const [accountType, setAccountType] = useState<'BANK_TRANSFER' | 'E_WALLET'>(
    initialIsEwallet ? 'E_WALLET' : 'BANK_TRANSFER',
  );

  const { data: payoutAccounts = [] } = UseBrandPayoutAccountsQuery();
  const availableKycAccounts = payoutAccounts.filter(
    (acc) => acc.verificationStatus !== 'REJECTED',
  );

  const HandleSelectQuickAccount = (account: BrandPayoutAccount) => {
    setAccountType(account.accountType);
    setSenderProviderName(account.provider);
    setSenderAccountName(account.accountHolderName);
    toast.success(
      `Data pengirim otomatis diisi dari ${account.provider} (a.n. ${account.accountHolderName}).`,
    );
  };

  const HandleAccountTypeChange = (type: 'BANK_TRANSFER' | 'E_WALLET') => {
    if (type === accountType) return;
    setAccountType(type);
    const isCurrentEwallet = SUPPORTED_EWALLETS.some(
      (wallet) =>
        wallet.code.toUpperCase() === senderProviderName.toUpperCase() ||
        wallet.name.toUpperCase() === senderProviderName.toUpperCase(),
    );
    if (type === 'BANK_TRANSFER' && isCurrentEwallet) {
      setSenderProviderName('');
    } else if (type === 'E_WALLET' && !isCurrentEwallet && senderProviderName) {
      setSenderProviderName('');
    }
  };

  const confirmMutation = UseConfirmBankTransferPaymentMutation(campaignId, {
    onSuccess: () => {
      onPaymentSuccess?.();
    },
  });

  const isPending = confirmMutation.isPending || isUploading;
  const canSubmit = Boolean(senderProviderName.trim() && senderAccountName.trim() && transferProofUrl && !isPending);

  const HandleCopy = async (text: string, field: 'account' | 'amount') => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedField(field);
      toast.success(field === 'account' ? 'Nomor rekening berhasil disalin.' : 'Nominal transfer berhasil disalin.');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Gagal menyalin teks ke clipboard.');
    }
  };

  const HandleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Format berkas tidak didukung. Harap unggah berkas JPG, PNG, atau WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran berkas maksimal 5MB.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const publicUrl = await UploadPaymentProof(campaignId, file, (percent) => {
        setUploadProgress(percent);
      });
      setTransferProofUrl(publicUrl);
      toast.success('Bukti transfer berhasil diunggah.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengunggah bukti transfer.';
      toast.error(message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const HandleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    const trimmedProvider = senderProviderName.trim();
    const trimmedAccount = senderAccountName.trim();

    confirmMutation.mutate({
      senderProviderName: trimmedProvider,
      senderAccountName: trimmedAccount,
      transferProofUrl,
    });
  };

  return (
    <form onSubmit={HandleSubmit} className={cn('space-y-6', className)}>
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden divide-y divide-border/40 shadow-xs">
        {/* ROW 1: TOTAL AMOUNT TO TRANSFER */}
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/15">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Total yang Harus Ditransfer</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground font-mono tabular-nums">
                {FormatRupiah(totalPayable)}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => HandleCopy(String(totalPayable), 'amount')}
            className="gap-2 shrink-0 self-start sm:self-center border-border/60 hover:bg-muted text-xs font-medium">
            {copiedField === 'amount' ? (
              <>
                <Check className="size-3.5 text-emerald-500" />
                Nominal Tersalin
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                Salin Nominal
              </>
            )}
          </Button>
        </div>

        {/* ROW 2: DESTINATION ACCOUNT */}
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Rekening Tujuan</span>
              <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                • {bankDetails.bankName}
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold tracking-wider text-foreground font-mono">
              {bankDetails.accountNo}
            </p>
            <p className="text-xs text-muted-foreground">a.n. {bankDetails.accountName}</p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => HandleCopy(bankDetails.accountNo, 'account')}
            className="gap-2 shrink-0 self-start sm:self-center border-border/60 hover:bg-muted text-xs font-medium">
            {copiedField === 'account' ? (
              <>
                <Check className="size-3.5 text-emerald-500" />
                Rekening Tersalin
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                Salin Rekening
              </>
            )}
          </Button>
        </div>

        {/* ROW 3: SENDER DETAILS & RECEIPT PROOF FORM */}
        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Konfirmasi Pengirim & Bukti Transfer
            </h4>
            <span className="text-[11px] text-muted-foreground">
              Transfer dapat dilakukan dari rekening bank atau e-wallet mana saja
            </span>
          </div>

          {/* Smart Assistant: Quick-select from registered KYC accounts */}
          {availableKycAccounts.length > 0 ? (
            <CampaignPaymentSenderAssistant
              accounts={availableKycAccounts}
              selectedProvider={senderProviderName}
              selectedAccountName={senderAccountName}
              onSelectAccount={HandleSelectQuickAccount}
              disabled={isPending}
            />
          ) : null}

          {/* Segmented Edge-to-Edge Control: Bank Transfer vs E-Wallet */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Metode Transfer Pengirim</Label>
            <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-border/70 p-0 divide-x divide-border/60 bg-muted/20">
              <button
                type="button"
                onClick={() => HandleAccountTypeChange('BANK_TRANSFER')}
                disabled={isPending}
                className={cn(
                  'flex items-center justify-center py-2.5 text-xs font-medium transition-colors cursor-pointer first:rounded-l-xl',
                  accountType === 'BANK_TRANSFER'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  isPending && 'opacity-50 cursor-not-allowed',
                )}>
                <span>Transfer Bank</span>
              </button>
              <button
                type="button"
                onClick={() => HandleAccountTypeChange('E_WALLET')}
                disabled={isPending}
                className={cn(
                  'flex items-center justify-center py-2.5 text-xs font-medium transition-colors cursor-pointer last:rounded-r-xl',
                  accountType === 'E_WALLET'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  isPending && 'opacity-50 cursor-not-allowed',
                )}>
                <span>E-Wallet</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="senderProviderName" className="text-xs font-medium text-foreground">
                {accountType === 'BANK_TRANSFER' ? 'Bank Pengirim' : 'E-Wallet Pengirim'}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <BrandBankCombobox
                id="senderProviderName"
                accountType={accountType}
                value={senderProviderName}
                onChange={(val) => setSenderProviderName(val)}
                disabled={isPending}
                className="h-10 rounded-xl border-border/60 bg-background text-xs"
                placeholder={
                  accountType === 'BANK_TRANSFER'
                    ? 'Pilih Bank Pengirim'
                    : 'Pilih E-Wallet Pengirim'
                }
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="senderAccountName" className="text-xs font-medium text-foreground">
                  Nama Pemilik Rekening Pengirim <span className="text-destructive">*</span>
                </Label>
                <span className="text-[10px] text-muted-foreground">Dapat diedit</span>
              </div>
              <Input
                id="senderAccountName"
                placeholder="Nama sesuai pada buku tabungan / akun pengirim"
                value={senderAccountName}
                onChange={(e) => setSenderAccountName(e.target.value)}
                disabled={isPending}
                required
                className="h-10 rounded-xl border-border/60 bg-background text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Receipt Proof Upload Zone */}
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs font-medium text-foreground">
              Bukti Transfer Bank <span className="text-destructive">*</span>
            </Label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={HandleFileChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />

            {transferProofUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-border/60 bg-muted/20 p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border/40 bg-muted">
                    <img src={transferProofUrl} alt="Bukti Transfer" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                      <Check className="size-3.5" />
                      Bukti transfer siap diajukan
                    </div>
                    <a
                      href={transferProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-muted-foreground hover:text-foreground underline truncate block">
                      Lihat Gambar Asli
                    </a>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0 text-xs">
                    Ganti Berkas
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => !isPending && fileInputRef.current?.click()}
                className={cn(
                  'flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/10 p-6 text-center cursor-pointer transition-colors',
                  'hover:border-foreground/30 hover:bg-muted/20',
                  isPending && 'opacity-60 cursor-not-allowed'
                )}>
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Mengunggah bukti transfer ({uploadProgress}%)...</span>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="size-5 text-muted-foreground mb-2" />
                    <p className="text-xs font-medium text-foreground">Klik untuk mengunggah bukti transfer</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">JPG, PNG, atau WEBP (Maksimal 5MB)</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SUBMISSION FOOTER */}
      <div className="flex justify-end pt-1">
        <Button type="submit" disabled={!canSubmit} className="gap-2 font-semibold min-w-44 h-10 shadow-xs">
          {confirmMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Mengirim Bukti...
            </>
          ) : (
            <>
              <SendHorizontal className="size-4" />
              Konfirmasi Pembayaran
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
