import { useState } from 'react';
import { ArrowRight, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { DraftItemRowProps } from '../types';
import { FormatDraftDate, GetDraftStepProgress } from '../utils';

/**
 * DraftItemRow renders an individual draft campaign row within the drafts drawer sheet.
 * Displays the title, step progress badge, last-edited timestamp, and actions to
 * resume the wizard or delete the draft campaign with an AlertDialog confirmation.
 *
 * @param props - Component properties containing draft item, continue/delete handlers, and deleting status.
 * @returns The rendered draft item row component.
 */
export function DraftItemRow({
  draft,
  onContinue,
  onDelete,
  isDeleting,
  className,
}: DraftItemRowProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const title = draft.title?.trim() || 'Kampanye Tanpa Judul';
  const progress = GetDraftStepProgress(draft);
  const formattedDate = FormatDraftDate(draft.updatedAt);

  const HandleConfirmDelete = () => {
    setIsAlertOpen(false);
    onDelete(draft);
  };

  return (
    <div
      className={cn(
        'group rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-border hover:bg-card/80',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <h4 className="truncate text-sm font-semibold text-foreground" title={title}>
            {title}
          </h4>
          <p className="text-xs text-muted-foreground">
            Terakhir diedit: {formattedDate}
          </p>
        </div>

        <span className="inline-flex shrink-0 items-center rounded-md border border-border/60 bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {progress.stepBadgeText}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/40 pt-3">
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              disabled={isDeleting}
            >
              <Trash2 className="size-3.5" />
              <span className="ml-1.5">Hapus</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Draf Kampanye?</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus draf &quot;{title}&quot;? Seluruh data yang telah diisi pada draf ini akan dihapus secara permanen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={HandleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  'Hapus Draf'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          type="button"
          size="sm"
          className="h-8 px-3 text-xs"
          onClick={() => onContinue(draft)}
          disabled={isDeleting}
        >
          <span>Lanjutkan</span>
          <ArrowRight className="ml-1 size-3.5" />
        </Button>
      </div>
    </div>
  );
}
