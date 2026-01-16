/**
 * Surge Protocol - Rate Limiting Middleware
 *
 * Sliding window rate limiter using Cloudflare KV.
 *
 * Limits:
 * - Authenticated users: 100 requests/minute
 * - Unauthenticated users: 20 requests/minute
 * - Expensive operations: 10 requests/minute
 */

import type { Context, Next } from 'hono';

// Rate limit configurations
export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Window size in seconds */
  windowSeconds: number;
  /** Optional key prefix for namespacing */
  keyPrefix?: string;
}

// Default configurations
export const RATE_LIMITS = {
  /** Standard authenticated user limit */
  authenticated: { maxRequests: 100, windowSeconds: 60 },
  /** Standard unauthenticated user limit */
  unauthenticated: { maxRequests: 20, windowSeconds: 60 },
  /** Expensive operations (economy, combat actions) */
  expensive: { maxRequests: 10, windowSeconds: 60 },
  /** Authentication endpoints (login, register) */
  auth: { maxRequests: 10, windowSeconds: 60 },
} as const;

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

/**
 * Rate limiting middleware factory.
 *
 * @param config - Rate limit configuration
 * @returns Hono middleware function
 */
export function rateLimit(config: RateLimitConfig = RATE_LIMITS.authenticated) {
  const { maxRequests, windowSeconds, keyPrefix = 'ratelimit' } = config;

  return async (c: Context, next: Next) => {
    const kv = c.env?.CACHE as KVNamespace | undefined;

    if (!kv) {
      // No KV available, skip rate limiting (development mode)
      return next();
    }

    // Build rate limit key
    const identifier = getRateLimitIdentifier(c);
    const key = `${keyPrefix}:${identifier}`;

    try {
      // Get current rate limit state
      const now = Date.now();
      const windowStart = Math.floor(now / (windowSeconds * 1000)) * (windowSeconds * 1000);

      const currentData = await kv.get(key, 'json') as RateLimitEntry | null;

      let count = 1;
      let resetAt = windowStart + windowSeconds * 1000;

      if (currentData && currentData.windowStart === windowStart) {
        // Same window, increment count
        count = currentData.count + 1;
      }

      // Check if over limit
      if (count > maxRequests) {
        const retryAfter = Math.ceil((resetAt - now) / 1000);

        c.header('X-RateLimit-Limit', maxRequests.toString());
        c.header('X-RateLimit-Remaining', '0');
        c.header('X-RateLimit-Reset', Math.ceil(resetAt / 1000).toString());
        c.header('Retry-After', retryAfter.toString());

        return c.json({
          success: false,
          errors: [{
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          }],
        }, 429);
      }

      // Update rate limit counter
      const entry: RateLimitEntry = { count, windowStart };
      await kv.put(key, JSON.stringify(entry), {
        expirationTtl: windowSeconds + 10, // Extra buffer
      });

      // Set rate limit headers
      c.header('X-RateLimit-Limit', maxRequests.toString());
      c.header('X-RateLimit-Remaining', (maxRequests - count).toString());
      c.header('X-RateLimit-Reset', Math.ceil(resetAt / 1000).toString());

      return next();
    } catch (error) {
      // On error, allow request but log
      console.error('Rate limit error:', error);
      return next();
    }
  };
}

/**
 * Rate limiter for expensive operations.
 * Use on economy routes, combat actions, etc.
 */
export function expensiveRateLimit() {
  return rateLimit({ ...RATE_LIMITS.expensive, keyPrefix: 'ratelimit:expensive' });
}

/**
 * Rate limiter for authentication endpoints.
 * Stricter limits to prevent brute force.
 */
export function authRateLimit() {
  return rateLimit({ ...RATE_LIMITS.auth, keyPrefix: 'ratelimit:auth' });
}

/**
 * Dynamic rate limiter based on auth status.
 * Uses higher limits for authenticated users.
 */
export function dynamicRateLimit() {
  return async (c: Context, next: Next) => {
    const kv = c.env?.CACHE as KVNamespace | undefined;

    if (!kv) {
      return next();
    }

    // Check if user is authenticated
    const authHeader = c.req.header('Authorization');
    const isAuthenticated = authHeader?.startsWith('Bearer ');

    const config = isAuthenticated
      ? { ...RATE_LIMITS.authenticated, keyPrefix: 'ratelimit:api' }
      : { ...RATE_LIMITS.unauthenticated, keyPrefix: 'ratelimit:anon' };

    // Apply appropriate rate limit
    const limiter = rateLimit(config);
    return limiter(c, next);
  };
}

/**
 * Get a unique identifier for rate limiting.
 * Uses user ID if authenticated, IP otherwise.
 */
function getRateLimitIdentifier(c: Context): string {
  // Check for authenticated user
  const userId = c.get('userId');
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP-based limiting
  const cfConnectingIp = c.req.header('CF-Connecting-IP');
  const xForwardedFor = c.req.header('X-Forwarded-For');
  const xRealIp = c.req.header('X-Real-IP');

  const ip = cfConnectingIp
    || xForwardedFor?.split(',')[0]?.trim()
    || xRealIp
    || 'unknown';

  return `ip:${ip}`;
}

/**
 * Create a custom rate limiter with specific settings.
 *
 * @example
 * // 5 requests per 10 seconds
 * app.use('/api/special', createRateLimiter({ maxRequests: 5, windowSeconds: 10 }));
 */
export function createRateLimiter(options: Partial<RateLimitConfig>) {
  return rateLimit({
    maxRequests: options.maxRequests ?? 100,
    windowSeconds: options.windowSeconds ?? 60,
    keyPrefix: options.keyPrefix ?? 'ratelimit:custom',
  });
}

/**
 * Reset rate limit for a specific identifier.
 * Useful for admin actions or testing.
 */
export async function resetRateLimit(
  kv: KVNamespace,
  identifier: string,
  keyPrefix = 'ratelimit'
): Promise<void> {
  await kv.delete(`${keyPrefix}:${identifier}`);
}
