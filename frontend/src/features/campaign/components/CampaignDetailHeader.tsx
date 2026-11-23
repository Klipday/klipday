import {
  ArrowLeftIcon,
  CheckIcon,
  LoaderIcon,
  VideocameraIcon,
} from '@solar-icons/react/linear';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UseJoinCampaignMutation, UseMyCampaignSubmissionQuery } from '@/features/submission/hooks';
import type { CampaignDetailHeaderProps } from '../types';
import {
  CalculateDaysRemaining,
  FormatCpmDisplay,
  FormatJoinedCount,
  GetCampaignCategoryBadgeLabel,
  GetCampaignStatusBadge,
  GetCampaignTypeBadgeLabel,
} from '../utils';
import { CampaignDetailHeroMedia } from './CampaignDetailHeroMedia';

/**
 * Clean flat header for the campaign detail page.
 * Displays back navigation, optional role-guarded lifecycle status label,
 * brand and type eyebrow, campaign title, tabular CPM rate, cleanly spaced metadata,
 * creator action controls, and an unobstructed campaign thumbnail.
 *
 * NOTE: Campaign lifecycle status is strictly visible only for BRAND and ADMIN roles.
 *
 * @param props - Component properties containing campaign data and authenticated user role.
 * @returns The rendered campaign detail header element.
 */
export function CampaignDetailHeader({
  campaign,
  userRole,
  onOpenSubmitDialog,
  className,
}: CampaignDetailHeaderProps) {
  const navigate = useNavigate();

  const brandName = campaign.brand?.companyName || 'Brand';
  const brandInitial = brandName.charAt(0).toUpperCase();
  const title = campaign.title?.trim() || 'Kampanye Tanpa Judul';
  const cpmDisplay = FormatCpmDisplay(campaign.cpm);
  const typeBadge = GetCampaignTypeBadgeLabel(campaign.campaignType);
  const categoryBadge = GetCampaignCategoryBadgeLabel(campaign.campaignCategory);
  const joinedCountDisplay = FormatJoinedCount(campaign._count?.submissions ?? 0);
  const daysRemaining = CalculateDaysRemaining(campaign.endDate);

  const shouldShowStatusBadge = userRole === 'BRAND' || userRole === 'ADMIN';
  const statusBadgeConfig = GetCampaignStatusBadge(campaign.campaignStatus);

  const HandleBackClick = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else if (userRole === 'CREATOR') {
      navigate('/creator-dashboard/creator-campaigns');
    } else if (userRole === 'ADMIN') {
      navigate('/admin-dashboard/campaigns');
    } else {
      navigate('/brand-dashboard/brand-campaigns');
    }
  };

  const { data: mySubmissionData, isLoading: isSubmissionLoading } = UseMyCampaignSubmissionQuery(
    userRole === 'CREATOR' ? campaign.id : undefined,
  );
  const joinMutation = UseJoinCampaignMutation();

  const isJoined = Boolean(mySubmissionData?.submission);
  const submissionStatus = mySubmissionData?.submission?.submissionStatus;

  const HandleJoinClick = async () => {
    try {
      await joinMutation.mutateAsync(campaign.id);
      toast.success('Berhasil bergabung dengan kampanye! Silakan kirim video Anda.');
      onOpenSubmitDialog?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal bergabung dengan kampanye.';
      toast.error(msg);
    }
  };

  return (
    <header className={cn('space-y-5 pb-6 border-b border-border/50', className)}>
      {/* Top navigation row */}
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={HandleBackClick}
          className="h-8 -ml-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5"
        >
          <ArrowLeftIcon className="size-3.5" />
          <span>Kembali</span>
        </Button>

        {shouldShowStatusBadge && (
          <span className="text-xs font-medium text-muted-foreground shrink-0">
            {statusBadgeConfig.label}
          </span>
        )}
      </div>

      {/* Hero grid: Left content + Right clean thumbnail */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center">
        <div className="md:col-span-7 lg:col-span-8 space-y-3 min-w-0">
          {/* Brand + Campaign Type eyebrow */}
          <div className="flex items-center gap-2.5 text-xs font-medium text-muted-foreground min-w-0">
            <div className="size-5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium flex items-center justify-center uppercase shrink-0">
              {brandInitial}
            </div>
            <span className="truncate">{brandName}</span>
            <span className="text-muted-foreground/70 shrink-0">{typeBadge}</span>
          </div>

          {/* Campaign Title */}
          <h1 className="text-xl sm:text-2xl lg:text-[28px] font-semibold tracking-tight text-foreground leading-snug">
            {title}
          </h1>

          {/* Rate / CPM Callout */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground tabular-nums">
              {cpmDisplay}
            </span>
            <span className="text-xs text-muted-foreground">/ 1K views</span>
          </div>

          {/* Cleanly spaced metadata line without bullet points */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-0.5 tabular-nums">
            <span className="inline-flex items-center gap-1.5 text-foreground/90">
              <img
                src="/assets/icons/tiktok.svg"
                alt="TikTok"
                className="size-3.5 opacity-75 dark:invert"
              />
              <span>TikTok</span>
            </span>
            <span>{categoryBadge}</span>
            <span>{daysRemaining.label}</span>
            <span>{joinedCountDisplay} kreator bergabung</span>
          </div>

          {/* Action buttons row for creators */}
          {userRole === 'CREATOR' && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {isSubmissionLoading ? (
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-36 rounded-lg" />
                  <Skeleton className="h-9 w-28 rounded-lg" />
                </div>
              ) : !isJoined ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    disabled={joinMutation.isPending}
                    onClick={HandleJoinClick}
                    className="h-9 px-4 bg-primary text-primary-foreground font-medium hover:bg-primary/90 rounded-lg text-xs cursor-pointer gap-2"
                  >
                    {joinMutation.isPending && <LoaderIcon className="size-3.5 animate-spin" />}
                    <span>Gabung Kampanye</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled
                    title="Silakan gabung kampanye terlebih dahulu untuk mulai mengirim video."
                    className="h-9 px-4 rounded-lg gap-2 text-xs border-border/60 opacity-50 cursor-not-allowed"
                  >
                    <VideocameraIcon className="size-3.5" />
                    <span>Kirim Video</span>
                  </Button>
                </>
              ) : submissionStatus === 'JOINED' ? (
                <>
                  <div className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-muted/50 border border-border/60 text-foreground text-xs font-medium select-none">
                    <CheckIcon className="size-3.5 text-emerald-500" />
                    <span>Tergabung</span>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={onOpenSubmitDialog}
                    className="h-9 px-4 bg-primary text-primary-foreground font-medium hover:bg-primary/90 rounded-lg text-xs cursor-pointer gap-2"
                  >
                    <VideocameraIcon className="size-3.5" />
                    <span>Kirim Video</span>
                  </Button>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-1.5 text-foreground text-xs font-medium select-none">
                    <CheckIcon className="size-3.5 text-emerald-500" />
                    <span>
                      {submissionStatus === 'PENDING_REVIEW'
                        ? 'Video Sedang Ditinjau'
                        : submissionStatus === 'APPROVED'
                          ? 'Video Disetujui'
                          : submissionStatus === 'REVISION_REQUESTED'
                            ? 'Perlu Revisi Video'
                            : 'Video Terkirim'}
                    </span>
                  </div>

                  {submissionStatus === 'REVISION_REQUESTED' && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={onOpenSubmitDialog}
                      className="h-9 px-4 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-xs cursor-pointer gap-2"
                    >
                      <VideocameraIcon className="size-3.5" />
                      <span>Perbaiki Video</span>
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right column: Clean thumbnail */}
        <div className="md:col-span-5 lg:col-span-4 flex justify-start md:justify-end items-center">
          <CampaignDetailHeroMedia
            thumbnailUrl={campaign.thumbnailUrl}
            title={campaign.title}
          />
        </div>
      </div>
    </header>
  );
}
