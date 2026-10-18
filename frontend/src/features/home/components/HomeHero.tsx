import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router';
import { HOME_HERO_CONTENT } from '../constants/home.constants';
import { UseMagneticHover } from '../hooks';
import type { AudienceType, HomeHeroProps } from '../types';

gsap.registerPlugin(ScrollTrigger);

/**
 * Modern minimalist Hero component for Klipday.
 * Highlights the core value proposition with audience switching (Creator vs Brand),
 * signature 3D masked typography reveals, magnetic CTA pull, ambient spotlight pulse,
 * and high-converting escrow trust pill.
 *
 * @param props - Component properties with active audience state and toggle handler.
 * @returns The rendered Hero section.
 */
export function HomeHero({ activeAudience, onAudienceChange, className = '' }: HomeHeroProps) {
  const containerRef = useRef<HTMLElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const creatorBtnRef = useRef<HTMLButtonElement>(null);
  const brandBtnRef = useRef<HTMLButtonElement>(null);
  const headlineLine1Ref = useRef<HTMLDivElement>(null);
  const headlineLine2Ref = useRef<HTMLDivElement>(null);
  const subcopyRef = useRef<HTMLParagraphElement>(null);
  const ctaBtnRef = UseMagneticHover<HTMLAnchorElement>({ maxPull: 6, strength: 0.25 });
  const isFirstAudienceRender = useRef(true);

  const heroData = HOME_HERO_CONTENT[activeAudience];

  // GSAP Entrance Choreography & Ambient Loops
  useGSAP(
    () => {
      const matchMediaInstance = gsap.matchMedia();

      matchMediaInstance.add('(prefers-reduced-motion: no-preference)', () => {
        // 1. Ambient Background Spotlight Infinite Sine Pulse
        if (spotlightRef.current) {
          gsap.to(spotlightRef.current, {
            scale: 1.12,
            opacity: 0.22,
            duration: 4,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });
        }

        // 2. Initial Entrance Master Timeline
        const masterTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

        // Role switcher pill fades + scales in
        if (toggleRef.current) {
          masterTimeline.from(toggleRef.current, {
            y: -12,
            autoAlpha: 0,
            scale: 0.95,
            duration: 0.5,
          });
        }

        // Headline 3D Masked Slide-up
        const headlineLines = [headlineLine1Ref.current, headlineLine2Ref.current].filter(Boolean);
        if (headlineLines.length > 0) {
          masterTimeline.from(
            headlineLines,
            {
              yPercent: 100,
              rotateX: -15,
              autoAlpha: 0,
              stagger: 0.1,
              duration: 0.7,
              ease: 'expo.out',
            },
            '-=0.2'
          );
        }

        // Subcopy and Primary CTA Button Cascade In
        const cascadeElements = [subcopyRef.current, ctaBtnRef.current].filter(Boolean);
        if (cascadeElements.length > 0) {
          masterTimeline.from(
            cascadeElements,
            {
              y: 20,
              autoAlpha: 0,
              stagger: 0.08,
              duration: 0.6,
            },
            '-=0.3'
          );
        }
      });

      return () => {
        matchMediaInstance.revert();
      };
    },
    { scope: containerRef }
  );

  // Smooth Crossfade & Pill Morph on Audience Switch
  useGSAP(
    () => {
      // Animate active pill indicator slider
      if (indicatorRef.current && creatorBtnRef.current && brandBtnRef.current) {
        const targetBtn = activeAudience === 'creator' ? creatorBtnRef.current : brandBtnRef.current;
        const targetOffsetLeft = targetBtn.offsetLeft;
        const targetWidth = targetBtn.offsetWidth;

        gsap.to(indicatorRef.current, {
          x: targetOffsetLeft - 4, // 4px padding offset
          width: targetWidth,
          duration: 0.4,
          ease: 'power4.out',
        });
      }

      // Skip content fade on initial mount
      if (isFirstAudienceRender.current) {
        isFirstAudienceRender.current = false;
        return;
      }

      const elementsToMorph = [
        headlineLine1Ref.current,
        headlineLine2Ref.current,
        subcopyRef.current,
        ctaBtnRef.current,
      ].filter(Boolean);

      if (elementsToMorph.length > 0) {
        gsap.fromTo(
          elementsToMorph,
          { y: 14, autoAlpha: 0, scale: 0.985 },
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            stagger: 0.05,
            duration: 0.45,
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

  /**
   * Switches audience perspective.
   *
   * @param target - Selected audience mode.
   * @returns void
   */
  const HandleToggle = (target: AudienceType) => {
    if (target !== activeAudience) {
      onAudienceChange(target);
    }
  };

  const heroClasses = `w-full hero-glow pt-24 pb-36 md:pt-32 md:pb-44 px-6 flex flex-col items-center text-center relative overflow-hidden ${className}`.trim();

  return (
    <section ref={containerRef} className={heroClasses}>
      {/* Ambient Crimson Spotlight Glow - Enlarged for immersive presence */}
      <div
        ref={spotlightRef}
        className="pointer-events-none absolute -top-48 left-1/2 -translate-x-1/2 h-[720px] w-[950px] md:h-[840px] md:w-[1300px] rounded-full bg-rose-600/18 blur-[150px] will-change-transform"
        aria-hidden="true"
      />

      {/* 1. Spring-Morph Segmented Role Switcher */}
      <div
        ref={toggleRef}
        className="relative mb-8 inline-flex h-9 items-center rounded-full border border-white/10 bg-zinc-900/90 p-1 shadow-inner backdrop-blur-md"
        role="tablist"
        aria-label="Role switcher"
      >
        {/* Animated Sliding Pill Indicator */}
        <div
          ref={indicatorRef}
          className="pointer-events-none absolute top-1 bottom-1 left-1 w-24 rounded-full bg-white shadow-sm will-change-transform"
          aria-hidden="true"
        />

        <button
          ref={creatorBtnRef}
          type="button"
          role="tab"
          aria-selected={activeAudience === 'creator'}
          onClick={() => HandleToggle('creator')}
          className={`relative z-10 w-24 cursor-pointer rounded-full py-1 text-center text-xs font-semibold transition-colors duration-200 ${
            activeAudience === 'creator'
              ? 'text-black'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Creator
        </button>
        <button
          ref={brandBtnRef}
          type="button"
          role="tab"
          aria-selected={activeAudience === 'brand'}
          onClick={() => HandleToggle('brand')}
          className={`relative z-10 w-24 cursor-pointer rounded-full py-1 text-center text-xs font-semibold transition-colors duration-200 ${
            activeAudience === 'brand'
              ? 'text-black'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Brand
        </button>
      </div>

      {/* 2. Headline with 3D Masked Line Reveals */}
      <h1 className="mb-5 max-w-3xl font-heading text-5xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl md:text-7xl">
        <div className="overflow-hidden py-0.5">
          <div ref={headlineLine1Ref} className="will-change-transform">
            {heroData.headlineLead}
          </div>
        </div>
        <div className="overflow-hidden py-0.5">
          <div
            ref={headlineLine2Ref}
            className="will-change-transform bg-gradient-to-r from-white via-rose-300 to-rose-500 bg-clip-text text-transparent"
          >
            {heroData.headlineHighlight}
          </div>
        </div>
      </h1>

      {/* 3. Subtitle / Value Proposition */}
      <p
        ref={subcopyRef}
        className="mx-auto mb-8 max-w-xl text-base font-normal leading-relaxed text-zinc-400 sm:text-lg will-change-transform"
      >
        {heroData.subcopy}
      </p>

      {/* 4. Magnetic Primary CTA Button */}
      <div className="relative inline-block">
        <Link
          ref={ctaBtnRef}
          to={heroData.ctaHref}
          className="inline-flex items-center justify-center rounded-full bg-rose-600 px-8 py-3.5 font-semibold text-sm text-white shadow-[0_0_32px_rgba(225,29,72,0.45)] transition-colors hover:bg-rose-500 will-change-transform"
        >
          <span>{heroData.ctaLabel}</span>
        </Link>
      </div>
    </section>
  );
}
