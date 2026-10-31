import { Button } from '@/components/ui/button';
import type { AdminTopUpErrorStateProps } from '../types';

/**
 * Dedicated error recovery component for the Admin Top-Up Verification queue.
 *
 * @param props - Component props containing error message and onRetry callback.
 * @returns The rendered error card with retry action.
 */
export function AdminTopUpErrorState({
  message,
  onRetry,
}: AdminTopUpErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
      <h3 className="text-sm font-semibold tracking-tight text-foreground">
        Gagal Memuat Antrean Top Up
      </h3>
      <p className="mt-1 max-w-md text-xs text-muted-foreground">{message}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="mt-4 h-8 text-xs cursor-pointer"
      >
        Coba Lagi
      </Button>
    </div>
  );
}
