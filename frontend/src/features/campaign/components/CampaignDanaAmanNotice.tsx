import { ShieldCheckIcon } from '@solar-icons/react/linear';
import { cn } from '@/lib/utils';
import type { CampaignDanaAmanNoticeProps } from '../types';

const NOTICE_DEFAULTS = {
  budget: {
    title: 'Sistem Dana Aman',
    description:
      'Anggaran disimpan secara aman oleh sistem. Anda hanya membayar untuk penayangan nyata yang berhasil terverifikasi. Sisa anggaran yang tidak terpakai saat kampanye selesai akan otomatis dikembalikan ke saldo dompet brand Anda.',
  },
  review: {
    title: 'Proses Review & Sistem Dana Aman',
    description:
      'Setelah Anda menekan tombol submit, tim admin Klipday akan mereview kampanye Anda (SLA maks. 1x24 jam). Setelah disetujui, dana akan disimpan secara aman melalui sistem dana aman dari saldo Anda. Seluruh sisa anggaran yang tidak terserap oleh tayangan kreator akan dikembalikan otomatis saat kampanye selesai.',
  },
} as const;

/**
 * Reusable contextual notice callout highlighting the Sistem Dana Aman guarantees.
 * Supports both Step 4 (budget configuration) and Step 5 (review & submission) contexts.
 *
 * @param props - Component properties including variant, custom title/description overrides, and className.
 * @returns The rendered Sistem Dana Aman callout banner element.
 */
export function CampaignDanaAmanNotice({
  variant = 'review',
  title,
  description,
  className,
}: CampaignDanaAmanNoticeProps) {
  const fallback = NOTICE_DEFAULTS[variant];
  const resolvedTitle = title ?? fallback.title;
  const resolvedDescription = description ?? fallback.description;

  const containerClasses = cn(
    'flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm',
    className
  );

  return (
    <div className={containerClasses}>
      <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <div className="space-y-1 min-w-0 flex-1">
        <p className="text-xs sm:text-sm font-medium text-foreground tracking-tight">{resolvedTitle}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{resolvedDescription}</p>
      </div>
    </div>
  );
}

// Backwards-compatible export alias
export { CampaignDanaAmanNotice as CampaignReviewEscrowNotice };
