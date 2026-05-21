/**
 * Surge Protocol - Skills Routes
 *
 * Thin API layer delegating to SkillService.
 *
 * Endpoints:
 * - GET /skills - List all skill definitions
 * - GET /skills/:id - Get skill details
 * - GET /skills/character - Get current character's skills
 * - POST /skills/:skillId/train - Train a skill
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  authMiddleware,
  requireCharacterMiddleware,
  type AuthVariables,
} from '../../middleware/auth';
import { SkillService } from '../../services/skills';

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const trainSkillSchema = z.object({
  levels: z.number().int().min(1).max(5).default(1),
});

// =============================================================================
// ROUTES
// =============================================================================

export const skillRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// Apply auth middleware to all routes
skillRoutes.use('*', authMiddleware());

/**
 * GET /skills
 * List all skill definitions (catalog).
 */
skillRoutes.get('/', async (c) => {
  const service = new SkillService({ db: c.env.DB });
  const data = await service.listSkills();
  return c.json({ success: true, data });
});

/**
 * GET /skills/:id
 * Get detailed skill information.
 */
skillRoutes.get('/:id', async (c) => {
  const service = new SkillService({ db: c.env.DB });
  const skill = await service.getSkillDetails(c.req.param('id'));

  if (!skill) {
    return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Skill not found' }] }, 404);
  }

  return c.json({ success: true, data: { skill } });
});

/**
 * GET /skills/character
 * Get current character's skills with levels.
 */
skillRoutes.get('/character', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;
  const service = new SkillService({ db: c.env.DB });
  const data = await service.getCharacterSkills(characterId);
  return c.json({ success: true, data });
});

/**
 * POST /skills/:skillId/train
 * Train a skill by spending XP.
 */
skillRoutes.post('/:skillId/train', requireCharacterMiddleware(), zValidator('json', trainSkillSchema), async (c) => {
  const characterId = c.get('characterId')!;
  const { levels } = c.req.valid('json');
  const service = new SkillService({ db: c.env.DB });

  try {
    const result = await service.trainSkill(characterId, c.req.param('skillId'), levels);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({
      success: false,
      errors: [{ code: 'TRAINING_FAILED', message: error.message }],
    }, 400);
  }
});
