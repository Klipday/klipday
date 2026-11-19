import { AddIcon } from '@solar-icons/react/linear';
import { Button } from '@/components/ui/button';
import { CreateCampaignDialog } from './CreateCampaignDialog';

/**
 * Header component for the Campaigns page.
 * Displays the page title and description on the left,
 * and a prominent creation button on the right that triggers the campaign initiation confirmation dialog.
 *
 * @returns The rendered campaigns header element.
 */
export function CampaignsHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Kampanye</h1>
        <p className="text-sm text-muted-foreground">Kelola dan pantau seluruh kampanye video promosi Anda.</p>
      </div>

      <div>
        <CreateCampaignDialog>
          <Button size="default" className="shadow-xs flex items-center gap-2">
            <AddIcon className="h-4 w-4" />
            <span>Buat Kampanye</span>
          </Button>
        </CreateCampaignDialog>
      </div>
    </div>
  );
}
