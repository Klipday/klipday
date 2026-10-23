import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import type { SectionAccordionGroupProps } from '../types';

/**
 * Dedicated section container component that renders an independent theme card
 * with a structured header and a pure shadcn/ui Accordion dropdown list.
 *
 * @param props - Section data and optional custom styling classes.
 * @returns The rendered section accordion card.
 */
export function SectionAccordionGroup({ section, className = '' }: SectionAccordionGroupProps) {
  const containerClasses = cn(
    'overflow-hidden rounded-xl border border-white/10 bg-zinc-900/40 transition-colors',
    className
  );

  return (
    <section className={containerClasses}>
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-white/5 bg-zinc-900/60 px-5 py-3.5 sm:px-6">
        <h2 className="font-heading text-xs sm:text-sm font-semibold tracking-wide text-white uppercase">
          {section.title}
        </h2>
        <span className="rounded-full border border-white/10 bg-zinc-800/80 px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
          {section.itemCountText}
        </span>
      </div>

      {/* Dropdown Items (Shadcn Accordion) */}
      <div className="px-5 sm:px-6">
        <Accordion type="multiple" className="divide-y divide-white/5">
          {section.items.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="border-b-0 py-1"
            >
              <AccordionTrigger className="text-left font-medium text-xs sm:text-sm text-zinc-200 transition-colors hover:text-rose-400 [&[data-state=open]]:text-rose-400">
                <span className="pr-4 leading-snug">{item.title}</span>
              </AccordionTrigger>

              <AccordionContent className="pb-4 font-normal text-xs sm:text-sm leading-relaxed text-zinc-400">
                {item.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
