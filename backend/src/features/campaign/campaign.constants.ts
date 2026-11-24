import type { Prisma } from '../../generated/prisma/client.js';
import { CampaignStatus, PaymentStatus, Status, SubmissionStatus } from '../../generated/prisma/enums.js';

/**
 * Whitelist of scalar fields copied 1:1 from the campaign edit payload into Prisma update queries.
 */
export const SCALAR_FIELDS = [
  'title',
  'description',
  'campaignType',
  'campaignCategory',
  'thumbnailUrl',
  'platforms',
  'mainMediaUrl',
  'cpm',
  'minViews',
  'maxViews',
  'maxSubmissionsPerPlatform',
  'budget',
  'startDate',
  'endDate',
] as const;

export const MAX_THUMBNAIL_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_THUMBNAIL_MIME_TYPES = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

export const SUBMITTABLE_CAMPAIGN_STATUSES = [CampaignStatus.DRAFT, CampaignStatus.REVISION, CampaignStatus.AWAITING_PAYMENT] as const;

export const EDITABLE_CAMPAIGN_STATUSES = [CampaignStatus.DRAFT, CampaignStatus.REVISION, CampaignStatus.AWAITING_PAYMENT] as const;

export const FINANCIAL_LOCKED_PAYMENT_STATUSES = [PaymentStatus.SUBMITTED, PaymentStatus.APPROVED] as const;

export const CAMPAIGN_FIELD_LIMITS = {
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 2000,
  MATERIAL_NAME_MAX_LENGTH: 100,
  MATERIALS_MAX_COUNT: 25,
  BRIEF_PURPOSE_MAX_LENGTH: 1000,
  BRIEF_KEY_MESSAGE_MAX_LENGTH: 1000,
  BRIEF_CALL_TO_ACTION_MAX_LENGTH: 500,
  BRIEF_IMPRESSION_MAX_LENGTH: 500,
  BRIEF_NARRATION_MAX_LENGTH: 2000,
  BRIEF_REQUIRED_CAPTION_MAX_LENGTH: 2000,
  BRIEF_GUIDELINES_MAX_LENGTH: 3000,
  BRIEF_ARRAY_ITEM_MAX_LENGTH: 200,
  BRIEF_ARRAY_MAX_ITEMS: 30,
  MIN_CPM_VALUE: 1000,
  MAX_CPM_VALUE: 1_000_000_000,
  MAX_SUBMISSIONS_PER_PLATFORM_LIMIT: 50,
  MAX_BUDGET_VALUE: 100_000_000_000,
  MAX_PG_INT: 2_147_483_647,
  CPM_VIEW_DIVISOR: 1000,
  SEN_PER_RUPIAH: 100,
  CPM_SEN_DIVISOR: 100_000n,
  BUDGET_DECIMAL_PLACES: 2,
  JAKARTA_UTC_OFFSET_MS: 7 * 60 * 60 * 1000,
  IMAGE_SIGNATURE_HEADER_BYTES: 12,
} as const;

export const DEFAULT_CAMPAIGN_STORAGE_BUCKET = 'campaign-thumbnails';

export const CAMPAIGN_RATE_LIMITS = {
  CREATE_WINDOW_MS: 15 * 60 * 1000,
  CREATE_MAX_REQUESTS: 30,
  UPLOAD_WINDOW_MS: 15 * 60 * 1000,
  UPLOAD_MAX_REQUESTS: 40,
} as const;

export const FEATURED_CAMPAIGNS_LIMIT = 5;
export const FEATURED_CAMPAIGNS_MIN_COUNT = 3;

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

export const CAMPAIGN_SORT_OPTIONS = ['latest', 'highest_cpm', 'lowest_cpm', 'highest_total_budget', 'highest_maximum_views'] as const;

/**
 * Truly lean base select projection for campaign card feeds (GET /campaigns, GET /campaigns/featured).
 * Fetches only basic campaign info, brand summary, and submissions count without pulling heavy brief or materials relations.
 */
const CAMPAIGN_CARD_SELECT = {
  id: true,
  title: true,
  description: true,
  campaignType: true,
  campaignCategory: true,
  thumbnailUrl: true,
  platforms: true,
  maxSubmissionsPerPlatform: true,
  mainMediaUrl: true,
  cpm: true,
  minViews: true,
  maxViews: true,
  budget: true,
  startDate: true,
  endDate: true,
  status: true,
  campaignStatus: true,
  adminNote: true,
  isFeatured: true,
  featuredBannerUrl: true,
  featuredOrder: true,
  featuredUntil: true,
  createdAt: true,
  updatedAt: true,
  brandId: true,
  brand: {
    select: {
      id: true,
      companyName: true,
      industry: true,
    },
  },
  _count: {
    select: {
      submissions: {
        where: { status: Status.ACTIVE },
      },
    },
  },
} as const satisfies Prisma.CampaignSelect;

/**
 * Full select projection for single campaign detail view (GET /campaigns/:id).
 * Includes active materials, brief guidelines, brand details, and submissions count.
 */
export const CAMPAIGN_DETAIL_SELECT = {
  ...CAMPAIGN_CARD_SELECT,
  materials: {
    where: { status: Status.ACTIVE },
    select: {
      id: true,
      name: true,
      type: true,
      url: true,
      status: true,
    },
  },
  brief: {
    where: { status: Status.ACTIVE },
    select: {
      id: true,
      purpose: true,
      keyMessage: true,
      narration: true,
      impression: true,
      callToAction: true,
      requiredCaption: true,
      hashtags: true,
      mentionTags: true,
      dos: true,
      donts: true,
      guidelines: true,
      status: true,
    },
  },
  payments: {
    where: { status: Status.ACTIVE },
    orderBy: { createdAt: 'desc' },
    take: 1,
    select: {
      id: true,
      campaignId: true,
      amount: true,
      uniqueCode: true,
      totalPayable: true,
      destinationBank: true,
      destinationAccount: true,
      senderProviderName: true,
      senderAccountName: true,
      transferProofUrl: true,
      paymentStatus: true,
      rejectionReason: true,
      verifiedByAdminId: true,
      verifiedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} as const satisfies Prisma.CampaignSelect;

const ESCROW_SUBMISSIONS_SELECT = {
  lastMetricsSyncedAt: true,
  finalSnapshotSyncedAt: true,
  submissions: {
    where: {
      status: Status.ACTIVE,
      submissionStatus: {
        in: [SubmissionStatus.APPROVED, SubmissionStatus.VERIFIED],
      },
    },
    select: {
      earnings: true,
    },
  },
} as const satisfies Prisma.CampaignSelect;

export const CAMPAIGN_CARD_ESCROW_SELECT = {
  ...CAMPAIGN_CARD_SELECT,
  ...ESCROW_SUBMISSIONS_SELECT,
} as const satisfies Prisma.CampaignSelect;

/**
 * Lightweight draft/revision card select projection including step-progress fields
 * (`materials` and mandatory `brief` fields) without pulling submissions.
 */
export const CAMPAIGN_CARD_DRAFT_SELECT = {
  ...CAMPAIGN_CARD_SELECT,
  materials: {
    where: { status: Status.ACTIVE },
    select: {
      id: true,
      name: true,
      type: true,
      url: true,
      status: true,
    },
  },
  brief: {
    where: { status: Status.ACTIVE },
    select: {
      id: true,
      purpose: true,
      keyMessage: true,
      callToAction: true,
      status: true,
    },
  },
} as const satisfies Prisma.CampaignSelect;

export const CAMPAIGN_DETAIL_ESCROW_SELECT = {
  ...CAMPAIGN_DETAIL_SELECT,
  ...ESCROW_SUBMISSIONS_SELECT,
} as const satisfies Prisma.CampaignSelect;

export const DEFAULT_KLIPDAY_BANK_NAME = 'BCA';
export const DEFAULT_KLIPDAY_BANK_ACCOUNT_NO = '1234567890';
export const DEFAULT_KLIPDAY_BANK_ACCOUNT_NAME = 'PT Klipday Media Indonesia';

export const WALLET_PAYMENT_DESTINATION_BANK = 'SALDO_KLIPDAY';
export const WALLET_PAYMENT_DESTINATION_ACCOUNT = 'WALLET';

export const ADMIN_PAYMENT_VERIFY_ACTIONS = ['APPROVE', 'REJECT'] as const;

export const MAX_PAYMENT_PROOF_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_PAYMENT_PROOF_MIME_TYPES = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

export const CAMPAIGN_MESSAGES = {
  // Success messages
  INITIALIZE_SUCCESS: 'Draf kampanye berhasil dibuat.',
  UPDATE_SUCCESS: 'Perubahan kampanye berhasil disimpan.',
  RETRIEVED_SUCCESS: 'Daftar kampanye berhasil dimuat.',
  DETAIL_RETRIEVED_SUCCESS: 'Detail kampanye berhasil dimuat.',
  FEATURED_RETRIEVED_SUCCESS: 'Kampanye unggulan berhasil dimuat.',
  STATUS_COUNTS_RETRIEVED_SUCCESS: 'Jumlah status kampanye berhasil dimuat.',
  SUBMIT_SUCCESS: 'Kampanye berhasil diajukan untuk peninjauan admin.',
  THUMBNAIL_UPLOAD_SUCCESS: 'Gambar thumbnail berhasil diunggah.',
  DELETE_SUCCESS: 'Kampanye berhasil dihapus.',

  // Guard & error messages
  AUTH_REQUIRED: 'Autentikasi diperlukan.',
  UNAUTHORIZED_ROLE: 'Anda tidak memiliki akses untuk tindakan ini.',
  ONLY_BRANDS_CAN_CREATE: 'Hanya akun brand yang dapat membuat kampanye.',
  ONLY_BRANDS_CAN_EDIT: 'Hanya akun brand yang dapat mengubah kampanye.',
  ONLY_BRANDS_CAN_SUBMIT: 'Hanya akun brand yang dapat mengajukan kampanye.',
  ONLY_BRANDS_CAN_UPLOAD_THUMBNAIL: 'Hanya akun brand yang dapat mengunggah thumbnail kampanye.',
  CAMPAIGN_NOT_FOUND: 'Kampanye tidak ditemukan.',
  CANNOT_EDIT_CURRENT_STATUS: 'Kampanye tidak dapat diubah pada status saat ini.',
  CANNOT_UPLOAD_IN_CURRENT_STATUS: 'Berkas tidak dapat diunggah pada status kampanye saat ini.',
  CANNOT_SUBMIT_CURRENT_STATUS: 'Kampanye tidak dapat diajukan pada status saat ini.',
  EDIT_NO_FIELDS_PROVIDED: 'Minimal satu data perubahan harus dikirimkan.',
  CONFLICT_STALE_CAMPAIGN: 'Data kampanye telah diperbarui dari halaman atau tab lain. Memuat data terbaru...',
  PAYMENT_AMOUNT_STALE: 'Nominal anggaran kampanye telah berubah. Harap muat ulang rincian pembayaran.',
  PAYMENT_RACE_CONFLICT: 'Status kampanye atau pembayaran telah berubah secara bersamaan. Harap muat ulang halaman.',
  RATE_LIMIT_EXCEEDED: 'Terlalu banyak permintaan. Silakan tunggu beberapa saat lalu coba lagi.',
  INVALID_REQUEST_BODY: 'Data permintaan tidak valid.',
  INVALID_QUERY_PARAMS: 'Parameter pencarian tidak valid.',

  // Wizard completeness validations
  STEP_1_INCOMPLETE: 'Langkah 1 belum lengkap: Judul, deskripsi, kategori, platform, tautan media utama, dan thumbnail wajib diisi.',
  STEP_2_NO_MATERIALS: 'Langkah 2 belum lengkap: Minimal satu materi kampanye aktif wajib ditambahkan.',
  STEP_2_INVALID_MATERIALS: 'Langkah 2 belum lengkap: Seluruh materi kampanye harus memiliki nama, tipe, dan tautan yang valid.',
  STEP_3_NO_BRIEF: 'Langkah 3 belum lengkap: Brief dan panduan kampanye wajib diisi.',
  STEP_3_INCOMPLETE_BRIEF: 'Langkah 3 belum lengkap: Tujuan, pesan utama, dan call-to-action wajib diisi.',
  STEP_4_INVALID_CPM: 'Langkah 4 belum lengkap: Tarif CPM minimal Rp 1.000.',
  STEP_4_INVALID_BUDGET: 'Langkah 4 belum lengkap: Total anggaran harus lebih besar atau sama dengan tarif CPM.',
  STEP_4_INVALID_VIEWS: 'Langkah 4 belum lengkap: Batas tayangan minimum dan maksimum tidak valid.',
  STEP_4_NO_DATES: 'Langkah 4 belum lengkap: Tanggal mulai dan tanggal selesai wajib diisi.',
  STEP_4_INVALID_DATES: 'Langkah 4 belum lengkap: Tanggal berakhir harus lebih lambat dari tanggal mulai.',

  // Reward & date logic
  REWARD_MAX_LESS_THAN_MIN: 'Batas tayangan maksimum tidak boleh lebih kecil dari tayangan minimum.',
  REWARD_BUDGET_LESS_THAN_CPM: 'Total anggaran tidak boleh lebih kecil dari tarif CPM.',
  REWARD_BUDGET_BELOW_MIN_PAYOUT: 'Total anggaran harus mencukupi minimal imbalan untuk satu video mencapai tayangan minimum.',
  DATE_START_PAST: 'Tanggal mulai tidak boleh lebih awal dari hari ini.',
  DATE_END_BEFORE_START: 'Tanggal berakhir harus lebih lambat dari tanggal mulai.',
  DATE_END_PAST: 'Tanggal berakhir kampanye harus di masa mendatang.',

  // Thumbnail upload & storage
  CONTENT_LENGTH_REQUIRED: 'Header Content-Length wajib disertakan.',
  FILE_SIZE_EXCEEDED: 'Ukuran berkas maksimal 5MB.',
  UNSUPPORTED_FILE_TYPE: 'Format berkas tidak didukung. Harap unggah gambar JPG, PNG, atau WEBP.',
  INVALID_IMAGE_SIGNATURE: 'Isi berkas bukan gambar JPG, PNG, atau WEBP yang valid.',
  STORAGE_CONFIG_MISSING: 'Layanan penyimpanan cloud belum dikonfigurasi pada server.',
  STORAGE_UPLOAD_FAILED: 'Gagal mengunggah berkas ke penyimpanan cloud.',

  // Zod schema field validation messages
  TITLE_REQUIRED: 'Judul kampanye wajib diisi.',
  TITLE_MAX_EXCEEDED: 'Judul kampanye maksimal 100 karakter.',
  DESCRIPTION_REQUIRED: 'Deskripsi kampanye wajib diisi.',
  DESCRIPTION_MAX_EXCEEDED: 'Deskripsi kampanye maksimal 2000 karakter.',
  THUMBNAIL_URL_INVALID: 'URL thumbnail harus berupa tautan HTTP/HTTPS yang valid.',
  MAIN_MEDIA_URL_INVALID: 'URL media utama harus berupa tautan HTTP/HTTPS yang valid.',
  CPM_NUMBER_REQUIRED: 'Tarif CPM harus berupa angka.',
  CPM_MIN_VALUE: 'Tarif CPM minimal Rp 1.000.',
  CPM_MAX_EXCEEDED: 'Tarif CPM melebihi batas maksimum yang diizinkan.',
  PLATFORMS_REQUIRED: 'Minimal satu platform promosi wajib dipilih.',
  MAX_SUBMISSIONS_PER_PLATFORM_INVALID: 'Batas maksimal video per platform harus berupa bilangan bulat antara 1 hingga 50.',
  MIN_VIEWS_NUMBER_REQUIRED: 'Tayangan minimum harus berupa angka.',
  MIN_VIEWS_INTEGER: 'Tayangan minimum harus berupa bilangan bulat.',
  MIN_VIEWS_POSITIVE: 'Tayangan minimum harus lebih besar dari 0.',
  MIN_VIEWS_MAX_EXCEEDED: 'Tayangan minimum melebihi batas maksimum yang diizinkan.',
  MAX_VIEWS_NUMBER_REQUIRED: 'Batas tayangan maksimum harus berupa angka.',
  MAX_VIEWS_INTEGER: 'Batas tayangan maksimum harus berupa bilangan bulat.',
  MAX_VIEWS_POSITIVE: 'Batas tayangan maksimum harus lebih besar dari 0.',
  MAX_VIEWS_MAX_EXCEEDED: 'Batas tayangan maksimum melebihi batas maksimum yang diizinkan.',
  BUDGET_NUMBER_REQUIRED: 'Total anggaran harus berupa angka.',
  BUDGET_POSITIVE: 'Total anggaran harus lebih besar dari Rp 0.',
  BUDGET_MAX_EXCEEDED: 'Total anggaran melebihi batas maksimum yang diizinkan.',
  START_DATE_REQUIRED: 'Tanggal mulai tidak valid.',
  START_DATE_EMPTY: 'Tanggal mulai tidak boleh kosong.',
  END_DATE_REQUIRED: 'Tanggal berakhir tidak valid.',
  END_DATE_EMPTY: 'Tanggal berakhir tidak boleh kosong.',
  EXPECTED_UPDATED_AT_INVALID: 'Penanda waktu pembaruan kampanye tidak valid.',
  MATERIAL_TYPE_INVALID: 'Tipe materi tidak valid.',
  MATERIAL_NAME_REQUIRED: 'Nama materi wajib diisi.',
  MATERIAL_NAME_MAX_EXCEEDED: 'Nama materi maksimal 100 karakter.',
  MATERIAL_URL_INVALID: 'Tautan materi harus berupa URL HTTP/HTTPS yang valid.',
  MATERIALS_REQUIRED: 'Minimal 1 materi kampanye wajib ditambahkan.',
  MATERIALS_MAX_EXCEEDED: 'Jumlah materi maksimal adalah 25 item.',
  BRIEF_PURPOSE_EMPTY: 'Tujuan kampanye tidak boleh kosong.',
  BRIEF_PURPOSE_MAX_EXCEEDED: 'Tujuan kampanye maksimal 1000 karakter.',
  BRIEF_KEY_MESSAGE_EMPTY: 'Pesan utama tidak boleh kosong.',
  BRIEF_KEY_MESSAGE_MAX_EXCEEDED: 'Pesan utama maksimal 1000 karakter.',
  BRIEF_NARRATION_MAX_EXCEEDED: 'Referensi narasi maksimal 2000 karakter.',
  BRIEF_IMPRESSION_MAX_EXCEEDED: 'Kesan konten maksimal 500 karakter.',
  BRIEF_CALL_TO_ACTION_EMPTY: 'Call to Action (CTA) tidak boleh kosong.',
  BRIEF_CALL_TO_ACTION_MAX_EXCEEDED: 'Call to Action maksimal 500 karakter.',
  BRIEF_REQUIRED_CAPTION_MAX_EXCEEDED: 'Caption wajib maksimal 2000 karakter.',
  BRIEF_HASHTAG_EMPTY: 'Tagar tidak boleh kosong.',
  BRIEF_MENTION_TAG_EMPTY: 'Mention tag tidak boleh kosong.',
  BRIEF_DO_GUIDELINE_EMPTY: 'Panduan Do tidak boleh kosong.',
  BRIEF_DONT_GUIDELINE_EMPTY: 'Panduan Don\'t tidak boleh kosong.',
  BRIEF_ARRAY_ITEM_MAX_EXCEEDED: 'Panjang setiap item panduan/tagar maksimal 200 karakter.',
  BRIEF_ARRAY_MAX_ITEMS: 'Maksimal 30 item untuk setiap daftar panduan atau tagar.',
  BRIEF_GUIDELINES_MAX_EXCEEDED: 'Panduan tambahan maksimal 3000 karakter.',
  CAMPAIGN_TYPE_INVALID: 'Jenis kampanye tidak valid.',
  CAMPAIGN_CATEGORY_INVALID: 'Kategori kampanye tidak valid.',
  PLATFORM_INVALID: 'Platform tidak valid.',
  PAGE_NUMBER_REQUIRED: 'Halaman harus berupa angka.',
  PAGE_INTEGER: 'Halaman harus berupa bilangan bulat.',
  PAGE_POSITIVE: 'Halaman harus lebih besar dari 0.',
  LIMIT_NUMBER_REQUIRED: 'Batas data harus berupa angka.',
  LIMIT_INTEGER: 'Batas data harus berupa bilangan bulat.',
  LIMIT_POSITIVE: 'Batas data harus lebih besar dari 0.',
  LIMIT_MAX_EXCEEDED: 'Batas data maksimal 100 item.',
  SEARCH_MAX_EXCEEDED: 'Kata kunci pencarian maksimal 100 karakter.',
  SORT_INVALID: 'Parameter urutkan tidak valid.',
  CATEGORY_FILTER_INVALID: 'Filter kategori tidak valid.',
  CAMPAIGN_TYPE_FILTER_INVALID: 'Filter jenis kampanye tidak valid.',
  PLATFORM_FILTER_INVALID: 'Filter platform tidak valid.',
  CAMPAIGN_STATUS_FILTER_INVALID: 'Filter status kampanye tidak valid.',

  // Payment workflow messages
  PAYMENT_INITIALIZED_SUCCESS: 'Tagihan pembayaran kampanye berhasil dibuat.',
  PAYMENT_RETRIEVED_SUCCESS: 'Rincian pembayaran kampanye berhasil dimuat.',
  WALLET_PAYMENT_SUCCESS: 'Pembayaran menggunakan saldo dompet berhasil.',
  TRANSFER_PAYMENT_SUBMITTED_SUCCESS: 'Bukti transfer bank berhasil dikirim.',
  PAYMENT_PROOF_UPLOAD_SUCCESS: 'Bukti pembayaran berhasil diunggah.',
  PAYMENT_VERIFIED_SUCCESS: 'Pembayaran kampanye berhasil diverifikasi.',
  ONLY_DRAFT_CAN_BE_DELETED: 'Hanya kampanye berstatus draf yang dapat dihapus.',
  CAMPAIGN_NOT_AWAITING_PAYMENT: 'Kampanye tidak sedang menunggu pembayaran.',
  INSUFFICIENT_WALLET_BALANCE: 'Saldo dompet tidak mencukupi untuk membayar anggaran kampanye ini.',
  WALLET_NOT_FOUND: 'Dompet akun tidak ditemukan.',
  PAYMENT_PROOF_REQUIRED: 'Tautan gambar bukti transfer wajib berupa URL HTTP/HTTPS yang valid.',
  SENDER_PROVIDER_REQUIRED: 'Bank atau e-wallet pengirim wajib diisi.',
  SENDER_PROVIDER_MAX_EXCEEDED: 'Nama bank atau e-wallet pengirim maksimal 100 karakter.',
  SENDER_ACCOUNT_NAME_REQUIRED: 'Nama pemilik rekening pengirim wajib diisi (minimal 2 karakter).',
  SENDER_ACCOUNT_NAME_MAX_EXCEEDED: 'Nama pemilik rekening pengirim maksimal 100 karakter.',
  PAYMENT_NOT_FOUND: 'Data pembayaran kampanye tidak ditemukan.',
  PAYMENT_NOT_SUBMITTED: 'Pembayaran kampanye tidak berstatus menunggu verifikasi.',
  REJECTION_REASON_REQUIRED: 'Alasan penolakan wajib diisi saat menolak pembayaran.',
  ADMIN_ACTION_INVALID: 'Tindakan verifikasi admin tidak valid. Pilihan: APPROVE, REJECT.',
  ADMIN_NOT_FOUND: 'Profil admin tidak ditemukan.',
  BUDGET_LOCKED_AFTER_PAYMENT: 'Tarif CPM dan total anggaran tidak dapat diubah karena pembayaran sudah dikirim atau diverifikasi.',
} as const;
