import { ExternalLink, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SanitizeHttpUrl } from '@/lib/utils';
import {
  CAMPAIGN_CATEGORY_LABELS,
  type CampaignCategoryOption,
  CAMPAIGN_PLATFORM_LABELS,
  type CampaignPlatformOption,
  CAMPAIGN_TYPE_LABELS,
  type CampaignTypeOption,
} from '../schemas';
import type { CampaignReviewBasicInfoProps } from '../types';

/**
 * Section 1 review card: Displays campaign basic identity, categorization, and media links.
 *
 * @param props - Component properties containing campaign data and edit navigation handler.
 * @returns The rendered basic information review card element.
 */
export function CampaignReviewBasicInfo({ campaign, onEdit }: CampaignReviewBasicInfoProps) {
  const categoryLabel = campaign.campaignCategory
    ? (CAMPAIGN_CATEGORY_LABELS[campaign.campaignCategory as CampaignCategoryOption] ?? campaign.campaignCategory)
    : '-';

  const typeLabel = campaign.campaignType
    ? (CAMPAIGN_TYPE_LABELS[campaign.campaignType as CampaignTypeOption] ?? campaign.campaignType)
    : '-';

  const platformLabel = campaign.platform
    ? (CAMPAIGN_PLATFORM_LABELS[campaign.platform as CampaignPlatformOption] ?? campaign.platform)
    : 'TikTok';

  const titleDisplay = campaign.title || 'Belum ada judul';
  const descriptionDisplay = campaign.description || 'Belum ada deskripsi kampanye.';
  const sanitizedMediaUrl = SanitizeHttpUrl(campaign.mainMediaUrl);

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-sm sm:text-base font-semibold tracking-tight">1. Informasi Dasar</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Detail identitas dan kategorisasi kampanye</CardDescription>
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

      <CardContent className="space-y-4 pt-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {campaign.thumbnailUrl ? (
            <div className="h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/30">
              <img src={campaign.thumbnailUrl} alt={titleDisplay} className="h-full w-full object-cover" />
            </div>
          ) : null}

          <div className="min-w-0 flex-1 space-y-2.5">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-foreground tracking-tight">{titleDisplay}</h3>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="rounded-md border border-border/70 bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {categoryLabel}
                </span>
                <span className="rounded-md border border-border/70 bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {typeLabel}
                </span>
                <span className="rounded-md border border-border/70 bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {platformLabel}
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground whitespace-pre-line">{descriptionDisplay}</p>

            {sanitizedMediaUrl ? (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-muted-foreground">Tautan Media Utama:</span>
                <a
                  href={sanitizedMediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:underline transition-colors">
                  Buka Tautan <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
