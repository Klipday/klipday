import { useEffect } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UpdatePageSeo } from '@/lib/seo';
import { SignUpForm } from '../components';

/**
 * Sign up page. Orchestrates the card sections and the sign up form inside
 * the auth layout; all form logic lives in the `SignUpForm` component.
 *
 * @returns The sign up page content.
 */
function SignUp() {
  useEffect(() => {
    UpdatePageSeo({
      title: 'Daftar Akun Klipday - Gabung Creator atau Brand',
      description: 'Daftar akun Klipday gratis sekarang. Mulai hasilkan cuan dari memotong video TikTok walau 0 followers, atau pasang campaign promosi bebas boncos.',
      canonicalPath: '/signup',
    });
  }, []);
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Buat akun</CardTitle>
        <CardDescription>Daftar sebagai Creator atau Brand untuk mulai menggunakan Klipday.</CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm />
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Sudah punya akun?&nbsp;
        <Link to="/signin" className="text-primary underline-offset-4 hover:underline">
          Masuk
        </Link>
      </CardFooter>
    </Card>
  );
}

export default SignUp;
