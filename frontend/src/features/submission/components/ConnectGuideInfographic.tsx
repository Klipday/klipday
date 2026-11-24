import type { ConnectGuideInfographicProps, ConnectGuideStepItemProps } from '../types';

/**
 * Single step indicator in the bio verification guide infographic.
 *
 * @param props - Step number, title, description, and isLast flag.
 * @returns Rendered guide step row.
 */
function ConnectGuideStepItem({
  stepNumber,
  title,
  description,
  isLast = false,
}: ConnectGuideStepItemProps) {
  return (
    <div className="flex items-start gap-3.5 relative">
      {!isLast && (
        <div
          className="absolute left-3.5 top-7 bottom-0 w-px bg-border/60 -translate-x-1/2"
          aria-hidden="true"
        />
      )}
      <div className="relative z-10 size-7 shrink-0 rounded-full border border-border/80 bg-muted text-foreground font-semibold text-xs flex items-center justify-center shadow-2xs">
        {stepNumber}
      </div>
      <div className="min-w-0 space-y-0.5 pb-5">
        <h4 className="text-xs font-semibold text-foreground tracking-tight">{title}</h4>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/**
 * Visual 4-step infographic guide explaining how to perform bio verification on the social platform.
 *
 * @param props - Display name of the target platform (e.g. TikTok).
 * @returns Rendered infographic guide panel.
 */
export function ConnectGuideInfographic({ platformDisplayName }: ConnectGuideInfographicProps) {
  const isYouTube = platformDisplayName.toLowerCase().includes('youtube');
  const bioFieldLabel = isYouTube ? 'Deskripsi Channel (Tentang)' : 'Bio';

  return (
    <div className="p-5 bg-muted/20 space-y-4">
      <div className="space-y-1">
        <h3 className="text-xs font-semibold text-foreground tracking-tight">
          Panduan Verifikasi {isYouTube ? 'Channel' : 'Bio'}
        </h3>
        <p className="text-[11px] text-muted-foreground">
          Ikuti 4 langkah mudah berikut langsung di aplikasi {platformDisplayName}:
        </p>
      </div>

      <div className="pt-2">
        <ConnectGuideStepItem
          stepNumber={1}
          title={`Buka ${isYouTube ? 'Channel' : 'Profil'} ${platformDisplayName}`}
          description={`Buka aplikasi ${platformDisplayName} dan masuk ke halaman ${isYouTube ? 'channel' : 'profil akun'} kamu.`}
        />
        <ConnectGuideStepItem
          stepNumber={2}
          title={isYouTube ? 'Klik Edit Channel' : 'Klik Edit Profil'}
          description={`Pilih opsi ${isYouTube ? 'Edit Channel' : 'Edit Profil'} untuk membuka pengaturan ${bioFieldLabel.toLowerCase()}.`}
        />
        <ConnectGuideStepItem
          stepNumber={3}
          title={`Masukkan Kode di ${bioFieldLabel}`}
          description={`Salin kode verifikasi (contoh: KD-XXXX) dan tempelkan ke kolom ${bioFieldLabel} kamu, lalu simpan.`}
        />
        <ConnectGuideStepItem
          stepNumber={4}
          title="Hapus Kode Setelah Berhasil"
          description={`Setelah verifikasi berhasil, kamu dapat langsung menghapus kode tersebut dari ${bioFieldLabel.toLowerCase()} ${platformDisplayName}.`}
          isLast
        />
      </div>
    </div>
  );
}
