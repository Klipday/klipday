import { CheckIcon, CloseIcon, EyeIcon } from '@solar-icons/react/linear';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AdminTopUpItemRowProps } from '../types';
import { FormatRupiah } from '../utils/formatters';

/**
 * Renders an individual top-up row item in the Admin Brand Top-Up verification queue.
 * Uses pure typographic hierarchy without pill badges or monospace currency clutter.
 *
 * @param props - Component props containing topUp, onOpenProof, onReview, and optional className.
 * @returns The rendered row item.
 */
export function AdminTopUpItemRow({
  topUp,
  onOpenProof,
  onReview,
  className,
}: AdminTopUpItemRowProps) {
  const isSubmitted = topUp.status === 'SUBMITTED';
  const isPending = topUp.status === 'PENDING';
  const isApproved = topUp.status === 'APPROVED';
  const isRejected = topUp.status === 'REJECTED';

  const brandInitial = topUp.brand.companyName.slice(0, 2).toUpperCase() || 'BR';

  const statusLabel = isSubmitted
    ? 'Perlu Verifikasi'
    : isPending
      ? 'Menunggu Transfer'
      : isApproved
        ? 'Disetujui'
        : 'Ditolak';

  const statusTextClassName = isSubmitted
    ? 'text-amber-500'
    : isPending
      ? 'text-muted-foreground'
      : isRejected
        ? 'text-destructive'
        : 'text-foreground';

  const formattedDate = new Date(topUp.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={cn(
        'group rounded-xl border border-border/60 bg-card p-4 sm:p-5 transition-colors hover:border-border space-y-4',
        className,
      )}
    >
      {/* Top Header: Reference Code (left) vs Status & Creation Date (right) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {topUp.referenceCode}
        </span>

        <div className="flex items-center gap-x-4 text-xs">
          <span className={cn('font-medium', statusTextClassName)}>{statusLabel}</span>
          <span className="text-muted-foreground tabular-nums">{formattedDate}</span>
        </div>
      </div>

      {/* Middle Body: Brand & Sender vs Financials */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-center">
        {/* Brand & Account Info (7 cols) */}
        <div className="sm:col-span-7 flex items-start gap-3 min-w-0">
          <Avatar className="size-12 shrink-0 rounded-full border border-border/60 bg-muted overflow-hidden">
            <AvatarImage
              src={topUp.brand.logoUrl ?? undefined}
              alt={topUp.brand.companyName}
              className="rounded-full object-cover"
            />
            <AvatarFallback className="rounded-full text-xs font-medium text-muted-foreground">
              {brandInitial}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-baseline gap-2">
              <h4 className="font-medium text-sm text-foreground truncate">
                {topUp.brand.companyName}
              </h4>
              <span className="text-xs text-muted-foreground truncate">{topUp.brand.email}</span>
            </div>

            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              <div className="truncate">
                <span className="text-foreground/80 font-medium">Pengirim: </span>
                {topUp.senderBank ?? '-'} a.n {topUp.senderAccountName ?? '-'}
              </div>
              <div className="truncate">
                <span className="text-foreground/80 font-medium">Tujuan: </span>
                {topUp.destinationBank} ({topUp.destinationAccount})
              </div>
            </div>
          </div>
        </div>

        {/* Financial Details (5 cols) */}
        <div className="sm:col-span-5 flex flex-col sm:items-end justify-center">
          <p className="text-xs text-muted-foreground">Total Transfer</p>
          <p className="text-base font-semibold tabular-nums text-foreground mt-0.5">
            {FormatRupiah(topUp.totalPayable)}
          </p>
        </div>
      </div>

      {/* Rejection Note Callout if Rejected */}
      {isRejected && topUp.rejectionReason && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
          <span className="font-medium">Alasan Penolakan: </span>
          <span>{topUp.rejectionReason}</span>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3">
        <div>
          {topUp.transferProofUrl ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenProof(topUp)}
              className="h-8 gap-1.5 text-xs cursor-pointer"
            >
              <EyeIcon className="size-3.5" />
              <span>Lihat Bukti Struk</span>
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">
              Belum ada bukti struk yang diunggah
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {isSubmitted && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onReview(topUp, 'REJECT')}
                className="h-8 text-xs cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive border-border/60"
              >
                <CloseIcon className="mr-1 size-3.5" />
                <span>Tolak</span>
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => onReview(topUp, 'APPROVE')}
                className="h-8 text-xs cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <CheckIcon className="mr-1 size-3.5" />
                <span>Setujui Top Up</span>
              </Button>
            </>
          )}

          {isApproved && topUp.verifiedAt && (
            <span className="text-xs text-muted-foreground tabular-nums">
              Disetujui pada {new Date(topUp.verifiedAt).toLocaleDateString('id-ID')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
