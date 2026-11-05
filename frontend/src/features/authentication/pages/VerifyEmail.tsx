import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Loader2 } from 'lucide-react';
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
import { UseResendVerificationMutation, UseVerifyEmailMutation } from '../hooks';

/**
 * Page allowing users to verify their account via 6-digit OTP code or instant link.
 * Features automatic code verification on mount, active 60-second resend cooldown timer,
 * and clean Indonesian messaging without generic AI icons.
 *
 * @returns The rendered email verification card.
 */
function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') ?? '';
  const initialCode = searchParams.get('code') ?? '';

  const [email, setEmail] = useState(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(!initialEmail);
  const [otpCode, setOtpCode] = useState(initialCode);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const hasAutoVerifiedRef = useRef(false);

  const verifyMutation = UseVerifyEmailMutation();
  const resendMutation = UseResendVerificationMutation();

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Auto-verify if code is provided in URL on mount
  useEffect(() => {
    if (
      initialEmail &&
      initialCode &&
      initialCode.length === 6 &&
      !hasAutoVerifiedRef.current &&
      !verifyMutation.isPending &&
      !verifyMutation.isSuccess
    ) {
      hasAutoVerifiedRef.current = true;
      verifyMutation.mutate({
        email: initialEmail,
        code: initialCode,
      });
    }
  }, [initialEmail, initialCode, verifyMutation]);

  /**
   * Handles 6-digit OTP code input change, allowing only digits and max 6 characters.
   */
  function HandleOtpChange(e: React.ChangeEvent<HTMLInputElement>) {
    const rawVal = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setOtpCode(rawVal);
  }

  /**
   * Submits the 6-digit verification code.
   */
  function OnSubmitVerification(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || otpCode.length !== 6) return;

    verifyMutation.mutate({
      email: email.trim().toLowerCase(),
      code: otpCode.trim(),
    });
  }

  /**
   * Handles resending the verification code and initiates the 60-second cooldown timer.
   */
  function HandleResendCode() {
    if (!email.trim() || cooldownSeconds > 0 || resendMutation.isPending) return;

    resendMutation.mutate(
      { email: email.trim().toLowerCase() },
      {
        onSuccess: () => {
          setCooldownSeconds(60);
        },
      },
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Verifikasi Email</CardTitle>
        <CardDescription>
          Masukkan kode verifikasi 6 digit yang telah dikirimkan ke email Anda.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={OnSubmitVerification} className="space-y-4">
          <FieldGroup>
            {isEditingEmail || !email ? (
              <Field>
                <FieldLabel htmlFor="verify-email-input">Email Akun</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="verify-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    autoComplete="email"
                    disabled={verifyMutation.isPending}
                  />
                  {email && initialEmail && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingEmail(false)}>
                      Batal
                    </Button>
                  )}
                </div>
              </Field>
            ) : (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Email tujuan:</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingEmail(true)}
                    className="font-medium text-primary hover:underline">
                    Ganti
                  </button>
                </div>
                <div className="font-semibold text-foreground truncate">{email}</div>
              </div>
            )}

            <Field>
              <FieldLabel htmlFor="otp-code-input">Kode Verifikasi (6 Angka)</FieldLabel>
              <Input
                id="otp-code-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otpCode}
                onChange={HandleOtpChange}
                placeholder="123456"
                className="text-center text-2xl tracking-[0.35em] font-mono h-12"
                autoComplete="one-time-code"
                disabled={verifyMutation.isPending}
                autoFocus
              />
            </Field>

            {verifyMutation.isError && (
              <FieldError>{verifyMutation.error.message}</FieldError>
            )}

            {resendMutation.isError && (
              <FieldError>{resendMutation.error.message}</FieldError>
            )}

            <Button
              type="submit"
              disabled={otpCode.length !== 6 || !email || verifyMutation.isPending}
              className="w-full">
              {verifyMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
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
                disabled={cooldownSeconds > 0 || resendMutation.isPending || !email}
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
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        <Link to="/signin" className="hover:underline">
          Kembali ke halaman Masuk
        </Link>
      </CardFooter>
    </Card>
  );
}

export default VerifyEmail;
