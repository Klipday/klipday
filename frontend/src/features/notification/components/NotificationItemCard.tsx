import { MessageSquareText } from 'lucide-react';
import type { NotificationItemCardProps } from '../types';
import { FormatCategoryLabel, FormatRelativeTime } from '../utils/format-time';

/**
 * Compact notification item row displaying unread status, category pill, relative time,
 * message preview, and quick access to feedback notes.
 *
 * @param props - Item card properties including notification item and click callback.
 * @returns The rendered notification item row.
 */
export function NotificationItemCard({
  notification,
  onSelectNotification,
  className = '',
}: NotificationItemCardProps) {
  const rawMetadata = notification.metadata ?? {};
  const hasFeedbackNote = Boolean(
    rawMetadata.reviewNote || rawMetadata.adminNote || rawMetadata.rejectionReason
  );

  const handleClick = () => {
    onSelectNotification?.(notification);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`group relative flex cursor-pointer items-start gap-3 p-3.5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:bg-muted/40 border-b border-border/40 last:border-b-0 ${
        !notification.isRead ? 'bg-muted/20' : ''
      } ${className}`}
    >
      {/* Unread Indicator Dot */}
      <div className="flex h-4 w-2 items-center justify-center shrink-0">
        {!notification.isRead ? (
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-transparent" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-muted text-muted-foreground">
            {FormatCategoryLabel(notification.category)}
          </span>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
            {FormatRelativeTime(notification.createdAt)}
          </span>
        </div>

        <h4
          className={`text-xs font-medium leading-snug line-clamp-1 ${
            !notification.isRead ? 'text-foreground font-semibold' : 'text-foreground/90'
          }`}
        >
          {notification.title}
        </h4>

        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {notification.message}
        </p>

        {hasFeedbackNote && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-rose-500/20 bg-rose-500/5 px-2 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400">
            <MessageSquareText className="h-3 w-3 shrink-0" />
            <span>Lihat Catatan Feedback</span>
          </div>
        )}
      </div>
    </div>
  );
}
