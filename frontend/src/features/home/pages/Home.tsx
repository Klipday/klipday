import { useEffect, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  HomeBenefits,
  HomeDiscordBanner,
  HomeFaq,
  HomeFooter,
  HomeHero,
  HomeHowItWorks,
  HomeNavbar,
} from '../components';
import { LANDING_PAGE_ASSETS } from '../constants/home.constants';
import type { AudienceType } from '../types';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Landing HomePage orchestrator component.
 * Assembles the full ultra-clean minimalist dark SaaS experience:
 * Sticky Navbar, Interactive Hero with Spring-Morph Role Switcher & 3D Typography,
 * 3-step Cara Kerja laser-scrubbed timeline, Bento-grid Benefits with 60fps cursor spotlight,
 * Dark FAQ Accordion, Dynamic Bottom Banner, and Footer.
 * Preloads all 12 3D dark-glass assets on mount for instantaneous zero-flicker role transitions.
 *
 * @returns The rendered Landing Page.
 */
function HomePage() {
  const [activeAudience, setActiveAudience] = useState<AudienceType>('creator');

  // Preload all 12 dark-glass illustration assets into memory on mount
  useEffect(() => {
    LANDING_PAGE_ASSETS.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#09090b] text-[#fafafa] antialiased selection:bg-rose-500/20 selection:text-rose-300">
      <HomeNavbar
        activeAudience={activeAudience}
        onAudienceChange={setActiveAudience}
      />

      <main className="flex flex-1 w-full flex-col items-center">
        <HomeHero
          activeAudience={activeAudience}
          onAudienceChange={setActiveAudience}
        />
        <HomeHowItWorks activeAudience={activeAudience} />
        <HomeBenefits activeAudience={activeAudience} />
        <HomeFaq />
        <HomeDiscordBanner activeAudience={activeAudience} />
      </main>

      <HomeFooter />
    </div>
  );
}

export default HomePage;
