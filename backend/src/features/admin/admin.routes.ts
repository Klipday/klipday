import { Router } from 'express';
import { RequireAuth } from '../../middleware/auth.middleware.js';
import {
  DisqualifySettlementSubmission,
  FinalizeCampaignSettlement,
  GetAdminCampaignSettlementSummary,
  GetAdminDashboardSummary,
  GetAdminKycRequests,
  GetAdminModerationCampaigns,
  GetAdminSettlementCampaigns,
  GetAdminTopUpRequests,
  GetAdminWithdrawals,
  ModerateCampaign,
  RecalculateCampaignSettlementFifo,
  ReviewBrandTopUpRequest,
  ReviewKycRequest,
  ReviewWithdrawalRequest,
  UpdateSettlementSubmissionViews,
} from './admin.handlers.js';

export const adminRouter = Router();

adminRouter.use(RequireAuth);

// Operational Admin Dashboard (Phase 6)
adminRouter.get('/dashboard', GetAdminDashboardSummary);

// KYC Verification Review (Phase 5)
adminRouter.get('/kyc', GetAdminKycRequests);
adminRouter.post('/kyc/:id/review', ReviewKycRequest);

// Withdrawal Review (Phase 4)
adminRouter.get('/withdrawals', GetAdminWithdrawals);
adminRouter.post('/withdrawals/:id/review', ReviewWithdrawalRequest);

// Top Up Review (Phase 3)
adminRouter.get('/top-ups', GetAdminTopUpRequests);
adminRouter.post('/top-ups/:id/review', ReviewBrandTopUpRequest);

// Campaign Moderation (Phase 2)
adminRouter.get('/campaigns', GetAdminModerationCampaigns);
adminRouter.post('/campaigns/:id/moderate', ModerateCampaign);

// Verification & Settlement (Phase 1)
adminRouter.get('/settlements', GetAdminSettlementCampaigns);
adminRouter.get('/settlements/campaigns/:id', GetAdminCampaignSettlementSummary);
adminRouter.post('/settlements/campaigns/:id/recalculate', RecalculateCampaignSettlementFifo);
adminRouter.post('/settlements/campaigns/:id/finalize', FinalizeCampaignSettlement);
adminRouter.post('/settlements/submissions/:id/disqualify', DisqualifySettlementSubmission);
adminRouter.patch('/settlements/submissions/:id/views', UpdateSettlementSubmissionViews);
