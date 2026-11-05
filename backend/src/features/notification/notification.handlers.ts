import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';
import { Status } from '../../generated/prisma/enums.js';
import { SendError, SendSuccess } from '../../utils/api-response.js';
import { prisma } from '../../utils/prisma.js';
import { NOTIFICATION_MESSAGES } from './notification.constants.js';
import {
  NotificationIdParamSchema,
  NotificationQuerySchema,
} from './notification.schemas.js';
import type {
  NotificationItem,
  NotificationListResponse,
  UnreadCountResponse,
} from './notification.types.js';

/**
 * Maps a raw Prisma Notification row into a clean, strictly-typed NotificationItem DTO.
 *
 * @param record - Prisma notification entity.
 * @returns Clean NotificationItem contract.
 */
function MapNotificationToItem(record: {
  id: string;
  accountId: string;
  type: import('../../generated/prisma/enums.js').NotificationType;
  category: import('../../generated/prisma/enums.js').NotificationCategory;
  title: string;
  message: string;
  actionUrl: string | null;
  isRead: boolean;
  readAt: Date | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}): NotificationItem {
  const parsedMetadata =
    record.metadata && typeof record.metadata === 'object' && !Array.isArray(record.metadata)
      ? (record.metadata as Record<string, unknown>)
      : null;

  const item: NotificationItem = {
    id: record.id,
    accountId: record.accountId,
    type: record.type,
    category: record.category,
    title: record.title,
    message: record.message,
    actionUrl: record.actionUrl,
    isRead: record.isRead,
    readAt: record.readAt,
    metadata: parsedMetadata,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };

  return item;
}

/**
 * Handles `GET /notifications`: retrieves paginated list of notifications with unread counts.
 *
 * @param req - Express request with authenticated account and query parameters.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetNotifications(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, NOTIFICATION_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    const queryValidation = NotificationQuerySchema.safeParse(req.query);

    if (!queryValidation.success) {
      SendError(res, queryValidation.error.issues[0]?.message ?? 'Parameter query tidak valid.', 400);
      return;
    }

    const { page, limit, category, unreadOnly } = queryValidation.data;
    const skipCount = (page - 1) * limit;

    const whereClause: Prisma.NotificationWhereInput = {
      accountId: account.sub,
      status: Status.ACTIVE,
      ...(category ? { category } : {}),
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [rawNotifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: skipCount,
        take: limit,
      }),
      prisma.notification.count({
        where: whereClause,
      }),
      prisma.notification.count({
        where: {
          accountId: account.sub,
          status: Status.ACTIVE,
          isRead: false,
        },
      }),
    ]);

    const notificationItems = rawNotifications.map((n) => MapNotificationToItem(n));
    const totalPages = Math.ceil(totalCount / limit) || 1;

    const responsePayload: NotificationListResponse = {
      notifications: notificationItems,
      unreadCount,
      total: totalCount,
      page,
      limit,
      totalPages,
    };

    SendSuccess(res, responsePayload, NOTIFICATION_MESSAGES.FETCH_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `GET /notifications/unread-count`: lightweight query returning active unread notification count.
 *
 * @param req - Express request with authenticated account.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetUnreadCount(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, NOTIFICATION_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    const unreadCount = await prisma.notification.count({
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
        isRead: false,
      },
    });

    const payload: UnreadCountResponse = {
      unreadCount,
    };

    SendSuccess(res, payload, NOTIFICATION_MESSAGES.UNREAD_COUNT_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `PATCH /notifications/:id/read`: marks a single notification as read.
 *
 * @param req - Express request with notification id param.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function MarkNotificationRead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, NOTIFICATION_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    const paramValidation = NotificationIdParamSchema.safeParse(req.params);

    if (!paramValidation.success) {
      SendError(res, paramValidation.error.issues[0]?.message ?? 'ID notifikasi tidak valid.', 400);
      return;
    }

    const { id } = paramValidation.data;

    // Fast-fail combined existence and tenant ownership check
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id,
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    });

    if (!existingNotification) {
      SendError(res, NOTIFICATION_MESSAGES.NOT_FOUND, 404);
      return;
    }

    if (existingNotification.isRead) {
      const item = MapNotificationToItem(existingNotification);
      SendSuccess(res, item, NOTIFICATION_MESSAGES.MARK_READ_SUCCESS);
      return;
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    const item = MapNotificationToItem(updatedNotification);
    SendSuccess(res, item, NOTIFICATION_MESSAGES.MARK_READ_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `PATCH /notifications/read-all`: marks all unread notifications for the user as read.
 *
 * @param req - Express request with authenticated account.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function MarkAllNotificationsRead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, NOTIFICATION_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    await prisma.notification.updateMany({
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    SendSuccess(res, null, NOTIFICATION_MESSAGES.MARK_ALL_READ_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `DELETE /notifications/:id`: soft-deletes a notification for the authenticated user.
 *
 * @param req - Express request with notification id param.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function DeleteNotification(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, NOTIFICATION_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    const paramValidation = NotificationIdParamSchema.safeParse(req.params);

    if (!paramValidation.success) {
      SendError(res, paramValidation.error.issues[0]?.message ?? 'ID notifikasi tidak valid.', 400);
      return;
    }

    const { id } = paramValidation.data;

    // Fast-fail combined existence and tenant ownership check
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id,
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    });

    if (!existingNotification) {
      SendError(res, NOTIFICATION_MESSAGES.NOT_FOUND, 404);
      return;
    }

    await prisma.notification.update({
      where: { id },
      data: {
        status: Status.DELETED,
      },
    });

    SendSuccess(res, null, NOTIFICATION_MESSAGES.DELETE_SUCCESS);
  } catch (err) {
    next(err);
  }
}
