import { useEffect } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SyncRoutePageSeo } from '@/lib/seo';
import { SignInForm } from '../components';

/**
 * Sign in page. Orchestrates the card sections and the sign in form inside
 * the auth layout; all form logic lives in the `SignInForm` component.
 *
 * @returns The sign in page content.
 */
function SignIn() {
  useEffect(() => {
    SyncRoutePageSeo('/signin');
  }, []);
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Masuk</CardTitle>
        <CardDescription>Masuk dengan email dan kata sandi akun Anda.</CardDescription>
      </CardHeader>
      <CardContent>
        <SignInForm />
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Belum punya akun?&nbsp;
        <Link to="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
          Daftar
        </Link>
      </CardFooter>
    </Card>
  );
}

export default SignIn;
