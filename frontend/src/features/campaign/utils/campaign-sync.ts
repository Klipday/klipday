import type { ApiError } from '@/lib/api-client';
import type { CampaignBroadcastEvent } from '../types';

const CAMPAIGN_SYNC_CHANNEL_NAME = 'klipday-campaign-sync';
const TAB_INSTANCE_ID =
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `tab-${Math.random().toString(36).slice(2)}`;

/**
 * Checks whether an API error corresponds to an HTTP 409 Conflict (stale data or concurrent transition).
 *
 * @param error - Error caught from a mutation or API request.
 * @returns True when status code is 409.
 */
export function IsCampaignConflictError(error: unknown): boolean {
  const apiError = error as ApiError | undefined;
  return apiError?.status === 409;
}

/**
 * Broadcasts a campaign state mutation to other open browser tabs in the same origin
 * so concurrent wizard or payment tabs stay synchronized automatically.
 *
 * @param campaignId - Optional affected campaign UUID.
 */
export function NotifyCampaignUpdatedAcrossTabs(campaignId?: string): void {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return;
  }

  try {
    const channel = new BroadcastChannel(CAMPAIGN_SYNC_CHANNEL_NAME);
    const payload: CampaignBroadcastEvent = {
      senderTabId: TAB_INSTANCE_ID,
      campaignId,
    };
    channel.postMessage(payload);
    channel.close();
  } catch {
    // Gracefully ignore when browser context blocks BroadcastChannel
  }
}

/**
 * Subscribes to cross-tab campaign state notifications emitted by other browser tabs.
 * Ignores events originated by the current tab instance.
 *
 * @param onRemoteUpdate - Callback invoked with the remote campaignId (or undefined for list-wide updates).
 * @returns Cleanup unsubscribe function.
 */
export function SubscribeCampaignUpdatesAcrossTabs(
  onRemoteUpdate: (campaignId?: string) => void,
): () => void {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return () => {};
  }

  try {
    const channel = new BroadcastChannel(CAMPAIGN_SYNC_CHANNEL_NAME);
    const HandleMessage = (event: MessageEvent<CampaignBroadcastEvent>) => {
      const payload = event.data;
      if (!payload || payload.senderTabId === TAB_INSTANCE_ID) {
        return;
      }
      onRemoteUpdate(payload.campaignId);
    };

    channel.addEventListener('message', HandleMessage);
    return () => {
      channel.removeEventListener('message', HandleMessage);
      channel.close();
    };
  } catch {
    return () => {};
  }
}
