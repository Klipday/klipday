import { DangerCircleIcon } from '@solar-icons/react/linear';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CampaignWizardHeader } from './CampaignWizardHeader';
import type { CampaignWizardErrorProps } from '../types';

/**
 * Error recovery placeholder component for the Campaign Wizard layout.
 * Renders the top navigation header and an error card with retry capability
 * when campaign data fails to load due to network or server issues.
 *
 * @param props - Component properties containing the error message and retry callback.
 * @returns The rendered wizard error container.
 */
export function CampaignWizardError({
  message = 'Data kampanye tidak ditemukan atau terjadi gangguan koneksi.',
  onRetry,
}: CampaignWizardErrorProps) {
  return (
    <div className="w-full max-w-5xl space-y-6 pb-12">
      <CampaignWizardHeader />
      <Card className="flex flex-col items-center justify-center p-8 text-center">
        <DangerCircleIcon className="h-10 w-10 text-destructive mb-3" />
        <div className="space-y-1 mb-4">
          <h2 className="text-lg font-semibold text-foreground">Gagal memuat kampanye</h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        {onRetry && (
          <div className="flex justify-center gap-3">
            <Button variant="outline" size="sm" onClick={onRetry}>
              Coba Lagi
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
