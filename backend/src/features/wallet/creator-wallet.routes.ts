import { Router } from 'express';
import { RequireAuth } from '../../middleware/auth.middleware.js';
import {
  CreateCreatorPayoutAccount,
  DeleteCreatorPayoutAccount,
  GetCreatorPayoutAccounts,
  SetPrimaryCreatorPayoutAccount,
  UploadCreatorPayoutProof,
} from './creator-wallet.handlers.js';

export const creatorWalletRouter = Router();

// All creator wallet and payout endpoints require an authenticated session
creatorWalletRouter.use(RequireAuth);

creatorWalletRouter.get('/payout-accounts', GetCreatorPayoutAccounts);
creatorWalletRouter.post('/payout-accounts', CreateCreatorPayoutAccount);
creatorWalletRouter.post('/payout-accounts/proof', UploadCreatorPayoutProof);
creatorWalletRouter.patch('/payout-accounts/:id/primary', SetPrimaryCreatorPayoutAccount);
creatorWalletRouter.delete('/payout-accounts/:id', DeleteCreatorPayoutAccount);
