import { z } from 'zod';

export const CAMPAIGN_TYPE_OPTIONS = ['PRODUCT', 'SERVICE', 'CONTENT'] as const;

export type CampaignTypeOption = (typeof CAMPAIGN_TYPE_OPTIONS)[number];

export const CAMPAIGN_TYPE_LABELS: Record<CampaignTypeOption, string> = {
  PRODUCT: 'Produk Fisik',
  SERVICE: 'Layanan / Jasa',
  CONTENT: 'Konten Digital',
};

export const CAMPAIGN_CATEGORY_OPTIONS = [
  'BEAUTY_SKINCARE',
  'FASHION_STYLE',
  'FOOD_BEVERAGE',
  'HEALTH_FITNESS',
  'TECHNOLOGY_GADGETS',
  'LIFESTYLE',
  'GAMING',
  'TRAVEL',
  'ENTERTAINMENT',
  'OTHER',
] as const;
export type CampaignCategoryOption = (typeof CAMPAIGN_CATEGORY_OPTIONS)[number];

export const CAMPAIGN_CATEGORY_LABELS: Record<CampaignCategoryOption, string> = {
  BEAUTY_SKINCARE: 'Kecantikan & Perawatan (Beauty & Skincare)',
  FASHION_STYLE: 'Fashion & Gaya (Fashion & Style)',
  FOOD_BEVERAGE: 'Makanan & Minuman (Food & Beverage)',
  HEALTH_FITNESS: 'Kesehatan & Kebugaran (Health & Fitness)',
  TECHNOLOGY_GADGETS: 'Teknologi & Gadget (Technology & Gadgets)',
  LIFESTYLE: 'Gaya Hidup (Lifestyle)',
  GAMING: 'Gaming',
  TRAVEL: 'Perjalanan & Wisata (Travel)',
  ENTERTAINMENT: 'Hiburan (Entertainment)',
  OTHER: 'Lainnya (Other)',
};

export const CAMPAIGN_PLATFORM_OPTIONS = ['TIKTOK', 'INSTAGRAM', 'YOUTUBE'] as const;

export type CampaignPlatformOption = (typeof CAMPAIGN_PLATFORM_OPTIONS)[number];

export const CAMPAIGN_PLATFORM_LABELS: Record<CampaignPlatformOption, string> = {
  TIKTOK: 'TikTok',
  INSTAGRAM: 'Instagram Reels',
  YOUTUBE: 'YouTube Shorts',
};

export const basicInfoSchema = z.object({
  title: z.string().trim().min(1, 'Judul kampanye wajib diisi.').max(100, 'Judul kampanye maksimal 100 karakter.'),
  description: z.string().trim().min(1, 'Deskripsi kampanye wajib diisi.').max(2000, 'Deskripsi kampanye maksimal 2000 karakter.'),
  campaignType: z.enum(CAMPAIGN_TYPE_OPTIONS, {
    error: 'Pilih jenis kampanye yang valid.',
  }),
  campaignCategory: z.enum(CAMPAIGN_CATEGORY_OPTIONS, {
    error: 'Pilih kategori kampanye yang valid.',
  }),
  thumbnailUrl: z
    .string()
    .trim()
    .min(1, 'URL thumbnail wajib diisi.')
    .url('Format URL thumbnail tidak valid.')
    .regex(/^https?:\/\//i, 'Format URL thumbnail tidak valid (harus diawali http:// atau https://).'),
  platforms: z
    .array(
      z.enum(CAMPAIGN_PLATFORM_OPTIONS, {
        error: 'Pilih platform yang valid.',
      })
    )
    .min(1, 'Pilih minimal satu platform promosi.'),
  mainMediaUrl: z
    .string()
    .trim()
    .min(1, 'URL tautan media utama wajib diisi.')
    .url('Format URL tautan media utama tidak valid.')
    .regex(/^https?:\/\//i, 'Format URL tautan media utama tidak valid (harus diawali http:// atau https://).'),
});

export type BasicInfoFormValues = z.infer<typeof basicInfoSchema>;
