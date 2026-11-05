/**
 * Email message options accepted by the email service.
 */
export interface SendEmailOptions {
  /** Recipient email address */
  to: string;
  /** Subject line */
  subject: string;
  /** Clean HTML body string */
  html: string;
  /** Plain text fallback */
  text?: string;
}

/**
 * Result structure returned after attempting to send an email.
 */
export interface EmailSendResult {
  /** Whether the email was accepted for delivery */
  success: boolean;
  /** Optional message ID from the provider */
  messageId?: string;
  /** Optional error description if sending failed */
  error?: string;
}

/**
 * Parameter payload for verification OTP email template.
 */
export interface VerificationEmailTemplateParams {
  /** 6-digit numeric OTP code */
  otpCode: string;
  /** Optional direct verification URL */
  verificationUrl?: string;
}

/**
 * Parameter payload for password reset email template.
 */
export interface PasswordResetEmailTemplateParams {
  /** Single-use reset URL containing secret token */
  resetUrl: string;
}

/**
 * Parameter payload for transactional notification email template.
 */
export interface NotificationEmailTemplateParams {
  /** Notification headline/title */
  title: string;
  /** Main message content */
  message: string;
  /** Optional target action URL */
  actionUrl?: string;
  /** Optional CTA button label */
  actionLabel?: string;
  /** Optional highlight note (e.g. revision feedback or rejection reason) */
  note?: string;
  /** Optional label for the highlight note (e.g. "Catatan Revisi") */
  noteLabel?: string;
}
