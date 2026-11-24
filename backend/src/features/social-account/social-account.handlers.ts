import type { NextFunction, Request, Response } from 'express';
import { Platform, Role, Status } from '../../generated/prisma/enums.js';
import { SendError, SendSuccess } from '../../utils/api-response.js';
import { prisma } from '../../utils/prisma.js';
import { PersistSocialAvatarToStorage } from '../../services/supabase.js';
import {
  GetInstagramRecentReels,
  GetInstagramUserProfile,
  GetInstagramVideoDetails,
  GetTikTokRecentVideos,
  GetTikTokUserProfile,
  GetTikTokVideoDetails,
  GetYouTubeChannelProfile,
  GetYouTubeChannelShorts,
  GetYouTubeShortDetails,
  type SocialUserProfile,
  type SocialVideoItem,
} from '../../services/scrape-creators.js';
import {
  SOCIAL_ACCOUNT_MESSAGES,
  SOCIAL_PLATFORM_DISPLAY_NAMES,
  TIKTOK_RECENT_VIDEOS_DEFAULT_LIMIT,
  VERIFICATION_CODE_EXPIRY_MS,
} from './social-account.constants.js';
import {
  CalculateAccountSwitchCooldown,
  FormatCooldownDateId,
  GenerateVerificationCode,
} from './social-account.helper.js';
import type { RequestCodeResponseData } from './social-account.types.js';
import {
  BuildValidateVideoUrlSchema,
  ParseSocialPlatformParam,
  RequestCodeSchema,
  VerifyBioSchema,
} from './social-account.validators.js';

/**
 * Dispatches live profile lookup to the matching ScrapeCreators platform adapter.
 *
 * @param platform - Target social platform enum.
 * @param username - Normalized handle without leading '@'.
 * @returns Normalized social user profile.
 */
async function FetchPlatformUserProfile(platform: Platform, username: string): Promise<SocialUserProfile> {
  if (platform === Platform.INSTAGRAM) {
    const profile = await GetInstagramUserProfile(username);
    return profile;
  }

  if (platform === Platform.YOUTUBE) {
    const profile = await GetYouTubeChannelProfile(username);
    return profile;
  }

  const profile = await GetTikTokUserProfile(username);
  return profile;
}

/**
 * Dispatches recent videos/reels/shorts listing to the matching ScrapeCreators platform adapter.
 *
 * @param platform - Target social platform enum.
 * @param username - Normalized handle without leading '@'.
 * @param limit - Maximum number of recent items to fetch.
 * @returns Array of normalized social video items.
 */
async function FetchPlatformRecentVideos(
  platform: Platform,
  username: string,
  limit: number,
): Promise<SocialVideoItem[]> {
  if (platform === Platform.INSTAGRAM) {
    const reels = await GetInstagramRecentReels(username, limit);
    return reels;
  }

  if (platform === Platform.YOUTUBE) {
    const shorts = await GetYouTubeChannelShorts(username, limit);
    return shorts;
  }

  const videos = await GetTikTokRecentVideos(username, limit);
  return videos;
}

/**
 * Dispatches single video metadata lookup to the matching ScrapeCreators platform adapter.
 *
 * @param platform - Target social platform enum.
 * @param videoUrl - Public video URL matching the platform.
 * @returns Normalized social video metadata.
 */
async function FetchPlatformVideoDetails(platform: Platform, videoUrl: string): Promise<SocialVideoItem> {
  if (platform === Platform.INSTAGRAM) {
    const details = await GetInstagramVideoDetails(videoUrl);
    return details;
  }

  if (platform === Platform.YOUTUBE) {
    const details = await GetYouTubeShortDetails(videoUrl);
    return details;
  }

  const details = await GetTikTokVideoDetails(videoUrl);
  return details;
}

/**
 * Handles `POST /social-accounts/:platform/request-code`:
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

    const platform = ParseSocialPlatformParam(
      typeof req.params?.platform === 'string' ? req.params.platform : undefined,
    );
    if (!platform) {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.UNSUPPORTED_PLATFORM, 400);
      return;
    }

    const platformName = SOCIAL_PLATFORM_DISPLAY_NAMES[platform];

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

    // Check if creator already has an active verified account on this platform under switch cooldown
    const findCurrentActiveQuery = {
      where: {
        creatorId: creator.id,
        platform,
        isVerified: true,
        status: Status.ACTIVE,
      },
      orderBy: {
        verifiedAt: 'desc' as const,
      },
    };
    const currentActiveAccount = await prisma.creatorSocialAccount.findFirst(findCurrentActiveQuery);

    if (currentActiveAccount && currentActiveAccount.username !== cleanUsername) {
      const switchCooldown = CalculateAccountSwitchCooldown(currentActiveAccount.verifiedAt);
      if (!switchCooldown.canSwitchAccount && switchCooldown.nextSwitchAvailableAt) {
        const availableDateLabel = FormatCooldownDateId(switchCooldown.nextSwitchAvailableAt);
        const cooldownMessage = SOCIAL_ACCOUNT_MESSAGES.ACCOUNT_SWITCH_COOLDOWN(
          switchCooldown.remainingDays,
          availableDateLabel,
          platformName,
        );
        SendError(res, cooldownMessage, 429);
        return;
      }
    }

    // Check if this username is already verified in the system on this platform
    const findVerifiedAccountQuery = {
      where: {
        platform,
        username: cleanUsername,
        isVerified: true,
        status: Status.ACTIVE,
      },
    };
    const existingVerifiedAccount = await prisma.creatorSocialAccount.findFirst(findVerifiedAccountQuery);

    if (existingVerifiedAccount) {
      // Anti-hijacking guard: prevent linking if already verified by another creator
      if (existingVerifiedAccount.creatorId !== creator.id) {
        const conflictMsg =
          platform === Platform.TIKTOK
            ? SOCIAL_ACCOUNT_MESSAGES.USERNAME_ALREADY_CONNECTED
            : SOCIAL_ACCOUNT_MESSAGES.USERNAME_ALREADY_CONNECTED_PLATFORM(platformName);
        SendError(res, conflictMsg, 409);
        return;
      }

      // Idempotent guard: if this is already the creator's active account, do NOT reset verifiedAt cooldown
      if (currentActiveAccount && currentActiveAccount.id === existingVerifiedAccount.id) {
        const cooldown = CalculateAccountSwitchCooldown(existingVerifiedAccount.verifiedAt);
        const responseData: RequestCodeResponseData = {
          username: cleanUsername,
          alreadyVerified: true,
          account: {
            ...existingVerifiedAccount,
            canSwitchAccount: cooldown.canSwitchAccount,
            nextSwitchAvailableAt: cooldown.nextSwitchAvailableAt,
          },
        };

        SendSuccess(res, responseData, SOCIAL_ACCOUNT_MESSAGES.ACCOUNT_ALREADY_VERIFIED(existingVerifiedAccount.username));
        return;
      }

      // Seamless reactivation: if this creator previously verified this handle, reactivate atomically
      const deactivateOthersQuery = {
        where: {
          creatorId: creator.id,
          platform,
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

      const newCooldown = CalculateAccountSwitchCooldown(updatedAccount.verifiedAt);
      const responseData: RequestCodeResponseData = {
        username: cleanUsername,
        alreadyVerified: true,
        account: {
          ...updatedAccount,
          canSwitchAccount: newCooldown.canSwitchAccount,
          nextSwitchAvailableAt: newCooldown.nextSwitchAvailableAt,
        },
      };

      SendSuccess(res, responseData, SOCIAL_ACCOUNT_MESSAGES.ACCOUNT_ALREADY_VERIFIED(existingVerifiedAccount.username));
      return;
    }

    // Look up any existing active verification challenge for this creator, platform, and handle
    const findActiveChallengeQuery = {
      where: {
        creatorId: creator.id,
        platform,
        username: cleanUsername,
        status: Status.ACTIVE,
      },
    };
    const activeChallenge = await prisma.socialVerificationCode.findFirst(findActiveChallengeQuery);

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

    const challengePayload = {
      code: verificationCode,
      expiresAt: expiryDate,
      status: Status.ACTIVE,
    };

    const upsertChallengeQuery = {
      where: {
        creatorId_platform_username: {
          creatorId: creator.id,
          platform,
          username: cleanUsername,
        },
      },
      update: challengePayload,
      create: {
        creatorId: creator.id,
        platform,
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
 * Handles `POST /social-accounts/:platform/verify`:
 * Inspects creator's live social profile bio/description to confirm presence of the verification code.
 * Upon successful verification, creates or updates the verified account in `CreatorSocialAccount`.
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

    const platform = ParseSocialPlatformParam(
      typeof req.params?.platform === 'string' ? req.params.platform : undefined,
    );
    if (!platform) {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.UNSUPPORTED_PLATFORM, 400);
      return;
    }

    const platformName = SOCIAL_PLATFORM_DISPLAY_NAMES[platform];

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

    // Enforce 30-day switch cooldown before scraping if creator already has a different active account
    const findCurrentActiveQuery = {
      where: {
        creatorId: creator.id,
        platform,
        isVerified: true,
        status: Status.ACTIVE,
      },
      orderBy: {
        verifiedAt: 'desc' as const,
      },
    };
    const currentActiveAccount = await prisma.creatorSocialAccount.findFirst(findCurrentActiveQuery);

    if (currentActiveAccount && currentActiveAccount.username !== cleanUsername) {
      const switchCooldown = CalculateAccountSwitchCooldown(currentActiveAccount.verifiedAt);
      if (!switchCooldown.canSwitchAccount && switchCooldown.nextSwitchAvailableAt) {
        const availableDateLabel = FormatCooldownDateId(switchCooldown.nextSwitchAvailableAt);
        const cooldownMessage = SOCIAL_ACCOUNT_MESSAGES.ACCOUNT_SWITCH_COOLDOWN(
          switchCooldown.remainingDays,
          availableDateLabel,
          platformName,
        );
        SendError(res, cooldownMessage, 429);
        return;
      }
    }

    // Unified check: Idempotency (if verified by this creator) & Anti-hijacking (if verified by someone else)
    const findExistingVerifiedQuery = {
      where: {
        platform,
        username: cleanUsername,
        isVerified: true,
        status: Status.ACTIVE,
      },
    };
    const existingVerifiedAccount = await prisma.creatorSocialAccount.findFirst(findExistingVerifiedQuery);

    if (existingVerifiedAccount) {
      if (existingVerifiedAccount.creatorId === creator.id) {
        const successMsg =
          platform === Platform.TIKTOK
            ? SOCIAL_ACCOUNT_MESSAGES.VERIFY_SUCCESS
            : SOCIAL_ACCOUNT_MESSAGES.VERIFY_SUCCESS_PLATFORM(platformName);
        SendSuccess(res, existingVerifiedAccount, successMsg);
        return;
      }
      const conflictMsg =
        platform === Platform.TIKTOK
          ? SOCIAL_ACCOUNT_MESSAGES.USERNAME_ALREADY_CONNECTED
          : SOCIAL_ACCOUNT_MESSAGES.USERNAME_ALREADY_CONNECTED_PLATFORM(platformName);
      SendError(res, conflictMsg, 409);
      return;
    }

    // Retrieve active challenge from social_verification_codes table
    const findChallengeQuery = {
      where: {
        creatorId: creator.id,
        platform,
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

    // Fetch live profile and bio/description from ScrapeCreators
    let liveProfile: SocialUserProfile;
    try {
      liveProfile = await FetchPlatformUserProfile(platform, cleanUsername);
    } catch {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.PROFILE_ACCESS_FAILED(cleanUsername, platformName), 400);
      return;
    }

    if (liveProfile.isPrivate) {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.PROFILE_PRIVATE(cleanUsername, platformName), 400);
      return;
    }

    const expectedCode = challenge.code.toLowerCase();
    const liveBio = (liveProfile.bioDescription || '').toLowerCase();

    if (!liveBio.includes(expectedCode)) {
      SendError(
        res,
        SOCIAL_ACCOUNT_MESSAGES.CODE_NOT_FOUND_IN_BIO(challenge.code, cleanUsername, platformName),
        400,
      );
      return;
    }

    // Persist scraped avatar to permanent storage (TikTok & Instagram CDN URLs expire)
    let resolvedAvatarUrl: string | null = liveProfile.avatarUrl ?? null;
    if (resolvedAvatarUrl) {
      const storedAvatarUrl = await PersistSocialAvatarToStorage(
        resolvedAvatarUrl,
        creator.id,
        platform,
        cleanUsername,
      );
      if (storedAvatarUrl) {
        resolvedAvatarUrl = storedAvatarUrl;
      }
    }

    const softDeleteChallengeQuery = {
      where: { id: challenge.id },
      data: { status: Status.DELETED },
    };

    const deactivateOthersQuery = {
      where: {
        creatorId: creator.id,
        platform,
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
          platform,
          username: cleanUsername,
        },
      },
      update: accountPayload,
      create: {
        platform,
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

    // Preserve existing custom creator avatar if already uploaded
    if (resolvedAvatarUrl && !creator.avatarUrl) {
      transactionSteps.push(
        prisma.creator.update({
          where: { id: creator.id },
          data: { avatarUrl: resolvedAvatarUrl },
        }),
      );
    }

    const transactionResults = await prisma.$transaction(transactionSteps);
    const verifiedAccount = transactionResults[2];
    const switchCooldown = CalculateAccountSwitchCooldown(verifiedAccount.verifiedAt);
    const enrichedVerifiedAccount = {
      ...verifiedAccount,
      canSwitchAccount: switchCooldown.canSwitchAccount,
      nextSwitchAvailableAt: switchCooldown.nextSwitchAvailableAt,
    };

    const successMsg =
      platform === Platform.TIKTOK
        ? SOCIAL_ACCOUNT_MESSAGES.VERIFY_SUCCESS
        : SOCIAL_ACCOUNT_MESSAGES.VERIFY_SUCCESS_PLATFORM(platformName);
    SendSuccess(res, enrichedVerifiedAccount, successMsg);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `GET /social-accounts/connected`:
 * Retrieves the currently logged-in creator's verified social account for the requested platform
 * (defaults to `TIKTOK` for backward compatibility).
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

    const platform = ParseSocialPlatformParam(
      typeof req.query?.platform === 'string' ? req.query.platform : undefined,
    );
    if (!platform) {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.UNSUPPORTED_PLATFORM, 400);
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
        platform,
        isVerified: true,
        status: Status.ACTIVE,
      },
      orderBy: {
        verifiedAt: 'desc' as const,
      },
    };
    const socialAccount = await prisma.creatorSocialAccount.findFirst(findVerifiedAccountQuery);

    if (!socialAccount) {
      SendSuccess(res, null, SOCIAL_ACCOUNT_MESSAGES.CONNECTED_ACCOUNT_RETRIEVED);
      return;
    }

    const switchCooldown = CalculateAccountSwitchCooldown(socialAccount.verifiedAt);
    const enrichedSocialAccount = {
      ...socialAccount,
      canSwitchAccount: switchCooldown.canSwitchAccount,
      nextSwitchAvailableAt: switchCooldown.nextSwitchAvailableAt,
    };

    SendSuccess(res, enrichedSocialAccount, SOCIAL_ACCOUNT_MESSAGES.CONNECTED_ACCOUNT_RETRIEVED);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `GET /social-accounts/connected/all`:
 * Retrieves all active verified social accounts (TikTok, Instagram, YouTube) owned by the creator,
 * deduplicated to the latest active verified account per platform.
 *
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetAllConnectedSocialAccounts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
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

    const findAllAccountsQuery = {
      where: {
        creatorId: creator.id,
        isVerified: true,
        status: Status.ACTIVE,
      },
      orderBy: {
        verifiedAt: 'desc' as const,
      },
    };
    const allAccounts = await prisma.creatorSocialAccount.findMany(findAllAccountsQuery);

    // Keep the most recently verified active account per platform
    const seenPlatforms = new Set<Platform>();
    const enrichedAccounts = [];

    for (const socialAccount of allAccounts) {
      if (seenPlatforms.has(socialAccount.platform)) {
        continue;
      }
      seenPlatforms.add(socialAccount.platform);

      const switchCooldown = CalculateAccountSwitchCooldown(socialAccount.verifiedAt);
      enrichedAccounts.push({
        ...socialAccount,
        canSwitchAccount: switchCooldown.canSwitchAccount,
        nextSwitchAvailableAt: switchCooldown.nextSwitchAvailableAt,
      });
    }

    SendSuccess(res, enrichedAccounts, SOCIAL_ACCOUNT_MESSAGES.CONNECTED_ACCOUNTS_RETRIEVED);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `GET /social-accounts/:platform/recent-videos`:
 * Fetches recent public videos/reels/shorts uploaded by the creator's connected account on that platform.
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

    const platform = ParseSocialPlatformParam(
      typeof req.params?.platform === 'string' ? req.params.platform : undefined,
    );
    if (!platform) {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.UNSUPPORTED_PLATFORM, 400);
      return;
    }

    const platformName = SOCIAL_PLATFORM_DISPLAY_NAMES[platform];

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
        platform,
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
      const noVerifiedMsg =
        platform === Platform.TIKTOK
          ? SOCIAL_ACCOUNT_MESSAGES.NO_VERIFIED_TIKTOK
          : SOCIAL_ACCOUNT_MESSAGES.NO_VERIFIED_PLATFORM_ACCOUNT(platformName);
      SendError(res, noVerifiedMsg, 400);
      return;
    }

    let videos: SocialVideoItem[];
    try {
      videos = await FetchPlatformRecentVideos(
        platform,
        verifiedAccount.username,
        TIKTOK_RECENT_VIDEOS_DEFAULT_LIMIT,
      );
    } catch (scraperErr) {
      console.error(`[GetRecentSocialVideos] Scraper error for ${platform} @${verifiedAccount.username}:`, scraperErr);
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.RECENT_VIDEOS_FAILED, 400);
      return;
    }

    SendSuccess(res, videos, SOCIAL_ACCOUNT_MESSAGES.RECENT_VIDEOS_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /social-accounts/:platform/validate-video-url`:
 * Validates a direct video link for the platform and ensures the author matches the creator's verified account.
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

    const platform = ParseSocialPlatformParam(
      typeof req.params?.platform === 'string' ? req.params.platform : undefined,
    );
    if (!platform) {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.UNSUPPORTED_PLATFORM, 400);
      return;
    }

    const platformName = SOCIAL_PLATFORM_DISPLAY_NAMES[platform];
    const urlSchema = BuildValidateVideoUrlSchema(platform);
    const validation = urlSchema.safeParse(req.body);
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
        platform,
        isVerified: true,
        status: Status.ACTIVE,
      },
      orderBy: {
        verifiedAt: 'desc' as const,
      },
    };

    const verifiedAccount = await prisma.creatorSocialAccount.findFirst(findVerifiedAccountQuery);
    if (!verifiedAccount) {
      const notVerifiedMsg =
        platform === Platform.TIKTOK
          ? SOCIAL_ACCOUNT_MESSAGES.ACCOUNT_NOT_VERIFIED
          : SOCIAL_ACCOUNT_MESSAGES.ACCOUNT_NOT_VERIFIED_PLATFORM(platformName);
      SendError(res, notVerifiedMsg, 400);
      return;
    }

    const rawVideoUrl = validation.data.videoUrl;
    let videoDetails: SocialVideoItem;
    try {
      videoDetails = await FetchPlatformVideoDetails(platform, rawVideoUrl);
    } catch {
      SendError(res, SOCIAL_ACCOUNT_MESSAGES.VIDEO_VERIFY_FAILED, 400);
      return;
    }

    const authorHandle = videoDetails.authorUsername.toLowerCase();
    const verifiedHandle = verifiedAccount.username.toLowerCase();
    const isHandleMatch = Boolean(authorHandle) && authorHandle === verifiedHandle;
    const isPlatformUserIdMatch =
      Boolean(videoDetails.authorPlatformUserId) &&
      Boolean(verifiedAccount.platformUserId) &&
      videoDetails.authorPlatformUserId === verifiedAccount.platformUserId;

    if (!isHandleMatch && !isPlatformUserIdMatch) {
      SendError(
        res,
        SOCIAL_ACCOUNT_MESSAGES.VIDEO_AUTHOR_MISMATCH(
          videoDetails.authorUsername,
          verifiedAccount.username,
          platformName,
        ),
        400,
      );
      return;
    }

    SendSuccess(res, videoDetails, SOCIAL_ACCOUNT_MESSAGES.VIDEO_VALID_SUCCESS);
  } catch (err) {
    next(err);
  }
}
