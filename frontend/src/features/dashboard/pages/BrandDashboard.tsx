import { useState } from 'react';
import { SubmissionReviewDialog } from '@/features/submission/components/SubmissionReviewDialog';
import { BrandTopUpDialog } from '@/features/wallet/components/BrandTopUpDialog';
import {
  BrandActiveCampaignsWidget,
  BrandDashboardErrorState,
  BrandDashboardHeader,
  BrandDashboardLaunchpad,
  BrandDashboardMetricsGrid,
  BrandDashboardSkeleton,
  BrandPendingReviewsQueue,
  BrandTopClipsWidget,
} from '../components';
import { UseBrandDashboardQuery } from '../hooks';
import type { BrandDashboardPendingSubmission } from '../types';

/**
 * Brand monitoring dashboard main page orchestrator.
 * Composes the Bento monitoring layout, coordinates real-time KPI metrics,
 * handles Day 0 Launchpad vs Day 100 Cockpit state transitions,
 * and mounts in-place modal dialogs for clip reviews and wallet top-ups.
 *
 * @returns The rendered brand dashboard page.
 */
function BrandDashboard() {
  const { data, isLoading, isError, refetch } = UseBrandDashboardQuery();
  const [isTopUpOpen, setIsTopUpOpen] = useState<boolean>(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<BrandDashboardPendingSubmission | null>(null);

  const HandleOpenTopUp = () => {
    setIsTopUpOpen(true);
  };

  const HandleReviewDialogChange = (open: boolean) => {
    if (!open) {
      setSelectedSubmission(null);
      void refetch();
    }
  };

  const HandleTopUpSuccess = () => {
    void refetch();
  };

  if (isLoading) {
    return <BrandDashboardSkeleton />;
  }

  if (isError || !data) {
    return <BrandDashboardErrorState onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-6">
      {/* Header with greeting and subtitle (no noisy buttons) */}
      <BrandDashboardHeader
        brandName={data.brand?.companyName}
      />

      {/* 4-card Bento KPI Hero Strip */}
      <BrandDashboardMetricsGrid
        metrics={data.metrics}
      />

      {/* Conditional: Day 0 Onboarding Launchpad vs Day 100 Cockpit */}
      {!data.hasAnyCampaigns ? (
        <BrandDashboardLaunchpad onTopUpClick={HandleOpenTopUp} />
      ) : (
        <div className="space-y-6">
          {/* Row 1: Performa Kampanye Aktif (7/8 cols) & Queue Review Video (5/4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <BrandActiveCampaignsWidget
              campaigns={data.activeCampaigns}
              className="lg:col-span-7 xl:col-span-8"
            />
            <BrandPendingReviewsQueue
              submissions={data.pendingSubmissions}
              onReviewSubmission={setSelectedSubmission}
              className="lg:col-span-5 xl:col-span-4"
            />
          </div>

          {/* Row 2: Klip Paling Viral from Active Campaigns (full width) */}
          <BrandTopClipsWidget
            topClips={data.topClips}
          />
        </div>
      )}

      {/* In-place Submission Review Dialog */}
      {selectedSubmission && (
        <SubmissionReviewDialog
          open={Boolean(selectedSubmission)}
          onOpenChange={HandleReviewDialogChange}
          submission={selectedSubmission}
        />
      )}

      {/* In-place Top-Up Dialog */}
      <BrandTopUpDialog
        open={isTopUpOpen}
        onOpenChange={setIsTopUpOpen}
        onTopUpSuccess={HandleTopUpSuccess}
      />
    </div>
  );
}

export default BrandDashboard;
