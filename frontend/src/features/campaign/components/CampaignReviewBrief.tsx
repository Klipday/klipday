import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CampaignReviewBriefProps } from '../types';
import {
  BriefDirectives,
  BriefDosDonts,
  BriefNarration,
  BriefTags,
} from './brief';

/**
 * Section 3 review card: Displays creative brief, key messages, social rules, and dos & don'ts.
 * Composes shared brief presentation components to adhere strictly to DRY and Single Responsibility principles.
 *
 * @param props - Component properties containing campaign brief data and edit navigation handler.
 * @returns The rendered brief and guidelines review card element.
 */
export function CampaignReviewBrief({ brief, onEdit }: CampaignReviewBriefProps) {
  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-sm sm:text-base font-semibold tracking-tight">
            3. Brief &amp; Panduan Kreator
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Instruksi kreatif, pesan penting, dan batasan konten
          </CardDescription>
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

      <CardContent className="space-y-4 pt-1 text-sm">
        {brief ? (
          <>
            <BriefDirectives brief={brief} layout="grid" />
            <BriefTags hashtags={brief.hashtags} mentionTags={brief.mentionTags} />
            <BriefDosDonts dos={brief.dos} donts={brief.donts} />
            <BriefNarration narration={brief.narration} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Brief kampanye belum dikonfigurasi.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
