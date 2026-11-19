import {
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  BellIcon,
  FileCheckIcon,
  MegaphoneIcon,
  UserCheckIcon,
  UserIcon,
  VideocameraIcon,
  WalletIcon,
  Widget5Icon,
} from '@solar-icons/react/linear';
import type { DashboardNavItem } from '../types';

export type { DashboardNavItem };

export const BRAND_NAV_ITEMS: DashboardNavItem[] = [
  {
    title: 'Dashboard',
    href: '/brand-dashboard',
    icon: Widget5Icon,
  },
  {
    title: 'Kampanye',
    href: '/brand-dashboard/brand-campaigns',
    icon: MegaphoneIcon,
  },
  {
    title: 'Dompet',
    href: '/brand-dashboard/wallet',
    icon: WalletIcon,
  },
  {
    title: 'Notifikasi',
    href: '/notifications',
    icon: BellIcon,
  },
  {
    title: 'Profil Akun',
    href: '/brand-dashboard/profile',
    icon: UserIcon,
  },
];

export const CREATOR_NAV_ITEMS: DashboardNavItem[] = [
  {
    title: 'Dashboard',
    href: '/creator-dashboard',
    icon: Widget5Icon,
  },
  {
    title: 'Kampanye',
    href: '/creator-dashboard/creator-campaigns',
    icon: MegaphoneIcon,
  },
  {
    title: 'Submisi Video',
    href: '/creator-dashboard/submissions',
    icon: VideocameraIcon,
  },
  {
    title: 'Dompet',
    href: '/creator-dashboard/wallet',
    icon: WalletIcon,
  },
  {
    title: 'Notifikasi',
    href: '/notifications',
    icon: BellIcon,
  },
  {
    title: 'Profil Akun',
    href: '/creator-dashboard/profile',
    icon: UserIcon,
  },
];

export const ADMIN_NAV_ITEMS: DashboardNavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin-dashboard',
    icon: Widget5Icon,
  },
  {
    title: 'Kampanye',
    href: '/admin-dashboard/campaigns',
    icon: MegaphoneIcon,
  },
  {
    title: 'Settlement',
    href: '/admin-dashboard/settlements',
    icon: FileCheckIcon,
  },
  {
    title: 'Top Up',
    href: '/admin-dashboard/top-ups',
    icon: ArrowDownToLineIcon,
  },
  {
    title: 'Withdraw',
    href: '/admin-dashboard/withdrawals',
    icon: ArrowUpFromLineIcon,
  },
  {
    title: 'KYC',
    href: '/admin-dashboard/kyc',
    icon: UserCheckIcon,
  },
  {
    title: 'Notifikasi',
    href: '/notifications',
    icon: BellIcon,
  },
];

export const DEFAULT_NAV_ITEMS: DashboardNavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Widget5Icon,
  },
  {
    title: 'Kampanye',
    href: '/dashboard/campaigns',
    icon: MegaphoneIcon,
  },
  {
    title: 'Dompet',
    href: '/dashboard/wallet',
    icon: WalletIcon,
  },
  {
    title: 'Notifikasi',
    href: '/notifications',
    icon: BellIcon,
  },
  {
    title: 'Profil Akun',
    href: '/dashboard/profile',
    icon: UserIcon,
  },
];
