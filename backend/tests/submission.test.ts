import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  ALL_STATUS_FILTER,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_CAPTION_LENGTH,
  MAX_LIMIT,
  MAX_REVIEW_NOTE_LENGTH,
  MAX_SEARCH_LENGTH,
  REVIEWABLE_SUBMISSION_STATUSES,
  SUBMISSION_MESSAGES,
  SUBMISSION_SORT,
  SUBMISSION_SORT_OPTIONS,
} from '../src/features/submission/submission.constants.js';
import {
  AcceptSubmission,
  FinalSubmitVideo,
  GetCampaignSubmissions,
  GetMyCampaignSubmission,
  JoinCampaign,
  RejectSubmission,
  RequestSubmissionRevision,
  SaveDraftSubmission,
} from '../src/features/submission/submission.handlers.js';
import {
  BuildSubmissionsOrderBy,
  BuildSubmissionsWhereClause,
  FormatCampaignSubmissionReviewItem,
  FormatSubmissionResponse,
} from '../src/features/submission/submission.helper.js';
import {
  FinalSubmitVideoSchema,
  RejectSubmissionSchema,
  RequestRevisionSchema,
  SaveDraftSubmissionSchema,
  SubmissionQuerySchema,
} from '../src/features/submission/submission.validators.js';
import { CampaignStatus, Platform, Role, Status, SubmissionStatus } from '../src/generated/prisma/enums.js';
import { prisma } from '../src/utils/prisma.js';
import { CreateMockNext, CreateMockRequest, CreateMockResponse } from './helpers/mock-express.js';

describe('Submission Feature Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const futureEndDate = new Date();
  futureEndDate.setDate(futureEndDate.getDate() + 14);

  const mockActiveCampaign = {
    id: 'camp-uuid-1',
    title: 'Awesome Campaign',
    cpm: 50000,
    minViews: 1000,
    budget: 500000,
    endDate: futureEndDate,
    status: Status.ACTIVE,
    campaignStatus: CampaignStatus.ACTIVE,
  };

  const mockCreator = {
    id: 'creator-uuid-1',
    accountId: 'acc-creator-1',
    fullName: 'Budi Santoso',
    status: Status.ACTIVE,
  };

  const mockSocialAccount = {
    id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    creatorId: mockCreator.id,
    platform: Platform.TIKTOK,
    username: 'budiclipper',
    avatarUrl: 'https://example.com/avatar.jpg',
    followersCount: 15000,
    isVerified: true,
    verifiedAt: new Date('2026-02-01T00:00:00Z'),
    status: Status.ACTIVE,
  };

  const mockSubmissionRow = {
    id: 'sub-uuid-1',
    campaignId: mockActiveCampaign.id,
    creatorId: mockCreator.id,
    draftVideoUrl: null,
    liveVideoUrl: 'https://www.tiktok.com/@budiclipper/video/7123456789012345678',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    videoCaption: 'Amazing clipping #klipday',
    submissionStatus: SubmissionStatus.JOINED,
    reviewNote: null,
    verifiedViews: 2500,
    earnings: { toString: () => '125000.00' },
    submittedAt: null,
    createdAt: new Date('2026-03-01T00:00:00Z'),
    updatedAt: new Date('2026-03-01T00:00:00Z'),
    socialAccount: mockSocialAccount,
  };

  // ===========================================================================
  // 1. Helpers & Domain Logic Tests
  // ===========================================================================
  describe('Helpers & Domain Logic Suite', () => {
    describe('FormatSubmissionResponse', () => {
      it('serializes Decimal earnings to string and preserves DTO structure', () => {
        const formatted = FormatSubmissionResponse(mockSubmissionRow as never);

        expect(formatted.id).toBe(mockSubmissionRow.id);
        expect(formatted.earnings).toBe('125000.00');
        expect(formatted.liveVideoUrl).toBe(mockSubmissionRow.liveVideoUrl);
        expect(formatted.socialAccount?.username).toBe('budiclipper');
      });

      it('handles null optional fields gracefully', () => {
        const rowWithNulls = {
          ...mockSubmissionRow,
          draftVideoUrl: null,
          liveVideoUrl: null,
          thumbnailUrl: null,
          videoCaption: null,
          reviewNote: null,
          submittedAt: null,
          socialAccount: null,
        };
        const formatted = FormatSubmissionResponse(rowWithNulls as never);

        expect(formatted.liveVideoUrl).toBeNull();
        expect(formatted.socialAccount).toBeNull();
      });
    });

    describe('FormatCampaignSubmissionReviewItem', () => {
      it('formats creator and social account relations for review lists', () => {
        const item = FormatCampaignSubmissionReviewItem({
          ...mockSubmissionRow,
          creator: { id: mockCreator.id, fullName: mockCreator.fullName },
          socialAccount: {
            id: mockSocialAccount.id,
            username: mockSocialAccount.username,
            avatarUrl: mockSocialAccount.avatarUrl,
            followersCount: mockSocialAccount.followersCount,
          },
        });

        expect(item.id).toBe(mockSubmissionRow.id);
        expect(item.creator.fullName).toBe('Budi Santoso');
        expect(item.socialAccount?.username).toBe('budiclipper');
        expect(item.earnings).toBe('125000.00');
      });
    });

    describe('BuildSubmissionsWhereClause', () => {
      it('excludes JOINED status by default when no status filter is provided', () => {
        const where = BuildSubmissionsWhereClause('camp-1', {});

        expect(where.campaignId).toBe('camp-1');
        expect(where.status).toBe(Status.ACTIVE);
        expect(where.submissionStatus).toEqual({ not: SubmissionStatus.JOINED });
      });

      it('excludes JOINED status when status filter is ALL', () => {
        const where = BuildSubmissionsWhereClause('camp-1', { status: ALL_STATUS_FILTER });

        expect(where.submissionStatus).toEqual({ not: SubmissionStatus.JOINED });
      });

      it('filters by specific SubmissionStatus when specified', () => {
        const where = BuildSubmissionsWhereClause('camp-1', {
          status: SubmissionStatus.APPROVED,
        });

        expect(where.submissionStatus).toBe(SubmissionStatus.APPROVED);
      });

      it('applies OR case-insensitive search across caption, username, and creator fullName', () => {
        const where = BuildSubmissionsWhereClause('camp-1', { search: ' viral ' });

        expect(where.OR).toBeDefined();
        expect(where.OR).toHaveLength(3);
        expect(where.OR).toEqual([
          { videoCaption: { contains: 'viral', mode: 'insensitive' } },
          { socialAccount: { username: { contains: 'viral', mode: 'insensitive' } } },
          { creator: { fullName: { contains: 'viral', mode: 'insensitive' } } },
        ]);
      });

      it('ignores whitespace-only search string', () => {
        const where = BuildSubmissionsWhereClause('camp-1', { search: '   ' });

        expect(where.OR).toBeUndefined();
      });
    });

    describe('BuildSubmissionsOrderBy', () => {
      it('returns desc ordering on verifiedViews for views_desc', () => {
        const orderBy = BuildSubmissionsOrderBy(SUBMISSION_SORT.VIEWS_DESC);
        expect(orderBy).toEqual({ verifiedViews: 'desc' });
      });

      it('returns asc ordering on verifiedViews for views_asc', () => {
        const orderBy = BuildSubmissionsOrderBy(SUBMISSION_SORT.VIEWS_ASC);
        expect(orderBy).toEqual({ verifiedViews: 'asc' });
      });

      it('returns asc ordering on submittedAt for oldest', () => {
        const orderBy = BuildSubmissionsOrderBy(SUBMISSION_SORT.OLDEST);
        expect(orderBy).toEqual({ submittedAt: 'asc' });
      });

      it('defaults to desc ordering on submittedAt for latest or undefined', () => {
        expect(BuildSubmissionsOrderBy(SUBMISSION_SORT.LATEST)).toEqual({ submittedAt: 'desc' });
        expect(BuildSubmissionsOrderBy(undefined)).toEqual({ submittedAt: 'desc' });
      });
    });
  });

  // ===========================================================================
  // 2. Validators Suite (Zod Schemas)
  // ===========================================================================
  describe('Validators Suite (Zod Schemas)', () => {
    describe('SaveDraftSubmissionSchema', () => {
      it('validates a valid draft payload successfully', () => {
        const result = SaveDraftSubmissionSchema.safeParse({
          liveVideoUrl: 'https://www.tiktok.com/@user/video/1234567890',
          thumbnailUrl: 'https://example.com/thumbnail.png',
          videoCaption: 'Caption for draft',
          socialAccountId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
        });

        expect(result.success).toBe(true);
      });

      it('fails when liveVideoUrl is missing or invalid URL', () => {
        const missingUrl = SaveDraftSubmissionSchema.safeParse({
          socialAccountId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
        });
        expect(missingUrl.success).toBe(false);
        if (!missingUrl.success) {
          expect(missingUrl.error.issues[0]?.message).toBe(SUBMISSION_MESSAGES.VIDEO_URL_REQUIRED);
        }

        const invalidUrl = SaveDraftSubmissionSchema.safeParse({
          liveVideoUrl: 'not-a-valid-url',
          socialAccountId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
        });
        expect(invalidUrl.success).toBe(false);
        if (!invalidUrl.success) {
          expect(invalidUrl.error.issues[0]?.message).toBe(SUBMISSION_MESSAGES.VIDEO_URL_INVALID);
        }
      });

      it('fails when socialAccountId is not a valid UUID', () => {
        const result = SaveDraftSubmissionSchema.safeParse({
          liveVideoUrl: 'https://www.tiktok.com/@user/video/1234567890',
          socialAccountId: 'invalid-non-uuid-string',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(SUBMISSION_MESSAGES.SOCIAL_ACCOUNT_ID_INVALID);
        }
      });

      it('fails when videoCaption exceeds MAX_CAPTION_LENGTH (2000)', () => {
        const longCaption = 'a'.repeat(MAX_CAPTION_LENGTH + 1);
        const result = SaveDraftSubmissionSchema.safeParse({
          liveVideoUrl: 'https://www.tiktok.com/@user/video/1234567890',
          socialAccountId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
          videoCaption: longCaption,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(SUBMISSION_MESSAGES.CAPTION_MAX_EXCEEDED);
        }
      });
    });

    describe('FinalSubmitVideoSchema', () => {
      it('validates a complete valid final submission payload', () => {
        const result = FinalSubmitVideoSchema.safeParse({
          liveVideoUrl: 'https://www.tiktok.com/@budiclipper/video/7123456789012345678',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          videoCaption: 'Viral marketing video #brand',
          socialAccountId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
        });

        expect(result.success).toBe(true);
      });

      it('fails when liveVideoUrl is missing with TIKTOK_URL_REQUIRED message', () => {
        const result = FinalSubmitVideoSchema.safeParse({
          socialAccountId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(SUBMISSION_MESSAGES.TIKTOK_URL_REQUIRED);
        }
      });

      it('fails when thumbnailUrl is not a valid URL', () => {
        const result = FinalSubmitVideoSchema.safeParse({
          liveVideoUrl: 'https://www.tiktok.com/@user/video/1234567890',
          socialAccountId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
          thumbnailUrl: 'invalid-thumb-url',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(SUBMISSION_MESSAGES.THUMBNAIL_URL_INVALID);
        }
      });
    });

    describe('SubmissionQuerySchema', () => {
      it('parses valid pagination, search, status, and sort parameters', () => {
        const result = SubmissionQuerySchema.safeParse({
          page: '2',
          limit: '25',
          search: '  promo clip  ',
          status: SubmissionStatus.PENDING_REVIEW,
          sort: 'views_desc',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(2);
          expect(result.data.limit).toBe(25);
          expect(result.data.search).toBe('promo clip');
          expect(result.data.status).toBe(SubmissionStatus.PENDING_REVIEW);
          expect(result.data.sort).toBe('views_desc');
        }
      });

      it('permits status filter of ALL', () => {
        const result = SubmissionQuerySchema.safeParse({ status: ALL_STATUS_FILTER });
        expect(result.success).toBe(true);
      });

      it('fails when limit exceeds MAX_LIMIT (100)', () => {
        const result = SubmissionQuerySchema.safeParse({ limit: '101' });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(SUBMISSION_MESSAGES.LIMIT_MAX_EXCEEDED);
        }
      });

      it('fails when search string exceeds MAX_SEARCH_LENGTH (100)', () => {
        const longSearch = 's'.repeat(MAX_SEARCH_LENGTH + 1);
        const result = SubmissionQuerySchema.safeParse({ search: longSearch });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(SUBMISSION_MESSAGES.SEARCH_MAX_EXCEEDED);
        }
      });

      it('fails on invalid sort option', () => {
        const result = SubmissionQuerySchema.safeParse({ sort: 'unsupported_sort' });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(SUBMISSION_MESSAGES.SORT_INVALID);
        }
      });

      it('fails on invalid status enum', () => {
        const result = SubmissionQuerySchema.safeParse({ status: 'INVALID_STATUS' });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(SUBMISSION_MESSAGES.STATUS_FILTER_INVALID);
        }
      });
    });

    describe('RejectSubmissionSchema', () => {
      it('validates empty object successfully', () => {
        const result = RejectSubmissionSchema.safeParse({});
        expect(result.success).toBe(true);
      });

      it('validates valid reviewNote successfully', () => {
        const withReview = RejectSubmissionSchema.safeParse({ reviewNote: 'Klip tidak memenuhi guideline hook.' });
        expect(withReview.success).toBe(true);
      });

      it('fails when note exceeds MAX_REVIEW_NOTE_LENGTH', () => {
        const longNote = 'a'.repeat(MAX_REVIEW_NOTE_LENGTH + 1);
        const result = RejectSubmissionSchema.safeParse({ reviewNote: longNote });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(SUBMISSION_MESSAGES.REVIEW_NOTE_MAX_EXCEEDED);
        }
      });
    });

    describe('RequestRevisionSchema', () => {
      it('validates when reviewNote is provided and trimmed non-empty', () => {
        const result = RequestRevisionSchema.safeParse({ reviewNote: ' Perbaiki sound musik latar ' });
        expect(result.success).toBe(true);
      });

      it('fails when reviewNote is not provided or note is empty', () => {
        const emptyObj = RequestRevisionSchema.safeParse({});
        expect(emptyObj.success).toBe(false);
        if (!emptyObj.success) {
          expect(emptyObj.error.issues[0]?.message).toBe(SUBMISSION_MESSAGES.REVIEW_NOTE_REQUIRED);
        }

        const whitespaceOnly = RequestRevisionSchema.safeParse({ reviewNote: '    ' });
        expect(whitespaceOnly.success).toBe(false);
        if (!whitespaceOnly.success) {
          expect(whitespaceOnly.error.issues[0]?.message).toBe(SUBMISSION_MESSAGES.REVIEW_NOTE_REQUIRED);
        }
      });

      it('fails when note exceeds MAX_REVIEW_NOTE_LENGTH', () => {
        const longNote = 'a'.repeat(MAX_REVIEW_NOTE_LENGTH + 1);
        const result = RequestRevisionSchema.safeParse({ reviewNote: longNote });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(SUBMISSION_MESSAGES.REVIEW_NOTE_MAX_EXCEEDED);
        }
      });
    });
  });

  // ===========================================================================
  // 3. Handler Unit Tests
  // ===========================================================================
  describe('Handler Unit Tests Suite', () => {
    // -------------------------------------------------------------------------
    // 3.1 JoinCampaign
    // -------------------------------------------------------------------------
    describe('JoinCampaign Handler', () => {
      it('creates placeholder submission with JOINED status for creator (200 Happy Path)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: mockActiveCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(mockActiveCampaign as never);
        jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue(null);
        const createSpy = jest.spyOn(prisma.submission, 'create').mockResolvedValue({ id: 'sub-new' } as never);

        await JoinCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(createSpy).toHaveBeenCalledWith({
          data: {
            campaignId: mockActiveCampaign.id,
            creatorId: mockCreator.id,
            submissionStatus: SubmissionStatus.JOINED,
            status: Status.ACTIVE,
          },
        });
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: null,
          message: SUBMISSION_MESSAGES.JOIN_SUCCESS,
        });
      });

      it('is idempotent: skips duplicate insert if creator already joined (200 Edge Case)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: mockActiveCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(mockActiveCampaign as never);
        jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue({ id: 'existing-sub' } as never);
        const createSpy = jest.spyOn(prisma.submission, 'create');

        await JoinCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(createSpy).not.toHaveBeenCalled();
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: null,
          message: SUBMISSION_MESSAGES.JOIN_SUCCESS,
        });
      });

      it('rejects unauthenticated requests with 401', async () => {
        const req = CreateMockRequest({ params: { id: mockActiveCampaign.id } });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        await JoinCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.AUTH_REQUIRED,
        });
      });

      it('rejects non-creator role with 403 Forbidden', async () => {
        const req = CreateMockRequest({
          account: { sub: 'brand-acc', role: Role.BRAND },
          params: { id: mockActiveCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        await JoinCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(403);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.ONLY_CREATORS_CAN_JOIN,
        });
      });

      it('returns 404 when campaign is not found or not active', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: 'non-existent-campaign' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(null);

        await JoinCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.CAMPAIGN_NOT_FOUND_OR_INACTIVE,
        });
      });

      it('returns 400 when campaign has already ended', async () => {
        const pastEndDate = new Date();
        pastEndDate.setDate(pastEndDate.getDate() - 2);

        const endedCampaign = { ...mockActiveCampaign, endDate: pastEndDate };
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: endedCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(endedCampaign as never);

        await JoinCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.CAMPAIGN_ENDED,
        });
      });

      it('returns 400 when campaign budget is below minimum payout requirement', async () => {
        // minViews: 1000, cpm: 50000 => min payout is (1000/1000) * 50000 = 50000.
        // If current budget is 20000 < 50000 => reject
        const lowBudgetCampaign = {
          ...mockActiveCampaign,
          cpm: 50000,
          minViews: 1000,
          budget: 20000,
        };
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: lowBudgetCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(lowBudgetCampaign as never);

        await JoinCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.BUDGET_BELOW_MINIMUM,
        });
      });

      it('returns 404 when creator profile does not exist', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: mockActiveCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(mockActiveCampaign as never);
        jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(null);

        await JoinCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.CREATOR_NOT_FOUND,
        });
      });

      it('returns 400 when creator was already rejected for this campaign', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: mockActiveCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(mockActiveCampaign as never);
        jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue({
          id: 'sub-rejected-1',
          submissionStatus: SubmissionStatus.REJECTED,
        } as never);

        await JoinCampaign(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.REJECTED_CANNOT_RESUBMIT,
        });
      });
    });

    // -------------------------------------------------------------------------
    // 3.2 GetMyCampaignSubmission
    // -------------------------------------------------------------------------
    describe('GetMyCampaignSubmission Handler', () => {
      it('returns submission record and linked social account (200 Happy Path)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: mockActiveCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue(mockSubmissionRow as never);
        jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(mockSocialAccount as never);

        await GetMyCampaignSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: {
            submission: expect.objectContaining({ id: mockSubmissionRow.id }),
            socialAccount: mockSocialAccount,
          },
          message: SUBMISSION_MESSAGES.GET_MY_SUBMISSION_SUCCESS,
        });
      });

      it('falls back to active verified TikTok account when submission has no linked account yet (Edge Case)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: mockActiveCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        const submissionWithoutAccount = { ...mockSubmissionRow, socialAccount: null };

        jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue(submissionWithoutAccount as never);
        jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(mockSocialAccount as never);

        await GetMyCampaignSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: {
            submission: expect.objectContaining({ id: mockSubmissionRow.id, socialAccount: null }),
            socialAccount: mockSocialAccount,
          },
          message: SUBMISSION_MESSAGES.GET_MY_SUBMISSION_SUCCESS,
        });
      });

      it('rejects unauthenticated caller with 401', async () => {
        const req = CreateMockRequest({ params: { id: mockActiveCampaign.id } });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        await GetMyCampaignSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.AUTH_REQUIRED,
        });
      });

      it('rejects non-creator role with 403', async () => {
        const req = CreateMockRequest({
          account: { sub: 'admin-acc', role: Role.ADMIN },
          params: { id: mockActiveCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        await GetMyCampaignSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(403);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.ONLY_CREATORS_CAN_ACCESS_SUBMISSIONS,
        });
      });
    });

    // -------------------------------------------------------------------------
    // 3.3 SaveDraftSubmission
    // -------------------------------------------------------------------------
    describe('SaveDraftSubmission Handler', () => {
      const validDraftPayload = {
        liveVideoUrl: 'https://www.tiktok.com/@budiclipper/video/7123456789012345678',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        videoCaption: 'Draft video caption',
        socialAccountId: mockSocialAccount.id,
      };

      it('saves video draft choices when submission is in JOINED status (200 Happy Path)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: mockActiveCampaign.id },
          body: validDraftPayload,
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue({
          ...mockSubmissionRow,
          submissionStatus: SubmissionStatus.JOINED,
        } as never);
        jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(mockSocialAccount as never);
        jest.spyOn(prisma.submission, 'update').mockResolvedValue({
          ...mockSubmissionRow,
          ...validDraftPayload,
        } as never);

        await SaveDraftSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: expect.objectContaining({
            videoCaption: validDraftPayload.videoCaption,
          }),
          message: SUBMISSION_MESSAGES.DRAFT_SAVED,
        });
      });

      it('allows saving draft when submission is in REVISION_REQUESTED status (200 Happy Path)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: mockActiveCampaign.id },
          body: validDraftPayload,
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue({
          ...mockSubmissionRow,
          submissionStatus: SubmissionStatus.REVISION_REQUESTED,
        } as never);
        jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(mockSocialAccount as never);
        jest.spyOn(prisma.submission, 'update').mockResolvedValue({
          ...mockSubmissionRow,
          ...validDraftPayload,
        } as never);

        await SaveDraftSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: expect.objectContaining({
            videoCaption: validDraftPayload.videoCaption,
          }),
          message: SUBMISSION_MESSAGES.DRAFT_SAVED,
        });
      });

      it('returns 400 when request body fails validation (Validation Path)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: mockActiveCampaign.id },
          body: { liveVideoUrl: 'not-a-valid-url' }, // Missing socialAccountId and bad url
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        await SaveDraftSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.VIDEO_URL_INVALID,
        });
      });

      it('returns 404 if creator has not joined campaign yet', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: mockActiveCampaign.id },
          body: validDraftPayload,
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue(null);

        await SaveDraftSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.NOT_JOINED,
        });
      });

      it('returns 400 if submission is already PENDING_REVIEW', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: mockActiveCampaign.id },
          body: validDraftPayload,
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue({
          ...mockSubmissionRow,
          submissionStatus: SubmissionStatus.PENDING_REVIEW,
        } as never);

        await SaveDraftSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.CANNOT_MODIFY_UNDER_REVIEW,
        });
      });

      it('returns 400 if submission is already APPROVED', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: mockActiveCampaign.id },
          body: validDraftPayload,
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue({
          ...mockSubmissionRow,
          submissionStatus: SubmissionStatus.APPROVED,
        } as never);

        await SaveDraftSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.ALREADY_APPROVED,
        });
      });

      it('returns 400 if submission is already REJECTED', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: mockActiveCampaign.id },
          body: validDraftPayload,
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue({
          ...mockSubmissionRow,
          submissionStatus: SubmissionStatus.REJECTED,
        } as never);

        await SaveDraftSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.REJECTED_CANNOT_RESUBMIT,
        });
      });

      it('returns 400 when socialAccountId does not belong to the creator (Security Edge Case)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: mockActiveCampaign.id },
          body: validDraftPayload,
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue({
          ...mockSubmissionRow,
          submissionStatus: SubmissionStatus.JOINED,
        } as never);
        jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(null); // Not owned

        await SaveDraftSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.SOCIAL_ACCOUNT_INVALID,
        });
      });
    });

    // -------------------------------------------------------------------------
    // 3.4 FinalSubmitVideo
    // -------------------------------------------------------------------------
    describe('FinalSubmitVideo Handler', () => {
      const validSubmitPayload = {
        liveVideoUrl: 'https://www.tiktok.com/@budiclipper/video/7123456789012345678',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        videoCaption: 'Final video submission',
        socialAccountId: mockSocialAccount.id,
      };

      it('finalizes video submission and sets status to PENDING_REVIEW (200 Happy Path)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: mockActiveCampaign.id },
          body: validSubmitPayload,
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue({
          ...mockSubmissionRow,
          submissionStatus: SubmissionStatus.JOINED,
        } as never);
        jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(mockSocialAccount as never);

        const updateSpy = jest.spyOn(prisma.submission, 'update').mockResolvedValue({
          ...mockSubmissionRow,
          ...validSubmitPayload,
          submissionStatus: SubmissionStatus.PENDING_REVIEW,
          submittedAt: new Date(),
        } as never);

        await FinalSubmitVideo(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(updateSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              submissionStatus: SubmissionStatus.PENDING_REVIEW,
              submittedAt: expect.any(Date),
            }),
          })
        );
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: expect.objectContaining({
            submissionStatus: SubmissionStatus.PENDING_REVIEW,
          }),
          message: SUBMISSION_MESSAGES.SUBMIT_SUCCESS,
        });
      });

      it('resubmits a video from REVISION_REQUESTED to PENDING_REVIEW (200 Happy Path)', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: mockActiveCampaign.id },
          body: validSubmitPayload,
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue({
          ...mockSubmissionRow,
          submissionStatus: SubmissionStatus.REVISION_REQUESTED,
        } as never);
        jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(mockSocialAccount as never);
        jest.spyOn(prisma.submission, 'update').mockResolvedValue({
          ...mockSubmissionRow,
          ...validSubmitPayload,
          submissionStatus: SubmissionStatus.PENDING_REVIEW,
          submittedAt: new Date(),
        } as never);

        await FinalSubmitVideo(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: expect.objectContaining({
            submissionStatus: SubmissionStatus.PENDING_REVIEW,
          }),
          message: SUBMISSION_MESSAGES.SUBMIT_SUCCESS,
        });
      });

      it('returns 400 when submission is already under review by brand', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: mockActiveCampaign.id },
          body: validSubmitPayload,
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue({
          ...mockSubmissionRow,
          submissionStatus: SubmissionStatus.PENDING_REVIEW,
        } as never);

        await FinalSubmitVideo(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.UNDER_REVIEW_BY_BRAND,
        });
      });

      it('returns 400 when submission is already approved', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: mockActiveCampaign.id },
          body: validSubmitPayload,
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue({
          ...mockSubmissionRow,
          submissionStatus: SubmissionStatus.APPROVED,
        } as never);

        await FinalSubmitVideo(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.ALREADY_APPROVED,
        });
      });

      it('returns 400 when submission is already REJECTED', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: mockActiveCampaign.id },
          body: validSubmitPayload,
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue({
          ...mockSubmissionRow,
          submissionStatus: SubmissionStatus.REJECTED,
        } as never);

        await FinalSubmitVideo(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.REJECTED_CANNOT_RESUBMIT,
        });
      });

      it('returns 404 when submission does not exist', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: mockActiveCampaign.id },
          body: validSubmitPayload,
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue(null);

        await FinalSubmitVideo(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.SUBMISSION_NOT_FOUND,
        });
      });

      it('returns 400 when socialAccountId does not belong to creator', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: mockActiveCampaign.id },
          body: validSubmitPayload,
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue({
          ...mockSubmissionRow,
          submissionStatus: SubmissionStatus.JOINED,
        } as never);
        jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(null);

        await FinalSubmitVideo(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.SOCIAL_ACCOUNT_INVALID,
        });
      });
    });

    // -------------------------------------------------------------------------
    // 3.5 GetCampaignSubmissions
    // -------------------------------------------------------------------------
    describe('GetCampaignSubmissions Handler', () => {
      const mockBrandAccount = { sub: 'acc-brand-1', role: Role.BRAND };

      it('retrieves paginated submissions for owning brand (200 Happy Path)', async () => {
        const req = CreateMockRequest({
          account: mockBrandAccount,
          params: { id: mockActiveCampaign.id },
          query: { page: '1', limit: '10' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue({ id: mockActiveCampaign.id } as never);
        jest.spyOn(prisma.submission, 'count').mockResolvedValue(1);
        jest.spyOn(prisma.submission, 'findMany').mockResolvedValue([
          {
            ...mockSubmissionRow,
            creator: { id: mockCreator.id, fullName: mockCreator.fullName },
            socialAccount: {
              id: mockSocialAccount.id,
              username: mockSocialAccount.username,
              avatarUrl: mockSocialAccount.avatarUrl,
              followersCount: mockSocialAccount.followersCount,
            },
          },
        ] as never);

        await GetCampaignSubmissions(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: {
            items: [
              expect.objectContaining({
                id: mockSubmissionRow.id,
                creator: { id: mockCreator.id, fullName: mockCreator.fullName },
                socialAccount: expect.objectContaining({ username: 'budiclipper' }),
              }),
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 1,
              totalPages: 1,
            },
          },
          message: SUBMISSION_MESSAGES.GET_SUBMISSIONS_SUCCESS,
        });
      });

      it('allows platform ADMIN to access submissions without brand ownership check (200 Happy Path)', async () => {
        const req = CreateMockRequest({
          account: { sub: 'admin-acc', role: Role.ADMIN },
          params: { id: mockActiveCampaign.id },
          query: {},
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        const findCampaignSpy = jest.spyOn(prisma.campaign, 'findFirst');
        jest.spyOn(prisma.submission, 'count').mockResolvedValue(0);
        jest.spyOn(prisma.submission, 'findMany').mockResolvedValue([]);

        await GetCampaignSubmissions(req, res, next);

        expect(findCampaignSpy).not.toHaveBeenCalled();
        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: {
            items: [],
            pagination: {
              page: DEFAULT_PAGE,
              limit: DEFAULT_LIMIT,
              total: 0,
              totalPages: 1,
            },
          },
          message: SUBMISSION_MESSAGES.GET_SUBMISSIONS_SUCCESS,
        });
      });

      it('rejects creator role with 403 Forbidden', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: mockActiveCampaign.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        await GetCampaignSubmissions(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(403);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.ONLY_BRANDS_AND_ADMINS_CAN_REVIEW,
        });
      });

      it('returns 404 when campaign is not owned by the brand (Anti-Enumeration Guard)', async () => {
        const req = CreateMockRequest({
          account: mockBrandAccount,
          params: { id: 'other-brand-campaign' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(null);

        await GetCampaignSubmissions(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.CAMPAIGN_NOT_FOUND,
        });
      });

      it('returns 400 when query validation fails (Validation Path)', async () => {
        const req = CreateMockRequest({
          account: mockBrandAccount,
          params: { id: mockActiveCampaign.id },
          query: { limit: '999' }, // exceeds MAX_LIMIT
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        await GetCampaignSubmissions(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.LIMIT_MAX_EXCEEDED,
        });
      });
    });

    // -------------------------------------------------------------------------
    // 3.6 AcceptSubmission
    // -------------------------------------------------------------------------
    describe('AcceptSubmission Handler', () => {
      const mockBrandAccount = { sub: 'acc-brand-1', role: Role.BRAND };
      const pendingSubmission = {
        ...mockSubmissionRow,
        id: 'sub-review-1',
        submissionStatus: SubmissionStatus.PENDING_REVIEW,
        creator: { id: mockCreator.id, fullName: mockCreator.fullName, avatarUrl: null },
        socialAccount: mockSocialAccount,
      };

      it('approves submission and clears reviewNote (200 Happy Path by Brand)', async () => {
        const req = CreateMockRequest({
          account: mockBrandAccount,
          params: { id: pendingSubmission.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue(pendingSubmission as never);
        jest.spyOn(prisma.submission, 'update').mockResolvedValue({
          ...pendingSubmission,
          submissionStatus: SubmissionStatus.APPROVED,
          reviewNote: null,
        } as never);

        await AcceptSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: expect.objectContaining({
            id: pendingSubmission.id,
            submissionStatus: SubmissionStatus.APPROVED,
            reviewNote: null,
          }),
          message: SUBMISSION_MESSAGES.ACCEPT_SUBMISSION_SUCCESS,
        });
      });

      it('allows platform ADMIN to accept submission without brand filter (200 Happy Path by Admin)', async () => {
        const req = CreateMockRequest({
          account: { sub: 'admin-acc', role: Role.ADMIN },
          params: { id: pendingSubmission.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue(pendingSubmission as never);
        jest.spyOn(prisma.submission, 'update').mockResolvedValue({
          ...pendingSubmission,
          submissionStatus: SubmissionStatus.APPROVED,
          reviewNote: null,
        } as never);

        await AcceptSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: expect.objectContaining({
            id: pendingSubmission.id,
            submissionStatus: SubmissionStatus.APPROVED,
          }),
          message: SUBMISSION_MESSAGES.ACCEPT_SUBMISSION_SUCCESS,
        });
      });

      it('returns 401 when account is unauthenticated', async () => {
        const req = CreateMockRequest({
          account: undefined,
          params: { id: pendingSubmission.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        await AcceptSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.AUTH_REQUIRED,
        });
      });

      it('returns 403 when user is a CREATOR', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: pendingSubmission.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        await AcceptSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(403);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.ONLY_BRANDS_AND_ADMINS_CAN_REVIEW,
        });
      });

      it('returns 404 when submission does not exist or brand ownership fails', async () => {
        const req = CreateMockRequest({
          account: mockBrandAccount,
          params: { id: 'non-existent-sub' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue(null);

        await AcceptSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.SUBMISSION_NOT_FOUND,
        });
      });

      it('returns 400 when submission is already APPROVED', async () => {
        const req = CreateMockRequest({
          account: mockBrandAccount,
          params: { id: pendingSubmission.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue({
          ...pendingSubmission,
          submissionStatus: SubmissionStatus.APPROVED,
        } as never);

        await AcceptSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.ALREADY_APPROVED,
        });
      });

      it('returns 400 when submission status is not reviewable (e.g. JOINED)', async () => {
        const req = CreateMockRequest({
          account: mockBrandAccount,
          params: { id: pendingSubmission.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue({
          ...pendingSubmission,
          submissionStatus: SubmissionStatus.JOINED,
        } as never);

        await AcceptSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.SUBMISSION_STATUS_NOT_REVIEWABLE,
        });
      });
    });

    // -------------------------------------------------------------------------
    // 3.7 RejectSubmission
    // -------------------------------------------------------------------------
    describe('RejectSubmission Handler', () => {
      const mockBrandAccount = { sub: 'acc-brand-1', role: Role.BRAND };
      const pendingSubmission = {
        ...mockSubmissionRow,
        id: 'sub-review-1',
        submissionStatus: SubmissionStatus.PENDING_REVIEW,
        creator: { id: mockCreator.id, fullName: mockCreator.fullName, avatarUrl: null },
        socialAccount: mockSocialAccount,
      };

      it('rejects submission with reviewNote (200 Happy Path by Brand)', async () => {
        const req = CreateMockRequest({
          account: mockBrandAccount,
          params: { id: pendingSubmission.id },
          body: { reviewNote: 'Video tidak memenuhi kriteria durasi minimal.' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue(pendingSubmission as never);
        jest.spyOn(prisma.submission, 'update').mockResolvedValue({
          ...pendingSubmission,
          submissionStatus: SubmissionStatus.REJECTED,
          reviewNote: 'Video tidak memenuhi kriteria durasi minimal.',
        } as never);

        await RejectSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: expect.objectContaining({
            id: pendingSubmission.id,
            submissionStatus: SubmissionStatus.REJECTED,
            reviewNote: 'Video tidak memenuhi kriteria durasi minimal.',
          }),
          message: SUBMISSION_MESSAGES.REJECT_SUBMISSION_SUCCESS,
        });
      });

      it('rejects submission without note (empty body) (200 Happy Path)', async () => {
        const req = CreateMockRequest({
          account: mockBrandAccount,
          params: { id: pendingSubmission.id },
          body: {},
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue(pendingSubmission as never);
        jest.spyOn(prisma.submission, 'update').mockResolvedValue({
          ...pendingSubmission,
          submissionStatus: SubmissionStatus.REJECTED,
          reviewNote: null,
        } as never);

        await RejectSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: expect.objectContaining({
            submissionStatus: SubmissionStatus.REJECTED,
            reviewNote: null,
          }),
          message: SUBMISSION_MESSAGES.REJECT_SUBMISSION_SUCCESS,
        });
      });

      it('allows platform ADMIN to reject submission (200 Happy Path by Admin)', async () => {
        const req = CreateMockRequest({
          account: { sub: 'admin-acc', role: Role.ADMIN },
          params: { id: pendingSubmission.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue(pendingSubmission as never);
        jest.spyOn(prisma.submission, 'update').mockResolvedValue({
          ...pendingSubmission,
          submissionStatus: SubmissionStatus.REJECTED,
          reviewNote: null,
        } as never);

        await RejectSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: expect.objectContaining({
            submissionStatus: SubmissionStatus.REJECTED,
          }),
          message: SUBMISSION_MESSAGES.REJECT_SUBMISSION_SUCCESS,
        });
      });

      it('returns 401 when account is unauthenticated', async () => {
        const req = CreateMockRequest({
          account: undefined,
          params: { id: pendingSubmission.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        await RejectSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.AUTH_REQUIRED,
        });
      });

      it('returns 403 when user is a CREATOR', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: pendingSubmission.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        await RejectSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(403);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.ONLY_BRANDS_AND_ADMINS_CAN_REVIEW,
        });
      });

      it('returns 404 when submission does not exist or ownership fails', async () => {
        const req = CreateMockRequest({
          account: mockBrandAccount,
          params: { id: 'non-existent-sub' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue(null);

        await RejectSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.SUBMISSION_NOT_FOUND,
        });
      });

      it('returns 400 when submission is already REJECTED', async () => {
        const req = CreateMockRequest({
          account: mockBrandAccount,
          params: { id: pendingSubmission.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue({
          ...pendingSubmission,
          submissionStatus: SubmissionStatus.REJECTED,
        } as never);

        await RejectSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.ALREADY_REJECTED,
        });
      });

      it('returns 400 when submission is already APPROVED', async () => {
        const req = CreateMockRequest({
          account: mockBrandAccount,
          params: { id: pendingSubmission.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue({
          ...pendingSubmission,
          submissionStatus: SubmissionStatus.APPROVED,
        } as never);

        await RejectSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.ALREADY_APPROVED,
        });
      });

      it('returns 400 when submission status is not reviewable (e.g. JOINED)', async () => {
        const req = CreateMockRequest({
          account: mockBrandAccount,
          params: { id: pendingSubmission.id },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue({
          ...pendingSubmission,
          submissionStatus: SubmissionStatus.JOINED,
        } as never);

        await RejectSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.SUBMISSION_STATUS_NOT_REVIEWABLE,
        });
      });

      it('returns 400 when reviewNote exceeds maximum character limit', async () => {
        const req = CreateMockRequest({
          account: mockBrandAccount,
          params: { id: pendingSubmission.id },
          body: { reviewNote: 'x'.repeat(MAX_REVIEW_NOTE_LENGTH + 1) },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue(pendingSubmission as never);

        await RejectSubmission(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.REVIEW_NOTE_MAX_EXCEEDED,
        });
      });
    });

    // -------------------------------------------------------------------------
    // 3.8 RequestSubmissionRevision
    // -------------------------------------------------------------------------
    describe('RequestSubmissionRevision Handler', () => {
      const mockBrandAccount = { sub: 'acc-brand-1', role: Role.BRAND };
      const pendingSubmission = {
        ...mockSubmissionRow,
        id: 'sub-review-1',
        submissionStatus: SubmissionStatus.PENDING_REVIEW,
        creator: { id: mockCreator.id, fullName: mockCreator.fullName, avatarUrl: null },
        socialAccount: mockSocialAccount,
      };

      it('requests revision with reviewNote (200 Happy Path by Brand)', async () => {
        const req = CreateMockRequest({
          account: mockBrandAccount,
          params: { id: pendingSubmission.id },
          body: { reviewNote: 'Mohon perbaiki hook di 3 detik pertama agar lebih menarik.' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue(pendingSubmission as never);
        jest.spyOn(prisma.submission, 'update').mockResolvedValue({
          ...pendingSubmission,
          submissionStatus: SubmissionStatus.REVISION_REQUESTED,
          reviewNote: 'Mohon perbaiki hook di 3 detik pertama agar lebih menarik.',
        } as never);

        await RequestSubmissionRevision(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: expect.objectContaining({
            id: pendingSubmission.id,
            submissionStatus: SubmissionStatus.REVISION_REQUESTED,
            reviewNote: 'Mohon perbaiki hook di 3 detik pertama agar lebih menarik.',
          }),
          message: SUBMISSION_MESSAGES.REVISE_SUBMISSION_SUCCESS,
        });
      });

      it('allows platform ADMIN to request revision (200 Happy Path by Admin)', async () => {
        const req = CreateMockRequest({
          account: { sub: 'admin-acc', role: Role.ADMIN },
          params: { id: pendingSubmission.id },
          body: { reviewNote: 'Admin note for creator.' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue(pendingSubmission as never);
        jest.spyOn(prisma.submission, 'update').mockResolvedValue({
          ...pendingSubmission,
          submissionStatus: SubmissionStatus.REVISION_REQUESTED,
          reviewNote: 'Admin note for creator.',
        } as never);

        await RequestSubmissionRevision(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'success',
          data: expect.objectContaining({
            submissionStatus: SubmissionStatus.REVISION_REQUESTED,
          }),
          message: SUBMISSION_MESSAGES.REVISE_SUBMISSION_SUCCESS,
        });
      });

      it('returns 401 when account is unauthenticated', async () => {
        const req = CreateMockRequest({
          account: undefined,
          params: { id: pendingSubmission.id },
          body: { reviewNote: 'Some note' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        await RequestSubmissionRevision(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.AUTH_REQUIRED,
        });
      });

      it('returns 403 when user is a CREATOR', async () => {
        const req = CreateMockRequest({
          account: { sub: mockCreator.accountId, role: Role.CREATOR },
          params: { id: pendingSubmission.id },
          body: { reviewNote: 'Some note' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        await RequestSubmissionRevision(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(403);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.ONLY_BRANDS_AND_ADMINS_CAN_REVIEW,
        });
      });

      it('returns 404 when submission does not exist or ownership fails', async () => {
        const req = CreateMockRequest({
          account: mockBrandAccount,
          params: { id: 'non-existent-sub' },
          body: { reviewNote: 'Some note' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue(null);

        await RequestSubmissionRevision(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.SUBMISSION_NOT_FOUND,
        });
      });

      it('returns 400 when note is missing or empty', async () => {
        const req = CreateMockRequest({
          account: mockBrandAccount,
          params: { id: pendingSubmission.id },
          body: {},
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue(pendingSubmission as never);

        await RequestSubmissionRevision(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.REVIEW_NOTE_REQUIRED,
        });
      });

      it('returns 400 when note exceeds MAX_REVIEW_NOTE_LENGTH', async () => {
        const req = CreateMockRequest({
          account: mockBrandAccount,
          params: { id: pendingSubmission.id },
          body: { reviewNote: 'x'.repeat(MAX_REVIEW_NOTE_LENGTH + 1) },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue(pendingSubmission as never);

        await RequestSubmissionRevision(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.REVIEW_NOTE_MAX_EXCEEDED,
        });
      });

      it('returns 400 when submission is already APPROVED', async () => {
        const req = CreateMockRequest({
          account: mockBrandAccount,
          params: { id: pendingSubmission.id },
          body: { reviewNote: 'Please revise' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue({
          ...pendingSubmission,
          submissionStatus: SubmissionStatus.APPROVED,
        } as never);

        await RequestSubmissionRevision(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.ALREADY_APPROVED,
        });
      });

      it('returns 400 when submission is already REJECTED', async () => {
        const req = CreateMockRequest({
          account: mockBrandAccount,
          params: { id: pendingSubmission.id },
          body: { reviewNote: 'Please revise' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue({
          ...pendingSubmission,
          submissionStatus: SubmissionStatus.REJECTED,
        } as never);

        await RequestSubmissionRevision(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.ALREADY_REJECTED,
        });
      });

      it('returns 400 when submission status is not reviewable (e.g. JOINED)', async () => {
        const req = CreateMockRequest({
          account: mockBrandAccount,
          params: { id: pendingSubmission.id },
          body: { reviewNote: 'Please revise' },
        });
        const { res, statusMock, jsonMock } = CreateMockResponse();
        const next = CreateMockNext();

        jest.spyOn(prisma.submission, 'findFirst').mockResolvedValue({
          ...pendingSubmission,
          submissionStatus: SubmissionStatus.JOINED,
        } as never);

        await RequestSubmissionRevision(req, res, next);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          status: 'error',
          data: null,
          message: SUBMISSION_MESSAGES.SUBMISSION_STATUS_NOT_REVIEWABLE,
        });
      });
    });
  });
});
