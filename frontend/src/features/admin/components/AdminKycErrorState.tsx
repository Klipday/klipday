import { Button } from '@/components/ui/button';
import type { AdminKycErrorStateProps } from '../types';

/**
 * Dedicated error recovery card for the Admin KYC verification queue.
 *
 * @param props - Component props containing error message and onRetry callback.
 * @returns The rendered error recovery card with retry button.
 */
export function AdminKycErrorState({ message, onRetry }: AdminKycErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
      <h3 className="text-sm font-semibold tracking-tight text-foreground">
        Gagal Memuat Antrean Verifikasi KYC
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
