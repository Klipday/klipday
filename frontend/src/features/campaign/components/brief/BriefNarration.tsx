import { cn } from '@/lib/utils';
import type { BriefNarrationProps } from '../../types';

/**
 * Reusable component for displaying campaign narration scripts.
 *
 * @param props - Narration script text and optional styling.
 * @returns The rendered narration script view.
 */
export function BriefNarration({ narration, className }: BriefNarrationProps) {
  const hasNarration = Boolean(narration?.trim());

  if (!hasNarration) {
    return (
      <p className={cn('text-xs sm:text-sm text-muted-foreground italic pt-1 leading-relaxed', className)}>
        Brand membebaskan narasi video. Kamu bebas berkreasi pakai gaya khas kamu sendiri, asalkan pesan utama kampanye tetap tersampaikan dengan jelas.
      </p>
    );
  }

  return (
    <div className={cn('space-y-2 pt-1', className)}>
      <span className="text-xs text-muted-foreground block">
        Skrip narasi dari brand:
      </span>
      <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 sm:p-4 select-text">
        <p className="text-xs sm:text-sm text-foreground whitespace-pre-line leading-relaxed select-text cursor-text">
          {narration}
        </p>
      </div>
    </div>
  );
}
