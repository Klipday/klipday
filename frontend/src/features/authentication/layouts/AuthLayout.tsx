import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Link, Outlet } from 'react-router';

/**
 * Layout for the authentication pages (sign in / sign up).
 * Shows the Klipday brand logo on the top-left linking to home and renders
 * the active auth page inside a centered container.
 *
 * @returns The auth layout wrapper with a centered outlet.
 */
function AuthLayout() {
  return (
    <main className="flex min-h-svh flex-col bg-muted/40">
      <header className="p-6">
        <Link to="/" className="inline-block transition-opacity hover:opacity-80">
          <span className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Klipday<span className="text-rose-500">.</span>
          </span>
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center p-6">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-8">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          }>
          <Outlet />
        </Suspense>
      </div>
    </main>
  );
}

export default AuthLayout;
