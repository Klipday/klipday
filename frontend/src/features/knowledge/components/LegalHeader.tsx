import { cn } from '@/lib/utils';
import type { LegalHeaderProps } from '../types';

/**
 * Clean header component for legal compliance documents (`Syarat & Ketentuan` and `Kebijakan Privasi`).
 *
 * @param props - Document header properties.
 * @returns The rendered legal header.
 */
export function LegalHeader({
  title,
  description,
  lastUpdated,
  className = '',
}: LegalHeaderProps) {
  const containerClasses = cn('space-y-2 text-left', className);

  return (
    <div className={containerClasses}>
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {title}
      </h1>

      <p className="max-w-3xl text-xs leading-relaxed text-zinc-400 sm:text-sm">
        {description}
      </p>

      <p className="pt-1 text-[11px] text-zinc-500">
        Terakhir diperbarui: {lastUpdated}
      </p>
    </div>
  );
}
