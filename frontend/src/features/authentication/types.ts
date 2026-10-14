export type AuthRole = 'BRAND' | 'CREATOR' | 'ADMIN';

export interface BrandRegisterInput {
  role: 'BRAND';
  email: string;
  password: string;
  companyName: string;
  phoneNumber: string;
  industry: string;
}

export interface CreatorRegisterInput {
  role: 'CREATOR';
  email: string;
  password: string;
  fullName: string;
}

export type RegisterInput = BrandRegisterInput | CreatorRegisterInput;

export interface LoginInput {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  status: string;
  data: T;
  message: string;
}

export interface RegisteredAccount {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface LoggedInAccount {
  id: string;
  email: string;
  role: AuthRole;
}

export interface BrandProfile {
  id: string;
  companyName: string;
  phoneNumber?: string | null;
  industry?: string | null;
  logoUrl?: string | null;
}

export interface CreatorProfile {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface AdminProfile {
  id: string;
  fullName: string;
}

export interface CurrentAccountProfile {
  id: string;
  email: string;
  role: AuthRole;
  name: string;
  avatarUrl?: string | null;
  isEmailVerified: boolean;
  brand?: BrandProfile | null;
  creator?: CreatorProfile | null;
  admin?: AdminProfile | null;
}

export interface RoleSliderProps {
  value: 'CREATOR' | 'BRAND';
  onChange: (value: 'CREATOR' | 'BRAND') => void;
  disabled?: boolean;
}

export interface ProtectedRouteProps {
  allowedRoles?: AuthRole[];
}

export type PasswordInputProps = React.ComponentProps<'input'>;
