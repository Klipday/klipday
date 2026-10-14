import { Router } from 'express';
import { RequireAuth } from '../../middleware/auth.middleware.js';
import {
  GetCreatorProfile,
  UpdateCreatorProfile,
  UploadCreatorAvatar,
} from './creator.handlers.js';

export const creatorRouter = Router();

// All creator profile endpoints require an authenticated session
creatorRouter.use(RequireAuth);

creatorRouter.get('/profile', GetCreatorProfile);
creatorRouter.patch('/profile', UpdateCreatorProfile);
creatorRouter.post('/profile/avatar', UploadCreatorAvatar);
