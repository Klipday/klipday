import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { AdminKycProofDialogProps } from '../types';
import {
  GetKycAccountTypeLabel,
  GetKycRoleLabel,
  IsAccountHolderNameMismatch,
  IsSafeHttpUrl,
} from '../utils/formatters';

/**
 * Lightbox modal dialog for inspecting a user's uploaded bank passbook or e-wallet screenshot
 * alongside a side-by-side comparison of their registered profile identity vs submitted credentials.
 *
 * @param props - Dialog props containing open state, onOpenChange handler, and target KYC item.
 * @returns The rendered KYC proof document inspection dialog.
 */
export function AdminKycProofDialog({
  open,
  onOpenChange,
  item,
}: AdminKycProofDialogProps) {
  const [failedProofUrl, setFailedProofUrl] = useState<string | null>(null);

  if (!item) {
    return null;
  }

  const trimmedProofUrl = item.proofUrl.trim();
  const isSafeUrl = IsSafeHttpUrl(trimmedProofUrl);
  const safeProofUrl = isSafeUrl ? trimmedProofUrl : null;
  const hasUnsafeProofUrl = trimmedProofUrl.length > 0 && !safeProofUrl;
  const hasImageError = Boolean(safeProofUrl) && failedProofUrl === safeProofUrl;
  const accountTypeLabel = GetKycAccountTypeLabel(item.accountType);
  const roleLabel = GetKycRoleLabel(item.user.role);
  const isNameMismatch = IsAccountHolderNameMismatch(
    item.user.displayName,
    item.accountHolderName,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 space-y-4">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-semibold tracking-tight">
            Dokumen Bukti Kepemilikan Rekening
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {item.provider} ({accountTypeLabel}) &middot; Pastikan nama pemilik rekening sesuai
            dengan identitas akun.
          </DialogDescription>
        </DialogHeader>

        {/* Side-by-Side Identity Comparison Box */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-0 sm:divide-x divide-border/60 rounded-lg border border-border/60 bg-muted/20 p-3 text-xs">
          <div className="sm:pr-3 space-y-1 min-w-0">
            <p className="text-[11px] text-muted-foreground">Identitas Profil Akun</p>
            <p className="font-semibold text-foreground truncate">
              {item.user.displayName}{' '}
              <span className="font-normal text-muted-foreground">({roleLabel})</span>
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{item.user.email}</p>
            <p className="text-[11px] font-mono tabular-nums text-muted-foreground truncate">
              {item.user.phoneNumber ?? 'No. telepon belum diisi'}
            </p>
          </div>

          <div className="border-t border-border/50 pt-2.5 sm:border-t-0 sm:pt-0 sm:pl-3 space-y-1 min-w-0">
            <p className="text-[11px] text-muted-foreground">Data Rekening Diajukan</p>
            <p className="font-mono font-semibold tabular-nums text-foreground truncate">
              {item.provider} &middot; {item.accountNumber}
            </p>
            <p
              className={cn(
                'text-[11px] font-medium truncate',
                isNameMismatch
                  ? 'text-amber-600 dark:text-amber-300'
                  : 'text-foreground/90',
              )}
            >
              a.n. {item.accountHolderName}
            </p>
          </div>
        </div>

        {/* Uploaded Proof Image Preview Container */}
        <div className="flex max-h-[58vh] items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-background/50 p-2">
          {safeProofUrl && !hasImageError ? (
            <img
              src={safeProofUrl}
              alt={`Bukti rekening ${item.provider} a.n. ${item.accountHolderName}`}
              onError={() => setFailedProofUrl(safeProofUrl)}
              className="max-h-[54vh] w-auto rounded-lg object-contain"
            />
          ) : (
            <div className="px-6 py-12 text-center space-y-1">
              <p className="text-xs font-medium text-foreground">
                {hasUnsafeProofUrl
                  ? 'Tautan foto bukti rekening tidak valid dan tidak dapat dibuka'
                  : safeProofUrl
                    ? 'Pratinjau foto bukti rekening tidak dapat ditampilkan'
                    : 'Tidak ada foto bukti rekening yang terlampir'}
              </p>
              {safeProofUrl && (
                <p className="text-[11px] text-muted-foreground">
                  Gunakan tombol Buka Ukuran Penuh di bawah untuk memeriksa berkas asli.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {safeProofUrl && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <a href={safeProofUrl} target="_blank" rel="noopener noreferrer">
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
            Selesai Periksa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
