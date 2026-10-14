import { useEffect, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useLocation } from 'react-router';
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
import { UseCurrentAccountQuery } from '@/features/authentication/hooks';
import {
  UseCreateBrandPayoutAccountMutation,
  UseUploadBrandPayoutProofMutation,
} from '@/features/brand/hooks';
import { cn } from '@/lib/utils';
import { BankCombobox } from './BankCombobox';
import {
  PAYOUT_ACCOUNT_LIMITS,
  PROVIDER_ACCOUNT_RULES,
} from '../constants';
import {
  UseCreateCreatorPayoutAccountMutation,
  UseUploadCreatorPayoutProofMutation,
} from '../hooks';
import {
  PayoutAccountFormSchema,
  type PayoutAccountFormValues,
} from '../schemas/payout-account.schemas';
import type { AddPayoutAccountDialogProps } from '../types';
import {
  BuildCreatePayoutAccountPayload,
  GetAccountTypeDefaultProvider,
  GetDefaultPayoutAccountFormValues,
  ResolveEffectiveRole,
  RevokeObjectUrl,
} from '../utils/payout-account.utils';

/**
 * Single unified modal dialog for registering a new payout account (Bank Transfer or E-Wallet)
 * along with passbook or m-banking ownership proof photo upload.
 * Shared by both Brand and Creator tenants with 100% identical styling, tabs, and layout.
 *
 * @param props - Dialog visibility, change handlers, existing count, optional role, and success callback.
 * @returns The rendered modal dialog element.
 */
export function AddPayoutAccountDialog({
  open,
  onOpenChange,
  existingAccountsCount,
  onSuccess,
  role,
}: AddPayoutAccountDialogProps) {
  const [accountType, setAccountType] = useState<'BANK_TRANSFER' | 'E_WALLET'>('BANK_TRANSFER');
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const location = useLocation();
  const { data: accountProfile } = UseCurrentAccountQuery();
  const effectiveRole = ResolveEffectiveRole(role, accountProfile?.role, location.pathname);
  const isCreator = effectiveRole === 'CREATOR';

  // Instantiate hooks unconditionally at top level adhering to React rules of hooks
  const createBrandAccountMutation = UseCreateBrandPayoutAccountMutation();
  const uploadBrandProofMutation = UseUploadBrandPayoutProofMutation();
  const createCreatorAccountMutation = UseCreateCreatorPayoutAccountMutation();
  const uploadCreatorProofMutation = UseUploadCreatorPayoutProofMutation();

  const createAccountMutation = isCreator ? createCreatorAccountMutation : createBrandAccountMutation;
  const uploadProofMutation = isCreator ? uploadCreatorProofMutation : uploadBrandProofMutation;

  const formResolver = zodResolver(PayoutAccountFormSchema);
  const initialFormValues = GetDefaultPayoutAccountFormValues(existingAccountsCount);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm<PayoutAccountFormValues>({
    resolver: formResolver,
    defaultValues: initialFormValues,
  });

  // Cleanup local preview blob URL on unmount
  useEffect(() => {
    return () => {
      RevokeObjectUrl(proofPreviewUrl);
    };
  }, [proofPreviewUrl]);

  // Reset file input value when dialog closes
  useEffect(() => {
    if (!open && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [open]);

  const watchedProvider = useWatch({ control, name: 'provider' });
  const fallbackProvider = GetAccountTypeDefaultProvider(accountType);
  const currentProvider = watchedProvider || fallbackProvider;
  const providerRule = PROVIDER_ACCOUNT_RULES[currentProvider.toUpperCase()];

  const HandleAccountTypeChange = (type: 'BANK_TRANSFER' | 'E_WALLET') => {
    setAccountType(type);
    setValue('accountType', type);
    const defaultProvider = GetAccountTypeDefaultProvider(type);
    setValue('provider', defaultProvider);
    setValue('accountNumber', '');
    clearErrors('accountNumber');
  };

  const HandleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > PAYOUT_ACCOUNT_LIMITS.MAX_PROOF_SIZE_BYTES) {
      toast.error('Ukuran berkas bukti maksimal 5 MB.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    RevokeObjectUrl(proofPreviewUrl);
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
          RevokeObjectUrl(localPreview);
          setProofPreviewUrl('');
          setUploadProgress(0);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
      },
    );
  };

  const HandleClearProof = () => {
    RevokeObjectUrl(proofPreviewUrl);
    setProofPreviewUrl('');
    setValue('proofUrl', '', { shouldValidate: true });
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const HandleResetForm = () => {
    const resetValues = GetDefaultPayoutAccountFormValues(existingAccountsCount);
    reset(resetValues);
    setAccountType('BANK_TRANSFER');
    RevokeObjectUrl(proofPreviewUrl);
    setProofPreviewUrl('');
    setUploadProgress(0);
  };

  const OnSubmit = (values: PayoutAccountFormValues) => {
    const payload = BuildCreatePayoutAccountPayload(values);

    createAccountMutation.mutate(payload, {
      onSuccess: () => {
        HandleResetForm();
        onOpenChange(false);
        onSuccess?.();
      },
    });
  };

  const isSubmittingOrUploading = createAccountMutation.isPending || uploadProofMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          if (isSubmittingOrUploading) return;
          HandleResetForm();
        }
        onOpenChange(nextOpen);
      }}>
      <DialogContent
        onPointerDownOutside={(e) => {
          if (isSubmittingOrUploading) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isSubmittingOrUploading) e.preventDefault();
        }}
        className="sm:max-w-lg p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1 pb-1">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Tambah Akun Penarikan Saldo
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Daftarkan rekening bank atau e-wallet untuk mencairkan saldo dompet Anda.
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
                <BankCombobox
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
              disabled={isSubmittingOrUploading}
              className="cursor-pointer text-xs">
              Batal
            </Button>
            <Button
              type="submit"
              size="default"
              disabled={isSubmittingOrUploading}
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
