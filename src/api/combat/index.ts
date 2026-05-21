/**
 * Surge Protocol - Combat System API
 *
 * Endpoints for combat mechanics, damage types, conditions, and status effects.
 * Migrated to service-based architecture (Batch 5).
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { type AuthVariables } from '../../middleware/auth';
import { CombatResolverService, CombatService } from '../../services/combat';
import { HumanityService } from '../../services/character/humanity';
import { ConditionService, AddictionService } from '../../services/status';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const startCombatSchema = z.object({
  characterId: z.string().min(1, 'Character ID is required'),
  encounterId: z.string().min(1, 'Encounter ID is required'),
  arenaId: z.string().optional(),
  participants: z.array(z.object({
    id: z.string(),
    type: z.enum(['player', 'ally']),
  })).optional().default([]),
});

const combatSessionActionSchema = z.object({
  type: z.enum([
    'ATTACK', 'DEFEND', 'MOVE', 'USE_ITEM', 'USE_ABILITY', 'ABILITY',
    'INTERACT', 'RELOAD', 'OVERWATCH', 'HUNKER', 'HACK', 'DISENGAGE', 'END_TURN'
  ]),
  targetId: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  itemId: z.string().optional(),
  abilityId: z.string().optional(),
});

const applyConditionSchema = z.object({
  characterId: z.string().min(1, 'Character ID is required'),
  conditionCode: z.string().min(1, 'Condition code is required'),
  sourceType: z.string().optional(),
  sourceId: z.string().optional(),
});

const treatAddictionSchema = z.object({
  characterId: z.string().min(1, 'Character ID is required'),
  substanceId: z.string().min(1, 'Substance ID is required'),
  treatmentType: z.enum(['MEDICATION', 'THERAPY', 'DETOX']),
});

const endSessionSchema = z.object({
  outcome: z.enum(['VICTORY', 'DEFEAT', 'ESCAPE', 'NEGOTIATION']),
});

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  COMBAT_SESSION: DurableObjectNamespace;
  JWT_SECRET: string;
};

// =============================================================================
// ROUTER
// =============================================================================

export const combatRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// =============================================================================
// CATALOG ENDPOINTS (Damage Types, Conditions, Actions)
// =============================================================================

/**
 * GET /combat/damage-types
 */
combatRoutes.get('/damage-types', async (c) => {
  const service = new CombatService(c.env.DB);
  const physical = c.req.query('physical') === 'true';
  const energy = c.req.query('energy') === 'true';
  const elemental = c.req.query('elemental') === 'true';
  const exotic = c.req.query('exotic') === 'true';

  const damageTypes = await service.listDamageTypes({ physical, energy, elemental, exotic });
  return c.json({ success: true, data: { damageTypes, count: damageTypes.length } });
});

/**
 * GET /combat/damage-types/:id
 */
combatRoutes.get('/damage-types/:id', async (c) => {
  const service = new CombatService(c.env.DB);
  const damageType = await service.getDamageTypeDetails(c.req.param('id'));
  if (!damageType) return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Damage type not found' }] }, 404);
  return c.json({ success: true, data: { damageType } });
});

/**
 * GET /combat/conditions
 */
combatRoutes.get('/conditions', async (c) => {
  const service = new CombatService(c.env.DB);
  const type = c.req.query('type');
  const positive = c.req.query('positive') === 'true';
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  const result = await service.listConditions({ type, positive, limit, offset });
  return c.json({ success: true, data: result });
});

/**
 * GET /combat/conditions/:id
 */
combatRoutes.get('/conditions/:id', async (c) => {
  const service = new CombatService(c.env.DB);
  const condition = await service.getConditionDetails(c.req.param('id'));
  if (!condition) return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Condition not found' }] }, 404);
  return c.json({ success: true, data: { condition } });
});

/**
 * GET /combat/actions
 */
combatRoutes.get('/actions', async (c) => {
  const service = new CombatService(c.env.DB);
  const type = c.req.query('type');
  const weaponType = c.req.query('weaponType');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  const result = await service.listActions({ type, weaponType, limit, offset });
  return c.json({ success: true, data: result });
});

/**
 * GET /combat/actions/:id
 */
combatRoutes.get('/actions/:id', async (c) => {
  const service = new CombatService(c.env.DB);
  const action = await service.getActionDetails(c.req.param('id'));
  if (!action) return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Action not found' }] }, 404);
  return c.json({ success: true, data: { action } });
});

/**
 * GET /combat/types
 * Enum utility for UI.
 */
combatRoutes.get('/types', async (c) => {
  return c.json({
    success: true,
    data: {
      conditionTypes: ['BUFF', 'DEBUFF', 'DOT', 'HOT', 'CROWD_CONTROL', 'MENTAL', 'PHYSICAL', 'CYBER'],
      actionTypes: ['ATTACK', 'DEFEND', 'MOVE', 'USE_ITEM', 'ABILITY', 'INTERACT', 'RELOAD', 'OVERWATCH', 'HUNKER', 'HACK'],
      targetTypes: ['SELF', 'SINGLE_ENEMY', 'SINGLE_ALLY', 'SINGLE_ANY', 'AREA', 'CONE', 'LINE'],
      damageCategories: ['PHYSICAL', 'ENERGY', 'ELEMENTAL', 'EXOTIC'],
    }
  });
});

// =============================================================================
// ARENA & ENCOUNTER ENDPOINTS
// =============================================================================

/**
 * GET /combat/arenas
 */
combatRoutes.get('/arenas', async (c) => {
  const service = new CombatService(c.env.DB);
  const locationId = c.req.query('locationId');
  const result = await service.listArenas({ locationId });
  return c.json({ success: true, data: result });
});

/**
 * GET /combat/arenas/:id
 */
combatRoutes.get('/arenas/:id', async (c) => {
  const service = new CombatService(c.env.DB);
  const arena = await service.getArenaDetails(c.req.param('id'));
  if (!arena) return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Arena not found' }] }, 404);
  return c.json({ success: true, data: { arena } });
});

/**
 * GET /combat/encounters
 */
combatRoutes.get('/encounters', async (c) => {
  const service = new CombatService(c.env.DB);
  const type = c.req.query('type');
  const locationId = c.req.query('locationId');
  const result = await service.listEncounters({ type, locationId });
  return c.json({ success: true, data: result });
});

/**
 * GET /combat/encounters/:id
 */
combatRoutes.get('/encounters/:id', async (c) => {
  const service = new CombatService(c.env.DB);
  const encounter = await service.getEncounterDetails(c.req.param('id'));
  if (!encounter) return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Encounter not found' }] }, 404);
  return c.json({ success: true, data: { encounter } });
});

/**
 * GET /combat/encounters/:id/preview
 */
combatRoutes.get('/encounters/:id/preview', async (c) => {
  const service = new CombatService(c.env.DB);
  const preview = await service.getEncounterPreview(c.req.param('id'));
  if (!preview) return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Encounter not found' }] }, 404);
  return c.json({ success: true, data: { preview } });
});

// =============================================================================
// COMBAT INSTANCE MANAGEMENT (Refactored to Resolver Service)
// =============================================================================

/**
 * POST /combat/start
 */
combatRoutes.post('/start', zValidator('json', startCombatSchema), async (c) => {
  const { characterId, encounterId, arenaId, participants: _participants } = c.req.valid('json');
  const resolver = new CombatResolverService({ db: c.env.DB, cache: c.env.CACHE }, c.env.COMBAT_SESSION);

  try {
    const session = await resolver.createSession({
      combatId: crypto.randomUUID(),
      characterId,
      encounterId,
      arenaId,
    });
    return c.json({ success: true, data: { session } });
  } catch (error: any) {
    return c.json({ success: false, errors: [{ code: 'START_FAILED', message: error.message }] }, 400);
  }
});

/**
 * GET /combat/session/:id
 */
combatRoutes.get('/session/:id', async (c) => {
  const resolver = new CombatResolverService({ db: c.env.DB, cache: c.env.CACHE }, c.env.COMBAT_SESSION);
  const state = await resolver.getSessionState(c.req.param('id'));
  if (!state) return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Session not found' }] }, 404);
  return c.json({ success: true, data: state });
});

/**
 * POST /combat/session/:id/action
 */
combatRoutes.post('/session/:id/action', zValidator('json', combatSessionActionSchema), async (c) => {
  const resolver = new CombatResolverService({ db: c.env.DB, cache: c.env.CACHE }, c.env.COMBAT_SESSION);
  const state = await resolver.getSessionState(c.req.param('id'));
  if (!state) return c.json({ success: false, error: 'Session not found' }, 404);

  const actorId = state.turnOrder[state.turnIndex];
  try {
    const result = await resolver.submitAction(c.req.param('id'), actorId!, c.req.valid('json') as any);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

/**
 * POST /combat/session/:id/end
 */
combatRoutes.post('/session/:id/end', zValidator('json', endSessionSchema), async (c) => {
  const resolver = new CombatResolverService({ db: c.env.DB, cache: c.env.CACHE }, c.env.COMBAT_SESSION);
  try {
    const result = await resolver.endSession(c.req.param('id'), c.req.valid('json').outcome);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

/**
 * GET /combat/active
 */
combatRoutes.get('/active', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) return c.json({ success: false, errors: [{ code: 'MISSING_PARAM', message: 'characterId is required' }] }, 400);

  const resolver = new CombatResolverService({ db: c.env.DB, cache: c.env.CACHE }, c.env.COMBAT_SESSION);
  const activeCombats = await resolver.listActiveSessions(characterId);
  return c.json({ success: true, data: { activeCombats, count: activeCombats.length } });
});

/**
 * GET /combat/history
 */
combatRoutes.get('/history', async (c) => {
  const characterId = c.req.query('characterId');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = parseInt(c.req.query('offset') || '0');
  if (!characterId) return c.json({ success: false, errors: [{ code: 'MISSING_PARAM', message: 'characterId is required' }] }, 400);

  const resolver = new CombatResolverService({ db: c.env.DB, cache: c.env.CACHE }, c.env.COMBAT_SESSION);
  const history = await resolver.getSessionHistory(characterId, { limit, offset });
  return c.json({ success: true, data: { history } });
});

// =============================================================================
// CONDITIONS & STATUS EFFECTS (Refactored to Condition Service)
// =============================================================================

/**
 * POST /combat/conditions/apply
 */
combatRoutes.post('/conditions/apply', zValidator('json', applyConditionSchema), async (c) => {
  const { characterId, conditionCode, sourceType, sourceId } = c.req.valid('json');
  const service = new ConditionService(c.env.DB);
  const result = await service.applyCondition({ characterId, code: conditionCode, sourceType, sourceId });
  if (!result) return c.json({ success: false, errors: [{ code: 'APPLY_FAILED', message: 'Failed to apply condition' }] }, 400);
  return c.json({ success: true, data: result });
});

/**
 * GET /combat/characters/:characterId/conditions
 */
combatRoutes.get('/characters/:characterId/conditions', async (c) => {
  const service = new ConditionService(c.env.DB);
  const conditions = await service.getActiveConditions(c.req.param('characterId'));
  return c.json({ success: true, data: { conditions } });
});

/**
 * DELETE /combat/conditions/:id
 */
combatRoutes.delete('/conditions/:id', async (c) => {
  const service = new ConditionService(c.env.DB);
  const result = await service.removeCondition(c.req.param('id'));
  return c.json(result);
});

// =============================================================================
// ADDICTION SYSTEM (Refactored to Addiction Service)
// =============================================================================

/**
 * GET /combat/characters/:characterId/addictions
 */
combatRoutes.get('/characters/:characterId/addictions', async (c) => {
  const service = new AddictionService(c.env.DB);
  const addictions = await service.getAllAddictions(c.req.param('characterId'));
  return c.json({ success: true, data: { addictions } });
});

/**
 * POST /combat/addictions/treat
 */
combatRoutes.post('/addictions/treat', zValidator('json', treatAddictionSchema), async (c) => {
  const { characterId, substanceId, treatmentType } = c.req.valid('json');
  const service = new AddictionService(c.env.DB);
  const result = await service.treatAddiction(characterId, substanceId, treatmentType);
  if (!result) return c.json({ success: false, errors: [{ code: 'TREATMENT_FAILED', message: 'Failed to treat addiction' }] }, 400);
  return c.json({ success: true, data: result });
});

/**
 * GET /combat/characters/:characterId/addiction-history
 */
combatRoutes.get('/characters/:characterId/addiction-history', async (c) => {
  const service = new AddictionService(c.env.DB);
  const history = await service.listAddictionHistory(c.req.param('characterId'));
  return c.json({ success: true, data: { history } });
});

// =============================================================================
// CYBERPSYCHOSIS & HUMANITY (Refactored to Humanity Service)
// =============================================================================

/**
 * GET /combat/humanity/thresholds
 */
combatRoutes.get('/humanity/thresholds', async (c) => {
  const service = new HumanityService({ db: c.env.DB });
  const result = await service.listThresholds();
  return c.json(result);
});

/**
 * GET /combat/characters/:characterId/humanity
 */
combatRoutes.get('/characters/:characterId/humanity', async (c) => {
  const service = new HumanityService({ db: c.env.DB, characterId: c.req.param('characterId') });
  const result = await service.getCharacterHumanity();
  return c.json(result);
});

/**
 * GET /combat/characters/:characterId/humanity-events
 */
combatRoutes.get('/characters/:characterId/humanity-events', async (c) => {
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = parseInt(c.req.query('offset') || '0');
  const service = new HumanityService({ db: c.env.DB, characterId: c.req.param('characterId') });
  const result = await service.listEvents(limit, offset);
  return c.json(result);
});

/**
 * GET /combat/characters/:characterId/cyberpsychosis-episodes
 */
combatRoutes.get('/characters/:characterId/cyberpsychosis-episodes', async (c) => {
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = parseInt(c.req.query('offset') || '0');
  const service = new HumanityService({ db: c.env.DB, characterId: c.req.param('characterId') });
  const result = await service.listEpisodes(limit, offset);
  return c.json(result);
});
