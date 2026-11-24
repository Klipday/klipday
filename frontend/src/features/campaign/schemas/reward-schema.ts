import { z } from 'zod';

const CPM_VIEW_DIVISOR = 1000;
export const MIN_CPM_VALUE = 1000;

/**
 * Returns today's calendar date string (YYYY-MM-DD) in Asia/Jakarta (WIB) timezone.
 *
 * @returns Today's WIB YYYY-MM-DD string.
 */
function GetJakartaTodayDateString(): string {
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return formatted;
}

const cpmField = z
  .number({ error: 'Tarif CPM wajib diisi angka.' })
  .min(MIN_CPM_VALUE, 'Tarif CPM minimal Rp 1.000.');

const minViewsField = z
  .number({ error: 'Penayangan minimum wajib diisi angka.' })
  .int('Penayangan minimum harus berupa bilangan bulat.')
  .positive('Penayangan minimum harus lebih besar dari 0.');

const maxViewsField = z
  .number({ error: 'Batas penayangan maksimum wajib diisi angka.' })
  .int('Batas penayangan maksimum harus berupa bilangan bulat.')
  .positive('Batas penayangan maksimum harus lebih besar dari 0.');

const budgetField = z.number({ error: 'Total anggaran wajib diisi angka.' }).positive('Total anggaran harus lebih besar dari Rp 0.');

const startDateField = z.string().trim().min(1, 'Tanggal mulai kampanye wajib diisi.');

const endDateField = z.string().trim().min(1, 'Tanggal berakhir kampanye wajib diisi.');

/**
 * Builds the validation schema for Step 4 (Hadiah & Anggaran),
 * supporting unchanged past `startDate` on paid REVISION campaigns.
 *
 * @param options - Optional locks for paid revision campaigns.
 * @returns Configured Zod schema enforcing pricing ratios, minimum payout coverage, and WIB dates.
 */
export function CreateRewardSchema(options?: {
  allowUnchangedPastStartDate?: boolean;
  existingStartDate?: string;
}) {
  return z
    .object({
      cpm: cpmField,
      minViews: minViewsField,
      maxViews: maxViewsField,
      budget: budgetField,
      startDate: startDateField,
      endDate: endDateField,
    })
    .refine((data) => data.maxViews >= data.minViews, {
      message: 'Batas penayangan maksimum tidak boleh lebih kecil dari penayangan minimum.',
      path: ['maxViews'],
    })
    .refine((data) => data.budget >= data.cpm, {
      message: 'Total anggaran tidak boleh lebih kecil dari tarif CPM.',
      path: ['budget'],
    })
    .refine(
      (data) => {
        const minRequiredPayout = Math.ceil((data.minViews * data.cpm) / CPM_VIEW_DIVISOR);
        return data.budget >= minRequiredPayout;
      },
      {
        message: 'Total anggaran harus mencukupi minimal imbalan untuk satu video mencapai tayangan minimum.',
        path: ['budget'],
      }
    )
    .refine(
      (data) => {
        if (!data.startDate) return true;
        if (
          options?.allowUnchangedPastStartDate &&
          options.existingStartDate &&
          data.startDate === options.existingStartDate
        ) {
          return true;
        }
        const todayWib = GetJakartaTodayDateString();
        return data.startDate >= todayWib;
      },
      {
        message: 'Tanggal mulai tidak boleh lebih awal dari hari ini.',
        path: ['startDate'],
      }
    )
    .refine(
      (data) => {
        if (!data.startDate || !data.endDate) return true;
        return data.endDate > data.startDate;
      },
      {
        message: 'Tanggal berakhir harus lebih lambat dari tanggal mulai.',
        path: ['endDate'],
      }
    )
    .refine(
      (data) => {
        if (!data.endDate) return true;
        const todayWib = GetJakartaTodayDateString();
        return data.endDate > todayWib;
      },
      {
        message: 'Tanggal berakhir kampanye harus lebih lambat dari hari ini.',
        path: ['endDate'],
      }
    );
}

/**
 * Default validation schema for campaign creation wizard Step 4 (Hadiah & Anggaran).
 */
export const rewardSchema = CreateRewardSchema();

export type RewardFormValues = z.infer<typeof rewardSchema>;
