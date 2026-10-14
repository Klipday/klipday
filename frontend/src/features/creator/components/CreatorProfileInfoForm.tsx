import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Lock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BrandLocationCombobox } from '@/features/brand/components';
import { FieldLengthTracker } from '@/features/campaign/components/FieldLengthTracker';
import { CREATOR_LIMITS } from '../constants';
import { UseUpdateCreatorProfileMutation } from '../hooks';
import {
  CreatorProfileFormSchema,
  type CreatorProfileFormValues,
} from '../schemas/creator.schemas';
import type { CreatorProfileInfoFormProps } from '../types';
import {
  BuildCreatorProfileFormDefaults,
  BuildUpdateCreatorPayload,
  GetMaxBirthDateString,
} from '../utils/creator-profile';
import { CreatorCategoryPicker } from './CreatorCategoryPicker';

/**
 * Form component managing the creator's personal identity, birth date (18+ gate),
 * location, bio, content niche categories, and contact information.
 *
 * @param props - Component properties containing the active creator profile record.
 * @returns The rendered creator profile form element.
 */
export function CreatorProfileInfoForm({ profile }: CreatorProfileInfoFormProps) {
  const updateProfileMutation = UseUpdateCreatorProfileMutation();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<CreatorProfileFormValues>({
    resolver: zodResolver(CreatorProfileFormSchema),
    defaultValues: BuildCreatorProfileFormDefaults(profile),
    values: BuildCreatorProfileFormDefaults(profile),
  });

  const bioValue = useWatch({ control, name: 'bio' }) ?? '';
  const maxBirthDate = GetMaxBirthDateString();

  const OnSubmit = (values: CreatorProfileFormValues) => {
    const payload = BuildUpdateCreatorPayload(values);
    updateProfileMutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit(OnSubmit)} className="space-y-8">
      {/* SECTION 1: Informasi Dasar */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Informasi Dasar Kreator
          </h2>
          <p className="text-xs text-muted-foreground">
            Informasi identitas diri Anda untuk keperluan verifikasi legalitas dan kecocokan kampanye.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs font-medium">
              Nama Lengkap (sesuai KTP) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              type="text"
              {...register('fullName')}
              placeholder="Contoh: Rina Putri"
              className="h-9 rounded-xl text-xs border-border/60 bg-card"
            />
            {errors.fullName ? (
              <p className="text-[11px] text-destructive">{errors.fullName.message}</p>
            ) : null}
          </div>

          {/* Date of Birth */}
          <div className="space-y-1.5">
            <Label htmlFor="dateOfBirth" className="text-xs font-medium">
              Tanggal Lahir <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              max={maxBirthDate}
              {...register('dateOfBirth')}
              className="h-9 rounded-xl text-xs border-border/60 bg-card"
            />
            {errors.dateOfBirth ? (
              <p className="text-[11px] text-destructive">{errors.dateOfBirth.message}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Minimal usia 18 tahun. Tanggal lahir bersifat privat dan tidak ditampilkan kepada brand.
              </p>
            )}
          </div>
        </div>

        {/* Domicile / City */}
        <div className="space-y-1.5">
          <Label htmlFor="location" className="text-xs font-medium">
            Kota Domisili
          </Label>
          <Controller
            control={control}
            name="location"
            render={({ field }) => (
              <BrandLocationCombobox
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />
          <p className="text-[11px] text-muted-foreground">
            Pilih kota tempat tinggal Anda saat ini untuk preferensi kampanye lokal.
          </p>
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="bio" className="text-xs font-medium">
              Bio Singkat
            </Label>
            <FieldLengthTracker
              current={bioValue.length}
              max={CREATOR_LIMITS.MAX_BIO_LENGTH}
            />
          </div>
          <Textarea
            id="bio"
            rows={3}
            {...register('bio')}
            placeholder="Jelaskan secara singkat gaya konten, tema video, atau keunikan kreasi Anda..."
            maxLength={CREATOR_LIMITS.MAX_BIO_LENGTH}
            className="rounded-xl text-xs border-border/60 bg-card resize-none"
          />
          {errors.bio ? (
            <p className="text-[11px] text-destructive">{errors.bio.message}</p>
          ) : null}
        </div>
      </div>

      {/* Hairline Divider */}
      <div className="border-t border-border/40" />

      {/* SECTION 2: Niche Konten */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Niche & Kategori Konten <span className="text-destructive">*</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Pilih 1 hingga 3 kategori topik konten yang paling sering Anda buat untuk rekomendasi kampanye yang relevan.
          </p>
        </div>

        <Controller
          control={control}
          name="contentCategories"
          render={({ field }) => (
            <CreatorCategoryPicker
              selectedCategories={field.value ?? []}
              onChange={field.onChange}
            />
          )}
        />
        {errors.contentCategories ? (
          <p className="text-[11px] text-destructive">
            {errors.contentCategories.message}
          </p>
        ) : null}
      </div>

      {/* Hairline Divider */}
      <div className="border-t border-border/40" />

      {/* SECTION 3: Kontak Akun */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Kontak Akun
          </h2>
          <p className="text-xs text-muted-foreground">
            Alamat email dan nomor WhatsApp untuk koordinasi dan notifikasi pencairan dana.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Email (Locked) */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium">
              Email Akun
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="h-9 rounded-xl pr-9 text-xs border-border/60 bg-muted/40 cursor-not-allowed select-none text-muted-foreground"
              />
              <Lock className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Alamat email terdaftar pada akun Klipday Anda dan tidak dapat diubah.
            </p>
          </div>

          {/* WhatsApp Number */}
          <div className="space-y-1.5">
            <Label htmlFor="phoneNumber" className="text-xs font-medium">
              Nomor WhatsApp
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              {...register('phoneNumber')}
              placeholder="Contoh: 628123456789"
              className="h-9 rounded-xl text-xs border-border/60 bg-card"
            />
            {errors.phoneNumber ? (
              <p className="text-[11px] text-destructive">{errors.phoneNumber.message}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Gunakan nomor aktif diawali 62 (contoh: 628123456789).
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Form Submit Button */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          size="sm"
          disabled={updateProfileMutation.isPending || !isDirty}
          className="cursor-pointer text-xs">
          {updateProfileMutation.isPending ? (
            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
          ) : (
            <Save className="mr-1.5 size-3.5" />
          )}
          <span>Simpan Perubahan</span>
        </Button>
      </div>
    </form>
  );
}
