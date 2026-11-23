import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { DisketteIcon, LoaderIcon, LockIcon } from '@solar-icons/react/linear';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldLengthTracker } from '@/features/campaign/components/FieldLengthTracker';
import { UseUpdateAdminProfileMutation } from '../hooks';
import {
  ADMIN_NAME_MAX_LENGTH,
  AdminProfileFormSchema,
  type AdminProfileFormValues,
} from '../schemas/admin-profile.schemas';
import type { AdminProfileInfoFormProps } from '../types';
import { GetAdminProfileFormDefaults } from '../utils/profile-form.utils';

/**
 * Editable administrator profile identity form card.
 * Allows updating `fullName` while displaying the registered account email as read-only.
 *
 * @param props - Component properties containing the active administrator profile.
 * @returns The rendered administrator profile information form.
 */
export function AdminProfileInfoForm({ profile }: AdminProfileInfoFormProps) {
  const updateProfileMutation = UseUpdateAdminProfileMutation();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AdminProfileFormValues>({
    resolver: zodResolver(AdminProfileFormSchema),
    defaultValues: GetAdminProfileFormDefaults(profile),
  });

  useEffect(() => {
    reset(GetAdminProfileFormDefaults(profile));
  }, [profile, reset]);

  const fullNameValue = useWatch({
    control,
    name: 'fullName',
    defaultValue: profile.fullName,
  });

  /**
   * Submits updated administrator identity fields to the backend API.
   *
   * @param values - Validated profile form values.
   */
  function HandleProfileSubmit(values: AdminProfileFormValues) {
    updateProfileMutation.mutate({
      fullName: values.fullName,
    });
  }

  return (
    <form
      onSubmit={handleSubmit(HandleProfileSubmit)}
      className="rounded-xl border border-border/60 bg-card p-6 space-y-5">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          Informasi Profil
        </h2>
        <p className="text-xs text-muted-foreground">
          Kelola nama tampilan administrator Anda yang tampil di dashboard Klipday.
        </p>
      </div>

      <div className="border-t border-border/40 pt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="admin-full-name" className="text-xs font-medium">
              Nama Lengkap
            </Label>
            <FieldLengthTracker
              current={(fullNameValue ?? '').length}
              max={ADMIN_NAME_MAX_LENGTH}
            />
          </div>
          <Input
            id="admin-full-name"
            type="text"
            autoComplete="name"
            placeholder="Masukkan nama lengkap administrator"
            className="h-10 rounded-xl text-xs"
            {...register('fullName')}
          />
          {errors.fullName ? (
            <p className="text-[11px] text-destructive">{errors.fullName.message}</p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Minimal 2 karakter dan maksimal 100 karakter.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-readonly-email" className="text-xs font-medium text-muted-foreground">
            Email Akun
          </Label>
          <div className="relative">
            <Input
              id="admin-readonly-email"
              type="email"
              value={profile.email}
              disabled
              className="h-10 rounded-xl bg-muted/40 pr-9 text-xs text-muted-foreground cursor-not-allowed"
            />
            <LockIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Alamat email akun administrator terdaftar permanen dan tidak dapat diubah.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end pt-1">
        <Button
          type="submit"
          size="default"
          disabled={updateProfileMutation.isPending || !isDirty}
          className="cursor-pointer font-medium bg-primary text-primary-foreground hover:bg-primary/90">
          {updateProfileMutation.isPending ? (
            <LoaderIcon className="mr-1.5 size-4 animate-spin" />
          ) : (
            <DisketteIcon className="mr-1.5 size-4" />
          )}
          <span>Simpan Perubahan</span>
        </Button>
      </div>
    </form>
  );
}
