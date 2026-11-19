import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useLocation, useSearchParams } from 'react-router';
import { LoaderIcon } from '@solar-icons/react/linear';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { ApiError } from '@/lib/api-client';
import { OTP_CODE_LENGTH, RESEND_COOLDOWN_SECONDS } from '../constants';
import { UseResendVerificationMutation, UseVerifyEmailMutation } from '../hooks';
import { verifyEmailSchema, type VerifyEmailFormValues } from '../schemas/recovery-schemas';
import type { AuthLocationState, ResendCooldownErrorDetails } from '../types';

/**
 * Self-contained email OTP verification form with URL token scrubbing,
 * automatic deep-link OTP submission on mount, and backend-synced 60s resend cooldown.
 *
 * @returns The rendered OTP verification form.
 */
export function VerifyEmailForm() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const locationState = location.state as AuthLocationState | null;

  const [initialEmail] = useState(() => (searchParams.get('email') ?? '').trim().toLowerCase());
  const [initialCode] = useState(() =>
    (searchParams.get('code') ?? '').replace(/[^0-9]/g, '').slice(0, OTP_CODE_LENGTH),
  );
  const [savedEmail, setSavedEmail] = useState(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(!initialEmail);
  const [cooldownSeconds, setCooldownSeconds] = useState(() =>
    locationState?.otpJustSent ? RESEND_COOLDOWN_SECONDS : 0,
  );
  const hasAutoVerifiedRef = useRef(false);

  const form = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: initialEmail,
      code: initialCode,
    },
  });

  const watchedEmail = useWatch({ control: form.control, name: 'email' });
  const watchedCode = useWatch({ control: form.control, name: 'code' });

  const verifyMutation = UseVerifyEmailMutation();
  const resendMutation = UseResendVerificationMutation();
  const { mutate: verifyEmail, isPending: isVerifying, isSuccess: isVerified } = verifyMutation;

  // Scrub the secret OTP query param from browser history immediately on mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const currentParams = new URLSearchParams(window.location.search);
    if (!currentParams.has('code')) {
      return;
    }

    currentParams.delete('code');
    const remainingQuery = currentParams.toString();
    const cleanUrl = remainingQuery
      ? `${window.location.pathname}?${remainingQuery}`
      : window.location.pathname;
    window.history.replaceState(null, '', cleanUrl);
  }, []);

  // Single interval timer per cooldown cycle instead of recreating timers on every tick
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

  // Auto-verify once on mount if email and 6-digit code were supplied in the deep link
  useEffect(() => {
    if (
      initialEmail &&
      initialCode.length === OTP_CODE_LENGTH &&
      !hasAutoVerifiedRef.current &&
      !isVerifying &&
      !isVerified
    ) {
      hasAutoVerifiedRef.current = true;
      verifyEmail({
        email: initialEmail,
        code: initialCode,
      });
    }
  }, [initialEmail, initialCode, isVerifying, isVerified, verifyEmail]);

  /**
   * Cancels inline email editing and restores the previously saved email address.
   */
  function HandleCancelEditEmail() {
    form.setValue('email', savedEmail, { shouldValidate: true });
    form.clearErrors('email');
    setIsEditingEmail(false);
  }

  /**
   * Submits the validated email and 6-digit OTP code.
   *
   * @param values - Validated verification form values.
   */
  function OnSubmit(values: VerifyEmailFormValues) {
    const normalizedEmail = values.email.trim().toLowerCase();
    setSavedEmail(normalizedEmail);
    setIsEditingEmail(false);

    verifyMutation.mutate({
      email: normalizedEmail,
      code: values.code.trim(),
    });
  }

  /**
   * Validates the email field and requests a fresh 6-digit OTP while synchronizing
   * the 60-second cooldown state with any backend 429 remainingSeconds response.
   */
  async function HandleResendCode() {
    if (cooldownSeconds > 0 || resendMutation.isPending) {
      return;
    }

    const isEmailValid = await form.trigger('email');
    if (!isEmailValid) {
      setIsEditingEmail(true);
      return;
    }

    const normalizedEmail = form.getValues('email').trim().toLowerCase();
    setSavedEmail(normalizedEmail);
    setIsEditingEmail(false);

    resendMutation.mutate(
      { email: normalizedEmail },
      {
        onSuccess: () => {
          setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
        },
        onError: (error) => {
          const apiError = error as ApiError;
          const errorData = apiError.data as ResendCooldownErrorDetails | undefined;
          if (typeof errorData?.remainingSeconds === 'number' && errorData.remainingSeconds > 0) {
            setCooldownSeconds(errorData.remainingSeconds);
          }
        },
      },
    );
  }

  const displayEmail = (watchedEmail || savedEmail).trim().toLowerCase();

  return (
    <form noValidate onSubmit={form.handleSubmit(OnSubmit)} className="space-y-4">
      <FieldGroup>
        {isEditingEmail || !displayEmail ? (
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="verify-email-input">Email Akun</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    {...field}
                    id="verify-email-input"
                    type="email"
                    placeholder="nama@email.com"
                    aria-invalid={fieldState.invalid}
                    autoComplete="email"
                    disabled={verifyMutation.isPending}
                  />
                  {savedEmail && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={HandleCancelEditEmail}>
                      Batal
                    </Button>
                  )}
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        ) : (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email tujuan:</span>
              <button
                type="button"
                onClick={() => setIsEditingEmail(true)}
                className="font-medium text-foreground underline-offset-4 hover:underline">
                Ganti
              </button>
            </div>
            <div className="font-semibold text-foreground truncate">{displayEmail}</div>
          </div>
        )}

        <Controller
          name="code"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="otp-code-input">Kode Verifikasi (6 Angka)</FieldLabel>
              <Input
                {...field}
                id="otp-code-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={OTP_CODE_LENGTH}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/[^0-9]/g, '').slice(0, OTP_CODE_LENGTH);
                  field.onChange(digitsOnly);
                }}
                placeholder="123456"
                aria-invalid={fieldState.invalid}
                className="text-center text-2xl tracking-[0.35em] font-mono h-12"
                autoComplete="one-time-code"
                disabled={verifyMutation.isPending}
                autoFocus
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {verifyMutation.isError && <FieldError>{verifyMutation.error.message}</FieldError>}
        {resendMutation.isError && <FieldError>{resendMutation.error.message}</FieldError>}

        <Button
          type="submit"
          disabled={(watchedCode?.length ?? 0) !== OTP_CODE_LENGTH || !displayEmail || verifyMutation.isPending}
          className="w-full">
          {verifyMutation.isPending ? (
            <span className="flex items-center gap-2">
              <LoaderIcon className="size-4 animate-spin" />
              <span>Memverifikasi...</span>
            </span>
          ) : (
            'Verifikasi Akun'
          )}
        </Button>

        <div className="pt-2 text-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={cooldownSeconds > 0 || resendMutation.isPending || !displayEmail}
            onClick={HandleResendCode}
            className="text-xs text-muted-foreground hover:text-foreground">
            {cooldownSeconds > 0
              ? `Kirim ulang kode dalam (${cooldownSeconds}s)`
              : resendMutation.isPending
                ? 'Mengirim kode baru...'
                : 'Belum terima kode? Kirim ulang'}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
