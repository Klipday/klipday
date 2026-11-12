import { Link } from 'react-router';
import { KlipdayLogo } from '@/components';
import { HOME_FOOTER_NAV_GROUPS, HOME_FOOTER_SOCIAL_LINKS } from '../constants/home.constants';
import type { HomeFooterProps } from '../types';

/**
 * High-craft 3-layer dark-mode SaaS footer component for Klipday.
 * Features a top 1px gradient horizon line with crimson glow,
 * multi-column navigation grid, subtle copyright & social links bar,
 * and a signature giant watermark wordmark.
 *
 * @param props - Component properties.
 * @returns The rendered footer element.
 */
export function HomeFooter({ className = '' }: HomeFooterProps) {
  /**
   * Smoothly scrolls to a target section by ID if present on current page.
   *
   * @param event - The mouse click event.
   * @param targetId - HTML element ID with leading hash.
   * @returns void
   */
  const HandleNavScroll = (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (targetId.startsWith('#') && targetId.length > 1) {
      const cleanId = targetId.replace('#', '');
      const element = document.getElementById(cleanId);
      if (element) {
        event.preventDefault();
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  /**
   * Scrolls smoothly to the top of the landing page on brand logo click.
   *
   * @param event - The mouse click event.
   * @returns void
   */
  const HandleBrandClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerClasses = `relative bg-[#09090B] pt-16 pb-0 overflow-hidden ${className}`.trim();

  return (
    <footer className={footerClasses}>
      {/* 1. Top Horizon Divider with Subtle Centered Crimson Glow */}
      <div className="absolute top-0 inset-x-0 w-full overflow-hidden pointer-events-none">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div
          className="w-1/2 h-24 bg-rose-500/[0.04] blur-3xl mx-auto -mt-12 pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* 2. Main Multi-Column Grid */}
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-10 pb-16">
        {/* Left Brand Column */}
        <div className="md:col-span-5 space-y-4">
          <div>
            <Link
              to="/"
              onClick={HandleBrandClick}
              className="inline-flex items-center transition-opacity hover:opacity-90"
            >
              <KlipdayLogo size="md" />
            </Link>
          </div>

          <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
            Klip everyday, cuan everyday. Marketplace kreator klip video &amp; brand nomor satu di Indonesia.
          </p>
        </div>

        {/* Right Navigation Columns */}
        <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
          {HOME_FOOTER_NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                {group.title}
              </h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('#') ? (
                      <a
                        href={link.href}
                        onClick={(e) => HandleNavScroll(e, link.href)}
                        className="text-sm text-zinc-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-zinc-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Subtle Copyright & Social Bar */}
      <div className="max-w-6xl mx-auto px-6 py-6 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
        <div>
          &copy; {new Date().getFullYear()} Klipday. All rights reserved.
        </div>

        <div className="flex items-center gap-6">
          {HOME_FOOTER_SOCIAL_LINKS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              {...(item.isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>

      {/* 4. Bottom Giant Clipped Watermark Wordmark (Signature SaaS Finish) */}
      <div className="w-full overflow-hidden flex justify-center select-none pointer-events-none pt-2 -mb-6 sm:-mb-10">
        <span className="text-[18vw] sm:text-[15vw] font-black tracking-tighter leading-none bg-gradient-to-b from-white/[0.06] via-white/[0.02] to-transparent bg-clip-text text-transparent">
          KLIPDAY.
        </span>
      </div>
    </footer>
  );
}
