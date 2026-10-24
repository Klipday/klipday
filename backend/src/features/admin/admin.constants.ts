export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 12;
export const MAX_LIMIT = 100;
export const MAX_SEARCH_LENGTH = 100;
export const MAX_REVIEW_NOTE_LENGTH = 1000;
export const CPM_VIEW_DIVISOR = 1000;
export const BUDGET_DECIMAL_PLACES = 2;

export const SETTLEMENT_FILTER = {
  NEED_SETTLEMENT: 'NEED_SETTLEMENT',
  BUDGET_FULL: 'BUDGET_FULL',
  EXPIRED: 'EXPIRED',
  FINISHED: 'FINISHED',
} as const;

export const SETTLEMENT_FILTER_OPTIONS = [
  SETTLEMENT_FILTER.NEED_SETTLEMENT,
  SETTLEMENT_FILTER.BUDGET_FULL,
  SETTLEMENT_FILTER.EXPIRED,
  SETTLEMENT_FILTER.FINISHED,
] as const;

export type SettlementFilterOption = (typeof SETTLEMENT_FILTER_OPTIONS)[number];

export const FREEZE_REASON = {
  BUDGET_FULL: 'BUDGET_FULL',
  EXPIRED: 'EXPIRED',
  FINISHED: 'FINISHED',
  ACTIVE_RUNNING: 'ACTIVE_RUNNING',
} as const;

export type FreezeReasonType = (typeof FREEZE_REASON)[keyof typeof FREEZE_REASON];

export const ADMIN_MESSAGES = {
  // Authentication & Role Boundaries
  AUTH_REQUIRED: 'Autentikasi diperlukan.',
  ADMIN_ONLY: 'Hanya administrator yang dapat mengakses fitur settlement kampanye.',

  // Lookups & State Validation
  CAMPAIGN_NOT_FOUND: 'Kampanye tidak ditemukan.',
  SUBMISSION_NOT_FOUND: 'Data pengajuan video tidak ditemukan.',
  CAMPAIGN_ALREADY_SETTLED: 'Kampanye ini sudah diselesaikan (settled) sebelumnya.',
  CAMPAIGN_NOT_ACTIVE_FOR_SETTLEMENT: 'Hanya kampanye berstatus aktif yang dapat diproses settlement.',
  SUBMISSION_NOT_ELIGIBLE_FOR_DISQUALIFY:
    'Hanya pengajuan video berstatus disetujui (APPROVED) yang dapat didiskualifikasi pada tahap settlement.',
  DEFAULT_DISQUALIFY_REASON:
    'Didiskualifikasi oleh Admin saat audit settlement karena ketidaksesuaian tayangan atau video dihapus.',
  LEFTOVER_SUBMISSION_SETTLEMENT_NOTE:
    'Periode kampanye berakhir dan settlement anggaran telah selesai.',

  // Zod Validation Messages
  PAGE_NUMBER_REQUIRED: 'Halaman harus berupa angka yang valid.',
  PAGE_INTEGER: 'Halaman harus berupa bilangan bulat.',
  PAGE_POSITIVE: 'Halaman harus lebih besar dari nol.',
  LIMIT_NUMBER_REQUIRED: 'Batas data harus berupa angka yang valid.',
  LIMIT_INTEGER: 'Batas data harus berupa bilangan bulat.',
  LIMIT_POSITIVE: 'Batas data harus lebih besar dari nol.',
  LIMIT_MAX_EXCEEDED: 'Batas data maksimal adalah 100 item.',
  SEARCH_MAX_EXCEEDED: 'Kata kunci pencarian maksimal 100 karakter.',
  FILTER_INVALID: 'Filter status settlement tidak valid.',
  REVIEW_NOTE_MAX_EXCEEDED: 'Catatan alasan diskualifikasi maksimal 1000 karakter.',
  VERIFIED_VIEWS_INVALID: 'Jumlah tayangan terverifikasi harus berupa bilangan bulat non-negatif.',
  INVALID_PAYLOAD: 'Data permintaan tidak valid.',

  // Success Messages
  GET_SETTLEMENTS_SUCCESS: 'Daftar kampanye settlement berhasil dimuat.',
  GET_CAMPAIGN_SETTLEMENT_SUMMARY_SUCCESS: 'Rincian settlement kampanye berhasil dimuat.',
  DISQUALIFY_SUBMISSION_SUCCESS:
    'Pengajuan video berhasil didiskualifikasi dan alokasi reward telah disesuaikan otomatis.',
  UPDATE_VIEWS_RESHUFFLE_SUCCESS:
    'Tayangan video berhasil diperbarui dan alokasi reward telah disesuaikan.',
  RECALCULATE_FIFO_SUCCESS: 'Alokasi reward berhasil dihitung ulang.',
  FINALIZE_SETTLEMENT_SUCCESS:
    'Settlement kampanye berhasil diselesaikan. Reward kreator dan sisa budget brand telah didistribusikan.',
} as const;
