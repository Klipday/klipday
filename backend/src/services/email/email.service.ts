import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { Resend } from 'resend';
import {
  BuildPasswordResetEmailHtml,
  BuildPasswordResetEmailText,
  BuildVerificationOtpEmailHtml,
  BuildVerificationOtpEmailText,
} from './email.templates.js';
import type {
  EmailSendResult,
  PasswordResetEmailTemplateParams,
  SendEmailOptions,
  VerificationEmailTemplateParams,
} from './email.types.js';

let cachedSmtpTransporter: Transporter | null = null;
let cachedResendClient: Resend | null = null;

/**
 * Returns a cached Nodemailer SMTP transporter instance, initializing it lazily from environment variables.
 *
 * @returns Configured SMTP transporter.
 */
function GetSmtpTransporter(): Transporter {
  if (cachedSmtpTransporter) {
    return cachedSmtpTransporter;
  }

  const host = process.env.SMTP_HOST ?? 'localhost';
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const auth = user && pass ? { user, pass } : undefined;

  cachedSmtpTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth,
  });

  return cachedSmtpTransporter;
}

/**
 * Returns a cached Resend SDK client instance, initializing it lazily from `RESEND_API_KEY`.
 *
 * @returns Configured Resend client instance.
 */
function GetResendClient(): Resend {
  if (cachedResendClient) {
    return cachedResendClient;
  }

  const apiKey = process.env.RESEND_API_KEY ?? '';
  cachedResendClient = new Resend(apiKey);
  return cachedResendClient;
}

/**
 * Resolves the active email provider based on configuration and environment variables.
 *
 * @returns One of `'resend'`, `'smtp'`, or `'console'`.
 */
function ResolveActiveEmailProvider(): 'resend' | 'smtp' | 'console' {
  const configuredProvider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();

  if (process.env.NODE_ENV === 'test') {
    return 'console';
  }

  if (configuredProvider === 'resend' && process.env.RESEND_API_KEY) {
    return 'resend';
  }

  if (configuredProvider === 'smtp' || process.env.SMTP_HOST) {
    return 'smtp';
  }

  if (process.env.RESEND_API_KEY) {
    return 'resend';
  }

  return 'console';
}

/**
 * Sends a transactional email using the resolved provider (Resend, SMTP, or Console logging).
 *
 * @param options - Recipient address, subject line, HTML body, and optional plain-text body.
 * @returns Result object containing success flag and message ID or error details.
 */
export async function SendEmail(options: SendEmailOptions): Promise<EmailSendResult> {
  const provider = ResolveActiveEmailProvider();
  const from = process.env.EMAIL_FROM ?? 'Klipday <no-reply@klipday.com>';

  if (provider === 'console') {
    // Zero-config developer fallback: print cleanly to terminal
    console.log(
      `[EmailService:console] To: ${options.to} | Subject: "${options.subject}"`,
    );
    return {
      success: true,
      messageId: `mock-console-${Date.now()}`,
    };
  }

  if (provider === 'resend') {
    try {
      const resend = GetResendClient();
      const response = await resend.emails.send({
        from,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (response.error) {
        return {
          success: false,
          error: response.error.message,
        };
      }

      return {
        success: true,
        messageId: response.data?.id,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Resend error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // SMTP provider (Gmail App Password, Brevo SMTP, etc.)
  try {
    const transporter = GetSmtpTransporter();
    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'SMTP delivery error';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Sends a 6-digit OTP verification email to the user.
 *
 * @param to - Recipient email address.
 * @param params - OTP code and optional instant verification URL.
 * @returns Result of email dispatch.
 */
export async function SendVerificationOtpEmail(
  to: string,
  params: VerificationEmailTemplateParams,
): Promise<EmailSendResult> {
  const subject = `${params.otpCode} adalah kode verifikasi akun Klipday Anda`;
  const html = BuildVerificationOtpEmailHtml(params);
  const text = BuildVerificationOtpEmailText(params);

  const result = await SendEmail({
    to,
    subject,
    html,
    text,
  });

  return result;
}

/**
 * Sends a password reset email containing a secure 1-hour reset link.
 *
 * @param to - Recipient email address.
 * @param params - Reset URL containing the secret token.
 * @returns Result of email dispatch.
 */
export async function SendPasswordResetEmail(
  to: string,
  params: PasswordResetEmailTemplateParams,
): Promise<EmailSendResult> {
  const subject = 'Atur Ulang Kata Sandi Akun Klipday';
  const html = BuildPasswordResetEmailHtml(params);
  const text = BuildPasswordResetEmailText(params);

  const result = await SendEmail({
    to,
    subject,
    html,
    text,
  });

  return result;
}
