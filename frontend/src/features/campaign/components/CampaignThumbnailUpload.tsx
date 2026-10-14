import { useRef, useState } from 'react';
import { ExternalLink, ImagePlus, Loader2, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn, SanitizeHttpUrl } from '@/lib/utils';
import { UploadCampaignThumbnail } from '../api';
import type { CampaignThumbnailUploadProps } from '../types';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Thumbnail image uploader for campaigns.
 * Supports drag-and-drop, direct file selection, progress tracking,
 * client-side format & size guards, and image preview with replace/remove actions.
 *
 * @param props - Component properties conforming to CampaignThumbnailUploadProps.
 * @returns The rendered thumbnail upload component.
 */
export function CampaignThumbnailUpload({ value, onChange, campaignId, disabled = false }: CampaignThumbnailUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sanitizedThumbnailUrl = SanitizeHttpUrl(value);

  /**
   * Validates and streams an image file to the backend.
   *
   * @param file - Selected or dropped File instance.
   */
  async function ProcessUpload(file: File): Promise<void> {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.error('Format file tidak didukung. Harap pilih gambar JPG, PNG, atau WEBP.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error('Ukuran file terlalu besar. Batas maksimal adalah 5MB.');
      return;
    }

    if (!campaignId) {
      toast.error('ID kampanye tidak ditemukan. Silakan muat ulang halaman.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const publicUrl = await UploadCampaignThumbnail(campaignId, file, (percent) => {
        setUploadProgress(percent);
      });

      onChange(publicUrl);
      toast.success('Thumbnail kampanye berhasil diunggah.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengunggah thumbnail.';
      toast.error(message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  /**
   * Handles file selection through the browser file picker.
   *
   * @param event - Change event from the file input element.
   */
  function HandleFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    void ProcessUpload(selectedFile);
  }

  /**
   * Opens the native file dialog when the dropzone or replace button is triggered.
   */
  function TriggerFilePicker(): void {
    if (disabled || isUploading) {
      return;
    }

    fileInputRef.current?.click();
  }

  /**
   * Handles dragover event to show visual drop target state.
   */
  function HandleDragOver(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    if (disabled || isUploading) {
      return;
    }

    setIsDragging(true);
  }

  /**
   * Handles dragleave event to clear visual drop target state.
   */
  function HandleDragLeave(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragging(false);
  }

  /**
   * Handles file drop onto the dropzone area.
   */
  function HandleDrop(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragging(false);

    if (disabled || isUploading) {
      return;
    }

    const droppedFile = event.dataTransfer.files?.[0];
    if (!droppedFile) {
      return;
    }

    void ProcessUpload(droppedFile);
  }

  /**
   * Removes the current thumbnail URL from the form state.
   */
  function HandleRemove(): void {
    if (disabled || isUploading) {
      return;
    }

    onChange('');
  }

  const isInteractive = !disabled && !isUploading;
  const hasExistingImage = Boolean(value && value.trim() !== '');

  return (
    <div className="w-full space-y-3">
      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={HandleFileChange}
        disabled={!isInteractive}
        className="sr-only"
        aria-label="Unggah Gambar Thumbnail"
      />

      {/* Uploading State */}
      {isUploading ? (
        <div className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-primary/50 rounded-xl bg-primary/5 min-h-[180px]">
          <Loader2 className="size-8 animate-spin text-primary" />
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-foreground">Mengunggah gambar... {uploadProgress}%</p>
            <p className="text-xs text-muted-foreground">Mengalirkan file langsung ke penyimpanan cloud</p>
          </div>
          <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
              style={{ width: `${Math.max(uploadProgress, 5)}%` }}
            />
          </div>
        </div>
      ) : hasExistingImage ? (
        /* Preview State */
        <div className="space-y-3">
          <div className="relative group w-full aspect-video max-h-56 sm:max-h-64 rounded-xl overflow-hidden border border-border bg-muted/20">
            <img
              src={value}
              alt="Preview Thumbnail Kampanye"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            />
            {/* High-contrast hover overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 p-4">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={TriggerFilePicker}
                disabled={!isInteractive}
                className="gap-1.5 shadow-sm font-medium">
                <RefreshCw className="size-3.5" />
                <span>Ganti Gambar</span>
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={HandleRemove}
                disabled={!isInteractive}
                className="gap-1.5 shadow-sm font-medium">
                <Trash2 className="size-3.5" />
                <span>Hapus Thumbnail</span>
              </Button>
            </div>
          </div>

          {/* Action row below preview */}
          <div className="flex items-center justify-between px-0.5 text-xs">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={TriggerFilePicker}
                disabled={!isInteractive}
                className="h-7 text-xs gap-1.5">
                <RefreshCw className="size-3" />
                <span>Ganti Gambar</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={HandleRemove}
                disabled={!isInteractive}
                className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="size-3" />
                <span>Hapus</span>
              </Button>
            </div>

            {sanitizedThumbnailUrl ? (
              <a
                href={sanitizedThumbnailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline font-medium transition-colors">
                <span>Lihat Ukuran Penuh</span>
                <ExternalLink className="size-3" />
              </a>
            ) : null}
          </div>
        </div>
      ) : (
        /* Empty Dropzone State */
        <div
          role="button"
          tabIndex={0}
          onClick={TriggerFilePicker}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              TriggerFilePicker();
            }
          }}
          onDragOver={HandleDragOver}
          onDragLeave={HandleDragLeave}
          onDrop={HandleDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-2.5 p-6 sm:p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer select-none text-center',
            isDragging
              ? 'border-primary bg-primary/10 scale-[0.99]'
              : 'border-border/80 hover:border-primary/50 hover:bg-muted/30 bg-muted/10',
            disabled && 'opacity-60 cursor-not-allowed hover:border-border/80 hover:bg-muted/10'
          )}>
          <div className="size-11 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
            {isDragging ? <ImagePlus className="size-5 text-primary animate-pulse" /> : <UploadCloud className="size-5" />}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              <span className="text-primary hover:underline">Klik untuk memilih</span> atau seret file ke sini
            </p>
            <p className="text-xs text-muted-foreground/80">Format JPG, PNG, atau WEBP (Maksimal 5MB, rekomendasi rasio 16:9)</p>
          </div>
        </div>
      )}
    </div>
  );
}
