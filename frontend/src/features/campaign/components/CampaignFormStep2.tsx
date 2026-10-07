import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { GetWizardStepPath } from '../config/wizard-steps';
import { UseCampaignWizardContext, UseEditCampaignMutation, UseUnsavedChangesGuard } from '../hooks';
import { materialsFormSchema, type MaterialsFormValues } from '../schemas';
import { GetInitialMaterials } from '../utils';
import { CampaignUnsavedChangesDialog } from './CampaignUnsavedChangesDialog';
import { CampaignWizardHelperBox } from './CampaignWizardHelperBox';
import { MaterialFieldGroup } from './MaterialFieldGroup';
import { WizardFormActions } from './WizardFormActions';

/**
 * Materials and assets form component for Step 2 of the campaign creation wizard.
 * Enables brands to add, edit, and remove material items (video, image, document, link)
 * that creators will utilize to produce clip submissions.
 * Connects directly to the campaign edit mutation and manages its own submission lifecycle.
 *
 * @returns The rendered materials and assets form element.
 */
export function CampaignFormStep2() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { campaign } = UseCampaignWizardContext();

  const editMutation = UseEditCampaignMutation(id, {
    successMessage: 'Materi & aset berhasil disimpan.',
    nextStepSlug: 'step-3',
  });

  const initialMaterials = useMemo(() => GetInitialMaterials(campaign), [campaign]);

  const form = useForm<MaterialsFormValues>({
    resolver: zodResolver(materialsFormSchema),
    defaultValues: {
      materials: initialMaterials,
    },
    values: {
      materials: initialMaterials,
    },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'materials',
  });

  /**
   * Appends a new empty material field group to the form.
   */
  function HandleAddMaterial() {
    append([
      {
        name: '',
        type: 'VIDEO',
        url: '',
      },
    ]);
  }

  /**
   * Removes a material field group at the specified array index.
   *
   * @param index - Zero-based index of the item to remove.
   */
  function HandleRemoveMaterial(index: number) {
    remove(index);
  }

  /**
   * Navigates back to Step 1 (Informasi Dasar).
   */
  function HandleBack() {
    const targetPath = GetWizardStepPath('step-1', id);
    navigate(targetPath);
  }

  /**
   * Handles form submission and dispatches to the edit campaign mutation.
   *
   * @param values - Validated materials form field values.
   */
  function HandleFormSubmit(values: MaterialsFormValues) {
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
      { materials: values.materials },
      {
        onSuccess: () => {
          form.reset(values);
        },
      }
    );
  }

  const isPending = editMutation.isPending || form.formState.isSubmitting;
  const isSaving = editMutation.isPending || editMutation.isSuccess;
  const rootError = form.formState.errors.materials?.root?.message;

  const { isBlocked, ConfirmNavigation, CancelNavigation } = UseUnsavedChangesGuard({
    isDirty: form.formState.isDirty,
    isSaving,
  });

  return (
    <form noValidate onSubmit={form.handleSubmit(HandleFormSubmit)} className="space-y-6">
      {/* Information Helper Box */}
      <CampaignWizardHelperBox
        title="Panduan Materi & Aset Promosi"
        description="Sediakan materi yang dibutuhkan kreator seperti video mentah (footage), foto produk beresolusi tinggi, logo brand, atau tautan penyimpanan cloud."
        tip='Jika menggunakan Google Drive atau Dropbox, pastikan izin akses tautan telah diatur ke "Siapa saja yang memiliki tautan dapat melihat" agar kreator dapat langsung mengunduh aset.'
      />

      {/* Dynamic Materials Field Groups */}
      <div className="space-y-4">
        {fields.map((fieldItem, index) => {
          const canRemove = fields.length > 1;

          return (
            <MaterialFieldGroup
              key={fieldItem.id}
              index={index}
              control={form.control}
              canRemove={canRemove}
              onRemove={HandleRemoveMaterial}
              disabled={isPending}
            />
          );
        })}
      </div>

      {/* Root Array Error if Present */}
      {rootError && <p className="text-sm font-medium text-destructive">{rootError}</p>}

      {/* Add New Material Button */}
      <Button
        type="button"
        variant="outline"
        onClick={HandleAddMaterial}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 border-dashed h-11 rounded-lg text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/40 transition-colors">
        <Plus className="size-4" />
        <span className="font-medium text-sm">Tambah Materi & Aset Promosi</span>
      </Button>

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
