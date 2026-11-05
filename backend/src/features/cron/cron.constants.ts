import { Status, SubmissionStatus } from '../../generated/prisma/enums.js';
import { FIFO_SUBMISSION_ORDER_BY } from '../admin/admin.constants.js';

export const DEFAULT_METRICS_CRON_EXPRESSION = '0 6,18 * * *';
export const DEFAULT_CRON_TIMEZONE = 'Asia/Jakarta';
export const CRON_JOB_NAME = 'klipday-campaign-metrics-sync';

export const METRICS_SYNC_LOCK_KEY = 'campaign_metrics_sync';
export const LOCK_LEASE_DURATION_MS = 30 * 60 * 1000;

export const DEFAULT_SCRAPE_CONCURRENCY = 4;
export const SCRAPE_REQUEST_TIMEOUT_MS = 15_000;
export const MAX_SCRAPE_RETRIES = 2;
export const RETRY_BASE_DELAY_MS = 1_000;
export const INTER_REQUEST_PACING_MS = 150;

export const RECENT_CRON_RUNS_LIMIT = 10;
export const MAX_SAFE_PG_INT = 2_147_483_647;

export const CAMPAIGN_SYNC_DECISION = {
  ACTIVE_RUNNING: 'ACTIVE_RUNNING',
  POST_EXPIRY_FINAL_SNAPSHOT: 'POST_EXPIRY_FINAL_SNAPSHOT',
  MANUAL_FORCE_SYNC: 'MANUAL_FORCE_SYNC',
  SKIP_BUDGET_FULL: 'SKIP_BUDGET_FULL',
  SKIP_EXPIRED_ALREADY_SNAPSHOTTED: 'SKIP_EXPIRED_ALREADY_SNAPSHOTTED',
} as const;

export const SCRAPE_OUTCOME_KIND = {
  SUCCESS: 'SUCCESS',
  VIDEO_UNAVAILABLE: 'VIDEO_UNAVAILABLE',
  OWNERSHIP_MISMATCH: 'OWNERSHIP_MISMATCH',
  TRANSIENT_ERROR: 'TRANSIENT_ERROR',
} as const;

export const CRON_ELIGIBLE_CAMPAIGN_SELECT = {
  id: true,
  title: true,
  cpm: true,
  minViews: true,
  maxViews: true,
  budget: true,
  endDate: true,
  lastMetricsSyncedAt: true,
  finalSnapshotSyncedAt: true,
  submissions: {
    where: {
      status: Status.ACTIVE,
      submissionStatus: SubmissionStatus.APPROVED,
    },
    orderBy: FIFO_SUBMISSION_ORDER_BY,
    select: {
      id: true,
      liveVideoUrl: true,
      verifiedViews: true,
      earnings: true,
      syncFailureStreak: true,
      lastSyncError: true,
      socialAccount: {
        select: {
          id: true,
          username: true,
          platformUserId: true,
          status: true,
        },
      },
    },
  },
} as const;

export const CRON_SYNC_RUN_SELECT = {
  id: true,
  triggerSource: true,
  triggeredByAccountId: true,
  targetCampaignId: true,
  cronStatus: true,
  startedAt: true,
  finishedAt: true,
  durationMs: true,
  campaignsEvaluated: true,
  campaignsSynced: true,
  campaignsSkippedFrozen: true,
  submissionsScraped: true,
  submissionsUpdated: true,
  submissionsFailed: true,
  totalViewsDelta: true,
  totalAllocatedDelta: true,
  errorMessage: true,
  createdAt: true,
} as const;

export const CRON_MESSAGES = {
  AUTH_REQUIRED: 'Autentikasi diperlukan.',
  ADMIN_ONLY: 'Hanya administrator yang dapat mengakses fitur sinkronisasi ini.',
  INVALID_PAYLOAD: 'Data permintaan sinkronisasi tidak valid.',
  INVALID_CAMPAIGN_ID: 'Format ID kampanye tidak valid.',
  CAMPAIGN_NOT_FOUND: 'Kampanye tidak ditemukan.',
  CAMPAIGN_ALREADY_SETTLED:
    'Kampanye ini sudah diselesaikan sehingga tayangan video tidak dapat disinkronkan lagi.',
  CAMPAIGN_NOT_ACTIVE:
    'Hanya kampanye berstatus aktif yang dapat disinkronkan tayangannya.',
  SYNC_ALREADY_RUNNING:
    'Proses sinkronisasi tayangan sedang berjalan. Mohon tunggu hingga proses saat ini selesai.',
  GET_CRON_STATUS_SUCCESS: 'Status penjadwalan sinkronisasi berhasil dimuat.',
  MANUAL_SYNC_SUCCESS: 'Sinkronisasi tayangan dan perhitungan reward berhasil dijalankan.',

  // User-facing diagnostic messages persisted to Submission.lastSyncError for Admin Settlement Audit
  SYNC_ERR_MISSING_VIDEO_URL:
    'Tautan video TikTok belum tersedia. Tayangan terakhir dibekukan untuk ditinjau Admin.',
  SYNC_ERR_VIDEO_UNAVAILABLE:
    'Video TikTok tidak dapat diakses (dihapus atau diatur menjadi privat). Tayangan terakhir dibekukan untuk ditinjau Admin.',
  SYNC_ERR_OWNERSHIP_MISMATCH:
    'Akun pemilik video TikTok tidak sesuai dengan akun kreator yang terdaftar. Tayangan dibekukan untuk ditinjau Admin.',
  SYNC_ERR_TRANSIENT_UNAVAILABLE:
    'Gagal memuat data tayangan terbaru karena gangguan koneksi sementara. Tayangan terakhir tetap dipertahankan.',
  SYNC_ERR_SCRAPER_REJECTED:
    'Data tayangan video belum dapat diverifikasi saat ini. Tayangan terakhir tetap dipertahankan untuk ditinjau Admin.',

  // Internal invariant assertion messages
  INVARIANT_ALLOCATION_LENGTH_MISMATCH:
    'Jumlah hasil perhitungan reward tidak sesuai dengan jumlah pengajuan video aktif.',
  INVARIANT_NEGATIVE_OR_DECIMAL_EARNINGS:
    'Nilai alokasi reward harus berupa bilangan bulat Rupiah non-negatif.',
  INVARIANT_EXCEEDS_TARGET_REWARD:
    'Nilai alokasi reward melebihi batas hak maksimal tayangan video.',
  INVARIANT_BUDGET_CONSERVATION_VIOLATED:
    'Total alokasi reward dan sisa pengembalian dana tidak sama dengan total anggaran kampanye.',
} as const;
