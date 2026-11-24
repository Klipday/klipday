import { Router } from 'express';
import { RequireAuth } from '../../middleware/auth.middleware.js';
import {
  GetAllConnectedSocialAccounts,
  GetConnectedSocialAccount,
  GetRecentTikTokVideos,
  ProxySocialMediaThumbnail,
  RequestVerificationCode,
  ValidateTikTokVideoUrl,
  VerifyTikTokBio,
} from './social-account.handlers.js';

export const socialAccountRouter = Router();

// All social account endpoints require an active session
socialAccountRouter.use(RequireAuth);

socialAccountRouter.get('/media-proxy', ProxySocialMediaThumbnail);
socialAccountRouter.get('/connected/all', GetAllConnectedSocialAccounts);
socialAccountRouter.get('/connected', GetConnectedSocialAccount);

// Multi-platform parameterized routes (supports tiktok, instagram, youtube)
socialAccountRouter.post('/:platform/request-code', RequestVerificationCode);
socialAccountRouter.post('/:platform/verify', VerifyTikTokBio);
socialAccountRouter.get('/:platform/recent-videos', GetRecentTikTokVideos);
socialAccountRouter.post('/:platform/validate-video-url', ValidateTikTokVideoUrl);
