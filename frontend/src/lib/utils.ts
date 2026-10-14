import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates and sanitizes a URL string to ensure it uses safe HTTP or HTTPS protocols.
 * Neutralizes dangerous pseudo-schemes such as `javascript:`, `data:`, or `vbscript:` to prevent DOM XSS.
 *
 * @param url - Untrusted URL string to test.
 * @returns The trimmed sanitized URL string if valid, or null if dangerous, empty, or non-HTTP.
 */
export function SanitizeHttpUrl(url?: string | null): string | null {
  if (!url) {
    return null;
  }

  const trimmedUrl = url.trim();
  const isHttpOrHttps = /^https?:\/\//i.test(trimmedUrl);
  if (!isHttpOrHttps) {
    return null;
  }

  return trimmedUrl;
}

/**
 * Normalizes a raw phone number input into standard Indonesian international format starting with 62.
 * Strips whitespace, hyphens, parentheses, and leading '+'. Converts leading '08' or '8' to '628'.
 *
 * @param input - The raw phone number string from user input or storage.
 * @returns Cleaned phone string starting with 62, or empty string if empty/null.
 */
export function NormalizePhoneNumberTo62(input?: string | null): string {
  if (!input || !input.trim()) {
    return '';
  }

  let cleaned = input.trim().replace(/[\s-()]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }

  if (cleaned.startsWith('08')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }

  return cleaned;
}
