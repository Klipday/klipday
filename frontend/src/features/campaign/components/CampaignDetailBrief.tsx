import { Check, FileText, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CampaignDetailBriefProps } from '../types';

/**
 * Section 2 of Campaign Detail view: Creative Brief and Guidelines.
 * Displays campaign purpose, core messaging, call to action, social media rules
 * (caption, tags, mentions), Do's and Don'ts, and hook narration.
 *
 * @param props - Component properties containing campaign brief entity.
 * @returns The rendered brief and guidelines section element.
 */
export function CampaignDetailBrief({ brief, className }: CampaignDetailBriefProps) {
  const hasSocialRules = Boolean(
    brief?.requiredCaption ||
      (brief?.hashtags && brief.hashtags.length > 0) ||
      (brief?.mentionTags && brief.mentionTags.length > 0)
  );

  const hasDosOrDonts = Boolean(
    (brief?.dos && brief.dos.length > 0) || (brief?.donts && brief.donts.length > 0)
  );

  return (
    <section className={cn('space-y-4 pt-4 border-t border-border/40', className)}>
      {/* Header row */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
            Brief & Panduan Kreator
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Wajib dibaca dan dipatuhi dalam pembuatan dan pengunggahan klip video.
        </p>
      </div>

      {!brief ? (
        <div className="rounded-xl border border-border/50 bg-muted/20 p-4 text-xs sm:text-sm text-muted-foreground italic">
          Brief panduan kreator belum tersedia untuk kampanye ini.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Key message and directives 2-column grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {brief.purpose && (
              <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Tujuan Kampanye
                </span>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed">{brief.purpose}</p>
              </div>
            )}

            {brief.keyMessage && (
              <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Pesan Utama (Key Message)
                </span>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed">{brief.keyMessage}</p>
              </div>
            )}

            {brief.callToAction && (
              <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Call to Action (CTA)
                </span>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed">{brief.callToAction}</p>
              </div>
            )}

            {brief.impression && (
              <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Kesan & Mood Konten
                </span>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed">{brief.impression}</p>
              </div>
            )}
          </div>

          {/* Social media posting rules card */}
          {hasSocialRules && (
            <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3.5 shadow-xs">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Ketentuan Postingan Media Sosial
              </span>

              {/* Caption Wajib */}
              {brief.requiredCaption && (
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground block">Caption Wajib:</span>
                  <p className="rounded-lg border border-border/40 bg-muted/30 p-3 text-xs text-foreground font-mono leading-relaxed whitespace-pre-wrap select-text">
                    {brief.requiredCaption}
                  </p>
                </div>
              )}

              {/* Tagar Wajib */}
              {brief.hashtags && brief.hashtags.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground block">Tagar (Hashtags) Wajib:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {brief.hashtags.map((tag) => {
                      const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
                      return (
                        <span
                          key={tag}
                          className="rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground select-text inline-flex items-center">
                          {cleanTag}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mention Akun Wajib */}
              {brief.mentionTags && brief.mentionTags.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground block">Akun Wajib Mention:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {brief.mentionTags.map((account) => {
                      const cleanAccount = account.startsWith('@') ? account : `@${account}`;
                      return (
                        <span
                          key={account}
                          className="rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground select-text inline-flex items-center">
                          {cleanAccount}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Do's and Don'ts side by side */}
          {hasDosOrDonts && (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {/* Dos */}
              <div className="rounded-xl border border-border/40 bg-card p-3.5 space-y-2 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <Check className="size-4" />
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
              <div className="rounded-xl border border-border/40 bg-card p-3.5 space-y-2 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                  <X className="size-4" />
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

          {/* Narration and Guidelines */}
          {brief.narration && (
            <div className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Sparkles className="size-3.5 text-amber-500" />
                <span>Referensi Hook & Narasi Video</span>
              </div>
              <p className="text-xs sm:text-sm text-foreground whitespace-pre-line leading-relaxed select-text">
                {brief.narration}
              </p>
            </div>
          )}

          {brief.guidelines && (
            <div className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-1.5">
              <span className="text-xs font-semibold text-foreground block">
                Panduan Tambahan Brand
              </span>
              <p className="text-xs sm:text-sm text-foreground whitespace-pre-line leading-relaxed select-text">
                {brief.guidelines}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
