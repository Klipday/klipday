import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  BriefDirectives,
  BriefDosDonts,
  BriefMaterialsList,
  BriefNarration,
  BriefTags,
} from '@/features/campaign/components/brief';
import { cn } from '@/lib/utils';
import type { SubmissionStep1BriefDialogProps } from '../types';

/**
 * Step 1 dialog body component: "Baca Brief Dulu, Yuk!".
 * Unified collapsible accordion flow composing small, reusable brief presentation components:
 * 1. Tentang Kampanye
 * 2. Wajib Ada di Video Kamu (CTA, Key Message, Purpose, Mood, Caption, Guidelines)
 * 3. Narasi & Skrip
 * 4. Caption, Hashtag & Mention
 * 5. Aturan Konten (Do's & Don'ts)
 * 6. Materi Clipping (Downloadable asset links)
 * Followed by the single mandatory compliance agreement checkbox at the bottom.
 *
 * @param props - Component properties containing campaign data and agreement state.
 * @returns Rendered brief review view.
 */
export function SubmissionStep1BriefDialog({
  campaign,
  hasAgreed,
  onToggleAgreed,
  className,
}: SubmissionStep1BriefDialogProps) {
  const brief = campaign.brief;
  const materials = campaign.materials || [];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Step Heading */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Baca Brief Dulu, Yuk!
        </h1>
        <p className="text-xs text-muted-foreground">
          Pahami arahan dan syarat kontennya biar video kamu langsung disetujui brand dan siap tembus FYP.
        </p>
      </div>

      {/* Unified Accordion Sections */}
      <Accordion type="multiple" defaultValue={['wajib']} className="space-y-2.5">
        {/* Section 1: Tentang Kampanye */}
        <AccordionItem
          value="tentang"
          className="rounded-xl border border-border/60 bg-card/60 overflow-hidden transition-all shadow-2xs last:border-b">
          <AccordionTrigger className="px-4 py-3 hover:bg-muted/15 hover:no-underline rounded-xl transition-colors">
            <div className="flex items-center gap-2 text-left">
              <span className="text-xs sm:text-sm font-semibold text-foreground tracking-tight">
                Tentang Kampanye
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-1 border-t border-border/40 space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed select-text">
              {campaign.description?.trim() ||
                'Kampanye ini mengajak kreator video clipping buat mempromosikan materi brand dengan gaya yang autentik dan menarik.'}
            </p>

            {(brief?.purpose || brief?.impression) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-border/40">
                {brief.purpose && (
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Tujuan Kampanye
                    </span>
                    <p className="text-xs text-foreground leading-relaxed select-text">{brief.purpose}</p>
                  </div>
                )}
                {brief.impression && (
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Kesan &amp; Mood Konten
                    </span>
                    <p className="text-xs text-foreground leading-relaxed select-text">{brief.impression}</p>
                  </div>
                )}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Section 2: Wajib Ada di Video Kamu */}
        <AccordionItem
          value="wajib"
          className="rounded-xl border border-border/60 bg-card/60 overflow-hidden transition-all shadow-2xs last:border-b">
          <AccordionTrigger className="px-4 py-3 hover:bg-muted/15 hover:no-underline rounded-xl transition-colors">
            <div className="flex items-center gap-2 text-left">
              <span className="text-xs sm:text-sm font-semibold text-foreground tracking-tight">
                Wajib Ada di Video Kamu
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-1 border-t border-border/40 space-y-3">
            <BriefDirectives brief={brief} layout="stack" />
          </AccordionContent>
        </AccordionItem>

        {/* Section 3: Narasi & Skrip */}
        <AccordionItem
          value="narasi"
          className="rounded-xl border border-border/60 bg-card/60 overflow-hidden transition-all shadow-2xs last:border-b">
          <AccordionTrigger className="px-4 py-3 hover:bg-muted/15 hover:no-underline rounded-xl transition-colors">
            <div className="flex items-center gap-2 text-left">
              <span className="text-xs sm:text-sm font-semibold text-foreground tracking-tight">
                Narasi &amp; Skrip
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-1 border-t border-border/40 space-y-3">
            <BriefNarration narration={brief?.narration} />
          </AccordionContent>
        </AccordionItem>

        {/* Section 4: Caption, Hashtag & Mention */}
        <AccordionItem
          value="caption"
          className="rounded-xl border border-border/60 bg-card/60 overflow-hidden transition-all shadow-2xs last:border-b">
          <AccordionTrigger className="px-4 py-3 hover:bg-muted/15 hover:no-underline rounded-xl transition-colors">
            <div className="flex items-center gap-2 text-left">
              <span className="text-xs sm:text-sm font-semibold text-foreground tracking-tight">
                Caption, Hashtag &amp; Mention
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-1 border-t border-border/40 space-y-3">
            <BriefTags hashtags={brief?.hashtags} mentionTags={brief?.mentionTags} />
          </AccordionContent>
        </AccordionItem>

        {/* Section 5: Aturan Konten (Do's & Don'ts) */}
        <AccordionItem
          value="aturan"
          className="rounded-xl border border-border/60 bg-card/60 overflow-hidden transition-all shadow-2xs last:border-b">
          <AccordionTrigger className="px-4 py-3 hover:bg-muted/15 hover:no-underline rounded-xl transition-colors">
            <div className="flex items-center gap-2 text-left">
              <span className="text-xs sm:text-sm font-semibold text-foreground tracking-tight">
                Aturan Konten (Do&apos;s &amp; Don&apos;ts)
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-1 border-t border-border/40 space-y-3">
            <BriefDosDonts dos={brief?.dos} donts={brief?.donts} />
          </AccordionContent>
        </AccordionItem>

        {/* Section 6: Materi Clipping */}
        <AccordionItem
          value="materi"
          className="rounded-xl border border-border/60 bg-card/60 overflow-hidden transition-all shadow-2xs last:border-b">
          <AccordionTrigger className="px-4 py-3 hover:bg-muted/15 hover:no-underline rounded-xl transition-colors">
            <div className="flex items-center gap-2 text-left">
              <span className="text-xs sm:text-sm font-semibold text-foreground tracking-tight">
                Materi Clipping
              </span>
              {materials.length > 0 && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({materials.filter((m) => m.status !== 'DELETED').length} aset)
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-1 border-t border-border/40 space-y-3">
            <BriefMaterialsList materials={materials} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Mandatory Agreement Checkbox */}
      <div className="pt-2">
        <label
          htmlFor="brief-agreement-checkbox"
          className={cn(
            'flex items-start gap-3 p-3.5 rounded-xl border transition-colors cursor-pointer select-none',
            hasAgreed
              ? 'border-border/80 bg-muted/30 shadow-2xs'
              : 'border-border/50 bg-muted/10 hover:bg-muted/20',
          )}>
          <input
            id="brief-agreement-checkbox"
            type="checkbox"
            checked={hasAgreed}
            onChange={onToggleAgreed}
            className="size-4 rounded border-border accent-foreground text-foreground focus:ring-foreground mt-0.5 cursor-pointer shrink-0"
          />
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-foreground block">
              Saya sudah membaca dan siap mengikuti seluruh brief kampanye ini
            </span>
            <span className="text-[11px] text-muted-foreground block leading-relaxed">
              Pastikan videomu mengikuti arahan narasi, hashtag, dan ketentuan di atas biar langsung disetujui brand.
            </span>
          </div>
        </label>
      </div>
    </div>
  );
}
