import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Link } from 'react-router';
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
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RESEND_COOLDOWN_SECONDS } from '../constants';
import { UseForgotPasswordMutation } from '../hooks';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../schemas/recovery-schemas';

/**
 * Self-contained forgot-password request card with Zod email validation,
 * confirmation screen, and 60-second resend cooldown timer.
 *
 * @returns The rendered forgot password card component.
 */
export function ForgotPasswordForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const mutation = UseForgotPasswordMutation();

  const isCoolingDown = cooldownSeconds > 0;
  useEffect(() => {
    if (!isCoolingDown) {
      return;
    }

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isCoolingDown]);

  /**
   * Submits the normalized email address to request a password reset link.
   *
   * @param values - Validated forgot password form values.
   */
  function OnSubmit(values: ForgotPasswordFormValues) {
    if (mutation.isPending) {
      return;
    }

    const normalizedEmail = values.email.trim().toLowerCase();
    mutation.mutate(
      { email: normalizedEmail },
      {
        onSuccess: () => {
          setSubmittedEmail(normalizedEmail);
          setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
        },
      },
    );
  }

  /**
   * Re-dispatches the password reset email after verifying the 60-second cooldown has elapsed.
   */
  function HandleResendResetEmail() {
    if (!submittedEmail || cooldownSeconds > 0 || mutation.isPending) {
      return;
    }

    mutation.mutate(
      { email: submittedEmail },
      {
        onSuccess: () => {
          setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
        },
      },
    );
  }

  if (submittedEmail) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Periksa Email Anda</CardTitle>
          <CardDescription>
            Instruksi pengaturan ulang kata sandi telah dikirimkan ke{' '}
            <span className="font-semibold text-foreground">{submittedEmail}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs text-muted-foreground leading-relaxed">
          <p>
            Tautan hanya berlaku selama 1 jam. Jika email tidak masuk dalam beberapa menit, periksa folder spam akun Anda.
          </p>
          {mutation.isError && <FieldError>{mutation.error.message}</FieldError>}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={cooldownSeconds > 0 || mutation.isPending}
            onClick={HandleResendResetEmail}>
            {cooldownSeconds > 0
              ? `Kirim Ulang Email (${cooldownSeconds}s)`
              : mutation.isPending
                ? 'Mengirim ulang...'
                : 'Kirim Ulang Email'}
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
        <CardTitle className="text-xl">Lupa Kata Sandi</CardTitle>
        <CardDescription>
          Masukkan email akun Anda untuk menerima tautan pembuatan kata sandi baru.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={form.handleSubmit(OnSubmit)} className="space-y-4">
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="forgot-email">Email Akun</FieldLabel>
                  <Input
                    {...field}
                    id="forgot-email"
                    type="email"
                    placeholder="nama@email.com"
                    aria-invalid={fieldState.invalid}
                    autoComplete="email"
                    disabled={mutation.isPending}
                    autoFocus
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
                  <span>Mengirim...</span>
                </span>
              ) : (
                'Kirim Tautan Atur Ulang'
              )}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        <Link to="/signin" className="hover:underline">
          Kembali ke halaman Masuk
        </Link>
      </CardFooter>
    </Card>
  );
}
