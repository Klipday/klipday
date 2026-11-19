import { LightbulbIcon } from '@solar-icons/react/linear';
import type { CampaignWizardHelperBoxProps } from '../types';

/**
 * Reusable contextual guidance callout box for campaign wizard steps.
 * Displays a standardized icon badge, header, description, and optional tip.
 *
 * @param props - Component properties including title, description, tip, icon, and className.
 * @returns The rendered helper box element.
 */
export function CampaignWizardHelperBox({ title, description, tip, icon: Icon = LightbulbIcon, className = '' }: CampaignWizardHelperBoxProps) {
  const containerClass =
    `flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm ${className}`.trim();

  return (
    <div className={containerClass}>
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border/50 bg-background text-muted-foreground mt-0.5">
        <Icon className="size-3.5" />
      </div>

      <div className="space-y-1 flex-1 min-w-0">
        <p className="font-medium text-foreground text-xs sm:text-sm tracking-tight">{title}</p>

        {description && <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>}

        {tip && (
          <p className="text-xs text-muted-foreground/90 leading-relaxed pt-0.5">
            <span className="font-medium text-foreground">Tips: </span>
            {tip}
          </p>
        )}
      </div>
    </div>
  );
}
