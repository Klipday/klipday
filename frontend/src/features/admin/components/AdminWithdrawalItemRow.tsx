import { useState } from 'react';
import {
  CheckIcon,
  CloseIcon,
  CopyIcon,
  EyeIcon,
} from '@solar-icons/react/linear';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AdminWithdrawalItemRowProps } from '../types';
import { FormatRupiah } from '../utils/formatters';

/**
 * Renders an individual withdrawal row item in the Admin Withdrawal verification queue.
 * Uses pure typographic hierarchy without pill badges, bullet separators, or monospace currency styling.
 *
 * @param props - Component props containing withdrawal, onOpenKyc, onReview, and optional className.
 * @returns The rendered row item.
 */
export function AdminWithdrawalItemRow({
  withdrawal,
  onOpenKyc,
  onReview,
  className,
}: AdminWithdrawalItemRowProps) {
  const [copied, setCopied] = useState(false);

  const isPending = withdrawal.payoutStatus === 'PENDING';
  const isCancellation = isPending && Boolean(withdrawal.cancellationRequestedAt);
  const isApproved = withdrawal.payoutStatus === 'APPROVED';
  const isRejected = withdrawal.payoutStatus === 'REJECTED';

  const userInitial = withdrawal.user.displayName.slice(0, 2).toUpperCase() || 'WD';
  const roleLabel = withdrawal.user.role === 'CREATOR' ? 'Kreator' : 'Brand';

  const statusLabel = isCancellation
    ? 'Mengajukan Batal'
    : isPending
      ? 'Perlu Diproses'
      : isApproved
        ? 'Selesai Ditransfer'
        : 'Ditolak';

  const statusTextClassName = isPending
    ? 'text-amber-500'
    : isRejected
      ? 'text-destructive'
      : 'text-foreground';

  const formattedDate = new Date(withdrawal.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedProcessedDate = withdrawal.processedAt
    ? new Date(withdrawal.processedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const HandleCopyAccountNumber = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(withdrawal.accountNumber);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = withdrawal.accountNumber;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      toast.success('Nomor rekening berhasil disalin!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin nomor rekening.');
    }
  };

  return (
    <div
      className={cn(
        'group rounded-xl border border-border/60 bg-card p-4 sm:p-5 transition-colors hover:border-border space-y-4',
        className,
      )}
    >
      {/* Top Header: Reference Code & Role (left) vs Status & Creation Date (right) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div className="flex items-center gap-x-3">
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {withdrawal.referenceCode}
          </span>
          <span className="text-xs text-muted-foreground">{roleLabel}</span>
        </div>

        <div className="flex items-center gap-x-4 text-xs">
          <span className={cn('font-medium', statusTextClassName)}>{statusLabel}</span>
          <span className="text-muted-foreground tabular-nums">{formattedDate}</span>
        </div>
      </div>

      {/* Middle Body: Requester & Bank Details vs Financial Amount */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-center">
        {/* Requester & Destination Info (7 cols) */}
        <div className="sm:col-span-7 flex items-start gap-3 min-w-0">
          <Avatar className="size-12 shrink-0 rounded-full border border-border/60 bg-muted overflow-hidden">
            <AvatarImage
              src={withdrawal.user.avatarUrl ?? undefined}
              alt={withdrawal.user.displayName}
              className="rounded-full object-cover"
            />
            <AvatarFallback className="rounded-full text-xs font-medium text-muted-foreground">
              {userInitial}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-baseline gap-2">
              <h4 className="font-medium text-sm text-foreground truncate">
                {withdrawal.user.displayName}
              </h4>
              <span className="text-xs text-muted-foreground truncate">
                {withdrawal.user.email}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
              <span className="text-foreground/90 font-medium">
                {withdrawal.accountProvider}
              </span>
              <span className="text-foreground tabular-nums">{withdrawal.accountNumber}</span>
              <span>a.n {withdrawal.accountHolderName}</span>
              <button
                type="button"
                onClick={HandleCopyAccountNumber}
                title="Salin nomor rekening"
                className="inline-flex items-center gap-1 rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                {copied ? <CheckIcon className="size-3 text-emerald-500" /> : <CopyIcon className="size-3" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Financial Details (5 cols) */}
        <div className="sm:col-span-5 flex flex-col sm:items-end justify-center">
          <p className="text-xs text-muted-foreground">Nominal Penarikan</p>
          <p className="text-base font-semibold tabular-nums text-foreground mt-0.5">
            {FormatRupiah(withdrawal.amount)}
          </p>
        </div>
      </div>

      {/* User Cancellation Callout if Cancellation Requested */}
      {withdrawal.cancellationReason && (
        <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
          <span className="font-medium text-amber-500">Pengajuan Pembatalan: </span>
          <span>{withdrawal.cancellationReason}</span>
        </div>
      )}

      {/* Rejection Note Callout if Rejected */}
      {isRejected && withdrawal.rejectionReason && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
          <span className="font-medium">Alasan Penolakan: </span>
          <span>{withdrawal.rejectionReason}</span>
        </div>
      )}

      {/* Admin Transfer Note Callout if Present */}
      {withdrawal.adminNote && (
        <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Catatan Admin: </span>
          <span>{withdrawal.adminNote}</span>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3">
        <div>
          {withdrawal.payoutAccount?.proofUrl ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenKyc(withdrawal)}
              className="h-8 gap-1.5 text-xs cursor-pointer"
            >
              <EyeIcon className="size-3.5" />
              <span>Lihat Bukti Rekening KYC</span>
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">
              Rekening Snapshot (Tanpa Lampiran KYC)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {isPending && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onReview(withdrawal, 'REJECT')}
                className="h-8 text-xs cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive border-border/60"
              >
                <CloseIcon className="mr-1 size-3.5" />
                <span>{isCancellation ? 'Setujui Batal' : 'Tolak & Refund'}</span>
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => onReview(withdrawal, 'APPROVE')}
                className="h-8 text-xs cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <CheckIcon className="mr-1 size-3.5" />
                <span>Konfirmasi Sudah Transfer</span>
              </Button>
            </>
          )}

          {isApproved && formattedProcessedDate && (
            <span className="text-xs text-muted-foreground tabular-nums">
              Ditransfer pada {formattedProcessedDate}
            </span>
          )}

          {isRejected && formattedProcessedDate && (
            <span className="text-xs text-muted-foreground tabular-nums">
              Ditolak pada {formattedProcessedDate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
