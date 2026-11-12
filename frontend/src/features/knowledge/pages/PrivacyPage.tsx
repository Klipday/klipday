import { useEffect, useRef, useState } from 'react';
import { UpdatePageSeo } from '@/lib/seo';
import {
  HelpTopNav,
  KnowledgeFooter,
  LegalHeader,
  LegalSectionCard,
  LegalTableOfContents,
} from '../components';
import { PRIVACY_LAST_UPDATED, PRIVACY_SECTIONS } from '../constants';
import type { PrivacyPageProps, TableOfContentsItem } from '../types';

/**
 * Privacy Policy (Kebijakan Privasi) page orchestrator for Klipday.
 * Fully compliant with Indonesian UU No. 27/2022 tentang Pelindungan Data Pribadi (UU PDP),
 * detailing identity, financial, and TikTok social data handling, encryption protocols,
 * and data subject legal rights.
 *
 * @param props - Custom styling classes.
 * @returns The rendered Privacy Policy page.
 */
export default function PrivacyPage({ className = '' }: PrivacyPageProps) {
  const [activeSectionId, setActiveSectionId] = useState<string>(
    PRIVACY_SECTIONS[0]?.id ?? ''
  );
  const isManualScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tableOfContentsItems: readonly TableOfContentsItem[] = PRIVACY_SECTIONS.map(
    (section) => ({
      id: section.id,
      shortTitle: section.shortTitle,
    })
  );

  /**
   * Smoothly scrolls to a designated legal section and synchronizes the URL hash.
   *
   * @param sectionId - HTML element id of the target section.
   * @returns void
   */
  const HandleSelectSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    isManualScrollingRef.current = true;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      isManualScrollingRef.current = false;
    }, 800);

    window.history.replaceState(null, '', `#${sectionId}`);
    const targetElement = document.getElementById(sectionId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  /**
   * Synchronizes viewport scroll position or direct URL hash anchors on initial mount.
   */
  useEffect(() => {
    UpdatePageSeo({
      title: 'Kebijakan Privasi - Klipday',
      description:
        'Kebijakan privasi resmi Klipday sesuai UU PDP: perlindungan data pribadi kreator dan brand, data sosial TikTok, enkripsi transaksi finansial, dan hak pengguna.',
      canonicalPath: '/kebijakan-privasi',
    });

    /**
     * Resolves hash from URL, scrolls to target element, and highlights active section.
     *
     * @returns void
     */
    const HandleHashSync = () => {
      const initialHash = window.location.hash.replace('#', '');
      if (initialHash) {
        const targetElement = document.getElementById(initialHash);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          const matchingSection = PRIVACY_SECTIONS.find(
            (sec) => sec.id === initialHash || sec.clauses.some((c) => c.id === initialHash)
          );
          if (matchingSection) {
            setActiveSectionId(matchingSection.id);
          }
          return;
        }
      }
      // If navigated without a hash (e.g. from footer link), reset scroll to top
      window.scrollTo({ top: 0, behavior: 'instant' });
    };

    HandleHashSync();
    window.addEventListener('hashchange', HandleHashSync);
    return () => window.removeEventListener('hashchange', HandleHashSync);
  }, []);

  /**
   * Tracks viewport scroll position to highlight the in-view section in the table of contents.
   */
  useEffect(() => {
    /**
     * Inspects bounding boxes of sections relative to top viewport threshold.
     *
     * @returns void
     */
    const HandleScrollTracking = () => {
      if (isManualScrollingRef.current) return;

      // Handle top edge of page
      if (window.scrollY < 120) {
        setActiveSectionId(PRIVACY_SECTIONS[0]?.id ?? '');
        return;
      }

      // Handle bottom edge of page
      const isAtBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60;
      if (isAtBottom) {
        setActiveSectionId(PRIVACY_SECTIONS[PRIVACY_SECTIONS.length - 1]?.id ?? '');
        return;
      }

      const targetY = 180;
      for (const section of PRIVACY_SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= targetY && rect.bottom > targetY) {
            setActiveSectionId(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', HandleScrollTracking, { passive: true });
    return () => {
      window.removeEventListener('scroll', HandleScrollTracking);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`min-h-screen bg-[#09090b] text-foreground flex flex-col selection:bg-rose-500/20 selection:text-rose-300 ${className}`.trim()}
    >
      {/* Top Sticky Navigation */}
      <HelpTopNav />

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10">
        {/* Document Header */}
        <LegalHeader
          title="Kebijakan Privasi"
          description="Kebijakan pelindungan data pribadi Klipday yang disusun berdasarkan Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 (UU PDP), menjamin transparansi pengumpulan, pemrosesan, keamanan, dan hak subjek data pengguna."
          lastUpdated={PRIVACY_LAST_UPDATED}
          badgeLabel="Kepatuhan UU PDP No. 27/2022"
        />

        {/* 2-Column Responsive Layout: Sidebar TOC on Desktop, Main Clauses on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <aside className="lg:col-span-4">
            <LegalTableOfContents
              sections={tableOfContentsItems}
              activeSectionId={activeSectionId}
              onSelectSection={HandleSelectSection}
            />
          </aside>

          <section className="lg:col-span-8 space-y-6">
            {PRIVACY_SECTIONS.map((section) => (
              <LegalSectionCard key={section.id} section={section} />
            ))}
          </section>
        </div>
      </main>

      {/* Knowledge & Legal Footer */}
      <KnowledgeFooter />
    </div>
  );
}
