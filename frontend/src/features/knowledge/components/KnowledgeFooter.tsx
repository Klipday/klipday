import { Link } from 'react-router';
import { KlipdayLogo } from '@/components';
import { cn } from '@/lib/utils';
import { KNOWLEDGE_FOOTER_LINKS } from '../constants';
import type { KnowledgeFooterProps } from '../types';

/**
 * Standard footer component for knowledge hub and legal pages.
 * Displays clean navigation links to FAQ, Rules, Terms of Service, and Privacy Policy
 * alongside the platform copyright mark.
 *
 * @param props - Custom styling classes.
 * @returns The rendered footer component.
 */
export function KnowledgeFooter({ className = '' }: KnowledgeFooterProps) {
  const currentYear = new Date().getFullYear();
  const containerClasses = cn(
    'w-full border-t border-white/5 py-10 px-6 mt-16 bg-[#09090b]',
    className
  );

  return (
    <footer className={containerClasses}>
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
        {/* Brand mark */}
        <div>
          <Link
            to="/"
            className="inline-block transition-opacity hover:opacity-90"
          >
            <KlipdayLogo size="sm" />
          </Link>
          <p className="mt-1.5 text-[11px] text-zinc-500">Marketplace Video Clipping Organik Indonesia</p>
        </div>

        {/* Clean Text Links */}
        <nav className="flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400">
          {KNOWLEDGE_FOOTER_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Legal copyright mark */}
        <div className="text-[11px] text-zinc-500">
          &copy; {currentYear} Klipday. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
