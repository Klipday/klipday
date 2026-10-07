import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BriefDosDontsProps } from '../../types';

/**
 * Reusable component for displaying campaign Do's & Don'ts guidance.
 *
 * @param props - Lists of allowed/encouraged and prohibited practices.
 * @returns The rendered Do's and Don'ts section.
 */
export function BriefDosDonts({ dos = [], donts = [], className }: BriefDosDontsProps) {
  const cleanDos = (dos || []).filter((item) => Boolean(item && item.trim()));
  const cleanDonts = (donts || []).filter((item) => Boolean(item && item.trim()));

  const hasAnyItems = cleanDos.length > 0 || cleanDonts.length > 0;

  if (!hasAnyItems) {
    return (
      <p className={cn('text-xs sm:text-sm text-muted-foreground italic pt-1', className)}>
        Tidak ada anjuran atau larangan khusus untuk kampanye ini.
      </p>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1', className)}>
      {/* Do's (Hal yang Dianjurkan) */}
      <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <Check className="size-3.5 stroke-[2.5]" />
          <span>Hal yang Dianjurkan (Do&apos;s)</span>
        </div>
        {cleanDos.length > 0 ? (
          <ul className="space-y-1.5 text-xs text-foreground leading-relaxed">
            {cleanDos.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground italic">Tidak ada anjuran khusus.</p>
        )}
      </div>

      {/* Don'ts (Hal yang Dilarang) */}
      <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
          <X className="size-3.5 stroke-[2.5]" />
          <span>Hal yang Dilarang (Don&apos;ts)</span>
        </div>
        {cleanDonts.length > 0 ? (
          <ul className="space-y-1.5 text-xs text-foreground leading-relaxed">
            {cleanDonts.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-destructive font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground italic">Tidak ada larangan khusus.</p>
        )}
      </div>
    </div>
  );
}
