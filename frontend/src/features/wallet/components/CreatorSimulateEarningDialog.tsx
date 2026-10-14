import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UseSimulateCreatorEarningMutation } from '../hooks';
import { FormatNumber, ParseFormattedRupiah } from '../utils/wallet-format';


export interface CreatorSimulateEarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Sandbox testing dialog allowing developers and QA testers to simulate video view earnings.
 * Credits wallet balance and records a CAMPAIGN_EARNING mutation ledger row.
 *
 * @param props - Component configuration properties.
 * @returns Rendered simulation modal element.
 */
export function CreatorSimulateEarningDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreatorSimulateEarningDialogProps) {
  const [amount, setAmount] = useState<number>(150_000);
  const [inputValue, setInputValue] = useState<string>('150.000');
  const [campaignTitle, setCampaignTitle] = useState<string>('Peluncuran Skincare Glow Up Series');
  const [verifiedViews, setVerifiedViews] = useState<number>(30_000);
  const [cpmRate, setCpmRate] = useState<number>(5_000);

  const simulateMutation = UseSimulateCreatorEarningMutation();

  const HandleAmountChange = (raw: string) => {
    const parsed = ParseFormattedRupiah(raw);
    setAmount(parsed);
    setInputValue(parsed > 0 ? FormatNumber(parsed) : '');
  };

  const HandleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (amount <= 0) {
      toast.error('Nominal simulasi harus lebih besar dari 0.');
      return;
    }

    simulateMutation.mutate(
      {
        amount,
        campaignTitle: campaignTitle.trim() || undefined,
        verifiedViews,
        cpmRate,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Simulasi Pendapatan Video (Sandbox QA)
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Kredit saldo dompet kreator untuk menguji alur penarikan dana dan verifikasi mutasi secara langsung.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={HandleSubmit} className="space-y-3.5 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="sim-amount" className="text-xs font-medium text-foreground">
              Nominal Pendapatan (Rp)
            </Label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs font-medium text-muted-foreground">
                Rp
              </div>
              <Input
                id="sim-amount"
                type="text"
                inputMode="numeric"
                value={inputValue}
                onChange={(e) => HandleAmountChange(e.target.value)}
                className="h-10 rounded-xl pl-9 text-sm tabular-nums font-medium border-border/60"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sim-campaign" className="text-xs font-medium text-foreground">
              Judul Kampanye
            </Label>
            <Input
              id="sim-campaign"
              type="text"
              value={campaignTitle}
              onChange={(e) => setCampaignTitle(e.target.value)}
              className="h-10 rounded-xl border-border/60 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sim-views" className="text-xs font-medium text-foreground">
                Verified Views
              </Label>
              <Input
                id="sim-views"
                type="number"
                value={verifiedViews}
                onChange={(e) => setVerifiedViews(Number(e.target.value))}
                className="h-10 rounded-xl border-border/60 font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sim-cpm" className="text-xs font-medium text-foreground">
                CPM Rate (Rp)
              </Label>
              <Input
                id="sim-cpm"
                type="number"
                value={cpmRate}
                onChange={(e) => setCpmRate(Number(e.target.value))}
                className="h-10 rounded-xl border-border/60 font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => onOpenChange(false)}
              disabled={simulateMutation.isPending}
              className="cursor-pointer text-xs font-medium">
              Batal
            </Button>
            <Button
              type="submit"
              size="default"
              disabled={amount <= 0 || simulateMutation.isPending}
              className="cursor-pointer text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90">
              {simulateMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Mengreditkan...
                </>
              ) : (
                'Kreditkan Saldo'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
