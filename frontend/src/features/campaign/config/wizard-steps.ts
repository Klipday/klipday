import type { WizardStepItem } from '../types';

export type { WizardStepItem };

export const CAMPAIGN_WIZARD_STEPS: WizardStepItem[] = [
  {
    id: 'basic-info',
    slug: 'step-1',
    stepNumber: 1,
    title: 'Informasi Dasar',
    description: 'Judul, platform & media utama',
  },
  {
    id: 'materials',
    slug: 'step-2',
    stepNumber: 2,
    title: 'Materi & Aset',
    description: 'Video, gambar & dokumen pendukung',
  },
  {
    id: 'brief',
    slug: 'step-3',
    stepNumber: 3,
    title: 'Brief & Panduan',
    description: 'Tujuan, instruksi, do & donts',
  },
  {
    id: 'reward-budget',
    slug: 'step-4',
    stepNumber: 4,
    title: 'Hadiah & Anggaran',
    description: 'CPM, views & alokasi saldo',
  },
  {
    id: 'review',
    slug: 'step-5',
    stepNumber: 5,
    title: 'Review Kampanye',
    description: 'Ringkasan & konfirmasi',
  },
  {
    id: 'payment',
    slug: 'step-6',
    stepNumber: 6,
    title: 'Pembayaran',
    description: 'Metode transfer / saldo',
  },
];

/**
 * Resolves the full route path for a given wizard step slug and optional campaign ID.
 *
 * @param slug - The step slug (e.g. 'step-1').
 * @param campaignId - Optional campaign ID if available in route parameters.
 * @returns The resolved URL path string.
 */
export function GetWizardStepPath(slug: string, campaignId?: string): string {
  if (campaignId) {
    return `/brand-dashboard/brand-campaigns/${campaignId}/create/${slug}`;
  }

  return `/brand-dashboard/brand-campaigns/create/${slug}`;
}
