import { Router } from 'express';
import { RequireAuth } from '../../middleware/auth.middleware.js';
import {
  DisqualifySettlementSubmission,
  FinalizeCampaignSettlement,
  GetAdminCampaignSettlementSummary,
  GetAdminModerationCampaigns,
  GetAdminSettlementCampaigns,
  GetAdminTopUpRequests,
  ModerateCampaign,
  RecalculateCampaignSettlementFifo,
  ReviewBrandTopUpRequest,
  UpdateSettlementSubmissionViews,
} from './admin.handlers.js';

export const adminRouter = Router();

adminRouter.use(RequireAuth);

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
