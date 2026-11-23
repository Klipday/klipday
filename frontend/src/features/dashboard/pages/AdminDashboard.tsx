import {
  AdminActionQueueWidget,
  AdminDashboardErrorState,
  AdminDashboardHeader,
  AdminDashboardSkeleton,
  AdminPlatformMetricsGrid,
  AdminQueueSummaryWidget,
  AdminRecentLedgerWidget,
} from '../components';
import { UseAdminDashboardQuery } from '../hooks';

/**
 * Operational admin dashboard main page orchestrator.
 * Composes a calm 3-tier Bento layout aligned 1:1 with BrandDashboard and CreatorDashboard:
 * 1. Operational header with greeting and single queue-status pill.
 * 2. Unified 4-cell hairline-divided platform KPI strip.
 * 3. 12-column Bento row (unified tabbed action queue + compact queue summary) and full-width live ledger.
 *
 * @returns The rendered operational admin dashboard page.
 */
function AdminDashboard() {
  const { data, isLoading, isError, refetch } = UseAdminDashboardQuery();

  const HandleRetry = () => {
    void refetch();
  };

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  if (isError || !data) {
    return <AdminDashboardErrorState onRetry={HandleRetry} />;
  }

  return (
    <div className="space-y-6">
      {/* 1. Header with greeting, subtitle, and subtle queue status pill */}
      <AdminDashboardHeader
        adminName={data.admin.name}
        totalActionableCount={data.queues.totalActionableCount}
      />

      {/* 2. Unified 4-cell hairline-divided KPI hero strip */}
      <AdminPlatformMetricsGrid metrics={data.metrics} />

      {/* 3. Bento Row 1: Unified Action Queue (7/8 cols) & Queue Summary Links (5/4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <AdminActionQueueWidget
          campaigns={data.actionItems.actionableCampaigns}
          withdrawals={data.actionItems.pendingWithdrawals}
          topUps={data.actionItems.submittedTopUps}
          kycRequests={data.actionItems.pendingKycRequests}
          className="lg:col-span-7 xl:col-span-8"
        />
        <AdminQueueSummaryWidget
          queues={data.queues}
          className="lg:col-span-5 xl:col-span-4"
        />
      </div>

      {/* 4. Bento Row 2: Live Platform Ledger (full width) */}
      <AdminRecentLedgerWidget transactions={data.actionItems.recentTransactions} />
    </div>
  );
}

export default AdminDashboard;
