import { Button } from '@/components/ui/button';
import type { AdminSettlementsErrorStateProps } from '../types';

/**
 * Dedicated error recovery component for the Admin Settlement queue.
 *
 * @param props - Component props containing error message and onRetry callback.
 * @returns The rendered error card with retry action.
 */
export function AdminSettlementsErrorState({
  message,
  onRetry,
}: AdminSettlementsErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
      <h3 className="text-sm font-semibold tracking-tight text-foreground">
        Gagal Memuat Antrean Settlement
      </h3>
      <p className="mt-1 max-w-md text-xs text-muted-foreground">{message}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="mt-4 h-8 text-xs"
      >
        Coba Lagi
      </Button>
    </div>
  );
}
