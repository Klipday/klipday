import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  DisketteIcon,
  GlobalIcon,
  LoaderIcon,
  LockIcon,
} from '@solar-icons/react/linear';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FieldLengthTracker } from '@/features/campaign/components/FieldLengthTracker';
import { BRAND_LIMITS, INDUSTRY_OPTIONS } from '../constants';
import { UseUpdateBrandProfileMutation } from '../hooks';
import { BrandProfileFormSchema, type BrandProfileFormValues } from '../schemas/brand.schemas';
import type { BrandProfileInfoFormProps } from '../types';
import { BrandLocationCombobox } from './BrandLocationCombobox';
import {
  InstagramIcon,
  TikTokIcon,
  XIcon,
  ThreadsIcon,
  YouTubeIcon,
} from './BrandSocialIcons';

/**
 * Form component managing the brand profile information,
 * including company credentials, location, website, description, and social media handles.
 *
 * @param props - Component properties with current brand profile record.
 * @returns The rendered brand profile form element.
 */
export function BrandProfileInfoForm({ profile }: BrandProfileInfoFormProps) {
  const updateProfileMutation = UseUpdateBrandProfileMutation();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<BrandProfileFormValues>({
    resolver: zodResolver(BrandProfileFormSchema),
    values: {
      companyName: profile.companyName ?? '',
      phoneNumber: profile.phoneNumber ?? '',
      industry: profile.industry ?? undefined,
      location: profile.location ?? '',
      website: profile.website ?? '',
      description: profile.description ?? '',
      instagramHandle: profile.instagramHandle ?? '',
      tiktokHandle: profile.tiktokHandle ?? '',
      xHandle: profile.xHandle ?? '',
      threadsHandle: profile.threadsHandle ?? '',
      youtubeChannel: profile.youtubeChannel ?? '',
    },
  });

  const descriptionValue = useWatch({ control, name: 'description' }) ?? '';

  const OnSubmit = (values: BrandProfileFormValues) => {
    const cleanPhoneNumber = values.phoneNumber?.replace(/[\s-]/g, '').trim() ?? '';

    updateProfileMutation.mutate({
      companyName: values.companyName.trim(),
      phoneNumber: cleanPhoneNumber || null,
      industry: values.industry ?? null,
      location: values.location ? values.location.trim() : null,
      website: values.website ? values.website.trim() : null,
      description: values.description ? values.description.trim() : null,
      instagramHandle: values.instagramHandle ? values.instagramHandle.replace(/^@/, '').trim() : null,
      tiktokHandle: values.tiktokHandle ? values.tiktokHandle.replace(/^@/, '').trim() : null,
      xHandle: values.xHandle ? values.xHandle.replace(/^@/, '').trim() : null,
      threadsHandle: values.threadsHandle ? values.threadsHandle.replace(/^@/, '').trim() : null,
      youtubeChannel: values.youtubeChannel ? values.youtubeChannel.replace(/^@/, '').trim() : null,
    });
  };

  return (
    <form onSubmit={handleSubmit(OnSubmit)} className="space-y-8">
      {/* SECTION 1: Informasi Dasar */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Informasi Dasar Brand
          </h2>
          <p className="text-xs text-muted-foreground">
            Informasi utama yang tampil pada kampanye dan materi clipping Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Company Name */}
          <div className="space-y-1.5">
            <Label htmlFor="companyName" className="text-xs font-medium">
              Nama Brand / Perusahaan <span className="text-destructive">*</span>
            </Label>
            <Input
              id="companyName"
              type="text"
              {...register('companyName')}
              placeholder="Contoh: Acme Studios"
              className="h-10 text-xs rounded-xl"
            />
            {errors.companyName ? (
              <p className="text-[11px] text-destructive">{errors.companyName.message}</p>
            ) : null}
          </div>

          {/* Industry Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="industry-select" className="text-xs font-medium">
              Kategori Industri
            </Label>
            <Controller
              control={control}
              name="industry"
              render={({ field }) => (
                <Select
                  value={field.value ?? undefined}
                  onValueChange={(val) => field.onChange(val)}>
                  <SelectTrigger id="industry-select" className="h-10 w-full text-xs rounded-xl">
                    <SelectValue placeholder="Pilih Industri Brand" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 rounded-xl">
                    {INDUSTRY_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value} className="text-xs">
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Location Combobox */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Domisili / Kota</Label>
            <Controller
              control={control}
              name="location"
              render={({ field }) => (
                <BrandLocationCombobox
                  value={field.value ?? ''}
                  onChange={(val) => field.onChange(val)}
                />
              )}
            />
          </div>

          {/* Website */}
          <div className="space-y-1.5">
            <Label htmlFor="website" className="text-xs font-medium">
              Website Resmi
            </Label>
            <div className="relative">
              <GlobalIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="website"
                type="url"
                {...register('website')}
                placeholder="https://brandanda.com"
                className="h-10 pl-9 text-xs rounded-xl"
              />
            </div>
            {errors.website ? (
              <p className="text-[11px] text-destructive">{errors.website.message}</p>
            ) : null}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="description" className="text-xs font-medium">
              Deskripsi Singkat Brand
            </Label>
            <FieldLengthTracker
              current={descriptionValue.length}
              max={BRAND_LIMITS.MAX_DESCRIPTION_LENGTH}
            />
          </div>
          <Textarea
            id="description"
            rows={3}
            {...register('description')}
            placeholder="Jelaskan mengenai produk, nilai utama, atau fokus bisnis brand Anda..."
            className="text-xs rounded-xl resize-none"
          />
          {errors.description ? (
            <p className="text-[11px] text-destructive">{errors.description.message}</p>
          ) : null}
        </div>
      </div>

      <hr className="border-border/40" />

      {/* SECTION 2: Media Sosial Resmi */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Media Sosial Brand
          </h2>
          <p className="text-xs text-muted-foreground">
            Tautkan akun media sosial resmi brand Anda untuk mempermudah identifikasi clippers.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Instagram */}
          <div className="space-y-1.5">
            <Label htmlFor="instagramHandle" className="inline-flex items-center gap-1.5 text-xs font-medium">
              <InstagramIcon className="size-3.5 text-muted-foreground" />
              <span>Instagram</span>
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                @
              </span>
              <Input
                id="instagramHandle"
                type="text"
                {...register('instagramHandle')}
                placeholder="username"
                className="h-10 pl-7 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* TikTok */}
          <div className="space-y-1.5">
            <Label htmlFor="tiktokHandle" className="inline-flex items-center gap-1.5 text-xs font-medium">
              <TikTokIcon className="size-3.5 text-muted-foreground" />
              <span>TikTok</span>
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                @
              </span>
              <Input
                id="tiktokHandle"
                type="text"
                {...register('tiktokHandle')}
                placeholder="username"
                className="h-10 pl-7 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* X / Twitter */}
          <div className="space-y-1.5">
            <Label htmlFor="xHandle" className="inline-flex items-center gap-1.5 text-xs font-medium">
              <XIcon className="size-3.5 text-muted-foreground" />
              <span>X (Twitter)</span>
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                @
              </span>
              <Input
                id="xHandle"
                type="text"
                {...register('xHandle')}
                placeholder="username"
                className="h-10 pl-7 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Threads */}
          <div className="space-y-1.5">
            <Label htmlFor="threadsHandle" className="inline-flex items-center gap-1.5 text-xs font-medium">
              <ThreadsIcon className="size-3.5 text-muted-foreground" />
              <span>Threads</span>
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                @
              </span>
              <Input
                id="threadsHandle"
                type="text"
                {...register('threadsHandle')}
                placeholder="username"
                className="h-10 pl-7 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* YouTube */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="youtubeChannel" className="inline-flex items-center gap-1.5 text-xs font-medium">
              <YouTubeIcon className="size-3.5 text-muted-foreground" />
              <span>YouTube</span>
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                @
              </span>
              <Input
                id="youtubeChannel"
                type="text"
                {...register('youtubeChannel')}
                placeholder="channel"
                className="h-10 pl-7 text-xs rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>

      <hr className="border-border/40" />

      {/* SECTION 3: Kontak Utama Akun */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Kontak Utama Akun
          </h2>
          <p className="text-xs text-muted-foreground">
            Alamat email dan nomor WhatsApp untuk koordinasi kampanye dan notifikasi akun.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Readonly Email */}
          <div className="space-y-1.5">
            <Label htmlFor="readonly-email" className="text-xs font-medium text-muted-foreground">
              Email Akun
            </Label>
            <div className="relative">
              <Input
                id="readonly-email"
                type="email"
                value={profile.email}
                disabled
                className="h-10 pr-9 bg-muted/40 text-xs font-mono text-muted-foreground rounded-xl cursor-not-allowed"
              />
              <LockIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Alamat email terdaftar pada akun Klipday Anda dan tidak dapat diubah.
            </p>
          </div>

          {/* Editable WhatsApp Number */}
          <div className="space-y-1.5">
            <Label htmlFor="phoneNumber" className="text-xs font-medium">
              Nomor WhatsApp
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              {...register('phoneNumber')}
              placeholder="Contoh: 628123456789"
              className="h-10 text-xs rounded-xl"
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

      {/* Save Button */}
      <div className="flex items-center justify-end pt-2">
        <Button
          type="submit"
          size="default"
          disabled={updateProfileMutation.isPending || !isDirty}
          className="cursor-pointer font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs">
          {updateProfileMutation.isPending ? (
            <LoaderIcon className="mr-1.5 size-4 animate-spin" />
          ) : (
            <DisketteIcon className="mr-1.5 size-4" />
          )}
          <span>Simpan Perubahan</span>
        </Button>
      </div>
    </form>
  );
}
