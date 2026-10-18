import {
  CreatorDashboardErrorState,
  CreatorDashboardHeader,
  CreatorDashboardLaunchpad,
  CreatorDashboardMetricsGrid,
  CreatorDashboardSkeleton,
  CreatorJoinedCampaignsWidget,
  CreatorRecentSubmissionsWidget,
  CreatorTopClipsWidget,
} from '../components';
import { UseCreatorDashboardQuery } from '../hooks';

/**
 * Creator monitoring dashboard main page orchestrator.
 * Composes the Bento monitoring layout, coordinates real-time KPI metrics,
 * handles Day 0 Launchpad vs Day 100 Cockpit state transitions,
 * and surfaces submitted campaigns alongside active joined campaigns awaiting video submission.
 *
 * @returns The rendered creator dashboard page.
 */
function CreatorDashboard() {
  const { data, isLoading, isError, refetch } = UseCreatorDashboardQuery();

  const HandleRetry = () => {
    void refetch();
  };

  if (isLoading) {
    return <CreatorDashboardSkeleton />;
  }

  if (isError || !data) {
    return <CreatorDashboardErrorState onRetry={HandleRetry} />;
  }

  const isTikTokConnected = Boolean(data.creator?.tiktokAccount?.isVerified);

  return (
    <div className="space-y-6">
      {/* Header with greeting, subtitle, and connected TikTok pill */}
      <CreatorDashboardHeader
        creatorName={data.creator?.fullName}
        tiktokAccount={data.creator?.tiktokAccount}
      />

      {/* 4-card Bento KPI Hero Strip */}
      <CreatorDashboardMetricsGrid metrics={data.metrics} />

      {/* Conditional: Day 0 Onboarding Launchpad vs Day 100 Bento Cockpit */}
      {!data.hasAnySubmissions ? (
        <CreatorDashboardLaunchpad isTikTokConnected={isTikTokConnected} />
      ) : (
        <div className="space-y-6">
          {/* Row 1: Submisi Kampanye Saya (7/8 cols) & Kampanye Aktif Diikuti (5/4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <CreatorRecentSubmissionsWidget
              submissions={data.recentSubmissions}
              className="lg:col-span-7 xl:col-span-8"
            />
            <CreatorJoinedCampaignsWidget
              campaigns={data.joinedCampaigns}
              className="lg:col-span-5 xl:col-span-4"
            />
          </div>

          {/* Row 2: Video Klip Terbaik Kamu (full width) */}
          <CreatorTopClipsWidget topClips={data.topClips} />
        </div>
      )}
    </div>
  );
}

export default CreatorDashboard;
