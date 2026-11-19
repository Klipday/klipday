import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import type { NotificationItemCardProps } from '../types';
import { FormatCategoryLabel, FormatRelativeTime } from '../utils/format-time';

/**
 * Compact notification item row displaying unread indicator, category label,
 * relative time, message preview, and optional inline feedback note.
 * Unread rows can be clicked or activated via keyboard to mark them as read without redirecting.
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
  const feedbackNote =
    (typeof rawMetadata.reviewNote === 'string' && rawMetadata.reviewNote) ||
    (typeof rawMetadata.adminNote === 'string' && rawMetadata.adminNote) ||
    (typeof rawMetadata.rejectionReason === 'string' && rawMetadata.rejectionReason) ||
    '';

  const isUnread = !notification.isRead;
  const categoryLabel = FormatCategoryLabel(notification.category);
  const relativeTime = FormatRelativeTime(notification.createdAt);

  const HandleMarkAsRead = () => {
    if (isUnread) {
      onSelectNotification?.(notification);
    }
  };

  const HandleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isUnread) {
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      HandleMarkAsRead();
    }
  };

  return (
    <div
      role={isUnread ? 'button' : undefined}
      tabIndex={isUnread ? 0 : undefined}
      onClick={isUnread ? HandleMarkAsRead : undefined}
      onKeyDown={isUnread ? HandleKeyDown : undefined}
      className={cn(
        'group relative flex items-start gap-3 p-3.5 transition-colors border-b border-border/40 last:border-b-0',
        isUnread
          ? 'cursor-pointer bg-muted/20 hover:bg-muted/40 focus-visible:outline-none focus-visible:bg-muted/40'
          : 'cursor-default',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            {isUnread ? (
              <span className="size-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
            ) : null}
            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-muted text-muted-foreground">
              {categoryLabel}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
            {relativeTime}
          </span>
        </div>

        <h4
          className={cn(
            'text-xs font-medium leading-snug',
            isUnread ? 'text-foreground font-semibold' : 'text-foreground/90',
          )}
        >
          {notification.title}
        </h4>

        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {notification.message}
        </p>

        {feedbackNote && (
          <p className="mt-2 rounded-md border border-border/50 bg-muted/30 px-2.5 py-1.5 text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {feedbackNote}
          </p>
        )}
      </div>
    </div>
  );
}
