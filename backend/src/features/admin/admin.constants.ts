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

export const MODERATION_FILTER = {
  IN_REVIEW: 'IN_REVIEW',
  REVISION: 'REVISION',
  ACTIVE: 'ACTIVE',
  REJECTED: 'REJECTED',
  ALL: 'ALL',
} as const;

export const MODERATION_FILTER_OPTIONS = [
  MODERATION_FILTER.IN_REVIEW,
  MODERATION_FILTER.REVISION,
  MODERATION_FILTER.ACTIVE,
  MODERATION_FILTER.REJECTED,
  MODERATION_FILTER.ALL,
] as const;

export type ModerationFilterOption = (typeof MODERATION_FILTER_OPTIONS)[number];

export const MODERATION_ACTION = {
  APPROVE: 'APPROVE',
  REVISION: 'REVISION',
  REJECT_PAYMENT: 'REJECT_PAYMENT',
  REJECT_CAMPAIGN: 'REJECT_CAMPAIGN',
} as const;

export const MODERATION_ACTION_OPTIONS = [
  MODERATION_ACTION.APPROVE,
  MODERATION_ACTION.REVISION,
  MODERATION_ACTION.REJECT_PAYMENT,
  MODERATION_ACTION.REJECT_CAMPAIGN,
] as const;

export type ModerationActionType = (typeof MODERATION_ACTION_OPTIONS)[number];

export const FREEZE_REASON = {
  BUDGET_FULL: 'BUDGET_FULL',
  EXPIRED: 'EXPIRED',
  FINISHED: 'FINISHED',
  ACTIVE_RUNNING: 'ACTIVE_RUNNING',
} as const;

export type FreezeReasonType = (typeof FREEZE_REASON)[keyof typeof FREEZE_REASON];

export const TOPUP_FILTER = {
  SUBMITTED: 'SUBMITTED',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ALL: 'ALL',
} as const;

export const TOPUP_FILTER_OPTIONS = [
  TOPUP_FILTER.SUBMITTED,
  TOPUP_FILTER.PENDING,
  TOPUP_FILTER.APPROVED,
  TOPUP_FILTER.REJECTED,
  TOPUP_FILTER.ALL,
] as const;

export type TopUpFilterOption = (typeof TOPUP_FILTER_OPTIONS)[number];

export const TOPUP_REVIEW_ACTION = {
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
} as const;

export const TOPUP_REVIEW_ACTION_OPTIONS = [
  TOPUP_REVIEW_ACTION.APPROVE,
  TOPUP_REVIEW_ACTION.REJECT,
] as const;

export type TopUpReviewAction = (typeof TOPUP_REVIEW_ACTION_OPTIONS)[number];

export const ADMIN_TOPUP_SELECT = {
  id: true,
  referenceCode: true,
  amount: true,
  uniqueCode: true,
  totalPayable: true,
  destinationBank: true,
  destinationAccount: true,
  destinationHolderName: true,
  senderBank: true,
  senderAccountName: true,
  transferProofUrl: true,
  status: true,
  rejectionReason: true,
  verifiedAt: true,
  createdAt: true,
  updatedAt: true,
  wallet: {
    select: {
      id: true,
      account: {
        select: {
          id: true,
          email: true,
          brand: {
            select: {
              id: true,
              companyName: true,
              logoUrl: true,
            },
          },
        },
      },
    },
  },
} as const;

export const ADMIN_MESSAGES = {
  // Authentication & Role Boundaries
  AUTH_REQUIRED: 'Autentikasi diperlukan.',
  ADMIN_ONLY: 'Hanya administrator yang dapat mengakses fitur ini.',
  ADMIN_ACCOUNT_NOT_FOUND: 'Data profil admin tidak ditemukan.',

  // Moderation
  MODERATION_FILTER_INVALID: 'Filter status moderasi tidak valid.',
  MODERATION_ACTION_INVALID: 'Tindakan moderasi tidak valid.',
  ADMIN_NOTE_REQUIRED: 'Catatan admin wajib diisi untuk tindakan ini.',
  CAMPAIGN_NOT_IN_REVIEW: 'Hanya kampanye berstatus menunggu peninjauan (IN_REVIEW) yang dapat dimoderasi.',
  PAYMENT_NOT_SUBMITTED_FOR_REJECT:
    'Hanya pembayaran transfer manual berstatus menunggu konfirmasi (SUBMITTED) yang dapat ditolak pembayarannya.',
  MODERATE_CAMPAIGN_SUCCESS: 'Keputusan moderasi kampanye berhasil disimpan.',
  GET_MODERATION_CAMPAIGNS_SUCCESS: 'Daftar antrean moderasi kampanye berhasil dimuat.',

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

  // Top-Up Review & Queue
  GET_TOP_UPS_SUCCESS: 'Daftar antrean top-up saldo brand berhasil dimuat.',
  REVIEW_TOP_UP_SUCCESS: 'Status top-up saldo brand berhasil diperbarui.',
  TOP_UP_NOT_FOUND: 'Data permintaan top up tidak ditemukan.',
  TOP_UP_NOT_SUBMITTED:
    'Hanya permintaan top-up yang telah mengirimkan bukti transfer (SUBMITTED) yang dapat diverifikasi.',
  TOP_UP_FILTER_INVALID: 'Filter status top up tidak valid.',
  TOP_UP_ACTION_INVALID: 'Keputusan review top up tidak valid.',
  TOP_UP_REJECTION_REASON_REQUIRED: 'Alasan penolakan wajib diisi (minimal 5 karakter).',
  TOP_UP_REJECTION_REASON_MAX: 'Alasan penolakan maksimal 500 karakter.',

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
