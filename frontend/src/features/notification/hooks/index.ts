import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DeleteNotification,
  FetchNotifications,
  FetchUnreadCount,
  MarkAllNotificationsAsRead,
  MarkNotificationAsRead,
} from '../api';
import type {
  FetchNotificationsParams,
  NotificationItem,
  NotificationListResponse,
  UnreadCountResponse,
} from '../types';

export const NOTIFICATION_QUERY_KEYS = {
  all: ['notifications'] as const,
  list: (params?: FetchNotificationsParams) => ['notifications', 'list', params] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

/**
 * Hook to fetch paginated notifications with filters.
 *
 * @param params - Query parameters including pagination, category, and unreadOnly.
 * @returns TanStack Query result containing the notification list response.
 */
export function UseNotificationsQuery(params: FetchNotificationsParams = {}) {
  return useQuery<NotificationListResponse>({
    queryKey: NOTIFICATION_QUERY_KEYS.list(params),
    queryFn: () => FetchNotifications(params),
    staleTime: 10000,
  });
}

/**
 * Hook to poll unread notifications count every 30 seconds for the navbar bell.
 *
 * @returns TanStack Query result containing the unread count response.
 */
export function UseUnreadCountQuery() {
  return useQuery<UnreadCountResponse>({
    queryKey: NOTIFICATION_QUERY_KEYS.unreadCount,
    queryFn: FetchUnreadCount,
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

/**
 * Mutation hook to mark a single notification as read.
 *
 * @returns TanStack Mutation result for marking a notification as read.
 */
export function UseMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation<NotificationItem, Error, string>({
    mutationFn: (id: string) => MarkNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}

/**
 * Mutation hook to mark all notifications as read.
 *
 * @returns TanStack Mutation result for marking all notifications as read.
 */
export function UseMarkAllReadMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => MarkAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}

/**
 * Mutation hook to soft-delete a notification.
 *
 * @returns TanStack Mutation result for deleting a notification.
 */
export function UseDeleteNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id: string) => DeleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}

// Aliases matching camelCase naming for flexibility
export const useNotificationsQuery = UseNotificationsQuery;
export const useUnreadCountQuery = UseUnreadCountQuery;
export const useMarkNotificationReadMutation = UseMarkNotificationReadMutation;
export const useMarkAllReadMutation = UseMarkAllReadMutation;
export const useDeleteNotificationMutation = UseDeleteNotificationMutation;
