import { Link } from 'react-router';
import { HOME_FOOTER_LINKS } from '../constants/home.constants';
import type { HomeFooterProps } from '../types';

/**
 * Minimalist dark SaaS footer component for Klipday.
 * Adheres strictly to anti-slop guidelines with clean typography,
 * subtle dividers, and pure text links.
 *
 * @param props - Component properties.
 * @returns The rendered footer element.
 */
export function HomeFooter({ className = '' }: HomeFooterProps) {
  /**
   * Smoothly scrolls to a target section by ID.
   *
   * @param event - The mouse click event.
   * @param targetId - HTML element ID to scroll towards.
   * @returns void
   */
  const HandleNavScroll = (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (targetId.startsWith('#') && targetId.length > 1) {
      event.preventDefault();
      const cleanId = targetId.replace('#', '');
      const element = document.getElementById(cleanId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const footerClasses = `w-full border-t border-white/5 py-12 px-6 mt-12 bg-[#09090b] ${className}`.trim();

  return (
    <footer className={footerClasses}>
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
        {/* Brand identity & tagline */}
        <div>
          <Link
            to="/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="font-heading font-bold text-base tracking-tight text-white hover:opacity-90"
          >
            Klipday<span className="text-rose-500">.</span>
          </Link>
          <p className="mt-1 text-xs text-zinc-400">Klip everyday, cuan everyday.</p>
        </div>

        {/* Clean Text Navigation Links */}
        <nav className="flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400">
          {HOME_FOOTER_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => HandleNavScroll(e, link.href)}
              className="transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Legal copyright notice */}
        <div className="text-xs text-zinc-500">
          &copy; {new Date().getFullYear()} Klipday. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
