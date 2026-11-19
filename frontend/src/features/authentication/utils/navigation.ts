import type { AuthRole } from '../types';

const AUTH_ROUTE_PREFIXES = [
  '/signin',
  '/login',
  '/signup',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
] as const;

/**
 * Resolves the primary dashboard route URL according to the account's authenticated role.
 * Maps CREATOR -> /creator-dashboard, ADMIN -> /admin-dashboard, and BRAND -> /brand-dashboard.
 *
 * @param role - The authenticated account role ('CREATOR', 'ADMIN', 'BRAND', or undefined/null).
 * @returns The destination dashboard path.
 */
export function GetDashboardRouteByRole(role?: AuthRole | string | null): string {
  if (role === 'CREATOR') {
    const creatorPath = '/creator-dashboard';
    return creatorPath;
  }

  if (role === 'ADMIN') {
    const adminPath = '/admin-dashboard';
    return adminPath;
  }

  if (role === 'BRAND') {
    const brandPath = '/brand-dashboard';
    return brandPath;
  }

  const fallbackPath = '/dashboard';
  return fallbackPath;
}

/**
 * Validates and normalizes an internal post-login redirect target from query params
 * or router location state. Rejects external URLs, protocol-relative paths, control characters,
 * and authentication pages to prevent open-redirect vulnerabilities and redirect loops.
 *
 * @param candidate - Redirect string or React Router location object.
 * @returns A safe internal relative path, or null if invalid or disallowed.
 */
export function ResolveSafeRedirectPath(candidate: unknown): string | null {
  let rawPath = '';

  if (typeof candidate === 'string') {
    rawPath = candidate.trim();
  } else if (
    candidate &&
    typeof candidate === 'object' &&
    'pathname' in candidate &&
    typeof (candidate as { pathname?: unknown }).pathname === 'string'
  ) {
    const locationObj = candidate as {
      pathname: string;
      search?: string;
      hash?: string;
    };
    const search = typeof locationObj.search === 'string' ? locationObj.search : '';
    const hash = typeof locationObj.hash === 'string' ? locationObj.hash : '';
    rawPath = `${locationObj.pathname}${search}${hash}`.trim();
  }

  if (!rawPath) {
    return null;
  }

  if (
    !rawPath.startsWith('/') ||
    rawPath.startsWith('//') ||
    rawPath.startsWith('/\\') ||
    rawPath.includes('://') ||
    /[\r\n]/.test(rawPath)
  ) {
    return null;
  }

  const [pathOnly] = rawPath.split(/[?#]/);
  const isAuthRoute = AUTH_ROUTE_PREFIXES.some(
    (prefix) => pathOnly === prefix || pathOnly.startsWith(`${prefix}/`),
  );

  if (isAuthRoute) {
    return null;
  }

  return rawPath;
}
