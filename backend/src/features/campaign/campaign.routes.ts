import type { Request, Response } from 'express';
import { Router } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { RequireAuth } from '../../middleware/auth.middleware.js';
import { SendError } from '../../utils/api-response.js';
import { CAMPAIGN_MESSAGES, CAMPAIGN_RATE_LIMITS } from './campaign.constants.js';
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

/**
 * Generates a per-account rate-limit key for authenticated campaign write routes,
 * falling back cleanly to IPv6-normalized IP addresses.
 *
 * @param req - Express request object.
 * @returns Unique rate-limit bucket key.
 */
function BuildAccountRateLimitKey(req: Request): string {
  const accountId = req.account?.sub;
  if (accountId) {
    return `account:${accountId}`;
  }
  return ipKeyGenerator(req.ip ?? 'unknown');
}

const campaignCreateRateLimiter = rateLimit({
  windowMs: CAMPAIGN_RATE_LIMITS.CREATE_WINDOW_MS,
  limit: CAMPAIGN_RATE_LIMITS.CREATE_MAX_REQUESTS,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: BuildAccountRateLimitKey,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (_req: Request, res: Response) => {
    SendError(res, CAMPAIGN_MESSAGES.RATE_LIMIT_EXCEEDED, 429);
  },
});

const campaignUploadRateLimiter = rateLimit({
  windowMs: CAMPAIGN_RATE_LIMITS.UPLOAD_WINDOW_MS,
  limit: CAMPAIGN_RATE_LIMITS.UPLOAD_MAX_REQUESTS,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: BuildAccountRateLimitKey,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (_req: Request, res: Response) => {
    SendError(res, CAMPAIGN_MESSAGES.RATE_LIMIT_EXCEEDED, 429);
  },
});

export const campaignRouter = Router();

// Every campaign endpoint requires a logged-in account.
campaignRouter.use(RequireAuth);

campaignRouter.get('/', GetCampaigns);
campaignRouter.get('/counts', GetCampaignStatusCounts);
campaignRouter.get('/featured', GetFeaturedCampaigns);
campaignRouter.get('/:id/payment', GetCampaignPaymentDetails);
campaignRouter.get('/:id', GetCampaignById);

campaignRouter.post('/', campaignCreateRateLimiter, InitializeCampaign);
campaignRouter.post('/:id/submit', SubmitCampaign);
campaignRouter.post('/:id/thumbnail', campaignUploadRateLimiter, UploadCampaignThumbnail);
campaignRouter.post('/:id/payment/wallet', PayCampaignWithWallet);
campaignRouter.post('/:id/payment/proof', campaignUploadRateLimiter, UploadPaymentProof);
campaignRouter.post('/:id/payment/confirm', ConfirmBankTransferPayment);
campaignRouter.post('/:id/payment/verify', VerifyCampaignPayment);

campaignRouter.patch('/:id/edit', EditCampaign);

campaignRouter.delete('/:id', DeleteCampaign);

