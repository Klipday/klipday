import type { NotificationCategory, NotificationType } from '../../generated/prisma/enums.js';

export interface NotificationItem {
  id: string;
  accountId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  actionUrl: string | null;
  isRead: boolean;
  readAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  unreadCount: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
