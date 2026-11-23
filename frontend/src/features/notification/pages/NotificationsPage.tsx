import { useState } from 'react';
import {
  AltArrowLeftIcon,
  AltArrowRightIcon,
  CheckReadIcon,
  FilterIcon,
  LoaderIcon,
} from '@solar-icons/react/linear';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  UseMarkAllReadMutation,
  UseMarkNotificationReadMutation,
  UseNotificationsQuery,
  UseUnreadCountQuery,
} from '../hooks';
import type {
  NotificationCategory,
  NotificationItem,
  NotificationsPageProps,
} from '../types';
import { NotificationEmptyState } from '../components/NotificationEmptyState';
import { NotificationItemCard } from '../components/NotificationItemCard';

const CATEGORY_TABS: Array<{ label: string; value: NotificationCategory | 'ALL' }> = [
  { label: 'Semua', value: 'ALL' },
  { label: 'Kampanye', value: 'CAMPAIGN' },
  { label: 'Submission', value: 'SUBMISSION' },
  { label: 'Keuangan', value: 'FINANCE' },
  { label: 'Akun', value: 'ACCOUNT' },
];

/**
 * Full page inbox for user notifications with categorized filtering,
 * unread toggle, and pagination.
 *
 * @param props - NotificationsPage properties including optional styling.
 * @returns The rendered full notifications inbox page.
 */
export function NotificationsPage({ className = '' }: NotificationsPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | 'ALL'>('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  const { data: unreadData } = UseUnreadCountQuery();
  const unreadCount = unreadData?.unreadCount ?? 0;

  const { data, isLoading } = UseNotificationsQuery({
    page,
    limit: 15,
    category: selectedCategory === 'ALL' ? undefined : selectedCategory,
    unreadOnly: unreadOnly ? true : undefined,
  });

  const markReadMutation = UseMarkNotificationReadMutation();
  const markAllMutation = UseMarkAllReadMutation();

  const notifications = data?.notifications ?? [];
  const totalPages = data?.totalPages ?? 1;

  const HandleSelectNotification = (item: NotificationItem) => {
    if (!item.isRead) {
      markReadMutation.mutate(item.id);
    }
  };

  const HandleCategoryChange = (tab: NotificationCategory | 'ALL') => {
    setSelectedCategory(tab);
    setPage(1);
  };

  const HandleUnreadToggle = () => {
    setUnreadOnly((prev) => !prev);
    setPage(1);
  };

  return (
    <div className={`space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-12 ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Notifikasi
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Pusat pesan, pembaruan status review video, dan pemberitahuan transaksi.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={unreadCount === 0 || markAllMutation.isPending}
          onClick={() => markAllMutation.mutate()}
          className="self-start sm:self-auto cursor-pointer text-xs"
        >
          {markAllMutation.isPending ? (
            <LoaderIcon className="h-3.5 w-3.5 animate-spin mr-1.5" />
          ) : (
            <CheckReadIcon className="h-3.5 w-3.5 mr-1.5" />
          )}
          Tandai semua dibaca
        </Button>
      </div>

      {/* Main Content Card */}
      <Card className="w-full min-w-0 rounded-2xl border-border/80 shadow-xs py-0 gap-0">
        <div className="w-full min-w-0 border-b border-border/60 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
            {/* Category Filter Tabs (Single-row horizontal scroll on mobile) */}
            <div className="w-full max-w-full min-w-0 sm:w-auto overflow-x-auto overscroll-x-contain touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="inline-flex w-max shrink-0 items-center gap-1">
                {CATEGORY_TABS.map((tab) => {
                  const isActive = selectedCategory === tab.value;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => HandleCategoryChange(tab.value)}
                      className={`shrink-0 rounded-lg px-2.5 py-1.5 sm:px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-foreground text-background font-semibold shadow-xs'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Unread Toggle */}
            <button
              type="button"
              onClick={HandleUnreadToggle}
              className={`inline-flex self-start sm:self-auto shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                unreadOnly
                  ? 'border-foreground/40 bg-muted text-foreground font-semibold'
                  : 'border-border/80 bg-background text-muted-foreground hover:text-foreground'
              }`}
            >
              <FilterIcon className="h-3.5 w-3.5" />
              <span>Hanya Belum Dibaca</span>
              {unreadCount > 0 && (
                <span className="text-xs tabular-nums text-muted-foreground">
                  ({unreadCount})
                </span>
              )}
            </button>
          </div>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <LoaderIcon className="h-5 w-5 animate-spin mr-2" />
              <span className="text-xs sm:text-sm">Memuat notifikasi...</span>
            </div>
          ) : notifications.length === 0 ? (
            <NotificationEmptyState unreadOnly={unreadOnly} className="py-16" />
          ) : (
            <div className="divide-y divide-border/60">
              {notifications.map((item) => (
                <NotificationItemCard
                  key={item.id}
                  notification={item}
                  onSelectNotification={HandleSelectNotification}
                  className="px-4 py-3.5 sm:px-6 sm:py-4"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-xs text-muted-foreground">
            Halaman <span className="font-medium text-foreground">{page}</span> dari{' '}
            <span className="font-medium text-foreground">{totalPages}</span>
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 w-8 p-0"
              aria-label="Halaman sebelumnya"
            >
              <AltArrowLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 w-8 p-0"
              aria-label="Halaman berikutnya"
            >
              <AltArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;

