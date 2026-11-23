import { z } from 'zod';

export const ADMIN_NAME_MIN_LENGTH = 2;
export const ADMIN_NAME_MAX_LENGTH = 100;
export const ADMIN_PASSWORD_MIN_LENGTH = 8;
export const ADMIN_PASSWORD_MAX_LENGTH = 128;

export const AdminProfileFormSchema = z.object({
  fullName: z
    .string({ error: 'Nama lengkap minimal 2 karakter.' })
    .trim()
    .min(ADMIN_NAME_MIN_LENGTH, 'Nama lengkap minimal 2 karakter.')
    .max(ADMIN_NAME_MAX_LENGTH, 'Nama lengkap maksimal 100 karakter.'),
});

export type AdminProfileFormValues = z.infer<typeof AdminProfileFormSchema>;

export const AdminChangePasswordFormSchema = z
  .object({
    currentPassword: z
      .string({ error: 'Kata sandi saat ini wajib diisi.' })
      .min(1, 'Kata sandi saat ini wajib diisi.'),
    newPassword: z
      .string({ error: 'Kata sandi baru minimal 8 karakter.' })
      .min(ADMIN_PASSWORD_MIN_LENGTH, 'Kata sandi baru minimal 8 karakter.')
      .max(ADMIN_PASSWORD_MAX_LENGTH, 'Kata sandi baru maksimal 128 karakter.'),
    confirmPassword: z
      .string({ error: 'Konfirmasi kata sandi wajib diisi.' })
      .min(1, 'Konfirmasi kata sandi wajib diisi.'),
  })
  .superRefine((values, ctx) => {
    if (values.newPassword !== values.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Konfirmasi kata sandi baru tidak cocok.',
      });
    }

    if (values.newPassword === values.currentPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: 'Kata sandi baru tidak boleh sama dengan kata sandi saat ini.',
      });
    }
  });

export type AdminChangePasswordFormValues = z.infer<typeof AdminChangePasswordFormSchema>;
