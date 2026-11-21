import { Readable } from 'node:stream';
import { TransformStream } from 'node:stream/web';
import type { Request } from 'express';
import { Prisma } from '../../generated/prisma/client.js';
import { CampaignStatus, PaymentStatus, Role, Status, WalletTransactionType } from '../../generated/prisma/enums.js';
import type { AuthPayload } from '../../middleware/auth.middleware.js';
import {
  CAMPAIGN_FIELD_LIMITS,
  CAMPAIGN_MESSAGES,
  DEFAULT_CAMPAIGN_STORAGE_BUCKET,
  SCALAR_FIELDS,
  WALLET_PAYMENT_DESTINATION_ACCOUNT,
  WALLET_PAYMENT_DESTINATION_BANK,
} from './campaign.constants.js';
import type {
  CampaignBriefInput,
  CampaignEditInput,
  CampaignImageUploadOptions,
  CampaignImageUploadResult,
  CampaignMaterialsInput,
  CampaignQueryInput,
  CampaignSortOption,
  EnrichCampaignEscrowOptions,
  ExecuteBankTransferConfirmParams,
  ExecuteCampaignSubmissionParams,
  ExecuteVerifyCampaignPaymentParams,
  ExecuteWalletPaymentParams,
} from './campaign.types.js';

/**
 * Expected HTTP error thrown inside Prisma interactive transactions so PostgreSQL rolls back
 * partial writes cleanly before translating to a standardized API error response.
 */
export class CampaignTransactionError extends Error {
  public readonly statusCode: number;

  /**
   * Creates a typed transaction-abort error with an HTTP status code and localized message.
   *
   * @param statusCode - HTTP response status code (e.g. 400, 404, 409).
   * @param message - Localized API error message.
   */
  public constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Copies `value` into `target[key]` when it is defined, so only the fields
 * the request actually sent end up in the update payload.
 *
 * @param target - The target object being populated.
 * @param key - The property key on the target object.
 * @param value - The value to assign if not undefined.
 */
function SetField<Target, Key extends keyof Target>(
  target: Target,
  key: Key,
  value: Target[Key] | undefined,
): void {
  if (value !== undefined) {
    target[key] = value;
  }
}

/**
 * Builds the nested Prisma upsert object for the campaign brief relation.
 * When a campaign has no brief yet, all sent fields are created. When a brief
 * already exists, only the sent fields are updated.
 *
 * @param brief - The validated campaign brief input.
 * @returns The Prisma nested upsert input for the campaign brief relation.
 */
function BuildCampaignBriefUpsert(
  brief: CampaignBriefInput,
): Prisma.CampaignBriefUpsertWithoutCampaignInput {
  const createData: Prisma.CampaignBriefCreateWithoutCampaignInput = {
    purpose: brief.purpose,
    keyMessage: brief.keyMessage,
    narration: brief.narration,
    impression: brief.impression,
    callToAction: brief.callToAction,
    requiredCaption: brief.requiredCaption,
    hashtags: brief.hashtags,
    mentionTags: brief.mentionTags,
    dos: brief.dos,
    donts: brief.donts,
    guidelines: brief.guidelines,
    status: Status.ACTIVE,
  };

  const updateData: Prisma.CampaignBriefUpdateWithoutCampaignInput = {
    status: Status.ACTIVE,
  };

  for (const [key, value] of Object.entries(createData)) {
    SetField(
      updateData,
      key as keyof Prisma.CampaignBriefUpdateWithoutCampaignInput,
      value,
    );
  }

  const upsert: Prisma.CampaignBriefUpsertWithoutCampaignInput = {
    create: createData,
    update: updateData,
  };

  return upsert;
}

/**
 * Builds the nested Prisma update object for campaign materials.
 * Soft-deletes all existing active materials by marking them DELETED, then
 * creates the new replacement materials in the same atomic operation.
 *
 * @param materials - The list of campaign materials to set.
 * @returns The Prisma nested update input for the campaign materials relation.
 */
function BuildCampaignMaterialsUpdate(
  materials: CampaignMaterialsInput,
): Prisma.CampaignMaterialUpdateManyWithoutCampaignNestedInput {
  const materialsQuery: Prisma.CampaignMaterialUpdateManyWithoutCampaignNestedInput =
    {
      updateMany: {
        where: { status: Status.ACTIVE },
        data: { status: Status.DELETED },
      },
      create: materials.map((material) => ({
        type: material.type,
        name: material.name,
        url: material.url,
      })),
    };

  return materialsQuery;
}

/**
 * Builds the Prisma update object for the edit endpoint. Fields the body did
 * not send stay absent, so only the sent fields are written. Scalar attributes
 * (such as basic campaign info, CPM, views, budget, and campaign dates) are copied
 * directly. When materials is sent, the current active materials are soft deleted
 * (status DELETED) and the new list is created, all inside the same campaign
 * update so the replacement is atomic. When brief is sent, it is upserted into the
 * campaign brief relation.
 *
 * @param input - The validated edit body.
 * @returns The fields to update on the campaign.
 */
export function BuildCampaignEditFields(
  input: CampaignEditInput,
): Prisma.CampaignUpdateInput {
  const campaignQuery: Prisma.CampaignUpdateInput = {};

  for (const key of SCALAR_FIELDS) {
    SetField(campaignQuery, key, input[key]);
  }

  if (input.materials?.length) {
    const materialsUpdate = BuildCampaignMaterialsUpdate(input.materials);
    campaignQuery.materials = materialsUpdate;
  }

  if (input.brief) {
    const briefUpsert = BuildCampaignBriefUpsert(input.brief);
    campaignQuery.brief = {
      upsert: briefUpsert,
    };
  }

  return campaignQuery;
}

/**
 * Reconstructs the Prisma `where` clause for querying campaigns based on user role,
 * soft-delete requirements, keyword search, and filters.
 *
 * @param account - The authenticated account extracted from the JWT session.
 * @param query - Validated campaign query parameters.
 * @returns The structured Prisma campaign `where` object.
 */
export function BuildCampaignsWhereClause(
  account: AuthPayload,
  query: CampaignQueryInput,
): Prisma.CampaignWhereInput {
  // Base soft-delete filter: both Campaign and Brand must have status ACTIVE across all roles
  const brandWhere: Prisma.BrandWhereInput = {
    status: Status.ACTIVE,
  };

  const whereClause: Prisma.CampaignWhereInput = {
    status: Status.ACTIVE,
    brand: brandWhere,
  };

  // Enforce tenant boundary and role-based lifecycle filtering:
  // - Brand: views their own campaigns (across any lifecycle status, with optional status filter)
  // - Creator: views only campaigns with active lifecycle status
  // - Admin: views all active campaigns with optional status filter
  switch (account.role) {
    case Role.BRAND: {
      brandWhere.accountId = account.sub;

      if (query.campaignStatus) {
        whereClause.campaignStatus = query.campaignStatus;
      }

      break;
    }

    case Role.CREATOR: {
      const now = new Date();
      whereClause.campaignStatus = CampaignStatus.ACTIVE;
      whereClause.AND = [
        {
          OR: [{ endDate: null }, { endDate: { gt: now } }],
        },
      ];
      break;
    }

    case Role.ADMIN: {
      if (query.campaignStatus) {
        whereClause.campaignStatus = query.campaignStatus;
      }

      break;
    }
  }

  // Keyword search in title or description (case-insensitive)
  if (query.search && query.search.length) {
    whereClause.OR = [
      {
        title: {
          contains: query.search,
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: query.search,
          mode: 'insensitive',
        },
      },
    ];
  }

  // Category filter
  if (query.category) {
    whereClause.campaignCategory = query.category;
  }

  // Campaign type filter
  if (query.campaignType) {
    whereClause.campaignType = query.campaignType;
  }

  // Platform filter
  if (query.platform) {
    whereClause.platform = query.platform;
  }

  return whereClause;
}

/**
 * Constructs the Prisma `orderBy` array according to the selected sort strategy.
 * Includes secondary ordering to guarantee deterministic pagination.
 *
 * @param sort - The validated sort option key.
 * @returns An array of Prisma order criteria.
 */
export function BuildCampaignsOrderBy(
  sort: CampaignSortOption,
): Prisma.CampaignOrderByWithRelationInput[] {
  if (sort === 'highest_cpm') {
    const orderByCpm: Prisma.CampaignOrderByWithRelationInput[] = [
      { cpm: { sort: 'desc', nulls: 'last' } },
      { createdAt: 'desc' },
    ];
    return orderByCpm;
  }

  if (sort === 'lowest_cpm') {
    const orderByLowestCpm: Prisma.CampaignOrderByWithRelationInput[] = [
      { cpm: { sort: 'asc', nulls: 'last' } },
      { createdAt: 'desc' },
    ];
    return orderByLowestCpm;
  }

  if (sort === 'highest_total_budget') {
    const orderByBudget: Prisma.CampaignOrderByWithRelationInput[] = [
      { budget: { sort: 'desc', nulls: 'last' } },
      { createdAt: 'desc' },
    ];
    return orderByBudget;
  }

  if (sort === 'highest_maximum_views') {
    const orderByViews: Prisma.CampaignOrderByWithRelationInput[] = [
      { maxViews: { sort: 'desc', nulls: 'last' } },
      { createdAt: 'desc' },
    ];
    return orderByViews;
  }

  const orderByLatest: Prisma.CampaignOrderByWithRelationInput[] = [
    { createdAt: 'desc' },
    { id: 'desc' },
  ];
  return orderByLatest;
}

/**
 * Generates a random 3-digit verification unique code between 100 and 999.
 *
 * @returns Three-digit integer unique code.
 */
export function GeneratePaymentUniqueCode(): number {
  const code = Math.floor(100 + Math.random() * 900);
  return code;
}

/**
 * Generates a standardized transaction reference code for Klipday wallet logs.
 *
 * @returns Formatted reference code string (e.g. TXN-XXXXXX-XXXX).
 */
export function GenerateWalletTransactionReferenceCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const refCode = `TXN-${timestamp}-${randomSuffix}`;
  return refCode;
}

/**
 * Computes real-time `allocatedBudget`, `remainingBudget`, and `remainingBudgetPercent`
 * from approved/verified submission rewards and strips the internal `submissions` relation array
 * before returning the campaign DTO.
 * When `options.hideBudgetAmounts` is true (e.g. for CREATOR accounts), raw nominal fields
 * (`budget`, `allocatedBudget`, `remainingBudget`) are completely omitted from the payload
 * so only `remainingBudgetPercent` (0-100%) is exposed over the network.
 *
 * @param campaign - Raw Prisma campaign payload from `CAMPAIGN_CARD_ESCROW_SELECT` or `CAMPAIGN_DETAIL_ESCROW_SELECT`.
 * @param options - Optional serialization flags controlling budget amount visibility.
 * @returns Enriched campaign object with escrow metrics (or percentage-only when hidden).
 */
export function EnrichCampaignEscrowMetrics<
  TCampaign extends {
    budget?: Prisma.Decimal | number | null;
    payments?: unknown;
    submissions?: Array<{ earnings: Prisma.Decimal | number }>;
  },
>(
  campaign: TCampaign,
  options?: EnrichCampaignEscrowOptions,
): Omit<TCampaign, 'submissions' | 'budget' | 'payments'> & {
  budget?: Prisma.Decimal | number | null;
  payments?: TCampaign['payments'];
  allocatedBudget?: number;
  remainingBudget?: number;
  remainingBudgetPercent?: number;
} {
  const hideBudgetAmounts = Boolean(options?.hideBudgetAmounts);
  const { submissions, budget, payments, ...restWithoutBudget } = campaign;

  if (!Array.isArray(submissions)) {
    if (hideBudgetAmounts) {
      return restWithoutBudget;
    }
    return {
      ...restWithoutBudget,
      budget,
      ...(payments !== undefined ? { payments } : {}),
    };
  }

  const rawBudget = budget !== null && budget !== undefined
    ? Number(budget)
    : 0;
  const safeBudget = Number.isFinite(rawBudget) ? Math.max(0, Math.floor(rawBudget)) : 0;

  const allocatedBudget = submissions.reduce((sum, item) => {
    const rawEarnings = item.earnings !== null && item.earnings !== undefined
      ? Number(item.earnings)
      : 0;
    const safeEarnings = Number.isFinite(rawEarnings)
      ? Math.max(0, Math.floor(rawEarnings))
      : 0;
    return sum + safeEarnings;
  }, 0);

  const remainingBudget = Math.max(0, safeBudget - allocatedBudget);
  const remainingBudgetPercent =
    safeBudget > 0
      ? Math.max(0, Math.min(100, Math.round((remainingBudget / safeBudget) * 100)))
      : 0;

  if (hideBudgetAmounts) {
    const sanitizedForCreator = {
      ...restWithoutBudget,
      remainingBudgetPercent,
    };
    return sanitizedForCreator;
  }

  const enriched = {
    ...restWithoutBudget,
    budget,
    ...(payments !== undefined ? { payments } : {}),
    allocatedBudget,
    remainingBudget,
    remainingBudgetPercent,
  };

  return enriched;
}

/**
 * Inspects initial file bytes to identify genuine JPEG, PNG, or WEBP signatures,
 * blocking Content-Type spoofing (e.g. HTML, SVG, or executable payloads labeled as `image/png`).
 *
 * @param bytes - Leading header bytes buffered from the upload stream.
 * @returns Detected canonical extension (`jpg` | `png` | `webp`), or `null` when unrecognized.
 */
export function DetectImageMagicBytes(bytes: Uint8Array): 'jpg' | 'png' | 'webp' | null {
  // JPEG SOI marker: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpg';
  }

  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'png';
  }

  // WEBP RIFF container: "RIFF" (0..3) + "WEBP" (8..11)
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'webp';
  }

  return null;
}

/**
 * Concatenates small buffered header chunks into a single Uint8Array for magic-byte verification.
 *
 * @param chunks - Array of header chunks captured before reaching header inspection threshold.
 * @param totalLength - Combined byte count across all chunks.
 * @returns Single contiguous Uint8Array containing the header bytes.
 */
function MergeHeaderChunks(chunks: Uint8Array[], totalLength: number): Uint8Array {
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

/**
 * Extracts a safe nested Supabase object path for a given campaign folder when a public URL
 * belongs to this application's Supabase Storage bucket.
 *
 * @param publicUrl - Candidate public asset URL stored on a campaign record.
 * @param campaignId - Owning campaign identifier used to scope deletions strictly to that campaign folder.
 * @returns Relative storage object path when valid and scoped, otherwise null.
 */
export function ExtractSupabaseObjectPath(publicUrl: string | null | undefined, campaignId: string): string | null {
  if (!publicUrl) {
    return null;
  }

  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_CAMPAIGN_STORAGE_BUCKET;

  if (!supabaseUrl) {
    return null;
  }

  const publicPrefix = `${supabaseUrl}/storage/v1/object/public/${bucket}/`;
  if (!publicUrl.startsWith(publicPrefix)) {
    return null;
  }

  const relativePath = publicUrl.slice(publicPrefix.length);
  const campaignPrefix = `campaigns/${campaignId}/`;

  if (!relativePath.startsWith(campaignPrefix) || relativePath.includes('..')) {
    return null;
  }

  return relativePath;
}

/**
 * Best-effort asynchronous deletion of an orphaned image asset from Supabase Storage
 * when a campaign thumbnail is replaced on the same campaign. Never throws on network errors.
 *
 * @param previousUrl - Previously stored thumbnail public URL.
 * @param campaignId - Campaign identifier scoping allowed object deletions.
 */
export async function DeleteSupabaseObjectIfInBucket(
  previousUrl: string | null | undefined,
  campaignId: string,
): Promise<void> {
  const objectPath = ExtractSupabaseObjectPath(previousUrl, campaignId);
  if (!objectPath) {
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_CAMPAIGN_STORAGE_BUCKET;

  if (!supabaseUrl || !serviceRoleKey) {
    return;
  }

  try {
    const deleteUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`;
    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.warn(`[Supabase Storage Cleanup] Failed (${response.status}) for ${objectPath}:`, errorText);
    }
  } catch (cleanupError) {
    console.warn(`[Supabase Storage Cleanup] Error deleting ${objectPath}:`, cleanupError);
  }
}

/**
 * Unwraps nested stream errors thrown through Undici `fetch` (often wrapped in `TypeError.cause`).
 *
 * @param error - Unknown caught error object.
 * @returns Known stream validation error token or null.
 */
function ExtractStreamValidationCode(error: unknown): 'FILE_SIZE_EXCEEDED' | 'INVALID_IMAGE_SIGNATURE' | null {
  if (!(error instanceof Error)) {
    return null;
  }

  if (error.message === 'FILE_SIZE_EXCEEDED' || error.message === 'INVALID_IMAGE_SIGNATURE') {
    return error.message;
  }

  const errorWithCause = error as Error & { cause?: unknown };
  if (errorWithCause.cause instanceof Error) {
    const causeMsg = errorWithCause.cause.message;
    if (causeMsg === 'FILE_SIZE_EXCEEDED' || causeMsg === 'INVALID_IMAGE_SIGNATURE') {
      return causeMsg;
    }
  }

  return null;
}

/**
 * Zero-dependency binary stream uploader to Supabase Storage with Content-Type validation,
 * Content-Length enforcement, byte-limit DoS protection, and magic-byte header verification.
 *
 * @param req - Incoming Express request stream.
 * @param options - Upload validation and Supabase folder configuration.
 * @returns Discriminated result containing either the uploaded `publicUrl` or HTTP error details.
 */
export async function StreamCampaignImageUpload(
  req: Request,
  options: CampaignImageUploadOptions,
): Promise<CampaignImageUploadResult> {
  const rawContentType = req.headers['content-type']?.split(';')[0]?.trim().toLowerCase() ?? '';
  const fileExtension = options.allowedMimeTypes[rawContentType];

  if (!fileExtension) {
    return {
      ok: false,
      statusCode: 400,
      message: CAMPAIGN_MESSAGES.UNSUPPORTED_FILE_TYPE,
    };
  }

  const contentLength = Number(req.headers['content-length']);
  if (!contentLength || Number.isNaN(contentLength)) {
    return {
      ok: false,
      statusCode: 411,
      message: CAMPAIGN_MESSAGES.CONTENT_LENGTH_REQUIRED,
    };
  }

  if (contentLength > options.maxSizeBytes) {
    return {
      ok: false,
      statusCode: 400,
      message: CAMPAIGN_MESSAGES.FILE_SIZE_EXCEEDED,
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_CAMPAIGN_STORAGE_BUCKET;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      ok: false,
      statusCode: 500,
      message: CAMPAIGN_MESSAGES.STORAGE_CONFIG_MISSING,
    };
  }

  let bytesReceived = 0;
  let headerValidated = false;
  let headerBufferedLength = 0;
  let headerChunks: Uint8Array[] = [];

  const streamValidator = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      bytesReceived += chunk.byteLength;
      if (bytesReceived > options.maxSizeBytes) {
        controller.error(new Error('FILE_SIZE_EXCEEDED'));
        return;
      }

      if (headerValidated) {
        controller.enqueue(chunk);
        return;
      }

      headerChunks.push(chunk);
      headerBufferedLength += chunk.byteLength;

      if (headerBufferedLength >= CAMPAIGN_FIELD_LIMITS.IMAGE_SIGNATURE_HEADER_BYTES) {
        const mergedHeader = MergeHeaderChunks(headerChunks, headerBufferedLength);
        const detectedExt = DetectImageMagicBytes(mergedHeader);
        if (detectedExt !== fileExtension) {
          controller.error(new Error('INVALID_IMAGE_SIGNATURE'));
          return;
        }

        headerValidated = true;
        headerChunks = [];
        controller.enqueue(mergedHeader);
      }
    },
    flush(controller) {
      if (headerValidated) {
        return;
      }

      if (headerBufferedLength === 0) {
        controller.error(new Error('INVALID_IMAGE_SIGNATURE'));
        return;
      }

      const mergedHeader = MergeHeaderChunks(headerChunks, headerBufferedLength);
      const detectedExt = DetectImageMagicBytes(mergedHeader);
      if (detectedExt !== fileExtension) {
        controller.error(new Error('INVALID_IMAGE_SIGNATURE'));
        return;
      }

      headerValidated = true;
      headerChunks = [];
      controller.enqueue(mergedHeader);
    },
  });

  try {
    const webStream = Readable.toWeb(req).pipeThrough(streamValidator);
    const storagePath = `campaigns/${options.campaignId}/${options.folderPrefix}-${Date.now()}.${fileExtension}`;
    const cleanSupabaseUrl = supabaseUrl.replace(/\/+$/, '');
    const targetUrl = `${cleanSupabaseUrl}/storage/v1/object/${bucket}/${storagePath}`;

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
      console.error('[Supabase Storage Upload Error]', supabaseResponse.status, errorDetail);
      return {
        ok: false,
        statusCode: 502,
        message: CAMPAIGN_MESSAGES.STORAGE_UPLOAD_FAILED,
      };
    }

    const publicUrl = `${cleanSupabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
    return { ok: true, publicUrl };
  } catch (error) {
    const validationCode = ExtractStreamValidationCode(error);
    if (validationCode === 'FILE_SIZE_EXCEEDED') {
      return {
        ok: false,
        statusCode: 400,
        message: CAMPAIGN_MESSAGES.FILE_SIZE_EXCEEDED,
      };
    }
    if (validationCode === 'INVALID_IMAGE_SIGNATURE') {
      return {
        ok: false,
        statusCode: 400,
        message: CAMPAIGN_MESSAGES.INVALID_IMAGE_SIGNATURE,
      };
    }

    throw error;
  }
}

/**
 * Executes campaign submission transition and initial PENDING invoice provisioning
 * inside a lean transaction holding row locks strictly for state & payment writes.
 *
 * @param tx - Active Prisma transaction client.
 * @param params - Campaign submission state and invoice details.
 * @returns Object indicating whether the campaign bypassed payment via already-approved revision.
 */
export async function ExecuteCampaignSubmissionInTx(
  tx: Prisma.TransactionClient,
  params: ExecuteCampaignSubmissionParams,
): Promise<{ isPaidRevision: boolean }> {
  const existingPayment = await tx.campaignPayment.findFirst({
    where: {
      campaignId: params.campaignId,
      status: Status.ACTIVE,
    },
    orderBy: { createdAt: 'desc' as const },
  });

  const isPaidRevision =
    params.currentStatus === CampaignStatus.REVISION &&
    existingPayment?.paymentStatus === PaymentStatus.APPROVED;

  const targetStatus = isPaidRevision ? CampaignStatus.IN_REVIEW : CampaignStatus.AWAITING_PAYMENT;

  const claimed = await tx.campaign.updateMany({
    where: {
      id: params.campaignId,
      status: Status.ACTIVE,
      campaignStatus: params.currentStatus,
    },
    data: {
      campaignStatus: targetStatus,
      adminNote: null,
    },
  });

  if (claimed.count === 0) {
    throw new CampaignTransactionError(409, CAMPAIGN_MESSAGES.PAYMENT_RACE_CONFLICT);
  }

  if (!isPaidRevision) {
    if (!existingPayment || existingPayment.paymentStatus === PaymentStatus.REJECTED) {
      const uniqueCode = GeneratePaymentUniqueCode();
      const totalPayable = params.budgetAmount + uniqueCode;

      await tx.campaignPayment.create({
        data: {
          campaignId: params.campaignId,
          amount: params.budgetAmount,
          uniqueCode,
          totalPayable,
          destinationBank: params.destinationBank,
          destinationAccount: params.destinationAccount,
          paymentStatus: PaymentStatus.PENDING,
          status: Status.ACTIVE,
        },
      });
    } else if (existingPayment.paymentStatus === PaymentStatus.PENDING) {
      const validCode =
        existingPayment.uniqueCode >= 100 && existingPayment.uniqueCode <= 999
          ? existingPayment.uniqueCode
          : GeneratePaymentUniqueCode();
      const totalPayable = params.budgetAmount + validCode;

      await tx.campaignPayment.update({
        where: { id: existingPayment.id },
        data: {
          amount: params.budgetAmount,
          uniqueCode: validCode,
          totalPayable,
          destinationBank: params.destinationBank,
          destinationAccount: params.destinationAccount,
        },
      });
    }
  }

  return { isPaidRevision };
}

/**
 * Executes wallet-based campaign payment in 4 pure write operations inside a lean transaction:
 * 1) conditional campaign status + budget lock claim (`updateMany`),
 * 2) conditional wallet debit returning post-debit balance (`updateManyAndReturn`),
 * 3) wallet ledger transaction insert, and
 * 4) campaign payment approval update or insert.
 *
 * @param tx - Active Prisma transaction client.
 * @param params - Pre-validated campaign, account, budget, and latest payment metadata.
 */
export async function ExecuteWalletPaymentInTx(
  tx: Prisma.TransactionClient,
  params: ExecuteWalletPaymentParams,
): Promise<void> {
  const budgetDecimal = new Prisma.Decimal(params.budget);

  const claimedCampaign = await tx.campaign.updateMany({
    where: {
      id: params.campaignId,
      status: Status.ACTIVE,
      campaignStatus: CampaignStatus.AWAITING_PAYMENT,
      budget: budgetDecimal,
    },
    data: {
      campaignStatus: CampaignStatus.IN_REVIEW,
      adminNote: null,
    },
  });

  if (claimedCampaign.count === 0) {
    throw new CampaignTransactionError(409, CAMPAIGN_MESSAGES.PAYMENT_RACE_CONFLICT);
  }

  const debitedWallets = await tx.wallet.updateManyAndReturn({
    select: { id: true, balance: true },
    where: {
      accountId: params.accountId,
      status: Status.ACTIVE,
      balance: { gte: budgetDecimal },
    },
    data: {
      balance: { decrement: budgetDecimal },
    },
  });

  const debitedWallet = debitedWallets[0];
  if (!debitedWallet) {
    throw new CampaignTransactionError(400, CAMPAIGN_MESSAGES.INSUFFICIENT_WALLET_BALANCE);
  }

  const balanceAfter = Number(debitedWallet.balance);
  const balanceBefore = balanceAfter + params.budget;
  const refCode = GenerateWalletTransactionReferenceCode();

  await tx.walletTransaction.create({
    data: {
      referenceCode: refCode,
      walletId: debitedWallet.id,
      type: WalletTransactionType.CAMPAIGN_PAYMENT,
      amount: params.budget,
      balanceBefore,
      balanceAfter,
      description: `Pembayaran kampanye "${params.campaignTitle ?? 'Klipday'}" via saldo dompet`,
      campaignId: params.campaignId,
      status: Status.ACTIVE,
    },
  });

  const approvedPaymentPayload = {
    paymentStatus: PaymentStatus.APPROVED,
    amount: params.budget,
    uniqueCode: 0,
    totalPayable: params.budget,
    destinationBank: WALLET_PAYMENT_DESTINATION_BANK,
    destinationAccount: WALLET_PAYMENT_DESTINATION_ACCOUNT,
    verifiedByAdminId: null,
    verifiedAt: new Date(),
    rejectionReason: null,
  };

  if (params.latestPayment) {
    const updatedPayment = await tx.campaignPayment.updateMany({
      where: {
        id: params.latestPayment.id,
        status: Status.ACTIVE,
        paymentStatus: params.latestPayment.paymentStatus,
      },
      data: approvedPaymentPayload,
    });

    if (updatedPayment.count === 0) {
      throw new CampaignTransactionError(409, CAMPAIGN_MESSAGES.PAYMENT_RACE_CONFLICT);
    }
  } else {
    await tx.campaignPayment.create({
      data: {
        campaignId: params.campaignId,
        ...approvedPaymentPayload,
        status: Status.ACTIVE,
      },
    });
  }
}

/**
 * Atomically transitions an AWAITING_PAYMENT campaign to IN_REVIEW and persists bank transfer
 * proof inside a lean 2-write transaction without holding locks during detail joins.
 *
 * @param tx - Active Prisma transaction client.
 * @param params - Pre-validated bank transfer confirmation parameters.
 */
export async function ExecuteBankTransferConfirmInTx(
  tx: Prisma.TransactionClient,
  params: ExecuteBankTransferConfirmParams,
): Promise<void> {
  const claimedCampaign = await tx.campaign.updateMany({
    where: {
      id: params.campaignId,
      status: Status.ACTIVE,
      campaignStatus: CampaignStatus.AWAITING_PAYMENT,
      budget: new Prisma.Decimal(params.budgetAmount),
    },
    data: {
      campaignStatus: CampaignStatus.IN_REVIEW,
      adminNote: null,
    },
  });

  if (claimedCampaign.count === 0) {
    throw new CampaignTransactionError(409, CAMPAIGN_MESSAGES.PAYMENT_RACE_CONFLICT);
  }

  const submittedPaymentPayload = {
    amount: params.budgetAmount,
    uniqueCode: params.uniqueCode,
    totalPayable: params.totalPayable,
    destinationBank: params.destinationBank,
    destinationAccount: params.destinationAccount,
    senderProviderName: params.senderProviderName,
    senderAccountName: params.senderAccountName,
    transferProofUrl: params.transferProofUrl,
    paymentStatus: PaymentStatus.SUBMITTED,
    verifiedByAdminId: null,
    verifiedAt: null,
    rejectionReason: null,
  };

  if (params.latestPaymentId) {
    const updatedPayment = await tx.campaignPayment.updateMany({
      where: {
        id: params.latestPaymentId,
        status: Status.ACTIVE,
        paymentStatus: { in: [PaymentStatus.PENDING, PaymentStatus.REJECTED] },
      },
      data: submittedPaymentPayload,
    });

    if (updatedPayment.count === 0) {
      throw new CampaignTransactionError(409, CAMPAIGN_MESSAGES.PAYMENT_RACE_CONFLICT);
    }
  } else {
    await tx.campaignPayment.create({
      data: {
        campaignId: params.campaignId,
        ...submittedPaymentPayload,
        status: Status.ACTIVE,
      },
    });
  }
}

/**
 * Executes administrative verification of a submitted manual bank transfer inside a lean transaction
 * (2–3 writes only, keeping detail queries outside the lock window).
 *
 * @param tx - Active Prisma transaction client.
 * @param params - Verification action, admin ID, payment, and optional wallet info.
 */
export async function ExecuteVerifyCampaignPaymentInTx(
  tx: Prisma.TransactionClient,
  params: ExecuteVerifyCampaignPaymentParams,
): Promise<void> {
  const isApprove = params.action === 'APPROVE';
  const targetStatus = isApprove ? CampaignStatus.ACTIVE : CampaignStatus.AWAITING_PAYMENT;
  const targetPaymentStatus = isApprove ? PaymentStatus.APPROVED : PaymentStatus.REJECTED;

  const claimedCampaign = await tx.campaign.updateMany({
    where: {
      id: params.campaignId,
      status: Status.ACTIVE,
      campaignStatus: CampaignStatus.IN_REVIEW,
    },
    data: {
      campaignStatus: targetStatus,
      adminNote: isApprove ? null : params.rejectionReason,
    },
  });

  if (claimedCampaign.count === 0) {
    throw new CampaignTransactionError(409, CAMPAIGN_MESSAGES.PAYMENT_RACE_CONFLICT);
  }

  const claimedPayment = await tx.campaignPayment.updateMany({
    where: {
      id: params.latestPayment.id,
      status: Status.ACTIVE,
      paymentStatus: PaymentStatus.SUBMITTED,
    },
    data: {
      paymentStatus: targetPaymentStatus,
      rejectionReason: isApprove ? null : params.rejectionReason,
      verifiedByAdminId: params.adminId,
      verifiedAt: new Date(),
    },
  });

  if (claimedPayment.count === 0) {
    throw new CampaignTransactionError(409, CAMPAIGN_MESSAGES.PAYMENT_RACE_CONFLICT);
  }

  if (isApprove && params.brandWallet) {
    const totalPayable = Number(params.latestPayment.totalPayable);
    const rawAmount =
      params.latestPayment.amount !== undefined && params.latestPayment.amount !== null
        ? Number(params.latestPayment.amount)
        : totalPayable - Number(params.latestPayment.uniqueCode ?? 0);
    const campaignAmount = rawAmount > 0 ? rawAmount : totalPayable;
    const uniqueCodeCredit = Math.max(0, totalPayable - campaignAmount);

    const balanceBefore = Number(params.brandWallet.balance);
    let balanceAfter = balanceBefore;

    if (uniqueCodeCredit > 0) {
      const updatedWallet = await tx.wallet.update({
        where: { id: params.brandWallet.id },
        data: { balance: { increment: new Prisma.Decimal(uniqueCodeCredit) } },
        select: { balance: true },
      });
      balanceAfter = Number(updatedWallet?.balance ?? balanceBefore + uniqueCodeCredit);
    }

    const refCode = GenerateWalletTransactionReferenceCode();
    await tx.walletTransaction.create({
      data: {
        referenceCode: refCode,
        walletId: params.brandWallet.id,
        type: WalletTransactionType.CAMPAIGN_PAYMENT,
        amount: new Prisma.Decimal(campaignAmount),
        balanceBefore: new Prisma.Decimal(balanceBefore),
        balanceAfter: new Prisma.Decimal(balanceAfter),
        description: `Pembayaran kampanye "${params.campaignTitle ?? 'Klipday'}" via transfer manual terverifikasi admin`,
        campaignId: params.campaignId,
        status: Status.ACTIVE,
      },
    });
  }
}


