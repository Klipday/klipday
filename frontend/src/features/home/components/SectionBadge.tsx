import type { SectionBadgeProps } from '../types';

/**
 * Reusable minimalist section badge / pill for landing page sections.
 * Displays a sleek dark-glass capsule with subtle border and crisp typography.
 *
 * @param props - Component children and optional className.
 * @returns The rendered section badge pill.
 */
export function SectionBadge({ children, className = '' }: SectionBadgeProps) {
  return (
    <div
      className={`inline-flex items-center rounded-full border border-white/10 bg-zinc-900/90 px-4 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-md select-none ${className}`.trim()}
    >
      {children}
    </div>
  );
}
