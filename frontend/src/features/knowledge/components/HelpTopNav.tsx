import { Link } from 'react-router';
import { cn } from '@/lib/utils';
import { UseCurrentAccountQuery } from '@/features/authentication/hooks';
import type { HelpTopNavProps } from '../types';

/**
 * Clean top navigation bar for the knowledge and help page.
 * Displays the brand logo and login/registration links for public guests.
 * The back button is delegated to the page header directly above the title.
 *
 * @param props - Custom styling classes.
 * @returns The rendered sticky top navigation bar.
 */
export function HelpTopNav({ className = '' }: HelpTopNavProps) {
  const { data: userProfile } = UseCurrentAccountQuery();

  const navClasses = cn(
    'sticky top-0 z-50 w-full bg-[#09090b]/80 backdrop-blur-md border-b border-white/5',
    className
  );

  return (
    <header className={navClasses}>
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center font-heading text-lg font-bold tracking-tight text-white transition-opacity hover:opacity-90"
        >
          Klipday<span className="text-rose-500">.</span>
        </Link>

        {/* Right CTA Area for public guests */}
        {!userProfile && (
          <div className="flex items-center gap-4">
            <Link
              to="/signin"
              className="font-medium text-xs text-zinc-400 transition-colors hover:text-white"
            >
              Masuk
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-full bg-rose-600 px-4 py-1.5 font-medium text-xs text-white shadow-[0_0_16px_rgba(225,29,72,0.35)] transition-all hover:bg-rose-500 hover:scale-[1.02]"
            >
              Mulai Ngeklip
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
