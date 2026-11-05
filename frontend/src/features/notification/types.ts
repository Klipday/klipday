export type NotificationCategory =
  | 'CAMPAIGN'
  | 'SUBMISSION'
  | 'FINANCE'
  | 'ACCOUNT'
  | 'SYSTEM';

export type NotificationType =
  | 'SUBMISSION_APPROVED'
  | 'SUBMISSION_REVISION_REQUESTED'
  | 'SUBMISSION_REJECTED'
  | 'WITHDRAWAL_APPROVED'
  | 'WITHDRAWAL_REJECTED'
  | 'KYC_VERIFIED'
  | 'KYC_REJECTED'
  | 'SUBMISSION_RECEIVED'
  | 'CAMPAIGN_APPROVED'
  | 'CAMPAIGN_REVISION_REQUESTED'
  | 'CAMPAIGN_REJECTED'
  | 'TOPUP_APPROVED'
  | 'TOPUP_REJECTED'
  | 'CAMPAIGN_BUDGET_EXHAUSTED'
  | 'ADMIN_NEW_CAMPAIGN'
  | 'ADMIN_NEW_TOPUP'
  | 'ADMIN_NEW_WITHDRAWAL'
  | 'ADMIN_NEW_KYC'
  | 'SYSTEM_ANNOUNCEMENT';

export interface NotificationItem {
  id: string;
  accountId: string;
  type: NotificationType | string;
  category: NotificationCategory;
  title: string;
  message: string;
  actionUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
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

export interface FetchNotificationsParams {
  page?: number;
  limit?: number;
  category?: NotificationCategory;
  unreadOnly?: boolean;
}

export interface NotificationBellProps {
  className?: string;
}

export interface NotificationPopoverProps {
  onClose?: () => void;
  onSelectFeedback?: (notification: NotificationItem) => void;
  className?: string;
}

export interface NotificationItemCardProps {
  notification: NotificationItem;
  onSelectNotification?: (notification: NotificationItem) => void;
  className?: string;
}

export interface NotificationFeedbackModalProps {
  notification: NotificationItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface NotificationEmptyStateProps {
  unreadOnly?: boolean;
  className?: string;
}

export interface NotificationsPageProps {
  className?: string;
}
