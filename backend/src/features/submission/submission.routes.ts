import { Router } from 'express';
import { RequireAuth } from '../../middleware/auth.middleware.js';
import {
  AcceptSubmission,
  FinalSubmitVideo,
  GetCampaignSubmissions,
  GetMyCampaignSubmission,
  JoinCampaign,
  RejectSubmission,
  RequestSubmissionRevision,
  SaveDraftSubmission,
} from './submission.handlers.js';

export const campaignSubmissionRouter = Router();

// All campaign submission endpoints require an authenticated session
campaignSubmissionRouter.use(RequireAuth);

// Campaign-scoped creator and submission endpoints
campaignSubmissionRouter.post('/:id/join', JoinCampaign);
campaignSubmissionRouter.get('/:id/my-submission', GetMyCampaignSubmission);
campaignSubmissionRouter.patch('/:id/submission/draft', SaveDraftSubmission);
campaignSubmissionRouter.post('/:id/submission/submit', FinalSubmitVideo);
campaignSubmissionRouter.get('/:id/submissions', GetCampaignSubmissions);

export const submissionRouter = Router();

// All submission review endpoints require an authenticated session
submissionRouter.use(RequireAuth);

// Brand & Admin submission review endpoints
submissionRouter.post('/:id/accept', AcceptSubmission);
submissionRouter.post('/:id/reject', RejectSubmission);
submissionRouter.post('/:id/revision', RequestSubmissionRevision);
