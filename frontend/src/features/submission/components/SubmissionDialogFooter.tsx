import { ArrowLeft, ArrowRight, Loader2, SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SubmissionDialogFooterProps } from '../types';

/**
 * Bottom action footer for the Submission Dialog.
 * Orchestrates "Kembali" and "Selanjutnya" / "Kirim Video" transitions.
 * Matches the warm, clean button styling shown in the design reference.
 *
 * @param props - Component properties containing navigation callbacks, currentStep, and submission state.
 * @returns Rendered dialog footer actions.
 */
export function SubmissionDialogFooter({
  currentStep,
  totalSteps = 4,
  canProceed,
  isSubmitting = false,
  onBack,
  onNext,
  className,
}: SubmissionDialogFooterProps) {
  const isFinalStep = currentStep === totalSteps;

  return (
    <footer
      className={cn(
        'flex items-center justify-between border-t border-border/40 bg-card/60 px-6 py-4 backdrop-blur-xs',
        className,
      )}>
      {/* Back Button */}
      <div>
        {currentStep > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="default"
            disabled={isSubmitting}
            onClick={onBack}
            className="gap-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl h-10 px-4">
            <ArrowLeft className="size-3.5" />
            <span>Kembali</span>
          </Button>
        )}
      </div>

      {/* Next / Submit Button */}
      <div>
        {isFinalStep ? (
          <Button
            type="button"
            size="default"
            disabled={!canProceed || isSubmitting}
            onClick={onNext}
            className="gap-2 font-semibold px-6 rounded-xl h-10 text-xs sm:text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Mengirimkan...</span>
              </>
            ) : (
              <>
                <SendHorizontal className="size-4" />
                <span>Kirim Video</span>
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            size="default"
            disabled={!canProceed || isSubmitting}
            onClick={onNext}
            className="gap-2 font-semibold px-6 rounded-xl h-10 text-xs sm:text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer">
            {isSubmitting && currentStep === 3 ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <span>Selanjutnya</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </footer>
  );
}
