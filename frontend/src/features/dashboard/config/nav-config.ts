import {
  ArrowDownToLine,
  ArrowUpFromLine,
  FileCheck,
  LayoutDashboard,
  Megaphone,
  User,
  UserCheck,
  Video,
  Wallet,
} from 'lucide-react';
import type { DashboardNavItem } from '../types';

export type { DashboardNavItem };

export const BRAND_NAV_ITEMS: DashboardNavItem[] = [
  {
    title: 'Dashboard',
    href: '/brand-dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Kampanye',
    href: '/brand-dashboard/brand-campaigns',
    icon: Megaphone,
  },
  {
    title: 'Dompet',
    href: '/brand-dashboard/wallet',
    icon: Wallet,
  },
  {
    title: 'Profil Akun',
    href: '/brand-dashboard/profile',
    icon: User,
  },
];

export const CREATOR_NAV_ITEMS: DashboardNavItem[] = [
  {
    title: 'Dashboard',
    href: '/creator-dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Kampanye',
    href: '/creator-dashboard/creator-campaigns',
    icon: Megaphone,
  },
  {
    title: 'Submisi Video',
    href: '/creator-dashboard/submissions',
    icon: Video,
  },
  {
    title: 'Dompet',
    href: '/creator-dashboard/wallet',
    icon: Wallet,
  },
  {
    title: 'Profil Akun',
    href: '/creator-dashboard/profile',
    icon: User,
  },
];

export const ADMIN_NAV_ITEMS: DashboardNavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin-dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Kampanye',
    href: '/admin-dashboard/campaigns',
    icon: Megaphone,
  },
  {
    title: 'Settlement',
    href: '/admin-dashboard/settlements',
    icon: FileCheck,
  },
  {
    title: 'Top Up',
    href: '/admin-dashboard/top-ups',
    icon: ArrowDownToLine,
  },
  {
    title: 'Withdraw',
    href: '/admin-dashboard/withdrawals',
    icon: ArrowUpFromLine,
  },
  {
    title: 'KYC',
    href: '/admin-dashboard/kyc',
    icon: UserCheck,
  },
];

export const DEFAULT_NAV_ITEMS: DashboardNavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Kampanye',
    href: '/dashboard/campaigns',
    icon: Megaphone,
  },
  {
    title: 'Dompet',
    href: '/dashboard/wallet',
    icon: Wallet,
  },
  {
    title: 'Profil Akun',
    href: '/dashboard/profile',
    icon: User,
  },
];
