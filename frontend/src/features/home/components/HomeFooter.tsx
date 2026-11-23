import { Link, useLocation } from 'react-router';
import { KlipdayLogo } from '@/components';
import { HOME_FOOTER_COLUMNS } from '../constants/home.constants';
import type { HomeFooterProps, NavLinkItem } from '../types';

const FOOTER_LINK_CLASS =
  'text-sm text-zinc-400 transition-colors hover:text-white';

/**
 * Renders an individual footer navigation link using an anchor for hash/external destinations
 * or a React Router Link for internal application routes.
 *
 * @param link - Footer navigation link definition.
 * @param isHomePage - Whether the current route is the landing page (`/`).
 * @returns The rendered anchor or router link element.
 */
function RenderFooterLink(link: NavLinkItem, isHomePage: boolean) {
  if (link.isExternal) {
    const isMailto = link.href.startsWith('mailto:');
    return (
      <a
        href={link.href}
        {...(!isMailto ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className={FOOTER_LINK_CLASS}
      >
        {link.label}
      </a>
    );
  }

  if (link.href.startsWith('#')) {
    const resolvedHref = isHomePage ? link.href : `/${link.href}`;
    return (
      <a href={resolvedHref} className={FOOTER_LINK_CLASS}>
        {link.label}
      </a>
    );
  }

  return (
    <Link to={link.href} className={FOOTER_LINK_CLASS}>
      {link.label}
    </Link>
  );
}

/**
 * Minimalist, edge-aligned 3-column dark footer shared across the landing page and public info pages.
 * Presents Klipday's brand summary alongside structured Platform, Bantuan, and Legal links.
 *
 * @param props - Component properties including optional className.
 * @returns The rendered footer landmark element.
 */
export function HomeFooter({ className = '' }: HomeFooterProps) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const currentYear = new Date().getFullYear();

  /**
   * Scrolls smoothly back to the top on landing page logo clicks, or routes home from sub-pages.
   *
   * @param event - Anchor click event.
   */
  function HandleBrandClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!isHomePage) {
      return;
    }

    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const footerClasses =
    `w-full border-t border-white/[0.08] bg-[#09090B] ${className}`.trim();

  return (
    <footer className={footerClasses}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-10 py-12 sm:py-16 md:grid-cols-12">
          {/* Brand Identity */}
          <div className="space-y-4 md:col-span-5">
            <div>
              <Link
                to="/"
                onClick={HandleBrandClick}
                className="inline-flex items-center transition-opacity hover:opacity-90"
              >
                <KlipdayLogo size="md" />
              </Link>
            </div>

            <p className="max-w-xs text-sm leading-relaxed text-zinc-400">
              Platform kolaborasi brand dan clipper untuk distribusi konten video pendek berbasis penayangan asli.
            </p>
          </div>

          {/* 3-Column Navigation Links */}
          <nav
            aria-label="Footer navigation"
            className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7"
          >
            {HOME_FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <h3 className="text-xs font-medium tracking-tight text-zinc-200">
                  {column.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>{RenderFooterLink(link, isHomePage)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Copyright Strip */}
        <div className="flex flex-col items-start justify-between gap-2 border-t border-white/[0.06] py-6 text-xs text-zinc-500 sm:flex-row sm:items-center">
          <p>&copy; {currentYear} Klipday. Seluruh hak cipta dilindungi.</p>
          <p>Klip everyday, cuan everyday.</p>
        </div>
      </div>
    </footer>
  );
}
