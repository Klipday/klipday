import { Router } from 'express';
import { RequireAuth } from '../../middleware/auth.middleware.js';
import { AuthRateLimiter } from '../../rate-limiter/auth.rate-limiter.js';
import {
  ForgotPassword,
  GetCurrentAccount,
  LoginAccount,
  LogoutAccount,
  RegisterAccount,
  ResendVerificationEmail,
  ResetPassword,
  VerifyEmail,
} from './auth.handlers.js';

export const authRouter = Router();

authRouter.get('/me', RequireAuth, GetCurrentAccount);

authRouter.post('/register', AuthRateLimiter, RegisterAccount);
authRouter.post('/login', AuthRateLimiter, LoginAccount);
authRouter.post('/logout', LogoutAccount);

authRouter.post('/verify-email', AuthRateLimiter, VerifyEmail);
authRouter.post('/resend-verification', AuthRateLimiter, ResendVerificationEmail);

authRouter.post('/forgot-password', AuthRateLimiter, ForgotPassword);
authRouter.post('/reset-password', AuthRateLimiter, ResetPassword);
