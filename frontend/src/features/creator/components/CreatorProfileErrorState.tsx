import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CreatorProfileErrorStateProps } from '../types';

/**
 * Dedicated error recovery state component for the creator profile page.
 *
 * @param props - Retry callback handler and optional className.
 * @returns The rendered error state component.
 */
export function CreatorProfileErrorState({
  onRetry,
  className,
}: CreatorProfileErrorStateProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-4 max-w-lg mx-auto',
        className,
      )}>
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20">
        <AlertTriangle className="size-6" />
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">
          Gagal Memuat Profil Kreator
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Terjadi kesalahan saat memuat informasi profil akun Anda. Silakan coba beberapa saat lagi atau muat ulang halaman.
        </p>
      </div>

      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="cursor-pointer text-xs border-border/80 hover:bg-muted/40">
          <RotateCw className="mr-1.5 size-3.5" />
          <span>Coba Lagi</span>
        </Button>
      ) : null}
    </div>
  );
}
