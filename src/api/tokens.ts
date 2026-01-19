/**
 * Token Management API Routes
 *
 * Internal endpoints for managing scoped API tokens.
 * These endpoints should be protected and only accessible to authenticated services.
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { CFTokenService, TOKEN_PROFILES } from '../services/cf-token-service';
import {
  TOKEN_EXPIRY,
  generateTokenName,
  getTokenCacheKey,
  toStoredMetadata,
  maskToken,
} from '../utils/token-utils';

type Bindings = {
  CF_MASTER_TOKEN: string;
  CF_ACCOUNT_ID: string;
  CACHE: KVNamespace;
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const sessionTokenSchema = z.object({
  userId: z.string().min(1, 'userId is required').max(50),
  sessionId: z.string().min(1, 'sessionId is required').max(100),
});

const combatTokenSchema = z.object({
  combatId: z.string().min(1, 'combatId is required').max(50),
  characterId: z.string().min(1, 'characterId is required').max(50),
});

const verifyTokenSchema = z.object({
  token: z.string().min(1, 'token is required').max(500),
});

const tokenIdParamSchema = z.object({
  tokenId: z.string().min(1).max(100),
});

export const tokenRoutes = new Hono<{ Bindings: Bindings }>();

/**
 * POST /tokens/session
 *
 * Creates a scoped session token for game operations.
 * Used when a player authenticates to get a limited-scope token.
 */
tokenRoutes.post('/session', zValidator('json', sessionTokenSchema), async (c) => {
  const { userId, sessionId } = c.req.valid('json');

  const tokenService = new CFTokenService({
    masterToken: c.env.CF_MASTER_TOKEN,
    accountId: c.env.CF_ACCOUNT_ID,
  });

  try {
    const result = await tokenService.createToken({
      name: generateTokenName('session', userId),
      permissions: TOKEN_PROFILES.GAME_SESSION,
      expiresInSeconds: TOKEN_EXPIRY.STANDARD,
    });

    // Store token metadata in KV (not the actual token value)
    const cacheKey = getTokenCacheKey('session', sessionId);
    await c.env.CACHE.put(
      cacheKey,
      JSON.stringify(toStoredMetadata(result, TOKEN_PROFILES.GAME_SESSION)),
      { expirationTtl: TOKEN_EXPIRY.STANDARD }
    );

    return c.json({
      success: true,
      data: {
        token: result.bearerToken,
        expiresAt: result.expiresAt.toISOString(),
        tokenId: result.tokenId,
      },
    });
  } catch (error) {
    console.error('Failed to create session token:', error);
    return c.json(
      {
        success: false,
        errors: [{ code: 'TOKEN_CREATION_FAILED', message: String(error) }],
      },
      500
    );
  }
});

/**
 * POST /tokens/combat
 *
 * Creates a combat-specific token with Durable Object access.
 * Shorter lifetime, minimal permissions.
 */
tokenRoutes.post('/combat', zValidator('json', combatTokenSchema), async (c) => {
  const { combatId, characterId: _characterId } = c.req.valid('json');

  const tokenService = new CFTokenService({
    masterToken: c.env.CF_MASTER_TOKEN,
    accountId: c.env.CF_ACCOUNT_ID,
  });

  try {
    const result = await tokenService.createToken({
      name: generateTokenName('combat', combatId),
      permissions: TOKEN_PROFILES.COMBAT_SESSION,
      expiresInSeconds: TOKEN_EXPIRY.SHORT, // 15 minutes for combat
    });

    return c.json({
      success: true,
      data: {
        token: result.bearerToken,
        expiresAt: result.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to create combat token:', error);
    return c.json(
      {
        success: false,
        errors: [{ code: 'TOKEN_CREATION_FAILED', message: String(error) }],
      },
      500
    );
  }
});

/**
 * DELETE /tokens/:tokenId
 *
 * Revokes a token by ID.
 */
tokenRoutes.delete('/:tokenId', zValidator('param', tokenIdParamSchema), async (c) => {
  const { tokenId } = c.req.valid('param');

  const tokenService = new CFTokenService({
    masterToken: c.env.CF_MASTER_TOKEN,
    accountId: c.env.CF_ACCOUNT_ID,
  });

  try {
    await tokenService.revokeToken(tokenId);

    return c.json({
      success: true,
      data: { revoked: tokenId },
    });
  } catch (error) {
    console.error('Failed to revoke token:', error);
    return c.json(
      {
        success: false,
        errors: [{ code: 'TOKEN_REVOCATION_FAILED', message: String(error) }],
      },
      500
    );
  }
});

/**
 * POST /tokens/verify
 *
 * Verifies if a token is still valid.
 */
tokenRoutes.post('/verify', zValidator('json', verifyTokenSchema), async (c) => {
  const { token } = c.req.valid('json');

  const tokenService = new CFTokenService({
    masterToken: c.env.CF_MASTER_TOKEN,
    accountId: c.env.CF_ACCOUNT_ID,
  });

  try {
    const isValid = await tokenService.verifyToken(token);

    return c.json({
      success: true,
      data: {
        valid: isValid,
        maskedToken: maskToken(token),
      },
    });
  } catch (error) {
    console.error('Failed to verify token:', error);
    return c.json({
      success: true,
      data: { valid: false },
    });
  }
});
