import { useState } from 'react';
import { Link } from 'react-router';
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
import { UseForgotPasswordMutation } from '../hooks';

/**
 * Page allowing users to request a secure 1-hour password reset link to their email address.
 *
 * @returns The rendered forgot password card.
 */
function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const mutation = UseForgotPasswordMutation({
    onSuccess: () => {
      setSubmittedEmail(email);
    },
  });

  /**
   * Submits the forgot password request.
   */
  function OnSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || mutation.isPending) return;

    mutation.mutate({ email: email.trim().toLowerCase() });
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
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ email: submittedEmail })}>
            {mutation.isPending ? 'Mengirim ulang...' : 'Kirim Ulang Email'}
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
        <form noValidate onSubmit={OnSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="forgot-email">Email Akun</FieldLabel>
              <Input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                autoComplete="email"
                disabled={mutation.isPending}
                autoFocus
              />
            </Field>

            {mutation.isError && <FieldError>{mutation.error.message}</FieldError>}

            <Button type="submit" disabled={!email.trim() || mutation.isPending} className="w-full">
              {mutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
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

export default ForgotPassword;
