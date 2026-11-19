import { HamburgerMenuIcon } from '@solar-icons/react/linear';
import { Button } from '@/components/ui/button';
import { UseNavbar } from '../hooks';
import type { DashboardTopBarProps } from '../types';
import { UserNav } from './UserNav';
import { NotificationBell } from '@/features/notification';

/**
 * Top bar header component positioned to the right of the sidebar.
 * Displays mobile menu controls on mobile screens and the static user profile indicator on the right.
 * Consumes UseNavbar to trigger mobile drawer visibility.
 *
 * @param props - Top bar properties including profile details.
 * @returns The rendered dashboard header bar.
 */
export function DashboardTopBar({ userName, userEmail, userRole, avatarUrl }: DashboardTopBarProps) {
  const { ToggleMobileMenu, isMobileOpen } = UseNavbar();

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 w-full items-center justify-between gap-2 border-b bg-background/95 px-3 backdrop-blur supports-backdrop-filter:bg-background/60 sm:px-6">
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0"
          onClick={ToggleMobileMenu}
          aria-label="Buka menu navigasi"
          aria-expanded={isMobileOpen}>
          <HamburgerMenuIcon className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        <NotificationBell className="shrink-0" />
        <UserNav name={userName} email={userEmail} role={userRole} avatarUrl={avatarUrl} />
      </div>
    </header>
  );
}
