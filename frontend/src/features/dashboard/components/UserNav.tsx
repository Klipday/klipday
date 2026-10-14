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
 * Static user profile display component for the dashboard top bar.
 * Purely informational and static (non-interactive): renders the user's
 * profile avatar photo, display name, and designated account type.
 *
 * @param props - User profile properties including name, role, and avatarUrl.
 * @returns The static profile display element.
 */
export function UserNav({ name, role, avatarUrl }: UserNavProps) {
  const displayName = name?.trim() || 'Pengguna';
  const initials = GetInitials(name);
  const accountType = FormatAccountType(role);

  return (
    <div className="flex items-center gap-2.5 sm:gap-3 select-none py-1">
      <Avatar className="size-9 border border-border/60 shrink-0">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" /> : null}
        <AvatarFallback className="bg-primary/10 font-medium text-primary text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start min-w-0">
        <span className="text-xs sm:text-sm font-semibold leading-none text-foreground truncate max-w-[120px] sm:max-w-[180px]">
          {displayName}
        </span>
        <span className="mt-1 text-[10px] sm:text-[11px] font-medium text-muted-foreground leading-none">
          {accountType}
        </span>
      </div>
    </div>
  );
}
