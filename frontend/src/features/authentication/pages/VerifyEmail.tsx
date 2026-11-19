import { Link } from 'react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { VerifyEmailForm } from '../components';

/**
 * Email verification page orchestrator. Renders the OTP verification card and delegates
 * form state, auto-verification, and resend cooldown handling to `VerifyEmailForm`.
 *
 * @returns The rendered email verification page.
 */
function VerifyEmail() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Verifikasi Email</CardTitle>
        <CardDescription>
          Masukkan kode verifikasi 6 digit yang telah dikirimkan ke email Anda.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <VerifyEmailForm />
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
