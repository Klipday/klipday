import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';
import { UseCurrentAccountQuery } from '@/features/authentication/hooks';
import type { HelpHeaderProps, HelpTabType } from '../types';

/**
 * Header section component for the knowledge hub.
 * Features a left-aligned back button above the title, clean anti-slop typography (without badges),
 * and an edge-to-edge segmented control with FAQ on the left and Rules on the right.
 *
 * @param props - Active tab state and tab selection callback.
 * @returns The rendered knowledge hub header.
 */
export function HelpHeader({ activeTab, onTabChange, className = '' }: HelpHeaderProps) {
  const { data: userProfile } = UseCurrentAccountQuery();
  const containerClasses = cn('space-y-6', className);

  const HandleTabSelect = (tab: HelpTabType) => {
    onTabChange(tab);
  };

  const backDestination = userProfile ? '/dashboard' : '/';
  const backLabel = userProfile ? 'Kembali ke Dashboard' : 'Kembali';

  return (
    <div className={containerClasses}>
      {/* Left-aligned Back Button positioned directly above the title */}
      <div className="flex items-center justify-start">
        <Link
          to={backDestination}
          className="group inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="size-3.5 transition-transform duration-150 group-hover:-translate-x-0.5 text-zinc-400 group-hover:text-white" />
          <span>{backLabel}</span>
        </Link>
      </div>

      {/* Centered Title & Subtitle without badge */}
      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
          FAQ & Peraturan Klipday
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl mx-auto">
          Pelajari aturan main, hak dan kewajiban Brand maupun Creator, serta jawaban atas pertanyaan umum seputar ekosistem Klipday.
        </p>
      </div>

      {/* Edge-to-Edge Segmented Control: FAQ on Left, Rules on Right */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-full border border-white/10 bg-zinc-900/60 p-0 overflow-hidden divide-x divide-white/10">
          <button
            type="button"
            onClick={() => HandleTabSelect('faq')}
            className={cn(
              'px-5 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer first:rounded-l-full',
              activeTab === 'faq'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            )}
          >
            Pertanyaan Umum (FAQ)
          </button>

          <button
            type="button"
            onClick={() => HandleTabSelect('rules')}
            className={cn(
              'px-5 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer last:rounded-r-full',
              activeTab === 'rules'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            )}
          >
            Peraturan Platform (Rules)
          </button>
        </div>
      </div>
    </div>
  );
}
