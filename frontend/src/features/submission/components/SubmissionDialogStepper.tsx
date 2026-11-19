import { CheckIcon } from '@solar-icons/react/linear';
import { cn } from '@/lib/utils';
import type { SubmissionDialogStepperProps } from '../types';

/**
 * Compact horizontal numbered stepper header for the Submission Dialog.
 * Displays step numbers (1 to 4) connected by clean dashed lines,
 * highlighting the active and completed steps, with click support for accessible steps.
 *
 * @param props - Component properties containing currentStep, totalSteps, highestAccessibleStep, and onStepSelect.
 * @returns Rendered horizontal stepper component.
 */
export function SubmissionDialogStepper({
  currentStep,
  totalSteps = 4,
  highestAccessibleStep = 1,
  onStepSelect,
  className,
}: SubmissionDialogStepperProps) {
  const stepItems = Array.from({ length: totalSteps }, (_, index) => index + 1);

  return (
    <nav
      aria-label="Progres Pengajuan Video"
      className={cn('flex items-center gap-2 sm:gap-3', className)}>
      {stepItems.map((stepNumber, index) => {
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        const isAccessible = stepNumber <= Math.max(highestAccessibleStep, currentStep);
        const isLast = index === stepItems.length - 1;

        const circleContent = isCompleted ? (
          <CheckIcon className="size-3 stroke-[2.5]" />
        ) : (
          stepNumber
        );

        return (
          <div key={stepNumber} className="flex items-center gap-2 sm:gap-3">
            {/* Step Number Circle (Interactive button if accessible) */}
            {onStepSelect && isAccessible ? (
              <button
                type="button"
                disabled={isActive}
                onClick={() => onStepSelect(stepNumber)}
                aria-current={isActive ? 'step' : undefined}
                title={isActive ? `Langkah ${stepNumber} (Sedang aktif)` : `Langkah ${stepNumber}`}
                className={cn(
                  'size-6 sm:size-7 rounded-full flex items-center justify-center text-xs font-bold transition-all select-none',
                  isActive &&
                    'bg-primary text-primary-foreground ring-2 ring-primary/30 shadow-xs scale-105 cursor-default',
                  isCompleted &&
                    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:ring-2 hover:ring-emerald-500/30 cursor-pointer',
                  !isActive &&
                    !isCompleted &&
                    'bg-muted/30 text-muted-foreground border border-border/60 hover:text-foreground hover:border-border cursor-pointer',
                )}>
                {circleContent}
              </button>
            ) : (
              <div
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'size-6 sm:size-7 rounded-full flex items-center justify-center text-xs font-bold transition-all select-none',
                  isActive &&
                    'bg-primary text-primary-foreground ring-2 ring-primary/30 shadow-xs scale-105',
                  isCompleted &&
                    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
                  !isActive &&
                    !isCompleted &&
                    'bg-muted/20 text-muted-foreground/60 border border-border/40',
                )}>
                {circleContent}
              </div>
            )}

            {/* Connecting Dashed Line */}
            {!isLast && (
              <div
                className={cn(
                  'w-5 sm:w-8 h-0 border-t border-dashed transition-colors',
                  isCompleted ? 'border-emerald-500/50' : 'border-border/60',
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
