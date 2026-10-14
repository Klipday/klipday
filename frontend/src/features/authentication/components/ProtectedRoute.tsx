import { Loader2 } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { UseCurrentAccountQuery } from '../hooks';
import type { ProtectedRouteProps } from '../types';

/**
 * Route guard component that protects authenticated routes (e.g. `/dashboard`).
 * Checks for an active user session via `/auth/me`. If unauthenticated,
 * redirects the user to `/signin` while preserving their intended location in state.
 * If allowedRoles is specified and the user's role does not match,
 * blocks access and redirects the authenticated user to /dashboard.
 *
 * @param props - Protected route properties including optional allowedRoles list.
 * @returns The rendered child route outlet or redirect navigation.
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps = {}) {
  const { data: account, isLoading, isError } = UseCurrentAccountQuery();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !account) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(account.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

