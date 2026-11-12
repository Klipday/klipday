import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';
import {
  DEFAULT_DISCORD_INVITE_URL,
  HOME_BOTTOM_BANNER_CONTENT,
} from '../constants/home.constants';
import type { HomeDiscordBannerProps } from '../types';
import { SectionBadge } from './SectionBadge';

gsap.registerPlugin(ScrollTrigger);

/**
 * Modern minimalist bottom CTA banner.
 * Centered, calm, and authoritative presentation without faux-widgets or AI noise.
 *
 * @param props - Component properties including activeAudience and optional className.
 * @returns The rendered bottom banner section.
 */
export function HomeDiscordBanner({ activeAudience, className = '' }: HomeDiscordBannerProps) {
  const containerRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const isFirstAudienceRender = useRef(true);

  const isCreator = activeAudience === 'creator';
  const bannerData = HOME_BOTTOM_BANNER_CONTENT[activeAudience];
  const discordUrl =
    (import.meta.env.VITE_DISCORD_COMMUNITY_URL as string | undefined) ||
    DEFAULT_DISCORD_INVITE_URL;

  // Initial ScrollTrigger entrance
  useGSAP(
    () => {
      const matchMediaInstance = gsap.matchMedia();

      matchMediaInstance.add('(prefers-reduced-motion: no-preference)', () => {
        if (cardRef.current) {
          gsap.from(cardRef.current, {
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
            y: 35,
            autoAlpha: 0,
            scale: 0.98,
            duration: 0.8,
            ease: 'power3.out',
          });
        }
      });

      return () => {
        matchMediaInstance.revert();
      };
    },
    { scope: containerRef }
  );

  // Audience switch crossfade
  useGSAP(
    () => {
      if (isFirstAudienceRender.current) {
        isFirstAudienceRender.current = false;
        return;
      }

      if (contentWrapperRef.current) {
        gsap.fromTo(
          contentWrapperRef.current,
          { autoAlpha: 0, y: 10, scale: 0.99 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.4,
            ease: 'power3.out',
            onComplete: () => {
              ScrollTrigger.refresh();
            },
          }
        );
      }
    },
    { scope: containerRef, dependencies: [activeAudience] }
  );

  const sectionClasses = `w-full max-w-5xl px-4 sm:px-6 py-12 sm:py-16 ${className}`.trim();

  return (
    <section ref={containerRef} className={sectionClasses}>
      <div
        ref={cardRef}
        className={cn(
          'relative overflow-hidden rounded-3xl p-8 sm:p-12 md:p-16 text-center will-change-transform transition-all duration-500',
          isCreator
            ? 'bg-[radial-gradient(110%_120%_at_50%_0%,rgba(88,101,242,0.15)_0%,rgba(18,18,24,0.95)_55%,#09090b_100%)] border border-white/10'
            : 'bg-[radial-gradient(110%_120%_at_50%_0%,rgba(225,29,72,0.12)_0%,rgba(24,18,18,0.95)_55%,#09090b_100%)] border border-white/10'
        )}
      >
        <div
          ref={contentWrapperRef}
          className="relative z-10 mx-auto max-w-2xl flex flex-col items-center will-change-transform"
        >
          <SectionBadge className="mb-4">
            {bannerData.sectionPill}
          </SectionBadge>
          <h2 className="mb-3 font-heading font-bold text-2xl sm:text-3xl md:text-4xl tracking-tight text-white">
            {bannerData.heading}
          </h2>
          <p className="mb-8 font-normal text-sm sm:text-base leading-relaxed text-zinc-400">
            {bannerData.description}
          </p>

          {bannerData.isExternalCta ? (
            <a
              href={discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-xl bg-white px-7 sm:px-8 py-3.5 font-semibold text-sm text-zinc-950 shadow-sm transition-all duration-200 hover:bg-zinc-100 active:scale-[0.98]"
            >
              {/* Official Discord Logo SVG */}
              <svg
                className="size-4 shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span>{bannerData.ctaLabel}</span>
            </a>
          ) : (
            <Link
              to={bannerData.ctaHref}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-7 sm:px-8 py-3.5 font-semibold text-sm text-white shadow-sm transition-all duration-200 hover:bg-rose-500 active:scale-[0.98]"
            >
              <span>{bannerData.ctaLabel}</span>
              <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
