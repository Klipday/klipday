import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { UseCampaignsQuery, UseDeleteCampaignMutation } from '../hooks';
import type { CampaignCardItem, DraftsSheetProps } from '../types';
import { ResolveCampaignWizardStepPath } from '../utils';
import { DraftItemRow } from './DraftItemRow';

/**
 * DraftsSheet renders a slide-out drawer (Sheet) from the right edge displaying
 * all incomplete draft campaigns for the authenticated brand.
 * Allows users to inspect draft step progress, resume completing drafts, or delete stale drafts.
 *
 * @param props - Component properties containing drawer open state and change handler.
 * @returns The rendered drafts sheet drawer component.
 */
export function DraftsSheet({ isOpen, onOpenChange, className }: DraftsSheetProps) {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: draftsData, isLoading } = UseCampaignsQuery({
    campaignStatus: 'DRAFT',
    sort: 'latest',
    limit: 50,
  });

  const deleteMutation = UseDeleteCampaignMutation({
    successMessage: 'Draf kampanye berhasil dihapus.',
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const drafts = draftsData?.items ?? [];
  const draftCount = drafts.length;

  const HandleContinue = (draft: CampaignCardItem) => {
    onOpenChange(false);
    const targetPath = ResolveCampaignWizardStepPath(draft);
    navigate(targetPath);
  };

  const HandleDelete = (draft: CampaignCardItem) => {
    setDeletingId(draft.id);
    deleteMutation.mutate(draft.id);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn('flex flex-col gap-0 p-0 sm:max-w-md', className)}
      >
        <SheetHeader className="border-b border-border/40 p-5">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-base font-semibold">
              Daftar Draf Kampanye
            </SheetTitle>
            {!isLoading && draftCount > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {draftCount}
              </span>
            )}
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            Lanjutkan pengisian draf kampanye yang belum selesai atau hapus draf yang sudah tidak diperlukan.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="space-y-2 rounded-xl border border-border/40 bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-3 w-2/5" />
                  <div className="flex justify-between pt-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : draftCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-medium text-foreground">
                Tidak ada draf kampanye
              </p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Semua draf Anda telah selesai diajukan atau telah dibersihkan.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {drafts.map((draft) => (
                <DraftItemRow
                  key={draft.id}
                  draft={draft}
                  onContinue={HandleContinue}
                  onDelete={HandleDelete}
                  isDeleting={deletingId === draft.id}
                />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
