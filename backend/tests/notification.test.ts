import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NOTIFICATION_MESSAGES } from '../src/features/notification/notification.constants.js';
import {
  DeleteNotification,
  GetNotifications,
  GetUnreadCount,
  MarkAllNotificationsRead,
  MarkNotificationRead,
} from '../src/features/notification/notification.handlers.js';
import {
  DispatchNotification,
  NotifyAdminPendingItem,
  NotifyCampaignApproved,
  NotifyCampaignRejected,
  NotifyCampaignRevision,
  NotifyKycApproved,
  NotifyKycRejected,
  NotifySettlementFinalizedForBrand,
  NotifySettlementFinalizedForCreator,
  NotifySubmissionApproved,
  NotifySubmissionReceived,
  NotifySubmissionRejected,
  NotifySubmissionRevision,
  NotifyTopUpApproved,
  NotifyTopUpRejected,
  NotifyWithdrawalApproved,
  NotifyWithdrawalRejected,
  ResolveDefaultCategory,
} from '../src/services/notification/notification.dispatcher.js';
import {
  NotificationCategory,
  NotificationType,
  Role,
  Status,
} from '../src/generated/prisma/enums.js';
import { prisma } from '../src/utils/prisma.js';
import {
  CreateMockNext,
  CreateMockRequest,
  CreateMockResponse,
} from './helpers/mock-express.js';

describe('Notification Feature & Dispatcher', () => {
  const mockAccountId = '00000000-0000-0000-0000-000000000001';
  const mockNotificationId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Handlers', () => {
    describe('GetNotifications', () => {
      it('returns 401 when request is not authenticated', async () => {
        const req = CreateMockRequest({ account: undefined });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        await GetNotifications(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: NOTIFICATION_MESSAGES.AUTH_REQUIRED,
        });
      });

      it('returns 400 when query contains invalid category', async () => {
        const req = CreateMockRequest({
          account: { sub: mockAccountId, role: Role.CREATOR },
          query: { category: 'INVALID_CATEGORY' },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        await GetNotifications(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
      });

      it('returns paginated list with unreadCount and totalPages', async () => {
        const req = CreateMockRequest({
          account: { sub: mockAccountId, role: Role.CREATOR },
          query: { page: '1', limit: '10' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        const mockItems = [
          {
            id: mockNotificationId,
            accountId: mockAccountId,
            type: NotificationType.SUBMISSION_APPROVED,
            category: NotificationCategory.SUBMISSION,
            title: 'Clip Disetujui',
            message: 'Video Anda disetujui',
            actionUrl: '/creator-dashboard/submissions',
            isRead: false,
            readAt: null,
            metadata: { submissionId: 'sub-1' },
            status: Status.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        jest.spyOn(prisma.notification, 'findMany').mockResolvedValue(mockItems as never);
        jest
          .spyOn(prisma.notification, 'count')
          .mockResolvedValueOnce(1 as never) // totalCount
          .mockResolvedValueOnce(1 as never); // unreadCount

        await GetNotifications(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: {
            notifications: [
              expect.objectContaining({
                id: mockNotificationId,
                title: 'Clip Disetujui',
                isRead: false,
              }),
            ],
            unreadCount: 1,
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
          message: NOTIFICATION_MESSAGES.FETCH_SUCCESS,
        });
      });
    });

    describe('GetUnreadCount', () => {
      it('returns 401 when unauthenticated', async () => {
        const req = CreateMockRequest({ account: undefined });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        await GetUnreadCount(req, res, next);
        expect(statusMock).toHaveBeenCalledWith(401);
      });

      it('returns unread notification count successfully', async () => {
        const req = CreateMockRequest({
          account: { sub: mockAccountId, role: Role.BRAND },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.notification, 'count').mockResolvedValue(5 as never);

        await GetUnreadCount(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: { unreadCount: 5 },
          message: NOTIFICATION_MESSAGES.UNREAD_COUNT_SUCCESS,
        });
      });
    });

    describe('MarkNotificationRead', () => {
      it('returns 404 when notification does not exist or belongs to another user', async () => {
        const req = CreateMockRequest({
          account: { sub: mockAccountId, role: Role.CREATOR },
          params: { id: mockNotificationId },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.notification, 'findFirst').mockResolvedValue(null as never);

        await MarkNotificationRead(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: NOTIFICATION_MESSAGES.NOT_FOUND,
        });
      });

      it('marks notification as read successfully', async () => {
        const req = CreateMockRequest({
          account: { sub: mockAccountId, role: Role.CREATOR },
          params: { id: mockNotificationId },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        const existing = {
          id: mockNotificationId,
          accountId: mockAccountId,
          status: Status.ACTIVE,
        };

        const updated = {
          id: mockNotificationId,
          accountId: mockAccountId,
          type: NotificationType.SUBMISSION_APPROVED,
          category: NotificationCategory.SUBMISSION,
          title: 'Clip Disetujui',
          message: 'Video Anda disetujui',
          actionUrl: null,
          isRead: true,
          readAt: new Date(),
          metadata: null,
          status: Status.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        jest.spyOn(prisma.notification, 'findFirst').mockResolvedValue(existing as never);
        jest.spyOn(prisma.notification, 'update').mockResolvedValue(updated as never);

        await MarkNotificationRead(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'success',
            data: expect.objectContaining({ id: mockNotificationId, isRead: true }),
            message: NOTIFICATION_MESSAGES.MARK_READ_SUCCESS,
          }),
        );
      });

      it('returns notification directly without updating database when already marked as read', async () => {
        const req = CreateMockRequest({
          account: { sub: mockAccountId, role: Role.CREATOR },
          params: { id: mockNotificationId },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        const existingRead = {
          id: mockNotificationId,
          accountId: mockAccountId,
          type: NotificationType.SUBMISSION_APPROVED,
          category: NotificationCategory.SUBMISSION,
          title: 'Clip Disetujui',
          message: 'Video Anda disetujui',
          actionUrl: null,
          isRead: true,
          readAt: new Date('2026-01-01T00:00:00Z'),
          metadata: null,
          status: Status.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        jest.spyOn(prisma.notification, 'findFirst').mockResolvedValue(existingRead as never);
        const updateSpy = jest.spyOn(prisma.notification, 'update');

        await MarkNotificationRead(req, res, next);

        expect(updateSpy).not.toHaveBeenCalled();
        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'success',
            data: expect.objectContaining({ id: mockNotificationId, isRead: true }),
            message: NOTIFICATION_MESSAGES.MARK_READ_SUCCESS,
          }),
        );
      });
    });

    describe('MarkAllNotificationsRead', () => {
      it('marks all active notifications as read', async () => {
        const req = CreateMockRequest({
          account: { sub: mockAccountId, role: Role.BRAND },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.notification, 'updateMany').mockResolvedValue({ count: 3 } as never);

        await MarkAllNotificationsRead(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: null,
          message: NOTIFICATION_MESSAGES.MARK_ALL_READ_SUCCESS,
        });
      });
    });

    describe('DeleteNotification', () => {
      it('returns 404 for non-existent notification', async () => {
        const req = CreateMockRequest({
          account: { sub: mockAccountId, role: Role.BRAND },
          params: { id: mockNotificationId },
        });
        const { res, statusMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.notification, 'findFirst').mockResolvedValue(null as never);

        await DeleteNotification(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(404);
      });

      it('soft-deletes notification successfully', async () => {
        const req = CreateMockRequest({
          account: { sub: mockAccountId, role: Role.BRAND },
          params: { id: mockNotificationId },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.notification, 'findFirst').mockResolvedValue({ id: mockNotificationId } as never);
        jest.spyOn(prisma.notification, 'update').mockResolvedValue({ id: mockNotificationId } as never);

        await DeleteNotification(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: null,
          message: NOTIFICATION_MESSAGES.DELETE_SUCCESS,
        });
      });
    });
  });

  describe('Dispatcher & Helpers', () => {
    it('infers correct default categories for all event types', () => {
      expect(ResolveDefaultCategory(NotificationType.SUBMISSION_APPROVED)).toBe(NotificationCategory.SUBMISSION);
      expect(ResolveDefaultCategory(NotificationType.SUBMISSION_RECEIVED)).toBe(NotificationCategory.SUBMISSION);
      expect(ResolveDefaultCategory(NotificationType.CAMPAIGN_APPROVED)).toBe(NotificationCategory.CAMPAIGN);
      expect(ResolveDefaultCategory(NotificationType.ADMIN_NEW_CAMPAIGN)).toBe(NotificationCategory.CAMPAIGN);
      expect(ResolveDefaultCategory(NotificationType.TOPUP_APPROVED)).toBe(NotificationCategory.FINANCE);
      expect(ResolveDefaultCategory(NotificationType.WITHDRAWAL_APPROVED)).toBe(NotificationCategory.FINANCE);
      expect(ResolveDefaultCategory(NotificationType.KYC_VERIFIED)).toBe(NotificationCategory.ACCOUNT);
      expect(ResolveDefaultCategory(NotificationType.ADMIN_NEW_KYC)).toBe(NotificationCategory.ACCOUNT);
      expect(ResolveDefaultCategory(NotificationType.SYSTEM_ANNOUNCEMENT)).toBe(NotificationCategory.SYSTEM);
    });

    it('creates notification and sends email when sendEmail is true', async () => {
      jest.spyOn(prisma.notification, 'create').mockResolvedValue({
        id: mockNotificationId,
        accountId: mockAccountId,
      } as never);

      jest.spyOn(prisma.account, 'findUnique').mockResolvedValue({
        id: mockAccountId,
        email: 'user@example.com',
        status: Status.ACTIVE,
      } as never);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const notificationId = await DispatchNotification({
        recipientAccountId: mockAccountId,
        type: NotificationType.SUBMISSION_APPROVED,
        title: 'Video Disetujui',
        message: 'Klip Anda disetujui',
        actionUrl: '/creator-dashboard/submissions',
        sendEmail: true,
      });

      expect(notificationId).toBe(mockNotificationId);
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            accountId: mockAccountId,
            type: NotificationType.SUBMISSION_APPROVED,
            category: NotificationCategory.SUBMISSION,
          }),
        }),
      );

      // Allow background microtask to resolve
      await new Promise((r) => setTimeout(r, 50));
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('user@example.com'),
      );
      consoleSpy.mockRestore();
    });

    it('safely handles errors without throwing', async () => {
      jest.spyOn(prisma.notification, 'create').mockRejectedValue(new Error('DB failure') as never);

      const notificationId = await DispatchNotification({
        recipientAccountId: mockAccountId,
        type: NotificationType.SUBMISSION_APPROVED,
        title: 'Video Disetujui',
        message: 'Klip Anda disetujui',
      });

      expect(notificationId).toBe('mock-notification-id');
    });

    it('dispatches domain helper events correctly', async () => {
      const createSpy = jest.spyOn(prisma.notification, 'create').mockResolvedValue({
        id: mockNotificationId,
      } as never);

      await NotifySubmissionReceived({
        brandAccountId: mockAccountId,
        campaignTitle: 'Klip Kampanye',
        creatorUsername: 'clipper99',
        submissionId: 'sub-1',
        campaignId: 'camp-1',
      });

      await NotifySubmissionApproved({
        creatorAccountId: mockAccountId,
        campaignTitle: 'Klip Kampanye',
        submissionId: 'sub-1',
      });

      await NotifySubmissionRevision({
        creatorAccountId: mockAccountId,
        campaignTitle: 'Klip Kampanye',
        submissionId: 'sub-1',
        campaignId: 'camp-1',
        reviewNote: 'Perbaiki thumbnail',
      });

      await NotifySubmissionRejected({
        creatorAccountId: mockAccountId,
        campaignTitle: 'Klip Kampanye',
        submissionId: 'sub-1',
        rejectionReason: 'Format salah',
      });

      await NotifyCampaignApproved({
        brandAccountId: mockAccountId,
        campaignTitle: 'Klip Kampanye',
        campaignId: 'camp-1',
      });

      await NotifyCampaignRevision({
        brandAccountId: mockAccountId,
        campaignTitle: 'Klip Kampanye',
        campaignId: 'camp-1',
        adminNote: 'Sesuaikan deskripsi',
      });

      await NotifyCampaignRejected({
        brandAccountId: mockAccountId,
        campaignTitle: 'Klip Kampanye',
        campaignId: 'camp-1',
        rejectionReason: 'Produk terlarang',
      });

      await NotifyTopUpApproved({
        brandAccountId: mockAccountId,
        amount: 500000,
      });

      await NotifyTopUpRejected({
        brandAccountId: mockAccountId,
        amount: 500000,
        rejectionReason: 'Bukti transfer buram',
      });

      await NotifyWithdrawalApproved({
        creatorAccountId: mockAccountId,
        amount: 250000,
        bankName: 'BCA',
      });

      await NotifyWithdrawalRejected({
        creatorAccountId: mockAccountId,
        amount: 250000,
        rejectionReason: 'Nama rekening berbeda',
      });

      await NotifyKycApproved({ creatorAccountId: mockAccountId });
      await NotifyKycRejected({ creatorAccountId: mockAccountId, rejectionReason: 'Foto KTP blur' });

      await NotifySettlementFinalizedForBrand({
        brandAccountId: mockAccountId,
        campaignTitle: 'Klip Kampanye',
        campaignId: 'camp-1',
        refundAmount: 50000,
      });

      await NotifySettlementFinalizedForCreator({
        creatorAccountId: mockAccountId,
        campaignTitle: 'Klip Kampanye',
        campaignId: 'camp-1',
        submissionId: 'sub-1',
        rewardAmount: 150000,
      });

      expect(createSpy).toHaveBeenCalledTimes(15);
    });

    it('broadcasts to all active admins on NotifyAdminPendingItem', async () => {
      jest.spyOn(prisma.account, 'findMany').mockResolvedValue([
        { id: 'admin-1' },
        { id: 'admin-2' },
      ] as never);

      const createSpy = jest.spyOn(prisma.notification, 'create').mockResolvedValue({
        id: mockNotificationId,
      } as never);

      await NotifyAdminPendingItem({
        type: NotificationType.ADMIN_NEW_CAMPAIGN,
        title: 'Kampanye Baru',
        message: 'Menunggu review',
        actionUrl: '/admin-dashboard/campaigns',
      });

      expect(createSpy).toHaveBeenCalledTimes(2);
    });
  });
});
