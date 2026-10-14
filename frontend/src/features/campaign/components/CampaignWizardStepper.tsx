import { Check } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router';
import { cn } from '@/lib/utils';
import { CAMPAIGN_WIZARD_STEPS, GetWizardStepPath } from '../config/wizard-steps';
import { UseCampaignQuery } from '../hooks';
import type { CampaignWizardStepperProps } from '../types';
import { GetHighestAccessibleStepNumber, IsWizardStepCompleted } from '../utils';

/**
 * Stepper navigation component for the campaign creation workflow.
 * Renders numbered indicators with titles and descriptions,
 * highlighting the active step, completed steps, and locking future steps
 * until all mandatory fields of previous steps are completely filled.
 *
 * @param props - Component properties including optional campaign data and custom className.
 * @returns The rendered wizard stepper navigation bar.
 */
export function CampaignWizardStepper({ className, campaign: propCampaign }: CampaignWizardStepperProps) {
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();

  const { data: fetchedCampaign } = UseCampaignQuery(id);
  const currentCampaign = propCampaign ?? fetchedCampaign;

  const activeIndex = CAMPAIGN_WIZARD_STEPS.findIndex((step) => location.pathname.includes(step.slug));
  const currentStepNumber = activeIndex >= 0 ? activeIndex + 1 : 1;

  const highestAllowedStep = GetHighestAccessibleStepNumber(currentCampaign);

  return (
    <div className={cn('w-full', className)}>
      {/* Mobile Step Counter & Interactive Progress (< sm) */}
      <div className="mb-4 block sm:hidden">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>
            Langkah {currentStepNumber} dari {CAMPAIGN_WIZARD_STEPS.length}
          </span>
          <span className="font-semibold text-foreground">
            {CAMPAIGN_WIZARD_STEPS[currentStepNumber - 1]?.title}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStepNumber / CAMPAIGN_WIZARD_STEPS.length) * 100}%` }}
          />
        </div>
        {/* Mobile quick-jump step dots */}
        <div className="mt-2.5 flex items-center justify-between gap-1.5 px-0.5">
          {CAMPAIGN_WIZARD_STEPS.map((step) => {
            const isAccessible = step.stepNumber <= highestAllowedStep;
            const isCompleted = IsWizardStepCompleted(step.stepNumber, currentCampaign);
            const isCurrent = step.stepNumber === currentStepNumber;
            const targetPath = GetWizardStepPath(step.slug, id);

            const dotCircle = isCompleted ? (
              <Check className="size-3 stroke-[2.5]" />
            ) : (
              step.stepNumber
            );

            const dotStyle = isCurrent
              ? 'bg-primary text-primary-foreground ring-2 ring-primary/30 font-semibold'
              : isCompleted
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-muted/40 text-muted-foreground border border-border/60';

            return isAccessible ? (
              <Link
                key={step.id}
                to={targetPath}
                title={step.title}
                className={cn(
                  'flex size-6 items-center justify-center rounded-full text-[11px] transition-transform active:scale-95',
                  dotStyle
                )}>
                {dotCircle}
              </Link>
            ) : (
              <div
                key={step.id}
                title={`${step.title} (Terkunci)`}
                className="flex size-6 items-center justify-center rounded-full text-[11px] opacity-40 bg-muted/30 border border-border/40 text-muted-foreground/60 cursor-not-allowed">
                {step.stepNumber}
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop / Tablet Stepper Indicator (>= sm) */}
      <nav aria-label="Langkah Pembuatan Kampanye" className="hidden sm:block w-full overflow-x-auto pb-1 scrollbar-none">
        <ol className="flex items-center justify-between gap-1 sm:gap-1.5 lg:gap-2.5 min-w-full">
          {CAMPAIGN_WIZARD_STEPS.map((step, index) => {
            const isAccessible = step.stepNumber <= highestAllowedStep;
            const isCompleted = IsWizardStepCompleted(step.stepNumber, currentCampaign);
            const isCurrent = step.stepNumber === currentStepNumber;
            const isLast = index === CAMPAIGN_WIZARD_STEPS.length - 1;

            const targetPath = GetWizardStepPath(step.slug, id);

            const circleClass = isCurrent && isCompleted
              ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background font-semibold'
              : isCurrent && !isCompleted
                ? 'border-2 border-primary bg-background text-primary font-bold shadow-xs ring-2 ring-primary/25'
                : isCompleted
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-muted/40 text-muted-foreground';

            const titleClass = isCurrent
              ? 'font-semibold text-foreground'
              : isCompleted
                ? 'font-medium text-foreground'
                : 'text-muted-foreground';

            const containerClass = cn(
              'group flex items-center gap-2 sm:gap-2.5 text-left outline-none transition-colors rounded-lg p-1.5 min-w-0',
              isCurrent ? 'bg-muted/40 border border-border/70 shadow-2xs' : 'hover:bg-muted/20 border border-transparent'
            );

            return (
              <li key={step.id} className={cn('flex items-center min-w-0', !isLast ? 'flex-1' : 'shrink-0')}>
                {isAccessible ? (
                  <Link
                    to={targetPath}
                    className={cn(containerClass, 'focus-visible:ring-2 focus-visible:ring-ring')}>
                    <div
                      className={cn(
                        'flex size-7 lg:size-8 shrink-0 items-center justify-center rounded-full text-xs transition-colors font-medium',
                        circleClass
                      )}>
                      {isCompleted ? <Check className="size-3.5 stroke-[2.5]" /> : step.stepNumber}
                    </div>
                    <div className="min-w-0">
                      <p className={cn('truncate text-xs tracking-tight lg:text-sm', titleClass)}>{step.title}</p>
                      <p className="hidden xl:block truncate text-[11px] text-muted-foreground">{step.description}</p>
                    </div>
                  </Link>
                ) : (
                  <div
                    aria-disabled="true"
                    title="Lengkapi langkah sebelumnya terlebih dahulu"
                    className={cn(
                      'flex items-center gap-2 sm:gap-2.5 text-left opacity-40 cursor-not-allowed select-none rounded-lg p-1.5 min-w-0 border border-transparent'
                    )}>
                    <div className="flex size-7 lg:size-8 shrink-0 items-center justify-center rounded-full text-xs border border-border bg-muted/40 text-muted-foreground/60 font-medium">
                      {step.stepNumber}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs tracking-tight lg:text-sm font-normal text-muted-foreground/70">{step.title}</p>
                      <p className="hidden xl:block truncate text-[11px] text-muted-foreground/40">{step.description}</p>
                    </div>
                  </div>
                )}

                {!isLast && (
                  <div
                    className={cn(
                      'mx-1 sm:mx-1.5 lg:mx-2.5 h-px flex-1 min-w-2 sm:min-w-3 transition-colors',
                      isCompleted ? 'bg-primary' : 'bg-border/60'
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
