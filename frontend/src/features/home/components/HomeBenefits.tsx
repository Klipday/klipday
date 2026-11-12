import { useState, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Video } from 'lucide-react';
import {
  FLOATING_PAYOUT_CHANNELS,
  HOME_BENEFITS_CONTENT,
} from '../constants/home.constants';
import type { HomeBenefitsProps } from '../types';
import { SectionBadge } from './SectionBadge';

gsap.registerPlugin(ScrollTrigger);

/**
 * Modern interactive Bento grid showcasing key clipper and brand benefits.
 * Each card follows the clean Micro-UI visual stage anatomy matching the "Cara Kerja" section:
 * top visual stages for the two 1-column cards, and a 2-column split with right visual stage
 * for the full-width bottom card.
 *
 * @param props - Component properties including activeAudience and optional className.
 * @returns The rendered Benefits section.
 */
export function HomeBenefits({ activeAudience, className = '' }: HomeBenefitsProps) {
  const containerRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const headerTitleRef = useRef<HTMLHeadingElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const isFirstAudienceRender = useRef(true);
  const isCreator = activeAudience === 'creator';
  const benefits = HOME_BENEFITS_CONTENT[activeAudience];

  // Interactive Calculator State
  const [sliderViews, setSliderViews] = useState<number>(50000);
  const [brandBudget, setBrandBudget] = useState<number>(2000000);

  // Live Calculated Values
  const creatorEstimatedCuan = Math.round((sliderViews / 1000) * 12000);
  const brandEstimatedViews = Math.round((brandBudget / 12000) * 1000);

  // Formatted display values
  const formattedCreatorCuan = creatorEstimatedCuan.toLocaleString('id-ID');
  const formattedSliderViews = sliderViews.toLocaleString('id-ID');
  const formattedBrandViews = brandEstimatedViews.toLocaleString('id-ID');
  const formattedBrandBudget = brandBudget.toLocaleString('id-ID');

  // Range track fill percentages for rose-500 track progress
  const creatorSliderPercent = ((sliderViews - 10000) / (500000 - 10000)) * 100;
  const brandSliderPercent = ((brandBudget - 500000) / (10000000 - 500000)) * 100;

  // GSAP ScrollTrigger Entrance
  useGSAP(
    () => {
      const matchMediaInstance = gsap.matchMedia();

      matchMediaInstance.add('(prefers-reduced-motion: no-preference)', () => {
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

        if (gridRef.current) {
          const cards = gridRef.current.querySelectorAll('.bento-card');
          gsap.from(cards, {
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
            y: 35,
            autoAlpha: 0,
            scale: 0.97,
            duration: 0.75,
            stagger: 0.12,
            ease: 'expo.out',
          });
        }
      });

      return () => {
        matchMediaInstance.revert();
      };
    },
    { scope: containerRef }
  );

  // Audience Change Transition
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

  const sectionClasses = `w-full max-w-5xl px-4 sm:px-6 py-16 sm:py-24 scroll-mt-20 ${className}`.trim();
  const cardSurfaceStyle =
    'rounded-3xl bg-zinc-900/50 border border-white/[0.06] overflow-hidden group transition-all duration-300 hover:border-white/15 hover:bg-zinc-900/70';

  return (
    <section ref={containerRef} id="benefit" className={sectionClasses}>
      {/* Section Header */}
      <div ref={headerRef} className="mb-12 sm:mb-16 text-center">
        <SectionBadge className="mb-4">
          {benefits.sectionPill}
        </SectionBadge>
        <h2
          ref={headerTitleRef}
          className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white"
        >
          {benefits.title}
        </h2>
      </div>

      {/* Modern Bento Grid */}
      <div ref={gridRef} className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Card 1 (Top-Left): Interactive CPM / Budget Calculator */}
        <div
          className={`bento-card md:col-span-1 flex flex-col justify-between text-left ${cardSurfaceStyle}`}
        >
          {/* Top Visual Stage */}
          <div className="h-60 m-2 rounded-2xl bg-zinc-950/70 border border-white/[0.04] relative overflow-hidden flex items-center justify-center p-3 sm:p-4">
            {isCreator ? (
              <div className="w-full max-w-[300px] p-3.5 sm:p-4 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-4 shadow-2xl">
                {/* Top Row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-zinc-400 whitespace-nowrap">
                    Estimasi Komisi
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400 whitespace-nowrap tabular-nums">
                    CPM Rp 12.000
                  </span>
                </div>

                {/* Center Display */}
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums whitespace-nowrap">
                  Rp {formattedCreatorCuan}
                </div>

                {/* Bottom Slider Control */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-zinc-400 whitespace-nowrap">
                      Target Views
                    </span>
                    <span className="text-xs font-semibold text-zinc-200 tabular-nums whitespace-nowrap">
                      {formattedSliderViews} Views
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10000}
                    max={500000}
                    step={10000}
                    value={sliderViews}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value);
                      setSliderViews(nextValue);
                    }}
                    style={{
                      background: `linear-gradient(to right, #f43f5e ${creatorSliderPercent}%, #27272a ${creatorSliderPercent}%)`,
                    }}
                    className="w-full h-1.5 rounded-lg appearance-none bg-zinc-800 accent-rose-500 cursor-pointer"
                    aria-label="Target Views"
                  />
                </div>
              </div>
            ) : (
              <div className="w-full max-w-[300px] p-3.5 sm:p-4 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-4 shadow-2xl">
                {/* Top Row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-zinc-400 whitespace-nowrap">
                    Potensi Views Asli
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400 whitespace-nowrap tabular-nums">
                    0 Views = Rp 0
                  </span>
                </div>

                {/* Center Display */}
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums whitespace-nowrap">
                  ~{formattedBrandViews} Views
                </div>

                {/* Bottom Slider Control */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-zinc-400 whitespace-nowrap">
                      Alokasi Budget
                    </span>
                    <span className="text-xs font-semibold text-zinc-200 tabular-nums whitespace-nowrap">
                      Rp {formattedBrandBudget}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={500000}
                    max={10000000}
                    step={500000}
                    value={brandBudget}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value);
                      setBrandBudget(nextValue);
                    }}
                    style={{
                      background: `linear-gradient(to right, #f43f5e ${brandSliderPercent}%, #27272a ${brandSliderPercent}%)`,
                    }}
                    className="w-full h-1.5 rounded-lg appearance-none bg-zinc-800 accent-rose-500 cursor-pointer"
                    aria-label="Alokasi Budget"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Text */}
          <div className="p-6 pt-3">
            <h3 className="mb-2 font-heading text-lg font-bold text-white transition-colors group-hover:text-rose-100">
              {benefits.cpmCard.title}
            </h3>
            <p className="font-normal text-xs sm:text-sm leading-relaxed text-zinc-400">
              {benefits.cpmCard.description}
            </p>
          </div>
        </div>

        {/* Card 2 (Top-Right): FYP Retention Curve (Creator) / 1-to-Many Multiplier (Brand) */}
        <div
          className={`bento-card md:col-span-1 flex flex-col justify-between text-left ${cardSurfaceStyle}`}
        >
          {/* Top Visual Stage */}
          <div className="h-60 m-2 rounded-2xl bg-zinc-950/70 border border-white/[0.04] relative overflow-hidden flex items-center justify-center p-3 sm:p-4">
            {isCreator ? (
              <div className="w-full max-w-[300px] p-3 sm:p-3.5 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2.5 shadow-2xl select-none">
                {/* Top Row: New Account Profile Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                      CB
                    </div>
                    <div className="flex flex-col text-left leading-tight min-w-0">
                      <span className="text-xs font-semibold text-white whitespace-nowrap">
                        @clipper_baru
                      </span>
                      <span className="text-[10px] text-zinc-400 whitespace-nowrap tabular-nums">
                        0 Followers
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-[10px] font-medium text-rose-400 whitespace-nowrap shrink-0">
                    🔥 Tembus FYP
                  </span>
                </div>

                {/* Middle Visual: Animated SVG FYP Retention & View Curve */}
                <div className="h-20 w-full rounded-xl bg-zinc-950/80 border border-white/[0.05] p-2.5 relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] text-zinc-400 whitespace-nowrap">
                      Hook 3 Detik Pertama
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400 tabular-nums whitespace-nowrap">
                      Watch Time 84%
                    </span>
                  </div>

                  <svg
                    viewBox="0 0 240 44"
                    className="w-full h-11 overflow-visible"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="fypRetentionAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#F43F5E" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Area Gradient Fill */}
                    <path
                      d="M 2 38 Q 55 36, 95 28 T 170 13 T 234 5 L 234 44 L 2 44 Z"
                      fill="url(#fypRetentionAreaGradient)"
                    />

                    {/* Animated Bezier Curve */}
                    <motion.path
                      d="M 2 38 Q 55 36, 95 28 T 170 13 T 234 5"
                      fill="none"
                      stroke="#F43F5E"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: false }}
                      transition={{ duration: 1.4, ease: 'easeOut' }}
                    />

                    {/* Pulsing Glowing Dot at (234, 5) */}
                    <motion.circle
                      cx="234"
                      cy="5"
                      r="6"
                      fill="#F43F5E"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.45, 0.12, 0.45],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                    <circle cx="234" cy="5" r="3" fill="#F43F5E" />
                  </svg>
                </div>

                {/* Bottom Row: Instant Payout Conversion Bar */}
                <div className="pt-0.5 flex items-center justify-between gap-2 text-xs whitespace-nowrap">
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="text-[11px] text-zinc-400 whitespace-nowrap">
                      Total Views
                    </span>
                    <span className="text-[11px] font-bold text-white tabular-nums whitespace-nowrap">
                      120.000
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-400 tabular-nums whitespace-nowrap">
                    + Rp 1.440.000
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full max-w-[290px] gap-1.5 sm:gap-2 select-none">
                {/* Left Side: 1 Source Video */}
                <div className="w-[82px] sm:w-24 p-2 sm:p-2.5 rounded-xl bg-zinc-900 border border-white/15 text-center space-y-1 shrink-0 z-10 shadow-xl">
                  <div className="mx-auto size-6 sm:size-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                    <Video className="size-3.5 text-rose-400" />
                  </div>
                  <span className="block text-[9px] sm:text-[10px] font-semibold text-white whitespace-nowrap">
                    1 Video Brand
                  </span>
                  <span className="block text-[8px] text-zinc-400 whitespace-nowrap">
                    Podcast / Produk
                  </span>
                </div>

                {/* Middle: Branching Lines SVG */}
                <svg
                  className="w-6 sm:w-9 h-28 shrink-0 overflow-visible"
                  viewBox="0 0 40 112"
                  fill="none"
                  aria-hidden="true"
                >
                  {/* Base static lines */}
                  <path
                    d="M 0 56 C 18 56, 22 18, 40 18"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 0 56 L 40 56"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 0 56 C 18 56, 22 94, 40 94"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="1.5"
                  />

                  {/* Animated pulsing strokes */}
                  <motion.path
                    d="M 0 56 C 18 56, 22 18, 40 18"
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0.2 }}
                    animate={{ pathLength: [0, 1, 1], opacity: [0.2, 1, 0] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.path
                    d="M 0 56 L 40 56"
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0.2 }}
                    animate={{ pathLength: [0, 1, 1], opacity: [0.2, 1, 0] }}
                    transition={{
                      duration: 2.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 0.3,
                    }}
                  />
                  <motion.path
                    d="M 0 56 C 18 56, 22 94, 40 94"
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0.2 }}
                    animate={{ pathLength: [0, 1, 1], opacity: [0.2, 1, 0] }}
                    transition={{
                      duration: 2.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 0.6,
                    }}
                  />
                </svg>

                {/* Right Side: 3 Clipper Outputs */}
                <div className="space-y-1.5 flex-1 min-w-0 max-w-[132px]">
                  <div className="px-2 py-1.5 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-between gap-1 text-[9px] sm:text-[10px] whitespace-nowrap">
                    <span className="text-zinc-200 whitespace-nowrap">🎬 Hook A</span>
                    <span className="text-emerald-400 font-mono tabular-nums whitespace-nowrap">
                      84K Views
                    </span>
                  </div>
                  <div className="px-2 py-1.5 rounded-lg bg-zinc-900 border border-rose-500/40 bg-rose-500/5 flex items-center justify-between gap-1 text-[9px] sm:text-[10px] whitespace-nowrap">
                    <span className="text-white font-medium whitespace-nowrap">🎬 Hook B</span>
                    <span className="text-emerald-400 font-mono tabular-nums whitespace-nowrap">
                      142K Views
                    </span>
                  </div>
                  <div className="px-2 py-1.5 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-between gap-1 text-[9px] sm:text-[10px] whitespace-nowrap">
                    <span className="text-zinc-200 whitespace-nowrap">🎬 Hook C</span>
                    <span className="text-emerald-400 font-mono tabular-nums whitespace-nowrap">
                      61K Views
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Text */}
          <div className="p-6 pt-3">
            <h3 className="mb-2 font-heading text-lg font-bold text-white transition-colors group-hover:text-rose-100">
              {benefits.followersCard.title}
            </h3>
            <p className="font-normal text-xs sm:text-sm leading-relaxed text-zinc-400">
              {benefits.followersCard.description}
            </p>
          </div>
        </div>

        {/* Card 3 (Bottom Full-Width): Floating Payout & Bank Pills (Creator) / Escrow Checklist (Brand) */}
        <div className={`bento-card md:col-span-2 text-left ${cardSurfaceStyle}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-center p-3">
            {/* Left Column: ONLY Title + Description */}
            <div className="lg:col-span-5 p-3 sm:p-4">
              <h3 className="mb-2 font-heading text-lg sm:text-xl font-bold text-white transition-colors group-hover:text-rose-100">
                {benefits.payoutCard.title}
              </h3>
              <p className="font-normal text-xs sm:text-sm leading-relaxed text-zinc-400">
                {benefits.payoutCard.description}
              </p>
            </div>

            {/* Right Column: Micro-UI Visual Stage */}
            <div className="lg:col-span-7 h-60 rounded-2xl bg-zinc-950/70 border border-white/[0.04] relative overflow-hidden flex items-center justify-center p-3 sm:p-4">
              {isCreator ? (
                <div className="relative w-full h-full flex items-center justify-center select-none">
                  {/* Central Sleek Payout Card */}
                  <div className="w-44 sm:w-52 p-3 rounded-2xl bg-zinc-900 border border-white/15 shadow-2xl z-10 text-center space-y-1">
                    <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block whitespace-nowrap">
                      ✓ Tanpa Tunggu Akhir Bulan
                    </span>
                    <div className="text-lg sm:text-xl font-extrabold text-white tracking-tight tabular-nums whitespace-nowrap">
                      Min. Rp 50.000
                    </div>
                    <div className="text-[10px] text-zinc-400 whitespace-nowrap">
                      Langsung cair otomatis
                    </div>
                  </div>

                  {/* 6 Floating Bank & E-Wallet Pills */}
                  {FLOATING_PAYOUT_CHANNELS.map((channel) => (
                    <motion.div
                      key={channel.id}
                      animate={{ y: [0, -4, 0] }}
                      transition={{
                        duration: 3.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: channel.delay,
                      }}
                      className={`absolute ${channel.positionClassName} flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-zinc-200 bg-zinc-900/95 border border-white/10 px-2.5 sm:px-3 py-1 rounded-full shadow-lg whitespace-nowrap`}
                    >
                      <span className={`size-1.5 rounded-full ${channel.dotClassName} shrink-0`} />
                      <span>{channel.label}</span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="relative w-full h-full flex flex-col items-center justify-center gap-2.5 select-none">
                  {/* Sleek Dark Checklist Card */}
                  <div className="w-full max-w-[280px] p-3.5 sm:p-4 rounded-2xl bg-zinc-900/95 border border-white/10 space-y-2.5 shadow-2xl">
                    <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 whitespace-nowrap">
                      🛡️ Proteksi Rekber Klipday
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[11px] text-zinc-200 py-1 border-b border-white/[0.05] whitespace-nowrap">
                        <span>Dana Terkunci Aman</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-white shrink-0" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-200 py-1 border-b border-white/[0.05] whitespace-nowrap">
                        <span>Potong Cuma Views Valid</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-white shrink-0" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-200 py-1 border-b border-white/[0.05] whitespace-nowrap">
                        <span>Auto-Refund 100% Sisa Saldo</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                      </div>
                    </div>
                  </div>

                  {/* Floating Pill Button + Animated SVG Mouse Cursor */}
                  <div className="relative flex items-center justify-center">
                    <motion.div
                      animate={{
                        scale: [1, 1, 0.94, 1.03, 1],
                      }}
                      transition={{
                        duration: 4.2,
                        repeat: Infinity,
                        times: [0, 0.35, 0.48, 0.72, 1],
                        ease: 'easeInOut',
                      }}
                      className="px-3.5 py-1 rounded-full bg-zinc-100 text-zinc-950 text-[10px] font-semibold shadow-md whitespace-nowrap"
                    >
                      ✓ 100% Bebas Risiko Boncos
                    </motion.div>

                    <motion.svg
                      animate={{
                        x: [65, 42, 42, 42, 65],
                        y: [18, 6, 6, 6, 18],
                        scale: [1, 1, 0.86, 1, 1],
                        opacity: [0, 1, 1, 1, 0],
                      }}
                      transition={{
                        duration: 4.2,
                        repeat: Infinity,
                        times: [0, 0.35, 0.48, 0.72, 1],
                        ease: 'easeInOut',
                      }}
                      className="pointer-events-none absolute z-20 size-5 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="black"
                      strokeWidth="1.5"
                    >
                      <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36z" />
                    </motion.svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
