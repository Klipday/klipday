import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GetWizardStepPath } from '../config/wizard-steps';
import { UseCampaignWizardContext, UseEditCampaignMutation, UseUnsavedChangesGuard } from '../hooks';
import { briefSchema, type BriefFormValues } from '../schemas';
import { GetInitialBrief } from '../utils';
import { BriefDynamicListField } from './BriefDynamicListField';
import { CampaignUnsavedChangesDialog } from './CampaignUnsavedChangesDialog';
import { CampaignWizardHelperBox } from './CampaignWizardHelperBox';
import { FieldLengthTracker } from './FieldLengthTracker';
import { WizardFormActions } from './WizardFormActions';

/**
 * Brief & guidelines form component for Step 3 of the campaign creation wizard.
 * Captures campaign objective, key messages, call to action, social media caption/hashtag rules,
 * Do's & Don'ts content guidelines, and script instructions.
 * Connects directly to the campaign edit mutation and manages its own submission lifecycle.
 *
 * @returns The rendered campaign brief form element.
 */
export function CampaignFormStep3() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { campaign } = UseCampaignWizardContext();

  const editMutation = UseEditCampaignMutation(id, {
    successMessage: 'Brief & panduan berhasil disimpan.',
    nextStepSlug: 'step-4',
  });

  const initialValues = useMemo(() => GetInitialBrief(campaign), [campaign]);

  const form = useForm<BriefFormValues>({
    resolver: zodResolver(briefSchema),
    defaultValues: initialValues,
    values: initialValues,
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  /**
   * Navigates back to Step 2 (Materials & Assets).
   */
  function HandleBack() {
    const targetPath = GetWizardStepPath('step-2', id);
    navigate(targetPath);
  }

  /**
   * Handles form submission and dispatches to the edit campaign mutation.
   *
   * @param values - Validated campaign brief form values.
   */
  function HandleFormSubmit(values: BriefFormValues) {
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

    editMutation.mutate(
      { brief: values },
      {
        onSuccess: () => {
          form.reset(values);
        },
      }
    );
  }

  const isPending = editMutation.isPending || form.formState.isSubmitting;
  const isSaving = editMutation.isPending || editMutation.isSuccess;

  const { isBlocked, ConfirmNavigation, CancelNavigation } = UseUnsavedChangesGuard({
    isDirty: form.formState.isDirty,
    isSaving,
  });

  return (
    <form noValidate onSubmit={form.handleSubmit(HandleFormSubmit)} className="space-y-8">
      {/* Information Helper Box */}
      <CampaignWizardHelperBox
        title="Panduan Kreatif & Instruksi Konten"
        description="Brief ini menjadi acuan utama para kreator (clippers) dalam membuat video promosi. Berikan instruksi yang jelas agar konten yang dihasilkan selaras dengan visi brand Anda."
      />

      {/* Section 1: Core Direction (Tujuan & Pesan Utama) */}
      <div className="space-y-4">
        <div className="border-b border-border/40 pb-2">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Pesan Utama & Arahan Kreatif</h3>
          <p className="text-xs text-muted-foreground">Tentukan tujuan kampanye, pesan inti, dan aksi yang diharapkan dari penonton.</p>
        </div>

        <FieldGroup>
          {/* Campaign Purpose */}
          <Controller
            name="purpose"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor={field.name}>
                    Tujuan Kampanye <span className="text-destructive font-medium">*</span>
                  </FieldLabel>
                  <FieldLengthTracker current={(field.value ?? '').length} max={1000} />
                </div>
                <Textarea
                  {...field}
                  id={field.name}
                  rows={3}
                  maxLength={1000}
                  placeholder="Contoh: Meningkatkan awareness produk dan penjualan serum glowing 30 hari..."
                  aria-invalid={fieldState.invalid}
                  disabled={isPending}
                />
                <FieldDescription className="text-xs text-muted-foreground/80 leading-relaxed">
                  Apa yang ingin dicapai melalui kampanye video kliping ini?
                </FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Key Message */}
          <Controller
            name="keyMessage"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor={field.name}>
                    Pesan Utama <span className="text-destructive font-medium">*</span>
                  </FieldLabel>
                  <FieldLengthTracker current={(field.value ?? '').length} max={1000} />
                </div>
                <Textarea
                  {...field}
                  id={field.name}
                  rows={3}
                  maxLength={1000}
                  placeholder="Contoh: Formula baru dengan 2% Retinol murni yang lembut untuk kulit sensitif dan memberikan hasil dalam 14 hari..."
                  aria-invalid={fieldState.invalid}
                  disabled={isPending}
                />
                <FieldDescription className="text-xs text-muted-foreground/80 leading-relaxed">
                  Poin keunggulan atau pesan inti yang wajib dipahami penonton.
                </FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Grid for CTA and Impression */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Call to Action */}
            <Controller
              name="callToAction"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor={field.name}>
                      Call to Action (CTA) <span className="text-destructive font-medium">*</span>
                    </FieldLabel>
                    <FieldLengthTracker current={(field.value ?? '').length} max={500} />
                  </div>
                  <Input
                    {...field}
                    id={field.name}
                    maxLength={500}
                    placeholder="Contoh: Cek keranjang kuning sekarang untuk diskon 30%!"
                    aria-invalid={fieldState.invalid}
                    disabled={isPending}
                  />
                  <FieldDescription className="text-xs text-muted-foreground/80 leading-relaxed">
                    Aksi yang diharapkan dari penonton setelah menonton video.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Impression / Tone */}
            <Controller
              name="impression"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor={field.name}>Kesan / Mood Konten (Opsional)</FieldLabel>
                    <FieldLengthTracker current={(field.value ?? '').length} max={500} />
                  </div>
                  <Input
                    {...field}
                    id={field.name}
                    maxLength={500}
                    placeholder="Contoh: Review jujur (honest review), ceria, edukatif..."
                    aria-invalid={fieldState.invalid}
                    disabled={isPending}
                  />
                  <FieldDescription className="text-xs text-muted-foreground/80 leading-relaxed">
                    Nuansa atau kesan emosional yang ingin ditonjolkan.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>
        </FieldGroup>
      </div>

      {/* Section 2: Social Media Posting Guidelines */}
      <div className="space-y-4">
        <div className="border-b border-border/40 pb-2">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Panduan Postingan Media Sosial</h3>
          <p className="text-xs text-muted-foreground">Tentukan caption, tagar, dan akun mention wajib untuk publikasi video kreator.</p>
        </div>

        <FieldGroup>
          {/* Required Caption */}
          <Controller
            name="requiredCaption"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor={field.name}>Caption Wajib (Opsional)</FieldLabel>
                  <FieldLengthTracker current={(field.value ?? '').length} max={2000} />
                </div>
                <Textarea
                  {...field}
                  id={field.name}
                  rows={2}
                  maxLength={2000}
                  placeholder="Contoh: Solusi wajah kusam akhirnya ketemu! Jangan lupa cobain sekarang..."
                  aria-invalid={fieldState.invalid}
                  disabled={isPending}
                />
                <FieldDescription className="text-xs text-muted-foreground/80 leading-relaxed">
                  Teks caption rekomendasi atau wajib yang perlu dicantumkan saat posting.
                </FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Grid for Hashtags and Mentions */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Hashtags */}
            <Controller
              name="hashtags"
              control={form.control}
              render={({ field, fieldState }) => (
                <BriefDynamicListField
                  label="Tagar / Hashtags Wajib"
                  description="Tagar yang wajib disertakan kreator di media sosial."
                  placeholder="Contoh: skincare, glowing, racunbelanja"
                  prefix="#"
                  variant="pills"
                  items={field.value ?? []}
                  onAddItem={(newItem) => field.onChange([...(field.value ?? []), newItem])}
                  onRemoveItem={(indexToRemove) => field.onChange((field.value ?? []).filter((_, index) => index !== indexToRemove))}
                  disabled={isPending}
                  error={fieldState.error?.message}
                />
              )}
            />

            {/* Mention Tags */}
            <Controller
              name="mentionTags"
              control={form.control}
              render={({ field, fieldState }) => (
                <BriefDynamicListField
                  label="Akun Mention Wajib"
                  description="Akun resmi yang wajib di-tag atau di-mention."
                  placeholder="Contoh: klipday, brandofficial"
                  prefix="@"
                  variant="pills"
                  items={field.value ?? []}
                  onAddItem={(newItem) => field.onChange([...(field.value ?? []), newItem])}
                  onRemoveItem={(indexToRemove) => field.onChange((field.value ?? []).filter((_, index) => index !== indexToRemove))}
                  disabled={isPending}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>
        </FieldGroup>
      </div>

      {/* Section 3: Aturan Konten (Do's & Don'ts) */}
      <div className="space-y-4">
        <div className="border-b border-border/40 pb-2">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Aturan Konten (Do&apos;s &amp; Don&apos;ts)</h3>
          <p className="text-xs text-muted-foreground">Panduan hal yang dianjurkan dan dilarang keras dilakukan dalam video klip.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Do's */}
          <Controller
            name="dos"
            control={form.control}
            render={({ field, fieldState }) => (
              <BriefDynamicListField
                label="Hal yang Dianjurkan (Do's)"
                description="Instruksi hal positif yang sebaiknya dilakukan kreator."
                placeholder="Contoh: Tampilkan produk di 3 detik pertama..."
                variant="rows"
                tone="positive"
                items={field.value ?? []}
                onAddItem={(newItem) => field.onChange([...(field.value ?? []), newItem])}
                onRemoveItem={(indexToRemove) => field.onChange((field.value ?? []).filter((_, index) => index !== indexToRemove))}
                disabled={isPending}
                error={fieldState.error?.message}
              />
            )}
          />

          {/* Don'ts */}
          <Controller
            name="donts"
            control={form.control}
            render={({ field, fieldState }) => (
              <BriefDynamicListField
                label="Hal yang Dilarang (Don'ts)"
                description="Hal yang dilarang keras dilakukan dalam video."
                placeholder="Contoh: Jangan bandingkan dengan merek kompetitor..."
                variant="rows"
                tone="negative"
                items={field.value ?? []}
                onAddItem={(newItem) => field.onChange([...(field.value ?? []), newItem])}
                onRemoveItem={(indexToRemove) => field.onChange((field.value ?? []).filter((_, index) => index !== indexToRemove))}
                disabled={isPending}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
      </div>

      {/* Section 4: Script Narration & Additional Guidelines */}
      <div className="space-y-4">
        <div className="border-b border-border/40 pb-2">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Narasi &amp; Panduan Tambahan</h3>
          <p className="text-xs text-muted-foreground">Referensi hook pembuka skrip narasi atau instruksi spesifik lainnya.</p>
        </div>

        <FieldGroup>
          {/* Narration Script Guidance */}
          <Controller
            name="narration"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor={field.name}>Referensi Narasi / Hook Pembuka (Opsional)</FieldLabel>
                  <FieldLengthTracker current={(field.value ?? '').length} max={2000} />
                </div>
                <Textarea
                  {...field}
                  id={field.name}
                  rows={3}
                  maxLength={2000}
                  placeholder="Contoh: 'Kalian yang kulitnya kering kerontang wajib nonton ini sampai habis...'"
                  aria-invalid={fieldState.invalid}
                  disabled={isPending}
                />
                <FieldDescription className="text-xs text-muted-foreground/80 leading-relaxed">
                  Contoh hook pembuka atau skrip narasi yang dapat digunakan kreator.
                </FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Freeform Guidelines */}
          <Controller
            name="guidelines"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor={field.name}>Panduan Tambahan Lainnya (Opsional)</FieldLabel>
                  <FieldLengthTracker current={(field.value ?? '').length} max={3000} />
                </div>
                <Textarea
                  {...field}
                  id={field.name}
                  rows={3}
                  maxLength={3000}
                  placeholder="Catatan khusus lainnya terkait ketentuan video, resolusi, format kliping, dsb..."
                  aria-invalid={fieldState.invalid}
                  disabled={isPending}
                />
                <FieldDescription className="text-xs text-muted-foreground/80 leading-relaxed">
                  Informasi penting lainnya yang perlu diketahui oleh clippers.
                </FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>
      </div>

      {/* Navigation and Submission Actions */}
      <WizardFormActions onBack={HandleBack} isPending={isPending} />

      {/* Unsaved Changes Guard Dialog */}
      <CampaignUnsavedChangesDialog
        isOpen={isBlocked}
        onConfirm={ConfirmNavigation}
        onCancel={CancelNavigation}
      />
    </form>
  );
}
