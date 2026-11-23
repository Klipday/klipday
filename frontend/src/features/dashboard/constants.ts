export const DASHBOARD_MESSAGES = {
  TITLE: 'Monitoring Brand',
  SUBTITLE: 'Ringkasan performa kampanye dan submisi klip TikTok.',
  ALERT_PENDING_TITLE: 'Video Menunggu Review',
  ALERT_PENDING_DESC: 'kreator telah mengajukan klip baru. Tinjau dan setujui untuk mempercepat distribusi konten.',
  ALERT_ZERO_BALANCE_TITLE: 'Saldo Dompet Menipis',
  ALERT_ZERO_BALANCE_DESC: 'Saldo aktif Anda saat ini Rp 0. Lakukan top-up untuk memastikan kampanye baru dapat segera diluncurkan.',
  METRICS_TOTAL_VIEWS: 'Total Views',
  METRICS_TOTAL_VIEWS_HINT: 'Views organik dari video terverifikasi',
  METRICS_ACTIVE_CAMPAIGNS: 'Kampanye Aktif',
  METRICS_SUBMITTED_CAMPAIGNS: 'Kampanye Tersubmit',
  METRICS_TOTAL_SPENT: 'Total Saldo Terpakai',
  METRICS_TOTAL_SPENT_HINT: 'Reward penayangan kreator',
  METRICS_SUBMITTED_VIDEOS: 'Total Video Tersubmit',
  METRICS_WALLET_BALANCE: 'Saldo Siap Pakai',
  METRICS_WALLET_BALANCE_HINT: 'Saldo aktif di dompet brand',
  METRICS_LOCKED_BALANCE_PREFIX: 'Saldo terkunci: ',
  ACTION_REVIEW_NOW: 'Tinjau Sekarang',
  ACTION_TOP_UP: 'Top-Up Saldo',
  ACTION_CREATE_CAMPAIGN: 'Buat Kampanye',
  ACTIVE_CAMPAIGNS_TITLE: 'Performa Kampanye Aktif',
  ACTIVE_CAMPAIGNS_EMPTY: 'Belum ada kampanye aktif',
  PENDING_REVIEWS_TITLE: 'Antrean Review Video',
  PENDING_REVIEWS_EMPTY: 'Semua submisi sudah ditinjau',
  ACTION_REVIEW: 'Tinjau',
  ACTION_REVIEW_VIDEO: 'Tinjau Video',
  TOP_CLIPS_TITLE: 'Video Klip Teratas',
  TOP_CLIPS_SUBTITLE: 'Penayangan tertinggi dari klip terverifikasi.',
  TOP_CLIPS_EMPTY: 'Belum ada klip terverifikasi',
  BUDGET_SPENT_LABEL: 'Anggaran Terpakai',
  BUDGET_REMAINING_LABEL: 'Budget Tersisa',
  BUDGET_SPENT_OF: 'terpakai dari',
  BUDGET_OF_PREFIX: 'dari',
  DEFAULT_CREATOR_NAME: 'Kreator Klip',
  DEFAULT_CAMPAIGN_TITLE: 'Kampanye Tanpa Judul',
  CAMPAIGN_LABEL_PREFIX: 'Kampanye: ',
  REWARD_PREFIX: 'Reward: ',
  VIEWS_LABEL: 'views',
  SUBMISSIONS_NEED_REVIEW: 'perlu ditinjau',
  SUBMISSIONS_CLIPS: 'submisi klip',
  SUBMISSIONS_CLIPS_SHORT: 'klip',
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
    'Ringkasan penayangan, pendapatan klip, dan progres kampanye TikTok Anda.',
  TIKTOK_VERIFIED_SUFFIX: 'TikTok Terverifikasi',
  CONNECT_TIKTOK_ACTION: 'Hubungkan TikTok',
  METRICS_TOTAL_VIEWS: 'Total Views',
  METRICS_TOTAL_VIDEOS: 'Total Video',
  METRICS_TOTAL_EARNINGS: 'Total Pendapatan',
  METRICS_TOTAL_BALANCE: 'Total Saldo',
  RECENT_SUBMISSIONS_TITLE: 'Submisi Kampanye Saya',
  RECENT_SUBMISSIONS_SUBTITLE: 'Status review dan estimasi pendapatan klip Anda',
  RECENT_SUBMISSIONS_EMPTY_TITLE: 'Belum ada video yang diajukan',
  RECENT_SUBMISSIONS_EMPTY_DESC:
    'Pilih kampanye aktif yang telah Anda ikuti atau jelajahi kampanye baru untuk mulai mengirim klip.',
  JOINED_CAMPAIGNS_TITLE: 'Menunggu Pengajuan Video',
  JOINED_CAMPAIGNS_SUBTITLE: 'Belum ada klip tertunda',
  JOINED_CAMPAIGNS_EMPTY_TITLE: 'Tidak ada kampanye menunggu video',
  JOINED_CAMPAIGNS_EMPTY_DESC:
    'Semua kampanye aktif sudah diajukan klip. Jelajahi katalog untuk ikut kampanye baru.',
  ACTION_VIEW_ALL: 'Lihat semua',
  ACTION_EXPLORE_CAMPAIGNS: 'Jelajahi Kampanye',
  ACTION_FIND_CAMPAIGNS: 'Cari kampanye',
  TOP_CLIPS_TITLE: 'Video Klip Terbaik Kamu',
  TOP_CLIPS_SUBTITLE: 'Penayangan tertinggi dari klip TikTok terverifikasi Anda.',
  TOP_CLIPS_EMPTY_TITLE: 'Belum ada klip terverifikasi',
  TOP_CLIPS_EMPTY_DESC:
    'Klip yang disetujui dan diverifikasi penayangannya akan muncul di sini.',
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
  LAUNCHPAD_STEP_3_BADGE: 'Pencairan transparan',
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
    badgeClassName: 'text-muted-foreground',
  },
  PENDING_REVIEW: {
    label: 'Menunggu Review',
    badgeClassName: 'text-amber-500',
  },
  REVISION_REQUESTED: {
    label: 'Perlu Revisi',
    badgeClassName: 'text-amber-500',
  },
  APPROVED: {
    label: 'Disetujui',
    badgeClassName: 'text-foreground',
  },
  POSTED: {
    label: 'Tayang',
    badgeClassName: 'text-foreground',
  },
  VERIFIED: {
    label: 'Terverifikasi',
    badgeClassName: 'text-foreground',
  },
  REJECTED: {
    label: 'Ditolak',
    badgeClassName: 'text-destructive',
  },
};

export const DEFAULT_DISCORD_COMMUNITY_URL = 'https://discord.gg/S2wYRNt7Q';

export const ADMIN_DASHBOARD_MESSAGES = {
  TITLE_PREFIX: 'Halo, ',
  DEFAULT_ADMIN_NAME: 'Admin Klipday',
  SUBTITLE:
    'Pantau antrean verifikasi, likuiditas kampanye, dan aktivitas operasional platform.',
  ALL_CLEAN: 'Semua antrean bersih',
  TASKS_WAITING_SUFFIX: 'tugas tertunda',

  // 4 Metrics
  METRICS_LOCKED_BUDGET: 'Dana Kampanye Aktif',
  METRICS_TOTAL_USER_BALANCE: 'Saldo Dompet Pengguna',
  METRICS_REWARDS_PAID: 'Reward Kreator Cair',
  METRICS_TOTAL_USERS: 'Total Pengguna',

  // Bento Left: Unified Action Queue
  ACTION_QUEUE_TITLE: 'Antrean Perlu Tindakan',
  ACTION_QUEUE_SUBTITLE_SUFFIX: 'menunggu keputusan',
  ACTION_QUEUE_EMPTY_SUBTITLE: 'Tidak ada antrean tertunda',
  ACTION_QUEUE_TAB_CAMPAIGNS: 'Kampanye',
  ACTION_QUEUE_TAB_FINANCE: 'Keuangan',
  ACTION_QUEUE_TAB_KYC: 'KYC',

  // Bento Right: Queue Summary Links
  QUEUE_SUMMARY_TITLE: 'Status Antrean',
  QUEUE_SUMMARY_SUBTITLE: 'Akses cepat ke halaman antrean',
  QUEUE_CAMPAIGN_MODERATION: 'Moderasi Kampanye',
  QUEUE_CAMPAIGN_SETTLEMENT: 'Settlement Kampanye',
  QUEUE_TOP_UP: 'Verifikasi Top Up',
  QUEUE_WITHDRAWAL: 'Pencairan Withdraw',
  QUEUE_KYC: 'Verifikasi KYC',
  WITHDRAWAL_CANCEL_ALERT_SUFFIX: 'minta batal',

  // Bento Bottom: Ledger
  LEDGER_WIDGET_TITLE: 'Mutasi Kas Terkini',
  LEDGER_WIDGET_SUBTITLE: '5 transaksi dompet terbaru di seluruh platform',

  // Action CTAs & Tags
  ACTION_PROCESS: 'Proses',
  ACTION_VERIFY: 'Verifikasi',
  ACTION_REVIEW: 'Tinjau',
  ACTION_SETTLE: 'Proses Settlement',
  ACTION_MODERATE: 'Moderasi',
  TAG_WITHDRAW: 'Withdraw',
  TAG_TOPUP: 'Top Up',
  TAG_CANCEL_REQUEST: 'Minta Batal',

  // Empty States
  CAMPAIGNS_EMPTY_TITLE: 'Tidak ada kampanye menunggu tindakan',
  CAMPAIGNS_EMPTY_DESC: 'Semua pengajuan kampanye baru dan settlement anggaran telah diproses.',
  FINANCE_EMPTY_TITLE: 'Tidak ada transaksi tertunda',
  FINANCE_EMPTY_DESC: 'Semua permintaan withdraw dan top up saldo telah selesai diproses.',
  KYC_EMPTY_TITLE: 'Antrean KYC bersih',
  KYC_EMPTY_DESC: 'Belum ada pengajuan rekening bank atau e-wallet baru yang menunggu verifikasi.',
  LEDGER_EMPTY_TITLE: 'Belum ada mutasi dompet',
  LEDGER_EMPTY_DESC: 'Transaksi dompet terbaru akan otomatis dicatat di sini.',

  // Errors
  FETCH_ERROR: 'Gagal memuat ringkasan dashboard admin. Silakan coba beberapa saat lagi.',
} as const;


