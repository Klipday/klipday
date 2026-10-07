import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CampaignThumbnailUpload } from './CampaignThumbnailUpload';
import { CampaignUnsavedChangesDialog } from './CampaignUnsavedChangesDialog';
import { FieldLengthTracker } from './FieldLengthTracker';
import { WizardFormActions } from './WizardFormActions';
import { SanitizeHttpUrl } from '@/lib/utils';
import { UseCampaignWizardContext, UseEditCampaignMutation, UseUnsavedChangesGuard } from '../hooks';
import {
  basicInfoSchema,
  type BasicInfoFormValues,
  CAMPAIGN_CATEGORY_LABELS,
  CAMPAIGN_CATEGORY_OPTIONS,
  type CampaignCategoryOption,
  CAMPAIGN_PLATFORM_LABELS,
  CAMPAIGN_PLATFORM_OPTIONS,
  type CampaignPlatformOption,
  CAMPAIGN_TYPE_LABELS,
  CAMPAIGN_TYPE_OPTIONS,
  type CampaignTypeOption,
} from '../schemas';
import { GetInitialBasicInfo } from '../utils';

/**
 * Basic info form component for Step 1 of the campaign creation wizard.
 * Captures title, description, category, type, platform, thumbnail URL, and main media URL.
 * Connects directly to the campaign edit mutation and manages its own submission lifecycle.
 *
 * @returns The rendered basic info form element.
 */
export function CampaignFormStep1() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { campaign } = UseCampaignWizardContext();
  const editMutation = UseEditCampaignMutation(id, {
    nextStepSlug: 'step-2',
  });

  const initialValues = useMemo(() => GetInitialBasicInfo(campaign), [campaign]);

  const form = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: initialValues,
    values: initialValues,
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  /**
   * Handles form submission and dispatches to the edit campaign mutation.
   *
   * @param values - Validated form field values.
   */
  function HandleFormSubmit(values: BasicInfoFormValues) {
    if (!id) {
      toast.error('ID Kampanye tidak valid. Mengarahkan ke daftar kampanye...', {
        id: 'missing-campaign-id',
      });
      navigate('/brand-dashboard/brand-campaigns');
      return;
    }

    if (editMutation.isPending) {
      return;
    }

    editMutation.mutate(values, {
      onSuccess: () => {
        form.reset(values);
      },
    });
  }

  const isPending = editMutation.isPending || form.formState.isSubmitting;
  const isSaving = editMutation.isPending || editMutation.isSuccess;

  const { isBlocked, ConfirmNavigation, CancelNavigation } = UseUnsavedChangesGuard({
    isDirty: form.formState.isDirty,
    isSaving,
  });

  return (
    <form noValidate onSubmit={form.handleSubmit(HandleFormSubmit)} className="space-y-6">
      <FieldGroup>
        {/* Campaign Title */}
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor={field.name}>
                  Judul Kampanye <span className="text-destructive font-medium">*</span>
                </FieldLabel>
                <FieldLengthTracker current={(field.value ?? '').length} max={100} />
              </div>
              <Input
                {...field}
                id={field.name}
                maxLength={100}
                placeholder="mis. Peluncuran Serum Skincare Glowing 30 Hari"
                aria-invalid={fieldState.invalid}
                disabled={isPending}
              />
              <FieldDescription className="text-xs text-muted-foreground/80 leading-relaxed">
                Gunakan judul yang ringkas, jelas, dan menggambarkan penawaran utama produk Anda.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Campaign Description */}
        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor={field.name}>
                  Deskripsi Kampanye <span className="text-destructive font-medium">*</span>
                </FieldLabel>
                <FieldLengthTracker current={(field.value ?? '').length} max={2000} />
              </div>
              <Textarea
                {...field}
                id={field.name}
                rows={4}
                maxLength={2000}
                placeholder="mis. Kampanye peluncuran varian terbaru dengan fokus edukasi keunggulan kandungan Niacinamide dan review jujur pemakaian 7 hari..."
                aria-invalid={fieldState.invalid}
                disabled={isPending}
              />
              <FieldDescription className="text-xs text-muted-foreground/80 leading-relaxed">
                Jelaskan latar belakang produk, nilai keunggulan (USP), dan pesan utama yang diharapkan disampaikan kreator.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Grid for Campaign Type and Category */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Campaign Type */}
          <Controller
            name="campaignType"
            control={form.control}
            render={({ field, fieldState }) => {
              const selectedTypeLabel = field.value ? CAMPAIGN_TYPE_LABELS[field.value as CampaignTypeOption] : undefined;

              return (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Tipe Kampanye <span className="text-destructive font-medium">*</span>
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                    <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                      <SelectValue placeholder="Pilih tipe kampanye">{selectedTypeLabel}</SelectValue>
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {CAMPAIGN_TYPE_OPTIONS.map((typeOption) => {
                        const label = CAMPAIGN_TYPE_LABELS[typeOption];
                        return (
                          <SelectItem key={typeOption} value={typeOption}>
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FieldDescription className="text-xs text-muted-foreground/80 leading-relaxed">
                    Jenis penawaran yang dipromosikan (produk fisik, jasa, atau konten).
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              );
            }}
          />

          {/* Campaign Category */}
          <Controller
            name="campaignCategory"
            control={form.control}
            render={({ field, fieldState }) => {
              const selectedCategoryLabel = field.value ? CAMPAIGN_CATEGORY_LABELS[field.value as CampaignCategoryOption] : undefined;

              return (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Kategori Produk <span className="text-destructive font-medium">*</span>
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                    <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                      <SelectValue placeholder="Pilih kategori produk">{selectedCategoryLabel}</SelectValue>
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {CAMPAIGN_CATEGORY_OPTIONS.map((catOption) => {
                        const label = CAMPAIGN_CATEGORY_LABELS[catOption];
                        return (
                          <SelectItem key={catOption} value={catOption}>
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FieldDescription className="text-xs text-muted-foreground/80 leading-relaxed">
                    Industri utama untuk pengelompokan kampanye.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              );
            }}
          />
        </div>

        {/* Platform Selection */}
        <Controller
          name="platform"
          control={form.control}
          render={({ field, fieldState }) => {
            const selectedPlatformLabel = field.value ? CAMPAIGN_PLATFORM_LABELS[field.value as CampaignPlatformOption] : undefined;

            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  Platform Promosi <span className="text-destructive font-medium">*</span>
                </FieldLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                  <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                    <SelectValue placeholder="Pilih platform">{selectedPlatformLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {CAMPAIGN_PLATFORM_OPTIONS.map((platformOption) => {
                      const label = CAMPAIGN_PLATFORM_LABELS[platformOption];
                      return (
                        <SelectItem key={platformOption} value={platformOption}>
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FieldDescription className="text-xs text-muted-foreground/80 leading-relaxed">
                  Platform media sosial tempat kreator mempublikasikan konten video mereka.
                </FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            );
          }}
        />

        {/* Main Media URL */}
        <Controller
          name="mainMediaUrl"
          control={form.control}
          render={({ field, fieldState }) => {
            const sanitizedMediaUrl = SanitizeHttpUrl(field.value);

            return (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor={field.name}>
                    Tautan Media Utama <span className="text-destructive font-medium">*</span>
                  </FieldLabel>
                  {sanitizedMediaUrl && (
                    <a
                      href={sanitizedMediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium">
                      <span>Uji Tautan</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
                <Input
                  {...field}
                  id={field.name}
                  type="url"
                  placeholder="mis. https://vt.tiktok.com/ZS... atau https://shopee.co.id/brand/produk"
                  aria-invalid={fieldState.invalid}
                  disabled={isPending}
                />
                <FieldDescription className="text-xs text-muted-foreground/80 leading-relaxed">
                  Tautan halaman produk toko resmi, etalase e-commerce, atau video referensi produk Anda.
                </FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            );
          }}
        />

        {/* Thumbnail Image Upload */}
        <Controller
          name="thumbnailUrl"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                Gambar Thumbnail Kampanye <span className="text-destructive font-medium">*</span>
              </FieldLabel>
              <CampaignThumbnailUpload
                value={field.value}
                onChange={(url) => field.onChange(url)}
                campaignId={id ?? ''}
                disabled={isPending}
              />
              <FieldDescription className="text-xs text-muted-foreground/80 leading-relaxed">
                Gambar sampul (banner) yang akan ditampilkan pada daftar kampanye untuk menarik perhatian kreator.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      {/* Form Submission Action */}
      <WizardFormActions isPending={isPending} />

      {/* Unsaved Changes Guard Dialog */}
      <CampaignUnsavedChangesDialog
        isOpen={isBlocked}
        onConfirm={ConfirmNavigation}
        onCancel={CancelNavigation}
      />
    </form>
  );
}
