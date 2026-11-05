export const DEFAULT_NOTIFICATION_PAGE = 1;
export const DEFAULT_NOTIFICATION_LIMIT = 20;
export const MAX_NOTIFICATION_LIMIT = 50;

export const NOTIFICATION_MESSAGES = {
  AUTH_REQUIRED: 'Autentikasi diperlukan.',
  FETCH_SUCCESS: 'Daftar notifikasi berhasil diambil.',
  UNREAD_COUNT_SUCCESS: 'Jumlah notifikasi belum dibaca berhasil diambil.',
  MARK_READ_SUCCESS: 'Notifikasi berhasil ditandai sebagai dibaca.',
  MARK_ALL_READ_SUCCESS: 'Semua notifikasi berhasil ditandai sebagai dibaca.',
  DELETE_SUCCESS: 'Notifikasi berhasil dihapus.',
  NOT_FOUND: 'Notifikasi tidak ditemukan.',
  FORBIDDEN: 'Anda tidak memiliki akses ke notifikasi ini.',
} as const;
