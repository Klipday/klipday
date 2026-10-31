import { useRef } from 'react';
import { Link } from 'react-router';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HOME_FAQS, HOME_FAQ_HEADER } from '../constants/home.constants';
import type { HomeFaqProps } from '../types';

gsap.registerPlugin(ScrollTrigger);

/**
 * Modern minimalist FAQ component using official shadcn/ui Accordion primitives.
 * Features a clean two-column layout with ScrollTrigger entrance animation,
 * updated natural Indonesian copywriting, and accessible keyboard navigation.
 *
 * @param props - Component properties.
 * @returns The rendered FAQ section.
 */
export function HomeFaq({ className = '' }: HomeFaqProps) {
  const containerRef = useRef<HTMLElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const matchMediaInstance = gsap.matchMedia();

      matchMediaInstance.add('(prefers-reduced-motion: no-preference)', () => {
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
          defaults: { ease: 'power3.out' },
        });

        if (leftColRef.current) {
          timeline.from(leftColRef.current, {
            x: -25,
            autoAlpha: 0,
            duration: 0.7,
          });
        }

        if (rightColRef.current) {
          const items = rightColRef.current.querySelectorAll('.faq-item');
          timeline.from(
            items,
            {
              y: 25,
              autoAlpha: 0,
              duration: 0.6,
              stagger: 0.08,
            },
            '-=0.4'
          );
        }
      });

      return () => {
        matchMediaInstance.revert();
      };
    },
    { scope: containerRef }
  );

  const sectionClasses = `w-full max-w-5xl px-6 py-20 border-t border-white/5 scroll-mt-20 ${className}`.trim();

  return (
    <section ref={containerRef} id="faq" className={sectionClasses}>
      <div className="grid grid-cols-1 gap-12 text-left md:grid-cols-12">
        {/* Left Side: Header & Info */}
        <div ref={leftColRef} className="md:col-span-5 will-change-transform">
          <span className="mb-3 inline-block rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 font-medium text-xs text-rose-400 uppercase tracking-wider">
            {HOME_FAQ_HEADER.sectionPill}
          </span>
          <h2 className="mb-3 font-heading font-bold text-3xl tracking-tight text-white">
            {HOME_FAQ_HEADER.title}
          </h2>
          <p className="font-normal text-sm leading-relaxed text-zinc-400">
            {HOME_FAQ_HEADER.subtitle}
          </p>
          <div className="mt-6">
            <Link
              to="/faq"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
            >
              <span>Baca FAQ lengkap dan aturan mainnya di sini</span>
            </Link>
          </div>
        </div>

        {/* Right Side: Clean Dark Accordion using shadcn/ui primitives */}
        <div ref={rightColRef} className="space-y-3 md:col-span-7 will-change-transform">
          <Accordion type="single" collapsible defaultValue="faq-1" className="space-y-3">
            {HOME_FAQS.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={`faq-${faq.id}`}
                className="faq-item overflow-hidden rounded-xl border border-white/10 bg-zinc-900/40 transition-colors hover:border-white/20 data-[state=open]:border-rose-500/30 border-b-0"
              >
                <AccordionTrigger className="px-5 py-4 text-left font-semibold text-sm text-white transition-colors hover:text-rose-400 [&[data-state=open]]:text-rose-400 [&[data-state=open]>svg]:text-rose-400">
                  <span className="pr-4">{faq.question}</span>
                </AccordionTrigger>

                <AccordionContent className="px-5 pb-4 font-normal text-xs leading-relaxed text-zinc-400 sm:text-sm">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
