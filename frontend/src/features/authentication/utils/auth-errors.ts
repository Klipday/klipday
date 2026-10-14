const AUTH_ERROR_DICTIONARY: Record<string, string> = {
  // Authentication & session errors
  'Invalid email or password.': 'Email atau kata sandi salah.',
  'Invalid email or password': 'Email atau kata sandi salah.',
  'Email is already registered.': 'Email sudah terdaftar.',
  'Email is already registered': 'Email sudah terdaftar.',
  'Please verify your email before logging in.': 'Silakan verifikasi email Anda sebelum masuk.',
  'Please verify your email before logging in': 'Silakan verifikasi email Anda sebelum masuk.',
  'Authentication is not configured.': 'Konfigurasi autentikasi belum siap.',
  'Authentication required.': 'Autentikasi diperlukan.',
  'Session is invalid or has expired.': 'Sesi telah berakhir atau tidak valid.',
  'Account not found.': 'Akun tidak ditemukan.',
  'Too many requests, please try again later.': 'Terlalu banyak percobaan. Silakan coba lagi nanti.',

  // Validation errors
  'Invalid request body.': 'Data yang dikirim tidak valid.',
  'Password is required.': 'Kata sandi wajib diisi.',
  'A valid email is required.': 'Email tidak valid.',
  'Password must be at least 8 characters.': 'Kata sandi minimal 8 karakter.',
  'Password must contain at least one uppercase letter.': 'Kata sandi harus mengandung huruf kapital.',
  'Password must contain at least one number.': 'Kata sandi harus mengandung angka.',
  'Password must contain at least one symbol.': 'Kata sandi harus mengandung simbol.',
  'Company name is required for brand accounts.': 'Nama perusahaan wajib diisi untuk akun brand.',
  'Phone number is required for brand accounts.': 'Nomor telepon wajib diisi untuk akun brand.',
  'Full name is required for creator accounts.': 'Nama lengkap wajib diisi untuk akun kreator.',
  'Invalid industry selected.': 'Industri yang dipilih tidak valid.',

  // Network & system errors
  'Network Error': 'Gagal terhubung ke server. Periksa koneksi internet Anda.',
  'Internal Server Error': 'Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.',
};

/**
 * Translates raw backend, network, or validation error messages into natural Indonesian.
 * If the incoming message already matches a localized Indonesian string or cannot be mapped,
 * it returns a sanitized version or a friendly fallback.
 *
 * @param rawMessage - Raw error message string extracted from API responses.
 * @param fallback - Optional fallback message to use when rawMessage is empty or undefined.
 * @returns Localized, user-friendly error message in Indonesian.
 */
export function TranslateAuthError(
  rawMessage?: string,
  fallback = 'Terjadi kesalahan pada proses autentikasi. Silakan coba lagi.'
): string {
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
