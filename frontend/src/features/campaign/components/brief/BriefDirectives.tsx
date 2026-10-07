import { cn } from '@/lib/utils';
import type { BriefDirectivesProps } from '../../types';

/**
 * Reusable component presenting core campaign directives:
 * Call to Action (CTA), Key Message, Campaign Purpose, Impression/Mood, and Required Caption.
 * Supports both 2-column card grid (for detail page) and clean hairline divider stack (for modal dialog).
 *
 * @param props - Brief data, layout variant, and optional styling.
 * @returns The rendered brief directives element or null if empty.
 */
export function BriefDirectives({
  brief,
  layout = 'grid',
  className,
}: BriefDirectivesProps) {
  const hasDirectives = Boolean(
    brief?.callToAction?.trim() ||
      brief?.keyMessage?.trim() ||
      brief?.purpose?.trim() ||
      brief?.impression?.trim() ||
      brief?.requiredCaption?.trim()
  );

  if (!brief || !hasDirectives) {
    return (
      <p className="text-xs sm:text-sm text-muted-foreground italic py-2">
        Ketentuan wajib untuk video kampanye ini belum diatur oleh brand.
      </p>
    );
  }

  if (layout === 'stack') {
    return (
      <div className={cn('divide-y divide-border/30 pt-0.5', className)}>
        {/* Call to Action */}
        {brief.callToAction && (
          <div className="py-2.5 first:pt-0 space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Call to Action (CTA)
            </span>
            <p className="text-xs text-foreground leading-relaxed font-medium select-all cursor-text">
              {brief.callToAction}
            </p>
          </div>
        )}

        {/* Key Message */}
        {brief.keyMessage && (
          <div className="py-2.5 first:pt-0 space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Pesan Utama (Key Message)
            </span>
            <p className="text-xs text-foreground leading-relaxed font-medium select-text cursor-text">
              {brief.keyMessage}
            </p>
          </div>
        )}

        {/* Campaign Purpose */}
        {brief.purpose && (
          <div className="py-2.5 first:pt-0 space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Tujuan Kampanye
            </span>
            <p className="text-xs text-foreground leading-relaxed select-text cursor-text">
              {brief.purpose}
            </p>
          </div>
        )}

        {/* Impression & Mood */}
        {brief.impression && (
          <div className="py-2.5 first:pt-0 space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Kesan &amp; Mood Konten
            </span>
            <p className="text-xs text-foreground leading-relaxed select-text cursor-text">
              {brief.impression}
            </p>
          </div>
        )}

        {/* Guidelines / Hook */}
        {brief.guidelines && (
          <div className="py-2.5 first:pt-0 space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Arahan Kreatif &amp; Rekomendasi Hook
            </span>
            <p className="text-xs text-foreground leading-relaxed whitespace-pre-line select-text cursor-text">
              {brief.guidelines}
            </p>
          </div>
        )}

        {/* Required Caption */}
        {brief.requiredCaption && (
          <div className="py-2.5 first:pt-0 space-y-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Caption Wajib
            </span>
            <p className="text-xs text-foreground leading-relaxed font-mono bg-muted/20 p-2.5 rounded-lg border border-border/40 whitespace-pre-wrap select-all cursor-text">
              {brief.requiredCaption}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Grid layout (for campaign detail page)
  return (
    <div className={cn('space-y-4 pt-1', className)}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {brief.callToAction && (
          <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Call to Action (CTA)
            </span>
            <p className="text-xs sm:text-sm text-foreground leading-relaxed font-medium select-all cursor-text">
              {brief.callToAction}
            </p>
          </div>
        )}

        {brief.keyMessage && (
          <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Pesan Utama (Key Message)
            </span>
            <p className="text-xs sm:text-sm text-foreground leading-relaxed select-text cursor-text">
              {brief.keyMessage}
            </p>
          </div>
        )}

        {brief.purpose && (
          <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Tujuan Kampanye
            </span>
            <p className="text-xs sm:text-sm text-foreground leading-relaxed select-text cursor-text">
              {brief.purpose}
            </p>
          </div>
        )}

        {brief.impression && (
          <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Kesan &amp; Mood Konten
            </span>
            <p className="text-xs sm:text-sm text-foreground leading-relaxed select-text cursor-text">
              {brief.impression}
            </p>
          </div>
        )}
      </div>

      {brief.requiredCaption && (
        <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-2">
          <span className="text-xs font-semibold text-foreground block">Caption Wajib</span>
          <p className="rounded-lg border border-border/40 bg-background/80 p-3 text-xs text-foreground font-mono leading-relaxed whitespace-pre-wrap select-all cursor-text">
            {brief.requiredCaption}
          </p>
        </div>
      )}
    </div>
  );
}
