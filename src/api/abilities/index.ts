/**
 * Surge Protocol - Abilities & Skills Routes
 *
 * Endpoints:
 * - Ability Definitions: GET /, GET /categories, GET /:id
 * - Character Abilities: GET /character, GET /character/equipped, POST /:id/unlock, PATCH /:id/equip, POST /:id/use, POST /:id/upgrade
 * - Passives: GET /passives, GET /passives/:id, GET /passives/character
 * - Skills: GET /skills, GET /skills/:id, GET /skills/character, POST /skills/:id/train, POST /skills/:id/use
 */

import { Hono } from 'hono';
import { AbilityService } from '../../services/abilities';
import { authMiddleware, type AuthVariables } from '../../middleware/auth';
import type { D1Database, KVNamespace } from '@cloudflare/workers-types';

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

// =============================================================================
// ROUTES
// =============================================================================

export const abilityRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// Apply auth middleware
abilityRoutes.use('*', authMiddleware());

// =============================================================================
// ABILITY DEFINITION ENDPOINTS
// =============================================================================

/**
 * GET /abilities
 * List all ability definitions with optional filtering
 */
abilityRoutes.get('/', async (c) => {
  const service = new AbilityService({ db: c.env.DB, cache: c.env.CACHE, userId: c.get('userId') });

  const abilities = await service.getAbilityDefinitions({
    category: c.req.query('category'),
    type: c.req.query('type'),
    sourceType: c.req.query('source_type'),
    tier: c.req.query('tier') ? parseInt(c.req.query('tier')!, 10) : undefined,
    isSignature: c.req.query('is_signature') === 'true',
    isUltimate: c.req.query('is_ultimate') === 'true',
  });

  return c.json({
    success: true,
    data: {
      abilities,
      total: abilities.length,
    },
  });
});

/**
 * GET /abilities/categories
 * List ability categories with counts
 */
abilityRoutes.get('/categories', async (c) => {
  const service = new AbilityService({ db: c.env.DB, cache: c.env.CACHE, userId: c.get('userId') });
  const categories = await service.getAbilityCategories();

  return c.json({
    success: true,
    data: { categories },
  });
});

/**
 * GET /abilities/:id
 * Get ability details
 */
abilityRoutes.get('/:id', async (c) => {
  const { id } = c.req.param();
  const service = new AbilityService({ db: c.env.DB, cache: c.env.CACHE, userId: c.get('userId') });

  const ability = await service.getAbilityDefinition(id);
  if (!ability) {
    return c.json({ success: false, errors: [{ message: 'Ability not found' }] }, 404);
  }

  return c.json({
    success: true,
    data: { ability },
  });
});

// =============================================================================
// CHARACTER ABILITY ENDPOINTS
// =============================================================================

/**
 * GET /abilities/character
 * Get character's unlocked abilities
 */
abilityRoutes.get('/character', async (c) => {
  const characterId = c.req.query('characterId') || c.get('characterId');
  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const service = new AbilityService({ db: c.env.DB, cache: c.env.CACHE, userId: c.get('userId'), characterId });
  const abilities = await service.getCharacterAbilities(characterId, {
    status: c.req.query('status') as any,
    category: c.req.query('category'),
  });

  return c.json({
    success: true,
    data: {
      abilities,
      total: abilities.length,
    },
  });
});

/**
 * GET /abilities/character/equipped
 * Get character's currently equipped abilities
 */
abilityRoutes.get('/character/equipped', async (c) => {
  const characterId = c.req.query('characterId') || c.get('characterId');
  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const service = new AbilityService({ db: c.env.DB, cache: c.env.CACHE, userId: c.get('userId'), characterId });
  const abilities = await service.getCharacterAbilities(characterId, { status: 'equipped' });

  return c.json({
    success: true,
    data: {
      abilities,
      total: abilities.length,
    },
  });
});

/**
 * POST /abilities/:id/unlock
 * Unlock an ability for a character
 */
abilityRoutes.post('/:id/unlock', async (c) => {
  const { id } = c.req.param();
  const characterId = (await c.req.json<{ characterId: string }>()).characterId || c.get('characterId');

  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const service = new AbilityService({ db: c.env.DB, cache: c.env.CACHE, userId: c.get('userId'), characterId });
  const result = await service.unlockAbility(characterId, id);

  if (!result.success) {
    return c.json({ success: false, errors: [{ message: result.error }] }, result.code === 'ALREADY_UNLOCKED' ? 409 : 404);
  }

  return c.json({
    success: true,
    data: {
      unlocked: true,
      ability_id: id,
      character_ability_id: result.characterAbilityId,
    },
  }, 201);
});

/**
 * PATCH /abilities/:id/equip
 * Equip or unequip an ability
 */
abilityRoutes.patch('/:id/equip', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{ characterId: string; equip: boolean }>();
  const characterId = body.characterId || c.get('characterId');

  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const service = new AbilityService({ db: c.env.DB, cache: c.env.CACHE, userId: c.get('userId'), characterId });
  const result = await service.setAbilityEquipped(characterId, id, body.equip);

  if (!result.success) {
    return c.json({ success: false, errors: [{ message: result.error }] }, 404);
  }

  return c.json({
    success: true,
    data: {
      ability_id: id,
      is_equipped: body.equip,
    },
  });
});

/**
 * POST /abilities/:id/use
 * Record ability usage (for tracking stats)
 */
abilityRoutes.post('/:id/use', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{
    characterId: string;
    successful?: boolean;
    damage_dealt?: number;
    targets_affected?: number;
  }>();
  const characterId = body.characterId || c.get('characterId');

  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const service = new AbilityService({ db: c.env.DB, cache: c.env.CACHE, userId: c.get('userId'), characterId });
  const result = await service.useAbility(characterId, id, {
    successful: body.successful,
    damageDealt: body.damage_dealt,
    targetsAffected: body.targets_affected,
  });

  if (!result.success) {
    return c.json({ success: false, errors: [{ message: result.error }] }, 404);
  }

  return c.json({
    success: true,
    data: {
      ability_id: id,
      times_used: result.timesUsed,
      successful: result.successful,
    },
  });
});

/**
 * POST /abilities/:id/upgrade
 * Upgrade ability rank
 */
abilityRoutes.post('/:id/upgrade', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{ characterId: string; xp_amount?: number }>();
  const characterId = body.characterId || c.get('characterId');

  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const service = new AbilityService({ db: c.env.DB, cache: c.env.CACHE, userId: c.get('userId'), characterId });
  const result = await service.upgradeAbility(characterId, id, body.xp_amount);

  if (!result.success) {
    return c.json({ success: false, errors: [{ message: result.error }] }, result.code === 'NOT_UNLOCKED' ? 404 : 400);
  }

  return c.json({
    success: true,
    data: {
      ability_id: id,
      new_rank: result.newRank,
      max_rank: result.maxRank,
    },
  });
});

// =============================================================================
// PASSIVE ENDPOINTS
// =============================================================================

/**
 * GET /abilities/passives
 * List passive definitions
 */
abilityRoutes.get('/passives', async (c) => {
  const service = new AbilityService({ db: c.env.DB, cache: c.env.CACHE, userId: c.get('userId') });
  const passives = await service.getPassiveDefinitions({
    sourceType: c.req.query('source_type'),
    effectType: c.req.query('effect_type'),
    includeHidden: c.req.query('include_hidden') === 'true',
  });

  return c.json({
    success: true,
    data: {
      passives,
      total: passives.length,
    },
  });
});

/**
 * GET /abilities/passives/character
 * Get character's active passives
 */
abilityRoutes.get('/passives/character', async (c) => {
  const characterId = c.req.query('characterId') || c.get('characterId');
  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const service = new AbilityService({ db: c.env.DB, cache: c.env.CACHE, userId: c.get('userId'), characterId });
  const passives = await service.getCharacterPassives(characterId);

  return c.json({
    success: true,
    data: {
      passives,
      total: passives.length,
    },
  });
});

/**
 * GET /abilities/passives/:id
 * Get passive details
 */
abilityRoutes.get('/passives/:id', async (c) => {
  const { id } = c.req.param();
  const service = new AbilityService({ db: c.env.DB, cache: c.env.CACHE, userId: c.get('userId') });
  const passive = await service.getPassiveDefinition(id);

  if (!passive) {
    return c.json({ success: false, errors: [{ message: 'Passive not found' }] }, 404);
  }

  return c.json({
    success: true,
    data: { passive },
  });
});

// =============================================================================
// SKILL ENDPOINTS
// =============================================================================

/**
 * GET /abilities/skills
 * List skill definitions
 */
abilityRoutes.get('/skills', async (c) => {
  const service = new AbilityService({ db: c.env.DB, cache: c.env.CACHE, userId: c.get('userId') });
  const skills = await service.getSkillDefinitions({
    category: c.req.query('category'),
    attributeId: c.req.query('attribute_id'),
  });

  return c.json({
    success: true,
    data: {
      skills,
      total: skills.length,
    },
  });
});

/**
 * GET /abilities/skills/character
 * Get character's skill levels
 */
abilityRoutes.get('/skills/character', async (c) => {
  const characterId = c.req.query('characterId') || c.get('characterId');
  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const service = new AbilityService({ db: c.env.DB, cache: c.env.CACHE, userId: c.get('userId'), characterId });
  const skills = await service.getCharacterSkills(characterId, c.req.query('category'));

  return c.json({
    success: true,
    data: {
      skills,
      total: skills.length,
    },
  });
});

/**
 * GET /abilities/skills/:id
 * Get skill details
 */
abilityRoutes.get('/skills/:id', async (c) => {
  const { id } = c.req.param();
  const service = new AbilityService({ db: c.env.DB, cache: c.env.CACHE, userId: c.get('userId') });
  const skill = await service.getSkillDefinition(id);

  if (!skill) {
    return c.json({ success: false, errors: [{ message: 'Skill not found' }] }, 404);
  }

  return c.json({
    success: true,
    data: { skill },
  });
});

/**
 * POST /abilities/skills/:id/train
 * Add XP to a skill
 */
abilityRoutes.post('/skills/:id/train', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{ characterId: string; xp_amount: number }>();
  const characterId = body.characterId || c.get('characterId');

  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const service = new AbilityService({ db: c.env.DB, cache: c.env.CACHE, userId: c.get('userId'), characterId });
  const result = await service.trainSkill(characterId, id, body.xp_amount);

  if (!result.success) {
    return c.json({ success: false, errors: [{ message: result.error }] }, result.code === 'NOT_FOUND' ? 404 : 400);
  }

  return c.json({
    success: true,
    data: {
      skill_id: id,
      current_level: result.currentLevel,
      current_xp: result.currentXp,
      xp_to_next_level: result.xpToNext,
      leveled_up: result.leveledUp,
      xp_added: result.xpAdded,
    },
  });
});

/**
 * POST /abilities/skills/:id/use
 * Record skill usage
 */
abilityRoutes.post('/skills/:id/use', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{
    characterId: string;
    result: 'success' | 'failure' | 'critical_success' | 'critical_failure';
  }>();
  const characterId = body.characterId || c.get('characterId');

  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const service = new AbilityService({ db: c.env.DB, cache: c.env.CACHE, userId: c.get('userId'), characterId });
  const result = await service.useSkill(characterId, id, body.result);

  if (!result.success) {
    return c.json({ success: false, errors: [{ message: result.error }] }, 404);
  }

  return c.json({
    success: true,
    data: {
      skill_id: id,
      result: result.result,
      times_used: result.timesUsed,
    },
  });
});
