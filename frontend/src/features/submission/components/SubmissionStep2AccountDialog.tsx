import { useState } from 'react';
import { cn } from '@/lib/utils';
import type {
  CreatorSocialAccount,
  SocialPlatform,
  SubmissionStep2AccountDialogProps,
} from '../types';
import { SocialAccountConnectDialog } from './SocialAccountConnectDialog';
import { SocialPlatformRow } from './SocialPlatformRow';

const PLATFORMS: ReadonlyArray<{ id: SocialPlatform; name: string }> = [
  { id: 'TIKTOK', name: 'TikTok' },
  { id: 'INSTAGRAM', name: 'Instagram Reels' },
  { id: 'YOUTUBE', name: 'YouTube Shorts' },
];

/**
 * Step 2 dialog orchestrator: "Pilih Social Media".
 * Displays all supported platforms (TikTok, Instagram Reels, YouTube Shorts),
 * active campaign eligibility, per-platform submission quotas, and bio verification linkage.
 *
 * @param props - Step 2 properties including allowedPlatforms, selectedPlatform, connectedAccounts, and quotas.
 * @returns Rendered social media selection dialog step.
 */
export function SubmissionStep2AccountDialog({
  allowedPlatforms,
  selectedPlatform,
  onSelectPlatform,
  connectedAccounts,
  platformQuotas,
  onAccountVerified,
  className,
}: SubmissionStep2AccountDialogProps) {
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [targetConnectPlatform, setTargetConnectPlatform] = useState<SocialPlatform>(selectedPlatform);

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
   * Propagates verified account callback to parent dialog and automatically selects the verified platform.
   *
   * @param verified - Verified creator social account.
   */
  const HandleAccountVerified = (verified: CreatorSocialAccount) => {
    onSelectPlatform(verified.platform);
    onAccountVerified?.(verified);
    setIsConnectDialogOpen(false);
  };

  const targetAccountForModal =
    connectedAccounts.find((acc) => acc.platform === targetConnectPlatform) ?? null;

  return (
    <div className={cn('space-y-5', className)}>
      {/* Step Heading */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Pilih Social Media
        </h1>
        <p className="text-xs text-muted-foreground">
          Pilih platform yang ingin kamu gunakan untuk pengajuan video kali ini.
        </p>
      </div>

      {/* Multi-Platform Card Rows */}
      <div className="space-y-3 pt-1">
        {PLATFORMS.map((platform) => {
          const isSupported = allowedPlatforms.includes(platform.id);
          const matchedAccount =
            connectedAccounts.find((acc) => acc.platform === platform.id) ?? null;
          const matchedQuota = platformQuotas?.find((q) => q.platform === platform.id);
          const isSelected = selectedPlatform === platform.id;

          return (
            <SocialPlatformRow
              key={platform.id}
              platformId={platform.id}
              platformName={platform.name}
              isSupported={isSupported}
              isSelected={isSelected}
              quota={matchedQuota}
              connectedAccount={matchedAccount}
              onSelect={() => onSelectPlatform(platform.id)}
              onConnect={() => HandleOpenConnectDialog(platform.id)}
              onSwitchAccount={() => HandleOpenConnectDialog(platform.id)}
            />
          );
        })}
      </div>

      {/* Bottom context notice */}
      <p className="text-[11px] text-muted-foreground italic pt-2">
        Hanya platform yang diizinkan kampanye dan masih memiliki kuota yang dapat dipilih. Untuk YouTube, hanya video YouTube Shorts yang diterima.
      </p>

      {/* Dedicated Connect & Bio Verification Modal Dialog */}
      <SocialAccountConnectDialog
        open={isConnectDialogOpen}
        onOpenChange={setIsConnectDialogOpen}
        platform={targetConnectPlatform}
        connectedAccount={targetAccountForModal}
        onAccountVerified={HandleAccountVerified}
      />
    </div>
  );
}
