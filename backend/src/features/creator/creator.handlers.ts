import { Readable } from 'node:stream';
import { TransformStream } from 'node:stream/web';
import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';
import { Platform, Role, Status } from '../../generated/prisma/enums.js';
import { SendError, SendSuccess } from '../../utils/api-response.js';
import { prisma } from '../../utils/prisma.js';
import {
  ALLOWED_AVATAR_MIME_TYPES,
  CREATOR_LIMITS,
  CREATOR_MESSAGES,
} from './creator.constants.js';
import { UpdateCreatorProfileSchema } from './creator.schemas.js';
import type { CreatorProfileResponse, CreatorSocialSummary } from './creator.types.js';

/**
 * Handles `GET /creator/profile`:
 * Retrieves the full profile of the authenticated creator, including their linked verified TikTok account.
 *
 * @param req - Express request.
 * @param res - Express response.
 * @param next - Express next function.
 */
export async function GetCreatorProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CREATOR_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR) {
      SendError(res, CREATOR_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const findCreatorQuery = {
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
      include: {
        account: {
          select: {
            email: true,
          },
        },
        socialAccounts: {
          where: {
            platform: Platform.TIKTOK,
            isVerified: true,
            status: Status.ACTIVE,
          },
          orderBy: {
            verifiedAt: 'desc' as const,
          },
          take: 1,
        },
      },
    };

    const creator = await prisma.creator.findFirst(findCreatorQuery);

    if (!creator) {
      SendError(res, CREATOR_MESSAGES.CREATOR_NOT_FOUND, 404);
      return;
    }

    const latestVerifiedTikTok = creator.socialAccounts[0];
    const tiktokAccount: CreatorSocialSummary | null = latestVerifiedTikTok
      ? {
          username: latestVerifiedTikTok.username,
          avatarUrl: latestVerifiedTikTok.avatarUrl,
          followersCount: latestVerifiedTikTok.followersCount,
          isVerified: latestVerifiedTikTok.isVerified,
        }
      : null;

    const formattedDob = creator.dateOfBirth
      ? creator.dateOfBirth.toISOString().slice(0, 10)
      : null;

    const responseData: CreatorProfileResponse = {
      id: creator.id,
      fullName: creator.fullName,
      email: creator.account.email,
      avatarUrl: creator.avatarUrl,
      dateOfBirth: formattedDob,
      phoneNumber: creator.phoneNumber,
      location: creator.location,
      bio: creator.bio,
      contentCategories: creator.contentCategories,
      tiktokAccount,
      createdAt: creator.createdAt,
      updatedAt: creator.updatedAt,
    };

    SendSuccess(res, responseData, CREATOR_MESSAGES.PROFILE_FETCH_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `PATCH /creator/profile`:
 * Updates the creator's personal details, age/birthdate, location, bio, and content niche categories.
 *
 * @param req - Express request with update fields.
 * @param res - Express response.
 * @param next - Express next function.
 */
export async function UpdateCreatorProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CREATOR_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR) {
      SendError(res, CREATOR_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const findCreatorQuery = {
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    };

    const existingCreator = await prisma.creator.findFirst(findCreatorQuery);

    if (!existingCreator) {
      SendError(res, CREATOR_MESSAGES.CREATOR_NOT_FOUND, 404);
      return;
    }

    const validationResult = UpdateCreatorProfileSchema.safeParse(req.body);

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      const errorMessage = firstIssue ? firstIssue.message : CREATOR_MESSAGES.INVALID_PAYLOAD;
      SendError(res, errorMessage, 400);
      return;
    }

    const payload = validationResult.data;
    const updateData: Prisma.CreatorUpdateInput = {};

    if (payload.fullName !== undefined) {
      updateData.fullName = payload.fullName.trim();
    }
    if (payload.dateOfBirth !== undefined) {
      if (!payload.dateOfBirth) {
        updateData.dateOfBirth = null;
      } else {
        const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(payload.dateOfBirth);
        if (match) {
          updateData.dateOfBirth = new Date(
            Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
          );
        } else {
          updateData.dateOfBirth = new Date(payload.dateOfBirth);
        }
      }
    }
    if (payload.phoneNumber !== undefined) {
      updateData.phoneNumber = payload.phoneNumber
        ? payload.phoneNumber.replace(/[\s-]/g, '').trim()
        : null;
    }
    if (payload.location !== undefined) {
      updateData.location = payload.location ? payload.location.trim() : null;
    }
    if (payload.bio !== undefined) {
      updateData.bio = payload.bio ? payload.bio.trim() : null;
    }
    if (payload.contentCategories !== undefined) {
      updateData.contentCategories = payload.contentCategories;
    }

    const updateQuery = {
      where: { id: existingCreator.id },
      data: updateData,
      include: {
        account: {
          select: {
            email: true,
          },
        },
        socialAccounts: {
          where: {
            platform: Platform.TIKTOK,
            isVerified: true,
            status: Status.ACTIVE,
          },
          orderBy: {
            verifiedAt: 'desc' as const,
          },
          take: 1,
        },
      },
    };

    const updatedCreator = await prisma.creator.update(updateQuery);

    const latestVerifiedTikTok = updatedCreator.socialAccounts[0];
    const tiktokAccount: CreatorSocialSummary | null = latestVerifiedTikTok
      ? {
          username: latestVerifiedTikTok.username,
          avatarUrl: latestVerifiedTikTok.avatarUrl,
          followersCount: latestVerifiedTikTok.followersCount,
          isVerified: latestVerifiedTikTok.isVerified,
        }
      : null;

    const formattedDob = updatedCreator.dateOfBirth
      ? updatedCreator.dateOfBirth.toISOString().slice(0, 10)
      : null;

    const responseData: CreatorProfileResponse = {
      id: updatedCreator.id,
      fullName: updatedCreator.fullName,
      email: updatedCreator.account.email,
      avatarUrl: updatedCreator.avatarUrl,
      dateOfBirth: formattedDob,
      phoneNumber: updatedCreator.phoneNumber,
      location: updatedCreator.location,
      bio: updatedCreator.bio,
      contentCategories: updatedCreator.contentCategories,
      tiktokAccount,
      createdAt: updatedCreator.createdAt,
      updatedAt: updatedCreator.updatedAt,
    };

    SendSuccess(res, responseData, CREATOR_MESSAGES.PROFILE_UPDATE_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /creator/profile/avatar`:
 * Streams custom avatar photo directly to Supabase Storage with chunk-based byte counting (DoS defense).
 *
 * @param req - Express request with raw image stream.
 * @param res - Express response.
 * @param next - Express next function.
 */
export async function UploadCreatorAvatar(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, CREATOR_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR) {
      SendError(res, CREATOR_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const findCreatorQuery = {
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    };

    const creator = await prisma.creator.findFirst(findCreatorQuery);

    if (!creator) {
      SendError(res, CREATOR_MESSAGES.CREATOR_NOT_FOUND, 404);
      return;
    }

    const rawContentType = req.headers['content-type']?.split(';')[0]?.trim().toLowerCase() ?? '';
    const fileExtension = ALLOWED_AVATAR_MIME_TYPES[rawContentType];

    if (!fileExtension) {
      SendError(res, CREATOR_MESSAGES.UNSUPPORTED_FILE_TYPE, 400);
      return;
    }

    const contentLength = Number(req.headers['content-length']);

    if (!contentLength || Number.isNaN(contentLength)) {
      SendError(res, CREATOR_MESSAGES.CONTENT_LENGTH_REQUIRED, 411);
      return;
    }

    if (contentLength > CREATOR_LIMITS.MAX_AVATAR_SIZE_BYTES) {
      SendError(res, CREATOR_MESSAGES.FILE_SIZE_EXCEEDED, 400);
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'campaign_thumbnails';

    if (!supabaseUrl || !serviceRoleKey) {
      SendError(res, CREATOR_MESSAGES.STORAGE_CONFIG_MISSING, 500);
      return;
    }

    let bytesReceived = 0;
    const sizeLimiter = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        bytesReceived += chunk.byteLength;
        if (bytesReceived > CREATOR_LIMITS.MAX_AVATAR_SIZE_BYTES) {
          controller.error(new Error('FILE_SIZE_EXCEEDED'));
        } else {
          controller.enqueue(chunk);
        }
      },
    });

    const webStream = Readable.toWeb(req).pipeThrough(sizeLimiter);
    const storagePath = `creators/${creator.id}/avatar-${Date.now()}.${fileExtension}`;
    const targetUrl = `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/${bucket}/${storagePath}`;

    const supabaseResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        'Content-Type': rawContentType,
        'x-upsert': 'true',
      },
      body: webStream,
      duplex: 'half',
    });

    if (!supabaseResponse.ok) {
      const errorDetail = await supabaseResponse.text();
      console.error('[Supabase Storage Upload Creator Avatar Error]', supabaseResponse.status, errorDetail);
      SendError(res, CREATOR_MESSAGES.STORAGE_UPLOAD_FAILED, 502);
      return;
    }

    const publicUrl = `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${bucket}/${storagePath}`;

    const updateAvatarQuery = {
      where: { id: creator.id },
      data: { avatarUrl: publicUrl },
    };

    await prisma.creator.update(updateAvatarQuery);

    SendSuccess(res, { url: publicUrl }, CREATOR_MESSAGES.AVATAR_UPLOAD_SUCCESS);
  } catch (error) {
    if (error instanceof Error && error.message === 'FILE_SIZE_EXCEEDED') {
      SendError(res, CREATOR_MESSAGES.FILE_SIZE_EXCEEDED, 400);
      return;
    }
    next(error);
  }
}
