import { ArrowLeft, Check, Loader2, Users, Video } from 'lucide-react';
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
 * Top hero banner for the campaign detail page.
 * Displays breadcrumb back navigation, brand profile, campaign title, prominent CPM rate,
 * metadata pills, dynamic call-to-action buttons based on user role, and media thumbnail.
 *
 * NOTE: The campaign lifecycle status badge is strictly visible only for BRAND and ADMIN roles.
 * CREATOR (clipper) users see only the public campaign details without internal status badges.
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
    <header
      className={cn(
        'relative overflow-hidden -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] lg:w-[calc(100%+4rem)] px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8 pb-8 sm:pb-10 lg:pb-12',
        className
      )}>
      {/* Cinematic Full-Bleed Backdrop Banner with Bottom Gradient Fade */}
      {campaign.thumbnailUrl ? (
        <div className="pointer-events-none absolute inset-0 select-none overflow-hidden" aria-hidden="true">
          <img
            src={campaign.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover object-center scale-105 filter grayscale contrast-105 brightness-60 opacity-40"
          />
          {/* Subtle directional gradient from left for typography readability without obscuring the artwork */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent w-full sm:w-4/5 md:w-3/5" />
          {/* Smooth bottom gradient overlay fading directly into the platform background */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background via-background/70 to-transparent" />
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-0 select-none overflow-hidden" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-card/50 to-background" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background via-background/70 to-transparent" />
        </div>
      )}

      {/* Foreground Header Content */}
      <div className="relative z-10 w-full space-y-5 sm:space-y-6">
        {/* Top navigation row: Back button */}
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={HandleBackClick}
            className="h-8 -ml-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-background/50 backdrop-blur-md border border-border/40 hover:bg-background/80 rounded-lg px-2.5">
            <ArrowLeft className="size-3.5" />
            <span>Kembali</span>
          </Button>
        </div>

        {/* Hero grid: Left content + Right media preview */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* Left column: Primary information */}
          <div className="md:col-span-7 lg:col-span-8 space-y-4">
            {/* Brand row + Type + Optional Role Status */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Brand identity pill */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/70 backdrop-blur-md border border-border/50 text-foreground">
                <div className="size-4.5 rounded-full bg-primary/20 text-[10px] font-bold text-primary flex items-center justify-center uppercase">
                  {brandInitial}
                </div>
                <span className="text-xs font-semibold">{brandName}</span>
              </div>

              {/* Campaign type pill */}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-background/70 backdrop-blur-md text-muted-foreground border border-border/50 uppercase tracking-wider">
                {typeBadge}
              </span>

              {/* Status badge: STRICTLY shown for BRAND and ADMIN only */}
              {shouldShowStatusBadge && (
                <span
                  className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border backdrop-blur-md',
                    statusBadgeConfig.className
                  )}>
                  {statusBadgeConfig.label}
                </span>
              )}
            </div>

            {/* Campaign Title */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold tracking-tight text-foreground leading-snug drop-shadow-xs">
              {title}
            </h1>

            {/* Rate / CPM Callout */}
            <div className="flex items-baseline gap-1.5 pt-0.5">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
                {cpmDisplay}
              </span>
              <span className="text-xs sm:text-sm font-normal text-muted-foreground">
                / 1K views
              </span>
            </div>

            {/* Meta Badges Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              {/* Platform chip */}
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background/60 backdrop-blur-md border border-border/50 text-foreground font-medium"
                title={campaign.platform || 'TikTok'}>
                <img src="/assets/icons/tiktok.svg" alt="TikTok" className="size-3.5 opacity-80 dark:invert" />
                <span>TikTok</span>
              </div>

              {/* Category chip */}
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-background/60 backdrop-blur-md border border-border/50 text-muted-foreground font-medium text-[11px] uppercase tracking-wider">
                {categoryBadge}
              </span>

              {/* Active duration / Days remaining chip */}
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-background/60 backdrop-blur-md border border-border/50 text-muted-foreground font-medium text-[11px]">
                {daysRemaining.label}
              </span>

              {/* Joined Creators chip */}
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background/60 backdrop-blur-md border border-border/50 text-muted-foreground font-medium text-[11px]"
                title={`${joinedCountDisplay} kreator telah bergabung`}>
                <Users className="size-3.5 text-muted-foreground" />
                <span>{joinedCountDisplay} Kreator Bergabung</span>
              </div>
            </div>

            {/* Action buttons row for creators */}
            {userRole === 'CREATOR' && (
              <div className="flex flex-wrap items-center gap-3 pt-3">
                {isSubmissionLoading ? (
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-36 rounded-xl" />
                    <Skeleton className="h-10 w-28 rounded-xl" />
                  </div>
                ) : !isJoined ? (
                  <>
                    <Button
                      type="button"
                      size="default"
                      disabled={joinMutation.isPending}
                      onClick={HandleJoinClick}
                      className="bg-primary text-primary-foreground font-semibold px-5 shadow-xs hover:bg-primary/90 rounded-xl h-10 text-xs sm:text-sm cursor-pointer gap-2">
                      {joinMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                      <span>Gabung Kampanye</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      disabled
                      title="Silakan gabung kampanye terlebih dahulu untuk mulai mengirim video."
                      className="h-10 px-4 rounded-xl gap-2 text-xs sm:text-sm border-border/60 bg-background/40 backdrop-blur-xs opacity-50 cursor-not-allowed">
                      <Video className="size-4" />
                      <span>Kirim Video</span>
                    </Button>
                  </>
                ) : submissionStatus === 'JOINED' ? (
                  <>
                    <div className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-muted/70 border border-border/60 text-foreground text-xs sm:text-sm font-semibold select-none">
                      <Check className="size-4 text-emerald-500" />
                      <span>Tergabung</span>
                    </div>

                    <Button
                      type="button"
                      size="default"
                      onClick={onOpenSubmitDialog}
                      className="bg-primary text-primary-foreground font-semibold px-5 shadow-xs hover:bg-primary/90 rounded-xl h-10 text-xs sm:text-sm cursor-pointer gap-2">
                      <Video className="size-4" />
                      <span>Kirim Video</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-semibold select-none">
                      <Check className="size-4" />
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
                        size="default"
                        onClick={onOpenSubmitDialog}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 rounded-xl h-10 text-xs sm:text-sm cursor-pointer gap-2">
                        <Video className="size-4" />
                        <span>Perbaiki Video</span>
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right column: Atmospheric media preview card */}
          <div className="md:col-span-5 lg:col-span-4 flex justify-start md:justify-end items-center">
            <CampaignDetailHeroMedia
              thumbnailUrl={campaign.thumbnailUrl}
              title={campaign.title}
              typeBadge={typeBadge}
              brandName={brandName}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
