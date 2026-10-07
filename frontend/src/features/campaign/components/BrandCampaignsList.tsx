import { useNavigate, useSearchParams } from 'react-router';
import { cn } from '@/lib/utils';
import { UseCampaignsQuery } from '../hooks';
import type { BrandCampaignsListProps, CampaignCardItem } from '../types';
import { ResolveCampaignWizardStepPath } from '../utils';
import { BrandCampaignsErrorState } from './BrandCampaignsErrorState';
import { CampaignCard } from './CampaignCard';
import { CampaignCardSkeleton } from './CampaignCardSkeleton';
import { CampaignStatusEmptyState } from './CampaignStatusEmptyState';

const VALID_STATUSES = ['ACTIVE', 'AWAITING_PAYMENT', 'IN_REVIEW', 'REVISION', 'FINISHED'] as const;

/**
 * Brand campaigns list component.
 * Fetches and displays a responsive grid of campaign cards owned by the authenticated brand,
 * scoped to the active status filter read from the URL (?status=...).
 * Handles loading skeleton, error with retry, status-specific empty states, and card interaction.
 *
 * @param props - Component properties containing optional click callbacks and class overrides.
 * @returns The rendered brand campaigns grid element.
 */
export function BrandCampaignsList({ onCardClick, className }: BrandCampaignsListProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const rawStatus = searchParams.get('status');
  const currentStatus = rawStatus && (VALID_STATUSES as readonly string[]).includes(rawStatus) ? rawStatus : 'ACTIVE';

  const search = searchParams.get('search') || undefined;
  const rawCategory = searchParams.get('category');
  const category = rawCategory && rawCategory !== 'ALL' ? rawCategory : undefined;
  const rawType = searchParams.get('campaignType');
  const campaignType = rawType && rawType !== 'ALL' ? rawType : undefined;
  const sort = searchParams.get('sort') || undefined;

  const { data, isLoading, isError, error, refetch } = UseCampaignsQuery({
    campaignStatus: currentStatus,
    search,
    category,
    campaignType,
    sort,
  });

  const HandleCardClick = (campaign: CampaignCardItem) => {
    if (onCardClick) {
      onCardClick(campaign);
      return;
    }

    if (campaign.campaignStatus === 'AWAITING_PAYMENT') {
      navigate(`/brand-dashboard/brand-campaigns/${campaign.id}/create/step-6`);
    } else if (campaign.campaignStatus === 'DRAFT' || campaign.campaignStatus === 'REVISION') {
      const targetPath = ResolveCampaignWizardStepPath(campaign);
      navigate(targetPath);
    } else {
      navigate(`/brand-dashboard/brand-campaigns/${campaign.id}`);
    }
  };

  if (isLoading) {
    return (
      <div
        className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5', className)}
        data-testid="brand-campaigns-loading">
        {Array.from({ length: 8 }).map((_, index) => (
          <CampaignCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (isError) {
    return <BrandCampaignsErrorState error={error} onRetry={() => void refetch()} className={className} />;
  }

  const items = data?.items ?? [];

  if (!items.length) {
    return <CampaignStatusEmptyState status={currentStatus} className={className} />;
  }

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 py-2', className)}>
      {items.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} onClick={HandleCardClick} />
      ))}
    </div>
  );
}
