/**
 * Token Utility Functions
 *
 * Helper functions for token management, expiration calculation,
 * and caching token metadata.
 */

import type { TokenResult } from '../services/cf-token-service';

/** Token expiration presets in seconds */
export const TOKEN_EXPIRY = {
  /** 15 minutes - for short operations */
  SHORT: 15 * 60,
  /** 1 hour - default session length */
  STANDARD: 60 * 60,
  /** 4 hours - extended session */
  EXTENDED: 4 * 60 * 60,
  /** 24 hours - long-running operations */
  DAILY: 24 * 60 * 60,
  /** 7 days - persistent access */
  WEEKLY: 7 * 24 * 60 * 60,
} as const;

/**
 * Calculates if a token is expired or will expire soon.
 *
 * @param expiresAt - Token expiration date
 * @param bufferSeconds - Consider expired if within this many seconds of expiry (default: 60)
 * @returns true if token is expired or expiring soon
 */
export function isTokenExpired(expiresAt: Date, bufferSeconds = 60): boolean {
  const bufferMs = bufferSeconds * 1000;
  return Date.now() >= expiresAt.getTime() - bufferMs;
}

/**
 * Calculates remaining token lifetime in seconds.
 *
 * @param expiresAt - Token expiration date
 * @returns Remaining seconds (0 if expired)
 */
export function getTokenTTL(expiresAt: Date): number {
  const remaining = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
  return Math.max(remaining, 0);
}

/**
 * Formats a token result for KV storage.
 * Strips the actual token value for security.
 */
export interface StoredTokenMetadata {
  tokenId: string;
  name: string;
  expiresAt: string;
  createdAt: string;
  permissions: string[];
}

/**
 * Creates a storable metadata object from a token result.
 * Does NOT store the actual bearer token value.
 */
export function toStoredMetadata(
  result: TokenResult,
  permissions: string[]
): StoredTokenMetadata {
  return {
    tokenId: result.tokenId,
    name: result.metadata.name,
    expiresAt: result.expiresAt.toISOString(),
    createdAt: new Date().toISOString(),
    permissions,
  };
}

/**
 * Token cache key generator for KV storage.
 */
export function getTokenCacheKey(
  type: 'session' | 'service' | 'admin',
  identifier: string
): string {
  return `token:${type}:${identifier}`;
}

/**
 * Generates a unique token name for tracking.
 */
export function generateTokenName(
  purpose: string,
  identifier?: string
): string {
  const timestamp = Date.now().toString(36);
  const suffix = identifier ? `-${identifier.slice(0, 8)}` : '';
  return `surge-${purpose}${suffix}-${timestamp}`;
}

/**
 * Token refresh helper - determines if token should be refreshed.
 *
 * @param expiresAt - Token expiration date
 * @param refreshThreshold - Refresh when this fraction of lifetime remains (default: 0.25 = 25%)
 */
export function shouldRefreshToken(
  expiresAt: Date,
  createdAt: Date,
  refreshThreshold = 0.25
): boolean {
  const totalLifetime = expiresAt.getTime() - createdAt.getTime();
  const remaining = expiresAt.getTime() - Date.now();
  return remaining < totalLifetime * refreshThreshold;
}

/**
 * Validates a token format (basic structure check, not API validation).
 * CF API tokens are typically base64-like strings.
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  // CF tokens are alphanumeric with underscores and dashes, typically 40+ chars
  return /^[A-Za-z0-9_-]{40,}$/.test(token);
}

/**
 * Masks a token for logging (shows first/last 4 chars).
 */
export function maskToken(token: string): string {
  if (!token || token.length < 12) return '****';
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}
