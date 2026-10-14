import { ExternalLink, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SanitizeHttpUrl } from '@/lib/utils';
import { MATERIAL_TYPE_LABELS, type MaterialTypeOption } from '../schemas';
import type { CampaignReviewMaterialsProps } from '../types';

/**
 * Section 2 review card: Displays list of promotional materials and asset download links.
 *
 * @param props - Component properties containing material items and edit navigation handler.
 * @returns The rendered materials review card element.
 */
export function CampaignReviewMaterials({ materials, onEdit }: CampaignReviewMaterialsProps) {
  const activeMaterials = materials?.filter((item) => item.status !== 'DELETED') ?? [];
  const materialsCountDescription = `${activeMaterials.length} aset disediakan untuk kreator`;

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-sm sm:text-base font-semibold tracking-tight">2. Materi & Aset Promosi</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">{materialsCountDescription}</CardDescription>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <Pencil className="size-3.5" />
          Ubah
        </Button>
      </CardHeader>

      <CardContent className="pt-1">
        {activeMaterials.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Belum ada materi atau aset yang diunggah.</p>
        ) : (
          <div className="divide-y divide-border/40 rounded-xl border border-border/60 bg-background/50">
            {activeMaterials.map((material, idx) => {
              const label = MATERIAL_TYPE_LABELS[material.type as MaterialTypeOption] ?? material.type;
              const itemKey = material.id || idx;
              const sanitizedUrl = SanitizeHttpUrl(material.url);

              return (
                <div key={itemKey} className="flex items-center justify-between p-3.5 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 rounded-md border border-border bg-muted/60 px-2 py-0.5 text-xs font-medium text-foreground">
                      {label}
                    </span>
                    <span className="font-medium text-foreground truncate">{material.name}</span>
                  </div>
                  {sanitizedUrl ? (
                    <a
                      href={sanitizedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:underline shrink-0 transition-colors">
                      Buka Aset <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="ml-4 text-xs text-muted-foreground italic shrink-0">Tautan tidak valid</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
