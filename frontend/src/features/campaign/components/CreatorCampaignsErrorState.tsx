import { DangerCircleIcon, RestartIcon } from '@solar-icons/react/linear';
import { Button } from '@/components/ui/button';
import { ExtractApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { CreatorCampaignsErrorStateProps } from '../types';

/**
 * Dedicated error state component for the creator campaigns discovery page.
 * Displays clear, localized error feedback and a retry action button.
 *
 * @param props - Component properties containing error object, custom message, retry callback, and className.
 * @returns The rendered creator campaigns error state element.
 */
export function CreatorCampaignsErrorState({
  error,
  message,
  onRetry,
  className,
}: CreatorCampaignsErrorStateProps) {
  const apiError = ExtractApiError(error, 'Gagal memuat daftar kampanye. Silakan periksa koneksi internet Anda.');
  const errorMessage = message ?? apiError.message;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-14 text-center sm:py-18',
        className
      )}
      data-testid="creator-campaigns-error">
      <div className="mb-3.5 flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
        <DangerCircleIcon className="size-6" />
      </div>

      <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
        Gagal Memuat Kampanye
      </h3>

      <p className="mt-1.5 max-w-md text-xs sm:text-sm text-muted-foreground">
        {errorMessage}
      </p>

      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-6 gap-2 rounded-xl border-border/60 hover:bg-muted/50 cursor-pointer">
          <RestartIcon className="size-4" />
          <span>Coba Lagi</span>
        </Button>
      )}
    </div>
  );
}
