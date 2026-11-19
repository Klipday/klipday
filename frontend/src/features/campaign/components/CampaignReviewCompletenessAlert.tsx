import { DangerTriangleIcon } from '@solar-icons/react/linear';
import { Button } from '@/components/ui/button';
import type { CampaignReviewCompletenessAlertProps } from '../types';

/**
 * Renders a warning alert when one or more wizard steps are incomplete,
 * listing the missing requirements with quick-jump action buttons.
 *
 * @param props - Component properties containing missing steps and navigation callback.
 * @returns The rendered completeness alert banner element or null if all steps are complete.
 */
export function CampaignReviewCompletenessAlert({
  missingSteps,
  onNavigateToStep,
}: CampaignReviewCompletenessAlertProps) {
  if (missingSteps.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm">
      <div className="flex items-start gap-3">
        <DangerTriangleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div className="space-y-1.5 flex-1 min-w-0">
          <h4 className="text-xs sm:text-sm font-semibold text-destructive tracking-tight">Kampanye Belum Siap Diajukan</h4>
          <p className="text-xs text-muted-foreground">
            Terdapat beberapa langkah yang belum lengkap. Harap lengkapi sebelum mengajukan kampanye untuk direview.
          </p>
          <ul className="space-y-1.5 pt-1">
            {missingSteps.map((step) => {
              const stepPrefix = `Langkah ${step.stepNumber} (${step.title}):`;

              return (
                <li key={step.slug} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-foreground truncate">
                    <span className="font-medium">{stepPrefix}</span> {step.reason}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => onNavigateToStep(step.slug)}
                    className="h-6 text-[11px] px-2 shrink-0">
                    Lengkapi
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
