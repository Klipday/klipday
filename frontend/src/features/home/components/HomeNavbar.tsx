import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router';
import { HOME_NAV_LINKS } from '../constants/home.constants';
import type { HomeNavbarProps } from '../types';

/**
 * Minimalist dark SaaS sticky navigation bar.
 * Features a clean text logo with signature crimson dot, text links,
 * audience switcher shortcut, and direct primary CTA.
 *
 * @param props - Component properties defining audience mode and callbacks.
 * @returns The rendered sticky navbar element.
 */
export function HomeNavbar({ activeAudience, onAudienceChange, className = '' }: HomeNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /**
   * Smoothly scrolls to a target section by ID.
   *
   * @param event - The mouse click event.
   * @param targetId - HTML element ID to scroll towards.
   * @returns void
   */
  const HandleNavScroll = (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    event.preventDefault();
    const cleanId = targetId.replace('#', '');
    const element = document.getElementById(cleanId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  /**
   * Toggles audience to brand or creator and scrolls to hero.
   *
   * @returns void
   */
  const HandleAudienceSwitch = () => {
    const nextAudience = activeAudience === 'creator' ? 'brand' : 'creator';
    onAudienceChange(nextAudience);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  const navClasses = `sticky top-0 z-50 w-full bg-[#09090b]/80 backdrop-blur-md border-b border-white/5 ${className}`.trim();

  return (
    <header className={navClasses}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Left: Clean Brand Logo & Desktop Nav Links */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center font-heading text-lg font-bold tracking-tight text-white transition-opacity hover:opacity-90"
          >
            Klipday<span className="text-rose-500">.</span>
          </Link>
          <nav className="hidden items-center gap-6 font-medium text-xs text-zinc-400 md:flex">
            {HOME_NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => HandleNavScroll(e, link.href)}
                className="transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Right: Desktop Action Links */}
        <div className="hidden items-center gap-5 md:flex">
          <button
            type="button"
            onClick={HandleAudienceSwitch}
            className="font-medium text-xs text-zinc-400 transition-colors hover:text-white cursor-pointer"
          >
            {activeAudience === 'creator' ? 'For Brand' : 'For Creator'}
          </button>
          <Link
            to="/signin"
            className="font-medium text-xs text-zinc-400 transition-colors hover:text-white"
          >
            Masuk
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center rounded-full bg-rose-600 px-4 py-1.5 font-medium text-xs text-white shadow-[0_0_16px_rgba(225,29,72,0.35)] transition-all hover:bg-rose-500 hover:scale-[1.02]"
          >
            {activeAudience === 'creator' ? 'Mulai Ngeklip' : 'Buat Campaign'}
          </Link>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center rounded-full bg-rose-600 px-3 py-1 font-medium text-xs text-white shadow-[0_0_12px_rgba(225,29,72,0.3)]"
          >
            {activeAudience === 'creator' ? 'Ngeklip' : 'Campaign'}
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white"
          >
            {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {isMobileMenuOpen && (
        <div className="border-b border-white/5 bg-[#09090b]/95 px-6 py-4 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-4 text-sm text-zinc-300">
            {HOME_NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => HandleNavScroll(e, link.href)}
                className="transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <div className="my-1 border-t border-white/5" />
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <button
                type="button"
                onClick={HandleAudienceSwitch}
                className="text-left font-medium hover:text-white"
              >
                {activeAudience === 'creator' ? 'Beralih ke Brand' : 'Beralih ke Creator'}
              </button>
              <Link to="/signin" className="hover:text-white">
                Masuk ke Akun
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
