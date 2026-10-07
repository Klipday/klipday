import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CampaignFormStep6 } from '../../components';

/**
 * Step 6 orchestrator: Pembayaran Kampanye.
 * Pure shell rendering the payment options inside a structured card container.
 *
 * @returns The rendered step 6 card shell.
 */
function CampaignStep6() {
  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold tracking-tight">Pembayaran Anggaran Kampanye</CardTitle>
        <CardDescription className="text-xs sm:text-sm text-muted-foreground">
          Selesaikan pendanaan kampanye Anda melalui transfer manual atau saldo dompet Klipday untuk memulai proses review admin.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <CampaignFormStep6 />
      </CardContent>
    </Card>
  );
}

export default CampaignStep6;
