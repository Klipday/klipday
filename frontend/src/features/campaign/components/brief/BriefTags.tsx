import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BriefTagsProps } from '../../types';

/**
 * Reusable component for displaying campaign hashtags and mention tags
 * with individual pill copy and "Salin Semua" actions.
 *
 * @param props - Hashtags array, mentionTags array, and optional styling.
 * @returns The rendered tags section.
 */
export function BriefTags({ hashtags = [], mentionTags = [], className }: BriefTagsProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const cleanHashtags = (hashtags || []).filter((tag) => Boolean(tag && tag.trim()));
  const cleanMentions = (mentionTags || []).filter((tag) => Boolean(tag && tag.trim()));

  const hasAnyTags = cleanHashtags.length > 0 || cleanMentions.length > 0;

  if (!hasAnyTags) {
    return (
      <p className={cn('text-xs sm:text-sm text-muted-foreground italic pt-1', className)}>
        Tidak ada tagar atau mention wajib khusus untuk kampanye ini.
      </p>
    );
  }

  const HandleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(text);
      toast.info(`${label} disalin ke clipboard.`);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch {
      toast.error('Gagal menyalin ke clipboard.');
    }
  };

  const HandleCopyAll = async () => {
    const formattedHashtags = cleanHashtags.map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));
    const formattedMentions = cleanMentions.map((tag) => (tag.startsWith('@') ? tag : `@${tag}`));
    const combined = [...formattedHashtags, ...formattedMentions].join(' ');
    await HandleCopy(combined, 'Semua hashtag & mention');
  };

  return (
    <div className={cn('space-y-4 pt-1', className)}>
      {/* Mention Tags */}
      {cleanMentions.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-semibold text-foreground block">
            Akun Wajib Mention
          </span>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {cleanMentions.map((account) => {
              const formatted = account.startsWith('@') ? account : `@${account}`;
              const isCopied = copiedItem === formatted;

              return (
                <button
                  key={account}
                  type="button"
                  onClick={() => HandleCopy(formatted, formatted)}
                  title="Klik untuk menyalin"
                  className={cn(
                    'group inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer select-text',
                    isCopied
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-border/60 bg-muted/20 text-foreground hover:bg-muted/40 hover:border-foreground/30'
                  )}>
                  <span>{formatted}</span>
                  {isCopied ? (
                    <Check className="size-3 text-emerald-500" />
                  ) : (
                    <Copy className="size-3 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Hashtags */}
      {cleanHashtags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground block">
              Tagar Wajib (Hashtags)
            </span>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={HandleCopyAll}
              className="text-muted-foreground hover:text-foreground h-6 px-2 text-[11px] gap-1 cursor-pointer">
              <Copy className="size-3" />
              <span>Salin Semua</span>
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {cleanHashtags.map((tag) => {
              const formatted = tag.startsWith('#') ? tag : `#${tag}`;
              const isCopied = copiedItem === formatted;

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => HandleCopy(formatted, formatted)}
                  title="Klik untuk menyalin"
                  className={cn(
                    'group inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer select-text',
                    isCopied
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-border/60 bg-muted/20 text-foreground hover:bg-muted/40 hover:border-foreground/30'
                  )}>
                  <span>{formatted}</span>
                  {isCopied ? (
                    <Check className="size-3 text-emerald-500" />
                  ) : (
                    <Copy className="size-3 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
