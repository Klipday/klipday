import { LoaderIcon } from '@solar-icons/react/linear';
import { Navigate } from 'react-router';
import { UseCurrentAccountQuery } from '@/features/authentication/hooks';
import { GetDashboardRouteByRole } from '@/features/authentication/utils';

/**
 * Route redirection component that navigates an authenticated user to their role-specific dashboard.
 * Guards against undefined/unrecognized roles to prevent infinite self-redirect loops.
 *
 * @returns A loading indicator or Navigate component redirecting to the resolved role dashboard or sign-in.
 */
export function DashboardRoleRedirect() {
  const { data: account, isLoading } = UseCurrentAccountQuery();

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <LoaderIcon className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!account) {
    return <Navigate to="/signin" replace />;
  }

  const targetPath = GetDashboardRouteByRole(account.role);

  if (targetPath === '/dashboard') {
    return <Navigate to="/signin" replace />;
  }

  return <Navigate to={targetPath} replace />;
}
