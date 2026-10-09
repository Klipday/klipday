import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Prisma } from '../src/generated/prisma/client.js';
import {
  CampaignStatus,
  PaymentStatus,
  PayoutStatus,
  Role,
  Status,
  SubmissionStatus,
  WalletTransactionType,
} from '../src/generated/prisma/enums.js';
import {
  KLIPDAY_DESTINATION_BANK,
  TOP_UP_LIMITS,
  WALLET_MESSAGES,
  WITHDRAWAL_LIMITS,
} from '../src/features/wallet/wallet.constants.js';
import {
  ApproveWithdrawalCancellation,
  CancelTopUpRequest,
  CancelWithdrawalRequest,
  CreateTopUpRequest,
  CreateWithdrawalRequest,
  GetActiveTopUpRequests,
  GetActiveWithdrawalRequests,
  GetBrandTransactions,
  GetBrandWalletSummary,
  RequestWithdrawalCancellation,
  SimulateTopUpApproval,
  SimulateWithdrawalApproval,
  SubmitTopUpProof,
  UploadTopUpProof,
} from '../src/features/wallet/wallet.handlers.js';
import {
  GenerateTopUpReferenceCode,
  GenerateTopUpUniqueCode,
  GenerateWalletTransactionReferenceCode,
  GenerateWithdrawalReferenceCode,
} from '../src/features/wallet/wallet.helper.js';

import { prisma } from '../src/utils/prisma.js';
import {
  CreateMockNext,
  CreateMockRequest,
  CreateMockResponse,
} from './helpers/mock-express.js';

describe('Brand Wallet Feature Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAccountId = 'acc-brand-test-123';
  const mockBrand = {
    id: 'brand-test-123',
    accountId: mockAccountId,
    companyName: 'PT Brand Klipday Testing',
    status: Status.ACTIVE,
  };

  const mockWallet = {
    id: 'wallet-test-123',
    accountId: mockAccountId,
    balance: new Prisma.Decimal(2500000),
    status: Status.ACTIVE,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  // ===========================================================================
  // 1. Helper & Code Generation Tests
  // ===========================================================================
  describe('Wallet Helpers', () => {
    it('generates a valid top-up reference code prefixed with TU-', () => {
      const code = GenerateTopUpReferenceCode();
      expect(code).toMatch(/^TU-[A-Z0-9]+-\d{4}$/);
    });

    it('generates a valid wallet transaction reference code prefixed with TXN-', () => {
      const code = GenerateWalletTransactionReferenceCode();
      expect(code).toMatch(/^TXN-[A-Z0-9]+-\d{4}$/);
    });

    it('generates a 3-digit unique code between 100 and 999', () => {
      const code = GenerateTopUpUniqueCode();
      expect(code).toBeGreaterThanOrEqual(TOP_UP_LIMITS.UNIQUE_CODE_MIN);
      expect(code).toBeLessThanOrEqual(TOP_UP_LIMITS.UNIQUE_CODE_MAX);
    });

    it('generates a valid withdrawal reference code prefixed with WD-', () => {
      const code = GenerateWithdrawalReferenceCode();
      expect(code).toMatch(/^WD-[A-Z0-9]+-\d{4}$/);
    });
  });


  // ===========================================================================
  // 2. GetBrandWalletSummary
  // ===========================================================================
  describe('GetBrandWalletSummary Handler', () => {
    it('returns 401 when account is missing', async () => {
      const req = CreateMockRequest({ account: undefined });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await GetBrandWalletSummary(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.AUTH_REQUIRED,
      });
    });

    it('returns 403 when role is not BRAND', async () => {
      const req = CreateMockRequest({
        account: { sub: 'creator-acc-1', role: Role.CREATOR },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await GetBrandWalletSummary(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.UNAUTHORIZED_ROLE,
      });
    });

    it('returns 403 when brand profile is not found', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.brand, 'findFirst').mockResolvedValue(null);

      await GetBrandWalletSummary(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.UNAUTHORIZED_ROLE,
      });
    });

    it('returns wallet summary with active balance, locked balance, and total creator payouts', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.brand, 'findFirst').mockResolvedValue(mockBrand as never);
      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);

      // Verified submissions: 2 submissions with earnings 150000 and 350000 -> total 500000
      jest.spyOn(prisma.submission, 'findMany').mockResolvedValue([
        { earnings: new Prisma.Decimal(150000) },
        { earnings: new Prisma.Decimal(350000) },
      ] as never);

      // Ongoing campaigns: 1 campaign budget 2,000,000 with 500,000 earned -> locked 1,500,000
      jest.spyOn(prisma.campaign, 'findMany').mockResolvedValue([
        {
          id: 'camp-1',
          budget: new Prisma.Decimal(2000000),
          submissions: [{ earnings: new Prisma.Decimal(500000) }],
        },
      ] as never);

      await GetBrandWalletSummary(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'success',
        data: {
          walletId: mockWallet.id,
          balance: 2500000,
          metrics: {
            activeBalance: 2500000,
            lockedBalance: 1500000,
            totalCreatorPayout: 500000,
          },
        },
        message: WALLET_MESSAGES.SUMMARY_FETCH_SUCCESS,
      });
    });

    it('auto-creates wallet when brand does not have a wallet record yet', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
      });
      const { res, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.brand, 'findFirst').mockResolvedValue(mockBrand as never);
      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.wallet, 'create').mockResolvedValue({
        id: 'new-wallet-id',
        accountId: mockAccountId,
        balance: new Prisma.Decimal(0),
        status: Status.ACTIVE,
      } as never);
      jest.spyOn(prisma.submission, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.campaign, 'findMany').mockResolvedValue([]);

      await GetBrandWalletSummary(req, res, next);

      expect(prisma.wallet.create).toHaveBeenCalledWith({
        data: {
          accountId: mockAccountId,
          balance: expect.any(Prisma.Decimal),
          status: Status.ACTIVE,
        },
      });
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            walletId: 'new-wallet-id',
            balance: 0,
          }),
        }),
      );
    });
  });

  // ===========================================================================
  // 3. CreateTopUpRequest
  // ===========================================================================
  describe('CreateTopUpRequest Handler', () => {
    it('returns 400 when amount is below minimum limit (Rp 50,000)', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        body: {
          amount: 20000,
          senderBank: 'BCA',
          senderAccountName: 'John Doe',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await CreateTopUpRequest(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.INVALID_AMOUNT_RANGE,
      });
    });

    it('returns 400 when amount exceeds maximum limit (Rp 100,000,000)', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        body: {
          amount: 200_000_000,
          senderBank: 'BCA',
          senderAccountName: 'John Doe',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await CreateTopUpRequest(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.INVALID_AMOUNT_RANGE,
      });
    });

    it('returns 400 when senderBank is missing or less than 2 characters', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        body: {
          amount: 1000000,
          senderBank: ' ',
          senderAccountName: 'John Doe',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await CreateTopUpRequest(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.SENDER_BANK_REQUIRED,
      });
    });

    it('returns 400 when senderAccountName is missing or less than 2 characters', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        body: {
          amount: 1000000,
          senderBank: 'BCA',
          senderAccountName: 'A',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await CreateTopUpRequest(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.SENDER_NAME_REQUIRED,
      });
    });

    it('successfully creates top-up request with unique code and BCA destination', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        body: {
          amount: 1000000,
          senderBank: 'BCA',
          senderAccountName: 'John Doe',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);

      const createdDate = new Date();
      (jest.spyOn(prisma.topUpRequest, 'create') as unknown as jest.Mock).mockImplementation(
        (args: unknown) => {
          const typedArgs = args as { data: { uniqueCode: number; referenceCode: string } };
          const data = typedArgs.data;
          return Promise.resolve({
            id: 'tu-123',
            referenceCode: data.referenceCode,
            walletId: mockWallet.id,
            amount: new Prisma.Decimal(1000000),
            uniqueCode: data.uniqueCode,
            totalPayable: new Prisma.Decimal(1000000 + data.uniqueCode),
            destinationBank: KLIPDAY_DESTINATION_BANK.bankName,
            destinationAccount: KLIPDAY_DESTINATION_BANK.accountNumber,
            destinationHolderName: KLIPDAY_DESTINATION_BANK.accountHolderName,
            senderBank: 'BCA',
            senderAccountName: 'John Doe',
            transferProofUrl: null,
            status: PaymentStatus.PENDING,
            rejectionReason: null,
            createdAt: createdDate,
            updatedAt: createdDate,
          });
        },
      );

      await CreateTopUpRequest(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: WALLET_MESSAGES.TOP_UP_CREATED_SUCCESS,
          data: expect.objectContaining({
            id: 'tu-123',
            amount: 1000000,
            status: PaymentStatus.PENDING,
            destinationBank: 'BCA',
            destinationAccount: '1234567890',
          }),
        }),
      );
    });
  });

  // ===========================================================================
  // 4. SimulateTopUpApproval
  // ===========================================================================
  describe('SimulateTopUpApproval Handler', () => {
    it('returns 404 when top-up request is not found', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        params: { id: 'unknown-tu-id' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.topUpRequest, 'findFirst').mockResolvedValue(null);

      await SimulateTopUpApproval(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.TOP_UP_NOT_FOUND,
      });
    });

    it('returns 400 when top-up request is already approved', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        params: { id: 'tu-already-approved' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.topUpRequest, 'findFirst').mockResolvedValue({
        id: 'tu-already-approved',
        status: PaymentStatus.APPROVED,
      } as never);

      await SimulateTopUpApproval(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.TOP_UP_ALREADY_PROCESSED,
      });
    });

    it('atomically credits wallet balance and creates a BRAND_DEPOSIT transaction', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        params: { id: 'tu-pending-1' },
      });
      const { res, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.topUpRequest, 'findFirst').mockResolvedValue({
        id: 'tu-pending-1',
        referenceCode: 'TU-TEST-1234',
        walletId: mockWallet.id,
        amount: new Prisma.Decimal(500000),
        uniqueCode: 123,
        totalPayable: new Prisma.Decimal(500123),
        destinationBank: 'BCA',
        destinationAccount: '1234567890',
        destinationHolderName: 'PT Klipday Media Kreasi',
        senderBank: 'Mandiri',
        senderAccountName: 'Budi Test',
        transferProofUrl: 'https://example.com/proof.jpg',
        status: PaymentStatus.SUBMITTED,
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      (jest.spyOn(prisma, '$transaction') as unknown as jest.Mock).mockImplementation(
        async (...args: unknown[]) => {
          const callback = args[0] as (tx: unknown) => Promise<unknown>;
          const txMock = {
          topUpRequest: {
            update: jest.fn().mockResolvedValue({
              id: 'tu-pending-1',
              referenceCode: 'TU-TEST-1234',
              walletId: mockWallet.id,
              amount: new Prisma.Decimal(500000),
              uniqueCode: 123,
              totalPayable: new Prisma.Decimal(500123),
              destinationBank: 'BCA',
              destinationAccount: '1234567890',
              destinationHolderName: 'PT Klipday Media Kreasi',
              senderBank: 'Mandiri',
              senderAccountName: 'Budi Test',
              transferProofUrl: 'https://example.com/proof.jpg',
              status: PaymentStatus.APPROVED,
              rejectionReason: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as never),
          },
          wallet: {
            findUniqueOrThrow: jest.fn().mockResolvedValue(mockWallet as never),
            update: jest.fn().mockResolvedValue({
              id: mockWallet.id,
              balance: new Prisma.Decimal(3000000), // 2.5M + 500k
            } as never),
          },
          walletTransaction: {
            create: jest.fn().mockResolvedValue({
              id: 'txn-new-1',
              referenceCode: 'TXN-TEST-9999',
              amount: new Prisma.Decimal(500000),
              balanceAfter: new Prisma.Decimal(3000000),
            } as never),
          },
        };
        return (callback as (tx: unknown) => Promise<unknown>)(txMock);
      });

      await SimulateTopUpApproval(req, res, next);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: WALLET_MESSAGES.TOP_UP_SIMULATION_SUCCESS,
          data: expect.objectContaining({
            wallet: expect.objectContaining({
              balance: 3000000,
            }),
            transaction: expect.objectContaining({
              amount: 500000,
              balanceAfter: 3000000,
            }),
          }),
        }),
      );
    });
  });

  // ===========================================================================
  // 5. GetBrandTransactions
  // ===========================================================================
  describe('GetBrandTransactions Handler', () => {
    it('returns 400 when query params are invalid', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        query: { page: '-1' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await GetBrandTransactions(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.INVALID_QUERY_PARAMS,
      });
    });

    it('returns filtered and paginated transactions for brand', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        query: { type: 'BRAND_DEPOSIT', page: '1', limit: '10' },
      });
      const { res, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.walletTransaction, 'count').mockResolvedValue(1);
      jest.spyOn(prisma.walletTransaction, 'findMany').mockResolvedValue([
        {
          id: 'txn-1',
          referenceCode: 'TXN-001',
          type: WalletTransactionType.BRAND_DEPOSIT,
          amount: new Prisma.Decimal(1000000),
          balanceBefore: new Prisma.Decimal(0),
          balanceAfter: new Prisma.Decimal(1000000),
          description: 'Top up saldo via transfer bank',
          transactionDate: new Date('2026-02-01T00:00:00Z'),
          campaignId: null,
          submissionId: null,
          createdAt: new Date('2026-02-01T00:00:00Z'),
        },
      ] as never);

      await GetBrandTransactions(req, res, next);

      expect(jsonMock).toHaveBeenCalledWith({
        status: 'success',
        data: {
          transactions: [
            expect.objectContaining({
              id: 'txn-1',
              amount: 1000000,
              type: WalletTransactionType.BRAND_DEPOSIT,
            }),
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
          },
        },
        message: WALLET_MESSAGES.TRANSACTIONS_FETCH_SUCCESS,
      });
    });
  });

  // ===========================================================================
  // 6. UploadTopUpProof
  // ===========================================================================
  describe('UploadTopUpProof Handler', () => {
    it('returns 400 for unsupported mime type', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        headers: { 'content-type': 'application/pdf' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await UploadTopUpProof(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.UNSUPPORTED_FILE_TYPE,
      });
    });

    it('returns 411 when content-length header is missing', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        headers: { 'content-type': 'image/jpeg' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await UploadTopUpProof(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(411);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.CONTENT_LENGTH_REQUIRED,
      });
    });

    it('returns 400 when file size exceeds 5MB limit', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        headers: {
          'content-type': 'image/png',
          'content-length': String(10 * 1024 * 1024),
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await UploadTopUpProof(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.FILE_SIZE_EXCEEDED,
      });
    });
  });

  // ===========================================================================
  // 6. GetActiveTopUpRequests
  // ===========================================================================
  describe('GetActiveTopUpRequests Handler', () => {
    it('returns 401 when account is missing', async () => {
      const req = CreateMockRequest({ account: undefined });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await GetActiveTopUpRequests(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.AUTH_REQUIRED,
      });
    });

    it('returns 403 when role is not BRAND', async () => {
      const req = CreateMockRequest({
        account: { sub: 'creator-acc-1', role: Role.CREATOR },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await GetActiveTopUpRequests(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.UNAUTHORIZED_ROLE,
      });
    });

    it('returns empty array when brand wallet does not exist', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(null);

      await GetActiveTopUpRequests(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'success',
        data: [],
        message: WALLET_MESSAGES.ACTIVE_TOP_UPS_FETCH_SUCCESS,
      });
    });

    it('returns list of active unapproved top-ups created within 24 hours', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      const mockTopUp = {
        id: 'topup-1',
        referenceCode: 'TU-TEST-1001',
        walletId: mockWallet.id,
        amount: new Prisma.Decimal(500000),
        uniqueCode: 123,
        totalPayable: new Prisma.Decimal(500123),
        destinationBank: 'BCA',
        destinationAccount: '1234567890',
        destinationHolderName: 'PT Klipday Media Kreasi',
        senderBank: 'BCA',
        senderAccountName: 'Budi Santoso',
        transferProofUrl: null,
        status: PaymentStatus.PENDING,
        rejectionReason: null,
        recordStatus: Status.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.topUpRequest, 'findMany').mockResolvedValue([mockTopUp] as never);

      await GetActiveTopUpRequests(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'success',
        data: [
          expect.objectContaining({
            id: 'topup-1',
            referenceCode: 'TU-TEST-1001',
            amount: 500000,
            totalPayable: 500123,
            status: PaymentStatus.PENDING,
          }),
        ],
        message: WALLET_MESSAGES.ACTIVE_TOP_UPS_FETCH_SUCCESS,
      });
    });
  });

  // ===========================================================================
  // 7. SubmitTopUpProof
  // ===========================================================================
  describe('SubmitTopUpProof Handler', () => {
    it('returns 401 when account is missing', async () => {
      const req = CreateMockRequest({ account: undefined });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await SubmitTopUpProof(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.AUTH_REQUIRED,
      });
    });

    it('returns 403 when role is not BRAND', async () => {
      const req = CreateMockRequest({
        account: { sub: 'creator-acc-1', role: Role.CREATOR },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await SubmitTopUpProof(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.UNAUTHORIZED_ROLE,
      });
    });

    it('returns 400 when transfer proof URL is invalid', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        params: { id: 'topup-1' },
        body: { transferProofUrl: 'not-a-valid-url' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await SubmitTopUpProof(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: 'URL bukti transfer tidak valid',
      });
    });

    it('returns 404 when top-up request is not found', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        params: { id: 'topup-nonexistent' },
        body: {},
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.topUpRequest, 'findFirst').mockResolvedValue(null);

      await SubmitTopUpProof(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.TOP_UP_NOT_FOUND,
      });
    });

    it('returns 400 when top-up is already approved', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        params: { id: 'topup-1' },
        body: {},
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      const existingTopUp = {
        id: 'topup-1',
        walletId: mockWallet.id,
        status: PaymentStatus.APPROVED,
        recordStatus: Status.ACTIVE,
      };

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.topUpRequest, 'findFirst').mockResolvedValue(existingTopUp as never);

      await SubmitTopUpProof(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.TOP_UP_ALREADY_PROCESSED,
      });
    });

    it('successfully updates top-up to SUBMITTED status with proof URL', async () => {
      const proofUrl = 'https://supabase.co/storage/v1/object/public/proofs/test.jpg';
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        params: { id: 'topup-1' },
        body: { transferProofUrl: proofUrl },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      const existingTopUp = {
        id: 'topup-1',
        referenceCode: 'TU-TEST-1001',
        walletId: mockWallet.id,
        amount: new Prisma.Decimal(500000),
        uniqueCode: 123,
        totalPayable: new Prisma.Decimal(500123),
        destinationBank: 'BCA',
        destinationAccount: '1234567890',
        destinationHolderName: 'PT Klipday Media Kreasi',
        senderBank: 'BCA',
        senderAccountName: 'Budi Santoso',
        transferProofUrl: null,
        status: PaymentStatus.PENDING,
        rejectionReason: null,
        recordStatus: Status.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedTopUp = {
        ...existingTopUp,
        status: PaymentStatus.SUBMITTED,
        transferProofUrl: proofUrl,
      };

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.topUpRequest, 'findFirst').mockResolvedValue(existingTopUp as never);
      jest.spyOn(prisma.topUpRequest, 'update').mockResolvedValue(updatedTopUp as never);

      await SubmitTopUpProof(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'success',
        data: expect.objectContaining({
          id: 'topup-1',
          status: PaymentStatus.SUBMITTED,
          transferProofUrl: proofUrl,
        }),
        message: WALLET_MESSAGES.TOP_UP_SUBMIT_SUCCESS,
      });
    });
  });

  // ===========================================================================
  // 8. CancelTopUpRequest
  // ===========================================================================
  describe('CancelTopUpRequest Handler', () => {
    it('returns 401 when account is missing', async () => {
      const req = CreateMockRequest({ account: undefined });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await CancelTopUpRequest(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.AUTH_REQUIRED,
      });
    });

    it('returns 403 when role is not BRAND', async () => {
      const req = CreateMockRequest({
        account: { sub: 'creator-acc-1', role: Role.CREATOR },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await CancelTopUpRequest(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.UNAUTHORIZED_ROLE,
      });
    });

    it('returns 404 when top-up is not found', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        params: { id: 'topup-missing' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.topUpRequest, 'findFirst').mockResolvedValue(null);

      await CancelTopUpRequest(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.TOP_UP_NOT_FOUND,
      });
    });

    it('returns 400 when top-up is already approved', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        params: { id: 'topup-1' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      const approvedTopUp = {
        id: 'topup-1',
        walletId: mockWallet.id,
        status: PaymentStatus.APPROVED,
        recordStatus: Status.ACTIVE,
      };

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.topUpRequest, 'findFirst').mockResolvedValue(approvedTopUp as never);

      await CancelTopUpRequest(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.TOP_UP_CANNOT_BE_CANCELLED,
      });
    });

    it('successfully soft-deletes pending top-up request', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        params: { id: 'topup-1' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      const pendingTopUp = {
        id: 'topup-1',
        walletId: mockWallet.id,
        status: PaymentStatus.PENDING,
        recordStatus: Status.ACTIVE,
      };

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.topUpRequest, 'findFirst').mockResolvedValue(pendingTopUp as never);
      const updateSpy = jest.spyOn(prisma.topUpRequest, 'update').mockResolvedValue({
        ...pendingTopUp,
        recordStatus: Status.DELETED,
      } as never);

      await CancelTopUpRequest(req, res, next);

      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 'topup-1' },
        data: { recordStatus: Status.DELETED },
      });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'success',
        data: { id: 'topup-1' },
        message: WALLET_MESSAGES.TOP_UP_CANCEL_SUCCESS,
      });
    });
  });

  // ===========================================================================
  // 9. GetActiveWithdrawalRequests
  // ===========================================================================
  describe('GetActiveWithdrawalRequests Handler', () => {
    it('returns 401 when account is unauthenticated', async () => {
      const req = CreateMockRequest({ account: undefined });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await GetActiveWithdrawalRequests(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.AUTH_REQUIRED,
      });
    });

    it('returns active pending withdrawals for brand', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      const mockWithdrawals = [
        {
          id: 'wd-1',
          referenceCode: 'WD-ABC-1234',
          walletId: mockWallet.id,
          amount: new Prisma.Decimal(500000),
          accountProvider: 'BCA',
          accountNumber: '1234567890',
          accountHolderName: 'Brand Test',
          payoutStatus: PayoutStatus.PENDING,
          rejectionReason: null,
          transferProofUrl: null,
          adminNote: null,
          createdAt: new Date('2026-03-01T00:00:00Z'),
          updatedAt: new Date('2026-03-01T00:00:00Z'),
        },
      ];

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.payoutRequest, 'findMany').mockResolvedValue(mockWithdrawals as never);

      await GetActiveWithdrawalRequests(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: [
            expect.objectContaining({
              id: 'wd-1',
              amount: 500000,
              accountProvider: 'BCA',
            }),
          ],
        }),
      );
    });
  });

  // ===========================================================================
  // 10. CreateWithdrawalRequest
  // ===========================================================================
  describe('CreateWithdrawalRequest Handler', () => {
    it('rejects withdrawal if balance is insufficient', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        body: {
          amount: 5000000, // wallet has 2.500.000
          accountProvider: 'BCA',
          accountNumber: '1234567890',
          accountHolderName: 'Brand Test',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);

      await CreateWithdrawalRequest(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.INSUFFICIENT_BALANCE,
      });
    });

    it('rejects withdrawal if amount is below minimum', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        body: {
          amount: 10000, // below 50.000
          accountProvider: 'BCA',
          accountNumber: '1234567890',
          accountHolderName: 'Brand Test',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await CreateWithdrawalRequest(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: WALLET_MESSAGES.INVALID_WITHDRAWAL_AMOUNT,
        }),
      );
    });

    it('creates withdrawal request and deducts wallet balance immediately', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        body: {
          amount: 500000,
          accountProvider: 'BCA',
          accountNumber: '1234567890',
          accountHolderName: 'Brand Test',
        },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      const createdPayout = {
        id: 'wd-created-1',
        referenceCode: 'WD-TEST-0001',
        walletId: mockWallet.id,
        amount: new Prisma.Decimal(500000),
        accountProvider: 'BCA',
        accountNumber: '1234567890',
        accountHolderName: 'Brand Test',
        payoutStatus: PayoutStatus.PENDING,
        rejectionReason: null,
        transferProofUrl: null,
        adminNote: null,
        createdAt: new Date('2026-03-01T00:00:00Z'),
        updatedAt: new Date('2026-03-01T00:00:00Z'),
      };

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: never) => {
        const tx = {
          wallet: { update: jest.fn() },
          payoutRequest: { create: jest.fn().mockResolvedValue(createdPayout as never) },
        };
        return (callback as (txMock: typeof tx) => Promise<unknown>)(tx);
      });

      await CreateWithdrawalRequest(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            id: 'wd-created-1',
            amount: 500000,
            accountProvider: 'BCA',
          }),
          message: WALLET_MESSAGES.WITHDRAWAL_CREATED_SUCCESS,
        }),
      );
    });
  });

  // ===========================================================================
  // 11. CancelWithdrawalRequest & Cancellation Request Flow
  // ===========================================================================
  describe('CancelWithdrawalRequest Handler', () => {
    it('blocks direct unilateral cancellation and returns 400', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        params: { id: 'wd-1' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      await CancelWithdrawalRequest(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.WITHDRAWAL_CANNOT_CANCEL_DIRECTLY,
      });
    });
  });

  describe('RequestWithdrawalCancellation Handler', () => {
    it('successfully records cancellation request without refunding wallet balance', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        params: { id: 'wd-1' },
        body: { reason: 'Salah masukkan nomor rekening' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      const pendingPayout = {
        id: 'wd-1',
        referenceCode: 'WD-TEST-0001',
        walletId: mockWallet.id,
        amount: new Prisma.Decimal(500000),
        accountProvider: 'BCA',
        accountNumber: '1234567890',
        accountHolderName: 'Brand Test',
        payoutStatus: PayoutStatus.PENDING,
        status: Status.ACTIVE,
        rejectionReason: null,
        transferProofUrl: null,
        adminNote: null,
        cancellationRequestedAt: null,
        cancellationReason: null,
        createdAt: new Date('2026-03-01T00:00:00Z'),
        updatedAt: new Date('2026-03-01T00:00:00Z'),
      };

      const updatedPayout = {
        ...pendingPayout,
        cancellationRequestedAt: new Date('2026-03-01T01:00:00Z'),
        cancellationReason: 'Salah masukkan nomor rekening',
      };

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.payoutRequest, 'findFirst').mockResolvedValue(pendingPayout as never);
      const updatePayoutSpy = jest.spyOn(prisma.payoutRequest, 'update').mockResolvedValue(updatedPayout as never);
      const updateWalletSpy = jest.spyOn(prisma.wallet, 'update');

      await RequestWithdrawalCancellation(req, res, next);

      expect(updatePayoutSpy).toHaveBeenCalledWith({
        where: { id: 'wd-1' },
        data: {
          cancellationRequestedAt: expect.any(Date),
          cancellationReason: 'Salah masukkan nomor rekening',
        },
      });
      // CRITICAL SECURITY ASSERTION: Wallet balance must NEVER be touched when requesting cancellation!
      expect(updateWalletSpy).not.toHaveBeenCalled();

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            id: 'wd-1',
            cancellationReason: 'Salah masukkan nomor rekening',
          }),
          message: WALLET_MESSAGES.WITHDRAWAL_CANCELLATION_REQUESTED_SUCCESS,
        }),
      );
    });

    it('rejects if cancellation is already requested', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        params: { id: 'wd-1' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      const alreadyRequestedPayout = {
        id: 'wd-1',
        walletId: mockWallet.id,
        amount: new Prisma.Decimal(500000),
        payoutStatus: PayoutStatus.PENDING,
        status: Status.ACTIVE,
        cancellationRequestedAt: new Date('2026-03-01T01:00:00Z'),
      };

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.payoutRequest, 'findFirst').mockResolvedValue(alreadyRequestedPayout as never);

      await RequestWithdrawalCancellation(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        data: null,
        message: WALLET_MESSAGES.WITHDRAWAL_CANCELLATION_ALREADY_REQUESTED,
      });
    });
  });

  describe('ApproveWithdrawalCancellation Handler', () => {
    it('approves cancellation request and atomically refunds wallet balance', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        params: { id: 'wd-1' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      const pendingCancellationPayout = {
        id: 'wd-1',
        referenceCode: 'WD-TEST-0001',
        walletId: mockWallet.id,
        amount: new Prisma.Decimal(500000),
        accountProvider: 'BCA',
        accountNumber: '1234567890',
        accountHolderName: 'Brand Test',
        payoutStatus: PayoutStatus.PENDING,
        status: Status.ACTIVE,
        rejectionReason: null,
        transferProofUrl: null,
        adminNote: null,
        cancellationRequestedAt: new Date('2026-03-01T01:00:00Z'),
        cancellationReason: 'Salah input',
        createdAt: new Date('2026-03-01T00:00:00Z'),
        updatedAt: new Date('2026-03-01T00:00:00Z'),
      };

      const updatedPayout = {
        ...pendingCancellationPayout,
        payoutStatus: PayoutStatus.REJECTED,
        rejectionReason: 'Dibatalkan atas permintaan Brand: Salah input',
      };

      const updatedWallet = {
        ...mockWallet,
        balance: new Prisma.Decimal(3000000),
      };

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.payoutRequest, 'findFirst').mockResolvedValue(pendingCancellationPayout as never);

      const updatePayoutSpy = jest.fn().mockResolvedValue(updatedPayout as never);
      const updateWalletSpy = jest.fn().mockResolvedValue(updatedWallet as never);

      jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: never) => {
        const tx = {
          payoutRequest: { update: updatePayoutSpy },
          wallet: { update: updateWalletSpy },
        };
        return (callback as (txMock: typeof tx) => Promise<unknown>)(tx);
      });

      await ApproveWithdrawalCancellation(req, res, next);

      expect(updatePayoutSpy).toHaveBeenCalledWith({
        where: { id: 'wd-1' },
        data: expect.objectContaining({
          payoutStatus: PayoutStatus.REJECTED,
          rejectionReason: 'Dibatalkan atas permintaan Brand: Salah input',
        }),
      });

      expect(updateWalletSpy).toHaveBeenCalledWith({
        where: { id: mockWallet.id },
        data: {
          balance: { increment: pendingCancellationPayout.amount },
        },
      });

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            payout: expect.objectContaining({
              id: 'wd-1',
              payoutStatus: PayoutStatus.REJECTED,
            }),
            wallet: expect.objectContaining({
              balance: 3000000,
            }),
          }),
          message: WALLET_MESSAGES.WITHDRAWAL_CANCELLATION_APPROVED_SUCCESS,
        }),
      );
    });
  });

  // ===========================================================================
  // 12. SimulateWithdrawalApproval
  // ===========================================================================
  describe('SimulateWithdrawalApproval Handler', () => {
    it('approves withdrawal and logs WITHDRAWAL transaction ledger row', async () => {
      const req = CreateMockRequest({
        account: { sub: mockAccountId, role: Role.BRAND },
        params: { id: 'wd-1' },
      });
      const { res, statusMock, jsonMock } = CreateMockResponse();
      const next = CreateMockNext();

      const pendingPayout = {
        id: 'wd-1',
        referenceCode: 'WD-SIM-0001',
        walletId: mockWallet.id,
        amount: new Prisma.Decimal(500000),
        accountProvider: 'BCA',
        accountNumber: '1234567890',
        accountHolderName: 'Brand Test',
        payoutStatus: PayoutStatus.PENDING,
        status: Status.ACTIVE,
        rejectionReason: null,
        transferProofUrl: null,
        adminNote: null,
        createdAt: new Date('2026-03-01T00:00:00Z'),
        updatedAt: new Date('2026-03-01T00:00:00Z'),
      };

      const updatedPayout = {
        ...pendingPayout,
        payoutStatus: PayoutStatus.APPROVED,
        processedAt: new Date(),
      };

      const mockTxn = {
        id: 'txn-wd-1',
        referenceCode: 'TXN-WD-0001',
        walletId: mockWallet.id,
        type: WalletTransactionType.WITHDRAWAL,
        amount: new Prisma.Decimal(500000),
        balanceBefore: new Prisma.Decimal(2500000),
        balanceAfter: new Prisma.Decimal(2000000),
      };

      jest.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(mockWallet as never);
      jest.spyOn(prisma.payoutRequest, 'findFirst').mockResolvedValue(pendingPayout as never);

      jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: never) => {
        const tx = {
          payoutRequest: { update: jest.fn().mockResolvedValue(updatedPayout as never) },
          wallet: { findUniqueOrThrow: jest.fn().mockResolvedValue(mockWallet as never) },
          walletTransaction: { create: jest.fn().mockResolvedValue(mockTxn as never) },
        };
        return (callback as (txMock: typeof tx) => Promise<unknown>)(tx);
      });

      await SimulateWithdrawalApproval(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            payout: expect.objectContaining({
              id: 'wd-1',
              payoutStatus: PayoutStatus.APPROVED,
            }),
            transaction: expect.objectContaining({
              id: 'txn-wd-1',
              amount: 500000,
            }),
          }),
          message: WALLET_MESSAGES.WITHDRAWAL_SIMULATION_SUCCESS,
        }),
      );
    });
  });
});

