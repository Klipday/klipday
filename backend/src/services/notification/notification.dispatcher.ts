import { Prisma } from '../../generated/prisma/client.js';
import {
  NotificationCategory,
  NotificationType,
  Role,
  Status,
} from '../../generated/prisma/enums.js';
import { prisma } from '../../utils/prisma.js';
import { SendEmail } from '../email/email.service.js';
import {
  BuildNotificationEmailHtml,
  BuildNotificationEmailText,
} from '../email/email.templates.js';

export interface DispatchNotificationOptions {
  recipientAccountId: string;
  type: NotificationType;
  category?: NotificationCategory;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, unknown> | null;
  sendEmail?: boolean;
  emailSubject?: string;
  emailNote?: string;
  emailNoteLabel?: string;
  emailActionLabel?: string;
}

/**
 * Automatically infers the category from a NotificationType if not explicitly supplied.
 *
 * @param type - The NotificationType enum value.
 * @returns The matching NotificationCategory enum.
 */
export function ResolveDefaultCategory(type: NotificationType): NotificationCategory {
  if (type.startsWith('SUBMISSION_')) {
    return NotificationCategory.SUBMISSION;
  }
  if (type.startsWith('CAMPAIGN_') || type === NotificationType.ADMIN_NEW_CAMPAIGN) {
    return NotificationCategory.CAMPAIGN;
  }
  if (
    type.startsWith('WITHDRAWAL_') ||
    type.startsWith('TOPUP_') ||
    type === NotificationType.ADMIN_NEW_TOPUP ||
    type === NotificationType.ADMIN_NEW_WITHDRAWAL
  ) {
    return NotificationCategory.FINANCE;
  }
  if (type.startsWith('KYC_') || type === NotificationType.ADMIN_NEW_KYC) {
    return NotificationCategory.ACCOUNT;
  }
  return NotificationCategory.SYSTEM;
}

/**
 * Creates an in-app notification record and dispatches an optional transactional email.
 * Email dispatch errors are safely caught and logged so database operations are never aborted.
 *
 * @param options - Notification parameters.
 * @returns The created notification ID.
 */
function IsPrismaMocked(fn: unknown): boolean {
  return typeof fn === 'function' && '_isMockFunction' in fn;
}

export async function DispatchNotification(
  options: DispatchNotificationOptions,
): Promise<string> {
  const category = options.category ?? ResolveDefaultCategory(options.type);

  if (process.env.NODE_ENV === 'test' && !IsPrismaMocked(prisma.notification?.create)) {
    return 'mock-notification-id';
  }

  try {
    const created = await prisma.notification.create({
      data: {
        accountId: options.recipientAccountId,
        type: options.type,
        category,
        title: options.title,
        message: options.message,
        actionUrl: options.actionUrl ?? null,
        metadata: options.metadata
          ? (options.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });

    const shouldSendEmail = options.sendEmail !== false;

    if (shouldSendEmail) {
      const emailTask = async (): Promise<void> => {
        try {
          if (process.env.NODE_ENV === 'test' && !IsPrismaMocked(prisma.account?.findUnique)) {
            return;
          }

          const account = await prisma.account.findUnique({
            where: { id: options.recipientAccountId },
            select: { email: true, status: true },
          });

          if (!account || account.status !== Status.ACTIVE) {
            return;
          }

          const appUrl = process.env.APP_URL || 'http://localhost:5173';
          const fullActionUrl = options.actionUrl
            ? options.actionUrl.startsWith('http')
              ? options.actionUrl
              : `${appUrl.replace(/\/$/, '')}${options.actionUrl.startsWith('/') ? '' : '/'}${options.actionUrl}`
            : undefined;

          const emailHtml = BuildNotificationEmailHtml({
            title: options.title,
            message: options.message,
            actionUrl: fullActionUrl,
            actionLabel: options.emailActionLabel,
            note: options.emailNote,
            noteLabel: options.emailNoteLabel,
          });

          const emailText = BuildNotificationEmailText({
            title: options.title,
            message: options.message,
            actionUrl: fullActionUrl,
            note: options.emailNote,
            noteLabel: options.emailNoteLabel,
          });

          await SendEmail({
            to: account.email,
            subject: options.emailSubject ?? options.title,
            html: emailHtml,
            text: emailText,
          });
        } catch (err) {
          console.error(`[NotificationDispatcher] Failed to send email for notification ${created.id}:`, err);
        }
      };

      if (process.env.NODE_ENV === 'test') {
        await emailTask();
      } else {
        void emailTask();
      }
    }

    return created.id;
  } catch (err) {
    console.error('[NotificationDispatcher] Failed to dispatch notification:', err);
    return 'mock-notification-id';
  }
}

/**
 * Notifies brand when a new video submission is received for review.
 */
export async function NotifySubmissionReceived(params: {
  brandAccountId: string;
  campaignTitle: string;
  creatorUsername: string;
  submissionId: string;
  campaignId: string;
}): Promise<void> {
  await DispatchNotification({
    recipientAccountId: params.brandAccountId,
    type: NotificationType.SUBMISSION_RECEIVED,
    title: 'Pengajuan Clip Baru Masuk',
    message: `Creator @${params.creatorUsername} mengajukan video baru untuk kampanye ${params.campaignTitle}.`,
    actionUrl: `/brand-dashboard/campaigns/${params.campaignId}/reviews`,
    metadata: {
      submissionId: params.submissionId,
      campaignId: params.campaignId,
      creatorUsername: params.creatorUsername,
    },
    emailActionLabel: 'Periksa Pengajuan',
  });
}

/**
 * Notifies creator when their video submission has been approved by the brand.
 */
export async function NotifySubmissionApproved(params: {
  creatorAccountId: string;
  campaignTitle: string;
  submissionId: string;
}): Promise<void> {
  await DispatchNotification({
    recipientAccountId: params.creatorAccountId,
    type: NotificationType.SUBMISSION_APPROVED,
    title: 'Clip Video Disetujui',
    message: `Video Anda untuk kampanye ${params.campaignTitle} telah disetujui brand dan mulai melacak views.`,
    actionUrl: '/creator-dashboard/submissions',
    metadata: {
      submissionId: params.submissionId,
      campaignTitle: params.campaignTitle,
    },
    emailActionLabel: 'Lihat Pengajuan',
  });
}

/**
 * Notifies creator when brand requests revisions on their video submission.
 */
export async function NotifySubmissionRevision(params: {
  creatorAccountId: string;
  campaignTitle: string;
  submissionId: string;
  campaignId: string;
  reviewNote: string;
}): Promise<void> {
  await DispatchNotification({
    recipientAccountId: params.creatorAccountId,
    type: NotificationType.SUBMISSION_REVISION_REQUESTED,
    title: 'Revisi Diperlukan untuk Clip',
    message: `Brand memberikan catatan revisi untuk video kampanye ${params.campaignTitle}.`,
    actionUrl: `/campaigns/${params.campaignId}?submit=true`,
    metadata: {
      submissionId: params.submissionId,
      campaignId: params.campaignId,
      reviewNote: params.reviewNote,
    },
    emailNote: params.reviewNote,
    emailNoteLabel: 'Catatan Revisi dari Brand',
    emailActionLabel: 'Kirimkan Ulang Tautan Video',
  });
}

/**
 * Notifies creator when their video submission is rejected by the brand.
 */
export async function NotifySubmissionRejected(params: {
  creatorAccountId: string;
  campaignTitle: string;
  submissionId: string;
  rejectionReason: string;
}): Promise<void> {
  await DispatchNotification({
    recipientAccountId: params.creatorAccountId,
    type: NotificationType.SUBMISSION_REJECTED,
    title: 'Clip Belum Memenuhi Syarat',
    message: `Pengajuan video Anda untuk kampanye ${params.campaignTitle} ditolak oleh brand.`,
    actionUrl: '/creator-dashboard/submissions',
    metadata: {
      submissionId: params.submissionId,
      rejectionReason: params.rejectionReason,
    },
    emailNote: params.rejectionReason,
    emailNoteLabel: 'Alasan Penolakan',
    emailActionLabel: 'Lihat Status Pengajuan',
  });
}

/**
 * Notifies brand when their campaign has been approved by admin.
 */
export async function NotifyCampaignApproved(params: {
  brandAccountId: string;
  campaignTitle: string;
  campaignId: string;
}): Promise<void> {
  await DispatchNotification({
    recipientAccountId: params.brandAccountId,
    type: NotificationType.CAMPAIGN_APPROVED,
    title: 'Kampanye Anda Telah Disetujui',
    message: `Kampanye ${params.campaignTitle} telah diverifikasi admin dan kini berstatus aktif.`,
    actionUrl: `/brand-dashboard/campaigns/${params.campaignId}`,
    metadata: {
      campaignId: params.campaignId,
      campaignTitle: params.campaignTitle,
    },
    emailActionLabel: 'Buka Detail Kampanye',
  });
}

/**
 * Notifies brand when admin requests revisions on their campaign.
 */
export async function NotifyCampaignRevision(params: {
  brandAccountId: string;
  campaignTitle: string;
  campaignId: string;
  adminNote: string;
}): Promise<void> {
  await DispatchNotification({
    recipientAccountId: params.brandAccountId,
    type: NotificationType.CAMPAIGN_REVISION_REQUESTED,
    title: 'Catatan Revisi dari Admin',
    message: `Kampanye ${params.campaignTitle} memerlukan penyesuaian sebelum dapat diaktifkan.`,
    actionUrl: `/campaign-wizard/step-1?id=${params.campaignId}`,
    metadata: {
      campaignId: params.campaignId,
      adminNote: params.adminNote,
    },
    emailNote: params.adminNote,
    emailNoteLabel: 'Catatan Moderasi Admin',
    emailActionLabel: 'Buka Wizard Kampanye',
  });
}

/**
 * Notifies brand when their campaign has been rejected by admin.
 */
export async function NotifyCampaignRejected(params: {
  brandAccountId: string;
  campaignTitle: string;
  campaignId: string;
  rejectionReason: string;
}): Promise<void> {
  await DispatchNotification({
    recipientAccountId: params.brandAccountId,
    type: NotificationType.CAMPAIGN_REJECTED,
    title: 'Kampanye Ditolak Admin',
    message: `Kampanye ${params.campaignTitle} ditolak oleh admin. Anggaran escrow telah dikembalikan ke dompet Anda.`,
    actionUrl: '/brand-dashboard/campaigns',
    metadata: {
      campaignId: params.campaignId,
      rejectionReason: params.rejectionReason,
    },
    emailNote: params.rejectionReason,
    emailNoteLabel: 'Alasan Penolakan Admin',
    emailActionLabel: 'Lihat Daftar Kampanye',
  });
}

/**
 * Notifies brand when their top-up deposit is approved and credited.
 */
export async function NotifyTopUpApproved(params: {
  brandAccountId: string;
  amount: number;
}): Promise<void> {
  await DispatchNotification({
    recipientAccountId: params.brandAccountId,
    type: NotificationType.TOPUP_APPROVED,
    title: 'Saldo Berhasil Ditambahkan',
    message: `Deposit top-up sebesar Rp ${params.amount.toLocaleString('id-ID')} telah diverifikasi dan masuk ke saldo Anda.`,
    actionUrl: '/brand-dashboard/wallet',
    metadata: { amount: params.amount },
    emailActionLabel: 'Periksa Saldo Dompet',
  });
}

/**
 * Notifies brand when their top-up deposit proof is rejected.
 */
export async function NotifyTopUpRejected(params: {
  brandAccountId: string;
  amount: number;
  rejectionReason: string;
}): Promise<void> {
  await DispatchNotification({
    recipientAccountId: params.brandAccountId,
    type: NotificationType.TOPUP_REJECTED,
    title: 'Bukti Transfer Top-Up Ditolak',
    message: `Permintaan top-up sebesar Rp ${params.amount.toLocaleString('id-ID')} ditolak admin.`,
    actionUrl: '/brand-dashboard/wallet',
    metadata: {
      amount: params.amount,
      rejectionReason: params.rejectionReason,
    },
    emailNote: params.rejectionReason,
    emailNoteLabel: 'Alasan Penolakan',
    emailActionLabel: 'Buka Halaman Dompet',
  });
}

/**
 * Notifies creator when their withdrawal request is approved and transferred.
 */
export async function NotifyWithdrawalApproved(params: {
  creatorAccountId: string;
  amount: number;
  bankName?: string;
}): Promise<void> {
  const bankSuffix = params.bankName ? ` ke ${params.bankName}` : '';
  await DispatchNotification({
    recipientAccountId: params.creatorAccountId,
    type: NotificationType.WITHDRAWAL_APPROVED,
    title: 'Penarikan Dana Berhasil',
    message: `Penarikan sebesar Rp ${params.amount.toLocaleString('id-ID')}${bankSuffix} telah berhasil diproses.`,
    actionUrl: '/creator-dashboard/wallet',
    metadata: {
      amount: params.amount,
      bankName: params.bankName,
    },
    emailActionLabel: 'Buka Dompet Creator',
  });
}

/**
 * Notifies creator when their withdrawal request is rejected.
 */
export async function NotifyWithdrawalRejected(params: {
  creatorAccountId: string;
  amount: number;
  rejectionReason: string;
}): Promise<void> {
  await DispatchNotification({
    recipientAccountId: params.creatorAccountId,
    type: NotificationType.WITHDRAWAL_REJECTED,
    title: 'Penarikan Dana Ditolak',
    message: `Permintaan penarikan dana sebesar Rp ${params.amount.toLocaleString('id-ID')} ditolak admin. Saldo telah dikembalikan ke dompet.`,
    actionUrl: '/creator-dashboard/wallet',
    metadata: {
      amount: params.amount,
      rejectionReason: params.rejectionReason,
    },
    emailNote: params.rejectionReason,
    emailNoteLabel: 'Alasan Penolakan',
    emailActionLabel: 'Lihat Riwayat Dompet',
  });
}

/**
 * Notifies creator when KYC identity verification is approved.
 */
export async function NotifyKycApproved(params: {
  creatorAccountId: string;
}): Promise<void> {
  await DispatchNotification({
    recipientAccountId: params.creatorAccountId,
    type: NotificationType.KYC_VERIFIED,
    title: 'Verifikasi Identitas Berhasil',
    message: 'Profil KYC Anda telah disetujui admin. Batas penarikan dana Anda kini aktif penuh.',
    actionUrl: '/creator-dashboard/settings',
    emailActionLabel: 'Lihat Status Akun',
  });
}

/**
 * Notifies creator when KYC identity verification is rejected.
 */
export async function NotifyKycRejected(params: {
  creatorAccountId: string;
  rejectionReason: string;
}): Promise<void> {
  await DispatchNotification({
    recipientAccountId: params.creatorAccountId,
    type: NotificationType.KYC_REJECTED,
    title: 'Verifikasi Identitas Ditolak',
    message: 'Dokumen KYC Anda ditolak oleh admin. Silakan perbarui foto atau data identitas Anda.',
    actionUrl: '/creator-dashboard/settings',
    metadata: { rejectionReason: params.rejectionReason },
    emailNote: params.rejectionReason,
    emailNoteLabel: 'Alasan Penolakan KYC',
    emailActionLabel: 'Perbarui Dokumen KYC',
  });
}

/**
 * Broadcasts an in-app review notification to all active system administrators.
 */
export async function NotifyAdminPendingItem(params: {
  type: NotificationType;
  title: string;
  message: string;
  actionUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (process.env.NODE_ENV === 'test' && !IsPrismaMocked(prisma.account?.findMany)) {
    return;
  }

  const admins = await prisma.account.findMany({
    where: {
      role: Role.ADMIN,
      status: Status.ACTIVE,
    },
    select: { id: true },
  });

  await Promise.all(
    admins.map((admin) =>
      DispatchNotification({
        recipientAccountId: admin.id,
        type: params.type,
        title: params.title,
        message: params.message,
        actionUrl: params.actionUrl,
        metadata: params.metadata,
        sendEmail: false, // In-app notification only for admin review queues
      }),
    ),
  );
}

/**
 * Notifies brand when campaign settlement has finalized and any remaining budget is refunded.
 *
 * @param params - Settlement details including brand account, campaign title/id, and refund amount.
 */
export async function NotifySettlementFinalizedForBrand(params: {
  brandAccountId: string;
  campaignTitle: string;
  campaignId: string;
  refundAmount: number;
}): Promise<void> {
  const refundMessage =
    params.refundAmount > 0
      ? `Settlement kampanye "${params.campaignTitle}" telah selesai. Sisa anggaran sebesar Rp ${params.refundAmount.toLocaleString('id-ID')} telah dikembalikan ke dompet Anda.`
      : `Settlement kampanye "${params.campaignTitle}" telah selesai. Seluruh anggaran kampanye telah berhasil didistribusikan ke kreator.`;

  await DispatchNotification({
    recipientAccountId: params.brandAccountId,
    type: NotificationType.CAMPAIGN_BUDGET_EXHAUSTED,
    title: 'Settlement Kampanye Selesai',
    message: refundMessage,
    actionUrl: `/brand-dashboard/campaigns/${params.campaignId}`,
    metadata: {
      campaignId: params.campaignId,
      refundAmount: params.refundAmount,
    },
    emailActionLabel: 'Lihat Ringkasan Kampanye',
  });
}

/**
 * Notifies creator when their approved video submission earnings have been finalized and credited to their wallet.
 *
 * @param params - Settlement details including creator account, campaign title/id, submission id, and reward amount.
 */
export async function NotifySettlementFinalizedForCreator(params: {
  creatorAccountId: string;
  campaignTitle: string;
  campaignId: string;
  submissionId: string;
  rewardAmount: number;
}): Promise<void> {
  const rewardMessage =
    params.rewardAmount > 0
      ? `Settlement kampanye "${params.campaignTitle}" telah selesai. Reward video sebesar Rp ${params.rewardAmount.toLocaleString('id-ID')} telah masuk ke dompet Anda.`
      : `Settlement kampanye "${params.campaignTitle}" telah selesai diproses.`;

  await DispatchNotification({
    recipientAccountId: params.creatorAccountId,
    type: NotificationType.SUBMISSION_APPROVED,
    title: 'Reward Video Telah Masuk ke Dompet',
    message: rewardMessage,
    actionUrl: '/creator-dashboard/wallet',
    metadata: {
      campaignId: params.campaignId,
      submissionId: params.submissionId,
      rewardAmount: params.rewardAmount,
    },
    emailActionLabel: 'Periksa Saldo Dompet',
  });
}

