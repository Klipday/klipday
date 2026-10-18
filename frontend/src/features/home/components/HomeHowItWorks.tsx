import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HOME_HOW_IT_WORKS_CONTENT } from '../constants/home.constants';
import type { HomeHowItWorksProps } from '../types';
import { BlendedIllustration } from './BlendedIllustration';

gsap.registerPlugin(ScrollTrigger);

/**
 * Modern minimalist "Cara Kerja" (How It Works) section.
 * Features an alternating vertical laser-scrubbed timeline with 3D dark-glass visual stages,
 * continuous floating illustration levitation, watermark numerals, and reactive audience crossfade.
 *
 * @param props - Component properties including activeAudience.
 * @returns The rendered section.
 */
export function HomeHowItWorks({ activeAudience, className = '' }: HomeHowItWorksProps) {
  const containerRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const headerTitleRef = useRef<HTMLHeadingElement>(null);
  const timelineWrapperRef = useRef<HTMLDivElement>(null);
  const laserBeamRef = useRef<HTMLDivElement>(null);
  const isFirstAudienceRender = useRef(true);

  const content = HOME_HOW_IT_WORKS_CONTENT[activeAudience];

  // GSAP ScrollTrigger Entrance & Laser Scrub Choreography
  useGSAP(
    () => {
      const matchMediaInstance = gsap.matchMedia();

      matchMediaInstance.add('(prefers-reduced-motion: no-preference)', () => {
        // 1. Header reveal
        if (headerRef.current) {
          gsap.from(headerRef.current, {
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
            y: 20,
            autoAlpha: 0,
            duration: 0.6,
            ease: 'power3.out',
          });
        }

        // 2. Scrubbed Glowing Laser Timeline Beam
        if (laserBeamRef.current && timelineWrapperRef.current) {
          gsap.fromTo(
            laserBeamRef.current,
            { scaleY: 0 },
            {
              scaleY: 1,
              transformOrigin: 'top center',
              ease: 'none',
              scrollTrigger: {
                trigger: timelineWrapperRef.current,
                start: 'top 65%',
                end: 'bottom 65%',
                scrub: 0.6,
              },
            }
          );
        }

        // 3. Step Nodes & 3D Cards Staggered Reveal
        const rows = containerRef.current?.querySelectorAll<HTMLElement>('.timeline-step-row');
        if (rows && rows.length > 0) {
          rows.forEach((row, index) => {
            const isLeft = index % 2 === 0;
            const nodeBadge = row.querySelector<HTMLElement>('.timeline-node-badge');
            const card = row.querySelector<HTMLElement>('.step-card');
            const connector = row.querySelector<HTMLElement>('.timeline-connector');
            const initialX = window.innerWidth >= 768 ? (isLeft ? -35 : 35) : 0;

            // Initialize cards and connectors hidden to prevent visual pop before trigger
            if (card) {
              gsap.set(card, { autoAlpha: 0, x: initialX, y: 20 });
            }
            if (connector) {
              gsap.set(connector, { autoAlpha: 0, scaleX: 0 });
            }

            ScrollTrigger.create({
              trigger: row,
              start: 'top 65%',
              toggleActions: 'play none none none',
              onEnter: () => {
                // Active node pulse: glowing crimson border + halo pulse on circular badge
                if (nodeBadge) {
                  gsap.fromTo(
                    nodeBadge,
                    {
                      scale: 1.25,
                      borderColor: '#f43f5e',
                      boxShadow: '0 0 28px rgba(244, 63, 94, 0.95)',
                    },
                    {
                      scale: 1,
                      borderColor: 'rgba(244, 63, 94, 0.4)',
                      boxShadow: '0 0 12px rgba(244, 63, 94, 0.4)',
                      duration: 0.7,
                      ease: 'power2.out',
                    }
                  );
                }

                if (connector) {
                  gsap.to(connector, {
                    scaleX: 1,
                    autoAlpha: 1,
                    duration: 0.35,
                    ease: 'power2.out',
                  });
                }

                if (card) {
                  gsap.to(card, {
                    x: 0,
                    y: 0,
                    autoAlpha: 1,
                    duration: 0.7,
                    ease: 'power3.out',
                  });
                }
              },
            });
          });
        }

        // 4. Gentle Continuous Floating Illustration Levitation Loop
        gsap.to('.floating-asset', {
          y: -6,
          duration: 2.6,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          stagger: 0.3,
        });
      });

      matchMediaInstance.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(['.step-card', '.timeline-connector', '.timeline-node-badge'], {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          scaleX: 1,
        });
      });

      return () => {
        matchMediaInstance.revert();
      };
    },
    { scope: containerRef }
  );

  // Smooth Crossfade animation when switching audience (Creator <-> Brand)
  useGSAP(
    () => {
      if (isFirstAudienceRender.current) {
        isFirstAudienceRender.current = false;
        return;
      }

      const elementsToFade = [
        headerTitleRef.current,
        ...(containerRef.current?.querySelectorAll('.step-card') ?? []),
      ].filter(Boolean);

      if (elementsToFade.length > 0) {
        gsap.fromTo(
          elementsToFade,
          { autoAlpha: 0, y: 14, scale: 0.985 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.45,
            ease: 'power3.out',
            stagger: 0.05,
            onComplete: () => {
              ScrollTrigger.refresh();
            },
          }
        );
      }
    },
    { scope: containerRef, dependencies: [activeAudience] }
  );

  const sectionClasses = `w-full max-w-5xl px-6 py-24 border-t border-white/5 scroll-mt-20 ${className}`.trim();

  return (
    <section ref={containerRef} id="cara-kerja" className={sectionClasses}>
      {/* Section Header */}
      <div ref={headerRef} className="mb-16 text-center">
        <span className="mb-3 inline-block rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 font-medium text-xs text-rose-400 uppercase tracking-wider">
          {content.sectionPill}
        </span>
        <h2
          ref={headerTitleRef}
          className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl"
        >
          {content.title}
        </h2>
      </div>

      {/* Vertical Alternating Timeline Container */}
      <div ref={timelineWrapperRef} className="relative mx-auto max-w-4xl pt-4 pb-4">
        {/* Continuous Central Base Timeline Spine */}
        <div
          className="pointer-events-none absolute top-4 bottom-4 left-6 w-[2px] -translate-x-1/2 bg-white/10 md:left-1/2"
          aria-hidden="true"
        />

        {/* Scrubbed Glowing Crimson Laser Beam */}
        <div
          ref={laserBeamRef}
          className="pointer-events-none absolute top-4 bottom-4 left-6 w-[2px] -translate-x-1/2 bg-gradient-to-b from-rose-500 via-rose-500 to-rose-400 shadow-[0_0_15px_#E11D48] origin-top will-change-transform md:left-1/2"
          aria-hidden="true"
        />

        <div className="space-y-10 md:space-y-16">
          {content.steps.map((step, index) => {
            const isLeft = index % 2 === 0;

            const cardContent = (
              <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 p-6 text-left shadow-xl backdrop-blur-md transition-all duration-300 hover:border-rose-500/35 hover:bg-zinc-900/80 group md:w-[440px]">
                {/* Dedicated Visual Stage (h-48) with BlendedIllustration */}
                <div className="relative mb-5 flex h-48 w-full items-center justify-center overflow-hidden rounded-xl border border-white/[0.04] bg-black/40">
                  <BlendedIllustration
                    src={step.imageSrc}
                    alt={step.title}
                    className="floating-asset h-full w-full py-2"
                  />
                </div>

                {/* Step Text Content */}
                <div className="step-text-content relative z-10">
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="font-mono text-xs font-bold tracking-wider text-rose-400">
                      {step.badgeText}
                    </span>
                    <span className="size-1.5 rounded-full bg-rose-500/40 transition-colors group-hover:bg-rose-500" />
                  </div>
                  <h3 className="mb-2 font-heading text-lg font-bold text-white transition-colors group-hover:text-rose-100">
                    {step.title}
                  </h3>
                  <p className="font-normal text-sm leading-relaxed text-zinc-400">
                    {step.description}
                  </p>
                </div>
              </div>
            );

            return (
              <div
                key={step.stepNumber}
                className="timeline-step-row group relative grid grid-cols-1 items-center md:grid-cols-2 md:gap-16"
              >
                {/* Horizontal Timeline Connector Arm (Desktop) */}
                <div
                  className={`timeline-connector pointer-events-none hidden md:block absolute top-1/2 h-[2px] -translate-y-1/2 will-change-transform ${
                    isLeft
                      ? 'right-1/2 w-8 bg-gradient-to-l from-rose-500/60 to-rose-500/10 origin-right'
                      : 'left-1/2 w-8 bg-gradient-to-r from-rose-500/60 to-rose-500/10 origin-left'
                  }`}
                />

                {/* Horizontal Timeline Connector Arm (Mobile) */}
                <div className="timeline-connector pointer-events-none md:hidden absolute top-8 left-6 w-6 h-[2px] bg-gradient-to-r from-rose-500/60 to-rose-500/10 -translate-y-1/2 origin-left will-change-transform" />

                {/* Milestone Node on Spine */}
                <div className="timeline-node pointer-events-none absolute top-8 left-6 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center md:top-1/2 md:left-1/2">
                  <div className="timeline-node-badge flex size-8 items-center justify-center rounded-full border border-rose-500/40 bg-[#09090b] shadow-[0_0_12px_rgba(244,63,94,0.4)] transition-all duration-300 will-change-transform group-hover:border-rose-500 group-hover:shadow-[0_0_18px_rgba(244,63,94,0.7)]">
                    <span className="font-mono text-xs font-bold text-rose-400">
                      {index + 1}
                    </span>
                  </div>
                </div>

                {isLeft ? (
                  <>
                    {/* Left Column (Step 1 or 3): Card */}
                    <div className="step-card pl-12 md:pl-0 will-change-transform">
                      {cardContent}
                    </div>

                    {/* Right Column: Empty Spacer (Desktop) */}
                    <div className="hidden md:block" aria-hidden="true" />
                  </>
                ) : (
                  <>
                    {/* Left Column: Empty Spacer (Desktop) */}
                    <div className="hidden md:block" aria-hidden="true" />

                    {/* Right Column (Step 2): Card */}
                    <div className="step-card pl-12 md:pl-0 will-change-transform">
                      {cardContent}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
