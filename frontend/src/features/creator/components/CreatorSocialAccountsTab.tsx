import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  SocialAccountConnectDialog,
  SocialPlatformRow,
} from '@/features/submission/components';
import { UseAllConnectedSocialAccountsQuery } from '@/features/submission/hooks';
import type { SocialPlatform } from '@/features/submission/types';
import { cn } from '@/lib/utils';
import { CREATOR_QUERY_KEYS } from '../constants';
import type { CreatorSocialAccountsTabProps } from '../types';

const CREATOR_PLATFORMS: ReadonlyArray<{ id: SocialPlatform; name: string }> = [
  { id: 'TIKTOK', name: 'TikTok' },
  { id: 'INSTAGRAM', name: 'Instagram Reels' },
  { id: 'YOUTUBE', name: 'YouTube Shorts' },
];

/**
 * Tab component for managing connected social media accounts across TikTok, Instagram Reels, and YouTube Shorts.
 *
 * @param props - Component configuration properties.
 * @returns The rendered social accounts tab element.
 */
export function CreatorSocialAccountsTab({
  onAccountChangeSuccess,
  className,
}: CreatorSocialAccountsTabProps) {
  const queryClient = useQueryClient();
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [targetPlatform, setTargetPlatform] = useState<SocialPlatform>('TIKTOK');

  const { data: connectedAccounts = [] } = UseAllConnectedSocialAccountsQuery();

  const HandleOpenConnect = (platform: SocialPlatform) => {
    setTargetPlatform(platform);
    setIsConnectDialogOpen(true);
  };

  const HandleAccountVerified = () => {
    queryClient.invalidateQueries({ queryKey: CREATOR_QUERY_KEYS.PROFILE });
    queryClient.invalidateQueries({ queryKey: ['connected-social-account'] });
    queryClient.invalidateQueries({ queryKey: ['connected-social-accounts'] });
    queryClient.invalidateQueries({ queryKey: ['current-account'] });
    queryClient.invalidateQueries({ queryKey: ['creator', 'dashboard'] });
    onAccountChangeSuccess?.();
  };

  const targetConnectedAccount =
    connectedAccounts.find((acc) => acc.platform === targetPlatform) ?? null;

  return (
    <div className={cn('space-y-6', className)}>
      <div className="space-y-1.5">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          Akun Media Sosial Terhubung
        </h2>
        <p className="text-xs text-muted-foreground">
          Hubungkan akun TikTok, Instagram, dan YouTube aktif Anda untuk verifikasi kepemilikan dan pelaporan penayangan konten clipping.
        </p>
      </div>

      <div className="space-y-3.5">
        {CREATOR_PLATFORMS.map((platform) => {
          const matchedAccount =
            connectedAccounts.find((acc) => acc.platform === platform.id) ?? null;

          return (
            <SocialPlatformRow
              key={platform.id}
              platformId={platform.id}
              platformName={platform.name}
              isSupported={true}
              isSelected={Boolean(matchedAccount?.isVerified)}
              connectedAccount={matchedAccount}
              onSelect={() => {}}
              onConnect={() => HandleOpenConnect(platform.id)}
              onSwitchAccount={() => HandleOpenConnect(platform.id)}
            />
          );
        })}
      </div>

      {/* Social Account Connect & Bio Verification Dialog */}
      <SocialAccountConnectDialog
        open={isConnectDialogOpen}
        onOpenChange={setIsConnectDialogOpen}
        platform={targetPlatform}
        connectedAccount={targetConnectedAccount}
        onAccountVerified={HandleAccountVerified}
      />
    </div>
  );
}
