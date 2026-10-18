import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  SocialAccountConnectDialog,
  SocialPlatformRow,
} from '@/features/submission/components';
import { UseConnectedSocialAccountQuery } from '@/features/submission/hooks';
import { cn } from '@/lib/utils';
import { CREATOR_QUERY_KEYS } from '../constants';
import type { CreatorSocialAccountsTabProps } from '../types';

/**
 * Tab component for managing connected social media accounts.
 * Displays TikTok as the active platform with verification modal handshake,
 * alongside locked preview cards for upcoming platforms (Instagram, YouTube).
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

  const { data: connectedAccount } = UseConnectedSocialAccountQuery();

  const HandleAccountVerified = () => {
    queryClient.invalidateQueries({ queryKey: CREATOR_QUERY_KEYS.PROFILE });
    queryClient.invalidateQueries({ queryKey: ['connected-social-account'] });
    queryClient.invalidateQueries({ queryKey: ['current-account'] });
    queryClient.invalidateQueries({ queryKey: ['creator', 'dashboard'] });
    onAccountChangeSuccess?.();
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="space-y-1.5">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          Akun Media Sosial Terhubung
        </h2>
        <p className="text-xs text-muted-foreground">
          Hubungkan akun media sosial aktif Anda untuk verifikasi kepemilikan dan pelaporan penayangan konten clipping.
        </p>
      </div>

      <div className="space-y-3.5">
        {/* TikTok Platform Row (Active) */}
        <SocialPlatformRow
          platformId="TIKTOK"
          platformName="TikTok"
          isSupported={true}
          connectedAccount={connectedAccount}
          onConnect={() => setIsConnectDialogOpen(true)}
          onSwitchAccount={() => setIsConnectDialogOpen(true)}
        />

        {/* Instagram Reels (Locked) */}
        <SocialPlatformRow
          platformId="INSTAGRAM"
          platformName="Instagram Reels"
          isSupported={false}
          connectedAccount={null}
          onConnect={() => {}}
          onSwitchAccount={() => {}}
        />

        {/* YouTube Shorts (Locked) */}
        <SocialPlatformRow
          platformId="YOUTUBE"
          platformName="YouTube Shorts"
          isSupported={false}
          connectedAccount={null}
          onConnect={() => {}}
          onSwitchAccount={() => {}}
        />
      </div>

      {/* Social Account Connect & Bio Verification Dialog */}
      <SocialAccountConnectDialog
        open={isConnectDialogOpen}
        onOpenChange={setIsConnectDialogOpen}
        platform="TIKTOK"
        connectedAccount={connectedAccount}
        onAccountVerified={HandleAccountVerified}
      />
    </div>
  );
}
