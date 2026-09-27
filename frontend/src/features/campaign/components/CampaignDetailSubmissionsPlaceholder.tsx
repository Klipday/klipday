import { Navigate } from 'react-router';
import type { CampaignDetailSubmissionsPlaceholderProps } from '../types';
import { CampaignDetailAdminSubmissions } from './CampaignDetailAdminSubmissions';
import { CampaignDetailBrandSubmissions } from './CampaignDetailBrandSubmissions';
import { CampaignDetailCreatorSubmissions } from './CampaignDetailCreatorSubmissions';

/**
 * Orchestrator tab view rendered when secondary tabs ("Video Kamu" or "Pengajuan Klip")
 * are selected in the campaign detail page.
 * Strictly delegates rendering to role-specific components:
 * - CREATOR or 'my-videos' tab: CampaignDetailCreatorSubmissions
 * - BRAND: CampaignDetailBrandSubmissions
 * - ADMIN: CampaignDetailAdminSubmissions
 * - Fallback: Redirects back to default campaign detail tab.
 *
 * @param props - Component properties containing userRole, activeTab, campaignId, and submit dialog callback.
 * @returns The rendered role-specific submissions component or redirect navigation.
 */
export function CampaignDetailSubmissionsPlaceholder({
  userRole,
  activeTab,
  campaignId,
  onOpenSubmitDialog,
  className,
}: CampaignDetailSubmissionsPlaceholderProps) {
  if (userRole === 'CREATOR' && activeTab === 'my-videos') {
    return <CampaignDetailCreatorSubmissions campaignId={campaignId} onOpenSubmitDialog={onOpenSubmitDialog} className={className} />;
  }

  if (userRole === 'BRAND' && activeTab === 'submissions') {
    return <CampaignDetailBrandSubmissions campaignId={campaignId} className={className} />;
  }

  if (userRole === 'ADMIN' && activeTab === 'admin-submissions') {
    return <CampaignDetailAdminSubmissions campaignId={campaignId} className={className} />;
  }

  // Fallback for unauthorized, mismatched, or unrecognized roles/tabs: redirect back to detail tab
  const redirectPath = campaignId ? `/campaigns/${campaignId}` : '/campaigns';
  return <Navigate to={redirectPath} replace />;
}
