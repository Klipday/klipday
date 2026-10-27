import { useState } from 'react';
import { Loader2 } from 'lucide-react';
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
import type { AdminRevisionDialogProps } from '../types';

/**
 * Modal dialog for requesting brief or content revisions from the campaign brand.
 *
 * @param props - Dialog props.
 * @returns The rendered revision request dialog.
 */
export function AdminRevisionDialog({
  open,
  onOpenChange,
  isPending,
  campaignTitle,
  onConfirm,
}: AdminRevisionDialogProps) {
  const [note, setNote] = useState('');

  const trimmed = note.trim();
  const isValid = trimmed.length > 0 && trimmed.length <= 1000;

  const HandleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setNote('');
    }
    onOpenChange(nextOpen);
  };

  const HandleSubmit = () => {
    if (!isValid || isPending) return;
    onConfirm(trimmed);
    setNote('');
  };

  return (
    <Dialog open={open} onOpenChange={HandleOpenChange}>
      <DialogContent className="max-w-md p-6 space-y-4">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-base font-semibold tracking-tight">
            Minta Revisi Kampanye
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Berikan catatan revisi yang spesifik untuk kampanye{' '}
            <strong className="text-foreground">"{campaignTitle}"</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground leading-relaxed">
          Dana kampanye yang telah dibayarkan tetap aman terkunci. Brand akan melihat catatan ini di
          wizard kampanye dan dapat langsung mengirimkan perbaikan tanpa perlu membayar ulang.
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">
            Catatan Revisi untuk Brand <span className="text-rose-500">*</span>
          </label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isPending}
            placeholder="Contoh: Link Google Drive pada materi belum dibuka akses publiknya, mohon ubah akses menjadi 'Siapa saja yang memiliki link'."
            rows={4}
            maxLength={1000}
            className="text-xs resize-none"
          />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Tuliskan instruksi yang jelas bagi brand</span>
            <span className={note.length > 900 ? 'text-amber-500' : ''}>
              {note.length}/1000
            </span>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            className="text-xs cursor-pointer"
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!isValid || isPending}
            onClick={HandleSubmit}
            className="gap-2 text-xs font-semibold cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Mengirim...</span>
              </>
            ) : (
              <span>Kirim Permintaan Revisi</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
