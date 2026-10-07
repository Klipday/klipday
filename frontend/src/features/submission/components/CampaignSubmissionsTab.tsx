import { Navigate } from 'react-router';
import type { CampaignSubmissionsTabProps } from '../types';
import { AdminSubmissionsView } from './AdminSubmissionsView';
import { BrandSubmissionsView } from './BrandSubmissionsView';
import { CreatorSubmissionsView } from './CreatorSubmissionsView';

/**
 * Orchestrator tab view rendered when secondary tabs ("Video Kamu", "Pengajuan Klip", or "Tinjauan Admin")
 * are selected in the campaign detail page.
 * Strictly delegates rendering to role-specific components:
 * - CREATOR or 'my-videos' tab: CreatorSubmissionsView
 * - BRAND: BrandSubmissionsView
 * - ADMIN: AdminSubmissionsView
 * - Fallback: Redirects back to default campaign detail tab.
 *
 * @param props - Component properties containing userRole, activeTab, campaignId, and submit dialog callback.
 * @returns The rendered role-specific submissions component or redirect navigation.
 */
export function CampaignSubmissionsTab({
  userRole,
  activeTab,
  campaignId,
  onOpenSubmitDialog,
  className,
}: CampaignSubmissionsTabProps) {
  if (userRole === 'CREATOR' && activeTab === 'my-videos') {
    return <CreatorSubmissionsView campaignId={campaignId} onOpenSubmitDialog={onOpenSubmitDialog} className={className} />;
  }

  if (userRole === 'BRAND' && activeTab === 'submissions') {
    return <BrandSubmissionsView campaignId={campaignId} className={className} />;
  }

  if (userRole === 'ADMIN' && activeTab === 'admin-submissions') {
    return <AdminSubmissionsView campaignId={campaignId} className={className} />;
  }

  // Fallback for unauthorized, mismatched, or unrecognized roles/tabs: redirect back to detail tab
  const redirectPath = campaignId ? `/campaigns/${campaignId}` : '/campaigns';
  return <Navigate to={redirectPath} replace />;
}

export { CampaignSubmissionsTab as CampaignDetailSubmissionsPlaceholder };
