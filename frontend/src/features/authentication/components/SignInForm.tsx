import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { UseLoginMutation, UseResendVerificationMutation } from '../hooks';
import { signInSchema, type SignInFormValues } from '../schemas';
import { PasswordInput } from './PasswordInput';
import type { ApiError } from '@/lib/api-client';

/**
 * Sign in form allowing registered Creators and Brands to authenticate with email and password.
 * Submits to the backend login endpoint via the `UseLoginMutation` hook.
 *
 * @returns The sign in form component.
 */
export function SignInForm() {
  const navigate = useNavigate();
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const resendMutation = UseResendVerificationMutation();

  const mutation = UseLoginMutation({
    onError: (error) => {
      const apiError = error as ApiError;
      const errorData = apiError.data as { code?: string; email?: string } | undefined;

      if (apiError.code === 'EMAIL_NOT_VERIFIED' || errorData?.code === 'EMAIL_NOT_VERIFIED') {
        const email = errorData?.email ?? form.getValues('email');
        setUnverifiedEmail(email);
      } else {
        setUnverifiedEmail(null);
      }
    },
  });

  /**
   * Submits the sign in form credentials to the login mutation.
   *
   * @param values - Validated sign in form values containing email and password.
   */
  function OnSubmit(values: SignInFormValues) {
    setUnverifiedEmail(null);
    mutation.mutate(values);
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(OnSubmit)} className="space-y-4">
      <FieldGroup>
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="email"
                placeholder="nama@email.com"
                aria-invalid={fieldState.invalid}
                autoComplete="email"
                disabled={mutation.isPending}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor={field.name}>Kata sandi</FieldLabel>
                <Link
                  to="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline">
                  Lupa kata sandi?
                </Link>
              </div>
              <PasswordInput
                {...field}
                id={field.name}
                placeholder="••••••••"
                aria-invalid={fieldState.invalid}
                autoComplete="current-password"
                disabled={mutation.isPending}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {unverifiedEmail ? (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-foreground space-y-2">
            <div className="font-semibold text-amber-600 dark:text-amber-400">
              Email Belum Diverifikasi
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Akun Anda dengan email <span className="font-medium text-foreground">{unverifiedEmail}</span> belum aktif.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => navigate(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`)}>
                Masukkan Kode
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                disabled={resendMutation.isPending}
                onClick={() => {
                  resendMutation.mutate(
                    { email: unverifiedEmail },
                    {
                      onSuccess: () =>
                        navigate(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`),
                    },
                  );
                }}>
                {resendMutation.isPending ? 'Mengirim...' : 'Kirim Ulang'}
              </Button>
            </div>
          </div>
        ) : (
          mutation.isError && <FieldError>{mutation.error.message}</FieldError>
        )}

        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              <span>Memproses...</span>
            </span>
          ) : (
            'Masuk'
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}

