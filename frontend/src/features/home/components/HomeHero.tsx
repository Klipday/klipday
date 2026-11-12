import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import {
  HERO_LEFT_VIDEO_CLIPS,
  HERO_RIGHT_PAYOUT_CARDS,
  HOME_HERO_CONTENT,
} from '../constants/home.constants';
import { UseMagneticHover } from '../hooks';
import type { AudienceType, HomeHeroProps } from '../types';

gsap.registerPlugin(ScrollTrigger);

/**
 * Renders a crisp miniature QR verification badge for payout share cards.
 *
 * @returns The rendered SVG QR square.
 */
function MiniQrBadge() {
  return (
    <div className="size-4 sm:size-5 rounded-[3px] bg-white p-[2px] shrink-0 shadow-sm">
      <svg viewBox="0 0 16 16" className="w-full h-full fill-zinc-950" aria-hidden="true">
        <path d="M1 1h5v5H1V1zm1 1v3h3V2H2zm8-1h5v5h-5V1zm1 1v3h3V2h-3zM1 10h5v5H1v-5zm1 1v3h3v-3H2zm8-1h2v2h-2v-2zm3 0h2v2h-2v-2zm-3 3h2v2h-2v-2zm3 1h2v1h-2v-1zM7 2h2v2H7V2zm0 4h2v3H7V6zm0 5h2v4H7v-4z" />
      </svg>
    </div>
  );
}

/**
 * Full-Screen (100svh) Volumetric Pipeline Hero for Klipday.
 * Features diagonal volumetric light rays, clean centered display typography (without social proof badge clutter),
 * and a large 7-card horizontal transformation pipeline:
 * 3 Full-Bleed 9:16 Video Frames -> Monumental Glowing Klipday Monolith -> 3 Unified Payout Share-Cards.
 *
 * @param props - Component properties with active audience state and toggle handler.
 * @returns The rendered Full-Screen Hero section.
 */
export function HomeHero({ activeAudience, onAudienceChange, className = '' }: HomeHeroProps) {
  const containerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const creatorBtnRef = useRef<HTMLButtonElement>(null);
  const brandBtnRef = useRef<HTMLButtonElement>(null);
  const headlineLine1Ref = useRef<HTMLDivElement>(null);
  const headlineLine2Ref = useRef<HTMLDivElement>(null);
  const subcopyRef = useRef<HTMLParagraphElement>(null);
  const ctaGroupRef = useRef<HTMLDivElement>(null);
  const pipelineStageRef = useRef<HTMLDivElement>(null);
  const ctaBtnRef = UseMagneticHover<HTMLAnchorElement>({ maxPull: 4, strength: 0.22 });
  const isFirstAudienceRender = useRef(true);

  // Live ticking payout simulation on the outer right share-card
  const [livePayout, setLivePayout] = useState(3049994);

  const isCreator = activeAudience === 'creator';
  const heroData = HOME_HERO_CONTENT[activeAudience];
  const formattedLivePayout = `+Rp${livePayout.toLocaleString('id-ID')}`;

  useEffect(() => {
    const interval = setInterval(() => {
      setLivePayout((prev) => prev + Math.floor(Math.random() * 1200) + 240);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  // GSAP Entrance Choreography
  useGSAP(
    () => {
      const matchMediaInstance = gsap.matchMedia();

      matchMediaInstance.add('(prefers-reduced-motion: no-preference)', () => {
        const masterTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

        if (toggleRef.current) {
          masterTimeline.from(toggleRef.current, {
            y: -14,
            autoAlpha: 0,
            scale: 0.95,
            duration: 0.45,
          });
        }

        const headlineLines = [headlineLine1Ref.current, headlineLine2Ref.current].filter(Boolean);
        if (headlineLines.length > 0) {
          masterTimeline.from(
            headlineLines,
            {
              yPercent: 100,
              autoAlpha: 0,
              stagger: 0.09,
              duration: 0.68,
              ease: 'expo.out',
            },
            '-=0.2'
          );
        }

        const cascadeItems = [subcopyRef.current, ctaGroupRef.current].filter(Boolean);
        if (cascadeItems.length > 0) {
          masterTimeline.from(
            cascadeItems,
            {
              y: 18,
              autoAlpha: 0,
              stagger: 0.08,
              duration: 0.55,
            },
            '-=0.35'
          );
        }

        if (pipelineStageRef.current) {
          masterTimeline.from(
            pipelineStageRef.current,
            {
              y: 36,
              autoAlpha: 0,
              scale: 0.96,
              duration: 0.85,
              ease: 'power3.out',
            },
            '-=0.35'
          );
        }
      });

      return () => {
        matchMediaInstance.revert();
      };
    },
    { scope: containerRef }
  );

  // Audience Switching (Creator <-> Brand) Morph
  useGSAP(
    () => {
      if (indicatorRef.current && creatorBtnRef.current && brandBtnRef.current) {
        const targetBtn = isCreator ? creatorBtnRef.current : brandBtnRef.current;
        const targetOffsetLeft = targetBtn.offsetLeft;
        const targetWidth = targetBtn.offsetWidth;

        gsap.to(indicatorRef.current, {
          x: targetOffsetLeft - 4,
          width: targetWidth,
          duration: 0.38,
          ease: 'power4.out',
        });
      }

      if (isFirstAudienceRender.current) {
        isFirstAudienceRender.current = false;
        return;
      }

      const elementsToMorph = [
        headlineLine1Ref.current,
        headlineLine2Ref.current,
        subcopyRef.current,
        ctaBtnRef.current,
        pipelineStageRef.current,
      ].filter(Boolean);

      if (elementsToMorph.length > 0) {
        gsap.fromTo(
          elementsToMorph,
          { y: 12, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            stagger: 0.035,
            duration: 0.42,
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

  const heroClasses = `w-full min-h-[calc(100svh-6.75rem)] hero-glow pt-6 pb-8 sm:pt-12 sm:pb-12 px-3 sm:px-6 flex flex-col items-center justify-between text-center relative overflow-hidden ${className}`.trim();

  return (
    <section ref={containerRef} className={heroClasses} data-enter>
      {/* VOLUMETRIC LIGHT RAYS (Diagonal Spotlight Beams) */}
      <div
        className="pointer-events-none absolute -top-36 -left-24 w-[320px] sm:w-[560px] h-[240px] sm:h-[340px] -rotate-[28deg] rounded-full bg-gradient-to-r from-rose-500/22 via-rose-500/8 to-transparent blur-[95px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-20 left-[14%] w-[260px] sm:w-[440px] h-[200px] sm:h-[260px] -rotate-[32deg] rounded-full bg-gradient-to-r from-rose-400/14 via-rose-500/6 to-transparent blur-[85px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-36 -right-24 w-[320px] sm:w-[560px] h-[240px] sm:h-[340px] rotate-[28deg] rounded-full bg-gradient-to-l from-rose-500/18 via-rose-600/6 to-transparent blur-[95px]"
        aria-hidden="true"
      />

      {/* TOP CONTENT BLOCK: Switcher + Display Headline + Subcopy + CTAs */}
      <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto w-full">
        {/* 1. Segmented Role Switcher */}
        <div
          ref={toggleRef}
          className="relative mb-4 sm:mb-5 inline-flex h-9 items-center rounded-full border border-white/12 bg-zinc-900/90 p-1 shadow-lg backdrop-blur-md"
          role="tablist"
          aria-label="Role switcher"
        >
          <div
            ref={indicatorRef}
            className="pointer-events-none absolute top-1 bottom-1 left-1 w-24 rounded-full bg-white shadow-sm will-change-transform"
            aria-hidden="true"
          />

          <button
            ref={creatorBtnRef}
            type="button"
            role="tab"
            aria-selected={isCreator}
            onClick={() => HandleToggle('creator')}
            className={`relative z-10 w-24 cursor-pointer rounded-full py-1 text-center text-xs font-semibold transition-colors duration-200 ${
              isCreator ? 'text-zinc-950' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Creator
          </button>
          <button
            ref={brandBtnRef}
            type="button"
            role="tab"
            aria-selected={!isCreator}
            onClick={() => HandleToggle('brand')}
            className={`relative z-10 w-24 cursor-pointer rounded-full py-1 text-center text-xs font-semibold transition-colors duration-200 ${
              !isCreator ? 'text-zinc-950' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Brand
          </button>
        </div>

        {/* 2. Commanding Display Headline */}
        <h1 className="mb-3 sm:mb-4 font-heading text-3xl sm:text-5xl md:text-6xl lg:text-[66px] font-bold leading-[1.06] tracking-tight text-white">
          <div className="overflow-hidden py-0.5">
            <div ref={headlineLine1Ref} className="will-change-transform">
              {heroData.headlineLead}
            </div>
          </div>
          <div className="overflow-hidden py-0.5">
            <div
              ref={headlineLine2Ref}
              className="will-change-transform bg-gradient-to-r from-rose-500 via-rose-400 to-orange-400 bg-clip-text text-transparent"
            >
              {heroData.headlineHighlight}
            </div>
          </div>
        </h1>

        {/* 3. Concise Value Proposition */}
        <p
          ref={subcopyRef}
          className="mx-auto mb-5 sm:mb-6 max-w-xl text-xs sm:text-base leading-relaxed text-zinc-400 px-2"
        >
          {heroData.subcopy}
        </p>

        {/* 4. Action Buttons */}
        <div
          ref={ctaGroupRef}
          className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5"
        >
          <Link
            ref={ctaBtnRef}
            to={heroData.ctaHref}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-rose-500 to-rose-600 px-5 sm:px-7 py-2.5 sm:py-3 text-xs sm:text-base font-semibold text-white shadow-[0_0_28px_rgba(244,63,94,0.4)] transition-all duration-200 hover:from-rose-400 hover:to-rose-500 active:scale-[0.98]"
          >
            <span>{heroData.ctaLabel}</span>
            <ArrowRight className="size-3.5 sm:size-4" />
          </Link>
          <a
            href="#cara-kerja"
            className="inline-flex items-center rounded-full border border-white/12 bg-zinc-900/85 px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-base font-medium text-zinc-200 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <span>Jelajahi Campaign</span>
          </a>
        </div>
      </div>

      {/* BOTTOM 7-CARD HORIZONTAL PIPELINE STAGE (Clippo-Scale Clean Architecture) */}
      <div
        ref={pipelineStageRef}
        className="relative z-10 mt-6 sm:mt-10 w-full max-w-7xl mx-auto flex items-center justify-center select-none"
      >
        {/* Full-Width Horizontal Energy Beam */}
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-14 bg-gradient-to-r from-rose-600/5 via-rose-500/35 to-rose-600/5 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 bg-gradient-to-r from-transparent via-rose-500/55 to-transparent blur-sm"
          aria-hidden="true"
        />

        {/* Intense Left & Right White-Rose Portal Flares Flanking the Center Monolith */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-[74px] sm:-translate-x-[118px] xl:-translate-x-[132px] -translate-y-1/2 w-16 sm:w-20 h-24 sm:h-32 rounded-full bg-rose-300/60 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 translate-x-[18px] sm:translate-x-[38px] xl:translate-x-[52px] -translate-y-1/2 w-16 sm:w-20 h-24 sm:h-32 rounded-full bg-rose-300/60 blur-2xl"
          aria-hidden="true"
        />

        {/* 7-CARD ROW */}
        <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-2.5 xl:gap-3.5 w-full max-w-full">
          {/* LEFT WING: 3 Full-Bleed 9:16 Video Clip Frames */}
          {HERO_LEFT_VIDEO_CLIPS.map((clip) => (
            <motion.div
              key={clip.id}
              animate={{ y: [0, -5, 0] }}
              transition={{
                duration: 4.4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: clip.delay,
              }}
              className={`${clip.sizeClassName} rounded-2xl p-1 sm:p-1.5 bg-zinc-900/90 border border-white/12 shadow-[0_20px_50px_rgba(0,0,0,0.85)] shrink-0`}
            >
              <div className="relative w-full h-full rounded-[11px] overflow-hidden bg-zinc-950">
                <img
                  src={clip.imageSrc}
                  alt={clip.handle}
                  loading="eager"
                  className="w-full h-full object-cover object-center brightness-90 contrast-110"
                />

                {/* Top & Bottom Cinema Vignette */}
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/40"
                  aria-hidden="true"
                />

                {/* Top Watermark Handle */}
                <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between">
                  <span className="text-[7px] sm:text-[8px] font-medium text-white/75 drop-shadow whitespace-nowrap truncate">
                    {clip.handle}
                  </span>
                </div>

                {/* Burned-In TikTok Subtitle Overlay at Bottom */}
                <div className="absolute inset-x-1 bottom-2 flex flex-col items-center text-center leading-tight">
                  <span className="text-[8px] sm:text-[10px] font-extrabold uppercase tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] whitespace-nowrap">
                    {clip.captionLead}
                  </span>
                  <span className="mt-0.5 px-1 sm:px-1.5 py-0.2 rounded-[3px] bg-amber-400 text-[8px] sm:text-[10px] font-black uppercase tracking-tight text-zinc-950 shadow-sm whitespace-nowrap">
                    {clip.captionHighlight}
                  </span>
                  {clip.timecode && (
                    <span className="mt-0.5 text-[7px] sm:text-[8px] font-mono text-white/60 tracking-wider whitespace-nowrap">
                      {clip.timecode}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* CENTERPIECE: MONUMENTAL GLOWING KLIPDAY MONOLITH (Zero Text Clutter) */}
          <motion.div
            animate={{ scale: [1, 1.018, 1] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
            className="relative z-20 w-[114px] h-[162px] sm:w-[164px] sm:h-[232px] md:w-[152px] md:h-[216px] lg:w-[156px] lg:h-[222px] xl:w-[192px] xl:h-[268px] rounded-2xl sm:rounded-3xl p-1.5 sm:p-2 bg-zinc-900/90 border border-white/15 shadow-[0_0_75px_rgba(244,63,94,0.45)] shrink-0"
          >
            <div className="relative w-full h-full rounded-xl sm:rounded-2xl overflow-hidden border border-rose-300/30 bg-gradient-to-b from-rose-500 via-rose-600/85 to-zinc-950 flex items-center justify-center">
              {/* Top-Left Specular Light Sheen */}
              <div
                className="pointer-events-none absolute -top-12 -left-12 size-36 sm:size-44 rounded-full bg-white/25 blur-2xl"
                aria-hidden="true"
              />
              {/* Bottom Deep Vignette */}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent"
                aria-hidden="true"
              />

              {/* Giant Geometric Klipday "K." Vector Emblem */}
              <div className="relative z-10 flex items-center justify-center">
                <span className="font-heading text-4xl sm:text-6xl xl:text-7xl font-black tracking-tighter text-white drop-shadow-[0_10px_28px_rgba(0,0,0,0.55)]">
                  K<span className="text-rose-200">.</span>
                </span>
              </div>
            </div>
          </motion.div>

          {/* RIGHT WING: 3 Unified Payout Share-Cards (Small -> Medium -> Large) */}
          {HERO_RIGHT_PAYOUT_CARDS.map((card) => {
            const primaryReadout = isCreator
              ? card.isLive
                ? formattedLivePayout
                : card.creatorAmount
              : card.brandMetric;

            return (
              <motion.div
                key={card.id}
                animate={{ y: [0, 5, 0] }}
                transition={{
                  duration: 4.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: card.delay,
                }}
                className={`${card.sizeClassName} rounded-2xl border border-white/15 bg-gradient-to-b from-rose-950/75 via-zinc-950 to-black overflow-hidden flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.85)] shrink-0 relative`}
              >
                {/* Subtle Center Radial Glow */}
                <div
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(244,63,94,0.22)_0%,transparent_70%)]"
                  aria-hidden="true"
                />

                {/* Top Mini Header Bar */}
                <div className="relative z-10 flex items-center justify-between px-2 sm:px-2.5 pt-2 sm:pt-2.5">
                  <div className="flex items-center gap-1">
                    <span className="font-heading text-[8px] sm:text-[9px] font-black text-white tracking-tight">
                      Klipday<span className="text-rose-500">.</span>
                    </span>
                  </div>
                  <span className="text-[6px] sm:text-[7px] font-mono uppercase tracking-wider text-zinc-400 whitespace-nowrap">
                    {isCreator ? 'VERIFIED' : 'REKBER'}
                  </span>
                </div>

                {/* Upper-Middle Giant Payout Readout */}
                <div className="relative z-10 px-1.5 sm:px-2 text-center space-y-0.5">
                  <span className="block text-[6px] sm:text-[8px] text-zinc-300/90 whitespace-nowrap">
                    {isCreator ? 'Total Pendapatan' : 'Total Penayangan Asli'}
                  </span>
                  <div
                    className={`font-heading ${card.amountClassName} font-black text-white tracking-tight tabular-nums whitespace-nowrap drop-shadow`}
                  >
                    {primaryReadout}
                  </div>
                  <span className="block text-[5.5px] sm:text-[7px] font-mono text-zinc-400 whitespace-nowrap">
                    {card.period}
                  </span>
                </div>

                {/* Center Glossy 3D "K." Watermark Emblem */}
                <div className="relative z-10 my-auto flex items-center justify-center">
                  <div
                    className={`${card.emblemSizeClassName} -rotate-6 rounded-lg sm:rounded-xl bg-gradient-to-br from-rose-400/30 via-rose-500/20 to-zinc-900/80 border border-rose-300/30 shadow-[0_0_25px_rgba(244,63,94,0.35)] flex items-center justify-center backdrop-blur-sm`}
                  >
                    <span className="font-heading text-sm sm:text-xl font-black text-white/90 drop-shadow">
                      K<span className="text-rose-300">.</span>
                    </span>
                  </div>
                </div>

                {/* Bottom Dark Footer Strip with Handle + Mini QR Square */}
                <div className="relative z-10 bg-black/85 border-t border-white/[0.07] px-2 sm:px-2.5 py-1 sm:py-1.5 flex items-center justify-between gap-1 text-left">
                  <div className="flex items-center gap-1 min-w-0">
                    <div className="size-3 sm:size-3.5 rounded-full bg-zinc-800 border border-white/15 flex items-center justify-center text-[5px] sm:text-[6px] font-bold text-white shrink-0">
                      K
                    </div>
                    <div className="flex flex-col leading-none min-w-0">
                      <span className="text-[6.5px] sm:text-[8px] font-semibold text-zinc-200 truncate whitespace-nowrap">
                        {card.handle}
                      </span>
                      <span className="text-[5.5px] sm:text-[6px] font-mono text-zinc-400 whitespace-nowrap mt-0.5 truncate">
                        {card.dateLabel}
                      </span>
                    </div>
                  </div>
                  <MiniQrBadge />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
