import { cn } from '@/lib/utils';
import type { HelpHeaderProps, HelpTabType } from '../types';

/**
 * Header section component for the knowledge hub.
 * Features centered typography and an edge-to-edge segmented control switching between FAQ and Rules.
 *
 * @param props - Active tab state and tab selection callback.
 * @returns The rendered knowledge hub header.
 */
export function HelpHeader({ activeTab, onTabChange, className = '' }: HelpHeaderProps) {
  const containerClasses = cn('space-y-6', className);

  /**
   * Switches the active knowledge hub tab between FAQ and platform rules.
   *
   * @param tab - Target tab identifier.
   */
  const HandleTabSelect = (tab: HelpTabType) => {
    onTabChange(tab);
  };

  return (
    <div className={containerClasses}>
      {/* Centered Title & Subtitle */}
      <div className="mx-auto max-w-2xl space-y-2 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          FAQ &amp; Peraturan Klipday
        </h1>
        <p className="mx-auto max-w-xl text-xs leading-relaxed text-zinc-400 sm:text-sm">
          Pelajari standar layanan terkelola, hak dan kewajiban Brand maupun Clipper, target SLA, serta jawaban atas pertanyaan umum ekosistem Klipday.
        </p>
      </div>

      {/* Edge-to-Edge Segmented Control: FAQ on Left, Rules on Right */}
      <div className="flex justify-center">
        <div className="inline-flex divide-x divide-white/10 overflow-hidden rounded-full border border-white/10 bg-zinc-900/60 p-0">
          <button
            type="button"
            onClick={() => HandleTabSelect('faq')}
            className={cn(
              'cursor-pointer px-5 py-2 text-xs font-semibold transition-all first:rounded-l-full sm:text-sm',
              activeTab === 'faq'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            )}
          >
            Pertanyaan Umum (FAQ)
          </button>

          <button
            type="button"
            onClick={() => HandleTabSelect('rules')}
            className={cn(
              'cursor-pointer px-5 py-2 text-xs font-semibold transition-all last:rounded-r-full sm:text-sm',
              activeTab === 'rules'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            )}
          >
            Peraturan Platform (Rules)
          </button>
        </div>
      </div>
    </div>
  );
}
