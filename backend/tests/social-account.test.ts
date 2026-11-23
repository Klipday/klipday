import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockGetTikTokUserProfile = jest.fn<(...args: any[]) => Promise<any>>();
const mockGetTikTokRecentVideos = jest.fn<(...args: any[]) => Promise<any>>();
const mockGetTikTokVideoDetails = jest.fn<(...args: any[]) => Promise<any>>();
const mockValidateTikTokVideoUrl = jest.fn<(...args: any[]) => string>();
const mockPersistSocialAvatarToStorage = jest.fn<(...args: any[]) => Promise<string>>();

jest.unstable_mockModule('../src/services/scrape-creators.js', () => ({
  GetTikTokUserProfile: mockGetTikTokUserProfile,
  GetTikTokRecentVideos: mockGetTikTokRecentVideos,
  GetTikTokVideoDetails: mockGetTikTokVideoDetails,
  ValidateTikTokVideoUrl: mockValidateTikTokVideoUrl,
  SCRAPECREATORS_BASE_URL: 'https://api.scrapecreators.com',
}));

jest.unstable_mockModule('../src/services/supabase.js', () => ({
  PersistSocialAvatarToStorage: mockPersistSocialAvatarToStorage,
  UploadToSupabaseStorage: jest.fn(),
}));

// Dynamic imports after unstable_mockModule
const {
  RequestVerificationCode,
  VerifyTikTokBio,
  GetConnectedSocialAccount,
  GetRecentTikTokVideos,
  ValidateTikTokVideoUrl,
} = await import('../src/features/social-account/social-account.handlers.js');
const { SOCIAL_ACCOUNT_MESSAGES, TIKTOK_RECENT_VIDEOS_DEFAULT_LIMIT } = await import(
  '../src/features/social-account/social-account.constants.js'
);
const { GenerateVerificationCode } = await import(
  '../src/features/social-account/social-account.helper.js'
);
const {
  RequestCodeSchema,
  VerifyBioSchema,
  ValidateVideoUrlSchema,
} = await import('../src/features/social-account/social-account.validators.js');
const { Role, Status, Platform } = await import('../src/generated/prisma/enums.js');
const { prisma } = await import('../src/utils/prisma.js');
const {
  CreateMockNext,
  CreateMockRequest,
  CreateMockResponse,
} = await import('./helpers/mock-express.js');

describe('Social Account Feature Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCreator = {
    id: 'creator-test-uuid-1',
    accountId: 'account-creator-uuid-1',
    status: Status.ACTIVE,
  };

  const mockVerifiedAccount = {
    id: 'social-acc-uuid-1',
    creatorId: mockCreator.id,
    platform: Platform.TIKTOK,
    username: 'valid_creator',
    platformUserId: '1092837465',
    avatarUrl: 'https://storage.supabase.co/avatar.jpg',
    followersCount: 5000,
    isVerified: true,
    verifiedAt: new Date(),
    status: Status.ACTIVE,
  };

  // ===========================================================================
  // 1. Helper & Validator Unit Tests
  // ===========================================================================
  describe('Helpers & Validators Suite', () => {
    describe('GenerateVerificationCode', () => {
      it('generates a 7-character code starting with KD-', () => {
        const code = GenerateVerificationCode();
        expect(code).toMatch(/^KD-[A-Z0-9]{4}$/);
        expect(code.length).toBe(7);
      });

      it('excludes ambiguous characters (I, O, 0, 1)', () => {
        for (let i = 0; i < 50; i++) {
          const code = GenerateVerificationCode();
          const randomPart = code.slice(3);
          expect(randomPart).not.toMatch(/[IO01]/);
        }
      });
    });

    describe('RequestCodeSchema & VerifyBioSchema', () => {
      it('accepts valid usernames with dots, numbers, and underscores', () => {
        const validUsernames = ['creator_1', 'creator.name', 'simpleuser', 'a'.repeat(50)];
        for (const username of validUsernames) {
          const result = RequestCodeSchema.safeParse({ username });
          expect(result.success).toBe(true);
        }
      });

      it('rejects empty username', () => {
        const result = RequestCodeSchema.safeParse({ username: '' });
        expect(result.success).toBe(false);
      });

      it('rejects username longer than 50 characters', () => {
        const result = RequestCodeSchema.safeParse({ username: 'a'.repeat(51) });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(SOCIAL_ACCOUNT_MESSAGES.USERNAME_TOO_LONG);
        }
      });

      it('rejects username with invalid characters (spaces, @, special chars)', () => {
        const invalidUsernames = ['user name', 'user@tiktok', 'user!name', 'user#1'];
        for (const username of invalidUsernames) {
          const result = VerifyBioSchema.safeParse({ username });
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues[0]?.message).toBe(SOCIAL_ACCOUNT_MESSAGES.USERNAME_INVALID_FORMAT);
          }
        }
      });
    });

    describe('ValidateVideoUrlSchema', () => {
      it('accepts valid TikTok video URLs', () => {
        const validUrls = [
          'https://www.tiktok.com/@creator/video/7123456789012345678',
          'https://tiktok.com/@creator/video/7123456789012345678',
          'https://vt.tiktok.com/ZS8ABCDEF/',
          'https://vm.tiktok.com/ZM8ABCDEF/',
        ];
        for (const videoUrl of validUrls) {
          const result = ValidateVideoUrlSchema.safeParse({ videoUrl });
          expect(result.success).toBe(true);
        }
      });

      it('rejects non-URL strings', () => {
        const result = ValidateVideoUrlSchema.safeParse({ videoUrl: 'not-a-url' });
        expect(result.success).toBe(false);
      });

      it('rejects non-TikTok URLs', () => {
        const result = ValidateVideoUrlSchema.safeParse({ videoUrl: 'https://youtube.com/watch?v=123' });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(SOCIAL_ACCOUNT_MESSAGES.VIDEO_URL_MUST_BE_TIKTOK);
        }
      });
    });
  });

  // ===========================================================================
  // 2. RequestVerificationCode Handler Tests
  // ===========================================================================
  describe('RequestVerificationCode Handler', () => {
    it('returns 401 when account is unauthenticated', async () => {
      const req = CreateMockRequest({ account: undefined });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await RequestVerificationCode(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ message: SOCIAL_ACCOUNT_MESSAGES.AUTH_REQUIRED }));
    });

    it('returns 403 when account is not a CREATOR (e.g. BRAND)', async () => {
      const req = CreateMockRequest({
        account: { sub: 'acc-1', role: Role.BRAND },
        body: { username: 'valid_handle' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await RequestVerificationCode(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ message: SOCIAL_ACCOUNT_MESSAGES.ONLY_CREATORS_CAN_CONNECT }));
    });

    it('returns 400 when request body fails validation', async () => {
      const req = CreateMockRequest({
        account: { sub: mockCreator.accountId, role: Role.CREATOR },
        body: { username: '' },
      });
      const { res, statusMock } = CreateMockResponse();
      const next = CreateMockNext();

      await RequestVerificationCode(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('returns 404 when creator record does not exist in database', async () => {
      const req = CreateMockRequest({
        account: { sub: 'nonexistent-acc', role: Role.CREATOR },
        body: { username: 'valid_handle' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(null);

      await RequestVerificationCode(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ message: SOCIAL_ACCOUNT_MESSAGES.CREATOR_NOT_FOUND }));
    });

    it('returns 409 Conflict when username is already verified by another creator (anti-hijacking)', async () => {
      const req = CreateMockRequest({
        account: { sub: mockCreator.accountId, role: Role.CREATOR },
        body: { username: 'other_creator_handle' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
      jest
        .spyOn(prisma.creatorSocialAccount, 'findFirst')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          ...mockVerifiedAccount,
          creatorId: 'different-creator-id',
        } as never);

      await RequestVerificationCode(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ message: SOCIAL_ACCOUNT_MESSAGES.USERNAME_ALREADY_CONNECTED }));
    });

    it('reactivates and returns existing account when already verified by current creator (idempotency)', async () => {
      const req = CreateMockRequest({
        account: { sub: mockCreator.accountId, role: Role.CREATOR },
        body: { username: mockVerifiedAccount.username },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
      jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(mockVerifiedAccount as never);
      jest.spyOn(prisma, '$transaction').mockResolvedValue([{}, mockVerifiedAccount] as never);

      await RequestVerificationCode(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            alreadyVerified: true,
            account: expect.objectContaining(mockVerifiedAccount),
          }),
        })
      );
    });

    it('happy path: generates new KD-XXXX challenge and saves to socialVerificationCode', async () => {
      const req = CreateMockRequest({
        account: { sub: mockCreator.accountId, role: Role.CREATOR },
        body: { username: 'new_creator' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
      jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.socialVerificationCode, 'findFirst').mockResolvedValue(null);
      const upsertSpy = jest.spyOn(prisma.socialVerificationCode, 'upsert').mockResolvedValue({} as never);

      await RequestVerificationCode(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(upsertSpy).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            username: 'new_creator',
            code: expect.stringMatching(/^KD-[A-Z0-9]{4}$/),
          }),
        })
      );
    });

    it('happy path: reuses existing active challenge code if unexpired', async () => {
      const unexpiredDate = new Date(Date.now() + 5 * 60 * 1000);
      const req = CreateMockRequest({
        account: { sub: mockCreator.accountId, role: Role.CREATOR },
        body: { username: 'new_creator' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
      jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.socialVerificationCode, 'findFirst').mockResolvedValue({
        id: 'svc-1',
        creatorId: mockCreator.id,
        platform: Platform.TIKTOK,
        username: 'new_creator',
        code: 'KD-9999',
        expiresAt: unexpiredDate,
        status: Status.ACTIVE,
      } as never);
      const upsertSpy = jest.spyOn(prisma.socialVerificationCode, 'upsert').mockResolvedValue({} as never);

      await RequestVerificationCode(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(upsertSpy).not.toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: 'KD-9999',
          }),
        })
      );
    });
  });

  // ===========================================================================
  // 3. VerifyTikTokBio Handler Tests
  // ===========================================================================
  describe('VerifyTikTokBio Handler', () => {
    it('returns 401 when account is unauthenticated', async () => {
      const req = CreateMockRequest({ account: undefined });
      const { res, statusMock } = CreateMockResponse();
      const next = CreateMockNext();

      await VerifyTikTokBio(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('returns 403 when account is not a CREATOR', async () => {
      const req = CreateMockRequest({
        account: { sub: 'acc-1', role: Role.ADMIN },
        body: { username: 'valid_handle' },
      });
      const { res, statusMock } = CreateMockResponse();
      const next = CreateMockNext();

      await VerifyTikTokBio(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(403);
    });

    it('returns 400 on invalid body schema', async () => {
      const req = CreateMockRequest({
        account: { sub: mockCreator.accountId, role: Role.CREATOR },
        body: { username: '' },
      });
      const { res, statusMock } = CreateMockResponse();
      const next = CreateMockNext();

      await VerifyTikTokBio(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('returns 404 when creator is not found', async () => {
      const req = CreateMockRequest({
        account: { sub: 'missing-acc', role: Role.CREATOR },
        body: { username: 'valid_handle' },
      });
      const { res, statusMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(null);

      await VerifyTikTokBio(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('returns 409 Conflict if handle already verified by someone else', async () => {
      const req = CreateMockRequest({
        account: { sub: mockCreator.accountId, role: Role.CREATOR },
        body: { username: 'taken_handle' },
      });
      const { res, statusMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
      jest
        .spyOn(prisma.creatorSocialAccount, 'findFirst')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          ...mockVerifiedAccount,
          creatorId: 'other-creator-id',
        } as never);

      await VerifyTikTokBio(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(409);
    });

    it('returns 200 immediately if handle is already verified by current creator', async () => {
      const req = CreateMockRequest({
        account: { sub: mockCreator.accountId, role: Role.CREATOR },
        body: { username: mockVerifiedAccount.username },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
      jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(mockVerifiedAccount as never);

      await VerifyTikTokBio(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(mockGetTikTokUserProfile).not.toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: mockVerifiedAccount,
        })
      );
    });

    it('returns 404 when no verification challenge exists', async () => {
      const req = CreateMockRequest({
        account: { sub: mockCreator.accountId, role: Role.CREATOR },
        body: { username: 'unclaimed_handle' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
      jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.socialVerificationCode, 'findFirst').mockResolvedValue(null);

      await VerifyTikTokBio(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ message: SOCIAL_ACCOUNT_MESSAGES.CHALLENGE_NOT_FOUND }));
    });

    it('returns 400 when verification code has expired', async () => {
      const expiredDate = new Date(Date.now() - 60000); // 1 minute ago
      const req = CreateMockRequest({
        account: { sub: mockCreator.accountId, role: Role.CREATOR },
        body: { username: 'expired_handle' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
      jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.socialVerificationCode, 'findFirst').mockResolvedValue({
        id: 'svc-1',
        creatorId: mockCreator.id,
        platform: Platform.TIKTOK,
        username: 'expired_handle',
        code: 'KD-EXPD',
        expiresAt: expiredDate,
        status: Status.ACTIVE,
      } as never);

      await VerifyTikTokBio(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ message: SOCIAL_ACCOUNT_MESSAGES.CODE_EXPIRED }));
    });

    it('returns 400 when ScrapeCreators fails to fetch TikTok profile (e.g. private/nonexistent)', async () => {
      const req = CreateMockRequest({
        account: { sub: mockCreator.accountId, role: Role.CREATOR },
        body: { username: 'private_creator' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
      jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.socialVerificationCode, 'findFirst').mockResolvedValue({
        id: 'svc-1',
        creatorId: mockCreator.id,
        platform: Platform.TIKTOK,
        username: 'private_creator',
        code: 'KD-1234',
        expiresAt: new Date(Date.now() + 600000),
        status: Status.ACTIVE,
      } as never);

      mockGetTikTokUserProfile.mockRejectedValue(new Error('Profile not found'));

      await VerifyTikTokBio(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: SOCIAL_ACCOUNT_MESSAGES.PROFILE_ACCESS_FAILED('private_creator') })
      );
    });

    it('returns 400 when verification code is NOT detected in bio', async () => {
      const req = CreateMockRequest({
        account: { sub: mockCreator.accountId, role: Role.CREATOR },
        body: { username: 'test_creator' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
      jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.socialVerificationCode, 'findFirst').mockResolvedValue({
        id: 'svc-1',
        creatorId: mockCreator.id,
        platform: Platform.TIKTOK,
        username: 'test_creator',
        code: 'KD-WANT',
        expiresAt: new Date(Date.now() + 600000),
        status: Status.ACTIVE,
      } as never);

      mockGetTikTokUserProfile.mockResolvedValue({
        username: 'test_creator',
        followersCount: 1500,
        bioDescription: 'Living my best life! Business: test@mail.com', // code missing
      });

      await VerifyTikTokBio(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: SOCIAL_ACCOUNT_MESSAGES.CODE_NOT_FOUND_IN_BIO('KD-WANT', 'test_creator') })
      );
    });

    it('happy path: verifies bio, persists avatar to storage, and commits transaction', async () => {
      const req = CreateMockRequest({
        account: { sub: mockCreator.accountId, role: Role.CREATOR },
        body: { username: 'test_creator' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
      jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.socialVerificationCode, 'findFirst').mockResolvedValue({
        id: 'svc-1',
        creatorId: mockCreator.id,
        platform: Platform.TIKTOK,
        username: 'test_creator',
        code: 'KD-GOOD',
        expiresAt: new Date(Date.now() + 600000),
        status: Status.ACTIVE,
      } as never);

      mockGetTikTokUserProfile.mockResolvedValue({
        username: 'test_creator',
        platformUserId: '987654321',
        followersCount: 8888,
        avatarUrl: 'https://p16-sign.tiktokcdn.com/avatar.jpg',
        bioDescription: 'Welcome! Code: KD-GOOD here.',
      });
      mockPersistSocialAvatarToStorage.mockResolvedValue('https://supabase.co/storage/v1/object/avatar.jpg');

      const expectedCreatedAccount = {
        id: 'new-verified-account-id',
        creatorId: mockCreator.id,
        platform: Platform.TIKTOK,
        username: 'test_creator',
        platformUserId: '987654321',
        avatarUrl: 'https://supabase.co/storage/v1/object/avatar.jpg',
        followersCount: 8888,
        isVerified: true,
        status: Status.ACTIVE,
      };

      const transactionSpy = jest
        .spyOn(prisma, '$transaction')
        .mockResolvedValue([{}, {}, expectedCreatedAccount] as never);

      await VerifyTikTokBio(req, res, next);

      expect(mockPersistSocialAvatarToStorage).toHaveBeenCalledWith(
        'https://p16-sign.tiktokcdn.com/avatar.jpg',
        mockCreator.id,
        Platform.TIKTOK,
        'test_creator'
      );
      expect(transactionSpy).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining(expectedCreatedAccount),
          message: SOCIAL_ACCOUNT_MESSAGES.VERIFY_SUCCESS,
        })
      );
    });
  });

  // ===========================================================================
  // 4. GetConnectedSocialAccount Handler Tests
  // ===========================================================================
  describe('GetConnectedSocialAccount Handler', () => {
    it('returns 401 when account is unauthenticated', async () => {
      const req = CreateMockRequest({ account: undefined });
      const { res, statusMock } = CreateMockResponse();
      const next = CreateMockNext();

      await GetConnectedSocialAccount(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('returns 403 when account is BRAND', async () => {
      const req = CreateMockRequest({ account: { sub: 'acc-1', role: Role.BRAND } });
      const { res, statusMock } = CreateMockResponse();
      const next = CreateMockNext();

      await GetConnectedSocialAccount(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(403);
    });

    it('returns 404 when creator profile does not exist', async () => {
      const req = CreateMockRequest({ account: { sub: 'acc-1', role: Role.CREATOR } });
      const { res, statusMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(null);

      await GetConnectedSocialAccount(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('happy path: returns connected verified account when present', async () => {
      const req = CreateMockRequest({ account: { sub: mockCreator.accountId, role: Role.CREATOR } });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
      jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(mockVerifiedAccount as never);

      await GetConnectedSocialAccount(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining(mockVerifiedAccount),
          message: SOCIAL_ACCOUNT_MESSAGES.CONNECTED_ACCOUNT_RETRIEVED,
        })
      );
    });

    it('happy path: returns null data when no account is connected', async () => {
      const req = CreateMockRequest({ account: { sub: mockCreator.accountId, role: Role.CREATOR } });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
      jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(null);

      await GetConnectedSocialAccount(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: null,
        })
      );
    });
  });

  // ===========================================================================
  // 5. GetRecentTikTokVideos Handler Tests
  // ===========================================================================
  describe('GetRecentTikTokVideos Handler', () => {
    it('returns 401 when unauthenticated', async () => {
      const req = CreateMockRequest({ account: undefined });
      const { res, statusMock } = CreateMockResponse();
      const next = CreateMockNext();

      await GetRecentTikTokVideos(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('returns 403 when not a creator', async () => {
      const req = CreateMockRequest({ account: { sub: 'acc-1', role: Role.BRAND } });
      const { res, statusMock } = CreateMockResponse();
      const next = CreateMockNext();

      await GetRecentTikTokVideos(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(403);
    });

    it('returns 404 when creator is not found', async () => {
      const req = CreateMockRequest({ account: { sub: 'missing-acc', role: Role.CREATOR } });
      const { res, statusMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(null);

      await GetRecentTikTokVideos(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('returns 400 when no verified TikTok account exists', async () => {
      const req = CreateMockRequest({ account: { sub: mockCreator.accountId, role: Role.CREATOR } });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
      jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(null);

      await GetRecentTikTokVideos(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ message: SOCIAL_ACCOUNT_MESSAGES.NO_VERIFIED_TIKTOK }));
    });

    it('returns 400 when ScrapeCreators throws an error retrieving videos', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const req = CreateMockRequest({ account: { sub: mockCreator.accountId, role: Role.CREATOR } });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
      jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(mockVerifiedAccount as never);
      mockGetTikTokRecentVideos.mockRejectedValue(new Error('Rate limit exceeded'));

      await GetRecentTikTokVideos(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: SOCIAL_ACCOUNT_MESSAGES.RECENT_VIDEOS_FAILED })
      );
    });

    it('happy path: returns recent videos successfully', async () => {
      const mockVideos = [
        {
          id: 'video-1',
          url: 'https://www.tiktok.com/@valid_creator/video/video-1',
          authorUsername: 'valid_creator',
          title: 'First video',
          viewCount: 1500,
        },
      ];

      const req = CreateMockRequest({ account: { sub: mockCreator.accountId, role: Role.CREATOR } });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
      jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(mockVerifiedAccount as never);
      mockGetTikTokRecentVideos.mockResolvedValue(mockVideos);

      await GetRecentTikTokVideos(req, res, next);

      expect(mockGetTikTokRecentVideos).toHaveBeenCalledWith(mockVerifiedAccount.username, TIKTOK_RECENT_VIDEOS_DEFAULT_LIMIT);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: mockVideos,
          message: SOCIAL_ACCOUNT_MESSAGES.RECENT_VIDEOS_SUCCESS,
        })
      );
    });
  });

  // ===========================================================================
  // 6. ValidateTikTokVideoUrl Handler Tests
  // ===========================================================================
  describe('ValidateTikTokVideoUrl Handler', () => {
    it('returns 401 when unauthenticated', async () => {
      const req = CreateMockRequest({ account: undefined });
      const { res, statusMock } = CreateMockResponse();
      const next = CreateMockNext();

      await ValidateTikTokVideoUrl(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('returns 403 when not a creator', async () => {
      const req = CreateMockRequest({
        account: { sub: 'acc-1', role: Role.BRAND },
        body: { videoUrl: 'https://www.tiktok.com/@creator/video/123' },
      });
      const { res, statusMock } = CreateMockResponse();
      const next = CreateMockNext();

      await ValidateTikTokVideoUrl(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(403);
    });

    it('returns 400 when videoUrl is invalid or non-TikTok BEFORE database queries', async () => {
      const req = CreateMockRequest({
        account: { sub: mockCreator.accountId, role: Role.CREATOR },
        body: { videoUrl: 'https://youtube.com/watch?v=123' },
      });
      const { res, statusMock } = CreateMockResponse();
      const next = CreateMockNext();

      const creatorSpy = jest.spyOn(prisma.creator, 'findFirst');

      await ValidateTikTokVideoUrl(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(creatorSpy).not.toHaveBeenCalled();
    });

    it('returns 404 when creator is not found', async () => {
      const req = CreateMockRequest({
        account: { sub: 'missing-acc', role: Role.CREATOR },
        body: { videoUrl: 'https://www.tiktok.com/@creator/video/123' },
      });
      const { res, statusMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(null);

      await ValidateTikTokVideoUrl(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('returns 400 when no verified TikTok account exists', async () => {
      const req = CreateMockRequest({
        account: { sub: mockCreator.accountId, role: Role.CREATOR },
        body: { videoUrl: 'https://www.tiktok.com/@creator/video/123' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
      jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(null);

      await ValidateTikTokVideoUrl(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ message: SOCIAL_ACCOUNT_MESSAGES.ACCOUNT_NOT_VERIFIED }));
    });

    it('returns 400 when ScrapeCreators fails to resolve video details', async () => {
      const req = CreateMockRequest({
        account: { sub: mockCreator.accountId, role: Role.CREATOR },
        body: { videoUrl: 'https://www.tiktok.com/@valid_creator/video/123' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
      jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(mockVerifiedAccount as never);
      mockGetTikTokVideoDetails.mockRejectedValue(new Error('Video is private'));

      await ValidateTikTokVideoUrl(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ message: SOCIAL_ACCOUNT_MESSAGES.VIDEO_VERIFY_FAILED }));
    });

    it('returns 400 when author handle differs AND authorPlatformUserId does not match', async () => {
      const req = CreateMockRequest({
        account: { sub: mockCreator.accountId, role: Role.CREATOR },
        body: { videoUrl: 'https://www.tiktok.com/@imposter/video/123' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
      jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(mockVerifiedAccount as never);

      mockGetTikTokVideoDetails.mockResolvedValue({
        id: '123',
        url: 'https://www.tiktok.com/@imposter/video/123',
        authorUsername: 'imposter',
        authorPlatformUserId: '9999999999', // Mismatched ID
        title: 'Video by imposter',
      });

      await ValidateTikTokVideoUrl(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: SOCIAL_ACCOUNT_MESSAGES.VIDEO_AUTHOR_MISMATCH('imposter', mockVerifiedAccount.username),
        })
      );
    });

    it('happy path: validates video when author handle exactly matches verified handle', async () => {
      const validVideo = {
        id: 'video-123',
        url: 'https://www.tiktok.com/@valid_creator/video/video-123',
        authorUsername: 'valid_creator',
        authorPlatformUserId: mockVerifiedAccount.platformUserId,
        title: 'My Video',
        viewCount: 10000,
      };

      const req = CreateMockRequest({
        account: { sub: mockCreator.accountId, role: Role.CREATOR },
        body: { videoUrl: 'https://www.tiktok.com/@valid_creator/video/video-123' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
      jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(mockVerifiedAccount as never);
      mockGetTikTokVideoDetails.mockResolvedValue(validVideo);

      await ValidateTikTokVideoUrl(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: validVideo,
          message: SOCIAL_ACCOUNT_MESSAGES.VIDEO_VALID_SUCCESS,
        })
      );
    });

    it('happy path (edge case): validates video when creator changed TikTok handle but permanent platformUserId matches', async () => {
      const renamedVideo = {
        id: 'video-456',
        url: 'https://www.tiktok.com/@new_renamed_handle/video/video-456',
        authorUsername: 'new_renamed_handle', // Handle changed!
        authorPlatformUserId: mockVerifiedAccount.platformUserId, // Permanent TikTok UID matches!
        title: 'Renamed Creator Video',
        viewCount: 20000,
      };

      const req = CreateMockRequest({
        account: { sub: mockCreator.accountId, role: Role.CREATOR },
        body: { videoUrl: 'https://www.tiktok.com/@new_renamed_handle/video/video-456' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.creator, 'findFirst').mockResolvedValue(mockCreator as never);
      jest.spyOn(prisma.creatorSocialAccount, 'findFirst').mockResolvedValue(mockVerifiedAccount as never);
      mockGetTikTokVideoDetails.mockResolvedValue(renamedVideo);

      await ValidateTikTokVideoUrl(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: renamedVideo,
          message: SOCIAL_ACCOUNT_MESSAGES.VIDEO_VALID_SUCCESS,
        })
      );
    });
  });
});
