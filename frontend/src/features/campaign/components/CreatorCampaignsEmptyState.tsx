import { CompassIcon } from '@solar-icons/react/linear';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CreatorCampaignsEmptyStateProps } from '../types';

/**
 * Dedicated empty state component for the creator marketplace campaign list.
 * Displayed when no active campaigns match or when the marketplace has no listings.
 *
 * @param props - Component properties containing optional reset/retry callback.
 * @returns The rendered empty state container.
 */
export function CreatorCampaignsEmptyState({ onReset, className }: CreatorCampaignsEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-card/40 px-6 py-16 text-center shadow-xs sm:py-20',
        className
      )}>
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground border border-border/50 mb-4">
        <CompassIcon className="size-6 opacity-70" />
      </div>

      <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
        Belum Ada Kampanye Tersedia
      </h3>

      <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-muted-foreground">
        Saat ini belum ada kampanye aktif di marketplace. Silakan periksa kembali beberapa saat lagi untuk tawaran klip terbaru.
      </p>

      {onReset && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReset}
          className="mt-6 rounded-xl border-border/60 hover:bg-muted/50 cursor-pointer">
          Muat Ulang
        </Button>
      )}
    </div>
  );
}
