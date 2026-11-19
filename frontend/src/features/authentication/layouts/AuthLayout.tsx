import { Suspense } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LoaderIcon } from '@solar-icons/react/linear';
import { Link, Navigate, Outlet, useLocation } from 'react-router';
import { KlipdayLogo } from '@/components';
import type { CurrentAccountProfile } from '../types';
import { GetDashboardRouteByRole } from '../utils';

const GUEST_ONLY_AUTH_PATHS = ['/signin', '/login', '/signup'] as const;

/**
 * Layout for the authentication pages (sign in / sign up / verification / recovery).
 * Redirects cached authenticated sessions away from guest-only sign-in/sign-up routes,
 * displays the Klipday brand logo on the top-left, and renders the active page centered.
 *
 * @returns The auth layout wrapper with a centered outlet.
 */
function AuthLayout() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const cachedAccount = queryClient.getQueryData<CurrentAccountProfile>(['current-account']);
  const isGuestOnlyPath = GUEST_ONLY_AUTH_PATHS.some((path) => location.pathname === path);

  if (cachedAccount && isGuestOnlyPath) {
    const dashboardPath = GetDashboardRouteByRole(cachedAccount.role);
    return <Navigate to={dashboardPath} replace />;
  }

  return (
    <main className="flex min-h-svh flex-col bg-muted/40">
      <header className="p-6">
        <Link to="/" className="inline-block transition-opacity hover:opacity-90">
          <KlipdayLogo size="lg" />
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center p-6">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-8">
              <LoaderIcon className="size-8 animate-spin text-primary" />
            </div>
          }>
          <Outlet />
        </Suspense>
      </div>
    </main>
  );
}

export default AuthLayout;
