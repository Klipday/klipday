import { Router } from 'express';
import {
  ConfirmBankTransferPayment,
  DeleteCampaign,
  EditCampaign,
  GetCampaignById,
  GetCampaignPaymentDetails,
  GetCampaigns,
  GetCampaignStatusCounts,
  GetFeaturedCampaigns,
  InitializeCampaign,
  PayCampaignWithWallet,
  SubmitCampaign,
  UploadCampaignThumbnail,
  UploadPaymentProof,
  VerifyCampaignPayment,
} from './campaign.handlers.js';
import { RequireAuth } from '../../middleware/auth.middleware.js';

export const campaignRouter = Router();

// Every campaign endpoint requires a logged-in account.
campaignRouter.use(RequireAuth);

campaignRouter.get('/', GetCampaigns);
campaignRouter.get('/counts', GetCampaignStatusCounts);
campaignRouter.get('/featured', GetFeaturedCampaigns);
campaignRouter.get('/:id/payment', GetCampaignPaymentDetails);
campaignRouter.get('/:id', GetCampaignById);

campaignRouter.post('/', InitializeCampaign);
campaignRouter.post('/:id/submit', SubmitCampaign);
campaignRouter.post('/:id/checkout', SubmitCampaign);
campaignRouter.post('/:id/thumbnail', UploadCampaignThumbnail);
campaignRouter.post('/:id/payment/wallet', PayCampaignWithWallet);
campaignRouter.post('/:id/payment/proof', UploadPaymentProof);
campaignRouter.post('/:id/payment/confirm', ConfirmBankTransferPayment);
campaignRouter.post('/:id/payment/verify', VerifyCampaignPayment);

campaignRouter.patch('/:id/edit', EditCampaign);

campaignRouter.delete('/:id', DeleteCampaign);

