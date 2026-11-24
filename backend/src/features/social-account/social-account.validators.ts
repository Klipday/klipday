import { z } from 'zod';
import { Platform } from '../../generated/prisma/enums.js';
import { SOCIAL_ACCOUNT_MESSAGES } from './social-account.constants.js';

const usernameSchema = z
  .string({ error: SOCIAL_ACCOUNT_MESSAGES.USERNAME_REQUIRED })
  .trim()
  .min(1, SOCIAL_ACCOUNT_MESSAGES.USERNAME_REQUIRED)
  .max(50, SOCIAL_ACCOUNT_MESSAGES.USERNAME_TOO_LONG)
  .regex(/^@?[a-zA-Z0-9._-]+$/, SOCIAL_ACCOUNT_MESSAGES.USERNAME_INVALID_FORMAT);

export const RequestCodeSchema = z.object({
  username: usernameSchema,
});

export const VerifyBioSchema = z.object({
  username: usernameSchema,
});

export const ValidateVideoUrlSchema = z.object({
  videoUrl: z
    .string({ error: SOCIAL_ACCOUNT_MESSAGES.VIDEO_URL_INVALID })
    .trim()
    .url(SOCIAL_ACCOUNT_MESSAGES.VIDEO_URL_INVALID)
    .refine((url) => url.includes('tiktok.com/'), SOCIAL_ACCOUNT_MESSAGES.VIDEO_URL_MUST_BE_TIKTOK),
});

/**
 * Resolves a route parameter or query string platform value to a Prisma `Platform` enum.
 *
 * @param rawPlatform - Raw platform string (e.g. 'tiktok', 'instagram', 'youtube').
 * @returns Validated Platform enum value, or null when unsupported.
 */
export function ParseSocialPlatformParam(rawPlatform?: string): Platform | null {
  if (!rawPlatform || typeof rawPlatform !== 'string') {
    return Platform.TIKTOK;
  }

  const upper = rawPlatform.trim().toUpperCase();
  if (upper === Platform.TIKTOK) return Platform.TIKTOK;
  if (upper === Platform.INSTAGRAM) return Platform.INSTAGRAM;
  if (upper === Platform.YOUTUBE) return Platform.YOUTUBE;
  return null;
}

/**
 * Builds a Zod schema validating a video URL for the specified social platform.
 * Enforces TikTok domains, Instagram Reels/post paths, or strictly YouTube Shorts (`/shorts/`).
 *
 * @param platform - Target social platform enum.
 * @returns Configured Zod schema for `{ videoUrl }`.
 */
export function BuildValidateVideoUrlSchema(platform: Platform) {
  if (platform === Platform.INSTAGRAM) {
    return z.object({
      videoUrl: z
        .string({ error: SOCIAL_ACCOUNT_MESSAGES.VIDEO_URL_INVALID })
        .trim()
        .url(SOCIAL_ACCOUNT_MESSAGES.VIDEO_URL_INVALID)
        .refine(
          (url) => /instagram\.com\/(?:[^/]+\/)?(reel|reels|p)\/[A-Za-z0-9_-]+/i.test(url),
          SOCIAL_ACCOUNT_MESSAGES.VIDEO_URL_MUST_BE_INSTAGRAM,
        ),
    });
  }

  if (platform === Platform.YOUTUBE) {
    return z.object({
      videoUrl: z
        .string({ error: SOCIAL_ACCOUNT_MESSAGES.VIDEO_URL_INVALID })
        .trim()
        .url(SOCIAL_ACCOUNT_MESSAGES.VIDEO_URL_INVALID)
        .refine(
          (url) => /youtube\.com\/shorts\/[A-Za-z0-9_-]{6,}/i.test(url),
          SOCIAL_ACCOUNT_MESSAGES.VIDEO_URL_MUST_BE_YOUTUBE_SHORTS,
        ),
    });
  }

  return ValidateVideoUrlSchema;
}
