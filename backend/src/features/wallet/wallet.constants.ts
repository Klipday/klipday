export const KLIPDAY_DESTINATION_BANK = {
  bankName: 'BCA',
  accountNumber: '1234567890',
  accountHolderName: 'PT Klipday Media Kreasi',
  branch: 'KCP Sudirman Jakarta',
} as const;

export const TOP_UP_LIMITS = {
  MIN_AMOUNT: 50_000,
  MAX_AMOUNT: 100_000_000,
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
  MAX_PROOF_SIZE_BYTES: 5 * 1024 * 1024,
  UNIQUE_CODE_MIN: 100,
  UNIQUE_CODE_MAX: 999,
  EXPIRATION_HOURS: 24,
} as const;

export const ALLOWED_PROOF_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const WITHDRAWAL_LIMITS = {
  MIN_AMOUNT: 50_000,
  MAX_AMOUNT: 100_000_000,
} as const;

export const WALLET_MESSAGES = {
  AUTH_REQUIRED: 'Autentikasi diperlukan. Harap masuk terlebih dahulu.',
  UNAUTHORIZED_ROLE: 'Hanya akun brand yang dapat mengakses dompet ini.',
  SUMMARY_FETCH_SUCCESS: 'Informasi ringkasan dompet brand berhasil diambil.',
  TRANSACTIONS_FETCH_SUCCESS: 'Riwayat transaksi dompet berhasil diambil.',
  ACTIVE_TOP_UPS_FETCH_SUCCESS: 'Daftar antrean transaksi top-up aktif berhasil diambil.',
  TOP_UP_CREATED_SUCCESS: 'Permintaan top-up berhasil dibuat. Silakan transfer sesuai nominal total.',
  TOP_UP_SUBMIT_SUCCESS: 'Bukti pembayaran top-up berhasil dikirim. Menunggu verifikasi admin.',
  TOP_UP_CANCEL_SUCCESS: 'Permintaan top-up berhasil dibatalkan.',
  TOP_UP_CANNOT_BE_CANCELLED: 'Permintaan top-up yang sudah disetujui tidak dapat dibatalkan.',
  TOP_UP_SIMULATION_SUCCESS: 'Simulasi top-up berhasil. Saldo aktif Anda telah ditambahkan.',
  PROOF_UPLOAD_SUCCESS: 'Bukti transfer top-up berhasil diunggah.',
  WALLET_NOT_FOUND: 'Dompet brand tidak ditemukan.',
  TOP_UP_NOT_FOUND: 'Permintaan top-up tidak ditemukan.',
  TOP_UP_ALREADY_PROCESSED: 'Permintaan top-up sudah diverifikasi atau diproses sebelumnya.',
  INVALID_AMOUNT_RANGE: 'Nominal top-up harus antara Rp 50.000 dan Rp 100.000.000.',
  INVALID_QUERY_PARAMS: 'Parameter query riwayat transaksi tidak valid.',
  CONTENT_LENGTH_REQUIRED: 'Header Content-Length diperlukan untuk unggahan berkas.',
  STORAGE_CONFIG_MISSING: 'Konfigurasi cloud storage Supabase belum diatur.',
  STORAGE_UPLOAD_FAILED: 'Gagal mengunggah bukti transfer ke cloud storage.',
  UNSUPPORTED_FILE_TYPE: 'Format file tidak didukung. Harap unggah gambar JPG, PNG, atau WEBP.',
  FILE_SIZE_EXCEEDED: 'Ukuran file melebihi batas maksimal 5 MB.',
  SENDER_BANK_REQUIRED: 'Nama bank atau e-wallet pengirim wajib diisi (min. 2 karakter).',
  SENDER_NAME_REQUIRED: 'Nama pemilik akun pengirim wajib diisi (min. 2 karakter).',
  ACTIVE_WITHDRAWALS_FETCH_SUCCESS: 'Daftar permintaan penarikan saldo aktif berhasil diambil.',
  WITHDRAWAL_CREATED_SUCCESS: 'Permintaan penarikan saldo berhasil diajukan. Menunggu verifikasi admin.',
  WITHDRAWAL_CANCEL_SUCCESS: 'Permintaan penarikan saldo berhasil dibatalkan. Saldo telah dikembalikan.',
  WITHDRAWAL_CANCELLATION_REQUESTED_SUCCESS: 'Pengajuan pembatalan penarikan berhasil dikirim. Menunggu persetujuan Admin.',
  WITHDRAWAL_CANCELLATION_ALREADY_REQUESTED: 'Pengajuan pembatalan penarikan ini sudah diajukan dan sedang ditinjau oleh Admin.',
  WITHDRAWAL_CANCELLATION_APPROVED_SUCCESS: 'Pengajuan pembatalan disetujui. Saldo berhasil dikembalikan ke akun Brand.',
  WITHDRAWAL_CANCELLATION_REJECTED_SUCCESS: 'Pengajuan pembatalan ditolak. Penarikan tetap diproses.',
  WITHDRAWAL_CANCELLATION_NOT_REQUESTED: 'Permintaan penarikan ini belum mengajukan pembatalan.',
  WITHDRAWAL_CANNOT_CANCEL_DIRECTLY: 'Penarikan saldo tidak dapat langsung dibatalkan sepihak. Silakan ajukan pembatalan untuk diverifikasi Admin.',
  INVALID_CANCELLATION_PAYLOAD: 'Data pengajuan pembatalan tidak valid.',
  WITHDRAWAL_NOT_FOUND: 'Permintaan penarikan saldo tidak ditemukan.',
  WITHDRAWAL_ALREADY_PROCESSED: 'Permintaan penarikan saldo sudah disetujui atau diproses sebelumnya.',
  INSUFFICIENT_BALANCE: 'Saldo aktif tidak mencukupi untuk melakukan penarikan.',
  INVALID_WITHDRAWAL_AMOUNT: 'Nominal penarikan minimal Rp 50.000.',
  ACCOUNT_PROVIDER_REQUIRED: 'Nama bank atau e-wallet tujuan penarikan wajib diisi.',
  ACCOUNT_NUMBER_REQUIRED: 'Nomor rekening atau nomor HP tujuan penarikan wajib diisi.',
  ACCOUNT_HOLDER_REQUIRED: 'Nama pemilik rekening tujuan penarikan wajib diisi.',
  WITHDRAWAL_SIMULATION_SUCCESS: 'Simulasi penarikan saldo berhasil disetujui.',
} as const;
