import { RotateCcw, SearchX, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CampaignDetailBrandSubmissionsEmptyProps } from '../types';

/**
 * Empty state component rendered when no submissions are found.
 * Distinguishes between zero submissions total and zero results matching active search/filters.
 *
 * @param props - Configuration properties including filter presence and reset callback.
 * @returns The rendered empty state view.
 */
export function CampaignDetailBrandSubmissionsEmpty({
  hasFilters,
  onResetFilters,
  className,
}: CampaignDetailBrandSubmissionsEmptyProps) {
  if (hasFilters) {
    return (
      <div
        className={cn(
          'flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 p-8 text-center space-y-3.5',
          className,
        )}>
        <div className="flex size-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground border border-border/40">
          <SearchX className="size-5" />
        </div>
        <div className="max-w-md space-y-1">
          <h3 className="text-sm font-medium text-foreground">
            Tidak Ada Pengajuan yang Cocok
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tidak ditemukan video pengajuan dengan filter atau kata kunci yang dipilih. Silakan reset filter untuk melihat semua pengajuan.
          </p>
        </div>
        {onResetFilters && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="gap-1.5 text-xs rounded-lg cursor-pointer border-border/60">
            <RotateCcw className="size-3.5" />
            <span>Reset Filter</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 p-8 text-center space-y-3.5',
        className,
      )}>
      <div className="flex size-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground border border-border/40">
        <Video className="size-5" />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-sm font-medium text-foreground">
          Belum Ada Pengajuan Video
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Kreator yang bergabung dan mengirimkan tautan video TikTok mereka akan muncul di sini untuk kamu pantau dan review.
        </p>
      </div>
    </div>
  );
}
