import { FileCheck, LayoutDashboard, Megaphone, Settings, ShieldCheck, User, Wallet } from 'lucide-react';
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
    href: '/dashboard/admin-campaigns',
    icon: ShieldCheck,
  },
  {
    title: 'Verifikasi & Settlement',
    href: '/dashboard/settlements',
    icon: FileCheck,
  },
  {
    title: 'Disbursement',
    href: '/dashboard/wallet',
    icon: Wallet,
  },
  {
    title: 'Profil Akun',
    href: '/dashboard/profile',
    icon: User,
  },
  {
    title: 'Pengaturan',
    href: '/dashboard/settings',
    icon: Settings,
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
