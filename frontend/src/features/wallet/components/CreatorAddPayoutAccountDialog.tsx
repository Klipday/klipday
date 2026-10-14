import { useRef, useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { CREATOR_ACCOUNT_VALIDATION_RULES, CREATOR_PAYOUT_PROVIDERS } from '../constants';
import {
  UseCreateCreatorPayoutAccountMutation,
  UseUploadCreatorPayoutProofMutation,
} from '../hooks';
import type { CreatorAddPayoutAccountDialogProps } from '../types';

/**
 * Dialog for creators to register a new bank account or e-wallet destination for payouts.
 * Includes format validation according to provider rules and image upload for proof.
 *
 * @param props - Component configuration properties.
 * @returns Rendered dialog element.
 */
export function CreatorAddPayoutAccountDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreatorAddPayoutAccountDialogProps) {
  const [accountType, setAccountType] = useState<'E_WALLET' | 'BANK_TRANSFER'>('E_WALLET');
  const [provider, setProvider] = useState<string>('DANA');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountHolderName, setAccountHolderName] = useState<string>('');
  const [proofUrl, setProofUrl] = useState<string>('');
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isPrimary, setIsPrimary] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMutation = UseCreateCreatorPayoutAccountMutation();
  const uploadProofMutation = UseUploadCreatorPayoutProofMutation();

  const currentRule = CREATOR_ACCOUNT_VALIDATION_RULES[provider];

  const HandleAccountTypeChange = (type: 'E_WALLET' | 'BANK_TRANSFER') => {
    setAccountType(type);
    const firstProvider = CREATOR_PAYOUT_PROVIDERS.find((p) => p.type === type);
    if (firstProvider) {
      setProvider(firstProvider.value);
    }
  };

  const HandleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran berkas bukti maksimal 5 MB.');
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setProofPreviewUrl(localPreview);
    setUploadProgress(15);

    uploadProofMutation.mutate(
      {
        file,
        onProgress: (percent) => setUploadProgress(percent),
      },
      {
        onSuccess: (url) => {
          setProofUrl(url);
          setUploadProgress(100);
          toast.success('Bukti akun penarikan berhasil diunggah.');
        },
        onError: () => {
          setProofPreviewUrl('');
          setUploadProgress(0);
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
      },
    );
  };

  const HandleClearProof = () => {
    setProofUrl('');
    setProofPreviewUrl('');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const HandleResetForm = () => {
    setAccountType('E_WALLET');
    setProvider('DANA');
    setAccountNumber('');
    setAccountHolderName('');
    setProofUrl('');
    setProofPreviewUrl('');
    setUploadProgress(0);
    setIsPrimary(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const HandleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanNumber = accountNumber.trim();
    const cleanHolder = accountHolderName.trim();

    if (!cleanNumber) {
      toast.error('Nomor rekening atau nomor HP e-wallet wajib diisi.');
      return;
    }

    if (currentRule && !currentRule.regex.test(cleanNumber)) {
      toast.error(currentRule.description);
      return;
    }

    if (!cleanHolder || cleanHolder.length < 2) {
      toast.error('Nama pemilik akun wajib diisi (minimal 2 karakter).');
      return;
    }

    if (!proofUrl) {
      toast.error('Foto buku tabungan atau tangkapan layar akun wajib diunggah.');
      return;
    }

    createMutation.mutate(
      {
        accountType,
        provider,
        accountNumber: cleanNumber,
        accountHolderName: cleanHolder,
        proofUrl,
        isPrimary,
      },
      {
        onSuccess: () => {
          HandleResetForm();
          onOpenChange(false);
          onSuccess?.();
        },
      },
    );
  };

  const filteredProviders = CREATOR_PAYOUT_PROVIDERS.filter((p) => p.type === accountType);

  const isFormValid =
    Boolean(accountNumber.trim()) &&
    Boolean(accountHolderName.trim().length >= 2) &&
    Boolean(proofUrl) &&
    (!currentRule || currentRule.regex.test(accountNumber.trim())) &&
    !uploadProofMutation.isPending &&
    !createMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) HandleResetForm();
        onOpenChange(nextOpen);
      }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Tambah Rekening / E-Wallet
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Pastikan data dan bukti kepemilikan akun sesuai untuk mempercepat proses verifikasi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={HandleSubmit} className="space-y-4 pt-1">
          {/* Segmented control: E-Wallet vs Bank Transfer */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Jenis Akun</Label>
            <div className="grid grid-cols-2 rounded-xl border border-border/60 bg-muted/20 p-0 overflow-hidden divide-x divide-border/40">
              <button
                type="button"
                onClick={() => HandleAccountTypeChange('E_WALLET')}
                className={cn(
                  'py-2 text-xs font-medium transition-colors cursor-pointer',
                  accountType === 'E_WALLET'
                    ? 'bg-card text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:bg-muted/40',
                )}>
                E-Wallet (DANA/GoPay)
              </button>
              <button
                type="button"
                onClick={() => HandleAccountTypeChange('BANK_TRANSFER')}
                className={cn(
                  'py-2 text-xs font-medium transition-colors cursor-pointer',
                  accountType === 'BANK_TRANSFER'
                    ? 'bg-card text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:bg-muted/40',
                )}>
                Transfer Bank
              </button>
            </div>
          </div>

          {/* Provider Select */}
          <div className="space-y-1.5">
            <Label htmlFor="creator-provider" className="text-xs font-medium text-foreground">
              {accountType === 'E_WALLET' ? 'Penyedia E-Wallet' : 'Bank'}
            </Label>
            <Select value={provider} onValueChange={(val) => setProvider(val)}>
              <SelectTrigger
                id="creator-provider"
                className="h-10 rounded-xl border-border/60 bg-card text-xs cursor-pointer">
                <SelectValue placeholder="Pilih Penyedia" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/60 text-xs">
                {filteredProviders.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="cursor-pointer py-2 text-xs">
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Account Number / Phone Number */}
          <div className="space-y-1.5">
            <Label htmlFor="creator-account-number" className="text-xs font-medium text-foreground">
              {accountType === 'E_WALLET' ? 'Nomor HP E-Wallet' : 'Nomor Rekening'}
            </Label>
            <Input
              id="creator-account-number"
              type="text"
              placeholder={currentRule?.example || '1234567890'}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="h-10 rounded-xl border-border/60 font-mono text-xs"
            />
            {currentRule && (
              <p className="text-[11px] text-muted-foreground leading-tight">
                {currentRule.description} (Contoh: {currentRule.example})
              </p>
            )}
          </div>

          {/* Account Holder Name */}
          <div className="space-y-1.5">
            <Label htmlFor="creator-holder-name" className="text-xs font-medium text-foreground">
              Nama Lengkap Pemilik Akun
            </Label>
            <Input
              id="creator-holder-name"
              type="text"
              placeholder="Sesuai nama profil e-wallet atau buku tabungan"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              className="h-10 rounded-xl border-border/60 text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Harap pastikan ejaan nama sama persis dengan yang tertera di rekening atau e-wallet.
            </p>
          </div>

          {/* Proof Upload */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              {accountType === 'E_WALLET'
                ? 'Tangkapan Layar Profil E-Wallet'
                : 'Foto Buku Tabungan / M-Banking'}
            </Label>

            {proofPreviewUrl ? (
              <div className="relative rounded-xl border border-border/60 bg-muted/20 p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <img
                    src={proofPreviewUrl}
                    alt="Bukti Akun"
                    className="size-12 rounded-lg object-cover border border-border/40 shrink-0"
                  />
                  <div className="space-y-0.5 overflow-hidden">
                    <p className="text-xs font-medium text-foreground truncate">
                      {proofUrl ? 'Bukti berhasil diunggah' : 'Mengunggah...'}
                    </p>
                    {uploadProgress < 100 && (
                      <p className="text-[10px] text-muted-foreground">{uploadProgress}% selesai</p>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={HandleClearProof}
                  className="size-7 text-muted-foreground hover:text-destructive cursor-pointer">
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/10 p-5 text-center cursor-pointer hover:bg-muted/20 transition-colors">
                <Upload className="size-6 text-muted-foreground mb-1" />
                <p className="text-xs font-medium text-foreground">
                  Klik untuk unggah foto bukti
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Format JPG, PNG, atau WEBP (Maksimal 5 MB)
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={HandleFileSelect}
              className="hidden"
            />
          </div>

          {/* Primary Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="creator-is-primary"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="size-4 rounded border-border/80 text-primary cursor-pointer accent-primary"
            />
            <Label
              htmlFor="creator-is-primary"
              className="text-xs font-medium text-foreground cursor-pointer">
              Jadikan sebagai akun penarikan utama
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending || uploadProofMutation.isPending}
              className="cursor-pointer text-xs font-medium">
              Batal
            </Button>
            <Button
              type="submit"
              size="default"
              disabled={!isFormValid}
              className="cursor-pointer text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90">
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Mendaftarkan...
                </>
              ) : (
                'Simpan Akun'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
