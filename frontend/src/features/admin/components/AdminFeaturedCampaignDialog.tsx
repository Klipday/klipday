import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { UseToggleCampaignFeaturedMutation } from '../hooks';
import type {
  AdminFeaturedCampaignDialogContentProps,
  AdminFeaturedCampaignDialogProps,
} from '../types';

/**
 * Formats an ISO date string into standard datetime-local input format (YYYY-MM-DDTHH:mm).
 *
 * @param isoString - ISO formatted date string or null.
 * @returns Local datetime input value or empty string.
 */
function FormatDateTimeForInput(isoString?: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  const pad = (num: number) => String(num).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Inner modal content component mounted fresh whenever the featured dialog opens.
 * Initializes form state purely from campaign props with zero effect-based state synchronization.
 *
 * @param props - Inner content properties.
 * @returns Rendered modal content and form.
 */
function AdminFeaturedCampaignDialogContent({
  campaignId,
  campaignTitle,
  isFeatured = false,
  featuredOrder = 1,
  featuredUntil = null,
  featuredBannerUrl = null,
  onSuccess,
  onClose,
}: AdminFeaturedCampaignDialogContentProps) {
  const [activeFeatured, setActiveFeatured] = useState<boolean>(Boolean(isFeatured));
  const [orderValue, setOrderValue] = useState<number | string>(
    featuredOrder && featuredOrder > 0 ? featuredOrder : 1,
  );
  const [untilValue, setUntilValue] = useState<string>(FormatDateTimeForInput(featuredUntil));
  const [bannerUrlValue, setBannerUrlValue] = useState<string>(featuredBannerUrl ?? '');

  const toggleMutation = UseToggleCampaignFeaturedMutation(campaignId, {
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
  });

  const HandleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeFeatured) {
      toggleMutation.mutate({
        isFeatured: false,
        featuredOrder: null,
        featuredUntil: null,
        featuredBannerUrl: null,
      });
      return;
    }

    const parsedOrder = Math.max(1, Math.min(99, Number(orderValue) || 1));
    let parsedUntil: string | null = null;
    if (untilValue.trim().length > 0) {
      const dateObj = new Date(untilValue.trim());
      if (!isNaN(dateObj.getTime())) {
        parsedUntil = dateObj.toISOString();
      }
    }
    const parsedBanner =
      bannerUrlValue.trim().length > 0 ? bannerUrlValue.trim() : null;

    toggleMutation.mutate({
      isFeatured: true,
      featuredOrder: parsedOrder,
      featuredUntil: parsedUntil,
      featuredBannerUrl: parsedBanner,
    });
  };

  return (
    <DialogContent className="max-w-md p-6">
      <form onSubmit={HandleSubmit} className="space-y-5">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
            Kelola Status Featured
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Atur penempatan kampanye{' '}
            <strong className="text-foreground font-semibold">"{campaignTitle}"</strong> di
            Carousel Unggulan beranda kreator.
          </DialogDescription>
        </DialogHeader>

        {/* Segmented Edge-to-Edge Control for Active / Inactive */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground">Status Carousel</Label>
          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-border/70 p-0 divide-x divide-border/60 bg-muted/20 text-xs">
            <button
              type="button"
              onClick={() => setActiveFeatured(true)}
              className={cn(
                'flex items-center justify-center py-2 font-medium transition-colors cursor-pointer first:rounded-l-xl',
                activeFeatured
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              Aktifkan Featured
            </button>
            <button
              type="button"
              onClick={() => setActiveFeatured(false)}
              className={cn(
                'flex items-center justify-center py-2 font-medium transition-colors cursor-pointer last:rounded-r-xl',
                !activeFeatured
                  ? 'bg-muted/80 text-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              Nonaktifkan
            </button>
          </div>
        </div>

        {activeFeatured && (
          <div className="space-y-4 pt-1">
            {/* Order Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="featuredOrder" className="text-xs font-medium text-foreground">
                  Urutan Tampil (1 – 99)
                </Label>
                <span className="text-[11px] text-muted-foreground">Slide pertama = 1</span>
              </div>
              <Input
                id="featuredOrder"
                type="number"
                min={1}
                max={99}
                value={orderValue}
                onChange={(e) => setOrderValue(e.target.value === '' ? '' : Number(e.target.value))}
                required={activeFeatured}
                className="h-9 text-xs"
              />
            </div>

            {/* Expiration Date Input */}
            <div className="space-y-1.5">
              <Label htmlFor="featuredUntil" className="text-xs font-medium text-foreground">
                Kedaluwarsa Featured (Opsional)
              </Label>
              <Input
                id="featuredUntil"
                type="datetime-local"
                value={untilValue}
                onChange={(e) => setUntilValue(e.target.value)}
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Kosongkan jika ingin featured tetap aktif hingga batas waktu kampanye.
              </p>
            </div>

            {/* Custom Hero Banner URL */}
            <div className="space-y-1.5">
              <Label htmlFor="featuredBannerUrl" className="text-xs font-medium text-foreground">
                URL Banner Landscape Khusus (Opsional)
              </Label>
              <Input
                id="featuredBannerUrl"
                type="url"
                placeholder="https://example.com/banner-wide.jpg"
                value={bannerUrlValue}
                onChange={(e) => setBannerUrlValue(e.target.value)}
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Rasio lebar disarankan untuk tampilan hero carousel. Jika kosong, thumbnail poster
                kampanye akan digunakan.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-end gap-2 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={toggleMutation.isPending}
            onClick={onClose}
            className="text-xs cursor-pointer"
          >
            Batal
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={toggleMutation.isPending}
            className="gap-2 text-xs font-semibold cursor-pointer"
          >
            {toggleMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Perubahan</span>
              )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

/**
 * Administrative dialog for toggling a campaign's featured placement in the creator marketplace carousel.
 * Allows setting slide order, optional expiration date, and custom landscape banner URL.
 *
 * @param props - Dialog properties containing campaign metadata and callback handlers.
 * @returns Rendered dialog element.
 */
export function AdminFeaturedCampaignDialog({
  open,
  onOpenChange,
  campaignId,
  campaignTitle,
  isFeatured = false,
  featuredOrder = 1,
  featuredUntil = null,
  featuredBannerUrl = null,
  onSuccess,
}: AdminFeaturedCampaignDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <AdminFeaturedCampaignDialogContent
          campaignId={campaignId}
          campaignTitle={campaignTitle}
          isFeatured={isFeatured}
          featuredOrder={featuredOrder}
          featuredUntil={featuredUntil}
          featuredBannerUrl={featuredBannerUrl}
          onSuccess={onSuccess}
          onClose={() => onOpenChange(false)}
        />
      )}
    </Dialog>
  );
}
