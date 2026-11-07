import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';
import { UseCurrentAccountQuery } from '@/features/authentication/hooks';
import type { LegalHeaderProps } from '../types';

/**
 * Clean, disciplined header component for legal compliance documents.
 * Features a left-aligned back button, document title, scope description,
 * last updated timestamp, and optional regulatory badge.
 *
 * @param props - Document header properties.
 * @returns The rendered legal header.
 */
export function LegalHeader({
  title,
  description,
  lastUpdated,
  badgeLabel,
  className = '',
}: LegalHeaderProps) {
  const { data: userProfile } = UseCurrentAccountQuery();
  const containerClasses = cn('space-y-4 text-left', className);

  const backDestination = userProfile ? '/dashboard' : '/';
  const backLabel = userProfile ? 'Kembali ke Dashboard' : 'Kembali';

  return (
    <div className={containerClasses}>
      {/* Left-aligned Back Button */}
      <div className="flex items-center justify-start">
        <Link
          to={backDestination}
          className="group inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="size-3.5 transition-transform duration-150 group-hover:-translate-x-0.5 text-zinc-400 group-hover:text-white" />
          <span>{backLabel}</span>
        </Link>
      </div>

      {/* Title & Metadata */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {title}
          </h1>

          {badgeLabel && (
            <span className="rounded-full border border-white/10 bg-zinc-900 px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
              {badgeLabel}
            </span>
          )}
        </div>

        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-3xl">
          {description}
        </p>

        <p className="text-[11px] text-zinc-500 pt-1">
          Terakhir diperbarui: {lastUpdated}
        </p>
      </div>
    </div>
  );
}
