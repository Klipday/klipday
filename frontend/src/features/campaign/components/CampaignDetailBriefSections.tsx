import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import type { CampaignDetailBriefSectionsProps } from '../types';
import {
  BriefDirectives,
  BriefDosDonts,
  BriefMaterialsList,
  BriefNarration,
  BriefTags,
} from './brief';

/**
 * Collapsible accordion sections displaying campaign brief instructions and clipping materials
 * directly on the campaign detail page.
 * Composes small, reusable brief presentation components to adhere strictly to the Single Responsibility Principle.
 *
 * Sections:
 * 1. "Wajib ada di video kamu" (CTA, Key Message, Purpose, Mood, Caption, Dos & Don'ts)
 * 2. "Narasi" (Brand-provided narration scripts)
 * 3. "Hashtag & Mention" (Campaign hashtags and tagged accounts)
 * 4. "Rekomendasi Hook" (Opening hook directives and creator guidelines)
 * 5. "Materi Clipping" (Downloadable video footage, raw images, and asset links)
 *
 * @param props - Component properties containing brief and materials data.
 * @returns The rendered collapsible brief and materials accordion elements.
 */
export function CampaignDetailBriefSections({
  brief,
  materials,
  className,
}: CampaignDetailBriefSectionsProps) {
  const activeMaterials = materials?.filter((item) => item.status !== 'DELETED') ?? [];
  const materialsCount = activeMaterials.length;

  const hasNarration = Boolean(brief?.narration?.trim());
  const hasGuidelines = Boolean(brief?.guidelines?.trim());

  return (
    <section className={cn('space-y-3 pt-2', className)}>
      <Accordion type="multiple" defaultValue={[]} className="space-y-3">
        {/* Section 1: Wajib ada di video kamu */}
        <AccordionItem
          value="wajib"
          className="rounded-2xl border border-border/60 bg-card overflow-hidden transition-all shadow-xs last:border-b">
          <AccordionTrigger className="px-4 py-4 sm:px-5 sm:py-4.5 hover:bg-muted/10 hover:no-underline">
            <div className="flex flex-col text-left">
              <span className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
                Wajib ada di video kamu
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-5 pt-1 sm:px-5 sm:pb-6 border-t border-border/40 space-y-4">
            <BriefDirectives brief={brief} layout="grid" />
            <BriefDosDonts dos={brief?.dos} donts={brief?.donts} />
          </AccordionContent>
        </AccordionItem>

        {/* Section 2: Narasi */}
        <AccordionItem
          value="narasi"
          className="rounded-2xl border border-border/60 bg-card overflow-hidden transition-all shadow-xs last:border-b">
          <AccordionTrigger className="px-4 py-4 sm:px-5 sm:py-4.5 hover:bg-muted/10 hover:no-underline">
            <div className="flex flex-col text-left">
              <span className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
                Narasi
              </span>
              {hasNarration && (
                <span className="text-xs text-muted-foreground mt-0.5">
                  1 wajib
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-5 pt-1 sm:px-5 sm:pb-6 border-t border-border/40 space-y-3">
            <BriefNarration narration={brief?.narration} />
          </AccordionContent>
        </AccordionItem>

        {/* Section 3: Hashtag & Mention */}
        <AccordionItem
          value="hashtag"
          className="rounded-2xl border border-border/60 bg-card overflow-hidden transition-all shadow-xs last:border-b">
          <AccordionTrigger className="px-4 py-4 sm:px-5 sm:py-4.5 hover:bg-muted/10 hover:no-underline">
            <div className="flex flex-col text-left">
              <span className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
                Hashtag &amp; Mention
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-5 pt-1 sm:px-5 sm:pb-6 border-t border-border/40 space-y-3">
            <BriefTags hashtags={brief?.hashtags} mentionTags={brief?.mentionTags} />
          </AccordionContent>
        </AccordionItem>

        {/* Section 4: Rekomendasi Hook */}
        <AccordionItem
          value="hook"
          className="rounded-2xl border border-border/60 bg-card overflow-hidden transition-all shadow-xs last:border-b">
          <AccordionTrigger className="px-4 py-4 sm:px-5 sm:py-4.5 hover:bg-muted/10 hover:no-underline">
            <div className="flex flex-col text-left">
              <span className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
                Rekomendasi Hook
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pt-4 pb-5 sm:px-5 sm:pt-5 sm:pb-6 border-t border-border/40 space-y-3">
            {hasGuidelines ? (
              <div className="rounded-xl border border-border/40 bg-muted/20 p-4 sm:p-5 text-left">
                <p className="text-xs sm:text-sm text-foreground whitespace-pre-line leading-relaxed font-medium">
                  {brief?.guidelines}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border/40 bg-muted/20 p-4 sm:p-5 text-left">
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed italic">
                  Tidak ada rekomendasi hook khusus untuk kampanye ini.
                </p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Section 5: Materi Clipping */}
        <AccordionItem
          value="materials"
          className="rounded-2xl border border-border/60 bg-card overflow-hidden transition-all shadow-xs last:border-b">
          <AccordionTrigger className="px-4 py-4 sm:px-5 sm:py-4.5 hover:bg-muted/10 hover:no-underline">
            <div className="flex flex-col text-left">
              <span className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
                Materi Clipping
              </span>
              {materialsCount > 0 && (
                <span className="text-xs text-muted-foreground mt-0.5">
                  {materialsCount} aset tersedia
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-5 pt-1 sm:px-5 sm:pb-6 border-t border-border/40 space-y-3">
            <BriefMaterialsList materials={materials} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
