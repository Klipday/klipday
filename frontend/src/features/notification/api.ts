import { apiClient, ExtractApiError } from '@/lib/api-client';
import type {
  FetchNotificationsParams,
  NotificationItem,
  NotificationListResponse,
  UnreadCountResponse,
} from './types';

interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message: string;
}

/**
 * Fetches paginated list of user notifications with active filters.
 *
 * @param params - Query parameters including page, limit, category, and unreadOnly.
 * @returns Paginated notification list and unread count.
 */
export async function FetchNotifications(
  params: FetchNotificationsParams = {}
): Promise<NotificationListResponse> {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.category) query.append('category', params.category);
    if (typeof params.unreadOnly === 'boolean') {
      query.append('unreadOnly', String(params.unreadOnly));
    }

    const queryString = query.toString();
    const url = queryString ? `/notifications?${queryString}` : '/notifications';

    const response = await apiClient.get<ApiResponse<NotificationListResponse>>(url);
    const result = response.data.data;
    return result;
  } catch (error) {
    throw ExtractApiError(error, 'Gagal mengambil daftar notifikasi.');
  }
}

/**
 * Fetches lightweight unread notification counter for the navbar badge.
 *
 * @returns Object containing active unreadCount.
 */
export async function FetchUnreadCount(): Promise<UnreadCountResponse> {
  try {
    const response = await apiClient.get<ApiResponse<UnreadCountResponse>>(
      '/notifications/unread-count'
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    throw ExtractApiError(error, 'Gagal mengambil jumlah notifikasi belum dibaca.');
  }
}

/**
 * Marks a specific notification as read.
 *
 * @param id - Notification identifier.
 * @returns Updated notification item.
 */
export async function MarkNotificationAsRead(id: string): Promise<NotificationItem> {
  try {
    const response = await apiClient.patch<ApiResponse<NotificationItem>>(
      `/notifications/${id}/read`
    );
    const result = response.data.data;
    return result;
  } catch (error) {
    throw ExtractApiError(error, 'Gagal menandai notifikasi sebagai dibaca.');
  }
}

/**
 * Marks all unread notifications for the user as read.
 */
export async function MarkAllNotificationsAsRead(): Promise<void> {
  try {
    await apiClient.patch<ApiResponse<null>>('/notifications/read-all');
  } catch (error) {
    throw ExtractApiError(error, 'Gagal menandai semua notifikasi sebagai dibaca.');
  }
}

/**
 * Soft-deletes a notification row.
 *
 * @param id - Notification identifier.
 */
export async function DeleteNotification(id: string): Promise<void> {
  try {
    await apiClient.delete<ApiResponse<null>>(`/notifications/${id}`);
  } catch (error) {
    throw ExtractApiError(error, 'Gagal menghapus notifikasi.');
  }
}
