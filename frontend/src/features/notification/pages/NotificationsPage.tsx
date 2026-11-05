import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CheckCheck, ChevronLeft, ChevronRight, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { NotificationFeedbackModal } from '../components/NotificationFeedbackModal';
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
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | 'ALL'>('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [feedbackItem, setFeedbackItem] = useState<NotificationItem | null>(null);

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

  const handleSelectNotification = (item: NotificationItem) => {
    if (!item.isRead) {
      markReadMutation.mutate(item.id);
    }

    const rawMetadata = item.metadata ?? {};
    const hasNote = Boolean(
      rawMetadata.reviewNote || rawMetadata.adminNote || rawMetadata.rejectionReason
    );

    if (hasNote) {
      setFeedbackItem(item);
    } else if (item.actionUrl) {
      navigate(item.actionUrl);
    }
  };

  const handleCategoryChange = (tab: NotificationCategory | 'ALL') => {
    setSelectedCategory(tab);
    setPage(1);
  };

  const handleUnreadToggle = () => {
    setUnreadOnly((prev) => !prev);
    setPage(1);
  };

  return (
    <div className={`space-y-6 max-w-5xl mx-auto pb-12 ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Notifikasi
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pusat pesan, pembaruan status review video, dan pemberitahuan transaksi.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={unreadCount === 0 || markAllMutation.isPending}
          onClick={() => markAllMutation.mutate()}
          className="self-start sm:self-auto cursor-pointer"
        >
          {markAllMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <CheckCheck className="h-4 w-4 mr-1.5" />
          )}
          Tandai semua dibaca
        </Button>
      </div>

      {/* Main Content Card */}
      <Card className="rounded-2xl border-border/80 shadow-xs">
        <CardHeader className="border-b border-border/60 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-1">
              {CATEGORY_TABS.map((tab) => {
                const isActive = selectedCategory === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => handleCategoryChange(tab.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
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

            {/* Unread Toggle */}
            <button
              type="button"
              onClick={handleUnreadToggle}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                unreadOnly
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold'
                  : 'border-border/80 bg-background text-muted-foreground hover:text-foreground'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Hanya Belum Dibaca</span>
              {unreadCount > 0 && (
                <span className="ml-1 rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-sm">Memuat notifikasi...</span>
            </div>
          ) : notifications.length === 0 ? (
            <NotificationEmptyState unreadOnly={unreadOnly} className="py-20" />
          ) : (
            <div className="divide-y divide-border/60">
              {notifications.map((item) => (
                <NotificationItemCard
                  key={item.id}
                  notification={item}
                  onSelectNotification={handleSelectNotification}
                  className="px-6 py-4"
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
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 w-8 p-0"
              aria-label="Halaman berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Feedback Thread Modal */}
      <NotificationFeedbackModal
        notification={feedbackItem}
        isOpen={Boolean(feedbackItem)}
        onClose={() => setFeedbackItem(null)}
      />
    </div>
  );
}

export default NotificationsPage;

