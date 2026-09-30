import {
  Check,
  ExternalLink,
  FileSpreadsheet,
  Image as ImageIcon,
  Link2,
  Video,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import type { CampaignDetailBriefSectionsProps } from '../types';

/**
 * Resolves the functional icon representing the specific asset type.
 *
 * @param type - The material media category string.
 * @returns React icon node corresponding to the asset.
 */
function ResolveMaterialIcon(type: string) {
  switch (type) {
    case 'VIDEO':
      return <Video className="size-4 text-primary" />;
    case 'IMAGE':
      return <ImageIcon className="size-4 text-emerald-500" />;
    case 'DOCUMENT':
      return <FileSpreadsheet className="size-4 text-sky-500" />;
    case 'LINK':
    default:
      return <Link2 className="size-4 text-amber-500" />;
  }
}

/**
 * Collapsible section group displaying campaign brief instructions and clipping materials
 * directly on the campaign detail page, replacing previous modal drawer sheets.
 *
 * Implements the accordion dropdown layout:
 * 1. "Wajib ada di video kamu" (CTA, Key Message, Purpose, Mood, Social rules, Dos & Don'ts)
 * 2. "Narasi" (Brand-provided narration scripts)
 * 3. "Hashtag" (Campaign hashtags)
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

  const hashtags = brief?.hashtags ?? [];
  const mentionTags = brief?.mentionTags ?? [];

  const hasNarration = Boolean(brief?.narration?.trim());
  const hasGuidelines = Boolean(brief?.guidelines?.trim());
  const hasDosOrDonts = Boolean(
    (brief?.dos && brief.dos.length > 0) || (brief?.donts && brief.donts.length > 0)
  );
  const hasAnyWajib = Boolean(
    brief?.callToAction?.trim() ||
      brief?.keyMessage?.trim() ||
      brief?.purpose?.trim() ||
      brief?.impression?.trim() ||
      brief?.requiredCaption?.trim() ||
      (brief?.mentionTags && brief.mentionTags.length > 0) ||
      hasDosOrDonts
  );

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
            {!brief || !hasAnyWajib ? (
              <p className="text-xs sm:text-sm text-muted-foreground italic">
                Ketentuan wajib untuk video kampanye ini belum diatur oleh brand.
              </p>
            ) : (
              <div className="space-y-4 pt-1">
                {/* Directives Grid */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {brief.callToAction && (
                    <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-1">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Call to Action (CTA)
                      </span>
                      <p className="text-xs sm:text-sm text-foreground leading-relaxed font-medium">
                        {brief.callToAction}
                      </p>
                    </div>
                  )}

                  {brief.keyMessage && (
                    <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-1">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Pesan Utama (Key Message)
                      </span>
                      <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                        {brief.keyMessage}
                      </p>
                    </div>
                  )}

                  {brief.purpose && (
                    <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-1">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Tujuan Kampanye
                      </span>
                      <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                        {brief.purpose}
                      </p>
                    </div>
                  )}

                  {brief.impression && (
                    <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-1">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Kesan & Mood Konten
                      </span>
                      <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                        {brief.impression}
                      </p>
                    </div>
                  )}
                </div>

                {/* Required Caption */}
                {brief.requiredCaption && (
                  <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-2">
                    <span className="text-xs font-semibold text-foreground block">Caption Wajib</span>
                    <p className="rounded-lg border border-border/40 bg-background/80 p-3 text-xs text-foreground font-mono leading-relaxed whitespace-pre-wrap select-text">
                      {brief.requiredCaption}
                    </p>
                  </div>
                )}

                {/* Mention Tags */}
                {mentionTags.length > 0 && (
                  <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-2">
                    <span className="text-xs font-semibold text-foreground block">
                      Akun Wajib Mention
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {mentionTags.map((account) => {
                        const cleanAccount = account.startsWith('@') ? account : `@${account}`;
                        return (
                          <span
                            key={account}
                            className="rounded-md border border-border/60 bg-card px-2.5 py-1 text-xs font-medium text-foreground select-text inline-flex items-center">
                            {cleanAccount}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Do's & Don'ts */}
                {hasDosOrDonts && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Dos */}
                    <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <Check className="size-3.5" />
                        <span>Hal yang Dianjurkan (Do&apos;s)</span>
                      </div>
                      {brief.dos && brief.dos.length > 0 ? (
                        <ul className="space-y-1.5 text-xs text-foreground leading-relaxed">
                          {brief.dos.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Tidak ada anjuran khusus.</p>
                      )}
                    </div>

                    {/* Donts */}
                    <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                        <X className="size-3.5" />
                        <span>Hal yang Dilarang (Don&apos;ts)</span>
                      </div>
                      {brief.donts && brief.donts.length > 0 ? (
                        <ul className="space-y-1.5 text-xs text-foreground leading-relaxed">
                          {brief.donts.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-destructive font-bold">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Tidak ada larangan khusus.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
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
            {hasNarration ? (
              <div className="space-y-2 pt-1">
                <span className="text-xs text-muted-foreground block">
                  Skrip narasi yang disediakan brand:
                </span>
                <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
                  <p className="text-xs sm:text-sm text-foreground whitespace-pre-line leading-relaxed select-text">
                    {brief?.narration}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground italic pt-1">
                Brand tidak mewajibkan skrip narasi kata demi kata. Anda bebas berkreasi selama menyampaikan pesan utama kampanye.
              </p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Section 3: Hashtag */}
        <AccordionItem
          value="hashtag"
          className="rounded-2xl border border-border/60 bg-card overflow-hidden transition-all shadow-xs last:border-b">
          <AccordionTrigger className="px-4 py-4 sm:px-5 sm:py-4.5 hover:bg-muted/10 hover:no-underline">
            <div className="flex flex-col text-left">
              <span className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
                Hashtag
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-5 pt-1 sm:px-5 sm:pb-6 border-t border-border/40 space-y-3">
            {hashtags.length > 0 ? (
              <div className="space-y-3 pt-1">
                <span className="text-xs text-muted-foreground block">
                  Tagar yang harus disertakan dalam video:
                </span>
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag) => {
                    const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
                    return (
                      <span
                        key={tag}
                        className="rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground select-text inline-flex items-center">
                        {cleanTag}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground italic pt-1">
                Tidak ada tagar wajib khusus untuk kampanye ini.
              </p>
            )}
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
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-5 pt-1 sm:px-5 sm:pb-6 border-t border-border/40 space-y-3">
            {materialsCount > 0 ? (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 pt-1">
                {activeMaterials.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/20 p-3 transition-colors hover:border-border">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border/40">
                        {ResolveMaterialIcon(material.type)}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-xs sm:text-sm font-medium text-foreground truncate"
                          title={material.name}>
                          {material.name}
                        </p>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {material.type}
                        </span>
                      </div>
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0 gap-1 text-xs border-border/60">
                      <a href={material.url} target="_blank" rel="noopener noreferrer">
                        <span>Buka</span>
                        <ExternalLink className="size-3" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground italic pt-1">
                Belum ada materi atau aset yang diunggah untuk kampanye ini.
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
