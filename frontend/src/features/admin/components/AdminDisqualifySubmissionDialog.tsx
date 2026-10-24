import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { AdminDisqualifySubmissionDialogProps } from '../types';
import { FormatRupiah } from '../utils/formatters';

/**
 * Confirmation dialog for disqualifying an APPROVED submission during Admin Settlement review.
 * Explains that the submission's allocated reward will be reset to Rp 0 and automatically
 * reshuffled down the FIFO queue to remaining eligible submissions (or refunded to the brand).
 *
 * @param props - Dialog props from types.ts.
 * @returns The rendered AlertDialog component.
 */
export function AdminDisqualifySubmissionDialog({
  submission,
  open,
  isPending,
  onOpenChange,
  onConfirm,
}: AdminDisqualifySubmissionDialogProps) {
  const [reviewNote, setReviewNote] = useState(
    'Didiskualifikasi saat audit settlement: terindikasi tayangan tidak valid atau video telah dihapus.',
  );

  const HandleConfirmClick = () => {
    onConfirm(reviewNote.trim());
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-semibold tracking-tight">
            Diskualifikasi Video #{submission?.fifoOrder ?? '-'}?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs leading-relaxed text-muted-foreground">
            Anda akan mendiskualifikasi video milik{' '}
            <span className="font-medium text-foreground">
              {submission?.creatorName ?? 'Kreator'}
            </span>{' '}
            {submission?.socialUsername ? `(@${submission.socialUsername})` : ''}. Alokasi
            reward sebesar{' '}
            <span className="font-mono font-semibold text-foreground">
              {FormatRupiah(submission?.allocatedEarnings ?? 0)}
            </span>{' '}
            akan dibatalkan (Rp 0) dan otomatis dialihkan ke video urutan berikutnya atau
            dikembalikan ke saldo Brand.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-1.5">
          <label
            htmlFor="disqualify-reason-input"
            className="text-xs font-medium text-foreground"
          >
            Catatan Audit / Alasan Diskualifikasi
          </label>
          <Textarea
            id="disqualify-reason-input"
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder="Tuliskan alasan diskualifikasi (contoh: tayangan tidak wajar atau video dihapus dari TikTok)..."
            rows={3}
            disabled={isPending}
            className="text-xs resize-none"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} className="text-xs h-9">
            Batal
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={HandleConfirmClick}
            className="text-xs h-9"
          >
            {isPending ? 'Memproses...' : 'Ya, Diskualifikasi Video'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
