import { DangerCircleIcon, RestartIcon } from '@solar-icons/react/linear';
import { Button } from '@/components/ui/button';
import { ExtractApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { BrandCampaignsErrorStateProps } from '../types';

/**
 * Error state component for the brand campaigns dashboard.
 * Displays user-friendly error feedback when campaign data fails to load,
 * along with an optional retry button.
 *
 * @param props - Component properties containing the error object, custom message, retry callback, and className.
 * @returns The rendered error state element.
 */
export function BrandCampaignsErrorState({
  error,
  message,
  onRetry,
  className,
}: BrandCampaignsErrorStateProps) {
  const apiError = ExtractApiError(error, 'Gagal memuat kampanye. Silakan periksa koneksi internet Anda.');
  const errorMessage = message ?? apiError.message;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center sm:p-12',
        className
      )}
      data-testid="brand-campaigns-error">
      <DangerCircleIcon className="size-10 text-destructive/80 mb-3" />
      <h3 className="font-heading text-base font-semibold text-foreground">Gagal Memuat Kampanye</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-md">{errorMessage}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 gap-2 cursor-pointer">
          <RestartIcon className="size-4" />
          <span>Coba Lagi</span>
        </Button>
      )}
    </div>
  );
}
