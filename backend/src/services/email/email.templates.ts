import type {
  NotificationEmailTemplateParams,
  PasswordResetEmailTemplateParams,
  VerificationEmailTemplateParams,
} from './email.types.js';

/**
 * Builds a clean, minimalist HTML email template for 6-digit OTP email verification.
 * Follows the Klipday design system with zero generic AI symbols or decorative spam.
 *
 * @param params - OTP code and optional instant verification URL.
 * @returns Fully formatted, responsive HTML email string.
 */
export function BuildVerificationOtpEmailHtml(
  params: VerificationEmailTemplateParams,
): string {
  const directLinkRow = params.verificationUrl
    ? `<tr>
        <td style="padding-bottom: 20px; font-size: 13px; line-height: 20px; color: #71717a; text-align: center;">
          Atau tekan tombol di bawah ini untuk verifikasi langsung tanpa memasukkan kode secara manual.
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <a href="${params.verificationUrl}" style="display: inline-block; width: 100%; box-sizing: border-box; text-align: center; background-color: #f43f5e; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px;">
            Verifikasi Email Sekarang
          </a>
        </td>
      </tr>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifikasi Alamat Email Klipday</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #09090b;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden; padding: 32px 28px;">
    <tr>
      <td style="padding-bottom: 24px;">
        <span style="font-size: 22px; font-weight: 700; letter-spacing: -0.5px; color: #09090b;">
          Klipday<span style="color: #f43f5e;">.</span>
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding-bottom: 12px;">
        <h1 style="margin: 0; font-size: 18px; font-weight: 600; color: #09090b; letter-spacing: -0.3px;">
          Verifikasi Alamat Email Anda
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding-bottom: 20px; font-size: 14px; line-height: 22px; color: #52525b;">
        Terima kasih telah bergabung di Klipday. Gunakan kode verifikasi di bawah ini untuk mengaktifkan akun Anda.
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-bottom: 20px;">
        <div style="display: inline-block; background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px; padding: 14px 28px; font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #09090b;">
          ${params.otpCode}
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding-bottom: 20px; font-size: 13px; line-height: 20px; color: #71717a; text-align: center;">
        Kode verifikasi ini berlaku selama 15 menit. Jangan bagikan kode ini kepada siapa pun.
      </td>
    </tr>
    ${directLinkRow}
    <tr>
      <td style="border-top: 1px solid #f4f4f5; padding-top: 20px; font-size: 12px; color: #a1a1aa; text-align: center;">
        Klipday Indonesia &bull; Marketplace Clipping Video Pendek
      </td>
    </tr>
  </table>
</body>
</html>`;

  return html;
}

/**
 * Builds a plain-text fallback for 6-digit OTP email verification.
 *
 * @param params - OTP code and optional verification URL.
 * @returns Plain-text message string.
 */
export function BuildVerificationOtpEmailText(
  params: VerificationEmailTemplateParams,
): string {
  const directLinkSection = params.verificationUrl
    ? `\nAtau buka tautan berikut untuk verifikasi langsung:\n${params.verificationUrl}\n`
    : '';

  const text = `Klipday.

Verifikasi Alamat Email Anda

Terima kasih telah bergabung di Klipday. Masukkan kode berikut untuk mengaktifkan akun Anda:

${params.otpCode}

Kode verifikasi berlaku selama 15 menit.${directLinkSection}
Klipday Indonesia`;

  return text;
}

/**
 * Builds a clean, minimalist HTML email template for password reset.
 *
 * @param params - Password reset URL containing secret token.
 * @returns Fully formatted, responsive HTML email string.
 */
export function BuildPasswordResetEmailHtml(
  params: PasswordResetEmailTemplateParams,
): string {
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Atur Ulang Kata Sandi Akun Klipday</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #09090b;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden; padding: 32px 28px;">
    <tr>
      <td style="padding-bottom: 24px;">
        <span style="font-size: 22px; font-weight: 700; letter-spacing: -0.5px; color: #09090b;">
          Klipday<span style="color: #f43f5e;">.</span>
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding-bottom: 12px;">
        <h1 style="margin: 0; font-size: 18px; font-weight: 600; color: #09090b; letter-spacing: -0.3px;">
          Atur Ulang Kata Sandi Akun
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding-bottom: 24px; font-size: 14px; line-height: 22px; color: #52525b;">
        Kami menerima permintaan untuk mengatur ulang kata sandi akun Klipday Anda. Klik tombol di bawah ini untuk membuat kata sandi baru.
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-bottom: 24px;">
        <a href="${params.resetUrl}" style="display: inline-block; width: 100%; box-sizing: border-box; text-align: center; background-color: #f43f5e; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px;">
          Atur Ulang Kata Sandi
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding-bottom: 24px; font-size: 13px; line-height: 20px; color: #71717a;">
        Tautan ini hanya berlaku selama 1 jam. Jika Anda tidak pernah meminta pengaturan ulang kata sandi, abaikan pesan ini dengan aman.
      </td>
    </tr>
    <tr>
      <td style="border-top: 1px solid #f4f4f5; padding-top: 20px; font-size: 12px; color: #a1a1aa; text-align: center;">
        Klipday Indonesia &bull; Marketplace Clipping Video Pendek
      </td>
    </tr>
  </table>
</body>
</html>`;

  return html;
}

/**
 * Builds a plain-text fallback for password reset.
 *
 * @param params - Password reset URL containing secret token.
 * @returns Plain-text message string.
 */
export function BuildPasswordResetEmailText(
  params: PasswordResetEmailTemplateParams,
): string {
  const text = `Klipday.

Atur Ulang Kata Sandi Akun

Kami menerima permintaan untuk mengatur ulang kata sandi akun Klipday Anda. Buka tautan berikut untuk membuat kata sandi baru:

${params.resetUrl}

Tautan berlaku selama 1 jam. Jika Anda tidak pernah meminta pengaturan ulang kata sandi, abaikan pesan ini.

Klipday Indonesia`;

  return text;
}

/**
 * Builds a clean, minimalist HTML email template for transactional notifications.
 *
 * @param params - Notification details including title, message, optional note, and CTA link.
 * @returns Fully formatted responsive HTML email string.
 */
export function BuildNotificationEmailHtml(
  params: NotificationEmailTemplateParams,
): string {
  const noteSection = params.note
    ? `<tr>
        <td style="padding-bottom: 24px;">
          <div style="background-color: #fdf2f4; border-left: 4px solid #f43f5e; border-radius: 6px; padding: 14px 16px;">
            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #e11d48; margin-bottom: 6px;">
              ${params.noteLabel ?? 'Catatan'}
            </div>
            <div style="font-size: 14px; line-height: 20px; color: #3f3f46;">
              ${params.note}
            </div>
          </div>
        </td>
      </tr>`
    : '';

  const ctaButton = params.actionUrl
    ? `<tr>
        <td align="center" style="padding-bottom: 24px;">
          <a href="${params.actionUrl}" style="display: inline-block; width: 100%; box-sizing: border-box; text-align: center; background-color: #f43f5e; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px;">
            ${params.actionLabel ?? 'Lihat Detail di Klipday'}
          </a>
        </td>
      </tr>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.title}</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #09090b;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden; padding: 32px 28px;">
    <tr>
      <td style="padding-bottom: 24px;">
        <span style="font-size: 22px; font-weight: 700; letter-spacing: -0.5px; color: #09090b;">
          Klipday<span style="color: #f43f5e;">.</span>
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding-bottom: 12px;">
        <h1 style="margin: 0; font-size: 18px; font-weight: 600; color: #09090b; letter-spacing: -0.3px;">
          ${params.title}
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding-bottom: 24px; font-size: 14px; line-height: 22px; color: #52525b;">
        ${params.message}
      </td>
    </tr>
    ${noteSection}
    ${ctaButton}
    <tr>
      <td style="border-top: 1px solid #f4f4f5; padding-top: 20px; font-size: 12px; color: #a1a1aa; text-align: center;">
        Klipday Indonesia &bull; Marketplace Clipping Video Pendek
      </td>
    </tr>
  </table>
</body>
</html>`;

  return html;
}

/**
 * Builds a plain-text fallback for transactional notifications.
 *
 * @param params - Notification details.
 * @returns Plain-text message string.
 */
export function BuildNotificationEmailText(
  params: NotificationEmailTemplateParams,
): string {
  const noteSection = params.note
    ? `\n\n[${params.noteLabel ?? 'Catatan'}]\n${params.note}`
    : '';

  const ctaSection = params.actionUrl
    ? `\n\nBuka tautan berikut:\n${params.actionUrl}`
    : '';

  const text = `Klipday.

${params.title}

${params.message}${noteSection}${ctaSection}

Klipday Indonesia`;

  return text;
}
