import type { NextFunction, Request, Response } from 'express';
import {
  AUTH_COOKIE_NAME,
  AUTH_ERROR_CODES,
  AUTH_MESSAGES,
} from '../features/authentication/auth.constants.js';
import { SendError } from '../utils/api-response.js';

const SAFE_HTTP_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Parses a comma-separated origin configuration string into a normalized set of origin URLs.
 *
 * @param configuredOrigin - Comma-separated origin list from configuration.
 * @returns A Set containing trimmed, non-empty origin strings.
 */
export function ParseAllowedOrigins(configuredOrigin: string): Set<string> {
  const origins = configuredOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const originSet = new Set(origins);
  return originSet;
}

/**
 * Builds the set of trusted origins for the current request, combining configured
 * `CORS_ORIGIN` entries with the server's own resolved host origin.
 *
 * @param req - Express request object.
 * @returns Set of trusted origin strings.
 */
function BuildTrustedOrigins(req: Request): Set<string> {
  const configuredOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
  const allowedOrigins = ParseAllowedOrigins(configuredOrigin);

  const host =
    typeof req.get === 'function'
      ? req.get('host')
      : typeof req.headers.host === 'string'
        ? req.headers.host
        : undefined;

  if (host) {
    const protocol = req.protocol || 'http';
    const selfOrigin = `${protocol}://${host}`;
    allowedOrigins.add(selfOrigin);
  }

  return allowedOrigins;
}

/**
 * Sends the standardized 403 CSRF rejection response.
 *
 * @param res - Express response object.
 */
function SendCsrfForbidden(res: Response): void {
  const errorData = { code: AUTH_ERROR_CODES.CSRF_FORBIDDEN };
  SendError(res, AUTH_MESSAGES.CSRF_FORBIDDEN, 403, errorData);
}

/**
 * Express middleware that defends against Cross-Site Request Forgery (CSRF) on state-changing
 * requests by validating `Origin`, `Referer`, and `Sec-Fetch-Site` headers against trusted origins,
 * and requiring an explicit `X-Requested-With` header on cookie-authenticated mutations when
 * origin metadata headers are absent.
 *
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export function VerifyCsrfOrigin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const method = req.method?.toUpperCase() ?? 'GET';
  if (SAFE_HTTP_METHODS.has(method)) {
    next();
    return;
  }

  const allowedOrigins = BuildTrustedOrigins(req);

  const originHeader = req.headers.origin;
  if (typeof originHeader === 'string') {
    if (!allowedOrigins.has(originHeader)) {
      SendCsrfForbidden(res);
      return;
    }

    next();
    return;
  }

  const refererHeader = req.headers.referer;
  if (typeof refererHeader === 'string') {
    try {
      const parsedUrl = new URL(refererHeader);
      const refererOrigin = parsedUrl.origin;

      if (!allowedOrigins.has(refererOrigin)) {
        SendCsrfForbidden(res);
        return;
      }

      next();
      return;
    } catch {
      SendCsrfForbidden(res);
      return;
    }
  }

  const secFetchSiteHeader = req.headers['sec-fetch-site'];
  if (typeof secFetchSiteHeader === 'string') {
    const normalizedFetchSite = secFetchSiteHeader.toLowerCase();
    if (normalizedFetchSite !== 'same-origin' && normalizedFetchSite !== 'same-site') {
      SendCsrfForbidden(res);
      return;
    }
  }

  const cookies = req.cookies as Record<string, unknown> | undefined;
  const hasAuthCookie = typeof cookies?.[AUTH_COOKIE_NAME] === 'string';
  const hasRequestedWithHeader = Boolean(req.headers['x-requested-with']);

  if (hasAuthCookie && process.env.NODE_ENV !== 'test' && !hasRequestedWithHeader) {
    SendCsrfForbidden(res);
    return;
  }

  next();
}
