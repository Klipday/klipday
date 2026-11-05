import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger } from '@/components/ui/popover';
import { UseUnreadCountQuery } from '../hooks';
import type { NotificationBellProps, NotificationItem } from '../types';
import { NotificationFeedbackModal } from './NotificationFeedbackModal';
import { NotificationPopover } from './NotificationPopover';

/**
 * Navbar notification bell icon displaying active unread count badge.
 * Opens the interactive NotificationPopover dropdown on click and securely
 * mounts feedback modals outside the popover to prevent focus trap collisions.
 *
 * @param props - Bell trigger properties including optional styling.
 * @returns The rendered notification bell with attached popover and feedback modal.
 */
export function NotificationBell({ className = '' }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackItem, setFeedbackItem] = useState<NotificationItem | null>(null);

  const { data } = UseUnreadCountQuery();
  const unreadCount = data?.unreadCount ?? 0;

  const handleSelectFeedback = (item: NotificationItem) => {
    setIsOpen(false);
    setFeedbackItem(item);
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Buka notifikasi"
            className={`relative rounded-full text-muted-foreground hover:text-foreground cursor-pointer ${className}`}
          >
            <Bell className="h-5 w-5" />

            {unreadCount > 0 && (
              <>
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
                </span>
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </>
            )}
          </Button>
        </PopoverTrigger>

        <NotificationPopover
          onClose={() => setIsOpen(false)}
          onSelectFeedback={handleSelectFeedback}
        />
      </Popover>

      {/* Rendered outside popover container to ensure smooth modal interaction without unmount race conditions */}
      <NotificationFeedbackModal
        notification={feedbackItem}
        isOpen={Boolean(feedbackItem)}
        onClose={() => setFeedbackItem(null)}
      />
    </>
  );
}
