import { Router } from 'express';
import { RequireAuth } from '../../middleware/auth.middleware.js';
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
} from './wallet.handlers.js';

export const walletRouter = Router();

// All brand wallet endpoints require an authenticated session
walletRouter.use(RequireAuth);

walletRouter.get('/summary', GetBrandWalletSummary);
walletRouter.get('/transactions', GetBrandTransactions);
walletRouter.get('/top-up/active', GetActiveTopUpRequests);
walletRouter.post('/top-up', CreateTopUpRequest);
walletRouter.post('/top-up/proof', UploadTopUpProof);
walletRouter.post('/top-up/:id/submit', SubmitTopUpProof);
walletRouter.post('/top-up/:id/approve', SimulateTopUpApproval);
walletRouter.delete('/top-up/:id', CancelTopUpRequest);

// Withdrawal endpoints
walletRouter.get('/withdrawals/active', GetActiveWithdrawalRequests);
walletRouter.post('/withdraw', CreateWithdrawalRequest);
walletRouter.post('/withdraw/:id/request-cancel', RequestWithdrawalCancellation);
walletRouter.post('/withdraw/:id/approve-cancellation', ApproveWithdrawalCancellation);
walletRouter.delete('/withdraw/:id', CancelWithdrawalRequest);
walletRouter.post('/withdraw/:id/approve', SimulateWithdrawalApproval);
