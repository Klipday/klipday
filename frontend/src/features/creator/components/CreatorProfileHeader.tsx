import { useRef } from 'react';
import { CameraIcon, LoaderIcon } from '@solar-icons/react/linear';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CONTENT_CATEGORY_OPTIONS, CREATOR_LIMITS, CREATOR_UI_MESSAGES } from '../constants';
import type { CreatorProfileHeaderProps } from '../types';
import { GetPersonInitials } from '../utils/creator-profile';

/**
 * Top header banner for the creator profile view.
 * Displays profile photo with hover upload overlay, full name, "Akun Creator" badge,
 * email, content niche tags, domicile city, and connected TikTok handle.
 *
 * @param props - Component properties.
 * @returns The rendered creator profile header element.
 */
export function CreatorProfileHeader({
  profile,
  onAvatarUpload,
  isUploadingAvatar,
}: CreatorProfileHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = GetPersonInitials(profile.fullName);

  const HandleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > CREATOR_LIMITS.MAX_AVATAR_SIZE_BYTES) {
      toast.error(CREATOR_UI_MESSAGES.AVATAR_SIZE_ERROR);
      return;
    }

    onAvatarUpload(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          {/* Avatar with upload overlay */}
          <div className="group relative size-20 shrink-0 rounded-full overflow-hidden">
            <Avatar className="size-20 rounded-full after:border-0">
              {profile.avatarUrl ? (
                <AvatarImage
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="rounded-full object-cover"
                />
              ) : null}
              <AvatarFallback className="rounded-full bg-muted text-xl font-semibold text-muted-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/60 opacity-0 backdrop-blur-xs transition-opacity duration-200 group-hover:opacity-100 cursor-pointer disabled:pointer-events-none"
              aria-label="Ubah foto profil"
              title="Ubah foto profil">
              {isUploadingAvatar ? (
                <LoaderIcon className="size-5 animate-spin text-white" />
              ) : (
                <>
                  <CameraIcon className="size-5 text-white" />
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

          {/* Creator details */}
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {profile.fullName}
              </h1>
              <span className="text-xs font-medium text-muted-foreground">
                Akun Creator
              </span>
            </div>

            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>

            {/* Tags row: Categories + Location + TikTok */}
            {(() => {
              const hasCategories = Boolean(
                profile.contentCategories && profile.contentCategories.length > 0,
              );
              const metaItems: string[] = [];
              if (profile.location) {
                metaItems.push(profile.location);
              }
              if (profile.tiktokAccount?.username) {
                metaItems.push(`@${profile.tiktokAccount.username}`);
              }

              if (!hasCategories && metaItems.length === 0) {
                return null;
              }

              return (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-xs text-muted-foreground">
                  {hasCategories
                    ? profile.contentCategories.map((category) => {
                        const match = CONTENT_CATEGORY_OPTIONS.find((opt) => opt.value === category);
                        const label = match ? match.label : category;
                        return (
                          <span key={category}>
                            {label}
                          </span>
                        );
                      })
                    : null}

                  {metaItems.map((metaText) => (
                    <span key={metaText}>{metaText}</span>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="cursor-pointer text-xs">
            {isUploadingAvatar ? (
              <LoaderIcon className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <CameraIcon className="mr-1.5 size-3.5" />
            )}
            <span>Unggah Foto</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
