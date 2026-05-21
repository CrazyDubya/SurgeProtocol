
/**
 * Surge Protocol - Status & Conditions Routes
 * 
 * Endpoints:
 * - GET /status/conditions - Get active conditions
 * - GET /status/addictions - Get active addictions
 * - POST /status/consume - Consume a substance (affects addiction)
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, type AuthVariables } from '../../middleware/auth';
import type { D1Database, KVNamespace } from '@cloudflare/workers-types';
import { ConditionService } from '../../services/status/condition';
import { AddictionService } from '../../services/status/addiction';

// ===================================
// SCHEMAS
// ===================================

const consumeSchema = z.object({
    substanceId: z.string(),
    addictionPotential: z.number().optional().default(10),
});

// ===================================
// BINDINGS
// ===================================

type Bindings = {
    DB: D1Database;
    CACHE: KVNamespace;
    JWT_SECRET: string;
};

// ===================================
// ROUTES
// ===================================

export const statusRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// All routes require auth
statusRoutes.use('*', authMiddleware());

/**
 * GET /status/conditions
 * Get active conditions for the character.
 */
statusRoutes.get('/conditions', async (c) => {
    const characterId = c.get('characterId');
    if (!characterId) return c.json({ error: 'No active character' }, 401);

    const service = new ConditionService(c.env.DB, c.env.CACHE);
    const conditions = await service.getActiveConditions(characterId);
    const modifiers = await service.getStatModifiers(characterId);

    return c.json({
        success: true,
        data: {
            conditions,
            modifiers
        }
    });
});

/**
 * GET /status/addictions
 * Get active addictions.
 */
statusRoutes.get('/addictions', async (c) => {
    const characterId = c.get('characterId');
    if (!characterId) return c.json({ error: 'No active character' }, 401);

    const service = new AddictionService(c.env.DB);

    // Check withdrawal status first
    await service.checkWithdrawal(characterId);
    const addictions = await service.getAllAddictions(characterId);

    return c.json({
        success: true,
        data: addictions
    });
});

/**
 * POST /status/consume
 * Register substance consumption.
 */
statusRoutes.post('/consume', zValidator('json', consumeSchema), async (c) => {
    const characterId = c.get('characterId');
    if (!characterId) return c.json({ error: 'No active character' }, 401);

    const { substanceId, addictionPotential } = c.req.valid('json');
    const service = new AddictionService(c.env.DB);

    const result = await service.consumeSubstance(characterId, substanceId, addictionPotential);

    return c.json({
        success: true,
        data: result
    });
});
