import { cn } from '@/lib/utils';
import type { LegalSectionCardProps } from '../types';

/**
 * Renders a structured section within a legal document, including section title,
 * descriptive context, regulatory callouts, and numbered legal clauses.
 *
 * @param props - Section data and optional custom styling classes.
 * @returns The rendered legal section card.
 */
export function LegalSectionCard({ section, className = '' }: LegalSectionCardProps) {
  const containerClasses = cn(
    'scroll-mt-24 rounded-xl border border-white/10 bg-zinc-900/40 p-6 sm:p-8 space-y-6 transition-colors',
    className
  );

  return (
    <article id={section.id} className={containerClasses}>
      {/* Section Header */}
      <div className="space-y-1.5 border-b border-white/5 pb-4">
        <h2 className="font-heading text-lg sm:text-xl font-semibold tracking-tight text-white">
          {section.title}
        </h2>
        {section.description && (
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            {section.description}
          </p>
        )}
      </div>

      {/* Optional Regulatory / Policy Callout */}
      {section.callout && (
        <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-xs sm:text-sm text-muted-foreground space-y-1">
          <p className="font-semibold text-zinc-200">
            {section.callout.title}
          </p>
          <p className="leading-relaxed">
            {section.callout.description}
          </p>
        </div>
      )}

      {/* Numbered Clauses */}
      <div className="space-y-6">
        {section.clauses.map((clause) => (
          <div key={clause.id} id={clause.id} className="scroll-mt-24 space-y-2">
            <h3 className="font-medium text-xs sm:text-sm text-zinc-200 tracking-tight">
              {clause.title}
            </h3>
            <p className="font-normal text-xs sm:text-sm leading-relaxed text-zinc-400">
              {clause.content}
            </p>

            {clause.bulletPoints && clause.bulletPoints.length > 0 && (
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-zinc-400">
                {clause.bulletPoints.map((point) => (
                  <li key={point} className="leading-relaxed">
                    {point}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}
