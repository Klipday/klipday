import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router';
import { LoaderIcon } from '@solar-icons/react/linear';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { UseResetPasswordMutation } from '../hooks';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../schemas/recovery-schemas';
import { PasswordInput } from './PasswordInput';

/**
 * Self-contained password reset card using React Hook Form and shared Zod password rules.
 * Captures the secret reset token into state and immediately scrubs it from the URL history.
 *
 * @returns The rendered password reset card component.
 */
export function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const [token] = useState(() => (searchParams.get('token') ?? '').trim());

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const mutation = UseResetPasswordMutation();

  // Scrub the secret reset token from browser history immediately on mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const currentParams = new URLSearchParams(window.location.search);
    if (!currentParams.has('token')) {
      return;
    }

    currentParams.delete('token');
    const remainingQuery = currentParams.toString();
    const cleanUrl = remainingQuery
      ? `${window.location.pathname}?${remainingQuery}`
      : window.location.pathname;
    window.history.replaceState(null, '', cleanUrl);
  }, []);

  /**
   * Submits the validated new password alongside the captured reset token.
   *
   * @param values - Validated password reset form values.
   */
  function OnSubmit(values: ResetPasswordFormValues) {
    if (!token || mutation.isPending) {
      return;
    }

    mutation.mutate({
      token,
      password: values.password,
    });
  }

  if (!token) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Tautan Tidak Valid</CardTitle>
          <CardDescription>
            Tautan pengaturan ulang kata sandi tidak ditemukan atau rusak.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Silakan minta tautan baru untuk membuat kata sandi akun Anda.
          </p>
          <Button asChild className="w-full">
            <Link to="/forgot-password">Minta Tautan Baru</Link>
          </Button>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          <Link to="/signin" className="hover:underline">
            Kembali ke halaman Masuk
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Buat Kata Sandi Baru</CardTitle>
        <CardDescription>
          Masukkan kata sandi baru untuk mengamankan akun Anda.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={form.handleSubmit(OnSubmit)} className="space-y-4">
          <FieldGroup>
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="new-password">Kata Sandi Baru</FieldLabel>
                  <PasswordInput
                    {...field}
                    id="new-password"
                    placeholder="••••••••"
                    aria-invalid={fieldState.invalid}
                    autoComplete="new-password"
                    disabled={mutation.isPending}
                    autoFocus
                  />
                  <FieldDescription>Minimal 8 karakter, kombinasi huruf kapital, angka, dan simbol.</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="confirm-password">Konfirmasi Kata Sandi Baru</FieldLabel>
                  <PasswordInput
                    {...field}
                    id="confirm-password"
                    placeholder="••••••••"
                    aria-invalid={fieldState.invalid}
                    autoComplete="new-password"
                    disabled={mutation.isPending}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {mutation.isError && <FieldError>{mutation.error.message}</FieldError>}

            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? (
                <span className="flex items-center gap-2">
                  <LoaderIcon className="size-4 animate-spin" />
                  <span>Menyimpan...</span>
                </span>
              ) : (
                'Simpan Kata Sandi Baru'
              )}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        <Link to="/signin" className="hover:underline">
          Batal dan kembali ke Masuk
        </Link>
      </CardFooter>
    </Card>
  );
}
