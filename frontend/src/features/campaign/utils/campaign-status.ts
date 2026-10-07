import type { CampaignEmptyStateConfig } from '../types';

/**
 * Returns contextual empty state title and description based on the active campaign status tab.
 *
 * @param status - The active lifecycle status filter.
 * @returns An object containing the localized title and description.
 */
export function GetEmptyStateForStatus(status?: string): CampaignEmptyStateConfig {
  switch (status) {
    case 'AWAITING_PAYMENT':
      return {
        title: 'Tidak Ada Kampanye Menunggu Pembayaran',
        description: 'Semua kampanye Anda telah selesai dibayar atau sedang dalam proses peninjauan.',
      };

    case 'IN_REVIEW':
      return {
        title: 'Tidak Ada Kampanye Dalam Review',
        description: 'Semua pengajuan kampanye telah selesai ditinjau. Kampanye yang Anda ajukan akan muncul di sini selama proses review admin.',
      };

    case 'REVISION':
      return {
        title: 'Tidak Ada Kampanye yang Perlu Revisi',
        description: 'Bagus! Saat ini tidak ada kampanye yang memerlukan revisi atau perbaikan instruksi.',
      };

    case 'FINISHED':
      return {
        title: 'Belum Ada Kampanye Selesai',
        description: 'Kampanye yang telah menyelesaikan periode penayangan atau mencapai target anggaran akan otomatis diarsipkan di sini.',
      };

    case 'ACTIVE':
    default:
      return {
        title: 'Belum Ada Kampanye Aktif',
        description: 'Saat ini belum ada kampanye yang sedang berjalan. Buat atau ajukan draf kampanye Anda untuk mulai berkolaborasi dengan kreator.',
      };
  }
}
