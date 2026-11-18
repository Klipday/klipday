import { Link } from 'react-router';
import { KlipdayLogo } from '@/components';
import { HOME_FOOTER_LINKS } from '../constants/home.constants';
import type { HomeFooterProps } from '../types';

/**
 * Minimalist dark-mode SaaS footer component for Klipday.
 * Features a top 1px gradient horizon line with crimson glow,
 * brand mark with essential legal/support links, copyright bar,
 * and a signature giant watermark wordmark.
 *
 * @param props - Component properties.
 * @returns The rendered footer element.
 */
export function HomeFooter({ className = '' }: HomeFooterProps) {
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

      {/* 2. Brand Mark & Essential Legal / Support Links */}
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 pb-12">
        <div className="space-y-4">
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

        <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-8 gap-y-3">
          {HOME_FOOTER_LINKS.map((link) => {
            if (link.isExternal) {
              const isMailto = link.href.startsWith('mailto:');
              return (
                <a
                  key={link.label}
                  href={link.href}
                  {...(!isMailto ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              );
            }

            return (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 3. Subtle Copyright Bar */}
      <div className="max-w-6xl mx-auto px-6 py-6 border-t border-white/[0.05] flex items-center justify-between text-xs text-zinc-500">
        <div>
          &copy; {new Date().getFullYear()} Klipday. All rights reserved.
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
