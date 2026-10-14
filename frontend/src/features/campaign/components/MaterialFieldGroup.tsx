import { Controller } from 'react-hook-form';
import { ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MATERIAL_TYPE_LABELS, MATERIAL_TYPE_OPTIONS, type MaterialTypeOption } from '../schemas';
import type { MaterialFieldGroupProps } from '../types';
import { FieldLengthTracker } from './FieldLengthTracker';
import { SanitizeHttpUrl } from '@/lib/utils';

/**
 * Renders a single field group for a campaign material and asset item.
 * Encapsulates input fields for material name, type selection, and external URL.
 *
 * @param props - Component properties for the material field item.
 * @returns The rendered material field group element.
 */
export function MaterialFieldGroup({ index, control, canRemove, onRemove, disabled = false }: MaterialFieldGroupProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-xs transition-colors space-y-4">
      {/* Group Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Materi & Aset #{index + 1}
          </span>
        </div>

        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => onRemove(index)}
            disabled={disabled}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 px-2 text-xs flex items-center gap-1.5 transition-colors">
            <Trash2 className="size-3" />
            <span>Hapus</span>
          </Button>
        ) : (
          <span className="text-[11px] font-normal text-muted-foreground/80 bg-muted/60 px-2 py-0.5 rounded">
            Wajib ada 1
          </span>
        )}
      </div>

      <FieldGroup>
        {/* Material Name */}
        <Controller
          name={`materials.${index}.name`}
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor={field.name}>
                  Nama Materi / Aset <span className="text-destructive font-medium">*</span>
                </FieldLabel>
                <FieldLengthTracker current={(field.value ?? '').length} max={100} />
              </div>
              <Input
                {...field}
                id={field.name}
                maxLength={100}
                placeholder="mis. Video Footage Unboxing, Logo Brand Transparan, Panduan Produk"
                aria-invalid={fieldState.invalid}
                disabled={disabled}
              />
              <FieldDescription className="text-xs text-muted-foreground/80 leading-relaxed">
                Beri nama atau keterangan singkat mengenai materi yang disediakan.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Grid for Material Type and Material URL */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Material Type */}
          <div className="sm:col-span-1">
            <Controller
              name={`materials.${index}.type`}
              control={control}
              render={({ field, fieldState }) => {
                const selectedTypeLabel = field.value ? MATERIAL_TYPE_LABELS[field.value as MaterialTypeOption] : undefined;

                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Tipe Materi <span className="text-destructive font-medium">*</span>
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                      <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                        <SelectValue placeholder="Pilih tipe materi">{selectedTypeLabel}</SelectValue>
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {MATERIAL_TYPE_OPTIONS.map((typeOption) => {
                          const label = MATERIAL_TYPE_LABELS[typeOption];
                          return (
                            <SelectItem key={typeOption} value={typeOption}>
                              {label}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FieldDescription className="text-xs text-muted-foreground/80 leading-relaxed">
                      Pilih format aset yang dibagikan.
                    </FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                );
              }}
            />
          </div>

          {/* Material URL */}
          <div className="sm:col-span-2">
            <Controller
              name={`materials.${index}.url`}
              control={control}
              render={({ field, fieldState }) => {
                const sanitizedUrl = SanitizeHttpUrl(field.value);

                return (
                  <Field data-invalid={fieldState.invalid}>
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor={field.name}>
                        Tautan / URL Materi <span className="text-destructive font-medium">*</span>
                      </FieldLabel>
                      {sanitizedUrl && (
                        <a
                          href={sanitizedUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:underline transition-colors">
                          <span>Uji Tautan</span>
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                    <Input
                      {...field}
                      id={field.name}
                      type="url"
                      placeholder="https://drive.google.com/..."
                      aria-invalid={fieldState.invalid}
                      disabled={disabled}
                    />
                    <FieldDescription className="text-xs text-muted-foreground/80 leading-relaxed">
                      Tautan penyimpanan cloud (Google Drive, Dropbox, Figma, dll) yang dapat diakses publik.
                    </FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                );
              }}
            />
          </div>
        </div>
      </FieldGroup>
    </div>
  );
}
