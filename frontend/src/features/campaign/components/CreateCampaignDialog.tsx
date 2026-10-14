import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, Loader2, Plus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  UseCampaignsQuery,
  UseCampaignStatusCountsQuery,
  UseInitializeCampaignMutation,
} from '../hooks';
import type { CreateCampaignDialogProps } from '../types';
import {
  FormatDraftDate,
  GetDraftStepProgress,
  ResolveCampaignWizardStepPath,
} from '../utils';
import { DraftsSheet } from './DraftsSheet';

/**
 * Smart campaign creation dialog modal.
 * Inspects existing incomplete draft counts:
 * - If 0 drafts: Displays standard new campaign initiation confirmation.
 * - If >= 1 drafts: Presents a friendly reminder offering to resume the latest draft,
 *   inspect all drafts via the side drawer, or proceed with creating a brand new campaign.
 *
 * @param props - Component properties containing the trigger children.
 * @returns The smart confirmation dialog element.
 */
export function CreateCampaignDialog({ children }: CreateCampaignDialogProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [draftCountOnOpen, setDraftCountOnOpen] = useState(0);

  const { data: counts } = UseCampaignStatusCountsQuery();
  const currentDraftCount = counts?.DRAFT ?? 0;

  const hasDrafts = draftCountOnOpen >= 1;

  const { data: draftsData } = UseCampaignsQuery(
    isOpen && hasDrafts
      ? {
          campaignStatus: 'DRAFT',
          sort: 'latest',
          limit: 1,
        }
      : undefined
  );

  const initializeMutation = UseInitializeCampaignMutation({
    onSuccess: () => {
      setIsOpen(false);
    },
  });

  const latestDraft = draftsData?.items?.[0];
  const latestDraftTitle = latestDraft?.title?.trim() || 'Kampanye Tanpa Judul';
  const latestDraftProgress = GetDraftStepProgress(latestDraft);
  const latestDraftDate = FormatDraftDate(latestDraft?.updatedAt);

  const HandleOpenChange = (open: boolean) => {
    if (open) {
      setDraftCountOnOpen(currentDraftCount);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const HandleContinueLatest = () => {
    if (!latestDraft) return;
    setIsOpen(false);
    const targetPath = ResolveCampaignWizardStepPath(latestDraft);
    navigate(targetPath);
  };

  const HandleOpenSheet = () => {
    setIsOpen(false);
    setIsSheetOpen(true);
  };

  const HandleCreateNew = () => {
    setIsOpen(false);
    initializeMutation.mutate();
  };

  return (
    <>
      <AlertDialog open={isOpen} onOpenChange={HandleOpenChange}>
        <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
        <AlertDialogContent>
          {hasDrafts ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Lanjutkan Draf Sebelumnya?</AlertDialogTitle>
                <AlertDialogDescription>
                  Anda masih memiliki {draftCountOnOpen} draf yang belum selesai. Mau lanjutkan draf sebelumnya atau buat kampanye baru?
                </AlertDialogDescription>
              </AlertDialogHeader>

              {latestDraft && (
                <div className="my-1 rounded-xl border border-border/60 bg-muted/30 p-3.5 text-left space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-foreground" title={latestDraftTitle}>
                      {latestDraftTitle}
                    </span>
                    <span className="shrink-0 rounded-md border border-border/60 bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {latestDraftProgress.stepBadgeText}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Terakhir diedit: {latestDraftDate}
                  </p>
                </div>
              )}

              <div className="space-y-2 pt-1">
                <Button
                  type="button"
                  className="h-9 w-full justify-center gap-1.5 px-3.5 text-xs font-medium"
                  onClick={HandleContinueLatest}
                  disabled={!latestDraft}
                >
                  <span>Lanjutkan Draf Terakhir</span>
                  <ArrowRight className="size-3.5" />
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 text-xs"
                    onClick={HandleOpenSheet}
                  >
                    <span>Lihat Semua Draf ({draftCountOnOpen})</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 text-xs"
                    onClick={HandleCreateNew}
                    disabled={initializeMutation.isPending}
                  >
                    {initializeMutation.isPending ? (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    ) : (
                      <Plus className="mr-1.5 size-3.5" />
                    )}
                    <span>Tetap Buat Baru</span>
                  </Button>
                </div>
              </div>

              <AlertDialogFooter className="pt-2 sm:justify-start">
                <AlertDialogCancel className="h-8 w-full text-xs sm:w-auto">
                  Batal
                </AlertDialogCancel>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Buat Kampanye Baru?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini akan membuat draf kampanye baru dan memulai langkah pengaturan kampanye Anda.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={initializeMutation.isPending}>
                  Batal
                </AlertDialogCancel>
                <Button
                  onClick={HandleCreateNew}
                  disabled={initializeMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {initializeMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <span>Ya, Buat Kampanye</span>
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      <DraftsSheet isOpen={isSheetOpen} onOpenChange={setIsSheetOpen} />
    </>
  );
}
