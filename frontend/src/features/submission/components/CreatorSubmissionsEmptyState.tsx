import { Video } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CreatorSubmissionsEmptyStateProps } from '../types';

/**
 * Clean empty state for Creator Submissions workspace.
 * Displays a minimal, noise-free prompt with action buttons to reset filters or explore campaigns.
 *
 * @param props - Component configuration containing hasFilters flag and onResetFilters callback.
 * @returns Rendered empty state element.
 */
export function CreatorSubmissionsEmptyState({
  hasFilters,
  onResetFilters,
  className,
}: CreatorSubmissionsEmptyStateProps) {
  if (hasFilters) {
    return (
      <div
        className={cn(
          'flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/10 p-8 text-center space-y-3',
          className,
        )}>
        <p className="text-sm font-semibold text-foreground">
          Tidak Ada Submisi yang Sesuai
        </p>
        <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
          Tidak ada video klip yang cocok dengan status filter atau kata kunci pencarian yang kamu pilih.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onResetFilters}
          className="rounded-xl text-xs h-8 px-4 cursor-pointer">
          Reset Filter
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/10 p-8 text-center space-y-3.5',
        className,
      )}>
      <div className="flex size-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground border border-border/40">
        <Video className="size-5 text-muted-foreground/70" />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-sm font-semibold text-foreground">
          Belum Ada Submisi Video
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Kamu belum mengirimkan video klip ke kampanye mana pun. Temukan kampanye yang sesuai dengan niche kontenmu dan mulailah menghasilkan cuan per views.
        </p>
      </div>
      <Button
        asChild
        size="sm"
        className="rounded-xl text-xs h-8 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
        <Link to="/creator-dashboard/creator-campaigns">
          Jelajahi Kampanye
        </Link>
      </Button>
    </div>
  );
}
