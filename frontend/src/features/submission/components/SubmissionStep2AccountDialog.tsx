import { useState } from 'react';
import { cn } from '@/lib/utils';
import { UseConnectedSocialAccountQuery } from '../hooks';
import type {
  CreatorSocialAccount,
  SocialPlatform,
  SubmissionStep2AccountDialogProps,
} from '../types';
import { SocialAccountConnectDialog } from './SocialAccountConnectDialog';
import { SocialPlatformRow } from './SocialPlatformRow';

const PLATFORMS: ReadonlyArray<{ id: SocialPlatform; name: string }> = [
  { id: 'TIKTOK', name: 'TikTok' },
  { id: 'INSTAGRAM', name: 'Instagram' },
  { id: 'YOUTUBE', name: 'YouTube' },
];

/**
 * Step 2 dialog orchestrator: "Pilih Social Media".
 * Displays platform options (TikTok, Instagram, YouTube) with active campaign constraints,
 * connection status cards, and seamless linkage via SocialAccountConnectDialog.
 *
 * @param props - Step 2 properties containing campaignId, campaign, connectedAccount, and callbacks.
 * @returns Rendered social media selection dialog step.
 */
export function SubmissionStep2AccountDialog({
  campaign,
  campaignPlatform,
  connectedAccount: propAccount,
  onAccountVerified,
  className,
}: SubmissionStep2AccountDialogProps) {
  const { data: queriedAccount, refetch: refetchAccount } = UseConnectedSocialAccountQuery();
  const connectedAccount = queriedAccount ?? propAccount ?? null;

  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [targetConnectPlatform, setTargetConnectPlatform] = useState<SocialPlatform>('TIKTOK');

  const activePlatform = (campaign?.platform || campaignPlatform || 'TIKTOK').toUpperCase();

  /**
   * Opens the social media connect and verification dialog for the requested platform.
   *
   * @param platformId - Selected social platform enum.
   */
  const HandleOpenConnectDialog = (platformId: SocialPlatform) => {
    setTargetConnectPlatform(platformId);
    setIsConnectDialogOpen(true);
  };

  /**
   * Propagates verified account callback to parent dialog and refreshes local account state.
   *
   * @param verified - Verified creator social account.
   */
  const HandleAccountVerified = async (verified: CreatorSocialAccount) => {
    await refetchAccount();
    onAccountVerified?.(verified);
    setIsConnectDialogOpen(false);
  };

  return (
    <div className={cn('space-y-5', className)}>
      {/* Step Heading */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Pilih Social Media
        </h1>
        <p className="text-xs text-muted-foreground">
          Silakan pilih salah satu social media di bawah ini
        </p>
      </div>

      {/* Multi-Platform Card Rows */}
      <div className="space-y-3 pt-1">
        {PLATFORMS.map((platform) => {
          const isSupported = platform.id.toUpperCase() === activePlatform;

          return (
            <SocialPlatformRow
              key={platform.id}
              platformId={platform.id}
              platformName={platform.name}
              isSupported={isSupported}
              connectedAccount={connectedAccount}
              onConnect={() => HandleOpenConnectDialog(platform.id)}
              onSwitchAccount={() => HandleOpenConnectDialog(platform.id)}
            />
          );
        })}
      </div>

      {/* Bottom context notice */}
      <p className="text-[11px] text-muted-foreground italic pt-2">
        Hanya media sosial yang sesuai dengan ketentuan kampanye yang dapat dipilih untuk pengajuan video.
      </p>

      {/* Dedicated Connect & Bio Verification Modal Dialog */}
      <SocialAccountConnectDialog
        open={isConnectDialogOpen}
        onOpenChange={setIsConnectDialogOpen}
        platform={targetConnectPlatform}
        connectedAccount={connectedAccount}
        onAccountVerified={HandleAccountVerified}
      />
    </div>
  );
}
