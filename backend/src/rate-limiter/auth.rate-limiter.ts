import type { Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { SendError } from '../utils/api-response.js';

/**
 * Rate limiter for authentication routes: 20 requests per 15 minutes per IP.
 * Responds with the consistent API error shape when the limit is exceeded.
 */
export const AuthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    SendError(res, 'Too many requests. Please try again later.', 429);
  },
});
