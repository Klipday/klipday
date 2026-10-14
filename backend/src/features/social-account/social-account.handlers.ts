import type { NextFunction, Request, Response } from 'express';
import { Platform, Role, Status } from '../../generated/prisma/enums.js';
import { SendError, SendSuccess } from '../../utils/api-response.js';
import { prisma } from '../../utils/prisma.js';
import { PersistSocialAvatarToStorage } from '../../services/supabase.js';
import { GetTikTokRecentVideos, GetTikTokUserProfile, GetTikTokVideoDetails, type TikTokVideoItem } from '../../services/scrape-creators.js';
import { SOCIAL_ACCOUNT_MESSAGES, TIKTOK_RECENT_VIDEOS_DEFAULT_LIMIT, VERIFICATION_CODE_EXPIRY_MS } from './social-account.constants.js';
import { GenerateVerificationCode } from './social-account.helper.js';
import type { RequestCodeResponseData } from './social-account.types.js';
import { RequestCodeSchema, ValidateVideoUrlSchema, VerifyBioSchema } from './social-account.validators.js';

/**
 * Handles `POST /social-accounts/tiktok/request-code`:
 * Issues a temporary one-time verification challenge (KD-XXXX) valid for 10 minutes.
 * Persists the challenge into `social_verification_codes` table without touching `CreatorSocialAccount`.
 *
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function RequestVerificationCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;
    if (!account) {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR) {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.ONLY_CREATORS_CAN_CONNECT, 403);
      return;
    }

    const validation = RequestCodeSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message ?? SOCIAL_ACCOUNT_MESSAGES.INVALID_PAYLOAD;
      SendError(res, firstError, 400);
      return;
    }

    const cleanUsername = validation.data.username.replace(/^@/, '').toLowerCase().trim();

    const findCreatorQuery = {
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    };
    const creator = await prisma.creator.findFirst(findCreatorQuery);

    if (!creator) {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.CREATOR_NOT_FOUND, 404);
      return;
    }

    // Check if this username is already verified in the system
    const findVerifiedAccountQuery = {
      where: {
        platform: Platform.TIKTOK,
        username: cleanUsername,
        isVerified: true,
        status: Status.ACTIVE,
      },
    };
    const existingVerifiedAccount = await prisma.creatorSocialAccount.findFirst(findVerifiedAccountQuery);

    if (existingVerifiedAccount) {
      // Anti-hijacking guard: prevent linking if already verified by another creator
      if (existingVerifiedAccount.creatorId !== creator.id) {
        SendError(res, SOCIAL_ACCOUNT_MESSAGES.USERNAME_ALREADY_CONNECTED, 409);
        return;
      }

      // Seamless reactivation: if this creator previously verified this handle, reactivate atomically
      const deactivateOthersQuery = {
        where: {
          creatorId: creator.id,
          platform: Platform.TIKTOK,
          id: { not: existingVerifiedAccount.id },
          isVerified: true,
        },
        data: {
          isVerified: false,
        },
      };

      const reactivatePayload = {
        where: { id: existingVerifiedAccount.id },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
        },
      };

      const [_, updatedAccount] = await prisma.$transaction([
        prisma.creatorSocialAccount.updateMany(deactivateOthersQuery),
        prisma.creatorSocialAccount.update(reactivatePayload),
      ]);

      const responseData: RequestCodeResponseData = {
        username: cleanUsername,
        alreadyVerified: true,
        account: updatedAccount,
      };

      SendSuccess(res, responseData, SOCIAL_ACCOUNT_MESSAGES.ACCOUNT_ALREADY_VERIFIED(existingVerifiedAccount.username));
      return;
    }

    // Look up any existing active verification challenge for this creator and handle
    const findActiveChallengeQuery = {
      where: {
        creatorId: creator.id,
        platform: Platform.TIKTOK,
        username: cleanUsername,
        status: Status.ACTIVE,
      },
    };
    const activeChallenge = await prisma.socialVerificationCode.findFirst(findActiveChallengeQuery);

    // If an active challenge already exists and has not expired, return it directly
    if (activeChallenge && activeChallenge.expiresAt.getTime() > Date.now()) {
      const responseData: RequestCodeResponseData = {
        code: activeChallenge.code,
        expiresAt: activeChallenge.expiresAt.toISOString(),
        username: cleanUsername,
      };

      SendSuccess(res, responseData, SOCIAL_ACCOUNT_MESSAGES.CODE_REQUEST_SUCCESS);
      return;
    }

    // Generate new 10-minute verification token
    const verificationCode = GenerateVerificationCode();
    const expiryDate = new Date(Date.now() + VERIFICATION_CODE_EXPIRY_MS);

    // Save temporary challenge in social_verification_codes table (keyed by creatorId, platform, username)
    // NOTE: This does NOT touch CreatorSocialAccount, completely preventing username squatting.
    const challengePayload = {
      code: verificationCode,
      expiresAt: expiryDate,
      status: Status.ACTIVE,
    };

    const upsertChallengeQuery = {
      where: {
        creatorId_platform_username: {
          creatorId: creator.id,
          platform: Platform.TIKTOK,
          username: cleanUsername,
        },
      },
      update: challengePayload,
      create: {
        creatorId: creator.id,
        platform: Platform.TIKTOK,
        username: cleanUsername,
        ...challengePayload,
      },
    };
    await prisma.socialVerificationCode.upsert(upsertChallengeQuery);

    const responseData: RequestCodeResponseData = {
      code: verificationCode,
      expiresAt: expiryDate.toISOString(),
      username: cleanUsername,
    };

    SendSuccess(res, responseData, SOCIAL_ACCOUNT_MESSAGES.CODE_REQUEST_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /social-accounts/tiktok/verify`:
 * Inspects creator's live TikTok bio description to confirm presence of the verification code.
 * Upon successful bio verification, creates or updates the verified account in CreatorSocialAccount.
 *
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function VerifyTikTokBio(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;
    if (!account) {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR) {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.ONLY_CREATORS_CAN_CONNECT, 403);
      return;
    }

    const validation = VerifyBioSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message ?? SOCIAL_ACCOUNT_MESSAGES.INVALID_PAYLOAD;
      SendError(res, firstError, 400);
      return;
    }

    const cleanUsername = validation.data.username.replace(/^@/, '').toLowerCase().trim();

    const findCreatorQuery = {
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    };
    const creator = await prisma.creator.findFirst(findCreatorQuery);

    if (!creator) {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.CREATOR_NOT_FOUND, 404);
      return;
    }

    // Unified check: Idempotency (if verified by this creator) & Anti-hijacking (if verified by someone else)
    const findExistingVerifiedQuery = {
      where: {
        platform: Platform.TIKTOK,
        username: cleanUsername,
        isVerified: true,
        status: Status.ACTIVE,
      },
    };
    const existingVerifiedAccount = await prisma.creatorSocialAccount.findFirst(findExistingVerifiedQuery);

    if (existingVerifiedAccount) {
      if (existingVerifiedAccount.creatorId === creator.id) {
        SendSuccess(res, existingVerifiedAccount, SOCIAL_ACCOUNT_MESSAGES.VERIFY_SUCCESS);
        return;
      }
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.USERNAME_ALREADY_CONNECTED, 409);
      return;
    }

    // Retrieve active challenge from social_verification_codes table
    const findChallengeQuery = {
      where: {
        creatorId: creator.id,
        platform: Platform.TIKTOK,
        username: cleanUsername,
        status: Status.ACTIVE,
      },
    };
    const challenge = await prisma.socialVerificationCode.findFirst(findChallengeQuery);

    if (!challenge) {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.CHALLENGE_NOT_FOUND, 400);
      return;
    }

    if (challenge.expiresAt.getTime() < Date.now()) {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.CODE_EXPIRED, 400);
      return;
    }

    // Call global ScrapeCreators service to fetch live profile and bio from TikTok
    let liveProfile;
    try {
      liveProfile = await GetTikTokUserProfile(cleanUsername);
    } catch {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.PROFILE_ACCESS_FAILED(cleanUsername), 400);
      return;
    }

    const expectedCode = challenge.code.toLowerCase();
    const liveBio = (liveProfile.bioDescription || '').toLowerCase();

    if (!liveBio.includes(expectedCode)) {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.CODE_NOT_FOUND_IN_BIO(challenge.code, cleanUsername), 400);
      return;
    }

    // Persist scraped avatar to permanent storage
    let resolvedAvatarUrl: string | null = liveProfile.avatarUrl ?? null;
    if (resolvedAvatarUrl) {
      const storedAvatarUrl = await PersistSocialAvatarToStorage(resolvedAvatarUrl, creator.id, Platform.TIKTOK, cleanUsername);
      if (storedAvatarUrl) {
        resolvedAvatarUrl = storedAvatarUrl;
      }
    }

    // Atomic transaction: soft-delete challenge, deactivate prior creator accounts, and upsert verified account
    const softDeleteChallengeQuery = {
      where: { id: challenge.id },
      data: { status: Status.DELETED },
    };

    const deactivateOthersQuery = {
      where: {
        creatorId: creator.id,
        platform: Platform.TIKTOK,
        username: { not: cleanUsername },
        isVerified: true,
      },
      data: { isVerified: false },
    };

    const accountPayload = {
      creatorId: creator.id,
      isVerified: true,
      verifiedAt: new Date(),
      avatarUrl: resolvedAvatarUrl,
      followersCount: liveProfile.followersCount ?? 0,
      platformUserId: liveProfile.platformUserId ?? null,
      status: Status.ACTIVE,
    };

    const upsertAccountQuery = {
      where: {
        platform_username: {
          platform: Platform.TIKTOK,
          username: cleanUsername,
        },
      },
      update: accountPayload,
      create: {
        platform: Platform.TIKTOK,
        username: cleanUsername,
        ...accountPayload,
      },
    };

    const transactionSteps: [
      ReturnType<typeof prisma.socialVerificationCode.update>,
      ReturnType<typeof prisma.creatorSocialAccount.updateMany>,
      ReturnType<typeof prisma.creatorSocialAccount.upsert>,
      ...Array<ReturnType<typeof prisma.creator.update>>,
    ] = [
      prisma.socialVerificationCode.update(softDeleteChallengeQuery),
      prisma.creatorSocialAccount.updateMany(deactivateOthersQuery),
      prisma.creatorSocialAccount.upsert(upsertAccountQuery),
    ];

    if (resolvedAvatarUrl) {
      transactionSteps.push(
        prisma.creator.update({
          where: { id: creator.id },
          data: { avatarUrl: resolvedAvatarUrl },
        })
      );
    }

    const transactionResults = await prisma.$transaction(transactionSteps);
    const verifiedAccount = transactionResults[2];

    SendSuccess(res, verifiedAccount, SOCIAL_ACCOUNT_MESSAGES.VERIFY_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `GET /social-accounts/connected`:
 * Retrieves the currently logged-in creator's verified TikTok account if one exists.
 *
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetConnectedSocialAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;
    if (!account) {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR && account.role !== Role.ADMIN) {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.ONLY_CREATORS_CAN_CONNECT, 403);
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
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.CREATOR_NOT_FOUND, 404);
      return;
    }

    const findVerifiedAccountQuery = {
      where: {
        creatorId: creator.id,
        platform: Platform.TIKTOK,
        isVerified: true,
        status: Status.ACTIVE,
      },
      orderBy: {
        verifiedAt: 'desc' as const,
      },
    };
    const socialAccount = await prisma.creatorSocialAccount.findFirst(findVerifiedAccountQuery);

    SendSuccess(res, socialAccount, SOCIAL_ACCOUNT_MESSAGES.CONNECTED_ACCOUNT_RETRIEVED);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `GET /social-accounts/tiktok/recent-videos`:
 * Fetches recent public videos uploaded by the creator's connected TikTok account.
 *
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetRecentTikTokVideos(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;
    if (!account) {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR) {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.ONLY_CREATORS_CAN_ACCESS_VIDEOS, 403);
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
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.CREATOR_NOT_FOUND, 404);
      return;
    }

    const targetUsername =
      typeof req.query.username === 'string' && req.query.username.trim()
        ? req.query.username.replace(/^@/, '').toLowerCase().trim()
        : undefined;

    const findVerifiedAccountQuery = {
      where: {
        creatorId: creator.id,
        platform: Platform.TIKTOK,
        isVerified: true,
        status: Status.ACTIVE,
        ...(targetUsername ? { username: { equals: targetUsername, mode: 'insensitive' as const } } : {}),
      },
      orderBy: {
        verifiedAt: 'desc' as const,
      },
    };

    const verifiedAccount = await prisma.creatorSocialAccount.findFirst(findVerifiedAccountQuery);
    if (!verifiedAccount) {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.NO_VERIFIED_TIKTOK, 400);
      return;
    }

    let videos;
    try {
      videos = await GetTikTokRecentVideos(verifiedAccount.username, TIKTOK_RECENT_VIDEOS_DEFAULT_LIMIT);
    } catch (scraperErr) {
      console.error(`[GetRecentTikTokVideos] Scraper error for @${verifiedAccount.username}:`, scraperErr);
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.RECENT_VIDEOS_FAILED, 400);
      return;
    }

    SendSuccess(res, videos, SOCIAL_ACCOUNT_MESSAGES.RECENT_VIDEOS_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /social-accounts/tiktok/validate-video-url`:
 * Validates a direct TikTok video link and ensures author matches creator's verified account.
 *
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function ValidateTikTokVideoUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = req.account;
    if (!account) {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.CREATOR) {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.ONLY_CREATORS_CAN_VALIDATE_VIDEOS, 403);
      return;
    }

    const validation = ValidateVideoUrlSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message ?? SOCIAL_ACCOUNT_MESSAGES.VIDEO_URL_INVALID;
      SendError(res, firstError, 400);
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
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.CREATOR_NOT_FOUND, 404);
      return;
    }

    const findVerifiedAccountQuery = {
      where: {
        creatorId: creator.id,
        platform: Platform.TIKTOK,
        isVerified: true,
        status: Status.ACTIVE,
      },
      orderBy: {
        verifiedAt: 'desc' as const,
      },
    };

    const verifiedAccount = await prisma.creatorSocialAccount.findFirst(findVerifiedAccountQuery);
    if (!verifiedAccount) {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.ACCOUNT_NOT_VERIFIED, 400);
      return;
    }

    const rawVideoUrl = validation.data.videoUrl;
    let videoDetails: TikTokVideoItem;
    try {
      videoDetails = await GetTikTokVideoDetails(rawVideoUrl);
    } catch {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.VIDEO_VERIFY_FAILED, 400);
      return;
    }

    const authorHandle = videoDetails.authorUsername.toLowerCase();
    const verifiedHandle = verifiedAccount.username.toLowerCase();
    const isHandleMatch = authorHandle === verifiedHandle;
    const isPlatformUserIdMatch =
      Boolean(videoDetails.authorPlatformUserId) &&
      Boolean(verifiedAccount.platformUserId) &&
      videoDetails.authorPlatformUserId === verifiedAccount.platformUserId;

    if (!isHandleMatch && !isPlatformUserIdMatch) {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.VIDEO_AUTHOR_MISMATCH(videoDetails.authorUsername, verifiedAccount.username), 400);
      return;
    }

    SendSuccess(res, videoDetails, SOCIAL_ACCOUNT_MESSAGES.VIDEO_VALID_SUCCESS);
  } catch (err) {
    next(err);
  }
}
