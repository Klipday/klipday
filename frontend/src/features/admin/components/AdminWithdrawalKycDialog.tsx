import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { AdminWithdrawalKycDialogProps } from '../types';

/**
 * Modal dialog for inspecting KYC passbook or e-wallet proof of a withdrawal destination account.
 *
 * @param props - Dialog props containing open state, onOpenChange handler, and withdrawal item.
 * @returns The rendered KYC inspection dialog.
 */
export function AdminWithdrawalKycDialog({
  open,
  onOpenChange,
  withdrawal,
}: AdminWithdrawalKycDialogProps) {
  if (!withdrawal) {
    return null;
  }

  const payoutAccount = withdrawal.payoutAccount;
  const proofUrl = payoutAccount?.proofUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 space-y-4">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold tracking-tight">
            Bukti Rekening KYC &middot;{' '}
            <span className="font-mono text-sm">{withdrawal.referenceCode}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Account Details Box */}
        <div className="grid grid-cols-2 divide-x divide-border/60 rounded-lg border border-border/60 bg-muted/20 p-3 text-xs">
          <div className="pr-2 space-y-0.5">
            <p className="text-muted-foreground">Pemohon</p>
            <p className="font-semibold text-foreground truncate">
              {withdrawal.user.displayName}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{withdrawal.user.email}</p>
          </div>
          <div className="pl-2.5 space-y-0.5">
            <p className="text-muted-foreground">Rekening Tujuan</p>
            <p className="font-semibold text-foreground">
              {withdrawal.accountProvider} &middot; {withdrawal.accountNumber}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              a.n {withdrawal.accountHolderName}
            </p>
          </div>
        </div>

        {/* Image Preview Container */}
        <div className="flex max-h-[60vh] items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-background/50 p-2">
          {proofUrl ? (
            <img
              src={proofUrl}
              alt="Bukti Rekening KYC"
              className="max-h-[55vh] w-auto rounded-lg object-contain"
            />
          ) : (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Tidak ada lampiran buku tabungan atau screenshot KYC untuk rekening ini.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          {proofUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
              className="gap-2 text-xs cursor-pointer"
            >
              <a href={proofUrl} target="_blank" rel="noopener noreferrer">
                <span>Buka Ukuran Penuh</span>
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="ml-auto text-xs cursor-pointer"
          >
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
