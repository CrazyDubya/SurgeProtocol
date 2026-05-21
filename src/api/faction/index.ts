/**
 * Surge Protocol - Faction Routes
 *
 * Endpoints:
 * - GET /factions - List all factions
 * - GET /factions/:id - Get faction details
 * - GET /factions/:id/standing - Get player's standing with faction
 * - GET /factions/wars/active - Get active wars
 * - POST /factions/wars/:id/contribute - Submit war contribution
 * - GET /factions/:id/members - Get faction members (leaderboard)
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  authMiddleware,
  type AuthVariables,
} from '../../middleware/auth';
import { ReputationService } from '../../services/faction/reputation';
import { TerritoryService } from '../../services/faction/territory';
import type { D1Database, KVNamespace, DurableObjectNamespace } from '@cloudflare/workers-types';

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  WAR_THEATER: DurableObjectNamespace;
  JWT_SECRET: string;
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const contributeSchema = z.object({
  contributionType: z.enum(['COMBAT', 'SUPPLY', 'INTEL', 'SABOTAGE', 'MISSION']),
  value: z.number().int().min(1).max(1000),
  objectiveId: z.string().optional(),
  characterName: z.string().optional(),
});

// =============================================================================
// ROUTES
// =============================================================================

export const factionRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

/**
 * GET /factions
 * List all factions with basic info.
 */
factionRoutes.get('/', async (c) => {
  const service = new ReputationService(c.env.DB, c.env.CACHE);
  const result = await service.listFactions();

  return c.json({
    success: true,
    data: {
      factions: result.factions,
      count: result.factions.length,
      cached: result.cached
    },
  });
});

/**
 * GET /factions/wars/active
 * Get all active faction wars.
 */
factionRoutes.get('/wars/active', async (c) => {
  const service = new TerritoryService(c.env.DB, c.env.WAR_THEATER);
  const result = await service.getActiveWars();

  return c.json({
    success: true,
    data: result,
  });
});

/**
 * GET /factions/:id
 * Get detailed faction information.
 */
factionRoutes.get('/:id', async (c) => {
  const factionId = c.req.param('id');
  const service = new ReputationService(c.env.DB, c.env.CACHE);

  const details = await service.getFactionDetails(factionId);

  if (!details) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Faction not found' }],
    }, 404);
  }

  return c.json({
    success: true,
    data: details,
  });
});

/**
 * GET /factions/:id/standing
 * Get the authenticated user's standing with a faction.
 */
factionRoutes.get('/:id/standing', authMiddleware(), async (c) => {
  const factionId = c.req.param('id');
  const characterId = c.get('characterId');

  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_CHARACTER', message: 'No character selected' }],
    }, 400);
  }

  const service = new ReputationService(c.env.DB, c.env.CACHE);
  const result = await service.getStanding(characterId, factionId);

  return c.json({
    success: true,
    data: result,
  });
});

/**
 * GET /factions/:id/members
 * Get faction leaderboard/members.
 */
factionRoutes.get('/:id/members', async (c) => {
  const factionId = c.req.param('id');
  const limit = parseInt(c.req.query('limit') ?? '20');
  const offset = parseInt(c.req.query('offset') ?? '0');

  const service = new ReputationService(c.env.DB, c.env.CACHE);
  const result = await service.getMembers(factionId, limit, offset);

  return c.json({
    success: true,
    data: result,
  });
});

/**
 * POST /factions/wars/:warId/contribute
 * Submit a contribution to an active war.
 */
factionRoutes.post(
  '/wars/:warId/contribute',
  authMiddleware(),
  zValidator('json', contributeSchema),
  async (c) => {
    const warId = c.req.param('warId');
    const characterId = c.get('characterId');
    const contribution = c.req.valid('json');

    if (!characterId) {
      return c.json({
        success: false,
        errors: [{ code: 'NO_CHARACTER', message: 'No character selected' }],
      }, 400);
    }

    const service = new TerritoryService(c.env.DB, c.env.WAR_THEATER);

    try {
      const result = await service.contributeToWar(characterId, warId, contribution);
      return c.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      // Basic error handling - could be improved with custom error types
      const status = error.message.includes('not found') ? 404 : 400;
      return c.json({
        success: false,
        errors: [{ code: 'CONTRIBUTION_FAILED', message: error.message }],
      }, status);
    }
  }
);

/**
 * POST /factions/:id/join
 * Request to join a faction.
 */
factionRoutes.post('/:id/join', authMiddleware(), async (c) => {
  const factionId = c.req.param('id');
  const characterId = c.get('characterId');

  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_CHARACTER', message: 'No character selected' }],
    }, 400);
  }

  const service = new ReputationService(c.env.DB, c.env.CACHE);

  try {
    const result = await service.joinFaction(characterId, factionId);
    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 403;
    return c.json({
      success: false,
      errors: [{ code: 'JOIN_FAILED', message: error.message }],
    }, status);
  }
});

/**
 * POST /factions/:id/leave
 * Leave a faction.
 */
factionRoutes.post('/:id/leave', authMiddleware(), async (c) => {
  const factionId = c.req.param('id');
  const characterId = c.get('characterId');

  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_CHARACTER', message: 'No character selected' }],
    }, 400);
  }

  const service = new ReputationService(c.env.DB, c.env.CACHE);

  try {
    const result = await service.leaveFaction(characterId, factionId);
    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json({
      success: false,
      errors: [{ code: 'LEAVE_FAILED', message: error.message }],
    }, 400);
  }
});
