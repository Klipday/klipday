export const BRAND_LIMITS = {
  MAX_PAYOUT_ACCOUNTS: 3,
  MAX_LOGO_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
  MAX_PROOF_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
  MIN_COMPANY_NAME_LENGTH: 2,
  MAX_COMPANY_NAME_LENGTH: 100,
  MAX_LOCATION_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_SOCIAL_HANDLE_LENGTH: 50,
  MAX_YOUTUBE_LENGTH: 100,
  MIN_PROVIDER_LENGTH: 2,
  MIN_ACCOUNT_NUMBER_LENGTH: 4,
  MAX_ACCOUNT_NUMBER_LENGTH: 30,
  MIN_ACCOUNT_HOLDER_LENGTH: 2,
  MAX_ACCOUNT_HOLDER_LENGTH: 100,
} as const;

export const ALLOWED_IMAGE_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const SUPPORTED_PAYOUT_PROVIDERS = [
  'BCA',
  'MANDIRI',
  'BNI',
  'BRI',
  'BSI',
  'CIMB',
  'PERMATA',
  'DANAMON',
  'BTN',
  'PANIN',
  'OCBC',
  'JAGO',
  'SEABANK',
  'BLU',
  'JENIUS',
  'ALLOBANK',
  'SUPERBANK',
  'BNC',
  'RAYA',
  'GOPAY',
  'OVO',
  'DANA',
  'SHOPEEPAY',
  'LINKAJA',
] as const;

export const PROVIDER_ACCOUNT_RULES: Record<
  string,
  { regex: RegExp; description: string; example: string }
> = {
  BCA: {
    regex: /^[0-9]{10}$/,
    description: 'Nomor rekening BCA harus terdiri dari 10 digit angka.',
    example: '1234567890',
  },
  MANDIRI: {
    regex: /^[0-9]{13}$/,
    description: 'Nomor rekening Mandiri harus terdiri dari 13 digit angka.',
    example: '1234567890123',
  },
  BNI: {
    regex: /^[0-9]{10}$/,
    description: 'Nomor rekening BNI harus terdiri dari 10 digit angka.',
    example: '1234567890',
  },
  BRI: {
    regex: /^[0-9]{15}$/,
    description: 'Nomor rekening BRI harus terdiri dari 15 digit angka.',
    example: '123456789012345',
  },
  BSI: {
    regex: /^[0-9]{10}$/,
    description: 'Nomor rekening BSI harus terdiri dari 10 digit angka.',
    example: '1234567890',
  },
  CIMB: {
    regex: /^[0-9]{10,14}$/,
    description: 'Nomor rekening CIMB Niaga harus terdiri dari 10-14 digit angka.',
    example: '123456789012',
  },
  PERMATA: {
    regex: /^[0-9]{10,16}$/,
    description: 'Nomor rekening Permata harus terdiri dari 10-16 digit angka.',
    example: '1234567890',
  },
  DANAMON: {
    regex: /^[0-9]{10,12}$/,
    description: 'Nomor rekening Danamon harus terdiri dari 10-12 digit angka.',
    example: '1234567890',
  },
  BTN: {
    regex: /^[0-9]{10,16}$/,
    description: 'Nomor rekening BTN harus terdiri dari 10-16 digit angka.',
    example: '123456789012',
  },
  JAGO: {
    regex: /^[0-9]{10,12}$/,
    description: 'Nomor rekening Bank Jago harus terdiri dari 10-12 digit angka.',
    example: '101234567890',
  },
  SEABANK: {
    regex: /^[0-9]{11,12}$/,
    description: 'Nomor rekening SeaBank harus terdiri dari 11-12 digit angka.',
    example: '90123456789',
  },
  BLU: {
    regex: /^[0-9]{10,12}$/,
    description: 'Nomor rekening blu by BCA Digital harus terdiri dari 10-12 digit angka.',
    example: '001234567890',
  },
  JENIUS: {
    regex: /^[0-9]{10,12}$/,
    description: 'Nomor rekening Jenius (BTPN) harus terdiri dari 10-12 digit angka.',
    example: '90012345678',
  },
  GOPAY: {
    regex: /^(08|628)[0-9]{8,12}$/,
    description: 'Nomor HP GoPay harus berawalan 08 atau 628 (10-14 digit).',
    example: '081234567890',
  },
  OVO: {
    regex: /^(08|628)[0-9]{8,12}$/,
    description: 'Nomor HP OVO harus berawalan 08 atau 628 (10-14 digit).',
    example: '081234567890',
  },
  DANA: {
    regex: /^(08|628)[0-9]{8,12}$/,
    description: 'Nomor HP DANA harus berawalan 08 atau 628 (10-14 digit).',
    example: '081234567890',
  },
  SHOPEEPAY: {
    regex: /^(08|628)[0-9]{8,12}$/,
    description: 'Nomor HP ShopeePay harus berawalan 08 atau 628 (10-14 digit).',
    example: '081234567890',
  },
  LINKAJA: {
    regex: /^(08|628)[0-9]{8,12}$/,
    description: 'Nomor HP LinkAja harus berawalan 08 atau 628 (10-14 digit).',
    example: '081234567890',
  },
};

export const BRAND_MESSAGES = {
  AUTH_REQUIRED: 'Autentikasi diperlukan. Harap masuk terlebih dahulu.',
  UNAUTHORIZED_ROLE: 'Hanya akun brand yang memiliki akses ke layanan ini.',
  BRAND_NOT_FOUND: 'Data profil brand tidak ditemukan.',
  WALLET_NOT_FOUND: 'Dompet brand tidak ditemukan.',
  PROFILE_FETCH_SUCCESS: 'Informasi profil brand berhasil diambil.',
  PROFILE_UPDATE_SUCCESS: 'Profil brand berhasil diperbarui.',
  LOGO_UPLOAD_SUCCESS: 'Logo brand berhasil diunggah.',
  PAYOUT_PROOF_UPLOAD_SUCCESS: 'Bukti rekening penarikan berhasil diunggah.',
  PAYOUT_ACCOUNTS_FETCH_SUCCESS: 'Daftar akun penarikan berhasil diambil.',
  PAYOUT_ACCOUNT_CREATED_SUCCESS: 'Akun penarikan berhasil didaftarkan dan menunggu verifikasi.',
  PAYOUT_ACCOUNT_PRIMARY_SUCCESS: 'Akun penarikan utama berhasil diubah.',
  PAYOUT_ACCOUNT_DELETED_SUCCESS: 'Akun penarikan berhasil dihapus.',
  PAYOUT_ACCOUNT_CANCEL_SUCCESS: 'Pengajuan verifikasi rekening berhasil dibatalkan.',
  PAYOUT_ACCOUNT_NOT_FOUND: 'Akun penarikan tidak ditemukan.',
  PAYOUT_ACCOUNT_LIMIT_EXCEEDED: 'Batas maksimal 3 akun penarikan telah tercapai.',
  PAYOUT_ACCOUNT_DUPLICATE: 'Nomor rekening atau e-wallet tersebut sudah terdaftar.',
  PAYOUT_ACCOUNT_HAS_PENDING_WITHDRAWAL: 'Rekening ini tidak dapat dihapus karena masih terikat pada permintaan penarikan saldo yang sedang diproses admin.',
  PAYOUT_ACCOUNT_ALREADY_VERIFIED: 'Pengajuan tidak dapat dibatalkan karena rekening sudah disetujui oleh admin.',
  FILE_SIZE_EXCEEDED: 'Ukuran file melebihi batas maksimal 5 MB.',
  UNSUPPORTED_FILE_TYPE: 'Format file tidak didukung. Harap unggah gambar JPG, PNG, atau WEBP.',
  CONTENT_LENGTH_REQUIRED: 'Header Content-Length diperlukan untuk unggahan berkas.',
  STORAGE_CONFIG_MISSING: 'Konfigurasi cloud storage Supabase belum diatur.',
  STORAGE_UPLOAD_FAILED: 'Gagal mengunggah berkas ke cloud storage.',
  INVALID_INPUT: 'Data input tidak valid.',
  COMPANY_NAME_MIN_LENGTH: 'Nama brand minimal 2 karakter.',
  COMPANY_NAME_MAX_LENGTH: 'Nama brand maksimal 100 karakter.',
  LOCATION_MAX_LENGTH: 'Lokasi maksimal 100 karakter.',
  INVALID_WEBSITE_URL: 'URL website tidak valid (contoh: https://brandanda.com).',
  DESCRIPTION_MAX_LENGTH: 'Deskripsi maksimal 500 karakter.',
  INSTAGRAM_HANDLE_MAX_LENGTH: 'Username Instagram maksimal 50 karakter.',
  TIKTOK_HANDLE_MAX_LENGTH: 'Username TikTok maksimal 50 karakter.',
  X_HANDLE_MAX_LENGTH: 'Username X maksimal 50 karakter.',
  THREADS_HANDLE_MAX_LENGTH: 'Username Threads maksimal 50 karakter.',
  YOUTUBE_CHANNEL_MAX_LENGTH: 'Kanal YouTube maksimal 100 karakter.',
  ACCOUNT_NUMBER_INVALID: 'Nomor rekening atau nomor e-wallet tidak valid.',
  ACCOUNT_HOLDER_REQUIRED: 'Nama pemilik rekening wajib diisi.',
  PROVIDER_REQUIRED: 'Penyedia bank atau e-wallet wajib dipilih.',
  PROOF_URL_REQUIRED: 'Bukti buku tabungan atau tangkapan layar akun wajib diunggah.',
  WITHDRAWAL_PAYOUT_ACCOUNT_NOT_VERIFIED: 'Akun penarikan belum diverifikasi oleh admin Klipday.',
  WITHDRAWAL_PAYOUT_ACCOUNT_NOT_FOUND: 'Akun penarikan tidak ditemukan atau tidak aktif.',
} as const;

export const BRAND_DASHBOARD_LIMITS = {
  PENDING_REVIEWS_LIMIT: 5,
  ACTIVE_CAMPAIGNS_LIMIT: 5,
  TOP_CLIPS_LIMIT: 4,
} as const;

export const BRAND_DASHBOARD_MESSAGES = {
  SUMMARY_FETCH_SUCCESS: 'Ringkasan dashboard brand berhasil dimuat.',
  UNAUTHORIZED: 'Anda tidak memiliki akses ke dashboard brand ini.',
} as const;

export const BRAND_DASHBOARD_BRAND_SELECT = {
  id: true,
  companyName: true,
  logoUrl: true,
} as const;

export const BRAND_DASHBOARD_PENDING_SUBMISSION_SELECT = {
  id: true,
  campaignId: true,
  creatorId: true,
  draftVideoUrl: true,
  liveVideoUrl: true,
  thumbnailUrl: true,
  videoCaption: true,
  submissionStatus: true,
  reviewNote: true,
  verifiedViews: true,
  earnings: true,
  submittedAt: true,
  createdAt: true,
  updatedAt: true,
  campaign: {
    select: {
      id: true,
      title: true,
    },
  },
  creator: {
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
    },
  },
  socialAccount: {
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      followersCount: true,
    },
  },
} as const;

export const BRAND_DASHBOARD_ACTIVE_CAMPAIGN_SELECT = {
  id: true,
  title: true,
  campaignCategory: true,
  cpm: true,
  budget: true,
  startDate: true,
  endDate: true,
  submissions: {
    where: {
      status: 'ACTIVE',
    },
    select: {
      submissionStatus: true,
      verifiedViews: true,
      earnings: true,
    },
  },
} as const;

export const BRAND_DASHBOARD_TOP_CLIP_SELECT = {
  id: true,
  campaignId: true,
  thumbnailUrl: true,
  liveVideoUrl: true,
  verifiedViews: true,
  earnings: true,
  campaign: {
    select: {
      title: true,
    },
  },
  creator: {
    select: {
      fullName: true,
      avatarUrl: true,
    },
  },
  socialAccount: {
    select: {
      username: true,
      avatarUrl: true,
    },
  },
} as const;
