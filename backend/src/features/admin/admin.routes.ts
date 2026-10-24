import { Router } from 'express';
import { RequireAuth } from '../../middleware/auth.middleware.js';
import {
  DisqualifySettlementSubmission,
  FinalizeCampaignSettlement,
  GetAdminCampaignSettlementSummary,
  GetAdminSettlementCampaigns,
  RecalculateCampaignSettlementFifo,
  UpdateSettlementSubmissionViews,
} from './admin.handlers.js';

export const adminRouter = Router();

adminRouter.use(RequireAuth);

adminRouter.get('/settlements', GetAdminSettlementCampaigns);
adminRouter.get('/settlements/campaigns/:id', GetAdminCampaignSettlementSummary);
adminRouter.post('/settlements/campaigns/:id/recalculate', RecalculateCampaignSettlementFifo);
adminRouter.post('/settlements/campaigns/:id/finalize', FinalizeCampaignSettlement);
adminRouter.post('/settlements/submissions/:id/disqualify', DisqualifySettlementSubmission);
adminRouter.patch('/settlements/submissions/:id/views', UpdateSettlementSubmissionViews);
