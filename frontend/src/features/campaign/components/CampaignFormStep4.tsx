import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock } from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { GetWizardStepPath } from '../config/wizard-steps';
import { UseCampaignWizardContext, UseEditCampaignMutation, UseUnsavedChangesGuard } from '../hooks';
import { rewardSchema, type RewardFormValues } from '../schemas';
import {
  CalculateCampaignProjections,
  FormatDateForInput,
  FormatNumberForInput,
  GetInitialReward,
  HandleFormattedNumberChange,
} from '../utils';
import { CampaignDanaAmanNotice } from './CampaignDanaAmanNotice';
import { CampaignEstimateRoiCard } from './CampaignEstimateRoiCard';
import { CampaignUnsavedChangesDialog } from './CampaignUnsavedChangesDialog';
import { WizardFormActions } from './WizardFormActions';

/**
 * Reward and budget form component for Step 4 of the campaign creation wizard.
 * Enables brands to configure CPM pricing, views thresholds, escrow budget, and active dates,
 * with real-time projections and calculation summaries.
 * Connects directly to the campaign edit mutation and manages its own submission lifecycle.
 *
 * @returns The rendered reward and budget form element.
 */
export function CampaignFormStep4() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { campaign } = UseCampaignWizardContext();

  const isBudgetLocked = campaign?.payments?.[0]?.paymentStatus === 'APPROVED';

  const editMutation = UseEditCampaignMutation(id, {
    successMessage: 'Hadiah & anggaran berhasil disimpan.',
    nextStepSlug: 'step-5',
  });

  const initialValues = useMemo(() => GetInitialReward(campaign), [campaign]);

  const form = useForm<RewardFormValues>({
    resolver: zodResolver(rewardSchema),
    defaultValues: initialValues,
    values: initialValues,
    resetOptions: {
      keepDirtyValues: true,
    },
    mode: 'onTouched',
  });

  const watchedValues = useWatch({ control: form.control });
  const projections = CalculateCampaignProjections(watchedValues);

  /**
   * Navigates back to Step 3 (Brief & Panduan).
   */
  function HandleBack() {
    const targetPath = GetWizardStepPath('step-3', id);
    navigate(targetPath);
  }

  /**
   * Handles valid form submission and dispatches to the edit campaign mutation.
   *
   * @param values - Validated form field values.
   */
  function HandleFormSubmit(values: RewardFormValues) {
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
  const todayDateString = FormatDateForInput(new Date());

  const { isBlocked, ConfirmNavigation, CancelNavigation } = UseUnsavedChangesGuard({
    isDirty: form.formState.isDirty,
    isSaving,
  });

  return (
    <form noValidate onSubmit={form.handleSubmit(HandleFormSubmit)} className="space-y-8">
      {/* LOCKED BUDGET CALLOUT NOTICE */}
      {isBudgetLocked && (
        <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground">
          <Lock className="size-4 shrink-0 text-muted-foreground mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-foreground">Tarif CPM & Total Anggaran Terkunci</h4>
            <p className="leading-relaxed">
              Pembayaran anggaran sebesar{' '}
              <strong className="text-foreground font-medium">
                Rp {Number(campaign?.budget ?? 0).toLocaleString('id-ID')}
              </strong>{' '}
              telah diverifikasi. Tarif CPM dan total anggaran tidak dapat diubah selama tahap revisi. Anda tetap dapat menyesuaikan batas penayangan dan jadwal kampanye.
            </p>
          </div>
        </div>
      )}

      {/* SECTION 1: Hadiah & Ambang Tayangan (Reward System) */}
      <div className="space-y-4">
        <div className="border-b border-border/40 pb-2">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Sistem Hadiah Kreator</h3>
          <p className="text-xs text-muted-foreground">Tentukan imbalan yang didapatkan kreator setiap 1.000 penayangan terverifikasi.</p>
        </div>

        <FieldGroup>
          {/* CPM Field */}
          <Controller
            name="cpm"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  Tarif CPM (per 1.000 Tayangan) <span className="text-destructive font-medium">*</span>
                </FieldLabel>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-semibold text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    {...field}
                    id={field.name}
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 10.000"
                    className="pl-10 text-base"
                    disabled={isPending || isBudgetLocked}
                    value={FormatNumberForInput(field.value)}
                    onChange={(e) => HandleFormattedNumberChange(field.onChange, e)}
                  />
                </div>

                <FieldDescription>
                  Nominal rupiah yang diberikan untuk setiap 1.000 tayangan video yang lolos verifikasi sistem.
                </FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Min Views & Max Views Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Min Views */}
            <Controller
              name="minViews"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Penayangan Minimum (Min Views) <span className="text-destructive font-medium">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 1.000"
                    disabled={isPending}
                    value={FormatNumberForInput(field.value)}
                    onChange={(e) => HandleFormattedNumberChange(field.onChange, e)}
                  />
                  <FieldDescription>
                    Ambang batas tayangan agar video mulai menghasilkan imbalan. Video di bawah batas ini menghasilkan Rp 0.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Max Views */}
            <Controller
              name="maxViews"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Batas Tayangan Maksimum (Max Views) <span className="text-destructive font-medium">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 50.000"
                    disabled={isPending}
                    value={FormatNumberForInput(field.value)}
                    onChange={(e) => HandleFormattedNumberChange(field.onChange, e)}
                  />
                  <FieldDescription>
                    Batas atas penayangan yang dibayarkan per satu video. Penayangan setelah batas ini tidak menambah bayaran.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>
        </FieldGroup>
      </div>

      {/* SECTION 2: Total Anggaran Kampanye */}
      <div className="space-y-4">
        <div className="border-b border-border/40 pb-2">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Total Anggaran Kampanye</h3>
          <p className="text-xs text-muted-foreground">
            Tentukan batas dana yang dialokasikan untuk mendanai tayangan kreator melalui sistem dana aman.
          </p>
        </div>

        <FieldGroup>
          {/* Total Budget */}
          <Controller
            name="budget"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  Total Anggaran Kampanye <span className="text-destructive font-medium">*</span>
                </FieldLabel>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-semibold text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    {...field}
                    id={field.name}
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 5.000.000"
                    className="pl-10 text-base"
                    disabled={isPending || isBudgetLocked}
                    value={FormatNumberForInput(field.value)}
                    onChange={(e) => HandleFormattedNumberChange(field.onChange, e)}
                  />
                </div>

                <FieldDescription>
                  Total dana yang disiapkan untuk kampanye ini. Kampanye otomatis selesai jika anggaran habis terdistribusi.
                </FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>

        {/* Sistem Dana Aman Info Callout */}
        <CampaignDanaAmanNotice variant="budget" />
      </div>

      {/* SECTION 3: Jadwal & Periode Kampanye */}
      <div className="space-y-4">
        <div className="border-b border-border/40 pb-2">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Jadwal & Periode Kampanye</h3>
          <p className="text-xs text-muted-foreground">Tentukan rentang tanggal mulai dan batas akhir penayangan video oleh kreator.</p>
        </div>

        <FieldGroup>
          {/* Dates Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Start Date */}
            <Controller
              name="startDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Tanggal Mulai <span className="text-destructive font-medium">*</span>
                  </FieldLabel>
                  <Input {...field} id={field.name} type="date" min={todayDateString} disabled={isPending} />
                  <FieldDescription>Kreator dapat mulai mengunggah draft sejak tanggal ini.</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* End Date */}
            <Controller
              name="endDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Tanggal Selesai (Batas Akhir) <span className="text-destructive font-medium">*</span>
                  </FieldLabel>
                  <Input {...field} id={field.name} type="date" min={watchedValues.startDate || todayDateString} disabled={isPending} />
                  <FieldDescription>Penayangan video berhenti dihitung setelah tanggal ini tercapai.</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>
        </FieldGroup>
      </div>

      {/* SECTION 4: Live Projections & Estimation Card */}
      <CampaignEstimateRoiCard projections={projections} />

      {/* ACTION BUTTONS */}
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
