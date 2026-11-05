import {
  AdminActionableCampaignsWidget,
  AdminActionQueuesGrid,
  AdminDashboardErrorState,
  AdminDashboardHeader,
  AdminDashboardSkeleton,
  AdminPendingFinanceWidget,
  AdminPendingKycWidget,
  AdminPlatformMetricsGrid,
  AdminRecentLedgerWidget,
} from '../components';
import { UseAdminDashboardQuery } from '../hooks';

/**
 * Operational admin dashboard main page orchestrator.
 * Composes the administrative command center at /admin-dashboard:
 * 1. Operational header with status pill and smooth reload button.
 * 2. 5 actionable review queue cards linking directly into filtered workflows.
 * 3. 4 platform-wide financial & ecosystem KPI cards.
 * 4. 2-row 12-column Bento workspace for finance triage, KYC verification, actionable campaigns, and live ledger.
 *
 * @returns The rendered operational admin dashboard page.
 */
function AdminDashboard() {
  const { data, isLoading, isError, isFetching, refetch } = UseAdminDashboardQuery();

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  if (isError || !data) {
    return <AdminDashboardErrorState onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-6">
      {/* 1. Header with greeting, dynamic pending tasks status pill, and reload button */}
      <AdminDashboardHeader
        adminName={data.admin.name}
        totalActionableCount={data.queues.totalActionableCount}
        onRefresh={() => void refetch()}
        isRefreshing={isFetching}
      />

      {/* 2. 5 Actionable Review Queues Grid */}
      <AdminActionQueuesGrid queues={data.queues} />

      {/* 3. 4 Financial & Ecosystem Platform Metrics Grid */}
      <AdminPlatformMetricsGrid metrics={data.metrics} />

      {/* 4. Bento Row 1: Finance Triage (7 cols) & KYC Queue (5 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
        <AdminPendingFinanceWidget
          withdrawals={data.actionItems.pendingWithdrawals}
          topUps={data.actionItems.submittedTopUps}
          className="lg:col-span-7"
        />
        <AdminPendingKycWidget
          kycRequests={data.actionItems.pendingKycRequests}
          className="lg:col-span-5"
        />
      </div>

      {/* 5. Bento Row 2: Actionable Campaigns (7 cols) & Recent Transactions Ledger (5 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
        <AdminActionableCampaignsWidget
          campaigns={data.actionItems.actionableCampaigns}
          className="lg:col-span-7"
        />
        <AdminRecentLedgerWidget
          transactions={data.actionItems.recentTransactions}
          className="lg:col-span-5"
        />
      </div>
    </div>
  );
}

export default AdminDashboard;
