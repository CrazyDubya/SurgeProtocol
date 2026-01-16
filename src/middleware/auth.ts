/**
 * Surge Protocol - Authentication Middleware
 *
 * JWT-based authentication for API routes.
 * Uses Web Crypto API for HMAC-SHA256 signing.
 */

import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

// =============================================================================
// TYPES
// =============================================================================

/** JWT payload structure */
export interface JWTPayload {
  /** Subject (user ID) */
  sub: string;
  /** Character ID (if selected) */
  characterId?: string;
  /** Issued at timestamp */
  iat: number;
  /** Expiration timestamp */
  exp: number;
  /** Token type */
  type: 'access' | 'refresh';
}

/** Authenticated context variables */
export interface AuthVariables {
  userId: string;
  characterId?: string;
  jwtPayload: JWTPayload;
}

/** Session stored in KV */
export interface StoredSession {
  userId: string;
  characterId?: string;
  refreshToken: string;
  createdAt: number;
  expiresAt: number;
  userAgent?: string;
  ip?: string;
}

// =============================================================================
// JWT UTILITIES
// =============================================================================

/**
 * Base64URL encode a string or buffer.
 */
function base64UrlEncode(data: string | ArrayBuffer): string {
  const bytes = typeof data === 'string'
    ? new TextEncoder().encode(data)
    : new Uint8Array(data);

  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Base64URL decode to string.
 */
function base64UrlDecode(str: string): string {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  return atob(base64);
}

/**
 * Create HMAC-SHA256 signature using Web Crypto API.
 */
async function createSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );

  return base64UrlEncode(signature);
}

/**
 * Verify HMAC-SHA256 signature.
 */
async function verifySignature(
  data: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = await createSignature(data, secret);
  return signature === expectedSignature;
}

/**
 * Create a signed JWT.
 */
export async function createJWT(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  secret: string,
  expiresInSeconds: number
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(fullPayload));

  const data = `${headerEncoded}.${payloadEncoded}`;
  const signature = await createSignature(data, secret);

  return `${data}.${signature}`;
}

/**
 * Verify and decode a JWT.
 */
export async function verifyJWT(
  token: string,
  secret: string
): Promise<JWTPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [headerEncoded, payloadEncoded, signature] = parts;
  const data = `${headerEncoded}.${payloadEncoded}`;

  const isValid = await verifySignature(data!, signature!, secret);
  if (!isValid) {
    throw new Error('Invalid signature');
  }

  const payload: JWTPayload = JSON.parse(base64UrlDecode(payloadEncoded!));

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    throw new Error('Token expired');
  }

  return payload;
}

// =============================================================================
// TOKEN GENERATION
// =============================================================================

/** Access token lifetime: 1 hour */
const ACCESS_TOKEN_EXPIRY = 60 * 60;

/** Refresh token lifetime: 7 days */
const REFRESH_TOKEN_EXPIRY = 60 * 60 * 24 * 7;

/**
 * Generate access and refresh tokens for a user.
 */
export async function generateTokenPair(
  userId: string,
  characterId: string | undefined,
  secret: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const accessToken = await createJWT(
    { sub: userId, characterId, type: 'access' },
    secret,
    ACCESS_TOKEN_EXPIRY
  );

  const refreshToken = await createJWT(
    { sub: userId, characterId, type: 'refresh' },
    secret,
    REFRESH_TOKEN_EXPIRY
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRY,
  };
}

// =============================================================================
// PASSWORD HASHING
// =============================================================================

/**
 * Hash a password using PBKDF2.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');

  return `${saltHex}:${hashHex}`;
}

/**
 * Verify a password against a hash.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(':');
  if (!saltHex || !hashHex) return false;

  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const computedHashHex = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return computedHashHex === hashHex;
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

type Bindings = {
  JWT_SECRET: string;
  CACHE: KVNamespace;
};

/**
 * Authentication middleware.
 * Validates JWT from Authorization header and sets user context.
 */
export function authMiddleware() {
  return async (c: Context<{ Bindings: Bindings; Variables: AuthVariables }>, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HTTPException(401, {
        message: 'Missing or invalid Authorization header',
      });
    }

    const token = authHeader.slice(7);

    try {
      const payload = await verifyJWT(token, c.env.JWT_SECRET);

      if (payload.type !== 'access') {
        throw new HTTPException(401, {
          message: 'Invalid token type',
        });
      }

      // Set context variables
      c.set('userId', payload.sub);
      c.set('characterId', payload.characterId);
      c.set('jwtPayload', payload);

      await next();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid token';
      throw new HTTPException(401, { message });
    }
  };
}

/**
 * Optional auth middleware.
 * Sets user context if valid token present, but doesn't require it.
 */
export function optionalAuthMiddleware() {
  return async (c: Context<{ Bindings: Bindings; Variables: Partial<AuthVariables> }>, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);

      try {
        const payload = await verifyJWT(token, c.env.JWT_SECRET);

        if (payload.type === 'access') {
          c.set('userId', payload.sub);
          c.set('characterId', payload.characterId);
          c.set('jwtPayload', payload);
        }
      } catch {
        // Ignore invalid tokens for optional auth
      }
    }

    await next();
  };
}

/**
 * Require character selection middleware.
 * Must be used after authMiddleware.
 */
export function requireCharacterMiddleware() {
  return async (c: Context<{ Variables: AuthVariables }>, next: Next) => {
    const characterId = c.get('characterId');

    if (!characterId) {
      throw new HTTPException(403, {
        message: 'Character selection required',
      });
    }

    await next();
  };
}

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

/**
 * Store a session in KV.
 */
export async function storeSession(
  kv: KVNamespace,
  sessionId: string,
  session: StoredSession
): Promise<void> {
  const ttl = Math.ceil((session.expiresAt - Date.now()) / 1000);
  await kv.put(`session:${sessionId}`, JSON.stringify(session), {
    expirationTtl: Math.max(ttl, 60),
  });
}

/**
 * Retrieve a session from KV.
 */
export async function getSession(
  kv: KVNamespace,
  sessionId: string
): Promise<StoredSession | null> {
  const data = await kv.get(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
}

/**
 * Invalidate a session.
 */
export async function invalidateSession(
  kv: KVNamespace,
  sessionId: string
): Promise<void> {
  await kv.delete(`session:${sessionId}`);
}

/**
 * Generate a unique session ID.
 */
export function generateSessionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
