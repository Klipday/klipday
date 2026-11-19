import { Link } from 'react-router';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { UserNavProps } from '../types';

/**
 * Extracts a 2-character initials string from a person or company name.
 *
 * @param name - The full name or company name to extract initials from.
 * @returns An uppercase string with up to 2 characters representing the initials.
 */
function GetInitials(name?: string | null): string {
  const cleanName = name?.trim();
  if (!cleanName) {
    return 'KD';
  }

  const words = cleanName.split(/\s+/);
  if (words.length >= 2) {
    const initials = `${words[0][0]}${words[1][0]}`.toUpperCase();
    return initials;
  }

  const initials = cleanName.slice(0, 2).toUpperCase();
  return initials;
}

/**
 * Formats a user role string into a user-friendly account type label.
 *
 * @param role - The authenticated user's role identifier.
 * @returns Human-readable account type label.
 */
function FormatAccountType(role?: string | null): string {
  if (!role) {
    return 'Akun Pengguna';
  }

  const normalizedRole = role.trim().toUpperCase();
  if (normalizedRole === 'BRAND') {
    return 'Brand';
  }
  if (normalizedRole === 'CREATOR') {
    return 'Creator';
  }
  if (normalizedRole === 'ADMIN') {
    return 'Admin';
  }

  return role;
}

/**
 * Resolves the role-specific profile route for the top bar profile badge.
 * Returns null for roles without a dedicated profile page (e.g. ADMIN).
 *
 * @param role - The authenticated user's role identifier.
 * @returns Profile route path or null if unavailable.
 */
function GetProfileRouteByRole(role?: string | null): string | null {
  if (!role) {
    return null;
  }

  const normalizedRole = role.trim().toUpperCase();
  if (normalizedRole === 'BRAND') {
    return '/brand-dashboard/profile';
  }
  if (normalizedRole === 'CREATOR') {
    return '/creator-dashboard/profile';
  }

  return null;
}

/**
 * Top bar user profile badge displaying avatar photo, display name, and account type.
 * Navigates directly to the role's profile page on click for Brand and Creator accounts,
 * while remaining static for roles without a profile page.
 *
 * @param props - User profile properties including name, role, and avatarUrl.
 * @returns The top bar profile badge element or link.
 */
export function UserNav({ name, role, avatarUrl }: UserNavProps) {
  const displayName = name?.trim() || 'Pengguna';
  const initials = GetInitials(name);
  const accountType = FormatAccountType(role);
  const profileRoute = GetProfileRouteByRole(role);

  const profileContent = (
    <>
      <Avatar className="size-8 sm:size-9 border border-border/60 shrink-0">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" /> : null}
        <AvatarFallback className="bg-primary/10 font-medium text-primary text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start min-w-0">
        <span className="text-xs sm:text-sm font-semibold leading-none text-foreground truncate max-w-[100px] sm:max-w-[180px]">
          {displayName}
        </span>
        <span className="mt-1 text-[10px] sm:text-[11px] font-medium text-muted-foreground leading-none">
          {accountType}
        </span>
      </div>
    </>
  );

  if (profileRoute) {
    return (
      <Link
        to={profileRoute}
        aria-label="Buka profil akun"
        className="flex items-center gap-2 sm:gap-3 min-w-0 select-none rounded-xl px-1.5 py-1 sm:px-2 sm:-mr-2 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {profileContent}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3 min-w-0 select-none py-1">
      {profileContent}
    </div>
  );
}
