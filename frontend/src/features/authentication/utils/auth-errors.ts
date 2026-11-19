const AUTH_ERROR_CODE_DICTIONARY: Record<string, string> = {
  EMAIL_NOT_VERIFIED: 'Email Anda belum diverifikasi. Silakan masukkan kode verifikasi.',
  RESEND_COOLDOWN_ACTIVE: 'Harap tunggu 60 detik sebelum meminta kode baru.',
  EMAIL_DELIVERY_FAILED: 'Gagal mengirim email verifikasi. Silakan coba beberapa saat lagi.',
  CSRF_FORBIDDEN: 'Permintaan ditolak karena origin tidak valid. Muat ulang halaman dan coba lagi.',
  INVALID_CREDENTIALS: 'Email atau kata sandi salah.',
  SESSION_EXPIRED: 'Sesi telah berakhir atau tidak valid.',
  RATE_LIMITED: 'Terlalu banyak percobaan. Silakan coba lagi nanti.',
  INVALID_OR_EXPIRED_CODE: 'Kode verifikasi tidak valid atau telah kedaluwarsa.',
  INVALID_OR_EXPIRED_RESET_TOKEN: 'Tautan pengaturan ulang kata sandi tidak valid atau telah kedaluwarsa.',
};

const AUTH_ERROR_DICTIONARY: Record<string, string> = {
  // Authentication & session errors
  'Invalid email or password.': 'Email atau kata sandi salah.',
  'Invalid email or password': 'Email atau kata sandi salah.',
  'Email is already registered.': 'Email sudah terdaftar.',
  'Email is already registered': 'Email sudah terdaftar.',
  'Please verify your email before logging in.': 'Silakan verifikasi email Anda sebelum masuk.',
  'Please verify your email before logging in': 'Silakan verifikasi email Anda sebelum masuk.',
  'Authentication is not configured.': 'Konfigurasi autentikasi belum siap.',
  'Authentication configuration is missing.': 'Konfigurasi autentikasi belum siap.',
  'Authentication required.': 'Autentikasi diperlukan.',
  'Session is invalid or has expired.': 'Sesi telah berakhir atau tidak valid.',
  'Session has expired or is invalid.': 'Sesi telah berakhir atau tidak valid.',
  'Account not found.': 'Akun tidak ditemukan.',
  'Too many requests, please try again later.': 'Terlalu banyak percobaan. Silakan coba lagi nanti.',
  'Too many requests. Please try again later.': 'Terlalu banyak percobaan. Silakan coba lagi nanti.',

  // Validation errors
  'Invalid request body.': 'Data yang dikirim tidak valid.',
  'Invalid request data.': 'Data yang dikirim tidak valid.',
  'Email or password is required.': 'Email dan kata sandi wajib diisi.',
  'Password is required.': 'Kata sandi wajib diisi.',
  'Email is required.': 'Email wajib diisi.',
  'A valid email is required.': 'Email tidak valid.',
  'Invalid email address.': 'Email tidak valid.',
  'Password must be at least 8 characters.': 'Kata sandi minimal 8 karakter.',
  'Password must contain at least one uppercase letter.': 'Kata sandi harus mengandung huruf kapital.',
  'Password must contain at least one number.': 'Kata sandi harus mengandung angka.',
  'Password must contain at least one symbol.': 'Kata sandi harus mengandung simbol.',
  'Company name is required for brand accounts.': 'Nama perusahaan wajib diisi untuk akun brand.',
  'Phone number is required for brand accounts.': 'Nomor telepon wajib diisi untuk akun brand.',
  'Full name is required for creator accounts.': 'Nama lengkap wajib diisi untuk akun kreator.',
  'Invalid industry selected.': 'Industri yang dipilih tidak valid.',
  'Selected industry is invalid.': 'Industri yang dipilih tidak valid.',

  // Network & system errors
  'Network Error': 'Gagal terhubung ke server. Periksa koneksi internet Anda.',
  'Internal Server Error': 'Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.',
};

/**
 * Translates raw backend, network, or validation error messages into natural Indonesian.
 * Prioritizes machine-readable backend error codes when present, then matches the
 * localized dictionary and fallback patterns.
 *
 * @param rawMessage - Raw error message string extracted from API responses.
 * @param fallback - Optional fallback message to use when rawMessage is empty or undefined.
 * @param errorCode - Optional structured error code from the backend response `data.code`.
 * @returns Localized, user-friendly error message in Indonesian.
 */
export function TranslateAuthError(
  rawMessage?: string,
  fallback = 'Terjadi kesalahan pada proses autentikasi. Silakan coba lagi.',
  errorCode?: string,
): string {
  if (errorCode) {
    const codeMatch = AUTH_ERROR_CODE_DICTIONARY[errorCode];
    if (codeMatch) {
      return codeMatch;
    }
  }

  if (!rawMessage || typeof rawMessage !== 'string') {
    return fallback;
  }

  const trimmed = rawMessage.trim();

  // 1. Direct dictionary lookup
  const exactMatch = AUTH_ERROR_DICTIONARY[trimmed];
  if (exactMatch) {
    return exactMatch;
  }

  // 2. Pattern-based translation for compound or variable messages
  const lower = trimmed.toLowerCase();

  if (lower.includes('invalid email or password')) {
    return 'Email atau kata sandi salah.';
  }

  if (lower.includes('email is already registered') || lower.includes('email sudah terdaftar')) {
    return 'Email sudah terdaftar.';
  }

  if (lower.includes('verify your email')) {
    return 'Silakan verifikasi email Anda sebelum masuk.';
  }

  if (lower.includes('too many requests') || lower.includes('rate limit')) {
    return 'Terlalu banyak percobaan. Silakan coba lagi nanti.';
  }

  if (lower.includes('network error') || lower.includes('failed to fetch')) {
    return 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
  }

  if (lower.includes('timeout')) {
    return 'Koneksi ke server terputus (timeout). Silakan coba lagi.';
  }

  if (lower.includes('internal server error') || lower.includes('status code 500')) {
    return 'Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.';
  }

  if (lower.includes('phone number is required')) {
    return 'Nomor telepon wajib diisi.';
  }

  if (lower.includes('invalid phone number') || lower.includes('diawali dengan 62')) {
    return 'Nomor telepon harus diawali dengan 62 (contoh: 628123456789).';
  }

  if (lower.includes('password must be at least')) {
    return 'Kata sandi minimal 8 karakter.';
  }

  if (lower.includes('password must contain at least one uppercase letter')) {
    return 'Kata sandi harus mengandung huruf kapital.';
  }

  if (lower.includes('password must contain at least one number')) {
    return 'Kata sandi harus mengandung angka.';
  }

  if (lower.includes('password must contain at least one symbol')) {
    return 'Kata sandi harus mengandung simbol.';
  }

  // If the message is already in Indonesian, return it as-is
  const containsIndonesianWords = /\b(email|kata sandi|terdaftar|masuk|daftar|wajib|tidak valid|gagal|silakan|akun|telepon|diawali)\b/i.test(
    trimmed
  );
  if (containsIndonesianWords) {
    return trimmed;
  }

  // Fallback for unexpected English messages
  return trimmed || fallback;
}
