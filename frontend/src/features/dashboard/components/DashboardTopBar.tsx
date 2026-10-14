import { Menu } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { UseNavbar } from '../hooks';
import type { DashboardTopBarProps } from '../types';
import { UserNav } from './UserNav';

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
    <header className="sticky top-0 z-40 flex h-16 shrink-0 w-full items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60 sm:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={ToggleMobileMenu}
          aria-label="Buka menu navigasi"
          aria-expanded={isMobileOpen}>
          <Menu className="h-5 w-5" />
        </Button>

        <Link to="/dashboard" className="flex items-center gap-2 transition-opacity hover:opacity-90 md:hidden">
          <span className="font-heading text-xl font-bold tracking-tight">
            Klip<span className="text-primary">day</span>
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <UserNav name={userName} email={userEmail} role={userRole} avatarUrl={avatarUrl} />
      </div>
    </header>
  );
}
