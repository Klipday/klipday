import { Button } from '@/components/ui/button';
import type { AdminProfileErrorStateProps } from '../types';

/**
 * Dedicated error recovery card shown when the administrator profile fails to load.
 *
 * @param props - Error message copy and retry trigger callback.
 * @returns The rendered error card with a retry button.
 */
export function AdminProfileErrorState({ message, onRetry }: AdminProfileErrorStateProps) {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-xl border border-border/60 bg-card p-8 text-center space-y-4">
        <div className="space-y-1.5">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Gagal Memuat Profil Administrator
          </h2>
          <p className="mx-auto max-w-md text-xs text-muted-foreground">
            {message || 'Terjadi kendala saat mengambil data profil administrator Anda.'}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="cursor-pointer">
          Coba Lagi
        </Button>
      </div>
    </div>
  );
}
