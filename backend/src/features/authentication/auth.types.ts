import type { Industry, Role } from '../../generated/prisma/enums.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';

export type { LoginInput, RegisterInput };

export interface AuthSessionPayload {
  sub: string;
  role: Role;
}

export interface AuthResponseData {
  id: string;
  email: string;
  role: Role;
}

export interface BrandProfileDto {
  id: string;
  companyName: string;
  phoneNumber: string | null;
  industry: Industry | null;
  logoUrl?: string | null;
}

export interface CreatorProfileDto {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface AdminProfileDto {
  id: string;
  fullName: string;
}

export interface CurrentAccountProfile {
  id: string;
  email: string;
  role: Role;
  name: string;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  brand: BrandProfileDto | null;
  creator: CreatorProfileDto | null;
  admin: AdminProfileDto | null;
}
