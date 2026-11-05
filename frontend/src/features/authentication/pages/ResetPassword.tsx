import { useState } from 'react';
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
import { PasswordInput } from '../components/PasswordInput';
import { UseResetPasswordMutation } from '../hooks';

/**
 * Page allowing users to set a new password using a valid single-use token from their email.
 *
 * @returns The rendered reset password card.
 */
function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clientError, setClientError] = useState<string | null>(null);

  const mutation = UseResetPasswordMutation();

  /**
   * Validates and submits the new password.
   */
  function OnSubmit(e: React.FormEvent) {
    e.preventDefault();
    setClientError(null);

    if (password.length < 8) {
      setClientError('Kata sandi harus minimal 8 karakter.');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setClientError('Kata sandi harus mengandung minimal 1 huruf besar.');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setClientError('Kata sandi harus mengandung minimal 1 angka.');
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setClientError('Kata sandi harus mengandung minimal 1 simbol.');
      return;
    }

    if (password !== confirmPassword) {
      setClientError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    mutation.mutate({
      token,
      password,
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
        <form noValidate onSubmit={OnSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="new-password">Kata Sandi Baru</FieldLabel>
              <PasswordInput
                id="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={mutation.isPending}
                autoFocus
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="confirm-password">Konfirmasi Kata Sandi Baru</FieldLabel>
              <PasswordInput
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={mutation.isPending}
              />
            </Field>

            {clientError && <FieldError>{clientError}</FieldError>}
            {mutation.isError && <FieldError>{mutation.error.message}</FieldError>}

            <Button
              type="submit"
              disabled={!password || !confirmPassword || mutation.isPending}
              className="w-full">
              {mutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
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

export default ResetPassword;
