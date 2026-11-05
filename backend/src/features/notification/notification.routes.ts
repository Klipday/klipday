import { Router } from 'express';
import { RequireAuth } from '../../middleware/auth.middleware.js';
import {
  DeleteNotification,
  GetNotifications,
  GetUnreadCount,
  MarkAllNotificationsRead,
  MarkNotificationRead,
} from './notification.handlers.js';

export const notificationRouter = Router();

// All notification operations require authentication
notificationRouter.use(RequireAuth);

notificationRouter.get('/', GetNotifications);
notificationRouter.get('/unread-count', GetUnreadCount);
notificationRouter.patch('/read-all', MarkAllNotificationsRead);
notificationRouter.patch('/:id/read', MarkNotificationRead);
notificationRouter.delete('/:id', DeleteNotification);
