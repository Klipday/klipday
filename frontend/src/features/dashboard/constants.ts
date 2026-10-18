export const DASHBOARD_MESSAGES = {
  TITLE: 'Monitoring Brand',
  SUBTITLE: 'Pantau performa kampanye aktif, validasi penayangan, dan review submisi klip TikTok secara real-time.',
  ALERT_PENDING_TITLE: 'Video Menunggu Review',
  ALERT_PENDING_DESC: 'kreator telah mengajukan klip baru. Tinjau dan setujui untuk mempercepat distribusi konten.',
  ALERT_ZERO_BALANCE_TITLE: 'Saldo Dompet Menipis',
  ALERT_ZERO_BALANCE_DESC: 'Saldo aktif Anda saat ini Rp 0. Lakukan top-up untuk memastikan kampanye baru dapat segera diluncurkan.',
  METRICS_TOTAL_VIEWS: 'Total Views Terverifikasi',
  METRICS_TOTAL_VIEWS_HINT: 'Views organik dari video terverifikasi',
  METRICS_ACTIVE_CAMPAIGNS: 'Kampanye Aktif',
  METRICS_TOTAL_SPENT: 'Total Saldo Terpakai',
  METRICS_TOTAL_SPENT_HINT: 'Reward penayangan kreator',
  METRICS_WALLET_BALANCE: 'Saldo Siap Pakai',
  METRICS_WALLET_BALANCE_HINT: 'Saldo aktif di dompet brand',
  METRICS_LOCKED_BALANCE_PREFIX: 'Saldo terkunci: ',
  ACTION_REVIEW_NOW: 'Tinjau Sekarang',
  ACTION_TOP_UP: 'Top-Up Saldo',
  ACTION_CREATE_CAMPAIGN: 'Buat Kampanye',
  ACTIVE_CAMPAIGNS_TITLE: 'Performa Kampanye Aktif',
  ACTIVE_CAMPAIGNS_EMPTY: 'Belum ada kampanye yang sedang aktif.',
  PENDING_REVIEWS_TITLE: 'Antrean Review Video',
  PENDING_REVIEWS_EMPTY: 'Semua submisi klip sudah ditinjau.',
  ACTION_REVIEW: 'Tinjau',
  ACTION_REVIEW_VIDEO: 'Tinjau Video',
  TOP_CLIPS_TITLE: 'Video Klip Teratas',
  TOP_CLIPS_SUBTITLE: 'Video dengan penayangan terverifikasi tertinggi dari kampanye aktif.',
  TOP_CLIPS_EMPTY: 'Belum ada data klip yang telah diverifikasi.',
  BUDGET_SPENT_LABEL: 'Anggaran Terpakai',
  BUDGET_REMAINING_LABEL: 'Budget Tersisa',
  BUDGET_SPENT_OF: 'terpakai dari',
  DEFAULT_CREATOR_NAME: 'Kreator Klip',
  DEFAULT_CAMPAIGN_TITLE: 'Kampanye Tanpa Judul',
  CAMPAIGN_LABEL_PREFIX: 'Kampanye: ',
  REWARD_PREFIX: 'Reward: ',
  VIEWS_LABEL: 'views',
  SUBMISSIONS_NEED_REVIEW: 'perlu ditinjau',
  SUBMISSIONS_CLIPS: 'submisi klip',
  DEFAULT_CATEGORY_LABEL: 'Lainnya',
  LAUNCHPAD_TITLE: 'Mulai Kampanye Pertama Anda di Klipday',
  LAUNCHPAD_SUBTITLE: 'Tiga langkah mudah untuk meluncurkan kampanye dan mendapatkan ribuan klip berkualitas dari kreator TikTok.',
  LAUNCHPAD_STEP_1_TITLE: 'Isi Saldo Dompet',
  LAUNCHPAD_STEP_1_DESC: 'Top-up saldo untuk alokasi saldo kampanye yang aman dan transparan.',
  LAUNCHPAD_STEP_2_TITLE: 'Buat Brief Kampanye',
  LAUNCHPAD_STEP_2_DESC: 'Tentukan panduan konten, hashtag wajib, dan tarif CPM untuk kreator klip.',
  LAUNCHPAD_STEP_3_TITLE: 'Review & Pantau Penayangan',
  LAUNCHPAD_STEP_3_DESC: 'Setujui klip terbaik dan pantau pertumbuhan penayangan secara otomatis.',
  FETCH_ERROR: 'Gagal memuat ringkasan dashboard brand. Silakan coba beberapa saat lagi.',
} as const;

/**
 * Localized Indonesian labels for campaign categories and brand industries.
 * Prevents raw enum strings (e.g. FOOD_BEVERAGE, BEAUTY_SKINCARE) from displaying in the UI.
 */
export const DASHBOARD_CATEGORY_MAP: Record<string, string> = {
  // Category enum
  BEAUTY_SKINCARE: 'Kecantikan & Skincare',
  FASHION_STYLE: 'Fashion & Gaya',
  FOOD_BEVERAGE: 'Makanan & Minuman',
  HEALTH_FITNESS: 'Kesehatan & Kebugaran',
  TECHNOLOGY_GADGETS: 'Teknologi & Gadget',
  LIFESTYLE: 'Gaya Hidup',
  GAMING: 'Gaming',
  TRAVEL: 'Travel & Wisata',
  ENTERTAINMENT: 'Hiburan',
  EDUCATION: 'Edukasi',
  OTHER: 'Lainnya',

  // Industry enum
  E_COMMERCE: 'E-Commerce',
  FOOD_AND_BEVERAGE: 'Makanan & Minuman',
  FASHION_AND_BEAUTY: 'Fashion & Kecantikan',
  TECHNOLOGY: 'Teknologi',
  FINANCE: 'Keuangan',
  HEALTH_AND_WELLNESS: 'Kesehatan & Kebugaran',
  TRAVEL_AND_HOSPITALITY: 'Travel & Perhotelan',
};

export const CREATOR_DASHBOARD_MESSAGES = {
  TITLE: 'Monitoring Kreator',
  SUBTITLE:
    'Pantau penayangan terverifikasi, estimasi pendapatan klip, saldo siap ditarik, dan progres kampanye yang Anda ikuti.',
  TIKTOK_VERIFIED_SUFFIX: 'TikTok Terverifikasi',
  CONNECT_TIKTOK_ACTION: 'Hubungkan TikTok',
  METRICS_TOTAL_VIEWS: 'Total Views Terverifikasi',
  METRICS_VALID_VIEWS_SUFFIX: 'views valid',
  METRICS_TOTAL_EARNINGS: 'Total Pendapatan Video',
  METRICS_TOTAL_EARNINGS_HINT: 'Akumulasi reward klip terverifikasi',
  METRICS_WALLET_BALANCE: 'Saldo Siap Ditarik',
  METRICS_TOTAL_WITHDRAWN_PREFIX: 'Total dicairkan: ',
  METRICS_SUBMISSION_STATUS: 'Status Submisi Klip',
  METRICS_APPROVED_CLIPS_SUFFIX: 'Video Disetujui',
  RECENT_SUBMISSIONS_TITLE: 'Submisi Kampanye Saya',
  RECENT_SUBMISSIONS_SUBTITLE: 'Status review dan estimasi pendapatan dari klip yang telah diajukan',
  RECENT_SUBMISSIONS_EMPTY_TITLE: 'Belum ada video yang diajukan.',
  RECENT_SUBMISSIONS_EMPTY_DESC:
    'Pilih kampanye aktif yang telah Anda ikuti di samping atau jelajahi kampanye baru untuk mulai mengirim klip.',
  JOINED_CAMPAIGNS_TITLE: 'Kampanye Aktif Diikuti',
  JOINED_CAMPAIGNS_SUBTITLE: 'Kampanye yang sudah diikuti dan menunggu pengajuan video Anda',
  JOINED_CAMPAIGNS_EMPTY_TITLE: 'Belum ada kampanye aktif yang menunggu video.',
  JOINED_CAMPAIGNS_EMPTY_DESC:
    'Ikuti kampanye aktif di katalog untuk mulai membuat klip dan mengumpulkan penayangan.',
  ACTION_EXPLORE_CAMPAIGNS: 'Jelajahi Kampanye',
  ACTION_FIND_CAMPAIGNS: 'Cari Kampanye',
  TOP_CLIPS_TITLE: 'Video Klip Terbaik Kamu',
  TOP_CLIPS_SUBTITLE: 'Klip TikTok Anda dengan penayangan terverifikasi tertinggi.',
  TOP_CLIPS_EMPTY_TITLE: 'Belum ada klip terverifikasi.',
  TOP_CLIPS_EMPTY_DESC:
    'Klip yang telah disetujui brand dan diverifikasi penayangannya akan otomatis tampil di sini.',
  ESTIMATED_EARNING_PREFIX: 'Estimasi: ',
  REWARD_PREFIX: 'Reward: ',
  VIEWS_LABEL: 'views',
  BUDGET_REMAINING_LABEL: 'Budget Tersisa',
  DEFAULT_CAMPAIGN_TITLE: 'Kampanye Tanpa Judul',
  LAUNCHPAD_BADGE: 'Panduan Kreator',
  LAUNCHPAD_TITLE: 'Mulai Hasilkan Pendapatan dari Klip TikTok Anda',
  LAUNCHPAD_SUBTITLE:
    'Tiga langkah sederhana untuk mulai mengikuti kampanye brand, mengirim klip, dan mencairkan komisi penayangan.',
  LAUNCHPAD_STEP_1_TITLE: 'Hubungkan Akun TikTok',
  LAUNCHPAD_STEP_1_DESC:
    'Verifikasi kepemilikan akun TikTok Anda satu kali agar sistem dapat memantau penayangan klip secara otomatis.',
  LAUNCHPAD_STEP_1_CONNECTED: 'Akun TikTok Terhubung',
  LAUNCHPAD_STEP_1_CTA: 'Hubungkan TikTok',
  LAUNCHPAD_STEP_2_TITLE: 'Pilih Kampanye & Kirim Klip',
  LAUNCHPAD_STEP_2_DESC:
    'Pelajari brief singkat dari brand, unggah video klip di TikTok, lalu tautkan link video Anda ke kampanye.',
  LAUNCHPAD_STEP_2_CTA: 'Jelajahi Kampanye',
  LAUNCHPAD_STEP_3_TITLE: 'Pantau Views & Tarik Saldo',
  LAUNCHPAD_STEP_3_DESC:
    'Komisi dihitung dari penayangan terverifikasi berdasarkan tarif CPM dan siap ditarik ke rekening atau e-wallet Anda.',
  LAUNCHPAD_STEP_3_BADGE: 'Pencairan Transparan',
  ERROR_TITLE: 'Gagal Memuat Dashboard',
  ACTION_RETRY: 'Coba Lagi',
  FETCH_ERROR: 'Gagal memuat ringkasan dashboard kreator. Silakan coba beberapa saat lagi.',
} as const;

export const CREATOR_SUBMISSION_STATUS_CONFIG: Record<
  string,
  { label: string; badgeClassName: string }
> = {
  JOINED: {
    label: 'Bergabung',
    badgeClassName:
      'border-border/60 bg-muted/40 text-muted-foreground',
  },
  PENDING_REVIEW: {
    label: 'Menunggu Review',
    badgeClassName:
      'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  REVISION_REQUESTED: {
    label: 'Perlu Revisi',
    badgeClassName:
      'border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400',
  },
  APPROVED: {
    label: 'Disetujui',
    badgeClassName:
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  POSTED: {
    label: 'Tayang',
    badgeClassName:
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  VERIFIED: {
    label: 'Terverifikasi',
    badgeClassName:
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  REJECTED: {
    label: 'Ditolak',
    badgeClassName:
      'border-destructive/30 bg-destructive/10 text-destructive',
  },
};

