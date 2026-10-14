import { Router } from 'express';
import { RequireAuth } from '../../middleware/auth.middleware.js';
import {
  CreateBrandPayoutAccount,
  DeleteBrandPayoutAccount,
  GetBrandDashboardSummary,
  GetBrandPayoutAccounts,
  GetBrandProfile,
  SetPrimaryBrandPayoutAccount,
  UpdateBrandProfile,
  UploadBrandLogo,
  UploadBrandPayoutProof,
} from './brand.handlers.js';

export const brandRouter = Router();

// All brand profile, payout, and dashboard endpoints require an authenticated session
brandRouter.use(RequireAuth);

brandRouter.get('/dashboard', GetBrandDashboardSummary);
brandRouter.get('/profile', GetBrandProfile);
brandRouter.patch('/profile', UpdateBrandProfile);
brandRouter.post('/profile/logo', UploadBrandLogo);

brandRouter.get('/payout-accounts', GetBrandPayoutAccounts);
brandRouter.post('/payout-accounts', CreateBrandPayoutAccount);
brandRouter.post('/payout-accounts/proof', UploadBrandPayoutProof);
brandRouter.patch('/payout-accounts/:id/primary', SetPrimaryBrandPayoutAccount);
brandRouter.delete('/payout-accounts/:id', DeleteBrandPayoutAccount);
