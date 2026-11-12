import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { UpdatePageSeo } from '@/lib/seo';
import {
  HelpHeader,
  HelpTopNav,
  KnowledgeFooter,
  SectionAccordionGroup,
} from '../components';
import { PLATFORM_FAQ_SECTIONS, PLATFORM_RULES_SECTIONS } from '../constants';
import type { HelpPageProps, HelpTabType } from '../types';

/**
 * Knowledge hub and platform rules page orchestrator.
 * Pure orchestrator component managing tab state derived directly from URL query parameters
 * and presenting structured, pure-accordion sections for both platform rules and FAQs.
 *
 * @param props - Optional default tab override.
 * @returns The rendered knowledge hub page.
 */
export default function HelpPage({ defaultTab = 'faq' }: HelpPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');

  // Derive active tab cleanly from URL search parameters, falling back to defaultTab
  const activeTab: HelpTabType =
    urlTab === 'faq' || urlTab === 'rules' ? urlTab : defaultTab;

  // Ensure fresh navigation from home footer resets scroll position to top
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    if (activeTab === 'rules') {
      UpdatePageSeo({
        title: 'Aturan Main & Etika Clipper TikTok - Klipday',
        description:
          'Panduan lengkap aturan main clipping video di Klipday: pedoman orisinalitas klip, syarat durasi, larangan bot traffic, dan etika brand.',
        canonicalPath: '/peraturan',
      });
    } else {
      UpdatePageSeo({
        title: 'FAQ - Pertanyaan Umum Clipper & Brand - Klipday',
        description:
          'Pertanyaan umum seputar cara mulai ngeklip di TikTok, sistem bayaran CPM, minimal saldo Rp50.000, verifikasi akun, dan keamanan budget Rekber.',
        canonicalPath: '/faq',
      });
    }
  }, [activeTab]);

  /**
   * Handles user switching between Rules and FAQ tabs,
   * cleanly updating URL query params without triggering full page reloads.
   *
   * @param nextTab - The selected destination tab.
   * @returns void
   */
  const HandleTabChange = (nextTab: HelpTabType) => {
    setSearchParams({ tab: nextTab }, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sectionsToRender =
    activeTab === 'rules' ? PLATFORM_RULES_SECTIONS : PLATFORM_FAQ_SECTIONS;

  return (
    <div className="min-h-screen bg-[#09090b] text-foreground flex flex-col selection:bg-rose-500/20 selection:text-rose-300">
      {/* Sticky Context-Aware Top Navigation */}
      <HelpTopNav />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10">
        {/* Header with Title and Segmented Tab Switcher */}
        <HelpHeader activeTab={activeTab} onTabChange={HandleTabChange} />

        {/* Pure Dropdown Sections Grouped Section by Section */}
        <div className="space-y-6">
          {sectionsToRender.map((section) => (
            <SectionAccordionGroup key={section.id} section={section} />
          ))}
        </div>
      </main>

      {/* Knowledge & Legal Footer */}
      <KnowledgeFooter />
    </div>
  );
}
