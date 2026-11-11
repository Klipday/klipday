import type { Industry, Role } from '../../generated/prisma/enums.js';
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  ResendVerificationInput,
  VerifyEmailInput,
} from './auth.schemas.js';

export type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  ResendVerificationInput,
  VerifyEmailInput,
};

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
