import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRightUpIcon } from '@solar-icons/react/linear';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FormatRupiah } from '@/features/wallet/utils/wallet-format';
import { SanitizeHttpUrl, cn } from '@/lib/utils';
import { ADMIN_DASHBOARD_MESSAGES } from '../constants';
import type {
  AdminActionFinanceItem,
  AdminActionQueueTab,
  AdminActionQueueWidgetProps,
  AdminDashboardCampaignActionItem,
  AdminDashboardKycActionItem,
  AdminDashboardTopUpActionItem,
  AdminDashboardWithdrawalActionItem,
} from '../types';
import {
  FormatTimeAgo,
  FormatWaitDuration,
  GetInitials,
} from '../utils/dashboard-format';

/**
 * Selects the initial active queue tab by prioritizing the first category
 * with pending items so administrators land directly on actionable work.
 *
 * @param campaignsCount - Number of campaigns awaiting moderation or settlement.
 * @param financeCount - Combined number of pending withdrawals and top-ups.
 * @param kycCount - Number of pending KYC verification requests.
 * @returns Initial queue tab identifier.
 */
function GetDefaultQueueTab(
  campaignsCount: number,
  financeCount: number,
  kycCount: number,
): AdminActionQueueTab {
  if (campaignsCount > 0) {
    return 'CAMPAIGNS';
  }
  if (financeCount > 0) {
    return 'FINANCE';
  }
  if (kycCount > 0) {
    return 'KYC';
  }
  return 'CAMPAIGNS';
}

/**
 * Merges pending withdrawal and top-up items into one chronologically sorted list
 * (oldest request first) for unified finance triage.
 *
 * @param withdrawals - Pending withdrawal requests.
 * @param topUps - Submitted manual top-up verification requests.
 * @returns Sorted list of unified finance queue items.
 */
function BuildSortedFinanceItems(
  withdrawals: AdminDashboardWithdrawalActionItem[],
  topUps: AdminDashboardTopUpActionItem[],
): AdminActionFinanceItem[] {
  const withdrawalItems: AdminActionFinanceItem[] = withdrawals.map((item) => ({
    kind: 'WITHDRAW',
    createdAtMs: new Date(item.createdAt).getTime(),
    item,
  }));

  const topUpItems: AdminActionFinanceItem[] = topUps.map((item) => ({
    kind: 'TOPUP',
    createdAtMs: new Date(item.createdAt).getTime(),
    item,
  }));

  const combined = [...withdrawalItems, ...topUpItems].sort(
    (first, second) => first.createdAtMs - second.createdAtMs,
  );

  return combined;
}

/**
 * Resolves clean empty-state copy for the currently selected queue tab.
 *
 * @param activeTab - Currently selected queue tab.
 * @returns Empty state title and description strings.
 */
function GetTabEmptyStateCopy(activeTab: AdminActionQueueTab): {
  title: string;
  description: string;
} {
  if (activeTab === 'FINANCE') {
    return {
      title: ADMIN_DASHBOARD_MESSAGES.FINANCE_EMPTY_TITLE,
      description: ADMIN_DASHBOARD_MESSAGES.FINANCE_EMPTY_DESC,
    };
  }
  if (activeTab === 'KYC') {
    return {
      title: ADMIN_DASHBOARD_MESSAGES.KYC_EMPTY_TITLE,
      description: ADMIN_DASHBOARD_MESSAGES.KYC_EMPTY_DESC,
    };
  }
  return {
    title: ADMIN_DASHBOARD_MESSAGES.CAMPAIGNS_EMPTY_TITLE,
    description: ADMIN_DASHBOARD_MESSAGES.CAMPAIGNS_EMPTY_DESC,
  };
}

/**
 * Renders flat hairline-divided rows for campaigns awaiting moderation or settlement.
 *
 * @param campaigns - Actionable campaign items.
 * @returns Rendered campaign queue rows.
 */
function RenderCampaignRows(campaigns: AdminDashboardCampaignActionItem[]) {
  return (
    <div className="divide-y divide-border/40">
      {campaigns.map((campaign) => {
        const initials = GetInitials(campaign.brandName);
        const cleanLogoUrl = SanitizeHttpUrl(campaign.brandLogoUrl);
        const isSettlement = campaign.actionType === 'SETTLEMENT';
        const ctaHref = isSettlement
          ? `/campaigns/${campaign.id}?tab=admin-submissions`
          : `/campaigns/${campaign.id}`;
        const ctaLabel = isSettlement
          ? ADMIN_DASHBOARD_MESSAGES.ACTION_SETTLE
          : ADMIN_DASHBOARD_MESSAGES.ACTION_MODERATE;
        const formattedBudget = FormatRupiah(campaign.budget);

        return (
          <div
            key={campaign.id}
            className="px-5 py-4 hover:bg-muted/25 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Avatar className="size-9 rounded-full border border-border/60 bg-muted shrink-0">
                {cleanLogoUrl ? (
                  <AvatarImage
                    src={cleanLogoUrl}
                    alt={campaign.brandName}
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p
                  className="text-sm font-medium text-foreground truncate"
                  title={campaign.title}
                >
                  {campaign.title}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5 tabular-nums">
                  <span className="truncate">{campaign.brandName}</span>
                  <span>Anggaran {formattedBudget}</span>
                </div>
              </div>
            </div>

            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-8 w-full sm:w-auto gap-1.5 text-xs font-medium border-border/70 text-foreground hover:bg-muted/50 shrink-0"
            >
              <Link to={ctaHref}>
                <span>{ctaLabel}</span>
                <ArrowRightUpIcon className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Renders flat hairline-divided rows for pending withdrawals and manual top-up verifications.
 *
 * @param financeItems - Chronologically sorted finance action items.
 * @returns Rendered finance queue rows.
 */
function RenderFinanceRows(financeItems: AdminActionFinanceItem[]) {
  return (
    <div className="divide-y divide-border/40">
      {financeItems.map((entry) => {
        if (entry.kind === 'WITHDRAW') {
          const item = entry.item;
          const initials = GetInitials(item.userName);
          const cleanAvatarUrl = SanitizeHttpUrl(item.userAvatarUrl);
          const roleLabel = item.userRole === 'BRAND' ? 'Brand' : 'Kreator';
          const waitTime = FormatWaitDuration(item.createdAt);
          const formattedAmount = FormatRupiah(item.amount);
          const isCancelRequested = Boolean(item.cancellationRequestedAt);

          return (
            <div
              key={`withdraw-${item.id}`}
              className="px-5 py-4 hover:bg-muted/25 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Avatar className="size-9 rounded-full border border-border/60 bg-muted shrink-0">
                  {cleanAvatarUrl ? (
                    <AvatarImage
                      src={cleanAvatarUrl}
                      alt={item.userName}
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.userName}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5 tabular-nums">
                    <span>{ADMIN_DASHBOARD_MESSAGES.TAG_WITHDRAW}</span>
                    <span>{roleLabel}</span>
                    <span>{item.bankName}</span>
                    <span>{item.accountNumber}</span>
                    <span>{waitTime}</span>
                    {isCancelRequested && (
                      <span className="text-amber-500 font-medium">
                        {ADMIN_DASHBOARD_MESSAGES.TAG_CANCEL_REQUEST}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0">
                <span className="text-sm font-medium tabular-nums text-foreground">
                  {formattedAmount}
                </span>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs font-medium border-border/70 text-foreground hover:bg-muted/50"
                >
                  <Link to="/admin-dashboard/withdrawals?filter=PENDING">
                    <span>{ADMIN_DASHBOARD_MESSAGES.ACTION_PROCESS}</span>
                    <ArrowRightUpIcon className="size-3.5" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          );
        }

        const item = entry.item;
        const initials = GetInitials(item.brandName);
        const cleanLogoUrl = SanitizeHttpUrl(item.brandLogoUrl);
        const waitTime = FormatWaitDuration(item.createdAt);
        const formattedPayable = FormatRupiah(item.totalPayable);
        const senderInfo =
          item.senderBank && item.senderAccountName
            ? `${item.senderBank} a.n. ${item.senderAccountName}`
            : 'Bukti transfer diunggah';

        return (
          <div
            key={`topup-${item.id}`}
            className="px-5 py-4 hover:bg-muted/25 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Avatar className="size-9 rounded-full border border-border/60 bg-muted shrink-0">
                {cleanLogoUrl ? (
                  <AvatarImage
                    src={cleanLogoUrl}
                    alt={item.brandName}
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.brandName}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5 tabular-nums">
                  <span>{ADMIN_DASHBOARD_MESSAGES.TAG_TOPUP}</span>
                  <span>{item.referenceCode}</span>
                  <span className="truncate">{senderInfo}</span>
                  <span>{waitTime}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0">
              <span className="text-sm font-medium tabular-nums text-foreground">
                {formattedPayable}
              </span>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs font-medium border-border/70 text-foreground hover:bg-muted/50"
              >
                <Link to="/admin-dashboard/top-ups?filter=SUBMITTED">
                  <span>{ADMIN_DASHBOARD_MESSAGES.ACTION_VERIFY}</span>
                  <ArrowRightUpIcon className="size-3.5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Renders flat hairline-divided rows for pending bank/e-wallet KYC reviews.
 *
 * @param kycRequests - Pending KYC verification items.
 * @returns Rendered KYC queue rows.
 */
function RenderKycRows(kycRequests: AdminDashboardKycActionItem[]) {
  return (
    <div className="divide-y divide-border/40">
      {kycRequests.map((item) => {
        const initials = GetInitials(item.userName);
        const cleanAvatarUrl = SanitizeHttpUrl(item.userAvatarUrl);
        const roleLabel = item.userRole === 'BRAND' ? 'Brand' : 'Kreator';
        const timeAgo = FormatTimeAgo(item.createdAt);

        return (
          <div
            key={item.id}
            className="px-5 py-4 hover:bg-muted/25 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Avatar className="size-9 rounded-full border border-border/60 bg-muted shrink-0">
                {cleanAvatarUrl ? (
                  <AvatarImage
                    src={cleanAvatarUrl}
                    alt={item.userName}
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.userName}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5 tabular-nums">
                  <span>{roleLabel}</span>
                  <span>{item.provider}</span>
                  <span>{item.accountNumber}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5 tabular-nums">
                  <span className="truncate" title={`a.n. ${item.accountHolderName}`}>
                    a.n. {item.accountHolderName}
                  </span>
                  <span>{timeAgo}</span>
                  {item.isHolderNameMismatch && (
                    <span className="text-amber-500 font-medium">
                      Nama berbeda dengan profil
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-8 w-full sm:w-auto gap-1.5 text-xs font-medium border-border/70 text-foreground hover:bg-muted/50 shrink-0"
            >
              <Link to="/admin-dashboard/kyc?filter=PENDING">
                <span>{ADMIN_DASHBOARD_MESSAGES.ACTION_REVIEW}</span>
                <ArrowRightUpIcon className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Unified left Bento action queue widget (7/8 columns) for the admin dashboard.
 * Consolidates campaign moderation/settlement, finance triage, and KYC reviews into
 * a single clean card with an edge-to-edge segmented tab bar and flat hairline-divided rows.
 *
 * @param props - Actionable campaigns, withdrawals, top-ups, and KYC requests.
 * @returns Rendered unified action queue widget.
 */
export function AdminActionQueueWidget({
  campaigns,
  withdrawals,
  topUps,
  kycRequests,
  className,
}: AdminActionQueueWidgetProps) {
  const financeItems = BuildSortedFinanceItems(withdrawals, topUps);
  const campaignsCount = campaigns.length;
  const financeCount = financeItems.length;
  const kycCount = kycRequests.length;

  const [activeTab, setActiveTab] = useState<AdminActionQueueTab>(() =>
    GetDefaultQueueTab(campaignsCount, financeCount, kycCount),
  );

  const activeCount =
    activeTab === 'CAMPAIGNS'
      ? campaignsCount
      : activeTab === 'FINANCE'
        ? financeCount
        : kycCount;

  const subtitleText =
    activeCount > 0
      ? `${activeCount} ${ADMIN_DASHBOARD_MESSAGES.ACTION_QUEUE_SUBTITLE_SUFFIX}`
      : ADMIN_DASHBOARD_MESSAGES.ACTION_QUEUE_EMPTY_SUBTITLE;

  const emptyStateCopy = GetTabEmptyStateCopy(activeTab);

  const tabs: { id: AdminActionQueueTab; label: string; count: number }[] = [
    {
      id: 'CAMPAIGNS',
      label: ADMIN_DASHBOARD_MESSAGES.ACTION_QUEUE_TAB_CAMPAIGNS,
      count: campaignsCount,
    },
    {
      id: 'FINANCE',
      label: ADMIN_DASHBOARD_MESSAGES.ACTION_QUEUE_TAB_FINANCE,
      count: financeCount,
    },
    {
      id: 'KYC',
      label: ADMIN_DASHBOARD_MESSAGES.ACTION_QUEUE_TAB_KYC,
      count: kycCount,
    },
  ];

  return (
    <div
      className={cn(
        'rounded-xl border border-border/60 bg-card flex flex-col overflow-hidden',
        className,
      )}
    >
      <div className="px-5 py-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-foreground truncate">
            {ADMIN_DASHBOARD_MESSAGES.ACTION_QUEUE_TITLE}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 tabular-nums truncate">
            {subtitleText}
          </p>
        </div>

        {/* Seamless Edge-to-Edge Segmented Control */}
        <div
          role="tablist"
          aria-label={ADMIN_DASHBOARD_MESSAGES.ACTION_QUEUE_TITLE}
          className="grid grid-cols-3 w-full sm:w-auto sm:inline-flex rounded-lg border border-border/70 bg-background p-0 overflow-hidden divide-x divide-border/70 text-xs shrink-0"
        >
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-2.5 sm:px-3 py-1.5 text-center truncate transition-colors cursor-pointer first:rounded-l-[7px] last:rounded-r-[7px] tabular-nums',
                  isSelected
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {activeCount === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-5 text-center">
            <p className="text-sm font-medium text-foreground">
              {emptyStateCopy.title}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              {emptyStateCopy.description}
            </p>
          </div>
        ) : activeTab === 'CAMPAIGNS' ? (
          RenderCampaignRows(campaigns)
        ) : activeTab === 'FINANCE' ? (
          RenderFinanceRows(financeItems)
        ) : (
          RenderKycRows(kycRequests)
        )}
      </div>
    </div>
  );
}
