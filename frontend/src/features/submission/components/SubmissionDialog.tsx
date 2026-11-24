import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CloseIcon, DangerCircleIcon } from '@solar-icons/react/linear';
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
  UseAllConnectedSocialAccountsQuery,
  UseFinalSubmitVideoMutation,
  UseMyCampaignSubmissionQuery,
  UseSaveDraftSubmissionMutation,
} from '../hooks';
import type { SocialPlatform, SocialVideoItem, SubmissionDialogProps } from '../types';
import { SubmissionDialogCampaignSidebar } from './SubmissionDialogCampaignSidebar';
import { SubmissionDialogFooter } from './SubmissionDialogFooter';
import { SubmissionDialogStepper } from './SubmissionDialogStepper';
import { SubmissionExitConfirmDialog } from './SubmissionExitConfirmDialog';
import { SubmissionStep1BriefDialog } from './SubmissionStep1BriefDialog';
import { SubmissionStep2AccountDialog } from './SubmissionStep2AccountDialog';
import { SubmissionStep3VideoPickerDialog } from './SubmissionStep3VideoPickerDialog';
import { SubmissionStep4OverviewDialog } from './SubmissionStep4OverviewDialog';

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  TIKTOK: 'TikTok',
  INSTAGRAM: 'Instagram Reels',
  YOUTUBE: 'YouTube Shorts',
};

/**
 * Normalizes a campaign's allowed platforms array into valid `SocialPlatform` values.
 *
 * @param rawPlatforms - Campaign platforms array from API.
 * @returns Non-empty list of valid SocialPlatform values.
 */
function NormalizeAllowedPlatforms(rawPlatforms?: string[]): SocialPlatform[] {
  const valid = (rawPlatforms ?? []).filter(
    (p): p is SocialPlatform => p === 'TIKTOK' || p === 'INSTAGRAM' || p === 'YOUTUBE',
  );
  return valid.length > 0 ? valid : ['TIKTOK'];
}

/**
 * Modern modal dialog orchestrator for the multi-platform video submission workflow.
 * Supports submitting clips across TikTok, Instagram Reels, and YouTube Shorts,
 * honoring per-platform submission quotas configured by the brand.
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
  const [userSelectedPlatform, setUserSelectedPlatform] = useState<SocialPlatform | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<SocialVideoItem | null | undefined>(undefined);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  const { data: queriedAccounts } = UseAllConnectedSocialAccountsQuery();
  const { data: mySubmissionData } = UseMyCampaignSubmissionQuery(open ? campaign.id : undefined);
  const saveDraftMutation = UseSaveDraftSubmissionMutation(campaign.id);
  const finalSubmitMutation = UseFinalSubmitVideoMutation(campaign.id);

  const allowedPlatforms = NormalizeAllowedPlatforms(campaign.platforms);
  const platformQuotas = mySubmissionData?.platformQuotas;
  const connectedAccounts = queriedAccounts ?? mySubmissionData?.socialAccounts ?? [];

  // Default to the first allowed platform that still has remaining quota (or a REVISION_REQUESTED submission's platform)
  const revisionSubmission = mySubmissionData?.submissions?.find(
    (s) => s.submissionStatus === 'REVISION_REQUESTED',
  );
  const firstAvailablePlatform =
    platformQuotas?.find((q) => q.canSubmit)?.platform ?? allowedPlatforms[0] ?? 'TIKTOK';
  const defaultPlatform: SocialPlatform =
    revisionSubmission?.platform && allowedPlatforms.includes(revisionSubmission.platform)
      ? revisionSubmission.platform
      : firstAvailablePlatform;

  const selectedPlatform: SocialPlatform =
    userSelectedPlatform && allowedPlatforms.includes(userSelectedPlatform)
      ? userSelectedPlatform
      : defaultPlatform;

  const selectedPlatformQuota = platformQuotas?.find((q) => q.platform === selectedPlatform);
  const connectedAccount =
    connectedAccounts.find((acc) => acc.platform === selectedPlatform && acc.isVerified) ?? null;

  // Identify if we are editing an existing JOINED or REVISION_REQUESTED row for the selected platform
  const editableSubmission =
    mySubmissionData?.submissions?.find(
      (s) => s.platform === selectedPlatform && s.submissionStatus === 'REVISION_REQUESTED',
    ) ??
    mySubmissionData?.submissions?.find((s) => s.submissionStatus === 'JOINED') ??
    null;

  // Only restore initial draft video if editing an existing editable row matching the selected account
  const isDraftMatchingAccount = Boolean(
    connectedAccount &&
      editableSubmission?.liveVideoUrl &&
      ((!editableSubmission.socialAccountId && !editableSubmission.socialAccount) ||
        editableSubmission.socialAccountId === connectedAccount.id ||
        editableSubmission.socialAccount?.id === connectedAccount.id),
  );

  const initialDraftVideo: SocialVideoItem | null =
    isDraftMatchingAccount && editableSubmission?.liveVideoUrl
      ? {
          id: 'existing-draft',
          url: editableSubmission.liveVideoUrl,
          authorUsername: connectedAccount?.username || 'creator',
          caption: editableSubmission.videoCaption || undefined,
          thumbnailUrl: editableSubmission.thumbnailUrl || undefined,
        }
      : null;

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

  const isPlatformSelectableAndConnected = Boolean(
    connectedAccount?.isVerified &&
      allowedPlatforms.includes(selectedPlatform) &&
      (editableSubmission?.submissionStatus === 'REVISION_REQUESTED' ||
        !selectedPlatformQuota ||
        selectedPlatformQuota.canSubmit),
  );

  const highestAccessibleStep = (() => {
    if (!hasAgreed) return 1;

    let maxAllowed = maxStepReached;

    if (maxAllowed >= 3 && !isPlatformSelectableAndConnected) {
      maxAllowed = 2;
    }

    if (maxAllowed >= 4 && !activeVideo) {
      maxAllowed = 3;
    }

    return maxAllowed;
  })();

  const HandleRequestClose = () => {
    setShowExitConfirm(true);
  };

  const ResetWizardState = () => {
    setShowExitConfirm(false);
    setCurrentStep(1);
    setHasAgreed(false);
    setMaxStepReached(1);
    setUserSelectedPlatform(null);
    setSelectedVideo(undefined);
    onOpenChange(false);
  };

  const HandleCancelExit = () => {
    setShowExitConfirm(false);
  };

  const HandleToggleAgreed = () => {
    setHasAgreed((prev) => {
      const nextAgreed = !prev;
      if (!nextAgreed) {
        setMaxStepReached(1);
      }
      return nextAgreed;
    });
  };

  const HandleSelectPlatform = (nextPlatform: SocialPlatform) => {
    if (nextPlatform !== selectedPlatform) {
      setUserSelectedPlatform(nextPlatform);
      setSelectedVideo(null);
      setMaxStepReached((prev) => Math.min(prev, 2));
    }
  };

  const canProceed = (() => {
    if (currentStep === 1) return hasAgreed;
    if (currentStep === 2) return isPlatformSelectableAndConnected;
    if (currentStep === 3) return Boolean(activeVideo);
    if (currentStep === 4) return Boolean(activeVideo && connectedAccount);
    return false;
  })();

  const HandleNext = async () => {
    if (saveDraftMutation.isPending || finalSubmitMutation.isPending) {
      return;
    }

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
      if (!isPlatformSelectableAndConnected) {
        const label = PLATFORM_LABELS[selectedPlatform];
        toast.error(`Harap hubungkan akun ${label} yang terverifikasi dan masih memiliki kuota terlebih dahulu.`);
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

      // Only autosave draft when editing an existing JOINED / REVISION_REQUESTED row;
      // additional 2nd+ submissions are inserted atomically on final submit in Step 4.
      if (connectedAccount?.id && editableSubmission) {
        try {
          await saveDraftMutation.mutateAsync({
            submissionId: editableSubmission.id,
            liveVideoUrl: activeVideo.url,
            thumbnailUrl: activeVideo.thumbnailUrl || undefined,
            videoCaption: activeVideo.caption || undefined,
            socialAccountId: connectedAccount.id,
          });
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Gagal menyimpan draf pengajuan.';
          toast.error(errorMsg);
          await queryClient.invalidateQueries({ queryKey: ['my-campaign-submission', campaign.id] });
          return;
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
          ...(editableSubmission ? { submissionId: editableSubmission.id } : {}),
          liveVideoUrl: activeVideo.url,
          thumbnailUrl: activeVideo.thumbnailUrl || undefined,
          videoCaption: activeVideo.caption || undefined,
          socialAccountId: connectedAccount.id,
        });

        toast.success('Pengajuan video berhasil dikirimkan! Menunggu persetujuan brand.');
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['my-campaign-submission', campaign.id] }),
          queryClient.invalidateQueries({ queryKey: ['campaign', campaign.id] }),
          queryClient.invalidateQueries({ queryKey: ['campaign-submissions', campaign.id] }),
          queryClient.invalidateQueries({ queryKey: ['creator-campaigns'] }),
          queryClient.invalidateQueries({ queryKey: ['my-submissions'] }),
          queryClient.invalidateQueries({ queryKey: ['creator', 'dashboard'] }),
        ]);
        ResetWizardState();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Gagal mengirim pengajuan video.';
        toast.error(errorMsg);
        await queryClient.invalidateQueries({ queryKey: ['my-campaign-submission', campaign.id] });
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
                <CloseIcon className="size-4" />
                <span className="sr-only">Tutup</span>
              </Button>
            </div>

            {/* Revision Feedback Alert Banner when fixing a revision-requested submission */}
            {editableSubmission?.submissionStatus === 'REVISION_REQUESTED' && editableSubmission.reviewNote && (
              <div className="mx-6 mt-4 -mb-1 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1 shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <DangerCircleIcon className="size-3.5" />
                  <span>Catatan Revisi dari Brand:</span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  {editableSubmission.reviewNote}
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
                  allowedPlatforms={allowedPlatforms}
                  selectedPlatform={selectedPlatform}
                  onSelectPlatform={HandleSelectPlatform}
                  connectedAccounts={connectedAccounts}
                  platformQuotas={platformQuotas}
                  onAccountVerified={(acc) => {
                    setUserSelectedPlatform(acc.platform);
                    setSelectedVideo(null);
                    queryClient.invalidateQueries({ queryKey: ['connected-social-account'] });
                    queryClient.invalidateQueries({ queryKey: ['connected-social-accounts'] });
                    queryClient.invalidateQueries({ queryKey: ['recent-tiktok-videos'] });
                    queryClient.invalidateQueries({ queryKey: ['my-campaign-submission', campaign.id] });
                    setMaxStepReached((prev) => Math.max(prev, 3));
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
        onConfirm={ResetWizardState}
        onCancel={HandleCancelExit}
      />
    </>
  );
}
