import type { Prisma } from '../../generated/prisma/client.js';
import { Status, SubmissionStatus } from '../../generated/prisma/enums.js';
import { ALL_STATUS_FILTER, SUBMISSION_SORT } from './submission.constants.js';
import type {
  CampaignSubmissionReviewItemDto,
  RawSubmissionInput,
  SubmissionDetailDto,
  SubmissionQueryInput,
} from './submission.types.js';

/**
 * Maps a Prisma submission row to a clean, strongly-typed SubmissionDetailDto.
 * Ensures Decimal earnings are consistently converted to strings and strips internal database fields.
 *
 * @param submission - Prisma submission row with optional relations.
 * @returns Serialized SubmissionDetailDto.
 */
export function FormatSubmissionResponse(submission: RawSubmissionInput): SubmissionDetailDto {
  const earningsString = submission.earnings.toString();
  const formatted: SubmissionDetailDto = {
    id: submission.id,
    campaignId: submission.campaignId,
    creatorId: submission.creatorId,
    draftVideoUrl: submission.draftVideoUrl,
    liveVideoUrl: submission.liveVideoUrl,
    thumbnailUrl: submission.thumbnailUrl,
    videoCaption: submission.videoCaption,
    submissionStatus: submission.submissionStatus,
    reviewNote: submission.reviewNote,
    verifiedViews: submission.verifiedViews,
    earnings: earningsString,
    submittedAt: submission.submittedAt,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
    socialAccount: submission.socialAccount ?? null,
  };
  return formatted;
}

/**
 * Maps a Prisma submission row with creator and social account relations into CampaignSubmissionReviewItemDto.
 *
 * @param row - Prisma submission row including creator and socialAccount.
 * @returns Serialized CampaignSubmissionReviewItemDto.
 */
export function FormatCampaignSubmissionReviewItem(row: {
  id: string;
  campaignId: string;
  creatorId: string;
  draftVideoUrl: string | null;
  liveVideoUrl: string | null;
  thumbnailUrl: string | null;
  videoCaption: string | null;
  submissionStatus: SubmissionStatus;
  reviewNote: string | null;
  verifiedViews: number;
  earnings: { toString(): string } | number | string;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  creator: { id: string; fullName: string; avatarUrl: string | null };
  socialAccount: { id: string; username: string; avatarUrl: string | null; followersCount: number } | null;
}): CampaignSubmissionReviewItemDto {
  const earningsString = row.earnings.toString();
  const item: CampaignSubmissionReviewItemDto = {
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
    earnings: earningsString,
    submittedAt: row.submittedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    creator: row.creator,
    socialAccount: row.socialAccount,
  };
  return item;
}

/**
 * Constructs a Prisma where clause for filtering campaign video submissions.
 *
 * @param campaignId - Target campaign UUID.
 * @param query - Validated query parameters.
 * @returns Prisma where object for submission queries.
 */
export function BuildSubmissionsWhereClause(
  campaignId: string,
  query: SubmissionQueryInput
): Prisma.SubmissionWhereInput {
  const where: Prisma.SubmissionWhereInput = {
    campaignId,
    status: Status.ACTIVE,
  };

  // Status filtering (default excludes JOINED creators without submitted videos)
  if (query.status && query.status !== ALL_STATUS_FILTER) {
    where.submissionStatus = query.status;
  } else {
    where.submissionStatus = { not: SubmissionStatus.JOINED };
  }

  // Case-insensitive search across caption, social account username, and creator full name
  if (query.search && query.search.trim().length > 0) {
    const term = query.search.trim();
    where.OR = [
      { videoCaption: { contains: term, mode: 'insensitive' } },
      { socialAccount: { username: { contains: term, mode: 'insensitive' } } },
      { creator: { fullName: { contains: term, mode: 'insensitive' } } },
    ];
  }

  return where;
}

/**
 * Determines the database sorting order based on the requested sort option.
 *
 * @param sort - Requested sort key ('latest', 'oldest', 'views_desc', 'views_asc').
 * @returns Prisma orderBy object.
 */
export function BuildSubmissionsOrderBy(sort?: string): Prisma.SubmissionOrderByWithRelationInput {
  if (sort === SUBMISSION_SORT.VIEWS_DESC) {
    return { verifiedViews: 'desc' };
  }
  if (sort === SUBMISSION_SORT.VIEWS_ASC) {
    return { verifiedViews: 'asc' };
  }
  if (sort === SUBMISSION_SORT.OLDEST) {
    return { submittedAt: 'asc' };
  }
  return { submittedAt: 'desc' };
}
