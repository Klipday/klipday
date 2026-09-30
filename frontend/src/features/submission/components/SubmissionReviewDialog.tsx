import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FieldLengthTracker } from '@/features/campaign/components/FieldLengthTracker';
import { cn } from '@/lib/utils';
import {
  UseAcceptSubmissionMutation,
  UseRejectSubmissionMutation,
  UseRequestSubmissionRevisionMutation,
} from '../hooks';
import type { SubmissionReviewDecision, SubmissionReviewDialogProps } from '../types';
import { FormatCompactCount } from '../utils/submission-utils';

const MAX_REVIEW_NOTE_LENGTH = 1000;

/**
 * Modal dialog for reviewing a creator's video submission.
 * Enables brand owners to approve the video, request revisions with mandatory feedback,
 * or reject the video with an optional explanation.
 *
 * @param props - Dialog visibility state, change handler, and target submission item.
 * @returns The rendered submission review dialog component.
 */
export function SubmissionReviewDialog({
  open,
  onOpenChange,
  submission,
}: SubmissionReviewDialogProps) {
  const [decision, setDecision] = useState<SubmissionReviewDecision>('ACCEPT');
  const [reviewNote, setReviewNote] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const acceptMutation = UseAcceptSubmissionMutation();
  const rejectMutation = UseRejectSubmissionMutation();
  const revisionMutation = UseRequestSubmissionRevisionMutation();

  const isSubmitting =
    acceptMutation.isPending || rejectMutation.isPending || revisionMutation.isPending;

  // Reset local state whenever the dialog opens
  useEffect(() => {
    if (open) {
      setDecision('ACCEPT');
      setReviewNote('');
      setFormError(null);
    }
  }, [open]);

  const HandleDecisionSelect = (newDecision: SubmissionReviewDecision) => {
    setDecision(newDecision);
    setFormError(null);
  };

  const HandleSubmit = async () => {
    setFormError(null);

    if (decision === 'REVISION') {
      const trimmed = reviewNote.trim();
      if (!trimmed) {
        setFormError('Catatan revisi wajib diisi agar kreator mengetahui bagian yang perlu diperbaiki.');
        return;
      }
      if (trimmed.length > MAX_REVIEW_NOTE_LENGTH) {
        setFormError(`Catatan revisi maksimal ${MAX_REVIEW_NOTE_LENGTH} karakter.`);
        return;
      }

      try {
        await revisionMutation.mutateAsync({
          submissionId: submission.id,
          reviewNote: trimmed,
        });
        toast.success('Permintaan revisi berhasil dikirim ke kreator.');
        onOpenChange(false);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Gagal mengirim permintaan revisi.';
        toast.error(errorMsg);
      }
      return;
    }

    if (decision === 'REJECT') {
      const trimmed = reviewNote.trim();
      if (trimmed.length > MAX_REVIEW_NOTE_LENGTH) {
        setFormError(`Alasan penolakan maksimal ${MAX_REVIEW_NOTE_LENGTH} karakter.`);
        return;
      }

      try {
        await rejectMutation.mutateAsync({
          submissionId: submission.id,
          reviewNote: trimmed || undefined,
        });
        toast.success('Pengajuan video telah ditolak.');
        onOpenChange(false);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Gagal menolak pengajuan video.';
        toast.error(errorMsg);
      }
      return;
    }

    // Default: ACCEPT
    try {
      await acceptMutation.mutateAsync(submission.id);
      toast.success('Pengajuan video berhasil disetujui!');
      onOpenChange(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal menyetujui pengajuan video.';
      toast.error(errorMsg);
    }
  };

  const creatorInitial = submission.creator?.fullName?.charAt(0).toUpperCase() || 'K';

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSubmitting && onOpenChange(nextOpen)}>
      <DialogContent className="max-w-lg sm:max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4">
        <DialogHeader className="space-y-1">
          <DialogTitle>Review Pengajuan Klip</DialogTitle>
          <DialogDescription>
            Tinjau video yang diajukan oleh kreator dan tentukan keputusan status pengajuan.
          </DialogDescription>
        </DialogHeader>

        {/* Creator & Video Brief Preview */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="size-8 rounded-full border border-border/60 shrink-0">
                {submission.creator?.avatarUrl ? (
                  <AvatarImage
                    src={submission.creator.avatarUrl}
                    alt={submission.creator?.fullName || 'Kreator'}
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {creatorInitial}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {submission.creator?.fullName || 'Kreator Tanpa Nama'}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  @{submission.socialAccount?.username || 'unknown'}
                  {submission.socialAccount?.followersCount !== undefined && (
                    <span> • {FormatCompactCount(submission.socialAccount.followersCount)} followers</span>
                  )}
                </p>
              </div>
            </div>

            {submission.liveVideoUrl && (
              <a
                href={submission.liveVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-border/60 bg-background text-foreground hover:bg-muted transition-colors shrink-0">
                <span>Tonton di TikTok</span>
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>

          {submission.videoCaption && (
            <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed border-t border-border/40 pt-2">
              <span className="font-medium text-foreground">Caption: </span>
              {submission.videoCaption}
            </p>
          )}
        </div>

        {/* Decision Options (3 Selectable Cards) */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">Pilih Keputusan Review</label>
          <div className="grid grid-cols-1 gap-2.5">
            {/* 1. Pass / Setujui */}
            <button
              type="button"
              onClick={() => HandleDecisionSelect('ACCEPT')}
              disabled={isSubmitting}
              className={cn(
                'flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer disabled:cursor-not-allowed',
                decision === 'ACCEPT'
                  ? 'border-emerald-500/60 bg-emerald-500/5 ring-1 ring-emerald-500/30'
                  : 'border-border/60 bg-card hover:bg-muted/30 hover:border-border',
              )}>
              <div
                className={cn(
                  'flex size-5 items-center justify-center rounded-full mt-0.5 shrink-0 transition-colors',
                  decision === 'ACCEPT'
                    ? 'bg-emerald-500 text-white'
                    : 'border border-border/80 text-transparent',
                )}>
                <CheckCircle2 className="size-3.5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs font-semibold text-foreground">Setujui Video</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Video memenuhi seluruh pedoman brief. Pelacakan tayangan dan estimasi pendapatan akan segera diaktifkan.
                </p>
              </div>
            </button>

            {/* 2. Minta Revisi */}
            <button
              type="button"
              onClick={() => HandleDecisionSelect('REVISION')}
              disabled={isSubmitting}
              className={cn(
                'flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer disabled:cursor-not-allowed',
                decision === 'REVISION'
                  ? 'border-orange-500/60 bg-orange-500/5 ring-1 ring-orange-500/30'
                  : 'border-border/60 bg-card hover:bg-muted/30 hover:border-border',
              )}>
              <div
                className={cn(
                  'flex size-5 items-center justify-center rounded-full mt-0.5 shrink-0 transition-colors',
                  decision === 'REVISION'
                    ? 'bg-orange-500 text-white'
                    : 'border border-border/80 text-transparent',
                )}>
                <AlertCircle className="size-3.5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs font-semibold text-foreground">Minta Revisi</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Kreator harus memperbaiki video berdasarkan catatan yang Anda tentukan sebelum video dapat disetujui.
                </p>
              </div>
            </button>

            {/* 3. Tolak Video */}
            <button
              type="button"
              onClick={() => HandleDecisionSelect('REJECT')}
              disabled={isSubmitting}
              className={cn(
                'flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer disabled:cursor-not-allowed',
                decision === 'REJECT'
                  ? 'border-destructive/60 bg-destructive/5 ring-1 ring-destructive/30'
                  : 'border-border/60 bg-card hover:bg-muted/30 hover:border-border',
              )}>
              <div
                className={cn(
                  'flex size-5 items-center justify-center rounded-full mt-0.5 shrink-0 transition-colors',
                  decision === 'REJECT'
                    ? 'bg-destructive text-white'
                    : 'border border-border/80 text-transparent',
                )}>
                <XCircle className="size-3.5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs font-semibold text-foreground">Tolak Pengajuan</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Video tidak memenuhi syarat secara permanen. Kreator tidak akan dapat mengajukan ulang klip untuk kampanye ini.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Dynamic Note Section based on Decision */}
        {decision === 'REVISION' && (
          <div className="space-y-2 border-t border-border/40 pt-3">
            <div className="flex items-center justify-between">
              <label htmlFor="review-note-input" className="text-xs font-medium text-foreground">
                Catatan Revisi <span className="text-destructive">*</span>
              </label>
              <FieldLengthTracker current={reviewNote.length} max={MAX_REVIEW_NOTE_LENGTH} />
            </div>
            <Textarea
              id="review-note-input"
              value={reviewNote}
              onChange={(e) => {
                setReviewNote(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="Jelaskan hal yang perlu diperbaiki (contoh: hook di 3 detik pertama kurang jelas, audio latar terlalu keras, atau hashtag wajib belum lengkap)..."
              disabled={isSubmitting}
              rows={3}
              className={cn('text-xs resize-none', formError && 'border-destructive')}
            />
            {formError ? (
              <p className="text-[11px] text-destructive leading-normal">{formError}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Catatan ini akan langsung terlihat oleh kreator pada halaman rincian kampanye mereka.
              </p>
            )}
          </div>
        )}

        {decision === 'REJECT' && (
          <div className="space-y-2 border-t border-border/40 pt-3">
            <div className="flex items-center justify-between">
              <label htmlFor="review-reject-note-input" className="text-xs font-medium text-foreground">
                Alasan Penolakan <span className="text-muted-foreground font-normal">(Opsional)</span>
              </label>
              <FieldLengthTracker current={reviewNote.length} max={MAX_REVIEW_NOTE_LENGTH} />
            </div>
            <Textarea
              id="review-reject-note-input"
              value={reviewNote}
              onChange={(e) => {
                setReviewNote(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="Berikan alasan mengapa video ini tidak memenuhi kriteria kampanye..."
              disabled={isSubmitting}
              rows={3}
              className={cn('text-xs resize-none', formError && 'border-destructive')}
            />
            {formError && <p className="text-[11px] text-destructive leading-normal">{formError}</p>}
          </div>
        )}

        {decision === 'ACCEPT' && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] text-muted-foreground leading-relaxed">
            Setelah disetujui, video akan langsung terhubung ke sistem verifikasi tayangan otomatis Klipday dan kreator dapat mulai mengumpulkan tayangan terverifikasi.
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2.5 pt-2 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs rounded-xl cursor-pointer">
            Batal
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={HandleSubmit}
            disabled={isSubmitting}
            className={cn(
              'text-xs font-medium rounded-xl cursor-pointer gap-1.5 transition-colors',
              decision === 'ACCEPT' && 'bg-emerald-600 hover:bg-emerald-700 text-white',
              decision === 'REVISION' && 'bg-orange-600 hover:bg-orange-700 text-white',
              decision === 'REJECT' && 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
            )}>
            {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
            <span>
              {decision === 'ACCEPT' && 'Setujui Video'}
              {decision === 'REVISION' && 'Kirim Revisi'}
              {decision === 'REJECT' && 'Tolak Video'}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
