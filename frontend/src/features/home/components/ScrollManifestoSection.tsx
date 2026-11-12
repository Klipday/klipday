import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { HOME_MANIFESTO_CONTENT } from '../constants/home.constants';
import type { ScrollManifestoSectionProps } from '../types';

/**
 * Scroll-pinned Manifesto Interlude section positioned between the Benefit and FAQ sections.
 * Features a dark-mode TernakKlip-inspired uncoiling blurred SVG ribbon background
 * and a 3-line staggered diagonal billboard typography layout driven purely by
 * Framer Motion's `useScroll` and `useTransform` (no `whileInView` or `IntersectionObserver`).
 *
 * @param props - Component properties including activeTab ('creator' | 'brand') and optional className.
 * @returns The rendered scroll-pinned Manifesto section.
 */
export function ScrollManifestoSection({
  activeTab,
  className = '',
}: ScrollManifestoSectionProps) {
  const containerRef = useRef<HTMLElement>(null);
  const content = HOME_MANIFESTO_CONTENT[activeTab];

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Background uncoiling ribbon transforms
  const pathLength = useTransform(scrollYProgress, [0, 0.82], [0.06, 1]);
  const ribbonRotate = useTransform(scrollYProgress, [0, 1], [-10, 12]);
  const ribbonScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1.05, 1]);

  // Line 1 scroll choreography
  const line1Opacity = useTransform(scrollYProgress, [0.02, 0.22], [0, 1]);
  const line1Y = useTransform(scrollYProgress, [0.02, 0.22], [45, 0]);
  const line1Filter = useTransform(
    scrollYProgress,
    [0.02, 0.22],
    ['blur(14px)', 'blur(0px)']
  );

  // Line 2 scroll choreography
  const line2Opacity = useTransform(scrollYProgress, [0.24, 0.46], [0, 1]);
  const line2Y = useTransform(scrollYProgress, [0.24, 0.46], [45, 0]);
  const line2Filter = useTransform(
    scrollYProgress,
    [0.24, 0.46],
    ['blur(14px)', 'blur(0px)']
  );

  // Line 3 scroll choreography
  const line3Opacity = useTransform(scrollYProgress, [0.48, 0.72], [0, 1]);
  const line3Y = useTransform(scrollYProgress, [0.48, 0.72], [45, 0]);
  const line3Filter = useTransform(
    scrollYProgress,
    [0.48, 0.72],
    ['blur(14px)', 'blur(0px)']
  );

  // Bottom Subtitle scroll choreography
  const subtitleOpacity = useTransform(scrollYProgress, [0.68, 0.86], [0, 1]);
  const subtitleY = useTransform(scrollYProgress, [0.68, 0.86], [24, 0]);
  const subtitleFilter = useTransform(
    scrollYProgress,
    [0.68, 0.86],
    ['blur(8px)', 'blur(0px)']
  );

  const sectionClasses = `relative h-[240vh] w-full bg-[#09090B] select-none ${className}`.trim();

  return (
    <section ref={containerRef} className={sectionClasses}>
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center px-6">
        {/* Background Uncoiling Blurred Ribbon */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          <motion.div style={{ rotate: ribbonRotate, scale: ribbonScale }}>
            <svg
              viewBox="0 0 800 600"
              className="w-[650px] sm:w-[850px] h-[500px] sm:h-[650px] opacity-75 blur-[28px]"
              fill="none"
            >
              <defs>
                <linearGradient
                  id="klipdayScrollRibbon"
                  x1="100"
                  y1="0"
                  x2="700"
                  y2="600"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#3F3F46" stopOpacity="0.35" />
                  <stop offset="45%" stopColor="#E11D48" stopOpacity="0.65" />
                  <stop offset="75%" stopColor="#F43F5E" stopOpacity="0.80" />
                  <stop offset="100%" stopColor="#27272A" stopOpacity="0.30" />
                </linearGradient>
              </defs>
              <motion.path
                d="M 180 -40 C 340 120, 590 210, 500 390 C 410 540, 210 470, 250 280 C 290 110, 540 160, 680 640"
                stroke="url(#klipdayScrollRibbon)"
                strokeWidth="52"
                strokeLinecap="round"
                style={{ pathLength }}
              />
            </svg>
          </motion.div>
        </div>

        {/* Staggered 3-Line Diagonal Billboard Typography + Subtitle */}
        <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col gap-4 sm:gap-6">
          <motion.div
            style={{
              opacity: line1Opacity,
              y: line1Y,
              filter: line1Filter,
            }}
            className="self-start text-left text-white font-heading text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] will-change-[transform,opacity,filter]"
          >
            {content.line1}
          </motion.div>

          <motion.div
            style={{
              opacity: line2Opacity,
              y: line2Y,
              filter: line2Filter,
            }}
            className="self-center text-center text-zinc-200 font-heading text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] will-change-[transform,opacity,filter]"
          >
            {content.line2}
          </motion.div>

          <motion.div
            style={{
              opacity: line3Opacity,
              y: line3Y,
              filter: line3Filter,
            }}
            className="self-end text-right bg-gradient-to-r from-white via-rose-200 to-[#E11D48] bg-clip-text text-transparent font-heading text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] will-change-[transform,opacity,filter]"
          >
            {content.line3}
          </motion.div>

          <motion.p
            style={{
              opacity: subtitleOpacity,
              y: subtitleY,
              filter: subtitleFilter,
            }}
            className="text-sm sm:text-lg text-zinc-400 max-w-xl text-center mx-auto pt-4 will-change-[transform,opacity,filter]"
          >
            {content.subtitle}
          </motion.p>
        </div>
      </div>
    </section>
  );
}
