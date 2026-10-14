import { useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Upload,
  X,
} from 'lucide-react';
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
import { BrandBankCombobox } from './BrandBankCombobox';
import {
  BRAND_LIMITS,
  PROVIDER_ACCOUNT_RULES,
} from '../constants';
import {
  UseCreateBrandPayoutAccountMutation,
  UseUploadBrandPayoutProofMutation,
} from '../hooks';
import {
  PayoutAccountFormSchema,
  type PayoutAccountFormValues,
} from '../schemas/brand.schemas';
import type { AddPayoutAccountDialogProps } from '../types';

/**
 * Modal dialog for registering a new payout account (Bank Transfer or E-Wallet)
 * along with passbook or m-banking ownership proof photo upload.
 *
 * @param props - Component properties.
 * @returns The rendered modal dialog element.
 */
export function AddPayoutAccountDialog({
  open,
  onOpenChange,
  existingAccountsCount,
}: AddPayoutAccountDialogProps) {
  const [accountType, setAccountType] = useState<'BANK_TRANSFER' | 'E_WALLET'>('BANK_TRANSFER');
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createAccountMutation = UseCreateBrandPayoutAccountMutation();
  const uploadProofMutation = UseUploadBrandPayoutProofMutation();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PayoutAccountFormValues>({
    resolver: zodResolver(PayoutAccountFormSchema),
    defaultValues: {
      accountType: 'BANK_TRANSFER',
      provider: 'BCA',
      accountNumber: '',
      accountHolderName: '',
      proofUrl: '',
      isPrimary: existingAccountsCount === 0,
    },
  });

  const currentProvider = useWatch({ control, name: 'provider' }) || (accountType === 'BANK_TRANSFER' ? 'BCA' : 'GOPAY');
  const providerRule = PROVIDER_ACCOUNT_RULES[currentProvider.toUpperCase()];

  const HandleAccountTypeChange = (type: 'BANK_TRANSFER' | 'E_WALLET') => {
    setAccountType(type);
    setValue('accountType', type);
    setValue('provider', type === 'BANK_TRANSFER' ? 'BCA' : 'GOPAY');
  };

  const HandleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > BRAND_LIMITS.MAX_PROOF_SIZE_BYTES) {
      toast.error('Ukuran berkas bukti maksimal 5 MB.');
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setProofPreviewUrl(localPreview);
    setUploadProgress(10);

    uploadProofMutation.mutate(
      {
        file,
        onProgress: (percent) => setUploadProgress(percent),
      },
      {
        onSuccess: (publicUrl) => {
          setValue('proofUrl', publicUrl, { shouldValidate: true });
          setUploadProgress(100);
          toast.success('Foto bukti rekening berhasil diunggah.');
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
    setProofPreviewUrl('');
    setValue('proofUrl', '', { shouldValidate: true });
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const HandleResetForm = () => {
    reset({
      accountType: 'BANK_TRANSFER',
      provider: 'BCA',
      accountNumber: '',
      accountHolderName: '',
      proofUrl: '',
      isPrimary: false,
    });
    setAccountType('BANK_TRANSFER');
    setProofPreviewUrl('');
    setUploadProgress(0);
  };

  const OnSubmit = (values: PayoutAccountFormValues) => {
    createAccountMutation.mutate(
      {
        accountType: values.accountType,
        provider: values.provider,
        accountNumber: values.accountNumber.trim(),
        accountHolderName: values.accountHolderName.trim(),
        proofUrl: values.proofUrl,
        isPrimary: values.isPrimary,
      },
      {
        onSuccess: () => {
          HandleResetForm();
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) HandleResetForm();
        onOpenChange(nextOpen);
      }}>
      <DialogContent className="sm:max-w-lg p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1 pb-1">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Tambah Akun Penarikan Saldo
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Daftarkan rekening bank atau e-wallet untuk mencairkan saldo dompet brand Anda.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(OnSubmit)} className="space-y-5 pt-2">
          {/* Segmented Edge-to-Edge Control: Bank Transfer vs E-Wallet (Text-only, no decorative icons) */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Jenis Akun Penarikan</Label>
            <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-border/70 p-0 divide-x divide-border/60 bg-muted/20">
              <button
                type="button"
                onClick={() => HandleAccountTypeChange('BANK_TRANSFER')}
                className={cn(
                  'flex items-center justify-center py-2.5 text-xs font-medium transition-colors cursor-pointer first:rounded-l-xl',
                  accountType === 'BANK_TRANSFER'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}>
                <span>Transfer Bank</span>
              </button>
              <button
                type="button"
                onClick={() => HandleAccountTypeChange('E_WALLET')}
                className={cn(
                  'flex items-center justify-center py-2.5 text-xs font-medium transition-colors cursor-pointer last:rounded-r-xl',
                  accountType === 'E_WALLET'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}>
                <span>E-Wallet</span>
              </button>
            </div>
          </div>

          {/* Provider Selection Dropdown */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              {accountType === 'BANK_TRANSFER' ? 'Pilih Bank' : 'Pilih E-Wallet'}
            </Label>
            <Controller
              control={control}
              name="provider"
              render={({ field }) => (
                <BrandBankCombobox
                  accountType={accountType}
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                  hasError={Boolean(errors.provider)}
                />
              )}
            />
            {errors.provider ? (
              <p className="text-[11px] text-destructive">{errors.provider.message}</p>
            ) : null}
          </div>

          {/* Account Number & Account Holder Name */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="accountNumber" className="text-xs font-medium">
                {accountType === 'BANK_TRANSFER' ? 'Nomor Rekening' : 'Nomor HP E-Wallet'}
              </Label>
              <Input
                id="accountNumber"
                type="text"
                inputMode="numeric"
                {...register('accountNumber')}
                placeholder={providerRule?.example ?? (accountType === 'BANK_TRANSFER' ? '1234567890' : '081234567890')}
                className="h-10 text-xs font-mono rounded-xl"
              />
              {errors.accountNumber ? (
                <p className="text-[11px] text-destructive">{errors.accountNumber.message}</p>
              ) : providerRule?.description ? (
                <p className="text-[10px] text-muted-foreground">{providerRule.description}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="accountHolderName" className="text-xs font-medium">
                Nama Pemilik Akun
              </Label>
              <Input
                id="accountHolderName"
                type="text"
                {...register('accountHolderName')}
                placeholder="Sesuai buku tabungan / KTP"
                className="h-10 text-xs rounded-xl"
              />
              {errors.accountHolderName ? (
                <p className="text-[11px] text-destructive">{errors.accountHolderName.message}</p>
              ) : null}
            </div>
          </div>

          {/* Proof upload file section */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">
              Foto Bukti Rekening (Buku Tabungan / Screenshot Profil E-Wallet)
            </Label>

            {proofPreviewUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-border/60 bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={proofPreviewUrl}
                      alt="Pratinjau bukti rekening"
                      className="size-14 rounded-lg object-cover ring-1 ring-border/40"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                        <span>Foto Berhasil Diunggah</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {uploadProofMutation.isPending ? 'Sedang memproses...' : 'Siap diverifikasi'}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={HandleClearProof}
                    className="size-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                    aria-label="Hapus foto bukti">
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/70 bg-muted/10 p-5 text-center transition-colors cursor-pointer hover:border-primary/50 hover:bg-muted/20',
                  uploadProofMutation.isPending && 'pointer-events-none opacity-60',
                )}>
                {uploadProofMutation.isPending ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <span className="text-xs font-medium text-foreground">
                      Mengunggah berkas ({uploadProgress}%)...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex size-10 items-center justify-center rounded-xl bg-muted/40 mb-2">
                      <Upload className="size-5 text-muted-foreground" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">
                      Klik untuk mengunggah foto bukti
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      JPG, PNG, atau WEBP (Maksimal 5 MB)
                    </span>
                  </>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={HandleFileSelect}
              className="hidden"
            />

            {errors.proofUrl ? (
              <p className="text-[11px] text-destructive">{errors.proofUrl.message}</p>
            ) : null}
          </div>

          {/* Calm verification notice banner */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 text-xs text-muted-foreground">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="size-4 shrink-0 text-muted-foreground mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Akun akan diverifikasi oleh Admin Klipday dalam 1x24 jam kerja sebelum dapat digunakan untuk penarikan saldo.
              </p>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => onOpenChange(false)}
              disabled={createAccountMutation.isPending || uploadProofMutation.isPending}
              className="cursor-pointer text-xs">
              Batal
            </Button>
            <Button
              type="submit"
              size="default"
              disabled={createAccountMutation.isPending || uploadProofMutation.isPending}
              className="cursor-pointer font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs">
              {createAccountMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  <span>Mendaftarkan...</span>
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 size-4" />
                  <span>Daftarkan Akun</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
