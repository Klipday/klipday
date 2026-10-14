import type { Category } from '../../generated/prisma/enums.js';

export interface CreatorSocialSummary {
  username: string;
  avatarUrl: string | null;
  followersCount: number;
  isVerified: boolean;
}

export interface CreatorProfileResponse {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  phoneNumber: string | null;
  location: string | null;
  bio: string | null;
  contentCategories: Category[];
  tiktokAccount: CreatorSocialSummary | null;
  createdAt: Date;
  updatedAt: Date;
}
