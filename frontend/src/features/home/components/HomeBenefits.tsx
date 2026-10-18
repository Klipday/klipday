import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HOME_BENEFITS_CONTENT } from '../constants/home.constants';
import type { HomeBenefitsProps } from '../types';
import { BlendedIllustration } from './BlendedIllustration';

gsap.registerPlugin(ScrollTrigger);

/**
 * Modern minimalist Bento grid showcasing key clipper or brand benefits.
 * Features Linear-style top-right radial mesh gradients, 1px specular top highlights,
 * interactive 60fps cursor spotlights via gsap.quickTo, 3D illustration tilt,
 * and reactive audience crossfades without visual clutter.
 *
 * @param props - Component properties including activeAudience.
 * @returns The rendered Benefits section.
 */
export function HomeBenefits({ activeAudience, className = '' }: HomeBenefitsProps) {
  const containerRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const headerTitleRef = useRef<HTMLHeadingElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Card 1 refs
  const card1Ref = useRef<HTMLDivElement>(null);
  const spotlight1Ref = useRef<HTMLDivElement>(null);
  const illu1Ref = useRef<HTMLDivElement>(null);

  // Card 2 refs
  const card2Ref = useRef<HTMLDivElement>(null);
  const spotlight2Ref = useRef<HTMLDivElement>(null);
  const illu2Ref = useRef<HTMLDivElement>(null);

  // Card 3 refs
  const card3Ref = useRef<HTMLDivElement>(null);
  const spotlight3Ref = useRef<HTMLDivElement>(null);
  const illu3Ref = useRef<HTMLDivElement>(null);

  const isFirstAudienceRender = useRef(true);
  const benefits = HOME_BENEFITS_CONTENT[activeAudience];

  // GSAP ScrollTrigger Entrance & Cursor Spotlight Tracking
  useGSAP(
    () => {
      const matchMediaInstance = gsap.matchMedia();

      matchMediaInstance.add('(prefers-reduced-motion: no-preference)', () => {
        // 1. Header Reveal Timeline
        if (headerRef.current) {
          gsap.from(headerRef.current, {
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
            y: 25,
            autoAlpha: 0,
            duration: 0.7,
            ease: 'power3.out',
          });
        }

        // 2. Bento Cards Staggered Batch Entrance
        if (gridRef.current) {
          const cards = gridRef.current.querySelectorAll('.bento-card');
          gsap.from(cards, {
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
            y: 40,
            autoAlpha: 0,
            scale: 0.97,
            duration: 0.75,
            stagger: 0.12,
            ease: 'expo.out',
          });
        }

        /**
         * Sets up 60fps cursor-following radial spotlight and gentle 3D tilt.
         *
         * @param cardEl - Bento card container element.
         * @param spotlightEl - Radial gradient spotlight element.
         * @param illuEl - Inner 3D illustration element for parallax tilt.
         * @returns Cleanup callback removing event listeners.
         */
        const SetupCardInteractivity = (
          cardEl: HTMLElement | null,
          spotlightEl: HTMLElement | null,
          illuEl: HTMLElement | null
        ) => {
          if (!cardEl || !spotlightEl) return;

          const quickX = gsap.quickTo(spotlightEl, 'x', { duration: 0.2, ease: 'power2.out' });
          const quickY = gsap.quickTo(spotlightEl, 'y', { duration: 0.2, ease: 'power2.out' });
          const quickTiltX = illuEl ? gsap.quickTo(illuEl, 'x', { duration: 0.35, ease: 'power2.out' }) : null;
          const quickTiltY = illuEl ? gsap.quickTo(illuEl, 'y', { duration: 0.35, ease: 'power2.out' }) : null;

          /**
           * Moves radial spotlight and tilts/scales inner visual stage on mouse move.
           *
           * @param event - Mouse move event.
           * @returns void
           */
          const HandleMouseMove = (event: MouseEvent) => {
            const rect = cardEl.getBoundingClientRect();
            const relX = event.clientX - rect.left;
            const relY = event.clientY - rect.top;

            // Center of 500px diameter spotlight (250px radius) directly under cursor
            quickX(relX - 250);
            quickY(relY - 250);
            gsap.to(spotlightEl, { autoAlpha: 1, duration: 0.2 });

            if (quickTiltX && quickTiltY) {
              const centerX = rect.width / 2;
              const centerY = rect.height / 2;
              quickTiltX((relX - centerX) * 0.03);
              quickTiltY((relY - centerY) * 0.03);
            }

            if (illuEl) {
              gsap.to(illuEl, { scale: 1.03, duration: 0.3, ease: 'power2.out' });
            }
          };

          /**
           * Resets spotlight opacity and centers/scales visual stage on mouse leave.
           *
           * @returns void
           */
          const HandleMouseLeave = () => {
            gsap.to(spotlightEl, { autoAlpha: 0, duration: 0.35 });
            if (illuEl) {
              gsap.to(illuEl, { x: 0, y: 0, scale: 1, duration: 0.6, ease: 'power2.out' });
            }
          };

          cardEl.addEventListener('mousemove', HandleMouseMove);
          cardEl.addEventListener('mouseleave', HandleMouseLeave);

          return () => {
            cardEl.removeEventListener('mousemove', HandleMouseMove);
            cardEl.removeEventListener('mouseleave', HandleMouseLeave);
          };
        };

        const cleanup1 = SetupCardInteractivity(card1Ref.current, spotlight1Ref.current, illu1Ref.current);
        const cleanup2 = SetupCardInteractivity(card2Ref.current, spotlight2Ref.current, illu2Ref.current);
        const cleanup3 = SetupCardInteractivity(card3Ref.current, spotlight3Ref.current, illu3Ref.current);

        return () => {
          cleanup1?.();
          cleanup2?.();
          cleanup3?.();
        };
      });

      return () => {
        matchMediaInstance.revert();
      };
    },
    { scope: containerRef }
  );

  // Audience Change (Creator <-> Brand) Transition
  useGSAP(
    () => {
      if (isFirstAudienceRender.current) {
        isFirstAudienceRender.current = false;
        return;
      }

      const cards = gridRef.current?.querySelectorAll('.bento-card');
      if (cards && cards.length > 0) {
        gsap.fromTo(
          cards,
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

  const sectionClasses = `w-full max-w-5xl px-6 py-20 border-t border-white/5 scroll-mt-20 ${className}`.trim();
  const cardGradientStyle =
    'bg-[radial-gradient(120%_100%_at_100%_0%,rgba(225,29,72,0.13)_0%,rgba(18,18,18,0.95)_55%,#0D0D0D_100%)]';
  const cardBorderStyle =
    'border border-white/[0.06] border-t-white/15 hover:border-rose-500/35';

  return (
    <section ref={containerRef} id="benefit" className={sectionClasses}>
      {/* Section Header */}
      <div ref={headerRef} className="mb-16 text-center">
        <span className="mb-3 inline-block rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 font-medium text-xs text-rose-400 uppercase tracking-wider">
          {benefits.sectionPill}
        </span>
        <h2
          ref={headerTitleRef}
          className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl"
        >
          {benefits.title}
        </h2>
      </div>

      {/* Clean Minimalist Bento Grid */}
      <div ref={gridRef} className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* B1 (Top Left): Rate CPM Jelas di Depan / Gak Ada Views, Gak Bayar */}
        <div
          ref={card1Ref}
          className={`bento-card group relative flex flex-col justify-between overflow-hidden rounded-2xl p-7 md:p-8 text-left transition-colors duration-300 shadow-xl ${cardGradientStyle} ${cardBorderStyle}`}
        >
          {/* Mouse-Tracking Spotlight (250px radius) */}
          <div
            ref={spotlight1Ref}
            className="pointer-events-none absolute size-[500px] rounded-full bg-rose-500/12 blur-3xl opacity-0 will-change-transform"
            aria-hidden="true"
          />

          <div className="relative z-10">
            <span className="mb-2 block font-mono text-xs uppercase tracking-wider text-rose-400/90">
              {benefits.cpmCard.overline}
            </span>
            <h3 className="mb-2 font-heading font-bold text-2xl text-white transition-colors group-hover:text-rose-100">
              {benefits.cpmCard.title}
            </h3>
            <p className="font-normal text-sm leading-relaxed text-zinc-400">
              {benefits.cpmCard.description}
            </p>
          </div>

          {/* 3D Dark-Glass Illustration Stage */}
          <div ref={illu1Ref} className="relative my-4 flex h-52 w-full items-center justify-center will-change-transform">
            <BlendedIllustration
              src={benefits.cpmCard.imageSrc}
              alt={benefits.cpmCard.title}
              className="h-full w-full py-1"
            />
          </div>
        </div>

        {/* B2 (Top Right): Modal Skill Edit, Bukan Nama Besar / Satu Produk, Ratusan Gaya Hook */}
        <div
          ref={card2Ref}
          className={`bento-card group relative flex flex-col justify-between overflow-hidden rounded-2xl p-7 md:p-8 text-left transition-colors duration-300 shadow-xl ${cardGradientStyle} ${cardBorderStyle}`}
        >
          {/* Mouse-Tracking Spotlight (250px radius) */}
          <div
            ref={spotlight2Ref}
            className="pointer-events-none absolute size-[500px] rounded-full bg-rose-500/12 blur-3xl opacity-0 will-change-transform"
            aria-hidden="true"
          />

          <div className="relative z-10">
            <span className="mb-2 block font-mono text-xs uppercase tracking-wider text-rose-400/90">
              {benefits.followersCard.overline}
            </span>
            <h3 className="mb-2 font-heading font-bold text-2xl text-white transition-colors group-hover:text-rose-100">
              {benefits.followersCard.title}
            </h3>
            <p className="font-normal text-sm leading-relaxed text-zinc-400">
              {benefits.followersCard.description}
            </p>
          </div>

          {/* 3D Dark-Glass Illustration Stage */}
          <div ref={illu2Ref} className="relative my-4 flex h-52 w-full items-center justify-center will-change-transform">
            <BlendedIllustration
              src={benefits.followersCard.imageSrc}
              alt={benefits.followersCard.title}
              className="h-full w-full py-1"
            />
          </div>
        </div>

        {/* B3 (Bottom Wide Card): Cair Cepat, Tanpa Drama / Budget Dijamin Anti-Boncos */}
        <div
          ref={card3Ref}
          className={`bento-card group relative overflow-hidden rounded-2xl p-7 md:p-8 text-left transition-colors duration-300 shadow-xl md:col-span-2 ${cardGradientStyle} ${cardBorderStyle}`}
        >
          {/* Mouse-Tracking Spotlight (250px radius) */}
          <div
            ref={spotlight3Ref}
            className="pointer-events-none absolute size-[500px] rounded-full bg-rose-500/12 blur-3xl opacity-0 will-change-transform"
            aria-hidden="true"
          />

          <div className="relative z-10 grid grid-cols-1 items-center gap-6 md:grid-cols-12">
            {/* Left 7 Cols: Copywriting */}
            <div className="md:col-span-7">
              <span className="mb-2 block font-mono text-xs uppercase tracking-wider text-rose-400/90">
                {benefits.payoutCard.overline}
              </span>
              <h3 className="mb-2 font-heading font-bold text-2xl text-white transition-colors group-hover:text-rose-100">
                {benefits.payoutCard.title}
              </h3>
              <p className="font-normal text-sm leading-relaxed text-zinc-400">
                {benefits.payoutCard.description}
              </p>
            </div>

            {/* Right 5 Cols: Floating 3D Illustration Bridge */}
            <div
              ref={illu3Ref}
              className="flex h-48 w-full items-center justify-center md:col-span-5 md:h-56 will-change-transform"
            >
              <BlendedIllustration
                src={benefits.payoutCard.imageSrc}
                alt={benefits.payoutCard.title}
                className="h-full w-full py-1"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
