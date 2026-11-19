import { ArrowLeftIcon } from '@solar-icons/react/linear';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

/**
 * Top header component for the Campaign Creation Wizard.
 * Displays the back navigation button linking to the campaigns directory,
 * alongside the wizard's title and description.
 *
 * @returns The rendered campaign wizard header.
 */
export function CampaignWizardHeader() {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <Button asChild variant="ghost" size="sm" className="h-8 -ml-2 px-2 text-xs text-muted-foreground hover:text-foreground">
          <Link to="/brand-dashboard/brand-campaigns" className="flex items-center gap-1.5">
            <ArrowLeftIcon className="size-3.5" />
            <span>Kembali ke Kampanye</span>
          </Link>
        </Button>
      </div>

      <div className="space-y-0.5">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Buat Kampanye Baru</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Lengkapi konfigurasi di bawah ini untuk meluncurkan kampanye promosi video klip Anda.
        </p>
      </div>
    </div>
  );
}
