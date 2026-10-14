import { useRef } from 'react';
import { Camera, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BRAND_LIMITS, INDUSTRY_OPTIONS } from '../constants';
import type { BrandProfileHeaderProps } from '../types';

/**
 * Extracts a 2-character initials string from a company name.
 *
 * @param name - The company name.
 * @returns An uppercase string with up to 2 characters representing initials.
 */
function GetCompanyInitials(name?: string | null): string {
  const cleanName = name?.trim();
  if (!cleanName) {
    return 'KD';
  }

  const words = cleanName.split(/\s+/);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return cleanName.slice(0, 2).toUpperCase();
}

/**
 * Top header banner of the brand profile view.
 * Displays company avatar with instant logo upload overlay, company name, industry, and verification badge.
 *
 * @param props - Component properties.
 * @returns The rendered brand profile header.
 */
export function BrandProfileHeader({
  profile,
  onLogoUpload,
  isUploadingLogo,
}: BrandProfileHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = GetCompanyInitials(profile.companyName);
  const matchedIndustry = INDUSTRY_OPTIONS.find((item) => item.value === profile.industry);
  const industryLabel = matchedIndustry?.label ?? 'Brand Klipday';

  const HandleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > BRAND_LIMITS.MAX_LOGO_SIZE_BYTES) {
      toast.error('Ukuran file logo maksimal 5 MB.');
      return;
    }

    onLogoUpload(file);
    // Reset file input so user can re-upload if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {/* Logo with upload overlay */}
          <div className="group relative size-20 shrink-0 rounded-full overflow-hidden">
            <Avatar className="size-20 rounded-full after:border-0">
              {profile.logoUrl ? (
                <AvatarImage src={profile.logoUrl} alt={profile.companyName} className="rounded-full object-cover" />
              ) : null}
              <AvatarFallback className="rounded-full bg-primary/10 text-xl font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingLogo}
              className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/60 opacity-0 backdrop-blur-xs transition-opacity duration-200 group-hover:opacity-100 cursor-pointer disabled:pointer-events-none"
              aria-label="Ubah logo brand"
              title="Ubah logo brand">
              {isUploadingLogo ? (
                <Loader2 className="size-5 animate-spin text-white" />
              ) : (
                <>
                  <Camera className="size-5 text-white" />
                  <span className="mt-1 text-[10px] font-medium text-white">Ubah</span>
                </>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={HandleFileChange}
              className="hidden"
            />
          </div>

          {/* Company details */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {profile.companyName}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="size-3" />
                <span>Akun Brand</span>
              </span>
            </div>

            <p className="text-xs text-muted-foreground">{profile.email}</p>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {industryLabel}
              </span>
              {profile.location ? (
                <span className="text-xs text-muted-foreground">
                  • {profile.location}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingLogo}
            className="cursor-pointer text-xs">
            {isUploadingLogo ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Camera className="mr-1.5 size-3.5" />
            )}
            <span>Unggah Logo</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
