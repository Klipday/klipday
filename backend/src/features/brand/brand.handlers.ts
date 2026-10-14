import { Readable } from 'node:stream';
import { TransformStream } from 'node:stream/web';
import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';
import {
  CampaignStatus,
  PayoutStatus,
  Role,
  Status,
  SubmissionStatus,
  VerificationStatus,
} from '../../generated/prisma/enums.js';
import { SendError, SendSuccess } from '../../utils/api-response.js';
import { prisma } from '../../utils/prisma.js';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  BRAND_DASHBOARD_ACTIVE_CAMPAIGN_SELECT,
  BRAND_DASHBOARD_BRAND_SELECT,
  BRAND_DASHBOARD_LIMITS,
  BRAND_DASHBOARD_MESSAGES,
  BRAND_DASHBOARD_PENDING_SUBMISSION_SELECT,
  BRAND_DASHBOARD_TOP_CLIP_SELECT,
  BRAND_LIMITS,
  BRAND_MESSAGES,
} from './brand.constants.js';
import {
  CreateBrandPayoutAccountSchema,
  UpdateBrandProfileSchema,
} from './brand.schemas.js';
import type {
  BrandDashboardActiveCampaign,
  BrandDashboardCampaignStatusCounts,
  BrandDashboardPendingSubmission,
  BrandDashboardResponse,
  BrandDashboardTopClip,
  BrandPayoutAccountRecord,
  BrandProfileResponse,
} from './brand.types.js';

/**
 * Handles `GET /brand/profile`: retrieves current brand profile and account details.
 *
 * @param req - Express request with authenticated account.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetBrandProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, BRAND_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, BRAND_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const brand = await prisma.brand.findFirst({
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
      },
    });

    if (!brand) {
      SendError(res, BRAND_MESSAGES.BRAND_NOT_FOUND, 404);
      return;
    }

    const profile: BrandProfileResponse = {
      id: brand.id,
      companyName: brand.companyName,
      email: brand.account.email,
      phoneNumber: brand.phoneNumber,
      industry: brand.industry,
      logoUrl: brand.logoUrl,
      location: brand.location,
      website: brand.website,
      description: brand.description,
      instagramHandle: brand.instagramHandle,
      tiktokHandle: brand.tiktokHandle,
      xHandle: brand.xHandle,
      threadsHandle: brand.threadsHandle,
      youtubeChannel: brand.youtubeChannel,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    };

    SendSuccess(res, profile, BRAND_MESSAGES.PROFILE_FETCH_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `PATCH /brand/profile`: updates brand basic information, website,
 * description, location, and social media handles.
 *
 * @param req - Express request with update body.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function UpdateBrandProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, BRAND_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, BRAND_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const validationResult = UpdateBrandProfileSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.issues[0]?.message ?? BRAND_MESSAGES.INVALID_INPUT;
      SendError(res, errorMessage, 400);
      return;
    }

    const brand = await prisma.brand.findFirst({
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
      },
    });

    if (!brand) {
      SendError(res, BRAND_MESSAGES.BRAND_NOT_FOUND, 404);
      return;
    }

    const payload = validationResult.data;
    const updateData: Prisma.BrandUpdateInput = {};

    if (payload.companyName !== undefined) {
      updateData.companyName = payload.companyName.trim();
    }
    if (payload.industry !== undefined) {
      updateData.industry = payload.industry ?? null;
    }
    if (payload.location !== undefined) {
      updateData.location = payload.location?.trim() ? payload.location.trim() : null;
    }
    if (payload.website !== undefined) {
      updateData.website = payload.website?.trim() ? payload.website.trim() : null;
    }
    if (payload.description !== undefined) {
      updateData.description = payload.description?.trim() ? payload.description.trim() : null;
    }
    if (payload.instagramHandle !== undefined) {
      updateData.instagramHandle = payload.instagramHandle?.replace(/^@/, '').trim()
        ? payload.instagramHandle.replace(/^@/, '').trim()
        : null;
    }
    if (payload.tiktokHandle !== undefined) {
      updateData.tiktokHandle = payload.tiktokHandle?.replace(/^@/, '').trim()
        ? payload.tiktokHandle.replace(/^@/, '').trim()
        : null;
    }
    if (payload.xHandle !== undefined) {
      updateData.xHandle = payload.xHandle?.replace(/^@/, '').trim()
        ? payload.xHandle.replace(/^@/, '').trim()
        : null;
    }
    if (payload.threadsHandle !== undefined) {
      updateData.threadsHandle = payload.threadsHandle?.replace(/^@/, '').trim()
        ? payload.threadsHandle.replace(/^@/, '').trim()
        : null;
    }
    if (payload.youtubeChannel !== undefined) {
      updateData.youtubeChannel = payload.youtubeChannel?.replace(/^@/, '').trim()
        ? payload.youtubeChannel.replace(/^@/, '').trim()
        : null;
    }

    const updatedBrand = await prisma.brand.update({
      where: { id: brand.id },
      data: updateData,
      include: {
        account: {
          select: {
            email: true,
          },
        },
      },
    });

    const result: BrandProfileResponse = {
      id: updatedBrand.id,
      companyName: updatedBrand.companyName,
      email: updatedBrand.account.email,
      phoneNumber: updatedBrand.phoneNumber,
      industry: updatedBrand.industry,
      logoUrl: updatedBrand.logoUrl,
      location: updatedBrand.location,
      website: updatedBrand.website,
      description: updatedBrand.description,
      instagramHandle: updatedBrand.instagramHandle,
      tiktokHandle: updatedBrand.tiktokHandle,
      xHandle: updatedBrand.xHandle,
      threadsHandle: updatedBrand.threadsHandle,
      youtubeChannel: updatedBrand.youtubeChannel,
      createdAt: updatedBrand.createdAt,
      updatedAt: updatedBrand.updatedAt,
    };

    SendSuccess(res, result, BRAND_MESSAGES.PROFILE_UPDATE_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /brand/profile/logo`: streams brand logo image directly to Supabase storage.
 *
 * @param req - Express request with raw image stream.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function UploadBrandLogo(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, BRAND_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, BRAND_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const brand = await prisma.brand.findFirst({
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    });

    if (!brand) {
      SendError(res, BRAND_MESSAGES.BRAND_NOT_FOUND, 404);
      return;
    }

    const rawContentType = req.headers['content-type']?.split(';')[0]?.trim().toLowerCase() ?? '';
    const fileExtension = ALLOWED_IMAGE_MIME_TYPES[rawContentType];

    if (!fileExtension) {
      SendError(res, BRAND_MESSAGES.UNSUPPORTED_FILE_TYPE, 400);
      return;
    }

    const contentLength = Number(req.headers['content-length']);

    if (!contentLength || Number.isNaN(contentLength)) {
      SendError(res, BRAND_MESSAGES.CONTENT_LENGTH_REQUIRED, 411);
      return;
    }

    if (contentLength > BRAND_LIMITS.MAX_LOGO_SIZE_BYTES) {
      SendError(res, BRAND_MESSAGES.FILE_SIZE_EXCEEDED, 400);
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'campaign-thumbnails';

    if (!supabaseUrl || !serviceRoleKey) {
      SendError(res, BRAND_MESSAGES.STORAGE_CONFIG_MISSING, 500);
      return;
    }

    let bytesReceived = 0;
    const sizeLimiter = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        bytesReceived += chunk.byteLength;
        if (bytesReceived > BRAND_LIMITS.MAX_LOGO_SIZE_BYTES) {
          controller.error(new Error('FILE_SIZE_EXCEEDED'));
        } else {
          controller.enqueue(chunk);
        }
      },
    });

    const webStream = Readable.toWeb(req).pipeThrough(sizeLimiter);
    const storagePath = `brands/${brand.id}/logo-${Date.now()}.${fileExtension}`;
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
      console.error('[Supabase Storage Upload Brand Logo Error]', supabaseResponse.status, errorDetail);
      SendError(res, BRAND_MESSAGES.STORAGE_UPLOAD_FAILED, 502);
      return;
    }

    const publicUrl = `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${bucket}/${storagePath}`;

    await prisma.brand.update({
      where: { id: brand.id },
      data: { logoUrl: publicUrl },
    });

    SendSuccess(res, { url: publicUrl }, BRAND_MESSAGES.LOGO_UPLOAD_SUCCESS);
  } catch (error) {
    if (error instanceof Error && error.message === 'FILE_SIZE_EXCEEDED') {
      SendError(res, BRAND_MESSAGES.FILE_SIZE_EXCEEDED, 400);
      return;
    }
    next(error);
  }
}

/**
 * Handles `POST /brand/payout-accounts/proof`: streams KYC proof image directly to Supabase storage.
 *
 * @param req - Express request with raw image stream.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function UploadBrandPayoutProof(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, BRAND_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, BRAND_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const brand = await prisma.brand.findFirst({
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    });

    if (!brand) {
      SendError(res, BRAND_MESSAGES.BRAND_NOT_FOUND, 404);
      return;
    }

    const rawContentType = req.headers['content-type']?.split(';')[0]?.trim().toLowerCase() ?? '';
    const fileExtension = ALLOWED_IMAGE_MIME_TYPES[rawContentType];

    if (!fileExtension) {
      SendError(res, BRAND_MESSAGES.UNSUPPORTED_FILE_TYPE, 400);
      return;
    }

    const contentLength = Number(req.headers['content-length']);

    if (!contentLength || Number.isNaN(contentLength)) {
      SendError(res, BRAND_MESSAGES.CONTENT_LENGTH_REQUIRED, 411);
      return;
    }

    if (contentLength > BRAND_LIMITS.MAX_PROOF_SIZE_BYTES) {
      SendError(res, BRAND_MESSAGES.FILE_SIZE_EXCEEDED, 400);
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'campaign-thumbnails';

    if (!supabaseUrl || !serviceRoleKey) {
      SendError(res, BRAND_MESSAGES.STORAGE_CONFIG_MISSING, 500);
      return;
    }

    let bytesReceived = 0;
    const sizeLimiter = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        bytesReceived += chunk.byteLength;
        if (bytesReceived > BRAND_LIMITS.MAX_PROOF_SIZE_BYTES) {
          controller.error(new Error('FILE_SIZE_EXCEEDED'));
        } else {
          controller.enqueue(chunk);
        }
      },
    });

    const webStream = Readable.toWeb(req).pipeThrough(sizeLimiter);
    const storagePath = `brands/${brand.id}/payout-proof-${Date.now()}.${fileExtension}`;
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
      console.error('[Supabase Storage Upload Brand Payout Proof Error]', supabaseResponse.status, errorDetail);
      SendError(res, BRAND_MESSAGES.STORAGE_UPLOAD_FAILED, 502);
      return;
    }

    const publicUrl = `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${bucket}/${storagePath}`;

    SendSuccess(res, { url: publicUrl }, BRAND_MESSAGES.PAYOUT_PROOF_UPLOAD_SUCCESS);
  } catch (error) {
    if (error instanceof Error && error.message === 'FILE_SIZE_EXCEEDED') {
      SendError(res, BRAND_MESSAGES.FILE_SIZE_EXCEEDED, 400);
      return;
    }
    next(error);
  }
}

/**
 * Handles `GET /brand/payout-accounts`: retrieves registered payout accounts for the authenticated brand.
 *
 * @param req - Express request.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetBrandPayoutAccounts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, BRAND_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, BRAND_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const wallet = await prisma.wallet.findFirst({
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    });

    if (!wallet) {
      SendSuccess(res, [], BRAND_MESSAGES.PAYOUT_ACCOUNTS_FETCH_SUCCESS);
      return;
    }

    const accounts = await prisma.brandPayoutAccount.findMany({
      where: {
        walletId: wallet.id,
        status: Status.ACTIVE,
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const records: BrandPayoutAccountRecord[] = accounts.map((item) => ({
      id: item.id,
      walletId: item.walletId,
      brandId: item.brandId,
      accountType: item.accountType,
      provider: item.provider,
      accountNumber: item.accountNumber,
      accountHolderName: item.accountHolderName,
      proofUrl: item.proofUrl,
      isPrimary: item.isPrimary,
      verificationStatus: item.verificationStatus,
      rejectionReason: item.rejectionReason,
      verifiedAt: item.verifiedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    SendSuccess(res, records, BRAND_MESSAGES.PAYOUT_ACCOUNTS_FETCH_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `POST /brand/payout-accounts`: creates a new payout account for the brand wallet.
 *
 * @param req - Express request with payout account payload.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function CreateBrandPayoutAccount(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, BRAND_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, BRAND_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const validationResult = CreateBrandPayoutAccountSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.issues[0]?.message ?? BRAND_MESSAGES.INVALID_INPUT;
      SendError(res, errorMessage, 400);
      return;
    }

    const brand = await prisma.brand.findFirst({
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    });

    if (!brand) {
      SendError(res, BRAND_MESSAGES.BRAND_NOT_FOUND, 404);
      return;
    }

    // Ensure wallet exists
    const wallet = await prisma.wallet.findFirst({
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    });

    if (!wallet) {
      SendError(res, BRAND_MESSAGES.WALLET_NOT_FOUND, 404);
      return;
    }

    // Check count of active payout accounts
    const activeAccountsCount = await prisma.brandPayoutAccount.count({
      where: {
        walletId: wallet.id,
        status: Status.ACTIVE,
      },
    });

    if (activeAccountsCount >= BRAND_LIMITS.MAX_PAYOUT_ACCOUNTS) {
      SendError(res, BRAND_MESSAGES.PAYOUT_ACCOUNT_LIMIT_EXCEEDED, 400);
      return;
    }

    const payload = validationResult.data;
    const normalizedProvider = payload.provider.toUpperCase().trim();
    const normalizedAccountNumber = payload.accountNumber.trim();

    // Check for duplicate account number
    const existingAccount = await prisma.brandPayoutAccount.findFirst({
      where: {
        walletId: wallet.id,
        provider: normalizedProvider,
        accountNumber: normalizedAccountNumber,
        status: Status.ACTIVE,
      },
    });

    if (existingAccount) {
      SendError(res, BRAND_MESSAGES.PAYOUT_ACCOUNT_DUPLICATE, 409);
      return;
    }

    const hasPrimaryAccount = await prisma.brandPayoutAccount.findFirst({
      where: {
        walletId: wallet.id,
        status: Status.ACTIVE,
        isPrimary: true,
      },
    });

    // If first account, no active primary account exists, or explicitly requested as primary
    const shouldBePrimary = !hasPrimaryAccount || Boolean(payload.isPrimary);

    const createdAccount = await prisma.$transaction(async (tx) => {
      if (shouldBePrimary) {
        await tx.brandPayoutAccount.updateMany({
          where: {
            walletId: wallet.id,
            status: Status.ACTIVE,
          },
          data: {
            isPrimary: false,
          },
        });
      }

      return tx.brandPayoutAccount.create({
        data: {
          walletId: wallet.id,
          brandId: brand.id,
          accountType: payload.accountType,
          provider: normalizedProvider,
          accountNumber: normalizedAccountNumber,
          accountHolderName: payload.accountHolderName.trim(),
          proofUrl: payload.proofUrl,
          isPrimary: shouldBePrimary,
          verificationStatus: VerificationStatus.PENDING,
          status: Status.ACTIVE,
        },
      });
    });

    const record: BrandPayoutAccountRecord = {
      id: createdAccount.id,
      walletId: createdAccount.walletId,
      brandId: createdAccount.brandId,
      accountType: createdAccount.accountType,
      provider: createdAccount.provider,
      accountNumber: createdAccount.accountNumber,
      accountHolderName: createdAccount.accountHolderName,
      proofUrl: createdAccount.proofUrl,
      isPrimary: createdAccount.isPrimary,
      verificationStatus: createdAccount.verificationStatus,
      rejectionReason: createdAccount.rejectionReason,
      verifiedAt: createdAccount.verifiedAt,
      createdAt: createdAccount.createdAt,
      updatedAt: createdAccount.updatedAt,
    };

    SendSuccess(res, record, BRAND_MESSAGES.PAYOUT_ACCOUNT_CREATED_SUCCESS, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `PATCH /brand/payout-accounts/:id/primary`: marks a payout account as primary.
 *
 * @param req - Express request with account ID param.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function SetPrimaryBrandPayoutAccount(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, BRAND_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, BRAND_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const accountId = req.params.id as string;

    const wallet = await prisma.wallet.findFirst({
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    });

    if (!wallet) {
      SendError(res, BRAND_MESSAGES.WALLET_NOT_FOUND, 404);
      return;
    }

    const targetAccount = await prisma.brandPayoutAccount.findFirst({
      where: {
        id: accountId,
        walletId: wallet.id,
        status: Status.ACTIVE,
      },
    });

    if (!targetAccount) {
      SendError(res, BRAND_MESSAGES.PAYOUT_ACCOUNT_NOT_FOUND, 404);
      return;
    }

    const updatedAccount = await prisma.$transaction(async (tx) => {
      await tx.brandPayoutAccount.updateMany({
        where: {
          walletId: wallet.id,
          status: Status.ACTIVE,
        },
        data: {
          isPrimary: false,
        },
      });

      return tx.brandPayoutAccount.update({
        where: { id: targetAccount.id },
        data: { isPrimary: true },
      });
    });

    const record: BrandPayoutAccountRecord = {
      id: updatedAccount.id,
      walletId: updatedAccount.walletId,
      brandId: updatedAccount.brandId,
      accountType: updatedAccount.accountType,
      provider: updatedAccount.provider,
      accountNumber: updatedAccount.accountNumber,
      accountHolderName: updatedAccount.accountHolderName,
      proofUrl: updatedAccount.proofUrl,
      isPrimary: updatedAccount.isPrimary,
      verificationStatus: updatedAccount.verificationStatus,
      rejectionReason: updatedAccount.rejectionReason,
      verifiedAt: updatedAccount.verifiedAt,
      createdAt: updatedAccount.createdAt,
      updatedAt: updatedAccount.updatedAt,
    };

    SendSuccess(res, record, BRAND_MESSAGES.PAYOUT_ACCOUNT_PRIMARY_SUCCESS);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `DELETE /brand/payout-accounts/:id`: soft-deletes a payout account.
 *
 * @param req - Express request with account ID param.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function DeleteBrandPayoutAccount(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;

    if (!account) {
      SendError(res, BRAND_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND) {
      SendError(res, BRAND_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const accountId = req.params.id as string;

    const wallet = await prisma.wallet.findFirst({
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
    });

    if (!wallet) {
      SendError(res, BRAND_MESSAGES.WALLET_NOT_FOUND, 404);
      return;
    }

    const targetAccount = await prisma.brandPayoutAccount.findFirst({
      where: {
        id: accountId,
        walletId: wallet.id,
        status: Status.ACTIVE,
      },
    });

    if (!targetAccount) {
      SendError(res, BRAND_MESSAGES.PAYOUT_ACCOUNT_NOT_FOUND, 404);
      return;
    }

    const intent = req.query.intent as string | undefined;

    // Race condition guard: if brand requested to cancel a pending verification,
    // but the admin already approved it in the background, prevent cancellation and notify.
    if (intent === 'cancel_pending' && targetAccount.verificationStatus === VerificationStatus.VERIFIED) {
      SendError(res, BRAND_MESSAGES.PAYOUT_ACCOUNT_ALREADY_VERIFIED, 409);
      return;
    }

    // Financial integrity guard: cannot delete account if it is bound to an active pending withdrawal request
    const pendingWithdrawal = await prisma.payoutRequest.findFirst({
      where: {
        walletId: wallet.id,
        payoutAccountId: targetAccount.id,
        payoutStatus: PayoutStatus.PENDING,
        status: Status.ACTIVE,
      },
    });

    if (pendingWithdrawal) {
      SendError(res, BRAND_MESSAGES.PAYOUT_ACCOUNT_HAS_PENDING_WITHDRAWAL, 400);
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.brandPayoutAccount.update({
        where: { id: targetAccount.id },
        data: { status: Status.DELETED, isPrimary: false },
      });

      // If deleted account was primary, promote another active account to primary
      if (targetAccount.isPrimary) {
        const remainingAccount = await tx.brandPayoutAccount.findFirst({
          where: {
            walletId: wallet.id,
            status: Status.ACTIVE,
            id: { not: targetAccount.id },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (remainingAccount) {
          await tx.brandPayoutAccount.update({
            where: { id: remainingAccount.id },
            data: { isPrimary: true },
          });
        }
      }
    });

    const successMessage =
      intent === 'cancel_pending'
        ? BRAND_MESSAGES.PAYOUT_ACCOUNT_CANCEL_SUCCESS
        : BRAND_MESSAGES.PAYOUT_ACCOUNT_DELETED_SUCCESS;

    SendSuccess(res, { id: targetAccount.id }, successMessage);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles `GET /brand/dashboard`: retrieves aggregated brand metrics, active campaigns,
 * pending review queue, and viral clips in a single roundtrip Promise.all.
 *
 * @param req - Express request with authenticated account session.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export async function GetBrandDashboardSummary(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = req.account;
    if (!account) {
      SendError(res, BRAND_MESSAGES.AUTH_REQUIRED, 401);
      return;
    }

    if (account.role !== Role.BRAND && account.role !== Role.ADMIN) {
      SendError(res, BRAND_MESSAGES.UNAUTHORIZED_ROLE, 403);
      return;
    }

    const brand = await prisma.brand.findFirst({
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
      select: BRAND_DASHBOARD_BRAND_SELECT,
    });

    if (!brand) {
      SendError(res, BRAND_MESSAGES.BRAND_NOT_FOUND, 404);
      return;
    }

    const walletPromise = prisma.wallet.findFirst({
      where: {
        accountId: account.sub,
        status: Status.ACTIVE,
      },
      select: {
        balance: true,
      },
    });

    const totalCampaignsCountPromise = prisma.campaign.count({
      where: {
        brandId: brand.id,
        status: Status.ACTIVE,
      },
    });

    const activeCampaignsCountPromise = prisma.campaign.count({
      where: {
        brandId: brand.id,
        status: Status.ACTIVE,
        campaignStatus: CampaignStatus.ACTIVE,
      },
    });

    const campaignStatusGroupsPromise = prisma.campaign.groupBy({
      by: ['campaignStatus'],
      where: {
        brandId: brand.id,
        status: Status.ACTIVE,
      },
      _count: {
        _all: true,
      },
    });

    const pendingReviewsCountPromise = prisma.submission.count({
      where: {
        status: Status.ACTIVE,
        submissionStatus: SubmissionStatus.PENDING_REVIEW,
        campaign: {
          brandId: brand.id,
          status: Status.ACTIVE,
        },
      },
    });

    const overallVerifiedSubmissionsPromise = prisma.submission.aggregate({
      where: {
        status: Status.ACTIVE,
        submissionStatus: {
          in: [SubmissionStatus.APPROVED, SubmissionStatus.VERIFIED],
        },
        campaign: {
          brandId: brand.id,
          status: Status.ACTIVE,
        },
      },
      _sum: {
        verifiedViews: true,
        earnings: true,
      },
    });

    const ongoingCampaignsPromise = prisma.campaign.findMany({
      where: {
        brandId: brand.id,
        status: Status.ACTIVE,
        campaignStatus: {
          in: [
            CampaignStatus.IN_REVIEW,
            CampaignStatus.REVISION,
            CampaignStatus.ACTIVE,
          ],
        },
      },
      select: {
        budget: true,
        submissions: {
          where: {
            status: Status.ACTIVE,
            submissionStatus: {
              in: [SubmissionStatus.APPROVED, SubmissionStatus.VERIFIED],
            },
          },
          select: {
            earnings: true,
          },
        },
      },
    });

    const pendingSubmissionsPromise = prisma.submission.findMany({
      where: {
        status: Status.ACTIVE,
        submissionStatus: SubmissionStatus.PENDING_REVIEW,
        campaign: {
          brandId: brand.id,
          status: Status.ACTIVE,
        },
      },
      orderBy: [
        { submittedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      take: BRAND_DASHBOARD_LIMITS.PENDING_REVIEWS_LIMIT,
      select: BRAND_DASHBOARD_PENDING_SUBMISSION_SELECT,
    });

    const activeCampaignsPromise = prisma.campaign.findMany({
      where: {
        brandId: brand.id,
        status: Status.ACTIVE,
        campaignStatus: CampaignStatus.ACTIVE,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: BRAND_DASHBOARD_LIMITS.ACTIVE_CAMPAIGNS_LIMIT,
      select: BRAND_DASHBOARD_ACTIVE_CAMPAIGN_SELECT,
    });

    const topClipsPromise = prisma.submission.findMany({
      where: {
        status: Status.ACTIVE,
        submissionStatus: {
          in: [SubmissionStatus.APPROVED, SubmissionStatus.VERIFIED],
        },
        campaign: {
          brandId: brand.id,
          status: Status.ACTIVE,
        },
      },
      orderBy: [
        { verifiedViews: 'desc' },
        { submittedAt: 'desc' },
      ],
      take: BRAND_DASHBOARD_LIMITS.TOP_CLIPS_LIMIT,
      select: BRAND_DASHBOARD_TOP_CLIP_SELECT,
    });

    const [
      wallet,
      totalCampaignsCount,
      activeCampaignsCount,
      pendingReviewsCount,
      overallVerifiedSubmissions,
      ongoingCampaigns,
      rawPendingSubmissions,
      rawActiveCampaigns,
      rawTopClips,
      rawStatusCounts,
    ] = await Promise.all([
      walletPromise,
      totalCampaignsCountPromise,
      activeCampaignsCountPromise,
      pendingReviewsCountPromise,
      overallVerifiedSubmissionsPromise,
      ongoingCampaignsPromise,
      pendingSubmissionsPromise,
      activeCampaignsPromise,
      topClipsPromise,
      campaignStatusGroupsPromise,
    ]);

    const statusCountsMap: Record<string, number> = {};
    for (const row of rawStatusCounts) {
      statusCountsMap[row.campaignStatus] = row._count._all;
    }

    const campaignStatusCounts: BrandDashboardCampaignStatusCounts = {
      draft: statusCountsMap[CampaignStatus.DRAFT] || 0,
      inReview:
        (statusCountsMap[CampaignStatus.IN_REVIEW] || 0) +
        (statusCountsMap[CampaignStatus.AWAITING_PAYMENT] || 0),
      revision: statusCountsMap[CampaignStatus.REVISION] || 0,
      active: statusCountsMap[CampaignStatus.ACTIVE] || 0,
      finished: statusCountsMap[CampaignStatus.FINISHED] || 0,
      total: totalCampaignsCount,
    };

    const escrowLockedBalance = ongoingCampaigns.reduce((acc, c) => {
      const budget = Number(c.budget || 0);
      const earned = c.submissions.reduce(
        (sum, s) => sum + Number(s.earnings || 0),
        0,
      );
      const unspent = Math.max(0, budget - earned);
      return acc + unspent;
    }, 0);

    const pendingSubmissions: BrandDashboardPendingSubmission[] =
      rawPendingSubmissions.map((row) => {
        const item: BrandDashboardPendingSubmission = {
          id: row.id,
          campaignId: row.campaignId,
          creatorId: row.creatorId,
          draftVideoUrl: row.draftVideoUrl,
          liveVideoUrl: row.liveVideoUrl,
          thumbnailUrl: row.thumbnailUrl,
          videoCaption: row.videoCaption,
          submissionStatus: row.submissionStatus,
          reviewNote: row.reviewNote,
          verifiedViews: row.verifiedViews,
          earnings: row.earnings.toString(),
          submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
          campaign: {
            id: row.campaign.id,
            title: row.campaign.title,
          },
          creator: {
            id: row.creator.id,
            fullName: row.creator.fullName,
            avatarUrl: row.creator.avatarUrl,
          },
          socialAccount: row.socialAccount,
        };
        return item;
      });

    const activeCampaigns: BrandDashboardActiveCampaign[] = rawActiveCampaigns.map(
      (camp) => {
        const budget = Number(camp.budget || 0);
        const spent = camp.submissions
          .filter(
            (s) =>
              s.submissionStatus === SubmissionStatus.APPROVED ||
              s.submissionStatus === SubmissionStatus.VERIFIED,
          )
          .reduce((sum, s) => sum + Number(s.earnings || 0), 0);
        const verifiedViews = camp.submissions.reduce(
          (sum, s) => sum + (s.verifiedViews || 0),
          0,
        );
        const totalSubmissionsCount = camp.submissions.filter(
          (s) => s.submissionStatus !== SubmissionStatus.JOINED,
        ).length;
        const pendingSubmissionsCount = camp.submissions.filter(
          (s) => s.submissionStatus === SubmissionStatus.PENDING_REVIEW,
        ).length;
        const progressPercent =
          budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

        const campaignItem: BrandDashboardActiveCampaign = {
          id: camp.id,
          title: camp.title,
          category: camp.campaignCategory,
          cpm: Number(camp.cpm || 0),
          budget,
          spent,
          verifiedViews,
          totalSubmissionsCount,
          pendingSubmissionsCount,
          progressPercent,
          startDate: camp.startDate ? camp.startDate.toISOString() : null,
          endDate: camp.endDate ? camp.endDate.toISOString() : null,
        };
        return campaignItem;
      },
    );

    const topClips: BrandDashboardTopClip[] = rawTopClips.map((clip) => {
      const topClipItem: BrandDashboardTopClip = {
        id: clip.id,
        campaignId: clip.campaignId,
        campaignTitle: clip.campaign.title,
        creatorName: clip.creator.fullName,
        creatorAvatarUrl: clip.creator.avatarUrl,
        socialUsername: clip.socialAccount?.username || '',
        socialAvatarUrl: clip.socialAccount?.avatarUrl || null,
        videoThumbnailUrl: clip.thumbnailUrl,
        liveVideoUrl: clip.liveVideoUrl,
        verifiedViews: clip.verifiedViews,
        earnings: Number(clip.earnings || 0),
      };
      return topClipItem;
    });

    const summary: BrandDashboardResponse = {
      brand: {
        id: brand.id,
        companyName: brand.companyName,
        logoUrl: brand.logoUrl,
      },
      metrics: {
        totalVerifiedViews: overallVerifiedSubmissions._sum.verifiedViews ?? 0,
        totalSpent: Number(overallVerifiedSubmissions._sum.earnings ?? 0),
        activeCampaignsCount,
        pendingReviewsCount,
        walletActiveBalance: wallet ? Number(wallet.balance) : 0,
        escrowLockedBalance,
        campaignStatusCounts,
      },
      pendingSubmissions,
      activeCampaigns,
      topClips,
      hasAnyCampaigns: totalCampaignsCount > 0,
    };

    SendSuccess(res, summary, BRAND_DASHBOARD_MESSAGES.SUMMARY_FETCH_SUCCESS);
  } catch (err) {
    next(err);
  }
}
