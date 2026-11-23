import { zodResolver } from '@hookform/resolvers/zod';
import { DisketteIcon, LoaderIcon } from '@solar-icons/react/linear';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/features/authentication/components/PasswordInput';
import { cn } from '@/lib/utils';
import { UseChangeAdminPasswordMutation } from '../hooks';
import {
  AdminChangePasswordFormSchema,
  type AdminChangePasswordFormValues,
} from '../schemas/admin-profile.schemas';
import type { AdminChangePasswordFormProps } from '../types';
import { GetChangePasswordFormDefaults } from '../utils/profile-form.utils';

/**
 * Self-contained form card allowing an authenticated administrator to rotate their password.
 *
 * @param props - Optional layout styling overrides.
 * @returns The rendered password update form card.
 */
export function AdminChangePasswordForm({ className }: AdminChangePasswordFormProps) {
  const changePasswordMutation = UseChangeAdminPasswordMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AdminChangePasswordFormValues>({
    resolver: zodResolver(AdminChangePasswordFormSchema),
    defaultValues: GetChangePasswordFormDefaults(),
  });

  /**
   * Submits validated password credentials and clears all fields on success.
   *
   * @param values - Current password, new password, and confirmation password.
   */
  function HandlePasswordSubmit(values: AdminChangePasswordFormValues) {
    changePasswordMutation.mutate(values, {
      onSuccess: () => {
        reset(GetChangePasswordFormDefaults());
      },
    });
  }

  return (
    <form
      onSubmit={handleSubmit(HandlePasswordSubmit)}
      className={cn('rounded-xl border border-border/60 bg-card p-6 space-y-5', className)}>
      <div className="space-y-1">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          Keamanan &amp; Kata Sandi
        </h2>
        <p className="text-xs text-muted-foreground">
          Gunakan kata sandi yang kuat dan perbarui secara berkala untuk menjaga keamanan akun administrator.
        </p>
      </div>

      <div className="border-t border-border/40 pt-5 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="admin-current-password" className="text-xs font-medium">
            Kata Sandi Saat Ini
          </Label>
          <PasswordInput
            id="admin-current-password"
            autoComplete="current-password"
            placeholder="Masukkan kata sandi saat ini"
            className="h-10 rounded-xl text-xs"
            {...register('currentPassword')}
          />
          {errors.currentPassword ? (
            <p className="text-[11px] text-destructive">{errors.currentPassword.message}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="admin-new-password" className="text-xs font-medium">
              Kata Sandi Baru
            </Label>
            <PasswordInput
              id="admin-new-password"
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              className="h-10 rounded-xl text-xs"
              {...register('newPassword')}
            />
            {errors.newPassword ? (
              <p className="text-[11px] text-destructive">{errors.newPassword.message}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Minimal 8 karakter dan berbeda dari kata sandi saat ini.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-confirm-password" className="text-xs font-medium">
              Konfirmasi Kata Sandi Baru
            </Label>
            <PasswordInput
              id="admin-confirm-password"
              autoComplete="new-password"
              placeholder="Ulangi kata sandi baru"
              className="h-10 rounded-xl text-xs"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword ? (
              <p className="text-[11px] text-destructive">{errors.confirmPassword.message}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end pt-1">
        <Button
          type="submit"
          size="default"
          disabled={changePasswordMutation.isPending || !isDirty}
          className="cursor-pointer font-medium bg-primary text-primary-foreground hover:bg-primary/90">
          {changePasswordMutation.isPending ? (
            <LoaderIcon className="mr-1.5 size-4 animate-spin" />
          ) : (
            <DisketteIcon className="mr-1.5 size-4" />
          )}
          <span>Perbarui Kata Sandi</span>
        </Button>
      </div>
    </form>
  );
}
