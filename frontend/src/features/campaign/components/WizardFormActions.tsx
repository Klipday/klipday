import { ArrowLeftIcon, ArrowRightIcon, LoaderIcon } from '@solar-icons/react/linear';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WizardFormActionsProps } from '../types';

/**
 * Reusable footer action bar for campaign wizard form steps.
 * Provides a standardized Back navigation button (when onBack is provided)
 * and a primary submission button with animated loading state and icons.
 *
 * @param props - Component properties for wizard action buttons and state.
 * @returns The rendered wizard form action bar element.
 */
export function WizardFormActions({
  onBack,
  isPending = false,
  submitText = 'Simpan & Lanjutkan',
  backText = 'Kembali',
  className,
}: WizardFormActionsProps) {
  const containerClasses = cn('flex items-center pt-4 border-t border-border', onBack ? 'justify-between' : 'justify-end', className);

  return (
    <div className={containerClasses}>
      {onBack && (
        <Button type="button" variant="outline" onClick={onBack} disabled={isPending} className="flex items-center gap-2">
          <ArrowLeftIcon className="size-4" />
          <span>{backText}</span>
        </Button>
      )}

      <Button type="submit" disabled={isPending} className="flex items-center justify-center gap-2 min-w-180px">
        {isPending ? (
          <LoaderIcon className="size-4 animate-spin" />
        ) : (
          <>
            <span>{submitText}</span>
            <ArrowRightIcon className="size-4" />
          </>
        )}
      </Button>
    </div>
  );
}
