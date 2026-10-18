import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';
import {
  DEFAULT_DISCORD_INVITE_URL,
  HOME_BOTTOM_BANNER_CONTENT,
} from '../constants/home.constants';
import type { HomeDiscordBannerProps } from '../types';

gsap.registerPlugin(ScrollTrigger);

/**
 * Modern dynamic bottom banner component.
 * Features an authentic Discord Blurple (#5865F2) and Deep Indigo dark-mode mesh gradient,
 * floating 3D illustration asset with smooth continuous levitation,
 * high-contrast interactive pill CTA button with Discord icon,
 * and seamless audience-switching crossfades.
 *
 * @param props - Component properties including activeAudience and optional className.
 * @returns The rendered bottom banner section.
 */
export function HomeDiscordBanner({ activeAudience, className = '' }: HomeDiscordBannerProps) {
  const containerRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const floatingAssetRef = useRef<HTMLDivElement>(null);
  const isFirstAudienceRender = useRef(true);

  const isCreator = activeAudience === 'creator';
  const bannerData = HOME_BOTTOM_BANNER_CONTENT[activeAudience];
  const discordUrl =
    (import.meta.env.VITE_DISCORD_COMMUNITY_URL as string | undefined) ||
    DEFAULT_DISCORD_INVITE_URL;

  // Initial ScrollTrigger entrance & continuous levitation loop
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

        // Gentle 3D illustration floating levitation
        if (floatingAssetRef.current) {
          gsap.to(floatingAssetRef.current, {
            y: -8,
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
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

  const sectionClasses = `w-full max-w-5xl px-6 py-16 ${className}`.trim();

  return (
    <section ref={containerRef} className={sectionClasses}>
      <div
        ref={cardRef}
        className={cn(
          'relative overflow-hidden rounded-3xl p-8 md:p-12 will-change-transform transition-all duration-500',
          isCreator
            ? 'bg-[radial-gradient(110%_120%_at_0%_0%,rgba(88,101,242,0.26)_0%,rgba(67,56,202,0.12)_45%,rgba(12,13,20,0.96)_100%)] border-t border-[#5865F2]/40 border-x border-b border-[#5865F2]/20 shadow-[0_0_60px_-15px_rgba(88,101,242,0.25)] hover:border-[#5865F2]/50'
            : 'bg-[radial-gradient(110%_120%_at_0%_0%,rgba(225,29,72,0.22)_0%,rgba(159,18,57,0.12)_45%,rgba(12,13,20,0.96)_100%)] border-t border-rose-500/40 border-x border-b border-rose-500/20 shadow-[0_0_60px_-15px_rgba(225,29,72,0.25)] hover:border-rose-500/50'
        )}
      >
        {/* Soft Ambient Backlight Orb */}
        <div
          className={cn(
            'pointer-events-none absolute -bottom-10 -right-10 size-80 rounded-full blur-[100px] transition-colors duration-500',
            isCreator ? 'bg-[#5865F2]/25' : 'bg-rose-600/20'
          )}
          aria-hidden="true"
        />

        <div
          ref={contentWrapperRef}
          className="relative z-10 grid grid-cols-1 items-center gap-8 text-left md:grid-cols-12 will-change-transform"
        >
          {/* Left: Heading, Description & Action CTA */}
          <div className="md:col-span-7">
            <h3 className="mb-3 font-heading font-bold text-2xl text-white sm:text-3xl">
              {bannerData.heading}
            </h3>
            <p className="mb-6 max-w-lg font-normal text-sm leading-relaxed text-zinc-300">
              {bannerData.description}
            </p>

            {bannerData.isExternalCta ? (
              <a
                href={discordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-3 font-semibold text-xs text-[#0A0A0A] shadow-[0_0_24px_rgba(255,255,255,0.2)] transition-all duration-300 hover:bg-[#5865F2] hover:text-white hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(88,101,242,0.6)]"
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
                className="inline-flex items-center justify-center rounded-full bg-rose-600 px-7 py-3 font-semibold text-xs text-white shadow-[0_0_24px_rgba(225,29,72,0.4)] transition-all duration-300 hover:bg-rose-500 hover:scale-[1.02]"
              >
                <span>{bannerData.ctaLabel}</span>
              </Link>
            )}
          </div>

          {/* Right: Floating 3D Illustration - Seamless blending without bounding box artifacts */}
          <div className="flex w-full items-center justify-center md:col-span-5 py-2">
            <div
              ref={floatingAssetRef}
              className="relative flex items-center justify-center will-change-transform w-full max-w-[380px] md:max-w-[440px] lg:max-w-[480px]"
            >
              {/* Soft Ambient Glow Halo behind the 3D graphic */}
              <div
                className={cn(
                  'pointer-events-none absolute inset-0 m-auto size-3/4 rounded-full blur-3xl transition-colors duration-500',
                  isCreator ? 'bg-[#5865F2]/25' : 'bg-rose-600/25'
                )}
                aria-hidden="true"
              />

              <img
                src={isCreator ? '/assets/images/discord_banner_creator.png?v=2' : '/assets/images/cta_banner_brand.png?v=2'}
                alt={bannerData.heading}
                className="relative z-10 w-full h-auto object-contain select-none transition-transform duration-500 ease-out will-change-transform [mask-image:linear-gradient(to_bottom,transparent_0%,black_6%,black_92%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_6%,black_92%,transparent_100%)]"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
