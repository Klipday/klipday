import { Suspense, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Outlet, useLocation } from 'react-router';
import { UseCurrentAccountQuery } from '@/features/authentication/hooks';
import { DashboardSidebar, DashboardTopBar } from '@/features/dashboard/components';
import { NavbarProvider } from '@/features/dashboard/context';

/**
 * Main dashboard layout orchestrator.
 * Wraps the dashboard layout shell in a NavbarProvider, combining the sticky top bar,
 * the role-dynamic left sidebar navigation, and the main scrollable content outlet.
 * Automatically resets scroll position of the main content view to the top on route transitions.
 *
 * @returns The full-height dashboard layout shell.
 */
function DashboardLayout() {
  const { data: userProfile } = UseCurrentAccountQuery();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  const avatarUrl = userProfile?.avatarUrl ?? userProfile?.brand?.logoUrl ?? userProfile?.creator?.avatarUrl ?? null;

  return (
    <NavbarProvider>
      <div className="fixed inset-0 flex overflow-hidden bg-background text-foreground">
        <DashboardSidebar role={userProfile?.role} />
        <div className="flex flex-1 flex-col h-full min-h-0 overflow-hidden">
          <DashboardTopBar
            userName={userProfile?.name}
            userEmail={userProfile?.email}
            userRole={userProfile?.role}
            avatarUrl={avatarUrl}
          />
          <main ref={mainRef} className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
            <div className="w-full">
              <Suspense
                fallback={
                  <div className="flex min-h-[50vh] w-full items-center justify-center">
                    <Loader2 className="size-8 animate-spin text-primary" />
                  </div>
                }>
                <Outlet context={{ user: userProfile }} />
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </NavbarProvider>
  );
}

export default DashboardLayout;
