import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  UseConnectedSocialAccountQuery,
  UseFinalSubmitVideoMutation,
  UseMyCampaignSubmissionQuery,
  UseSaveDraftSubmissionMutation,
} from '../hooks';
import type { SocialVideoItem, SubmissionDialogProps } from '../types';
import { SubmissionDialogCampaignSidebar } from './SubmissionDialogCampaignSidebar';
import { SubmissionDialogFooter } from './SubmissionDialogFooter';
import { SubmissionDialogStepper } from './SubmissionDialogStepper';
import { SubmissionExitConfirmDialog } from './SubmissionExitConfirmDialog';
import { SubmissionStep1BriefDialog } from './SubmissionStep1BriefDialog';
import { SubmissionStep2AccountDialog } from './SubmissionStep2AccountDialog';
import { SubmissionStep3VideoPickerDialog } from './SubmissionStep3VideoPickerDialog';
import { SubmissionStep4OverviewDialog } from './SubmissionStep4OverviewDialog';

/**
 * Modern modal dialog orchestrator for the video submission workflow.
 * Replaces the multi-page wizard layout with a 2-column split modal:
 * - Left column: Live campaign summary preview card with CPM, metrics, and poster artwork.
 * - Right column: Compact horizontal stepper (1 -> 4), step body, and action footer.
 *
 * @param props - Component properties containing campaign, open state, and visibility toggle.
 * @returns Rendered submission modal dialog.
 */
export function SubmissionDialog({
  campaign,
  open,
  onOpenChange,
  className,
}: SubmissionDialogProps) {
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [hasAgreed, setHasAgreed] = useState<boolean>(false);
  const [maxStepReached, setMaxStepReached] = useState<number>(1);
  const [selectedVideo, setSelectedVideo] = useState<SocialVideoItem | null | undefined>(undefined);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  const { data: queriedAccount } = UseConnectedSocialAccountQuery();
  const { data: mySubmissionData } = UseMyCampaignSubmissionQuery(open ? campaign.id : undefined);
  const saveDraftMutation = UseSaveDraftSubmissionMutation(campaign.id);
  const finalSubmitMutation = UseFinalSubmitVideoMutation(campaign.id);

  const connectedAccount = queriedAccount ?? mySubmissionData?.socialAccount ?? null;
  const existingSubmission = mySubmissionData?.submission;

  // Only restore initial draft video if it matches the currently connected social account
  const isDraftMatchingAccount = Boolean(
    connectedAccount &&
      existingSubmission?.liveVideoUrl &&
      ((!existingSubmission.socialAccountId && !existingSubmission.socialAccount) ||
        existingSubmission.socialAccountId === connectedAccount.id ||
        existingSubmission.socialAccount?.id === connectedAccount.id),
  );

  const initialDraftVideo: SocialVideoItem | null =
    isDraftMatchingAccount && existingSubmission?.liveVideoUrl
      ? {
          id: 'existing-draft',
          url: existingSubmission.liveVideoUrl,
          authorUsername: connectedAccount?.username || 'creator',
          caption: existingSubmission.videoCaption || undefined,
          thumbnailUrl: existingSubmission.thumbnailUrl || undefined,
        }
      : null;

  // Guard against orphaned video selections from previous accounts
  const isSelectedVideoMatchingAccount = Boolean(
    selectedVideo &&
      connectedAccount &&
      (!selectedVideo.authorUsername ||
        selectedVideo.authorUsername.toLowerCase() === connectedAccount.username.toLowerCase()),
  );

  const validSelectedVideo =
    selectedVideo === null
      ? null
      : selectedVideo === undefined
        ? undefined
        : isSelectedVideoMatchingAccount
          ? selectedVideo
          : null;

  const activeVideo =
    validSelectedVideo !== undefined ? validSelectedVideo : initialDraftVideo;

  const highestAccessibleStep = (() => {
    // If the creator has not agreed to the campaign brief, no step past step 1 is accessible
    if (!hasAgreed) return 1;

    let maxAllowed = maxStepReached;

    // Prerequisite: cannot jump to or past step 3 without a verified social account matching the campaign platform
    const requiredPlatform = (campaign.platform || 'TIKTOK').toUpperCase();
    const isAccountValid = Boolean(
      connectedAccount?.isVerified &&
        (connectedAccount.platform || 'TIKTOK').toUpperCase() === requiredPlatform,
    );

    if (maxAllowed >= 3 && !isAccountValid) {
      maxAllowed = 2;
    }

    // Prerequisite: cannot jump to step 4 without a selected video
    if (maxAllowed >= 4 && !activeVideo) {
      maxAllowed = 3;
    }

    return maxAllowed;
  })();

  const HandleRequestClose = () => {
    setShowExitConfirm(true);
  };

  const HandleConfirmExit = () => {
    setShowExitConfirm(false);
    setCurrentStep(1);
    setHasAgreed(false);
    setMaxStepReached(1);
    setSelectedVideo(undefined);
    onOpenChange(false);
  };

  const HandleCancelExit = () => {
    setShowExitConfirm(false);
  };

  const HandleForceClose = () => {
    setShowExitConfirm(false);
    setCurrentStep(1);
    setHasAgreed(false);
    setMaxStepReached(1);
    setSelectedVideo(undefined);
    onOpenChange(false);
  };

  const HandleToggleAgreed = () => {
    setHasAgreed((prev) => {
      const nextAgreed = !prev;
      if (!nextAgreed) {
        // Revoke progression past step 1 if creator unchecks brief agreement
        setMaxStepReached(1);
      }
      return nextAgreed;
    });
  };

  // Compute if user can proceed to next step
  const canProceed = (() => {
    if (currentStep === 1) return hasAgreed;
    if (currentStep === 2) {
      const requiredPlatform = (campaign.platform || 'TIKTOK').toUpperCase();
      return Boolean(
        connectedAccount?.isVerified &&
          (connectedAccount.platform || 'TIKTOK').toUpperCase() === requiredPlatform,
      );
    }
    if (currentStep === 3) return Boolean(activeVideo);
    if (currentStep === 4) return Boolean(activeVideo && connectedAccount);
    return false;
  })();

  const HandleNext = async () => {
    if (currentStep === 1) {
      if (!hasAgreed) {
        toast.error('Harap setujui brief kampanye terlebih dahulu.');
        return;
      }
      setMaxStepReached((prev) => Math.max(prev, 2));
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      const requiredPlatform = (campaign.platform || 'TIKTOK').toUpperCase();
      const isAccountValid = Boolean(
        connectedAccount?.isVerified &&
          (connectedAccount.platform || 'TIKTOK').toUpperCase() === requiredPlatform,
      );

      if (!isAccountValid) {
        const platformLabel = campaign.platform
          ? campaign.platform.charAt(0).toUpperCase() + campaign.platform.slice(1).toLowerCase()
          : 'TikTok';
        toast.error(`Harap hubungkan akun ${platformLabel} yang terverifikasi terlebih dahulu.`);
        return;
      }
      setMaxStepReached((prev) => Math.max(prev, 3));
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      if (!activeVideo) {
        toast.error('Harap pilih video terlebih dahulu.');
        return;
      }

      if (connectedAccount?.id) {
        try {
          await saveDraftMutation.mutateAsync({
            liveVideoUrl: activeVideo.url,
            thumbnailUrl: activeVideo.thumbnailUrl || undefined,
            videoCaption: activeVideo.caption || undefined,
            socialAccountId: connectedAccount.id,
          });
        } catch (err) {
          console.warn('Gagal menyimpan draf pengajuan:', err);
        }
      }

      setMaxStepReached((prev) => Math.max(prev, 4));
      setCurrentStep(4);
      return;
    }

    if (currentStep === 4) {
      if (!activeVideo || !connectedAccount?.id) {
        toast.error('Data video tidak lengkap.');
        return;
      }

      try {
        await finalSubmitMutation.mutateAsync({
          liveVideoUrl: activeVideo.url,
          thumbnailUrl: activeVideo.thumbnailUrl || undefined,
          videoCaption: activeVideo.caption || undefined,
          socialAccountId: connectedAccount.id,
        });

        toast.success('Pengajuan video berhasil dikirimkan! Menunggu persetujuan brand.');
        await queryClient.invalidateQueries({ queryKey: ['my-campaign-submission', campaign.id] });
        await queryClient.invalidateQueries({ queryKey: ['campaign', campaign.id] });
        await queryClient.invalidateQueries({ queryKey: ['campaign-submissions', campaign.id] });
        await queryClient.invalidateQueries({ queryKey: ['creator-campaigns'] });
        HandleForceClose();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Gagal mengirim pengajuan video.';
        toast.error(errorMsg);
      }
    }
  };

  const HandleBack = () => {
    if (currentStep === 4) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const HandleStepSelect = (step: number) => {
    if (step > 1 && !hasAgreed) {
      toast.error('Harap setujui brief kampanye terlebih dahulu.');
      return;
    }
    if (step > highestAccessibleStep) {
      return;
    }
    setCurrentStep(step);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            HandleRequestClose();
          }
        }}>
        <DialogContent
          showCloseButton={false}
          onPointerDownOutside={(e) => {
            e.preventDefault();
            HandleRequestClose();
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            HandleRequestClose();
          }}
          className={cn(
            'w-[95vw] sm:max-w-4xl lg:max-w-5xl h-[88vh] max-h-[660px] min-h-[520px] p-0 overflow-hidden flex flex-col md:flex-row bg-card border border-border/70 rounded-2xl shadow-2xl gap-0',
            className,
          )}>
          {/* Visually Hidden Accessibility Headers for Screen Readers */}
          <div className="sr-only">
            <DialogTitle>Kirim Video Kampanye - {campaign.title}</DialogTitle>
            <DialogDescription>
              Formulir pengajuan video clipping kampanye untuk kreator.
            </DialogDescription>
          </div>

          {/* Left Column: Atmospheric Campaign Preview Card */}
          <SubmissionDialogCampaignSidebar campaign={campaign} />

          {/* Right Column: Stepper, Step Content, and Action Footer */}
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background/50">
            {/* Header Row: Stepper & Close Button */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/40 shrink-0">
              <SubmissionDialogStepper
                currentStep={currentStep}
                totalSteps={4}
                highestAccessibleStep={highestAccessibleStep}
                onStepSelect={HandleStepSelect}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={HandleRequestClose}
                className="rounded-full text-muted-foreground hover:text-foreground cursor-pointer shrink-0">
                <X className="size-4" />
                <span className="sr-only">Tutup</span>
              </Button>
            </div>

          {/* Revision Feedback Alert Banner for creators whose video requires changes */}
          {existingSubmission?.submissionStatus === 'REVISION_REQUESTED' && existingSubmission.reviewNote && (
            <div className="mx-6 mt-4 -mb-1 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1 shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <AlertCircle className="size-3.5" />
                <span>Catatan Revisi dari Brand:</span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed">
                {existingSubmission.reviewNote}
              </p>
            </div>
          )}

          {/* Body Content Area: Scrollable Step View */}
          <main className="flex-1 overflow-y-auto px-6 py-5">
            {currentStep === 1 && (
              <SubmissionStep1BriefDialog
                campaign={campaign}
                hasAgreed={hasAgreed}
                onToggleAgreed={HandleToggleAgreed}
              />
            )}

            {currentStep === 2 && (
              <SubmissionStep2AccountDialog
                campaignId={campaign.id}
                campaign={campaign}
                campaignPlatform={campaign.platform || 'TIKTOK'}
                connectedAccount={connectedAccount}
                onAccountVerified={(acc) => {
                  const isAccountChanged = Boolean(
                    connectedAccount &&
                      (acc.id !== connectedAccount.id ||
                        acc.username.toLowerCase() !== connectedAccount.username.toLowerCase()),
                  );
                  queryClient.setQueryData(['connected-social-account'], acc);
                  queryClient.invalidateQueries({ queryKey: ['connected-social-account'] });
                  queryClient.invalidateQueries({ queryKey: ['recent-tiktok-videos'] });
                  queryClient.invalidateQueries({ queryKey: ['my-campaign-submission', campaign.id] });

                  if (isAccountChanged) {
                    setSelectedVideo(null);
                    setMaxStepReached(3);
                  } else {
                    setMaxStepReached((prev) => Math.max(prev, 3));
                  }
                }}
              />
            )}

            {currentStep === 3 && (
              <SubmissionStep3VideoPickerDialog
                campaignId={campaign.id}
                connectedAccount={connectedAccount}
                selectedVideo={activeVideo}
                onSelectVideo={(video) => setSelectedVideo(video)}
                onSwitchAccount={() => setCurrentStep(2)}
              />
            )}

            {currentStep === 4 && (
              <SubmissionStep4OverviewDialog
                campaign={campaign}
                selectedVideo={activeVideo}
                connectedAccount={connectedAccount}
              />
            )}
          </main>

          {/* Action Footer: Back & Next / Submit */}
          <SubmissionDialogFooter
            currentStep={currentStep}
            totalSteps={4}
            canProceed={canProceed}
            isSubmitting={saveDraftMutation.isPending || finalSubmitMutation.isPending}
            onBack={HandleBack}
            onNext={HandleNext}
          />
        </div>
      </DialogContent>
    </Dialog>

    <SubmissionExitConfirmDialog
      open={showExitConfirm}
      onConfirm={HandleConfirmExit}
      onCancel={HandleCancelExit}
    />
  </>
);
}
