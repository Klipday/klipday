import { BellOff } from 'lucide-react';
import type { NotificationEmptyStateProps } from '../types';

/**
 * Clean empty state for notification list and popover.
 * Adheres strictly to Anti-AI Slop guidelines with disciplined typography and zero decorative clutter.
 *
 * @param props - Component properties including unreadOnly filter status and optional className.
 * @returns Rendered empty state card.
 */
export function NotificationEmptyState({ unreadOnly, className = '' }: NotificationEmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-10 px-4 text-center ${className}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-2.5">
        <BellOff className="h-4 w-4" />
      </div>
      <p className="text-sm font-medium text-foreground">
        {unreadOnly ? 'Tidak ada notifikasi belum dibaca' : 'Belum ada notifikasi'}
      </p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[220px] leading-relaxed">
        {unreadOnly
          ? 'Semua pembaruan penting sudah Anda baca.'
          : 'Pembaruan kampanye, review video, dan transaksi akan muncul di sini.'}
      </p>
    </div>
  );
}
