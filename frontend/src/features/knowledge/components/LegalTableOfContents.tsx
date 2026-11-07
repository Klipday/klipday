import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { LegalTableOfContentsProps } from '../types';

/**
 * Interactive table of contents component for legal compliance documents.
 * Renders a sticky navigation card on desktop screens and a smooth horizontal
 * scrolling pill track on mobile viewports with auto-centering for the active item.
 *
 * @param props - Navigation sections, active section id, and selection handler.
 * @returns The rendered table of contents component.
 */
export function LegalTableOfContents({
  sections,
  activeSectionId,
  onSelectSection,
  className = '',
}: LegalTableOfContentsProps) {
  const containerClasses = cn('space-y-4', className);
  const mobileTrackRef = useRef<HTMLDivElement>(null);

  // Automatically scroll horizontal mobile track so active pill stays centered
  useEffect(() => {
    if (!mobileTrackRef.current || !activeSectionId) return;
    const activeButton = mobileTrackRef.current.querySelector<HTMLElement>(
      `[data-section-id="${activeSectionId}"]`
    );
    if (activeButton) {
      activeButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeSectionId]);

  return (
    <nav aria-label="Daftar Isi" className={containerClasses}>
      {/* Mobile Horizontal Pill Track */}
      <div className="lg:hidden">
        <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2 px-1">
          Lompat ke Pasal
        </div>
        <div ref={mobileTrackRef} className="overflow-x-auto no-scrollbar flex items-center gap-2 pb-2">
          {sections.map((item) => {
            const isActive = activeSectionId === item.id;
            const buttonClasses = cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
              isActive
                ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                : 'border-white/10 bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
            );

            return (
              <button
                type="button"
                key={item.id}
                data-section-id={item.id}
                onClick={() => onSelectSection(item.id)}
                className={buttonClasses}
              >
                {item.shortTitle}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Sticky Sidebar Navigation */}
      <div className="hidden lg:block sticky top-24 rounded-xl border border-white/10 bg-zinc-900/40 p-4 space-y-1">
        <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-white/5 mb-2">
          Daftar Isi
        </div>

        <div className="space-y-0.5 max-h-[calc(100vh-160px)] overflow-y-auto no-scrollbar">
          {sections.map((item) => {
            const isActive = activeSectionId === item.id;
            const itemClasses = cn(
              'w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer block truncate leading-snug',
              isActive
                ? 'bg-white/10 text-white font-medium border-l-2 border-primary pl-2.5'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            );

            return (
              <button
                type="button"
                key={item.id}
                onClick={() => onSelectSection(item.id)}
                className={itemClasses}
                title={item.shortTitle}
              >
                {item.shortTitle}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
