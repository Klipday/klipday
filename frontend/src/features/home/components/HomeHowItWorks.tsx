import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HOME_HOW_IT_WORKS_CONTENT } from '../constants/home.constants';
import type { HomeHowItWorksProps } from '../types';
import { AutomatedPayoutMockup } from './AutomatedPayoutMockup';
import { BrandClipReviewVisual } from './BrandClipReviewVisual';
import { BrandCreateCampaignVisual } from './BrandCreateCampaignVisual';
import { BrandEscrowTrackerVisual } from './BrandEscrowTrackerVisual';
import { CreatorCampaignCardVisual } from './CreatorCampaignCardVisual';
import { SectionBadge } from './SectionBadge';
import { VerticalClipsCarouselMockup } from './VerticalClipsCarouselMockup';

gsap.registerPlugin(ScrollTrigger);

/**
 * Modern 3-Column Bento Grid for 'Cara Kerja / Langkah' section inspired by Linear and TernakKlip.
 * Features 3 elevated bento cards, each equipped with a dedicated interactive React Micro-UI stage
 * on top (CampaignModelSelectorMockup, VerticalClipsCarouselMockup, AutomatedPayoutMockup)
 * and a focused Title + 2-sentence copywriting container at the bottom.
 *
 * @param props - Component properties including activeAudience and optional className.
 * @returns The rendered 3-column Bento Grid section.
 */
export function HomeHowItWorks({ activeAudience, className = '' }: HomeHowItWorksProps) {
  const containerRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const headerTitleRef = useRef<HTMLHeadingElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const content = HOME_HOW_IT_WORKS_CONTENT[activeAudience];

  // GSAP ScrollTrigger Entrance Choreography for Header
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
            y: 20,
            autoAlpha: 0,
            duration: 0.6,
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

  const sectionClasses = `w-full max-w-5xl px-4 sm:px-6 py-16 sm:py-24 scroll-mt-20 ${className}`.trim();

  return (
    <section ref={containerRef} id="cara-kerja" className={sectionClasses}>
      {/* Section Header */}
      <div ref={headerRef} className="mb-12 sm:mb-16 text-center">
        <SectionBadge className="mb-4">
          {content.sectionPill}
        </SectionBadge>
        <h2
          ref={headerTitleRef}
          className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white"
        >
          {content.title}
        </h2>
      </div>

      {/* 3-Column Bento Grid (1 col mobile, 2 cols tablet, 3 cols desktop) with Framer Motion transition */}
      <motion.div
        key={activeAudience}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        ref={gridRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 w-full"
      >
        {content.steps.map((step, index) => {
          let stageContent = null;
          if (activeAudience === 'creator') {
            if (index === 0) {
              stageContent = <CreatorCampaignCardVisual />;
            } else if (index === 1) {
              stageContent = <VerticalClipsCarouselMockup />;
            } else {
              stageContent = <AutomatedPayoutMockup />;
            }
          } else {
            if (index === 0) {
              stageContent = <BrandCreateCampaignVisual />;
            } else if (index === 1) {
              stageContent = <BrandClipReviewVisual />;
            } else {
              stageContent = <BrandEscrowTrackerVisual />;
            }
          }

          const tabletSpanClass = index === 2 ? 'md:col-span-2 lg:col-span-1' : '';

          return (
            <div
              key={step.stepNumber}
              className={`opacity-100 ${tabletSpanClass} rounded-3xl bg-zinc-900/50 border border-white/[0.06] overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:border-white/15 hover:bg-zinc-900/70`}
            >
              {/* Top Visual Stage */}
              <div className="h-60 relative bg-zinc-950/60 m-2 rounded-2xl overflow-hidden flex items-center justify-center">
                {stageContent}
              </div>

              {/* Bottom Content Container: ONLY Title + 2-Sentence Description */}
              <div className="p-5 sm:p-6 text-left">
                <h3 className="mb-2 font-heading text-lg font-bold text-white transition-colors group-hover:text-rose-100">
                  {step.title}
                </h3>
                <p className="font-normal text-xs sm:text-sm leading-relaxed text-zinc-400">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </motion.div>
    </section>
  );
}
