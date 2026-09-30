import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { authRouter } from './features/authentication/auth.routes.js';
import { campaignRouter } from './features/campaign/campaign.routes.js';
import { healthRouter } from './features/health/health.routes.js';
import { socialAccountRouter } from './features/social-account/social-account.routes.js';
import { campaignSubmissionRouter, submissionRouter } from './features/submission/submission.routes.js';
import { ErrorHandler } from './middleware/error.middleware.js';

/**
 * Builds the Express application with security middleware (Helmet, CORS),
 * JSON parsing, routes, and the centralized error handler.
 *
 * @returns A configured Express application (not yet listening).
 */
export function CreateApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(cookieParser());

  app.use('/health', healthRouter);

  app.use('/auth', authRouter);
  app.use('/social-accounts', socialAccountRouter);

  app.use('/campaigns', campaignSubmissionRouter);
  app.use('/campaigns', campaignRouter);
  app.use('/submissions', submissionRouter);

  app.use(ErrorHandler);

  return app;
}
