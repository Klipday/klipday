import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowRightIcon,
  FileTextIcon,
  LoaderIcon,
  TrashBinTrashIcon,
} from '@solar-icons/react/linear';
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
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  UseCampaignsQuery,
  UseCampaignStatusCountsQuery,
  UseDeleteCampaignMutation,
} from '../hooks';
import type { ResumeDraftBannerProps } from '../types';
import {
  FormatDraftDate,
  GetDraftStepProgress,
  ResolveCampaignWizardStepPath,
} from '../utils';
import { DraftsSheet } from './DraftsSheet';

/**
 * ResumeDraftBanner provides immediate visibility to brand users when incomplete campaign drafts exist.
 * Displays the latest modified draft's progress, direct resumption action, single-draft deletion,
 * and a side drawer trigger to manage all existing drafts.
 *
 * @param props - Component properties containing optional container styling.
 * @returns The rendered resume draft banner or null if no drafts exist.
 */
export function ResumeDraftBanner({ className }: ResumeDraftBannerProps) {
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const { data: counts, isLoading: isCountsLoading } = UseCampaignStatusCountsQuery();
  const draftCount = counts?.DRAFT ?? 0;

  const { data: draftsData, isLoading: isDraftsLoading } = UseCampaignsQuery(
    {
      campaignStatus: 'DRAFT',
      sort: 'latest',
      limit: 5,
    },
    { enabled: draftCount > 0 }
  );

  const deleteMutation = UseDeleteCampaignMutation({
    successMessage: 'Draf kampanye berhasil dihapus.',
  });

  if (isCountsLoading) {
    return null;
  }

  if (draftCount === 0) {
    return null;
  }

  if (isDraftsLoading) {
    return (
      <div
        className={cn(
          'flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5',
          className
        )}
      >
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    );
  }

  const latestDraft = draftsData?.items?.[0];
  if (!latestDraft) {
    return null;
  }

  const title = latestDraft.title?.trim() || 'Kampanye Tanpa Judul';
  const progress = GetDraftStepProgress(latestDraft);
  const formattedDate = FormatDraftDate(latestDraft.updatedAt);

  const handleContinueLatest = () => {
    const targetPath = ResolveCampaignWizardStepPath(latestDraft);
    navigate(targetPath);
  };

  const handleConfirmDelete = () => {
    setIsAlertOpen(false);
    deleteMutation.mutate(latestDraft.id);
  };

  return (
    <>
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border border-border/70 bg-muted/25 p-4 sm:p-5 text-card-foreground transition-all duration-200 hover:border-border',
          className
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <FileTextIcon className="size-3.5" />
                Draf Belum Selesai
              </span>
              <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/70 px-2 py-0.5 text-xs font-medium text-foreground">
                {progress.stepBadgeText}
              </span>
            </div>

            <div className="space-y-0.5">
              <h3 className="truncate text-base font-semibold text-foreground" title={title}>
                {title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {draftCount === 1
                  ? `Terakhir diedit ${formattedDate}. Lanjutkan untuk menyelesaikan dan mengajukan kampanye.`
                  : `Anda memiliki ${draftCount} draf belum selesai. Terakhir diedit ${formattedDate}.`}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {draftCount === 1 ? (
              <>
                <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 px-3 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      disabled={deleteMutation.isPending}
                    >
                      <TrashBinTrashIcon className="size-3.5" />
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
                      <AlertDialogCancel disabled={deleteMutation.isPending}>
                        Batal
                      </AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={handleConfirmDelete}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? (
                          <>
                            <LoaderIcon className="mr-1.5 size-3.5 animate-spin" />
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
                  className="h-9 px-4 text-xs font-medium"
                  onClick={handleContinueLatest}
                >
                  <span>Lanjutkan Draf</span>
                  <ArrowRightIcon className="ml-1.5 size-3.5" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 text-xs"
                  onClick={() => setIsSheetOpen(true)}
                >
                  <span>Lihat Semua Draf ({draftCount})</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  className="h-9 px-4 text-xs font-medium"
                  onClick={handleContinueLatest}
                >
                  <span>Lanjutkan Terakhir</span>
                  <ArrowRightIcon className="ml-1.5 size-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <DraftsSheet isOpen={isSheetOpen} onOpenChange={setIsSheetOpen} />
    </>
  );
}
