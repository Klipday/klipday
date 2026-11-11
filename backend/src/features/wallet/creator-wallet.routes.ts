import { Router } from 'express';
import { RequireAuth } from '../../middleware/auth.middleware.js';
import {
  CreateCreatorPayoutAccount,
  CreateCreatorWithdrawal,
  DeleteCreatorPayoutAccount,
  GetActiveCreatorWithdrawals,
  GetCreatorPayoutAccounts,
  GetCreatorTransactions,
  GetCreatorWalletSummary,
  RequestCreatorWithdrawalCancellation,
  SetPrimaryCreatorPayoutAccount,
  UploadCreatorPayoutProof,
} from './creator-wallet.handlers.js';

export const creatorWalletRouter = Router();

// All creator wallet and payout endpoints require an authenticated session
creatorWalletRouter.use(RequireAuth);

// Wallet balance & ledger metrics
creatorWalletRouter.get('/summary', GetCreatorWalletSummary);
creatorWalletRouter.get('/transactions', GetCreatorTransactions);

// Payout accounts
creatorWalletRouter.get('/payout-accounts', GetCreatorPayoutAccounts);
creatorWalletRouter.post('/payout-accounts', CreateCreatorPayoutAccount);
creatorWalletRouter.post('/payout-accounts/proof', UploadCreatorPayoutProof);
creatorWalletRouter.patch('/payout-accounts/:id/primary', SetPrimaryCreatorPayoutAccount);
creatorWalletRouter.delete('/payout-accounts/:id', DeleteCreatorPayoutAccount);

// Withdrawals
creatorWalletRouter.get('/withdrawals/active', GetActiveCreatorWithdrawals);
creatorWalletRouter.post('/withdraw', CreateCreatorWithdrawal);
creatorWalletRouter.post('/withdraw/:id/request-cancel', RequestCreatorWithdrawalCancellation);

