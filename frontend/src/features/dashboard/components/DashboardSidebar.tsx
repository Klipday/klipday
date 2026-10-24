import {
  ArrowUpRight,
  HelpCircle,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { UseLogoutMutation } from '@/features/authentication/hooks';
import { DEFAULT_DISCORD_COMMUNITY_URL } from '../constants';
import { UseNavbar } from '../hooks';
import type {
  DashboardSidebarProps,
  SidebarCommunityCardProps,
  SidebarContentProps,
  SidebarCustomIconProps,
  SidebarFooterProps,
  SidebarHeaderProps,
  SidebarHelpSectionProps,
  SidebarLogoutButtonProps,
  SidebarNavItemProps,
  SidebarNavListProps,
} from '../types';
import { GetNavItemsForRole, IsRouteActive } from '../utils';

/**
 * Custom SVG Discord logo icon.
 *
 * @param props - Styling configuration including dimensions and color classes.
 * @returns An accessible SVG representation of the Discord brand icon.
 */
function DiscordIcon({ className }: SidebarCustomIconProps) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

/**
 * Custom SVG WhatsApp logo icon.
 *
 * @param props - Styling configuration including dimensions and color classes.
 * @returns An accessible SVG representation of the WhatsApp brand icon.
 */
function WhatsAppIcon({ className }: SidebarCustomIconProps) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.456h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/**
 * Header section of the dashboard sidebar.
 * Displays the brand logo and the collapse or drawer close toggle buttons.
 *
 * @param props - Header configuration including collapsed state and drawer mode.
 * @returns The rendered sidebar header.
 */
function SidebarHeader({ collapsed, isDrawer = false }: SidebarHeaderProps) {
  const { ToggleSidebarCollapse, CloseMobileMenu } = UseNavbar();

  if (collapsed) {
    return (
      <div className="flex h-16 shrink-0 items-center justify-center border-b px-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={ToggleSidebarCollapse}
          className="size-11 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Perluas sidebar"
          title="Perluas sidebar">
          <PanelLeftOpen className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-16 shrink-0 items-center justify-between border-b px-4 sm:px-5">
      <Link to="/dashboard" onClick={CloseMobileMenu} className="flex items-center gap-2 transition-opacity hover:opacity-90">
        <span className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Klipday<span className="text-rose-500">.</span>
        </span>
      </Link>

      {isDrawer ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={CloseMobileMenu}
          className="text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Tutup menu">
          <X className="h-5 w-5" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={ToggleSidebarCollapse}
          className="text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Kecilkan sidebar"
          title="Kecilkan sidebar">
          <PanelLeftClose className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}

/**
 * Individual sidebar navigation link item.
 * Adapts between icon-only tooltip display (collapsed mode) and full title with optional badge (expanded mode).
 * Supports internal router navigation as well as external new-tab links.
 *
 * @param props - Item data, collapse state, active status, and click callback.
 * @returns An accessible navigation link element.
 */
function SidebarNavItem({ item, collapsed, isActive, onItemClick }: SidebarNavItemProps) {
  const IconComponent = item.icon;

  if (collapsed) {
    const collapsedClasses = cn(
      'flex size-11 items-center justify-center rounded-xl transition-colors',
      isActive ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    );

    if (item.isExternal) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onItemClick}
              className={collapsedClasses}
              aria-label={item.title}>
              <IconComponent className="h-5 w-5 shrink-0" />
              <span className="sr-only">{item.title}</span>
            </a>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={12}>
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to={item.href} onClick={onItemClick} className={collapsedClasses} aria-label={item.title}>
            <IconComponent className="h-5 w-5 shrink-0" />
            <span className="sr-only">{item.title}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={12}>
          {item.title}
        </TooltipContent>
      </Tooltip>
    );
  }

  const expandedClasses = cn(
    'flex items-center gap-3.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
    isActive ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  );

  if (item.isExternal) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onItemClick}
        className={expandedClasses}>
        <IconComponent className="h-5 w-5 shrink-0" />
        <span className="truncate">{item.title}</span>
        <ArrowUpRight className="ml-auto size-3.5 text-muted-foreground/60" />
      </a>
    );
  }

  return (
    <Link to={item.href} onClick={onItemClick} className={expandedClasses}>
      <IconComponent className="h-5 w-5 shrink-0" />
      <span className="truncate">{item.title}</span>
      {item.badge ? (
        <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">{item.badge}</span>
      ) : null}
    </Link>
  );
}

/**
 * Community Discord invitation card widget.
 * Promotes joining the Klipday creator & brand Discord community.
 *
 * @param props - Collapsed state and dismissal callback for mobile drawers.
 * @returns The rendered community card or collapsed tooltip icon link.
 */
function SidebarCommunityCard({ collapsed, onItemClick }: SidebarCommunityCardProps) {
  const discordUrl =
    (import.meta.env.VITE_DISCORD_COMMUNITY_URL as string | undefined) ||
    DEFAULT_DISCORD_COMMUNITY_URL;

  if (collapsed) {
    return (
      <div className="flex justify-center py-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onItemClick}
              className="flex size-11 items-center justify-center rounded-xl text-[#5865F2] hover:bg-[#5865F2]/10 transition-colors"
              aria-label="Komunitas Discord">
              <DiscordIcon className="h-5 w-5 shrink-0" />
            </a>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={12}>
            Join Komunitas Discord
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2.5">
      <div className="flex items-center gap-2.5">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#5865F2]/10 text-[#5865F2]">
          <DiscordIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground truncate">Join Our Community</p>
          <p className="text-[10px] text-muted-foreground truncate">Diskusi kreator & brand</p>
        </div>
      </div>
      <a
        href={discordUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onItemClick}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#5865F2] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#4752C4] transition-colors shadow-xs">
        <DiscordIcon className="size-3.5 shrink-0" />
        <span>Gabung Discord</span>
        <ArrowUpRight className="ml-auto size-3 opacity-70" />
      </a>
    </div>
  );
}

/**
 * Assistance and support section containing WhatsApp admin link and FAQ documentation link.
 *
 * @param props - Collapsed state and dismissal callback for mobile drawers.
 * @returns The rendered help section with subtitle and action links.
 */
function SidebarHelpSection({ collapsed, onItemClick }: SidebarHelpSectionProps) {
  const location = useLocation();
  const supportPhone =
    (import.meta.env.VITE_WHATSAPP_SUPPORT_PHONE as string | undefined) || '6281288997700';
  const whatsappUrl = `https://wa.me/${supportPhone}?text=${encodeURIComponent('Halo Admin Klipday, saya butuh bantuan mengenai akun saya.')}`;
  const isFaqActive = IsRouteActive(location.pathname, '/faq');

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-3 w-full">
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onItemClick}
              className="flex size-11 items-center justify-center rounded-xl text-emerald-600 hover:bg-emerald-500/10 transition-colors"
              aria-label="Hubungi Admin (WhatsApp)">
              <WhatsAppIcon className="h-5 w-5 shrink-0" />
            </a>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={12}>
            Hubungi Admin (WhatsApp)
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/faq"
              onClick={onItemClick}
              className={cn(
                'flex size-11 items-center justify-center rounded-xl transition-colors',
                isFaqActive
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              aria-label="FAQ & Peraturan">
              <HelpCircle className="h-5 w-5 shrink-0" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={12}>
            FAQ & Peraturan
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="px-3 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
        Butuh Bantuan?
      </p>

      <div className="space-y-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onItemClick}
          className="flex items-center gap-3.5 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <WhatsAppIcon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="truncate">Hubungi Admin</span>
          <ArrowUpRight className="ml-auto size-3.5 text-muted-foreground/50" />
        </a>

        <Link
          to="/faq"
          onClick={onItemClick}
          className={cn(
            'flex items-center gap-3.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
            isFaqActive
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}>
          <HelpCircle className="size-4 shrink-0" />
          <span className="truncate">FAQ & Peraturan</span>
        </Link>
      </div>
    </div>
  );
}

/**
 * Scrollable navigation list section rendering role-based links, community card, and support links.
 *
 * @param props - Role configuration and collapsed display state.
 * @returns The list of navigation items wrapped in appropriate navigation semantics.
 */
function SidebarNavList({ role, collapsed }: SidebarNavListProps) {
  const location = useLocation();
  const { CloseMobileMenu } = UseNavbar();
  const navItems = GetNavItemsForRole(role);

  return (
    <div className={cn('flex-1 overflow-y-auto flex flex-col', collapsed ? 'p-3' : 'p-4 sm:p-5')}>
      <nav className={cn('space-y-3', collapsed && 'flex flex-col items-center space-y-3')}>
        {navItems.map((item) => {
          const isActive = IsRouteActive(location.pathname, item.href);

          return (
            <SidebarNavItem
              key={item.href}
              item={item}
              collapsed={collapsed}
              isActive={isActive}
              onItemClick={CloseMobileMenu}
            />
          );
        })}
      </nav>

      <div className={cn('mt-auto pt-6 space-y-4', collapsed && 'w-full flex flex-col items-center space-y-3')}>
        <SidebarHelpSection collapsed={collapsed} onItemClick={CloseMobileMenu} />
        <SidebarCommunityCard collapsed={collapsed} onItemClick={CloseMobileMenu} />
      </div>
    </div>
  );
}

/**
 * Sidebar logout button adhering strictly to navigation item dimensions and styling.
 * Supports collapsed icon tooltip and expanded text display with subtle destructive hover styling.
 *
 * @param props - Collapsed state and optional click callback to dismiss mobile menu.
 * @returns The rendered logout action button.
 */
function SidebarLogoutButton({ collapsed, onItemClick }: SidebarLogoutButtonProps) {
  const logoutMutation = UseLogoutMutation();

  const HandleLogout = () => {
    onItemClick?.();
    logoutMutation.mutate();
  };

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={HandleLogout}
            disabled={logoutMutation.isPending}
            className="flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer mx-auto"
            aria-label="Keluar">
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="sr-only">Keluar</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={12}>
          Keluar
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <button
      type="button"
      onClick={HandleLogout}
      disabled={logoutMutation.isPending}
      className="flex w-full items-center gap-3.5 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer text-left">
      <LogOut className="h-5 w-5 shrink-0" />
      <span className="truncate">Keluar</span>
    </button>
  );
}

/**
 * Footer section of the dashboard sidebar.
 * Displays the Logout action button with clean breathing space and without top border divider.
 *
 * @param props - Footer configuration including role and collapsed state.
 * @returns The rendered sidebar footer.
 */
function SidebarFooter({ collapsed }: SidebarFooterProps) {
  const { CloseMobileMenu } = UseNavbar();

  return (
    <div className={cn('shrink-0 pt-1', collapsed ? 'p-3 flex justify-center items-center' : 'px-4 pb-4 sm:px-5 sm:pb-5')}>
      <SidebarLogoutButton collapsed={collapsed} onItemClick={CloseMobileMenu} />
    </div>
  );
}

/**
 * Composed layout combining the sidebar header, scrollable navigation links, help card, and fixed footer.
 * Wraps content in TooltipProvider for icon tooltips when collapsed.
 *
 * @param props - Component properties including role, collapsed state, and drawer mode.
 * @returns The inner sidebar header, navigation menu, and footer structure.
 */
function SidebarContent({ role, collapsed, isDrawer = false }: SidebarContentProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex h-full flex-col">
        <SidebarHeader collapsed={collapsed} isDrawer={isDrawer} />
        <SidebarNavList role={role} collapsed={collapsed} />
        <SidebarFooter role={role} collapsed={collapsed} />
      </div>
    </TooltipProvider>
  );
}

/**
 * Left sidebar navigation component running the full height of the viewport.
 * Consumes UseNavbar to manage desktop collapse and mobile drawer state without prop drilling.
 *
 * @param props - Sidebar properties including the user role.
 * @returns The full-height left navigation sidebar.
 */
export function DashboardSidebar({ role }: DashboardSidebarProps) {
  const { isSidebarCollapsed, isMobileOpen, CloseMobileMenu } = UseNavbar();

  return (
    <>
      {/* Desktop Persistent Full-Height Sidebar */}
      <aside
        className={cn(
          'sticky top-0 hidden h-full shrink-0 flex-col border-r bg-sidebar transition-[width] duration-200 md:flex',
          isSidebarCollapsed ? 'w-20' : 'w-64'
        )}>
        <SidebarContent role={role} collapsed={isSidebarCollapsed} isDrawer={false} />
      </aside>

      {/* Mobile Drawer Backdrop and Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity"
            onClick={CloseMobileMenu}
            aria-hidden="true"
          />
          <aside className="relative flex h-full w-64 max-w-[80vw] flex-1 flex-col border-r bg-sidebar shadow-xl">
            <SidebarContent role={role} collapsed={false} isDrawer={true} />
          </aside>
        </div>
      )}
    </>
  );
}
