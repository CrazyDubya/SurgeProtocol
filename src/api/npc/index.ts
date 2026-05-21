/**
 * Surge Protocol - NPC Routes
 *
 * Endpoints:
 *
 * NPC Definitions (Templates):
 * - GET /npcs - List all NPC definitions with filtering
 * - GET /npcs/:id - Get NPC definition by ID or code
 * - GET /npcs/vendors - List vendor NPCs
 * - GET /npcs/quest-givers - List quest giver NPCs
 * - GET /npcs/trainers - List trainer NPCs
 * - GET /npcs/by-location/:locationId - Get NPCs assigned to a location
 * - GET /npcs/by-faction/:factionId - Get NPCs in a faction
 *
 * NPC Instances (Live State):
 * - POST /npcs/:id/spawn - Create an instance of an NPC
 * - GET /npcs/instances - List NPC instances with filtering
 * - GET /npcs/instances/:instanceId - Get NPC instance state
 * - PATCH /npcs/instances/:instanceId - Update NPC instance state
 * - POST /npcs/instances/:instanceId/interact - Record an interaction
 * - GET /npcs/instances/at-location/:locationId - Get NPC instances at location
 */

import { Hono } from 'hono';
import type { AuthVariables } from '../../middleware/auth';
import { NpcService } from '../../services/npc';
import type { NpcInstanceUpdate, NpcInteraction } from '../../services/npc';

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

export const npcRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// =============================================================================
// NPC DEFINITION ENDPOINTS
// =============================================================================

/**
 * GET /npcs
 * List all NPC definitions with optional filtering.
 */
npcRoutes.get('/', async (c) => {
  const service = new NpcService(c.env.DB);
  const result = await service.listNpcs({
    npcType: c.req.query('type'),
    category: c.req.query('category'),
    factionId: c.req.query('factionId'),
    isVendor: c.req.query('isVendor') === 'true',
    isQuestGiver: c.req.query('isQuestGiver') === 'true',
    isTrainer: c.req.query('isTrainer') === 'true',
    combatCapable: c.req.query('combatCapable') === 'true',
    isUnique: c.req.query('isUnique') === 'true',
    limit: parseInt(c.req.query('limit') || '50'),
    offset: parseInt(c.req.query('offset') || '0'),
  });

  return c.json({ success: true, data: result });
});

/**
 * GET /npcs/vendors
 * List all vendor NPCs.
 */
npcRoutes.get('/vendors', async (c) => {
  const service = new NpcService(c.env.DB);
  const vendors = await service.getVendors(c.req.query('locationId'));

  return c.json({
    success: true,
    data: { vendors, count: vendors.length },
  });
});

/**
 * GET /npcs/quest-givers
 * List all quest giver NPCs.
 */
npcRoutes.get('/quest-givers', async (c) => {
  const service = new NpcService(c.env.DB);
  const questGivers = await service.getQuestGivers(c.req.query('locationId'));

  return c.json({
    success: true,
    data: { questGivers, count: questGivers.length },
  });
});

/**
 * GET /npcs/trainers
 * List all trainer NPCs.
 */
npcRoutes.get('/trainers', async (c) => {
  const service = new NpcService(c.env.DB);
  const trainers = await service.getTrainers(c.req.query('locationId'), c.req.query('skillId'));

  return c.json({
    success: true,
    data: { trainers, count: trainers.length },
  });
});

/**
 * GET /npcs/by-location/:locationId
 * Get NPCs assigned to a specific location.
 */
npcRoutes.get('/by-location/:locationId', async (c) => {
  const locationId = c.req.param('locationId');
  const service = new NpcService(c.env.DB);
  const npcs = await service.getNpcsByLocation(locationId);

  return c.json({
    success: true,
    data: { locationId, npcs, count: npcs.length },
  });
});

/**
 * GET /npcs/by-faction/:factionId
 * Get NPCs belonging to a faction.
 */
npcRoutes.get('/by-faction/:factionId', async (c) => {
  const factionId = c.req.param('factionId');
  const service = new NpcService(c.env.DB);
  const result = await service.getNpcsByFaction(factionId);

  return c.json({
    success: true,
    data: { factionId, ...result, count: result.npcs.length },
  });
});

// =============================================================================
// NPC INSTANCE ENDPOINTS (must come before /:id to avoid route conflicts)
// =============================================================================

/**
 * GET /npcs/instances
 * List NPC instances with filtering.
 */
npcRoutes.get('/instances', async (c) => {
  const service = new NpcService(c.env.DB);
  const isAliveParam = c.req.query('isAlive');
  const instances = await service.listInstances({
    saveId: c.req.query('saveId'),
    locationId: c.req.query('locationId'),
    isAlive: isAliveParam === 'true' ? true : isAliveParam === 'false' ? false : null,
    minRelationship: c.req.query('minRelationship') ? parseInt(c.req.query('minRelationship')!) : undefined,
  });

  return c.json({
    success: true,
    data: { instances, count: instances.length },
  });
});

/**
 * GET /npcs/instances/at-location/:locationId
 * Get all NPC instances currently at a location.
 */
npcRoutes.get('/instances/at-location/:locationId', async (c) => {
  const locationId = c.req.param('locationId');
  const service = new NpcService(c.env.DB);
  const npcs = await service.getInstancesAtLocation(locationId, c.req.query('saveId'));

  return c.json({
    success: true,
    data: { locationId, npcs, count: npcs.length },
  });
});

/**
 * GET /npcs/instances/:instanceId
 * Get detailed NPC instance state.
 */
npcRoutes.get('/instances/:instanceId', async (c) => {
  const service = new NpcService(c.env.DB);
  const result = await service.getInstanceById(c.req.param('instanceId'));

  if (!result) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'NPC instance not found' }],
    }, 404);
  }

  return c.json({ success: true, data: result });
});

/**
 * PATCH /npcs/instances/:instanceId
 * Update NPC instance state.
 */
npcRoutes.patch('/instances/:instanceId', async (c) => {
  let body: NpcInstanceUpdate;
  try {
    body = await c.req.json();
  } catch {
    return c.json({
      success: false,
      errors: [{ code: 'INVALID_JSON', message: 'Invalid JSON body' }],
    }, 400);
  }

  const service = new NpcService(c.env.DB);
  const result = await service.updateInstance(c.req.param('instanceId'), body);

  if (!result.success) {
    return c.json({
      success: false,
      errors: [{ code: 'ERROR', message: result.error }],
    }, (result as any).statusCode || 400);
  }

  return c.json({ success: true, data: result.data });
});

/**
 * POST /npcs/instances/:instanceId/interact
 * Record an interaction with an NPC.
 */
npcRoutes.post('/instances/:instanceId/interact', async (c) => {
  let body: NpcInteraction;
  try {
    body = await c.req.json();
  } catch {
    return c.json({
      success: false,
      errors: [{ code: 'INVALID_JSON', message: 'Invalid JSON body' }],
    }, 400);
  }

  if (!body.interactionType) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_TYPE', message: 'interactionType is required' }],
    }, 400);
  }

  const service = new NpcService(c.env.DB);
  const result = await service.interact(c.req.param('instanceId'), body);

  if (!result.success) {
    return c.json({
      success: false,
      errors: [{ code: 'ERROR', message: result.error }],
    }, (result as any).statusCode || 400);
  }

  return c.json({ success: true, data: result.data });
});

// =============================================================================
// NPC DEFINITION ENDPOINTS (parameterized routes must come after static routes)
// =============================================================================

/**
 * GET /npcs/:id
 * Get a specific NPC definition by ID or code.
 */
npcRoutes.get('/:id', async (c) => {
  const service = new NpcService(c.env.DB);
  const result = await service.getNpcDetails(c.req.param('id'));

  if (!result) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'NPC not found' }],
    }, 404);
  }

  return c.json({ success: true, data: result });
});

/**
 * POST /npcs/:id/spawn
 * Create an instance of an NPC for a save game.
 */
npcRoutes.post('/:id/spawn', async (c) => {
  let body: { saveId?: string; locationId?: string; initialRelationship?: number };
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }

  const service = new NpcService(c.env.DB);
  const result = await service.spawnInstance(
    c.req.param('id'),
    body.saveId,
    body.locationId,
    body.initialRelationship || 0
  );

  if (!result.success) {
    return c.json({
      success: false,
      errors: [{ code: 'ERROR', message: result.error }],
    }, (result as any).statusCode || 400);
  }

  return c.json({ success: true, data: result.data }, 201);
});
