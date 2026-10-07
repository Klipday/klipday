import { useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router';
import { cn } from '@/lib/utils';
import { UseCurrentAccountQuery } from '@/features/authentication/hooks';
import { CampaignSubmissionsTab, SubmissionDialog } from '@/features/submission/components';
import { UseMyCampaignSubmissionQuery } from '@/features/submission/hooks';
import {
  AdminPaymentReviewCard,
  CampaignDetailAbout,
  CampaignDetailBriefSections,
  CampaignDetailErrorState,
  CampaignDetailHeader,
  CampaignDetailRewardSidebar,
  CampaignDetailSkeleton,
  CampaignDetailTabs,
} from '../components';
import { UseCampaignQuery } from '../hooks';
import type { CampaignDetailPageProps } from '../types';
import { ResolveCampaignWizardStepPath } from '../utils';

/**
 * Campaign Detail Page Orchestrator.
 * Loads campaign details, verifies lifecycle status, redirects drafts/revisions back
 * to the step creation wizard for owning brands, and orchestrates the responsive 2-column detail layout.
 *
 * Adheres strictly to the single responsibility principle: composes components,
 * wires route parameters, and delegates UI implementation to dedicated subcomponents.
 *
 * @param props - Page properties containing optional class overrides.
 * @returns The rendered Campaign Detail view or redirect navigation.
 */
function CampaignDetailPage({ className }: CampaignDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'detail';

  const HandleTabChange = (newTab: string) => {
    const updatedParams = new URLSearchParams(searchParams);
    if (newTab === 'detail') {
      updatedParams.delete('tab');
    } else {
      updatedParams.set('tab', newTab);
    }
    setSearchParams(updatedParams, { replace: true });
  };

  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const { data: userProfile, isLoading: isProfileLoading } = UseCurrentAccountQuery();
  const { data: campaign, isLoading: isCampaignLoading, isError, error, refetch } = UseCampaignQuery(id);

  const isCreator = userProfile?.role === 'CREATOR';
  const { isLoading: isSubmissionLoading } = UseMyCampaignSubmissionQuery(isCreator && id ? id : undefined);

  const isPageLoading = isCampaignLoading || isProfileLoading || (isCreator && isSubmissionLoading);

  if (isPageLoading) {
    return <CampaignDetailSkeleton className={className} />;
  }

  if (isError || !campaign) {
    return (
      <CampaignDetailErrorState
        error={error}
        message={!campaign && !isPageLoading ? 'Kampanye tidak ditemukan.' : undefined}
        onRetry={() => void refetch()}
        className={className}
      />
    );
  }

  // Redirection guard: draft, revision, and awaiting payment campaigns must continue their creation wizard flow for owning brands
  if (
    userProfile?.role === 'BRAND' &&
    (campaign.campaignStatus === 'DRAFT' ||
      campaign.campaignStatus === 'REVISION' ||
      campaign.campaignStatus === 'AWAITING_PAYMENT')
  ) {
    const wizardStepPath = ResolveCampaignWizardStepPath(campaign);
    return <Navigate to={wizardStepPath} replace />;
  }

  // Guard for creator: non-active and non-finished campaigns cannot be accessed
  if (userProfile?.role === 'CREATOR' && campaign.campaignStatus !== 'ACTIVE' && campaign.campaignStatus !== 'FINISHED') {
    return <Navigate to="/dashboard/campaigns" replace />;
  }

  return (
    <div className={cn('w-full pb-12', className)}>
      {/* Hero Banner Header - Full Width with Backdrop and Gradient Fade */}
      <CampaignDetailHeader campaign={campaign} userRole={userProfile?.role} onOpenSubmitDialog={() => setIsSubmitDialogOpen(true)} />

      {/* Main Campaign Content Container spanning full available space */}
      <div className="w-full space-y-6 pt-2 sm:pt-4">
        {/* Admin Payment Verification Review Card */}
        {userProfile?.role === 'ADMIN' && campaign.payments?.[0]?.paymentStatus === 'SUBMITTED' && (
          <AdminPaymentReviewCard campaign={campaign} onVerificationSuccess={() => void refetch()} />
        )}

        {/* Dynamic Role-Aware Tabs */}
        <CampaignDetailTabs activeTab={activeTab} onTabChange={HandleTabChange} userRole={userProfile?.role} />

        {/* Active Tab View */}
        {activeTab === 'detail' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-1">
            {/* Main Left Column (8 cols): About, Collapsible Brief & Materials Sections */}
            <div className="lg:col-span-8 space-y-6 min-w-0">
              <CampaignDetailAbout description={campaign.description} />
              <CampaignDetailBriefSections brief={campaign.brief} materials={campaign.materials} />
            </div>

            {/* Sticky Right Sidebar (4 cols): Budget burn, 2x2 rate grid, schedule */}
            <div className="lg:col-span-4 min-w-0">
              <CampaignDetailRewardSidebar campaign={campaign} />
            </div>
          </div>
        ) : (
          <CampaignSubmissionsTab
            userRole={userProfile?.role}
            activeTab={activeTab}
            campaignId={campaign.id}
            onOpenSubmitDialog={() => setIsSubmitDialogOpen(true)}
          />
        )}
      </div>

      {/* Modern 2-Column Submission Modal Dialog */}
      {isCreator && <SubmissionDialog campaign={campaign} open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen} />}
    </div>
  );
}

export default CampaignDetailPage;
