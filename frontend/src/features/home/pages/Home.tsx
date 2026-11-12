import { useEffect, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { UpdatePageSeo } from '@/lib/seo';
import {
  HomeActivityTicker,
  HomeBenefits,
  HomeDiscordBanner,
  HomeFaq,
  HomeFooter,
  HomeHero,
  HomeHowItWorks,
  HomeNavbar,
  ScrollManifestoSection,
} from '../components';
import type { AudienceType } from '../types';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Landing HomePage orchestrator component.
 * Assembles the full ultra-clean minimalist dark SaaS experience:
 * Sticky Navbar, Interactive Hero with Spring-Morph Role Switcher & solid typography,
 * 3-step Cara Kerja laser-scrubbed timeline, Bento-grid Benefits with 60fps cursor spotlight,
 * Dark FAQ Accordion, Dynamic Bottom Banner, and Footer.
 * Zero-asset payload footprint for instantaneous mobile loading.
 *
 * @returns The rendered Landing Page.
 */
function HomePage() {
  const [activeAudience, setActiveAudience] = useState<AudienceType>('creator');

  useEffect(() => {
    UpdatePageSeo({
      title: 'Klipday - Platform Clipper Video Pendek TikTok No. 1 di Indonesia',
      description:
        'Platform marketplace clipper video pendek TikTok no. 1 di Indonesia. Cuan per 1.000 views valid walau akun 0 followers, payout cepat mulai Rp50.000, 100% proteksi Rekber bebas boncos.',
      canonicalPath: '/',
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#09090b] text-[#fafafa] antialiased selection:bg-rose-500/20 selection:text-rose-300 overflow-x-clip">
      <HomeNavbar
        activeAudience={activeAudience}
        onAudienceChange={setActiveAudience}
      />

      <main className="flex flex-1 w-full flex-col items-center">
        <HomeHero
          activeAudience={activeAudience}
          onAudienceChange={setActiveAudience}
        />
        <HomeActivityTicker />
        <HomeHowItWorks activeAudience={activeAudience} />
        <HomeBenefits activeAudience={activeAudience} />
        <ScrollManifestoSection activeTab={activeAudience} />
        <HomeFaq />
        <HomeDiscordBanner activeAudience={activeAudience} />
      </main>

      <HomeFooter />
    </div>
  );
}

export default HomePage;
