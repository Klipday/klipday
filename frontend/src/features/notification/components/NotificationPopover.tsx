import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRightIcon, CheckReadIcon, LoaderIcon } from '@solar-icons/react/linear';
import { Button } from '@/components/ui/button';
import { PopoverContent } from '@/components/ui/popover';
import {
  UseMarkAllReadMutation,
  UseMarkNotificationReadMutation,
  UseNotificationsQuery,
  UseUnreadCountQuery,
} from '../hooks';
import type { NotificationItem, NotificationPopoverProps } from '../types';
import { NotificationEmptyState } from './NotificationEmptyState';
import { NotificationItemCard } from './NotificationItemCard';

/**
 * Dropdown popover list displaying recent notifications, unread filter tabs,
 * quick "mark all as read" action, and navigation to the full inbox.
 *
 * @param props - Popover properties including onClose and optional styling.
 * @returns The rendered notification popover dropdown.
 */
export function NotificationPopover({
  onClose,
  className = '',
}: NotificationPopoverProps) {
  const navigate = useNavigate();
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data: unreadData } = UseUnreadCountQuery();
  const unreadCount = unreadData?.unreadCount ?? 0;

  const { data, isLoading } = UseNotificationsQuery({
    page: 1,
    limit: 15,
    unreadOnly: unreadOnly ? true : undefined,
  });

  const markReadMutation = UseMarkNotificationReadMutation();
  const markAllMutation = UseMarkAllReadMutation();

  const notifications = data?.notifications ?? [];

  const HandleSelectNotification = (item: NotificationItem) => {
    if (!item.isRead) {
      markReadMutation.mutate(item.id);
    }
  };

  const HandleViewAll = () => {
    onClose?.();
    navigate('/notifications');
  };

  return (
    <PopoverContent
      align="end"
      sideOffset={8}
      className={`w-80 sm:w-96 p-0 shadow-xl rounded-2xl overflow-hidden border border-border/80 bg-popover text-popover-foreground ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 bg-muted/20">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Notifikasi</h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 text-[11px] font-semibold">
              {unreadCount > 9 ? '9+' : unreadCount} baru
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          disabled={unreadCount === 0 || markAllMutation.isPending}
          onClick={() => markAllMutation.mutate()}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-40"
        >
          {markAllMutation.isPending ? (
            <LoaderIcon className="h-3.5 w-3.5 animate-spin mr-1" />
          ) : (
            <CheckReadIcon className="h-3.5 w-3.5 mr-1" />
          )}
          Tandai semua dibaca
        </Button>
      </div>

      {/* Quick Filter Segmented Control */}
      <div className="flex border-b border-border/60 p-0 overflow-hidden divide-x divide-border/60 bg-muted/20">
        <button
          type="button"
          onClick={() => setUnreadOnly(false)}
          className={`flex-1 py-2 text-xs font-medium transition-colors cursor-pointer text-center ${
            !unreadOnly
              ? 'bg-background text-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
          }`}
        >
          Semua
        </button>
        <button
          type="button"
          onClick={() => setUnreadOnly(true)}
          className={`flex-1 py-2 text-xs font-medium transition-colors cursor-pointer text-center ${
            unreadOnly
              ? 'bg-background text-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
          }`}
        >
          Belum Dibaca {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {/* Scrollable Notification List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <LoaderIcon className="h-5 w-5 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <NotificationEmptyState unreadOnly={unreadOnly} />
        ) : (
          notifications.map((item) => (
            <NotificationItemCard
              key={item.id}
              notification={item}
              onSelectNotification={HandleSelectNotification}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border/60 p-2.5 bg-muted/10 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={HandleViewAll}
          className="w-full h-8 text-xs font-medium text-muted-foreground hover:text-foreground justify-center gap-1.5 cursor-pointer"
        >
          <span>Lihat semua notifikasi</span>
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Button>
      </div>
    </PopoverContent>
  );
}
