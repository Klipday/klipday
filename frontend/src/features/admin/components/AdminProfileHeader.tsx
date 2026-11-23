import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { AdminProfileHeaderProps } from '../types';
import { FormatAdminJoinedDate, GetAdminInitials } from '../utils/profile-form.utils';

/**
 * Displays the top identity summary card for the administrator profile page.
 * Renders a neutral initials avatar, full name heading, and spaced plain-text metadata.
 *
 * @param props - Component properties containing the active administrator profile.
 * @returns The rendered administrator profile header card.
 */
export function AdminProfileHeader({ profile }: AdminProfileHeaderProps) {
  const initials = GetAdminInitials(profile.fullName);
  const joinedDate = FormatAdminJoinedDate(profile.createdAt);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar className="size-16 shrink-0 rounded-full after:border-0">
          <AvatarFallback className="rounded-full bg-muted text-lg font-semibold tracking-tight text-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
            {profile.fullName}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">Administrator</span>
            <span className="break-all">{profile.email}</span>
            <span className="tabular-nums">Bergabung {joinedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
