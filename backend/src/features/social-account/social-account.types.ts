import type { Platform } from '../../generated/prisma/enums.js';

export interface RequestCodeResponseData {
  code?: string;
  expiresAt?: string;
  username: string;
  alreadyVerified?: boolean;
  account?: SocialAccountDto;
}

export interface SocialAccountDto {
  id: string;
  creatorId: string;
  platform: Platform;
  username: string;
  platformUserId?: string | null;
  avatarUrl?: string | null;
  followersCount: number;
  isVerified: boolean;
  verificationCode?: string | null;
  verificationExpiresAt?: Date | null;
  verifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
