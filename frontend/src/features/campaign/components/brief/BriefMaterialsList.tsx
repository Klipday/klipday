import { ExternalLink, FileSpreadsheet, Image as ImageIcon, Link2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, SanitizeHttpUrl } from '@/lib/utils';
import type { BriefMaterialsListProps } from '../../types';

/**
 * Resolves the functional icon representing the specific asset type.
 *
 * @param type - The material media category string.
 * @returns React icon node corresponding to the asset.
 */
export function ResolveMaterialIcon(type: string) {
  const normalizedType = (type || '').toUpperCase();
  if (normalizedType.includes('VIDEO')) {
    return <Video className="size-4 text-primary" />;
  }
  if (normalizedType.includes('IMAGE')) {
    return <ImageIcon className="size-4 text-emerald-500" />;
  }
  if (
    normalizedType.includes('DOCUMENT') ||
    normalizedType.includes('DOC') ||
    normalizedType.includes('PDF')
  ) {
    return <FileSpreadsheet className="size-4 text-sky-500" />;
  }
  return <Link2 className="size-4 text-amber-500" />;
}

/**
 * Reusable component for displaying downloadable clipping materials and reference assets.
 *
 * @param props - List of campaign materials and optional styling.
 * @returns The rendered materials list or empty state placeholder.
 */
export function BriefMaterialsList({ materials = [], className }: BriefMaterialsListProps) {
  const activeMaterials = (materials || []).filter((item) => item.status !== 'DELETED');

  if (activeMaterials.length === 0) {
    return (
      <p className={cn('text-xs sm:text-sm text-muted-foreground italic pt-1', className)}>
        Belum ada materi atau aset yang diunggah untuk kampanye ini.
      </p>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 gap-2.5 sm:grid-cols-2 pt-1', className)}>
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

          {SanitizeHttpUrl(material.url) ? (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 shrink-0 gap-1 text-xs border-border/60">
              <a href={SanitizeHttpUrl(material.url)!} target="_blank" rel="noopener noreferrer">
                <span>Buka</span>
                <ExternalLink className="size-3" />
              </a>
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground italic shrink-0">Tautan tidak valid</span>
          )}
        </div>
      ))}
    </div>
  );
}
