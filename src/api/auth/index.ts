/**
 * Surge Protocol - Authentication Routes
 *
 * Endpoints:
 * - POST /auth/register - Create new account
 * - POST /auth/login - Authenticate and get tokens
 * - POST /auth/logout - Invalidate session
 * - POST /auth/refresh - Refresh access token
 * - GET /auth/me - Get current user info
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import {
  hashPassword,
  verifyPassword,
  generateTokenPair,
  verifyJWT,
  storeSession,
  generateSessionId,
  authMiddleware,
  type StoredSession,
} from '../../middleware/auth';
import { authRateLimit } from '../../middleware/rateLimit';

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

type Variables = {
  userId: string;
  characterId?: string;
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2).max(50).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

// =============================================================================
// ROUTES
// =============================================================================

export const authRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply rate limiting to auth endpoints to prevent brute force
authRoutes.use('/register', authRateLimit());
authRoutes.use('/login', authRateLimit());
authRoutes.use('/refresh', authRateLimit());

/**
 * POST /auth/register
 * Create a new user account.
 */
authRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password, displayName } = c.req.valid('json');

  // Check if email already exists
  const existing = await c.env.DB
    .prepare('SELECT id FROM users WHERE email = ?')
    .bind(email.toLowerCase())
    .first();

  if (existing) {
    return c.json({
      success: false,
      errors: [{ code: 'EMAIL_EXISTS', message: 'Email already registered' }],
    }, 409);
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const userId = nanoid();
  const now = new Date().toISOString();

  await c.env.DB
    .prepare(
      `INSERT INTO users (id, email, password_hash, display_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(userId, email.toLowerCase(), passwordHash, displayName ?? null, now, now)
    .run();

  // Generate tokens
  const tokens = await generateTokenPair(userId, undefined, c.env.JWT_SECRET);

  // Store session
  const sessionId = generateSessionId();
  const session: StoredSession = {
    userId,
    refreshToken: tokens.refreshToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    userAgent: c.req.header('User-Agent'),
  };
  await storeSession(c.env.CACHE, sessionId, session);

  return c.json({
    success: true,
    data: {
      userId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    },
  }, 201);
});

/**
 * POST /auth/login
 * Authenticate user and return tokens.
 */
authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  // Find user
  const user = await c.env.DB
    .prepare('SELECT id, password_hash, is_active FROM users WHERE email = ?')
    .bind(email.toLowerCase())
    .first<{ id: string; password_hash: string; is_active: number }>();

  if (!user) {
    return c.json({
      success: false,
      errors: [{ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }],
    }, 401);
  }

  if (!user.is_active) {
    return c.json({
      success: false,
      errors: [{ code: 'ACCOUNT_DISABLED', message: 'Account is disabled' }],
    }, 403);
  }

  // Verify password
  const validPassword = await verifyPassword(password, user.password_hash);
  if (!validPassword) {
    return c.json({
      success: false,
      errors: [{ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }],
    }, 401);
  }

  // Get active character (if any)
  const character = await c.env.DB
    .prepare('SELECT id FROM characters WHERE player_id = ? AND is_active = 1 LIMIT 1')
    .bind(user.id)
    .first<{ id: string }>();

  // Generate tokens
  const tokens = await generateTokenPair(
    user.id,
    character?.id,
    c.env.JWT_SECRET
  );

  // Store session
  const sessionId = generateSessionId();
  const session: StoredSession = {
    userId: user.id,
    characterId: character?.id,
    refreshToken: tokens.refreshToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
    userAgent: c.req.header('User-Agent'),
  };
  await storeSession(c.env.CACHE, sessionId, session);

  // Update last login
  await c.env.DB
    .prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?")
    .bind(user.id)
    .run();

  return c.json({
    success: true,
    data: {
      userId: user.id,
      characterId: character?.id,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    },
  });
});

/**
 * POST /auth/logout
 * Invalidate current session.
 */
authRoutes.post('/logout', authMiddleware(), async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ success: true });
  }

  // Extract session ID from token and invalidate
  // In a real implementation, you'd track session IDs
  // For now, we just acknowledge the logout
  return c.json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
});

/**
 * POST /auth/refresh
 * Exchange refresh token for new access token.
 */
authRoutes.post('/refresh', zValidator('json', refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid('json');

  try {
    // Verify refresh token
    const payload = await verifyJWT(refreshToken, c.env.JWT_SECRET);

    if (payload.type !== 'refresh') {
      return c.json({
        success: false,
        errors: [{ code: 'INVALID_TOKEN', message: 'Invalid token type' }],
      }, 401);
    }

    // Verify user still exists and is active
    const user = await c.env.DB
      .prepare('SELECT id, is_active FROM users WHERE id = ?')
      .bind(payload.sub)
      .first<{ id: string; is_active: number }>();

    if (!user || !user.is_active) {
      return c.json({
        success: false,
        errors: [{ code: 'USER_NOT_FOUND', message: 'User not found or inactive' }],
      }, 401);
    }

    // Get current character
    const character = await c.env.DB
      .prepare('SELECT id FROM characters WHERE player_id = ? AND is_active = 1 LIMIT 1')
      .bind(user.id)
      .first<{ id: string }>();

    // Generate new tokens
    const tokens = await generateTokenPair(
      user.id,
      character?.id,
      c.env.JWT_SECRET
    );

    return c.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
    });
  } catch (error) {
    return c.json({
      success: false,
      errors: [{ code: 'INVALID_TOKEN', message: 'Invalid or expired refresh token' }],
    }, 401);
  }
});

/**
 * GET /auth/me
 * Get current authenticated user info.
 */
authRoutes.get('/me', authMiddleware(), async (c) => {
  const userId = c.get('userId');
  const characterId = c.get('characterId');

  const user = await c.env.DB
    .prepare('SELECT id, email, display_name, created_at, last_login FROM users WHERE id = ?')
    .bind(userId)
    .first<{
      id: string;
      email: string;
      display_name: string | null;
      created_at: string;
      last_login: string | null;
    }>();

  if (!user) {
    return c.json({
      success: false,
      errors: [{ code: 'USER_NOT_FOUND', message: 'User not found' }],
    }, 404);
  }

  // Get character info if selected
  let character = null;
  if (characterId) {
    character = await c.env.DB
      .prepare(
        `SELECT id, legal_name, street_name, handle, current_tier, carrier_rating
         FROM characters WHERE id = ?`
      )
      .bind(characterId)
      .first();
  }

  return c.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        createdAt: user.created_at,
        lastLogin: user.last_login,
      },
      character,
    },
  });
});
