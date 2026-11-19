import { ArrowLeftIcon, DangerTriangleIcon, RestartIcon } from '@solar-icons/react/linear';
import { useNavigate } from 'react-router';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { CampaignDetailErrorStateProps } from '../types';

/**
 * Dedicated error state component for the campaign detail page.
 * Displays error message with retry and return navigation options.
 *
 * @param props - Component properties containing error object, custom message, and retry handler.
 * @returns The rendered campaign detail error recovery element.
 */
export function CampaignDetailErrorState({
  error,
  message,
  onRetry,
  className,
}: CampaignDetailErrorStateProps) {
  const navigate = useNavigate();

  const errorMessage =
    message || (error instanceof Error ? error.message : 'Gagal memuat informasi kampanye.');

  return (
    <div className={cn('flex min-h-[50vh] items-center justify-center p-4', className)}>
      <Card className="w-full max-w-md border-destructive/30 bg-destructive/5 text-center shadow-sm">
        <CardContent className="space-y-4 p-6">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <DangerTriangleIcon className="size-6" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">Terjadi Kendala</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{errorMessage}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/brand-dashboard/brand-campaigns')}
              className="gap-1.5 text-xs">
              <ArrowLeftIcon className="size-3.5" />
              Kembali ke Kampanye
            </Button>

            {onRetry && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={onRetry}
                className="gap-1.5 text-xs font-semibold">
                <RestartIcon className="size-3.5" />
                Coba Lagi
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
