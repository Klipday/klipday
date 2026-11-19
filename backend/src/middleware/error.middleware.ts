import type { ErrorRequestHandler, Request } from 'express';
import type { Prisma } from '../generated/prisma/client.js';
import { SendError } from '../utils/api-response.js';
import { prisma } from '../utils/prisma.js';

/**
 * Extracts safe request metadata by stripping known sensitive credential fields.
 *
 * @param req - Express request object.
 * @returns Sanitized metadata object for error tracking.
 */
function ExtractSafeMetadata(req: Request): Record<string, unknown> {
  const rawBody = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};
  const { password, token, confirmPassword, secret, code, otp, ...safeBody } = rawBody;

  const rawQuery = req.query && typeof req.query === 'object' ? (req.query as Record<string, unknown>) : {};
  const { token: queryToken, code: queryCode, otp: queryOtp, ...safeQuery } = rawQuery;
  void password;
  void token;
  void confirmPassword;
  void secret;
  void code;
  void otp;
  void queryToken;
  void queryCode;
  void queryOtp;

  const metadata: Record<string, unknown> = {
    params: req.params,
    query: safeQuery,
    body: safeBody,
    ip: req.ip,
  };

  return metadata;
}

/**
 * Centralized Express error-handling middleware.
 *
 * Logs uncaught server errors (500+) to the Prisma `ErrorLog` table with
 * request attribution and safe metadata, then sends a consistent error response.
 *
 * @param err - The caught error object.
 * @param req - Express request object.
 * @param res - Express response object.
 * @param _next - Express next function.
 */
export const ErrorHandler: ErrorRequestHandler = async (err, req, res, _next) => {
  console.error(err);

  const status = typeof err?.status === 'number' ? err.status : 500;
  const rawMessage = err instanceof Error ? err.message : 'Internal Server Error';
  const clientMessage =
    status >= 500 && process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : rawMessage;

  // Only persist internal server errors (500+) to DB to prevent log table bloat from client 4xx validation errors
  if (status >= 500) {
    const safeMetadata = ExtractSafeMetadata(req);
    const endpoint = `${req.method} ${req.originalUrl || req.url}`;
    const accountId = req.account?.sub ?? null;
    const stackTrace = err instanceof Error ? (err.stack ?? null) : null;

    try {
      await prisma.errorLog.create({
        data: {
          statusCode: status,
          message: rawMessage,
          stackTrace,
          endpoint,
          accountId,
          metadata: safeMetadata as Prisma.InputJsonValue,
        },
      });
    } catch (dbError) {
      // Prevent database logging failures from masking the actual server error
      console.error('Failed to write error log to database:', dbError);
    }
  }

  SendError(res, clientMessage, status);
};
