import type { Prisma } from '../../generated/prisma/client.js';
import { CampaignStatus, Role, Status } from '../../generated/prisma/enums.js';
import type { AuthPayload } from '../../middleware/auth.middleware.js';
import { SCALAR_FIELDS } from './campaign.constants.js';
import type {
  CampaignBriefInput,
  CampaignEditInput,
  CampaignMaterialsInput,
  CampaignQueryInput,
  CampaignSortOption,
} from './campaign.types.js';

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
export function BuildCampaignBriefUpsert(
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
export function BuildCampaignMaterialsUpdate(
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
      whereClause.campaignStatus = CampaignStatus.ACTIVE;
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

