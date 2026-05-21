/**
 * Surge Protocol - Mission Routes
 *
 * Thin API layer delegating to MissionLifecycleService and MissionActionService.
 *
 * Endpoints:
 * - GET /missions/available - List missions for character's tier
 * - GET /missions/active - Get current active mission
 * - GET /missions/:id - Get mission definition details
 * - POST /missions/:id/accept - Accept a mission
 * - POST /missions/:id/action - Take action during mission
 * - POST /missions/:id/complete - Complete/submit mission
 * - POST /missions/:id/combat/resolve - Resolve combat within mission
 * - POST /missions/:id/abandon - Abandon a mission
 * - GET /missions/complications - List complication definitions
 * - GET /missions/complications/:code - Get complication details
 * - GET /missions/:missionId/objectives - Get mission objectives
 * - GET /missions/objectives/:objectiveId - Get objective details
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  authMiddleware,
  requireCharacterMiddleware,
  type AuthVariables,
} from '../../middleware/auth';
import { getMission, getAvailableMissions, getActiveMission } from '../../db';
import {
  MissionLifecycleService,
  MissionActionService,
  getActiveVehicle,
  validateVehicleForMission,
  calculateVehicleTimeBonus,
} from '../../services/mission';
import {
  getEventSummary,
  getActiveDistrictEvents,
  getEffectiveModifiers,
} from '../../game/events/district';

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
  COMBAT_SESSION: DurableObjectNamespace;
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const missionActionSchema = z.object({
  actionType: z.enum([
    'MOVE', 'INTERACT', 'STEALTH', 'COMBAT', 'SKILL_CHECK', 'DIALOGUE', 'USE_ITEM', 'WAIT',
  ]),
  targetId: z.string().optional(),
  parameters: z.record(z.unknown()).optional(),
});

const missionCompleteSchema = z.object({
  outcome: z.enum(['SUCCESS', 'PARTIAL', 'FAILURE']),
  deliveryProof: z.string().optional(),
  customerRating: z.number().int().min(1).max(5).optional(),
});

// =============================================================================
// ROUTES
// =============================================================================

export const missionRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

missionRoutes.use('*', authMiddleware());
missionRoutes.use('*', requireCharacterMiddleware());

// ---------------------------------------------------------------------------
// GET /missions/available
// ---------------------------------------------------------------------------

missionRoutes.get('/available', async (c) => {
  try {
    const characterId = c.get('characterId')!;

    const character = await c.env.DB
      .prepare('SELECT current_tier, carrier_rating, current_location_id FROM characters WHERE id = ?')
      .bind(characterId)
      .first<{ current_tier: number; carrier_rating: number; current_location_id: string | null }>();

    if (!character) {
      return c.json({ success: false, errors: [{ code: 'CHARACTER_NOT_FOUND', message: 'Character not found' }] }, 404);
    }

    const baseMissions = await getAvailableMissions(c.env.DB, character.current_tier, character.carrier_rating);
    const districtId = character.current_location_id || 'downtown';
    const activeEvents = await getActiveDistrictEvents(c.env.CACHE, districtId);
    const modifiers = getEffectiveModifiers(activeEvents);

    const missions = baseMissions.map(mission => {
      const rewardMod = modifiers.get('MISSION_REWARD') || 1.0;
      const dangerMod = modifiers.get('ROUTE_DANGER') || 1.0;
      return {
        ...mission,
        effective_credits: Math.round(mission.base_credits * rewardMod),
        effective_xp: Math.round(mission.base_xp * rewardMod),
        danger_modifier: dangerMod,
        danger_warning: dangerMod > 1.3 ? 'HIGH' : dangerMod > 1.0 ? 'ELEVATED' : null,
        base_credits: mission.base_credits,
        base_xp: mission.base_xp,
      };
    });

    const activeMission = await getActiveMission(c.env.DB, characterId);
    const eventWarnings = activeEvents.map(e => ({
      type: e.type, name: e.name, severity: e.severity,
      summary: getEventSummary(e), endsAt: e.endTime.toISOString(),
    }));

    return c.json({
      success: true,
      data: {
        missions, count: missions.length, canAcceptNew: !activeMission,
        currentTier: character.current_tier, currentDistrict: districtId,
        activeEvents: eventWarnings,
        modifiers: {
          missionReward: modifiers.get('MISSION_REWARD') || 1.0,
          routeDanger: modifiers.get('ROUTE_DANGER') || 1.0,
          routeTime: modifiers.get('ROUTE_TIME') || 1.0,
          detectionRisk: modifiers.get('DETECTION_RISK') || 1.0,
        },
      },
    });
  } catch (err: any) {
    console.error('Available Missions Error:', err);
    return c.json({ success: false, errors: [{ code: 'DEBUG_ERROR', message: err.message, stack: err.stack }] }, 500);
  }
});

// ---------------------------------------------------------------------------
// GET /missions/active
// ---------------------------------------------------------------------------

missionRoutes.get('/active', async (c) => {
  const characterId = c.get('characterId')!;
  const activeMission = await getActiveMission(c.env.DB, characterId);

  if (!activeMission) {
    return c.json({ success: true, data: { mission: null } });
  }

  const missionDef = await getMission(c.env.DB, activeMission.mission_definition_id);
  let objectives: any[] = [];
  if (missionDef?.objectives) {
    try { objectives = JSON.parse(missionDef.objectives); } catch { objectives = []; }
  }

  return c.json({
    success: true,
    data: { mission: { instance: activeMission, definition: missionDef, objectives, checkpoints: [] } },
  });
});

// ---------------------------------------------------------------------------
// GET /missions/:id
// ---------------------------------------------------------------------------

missionRoutes.get('/:id', async (c) => {
  const missionId = c.req.param('id');
  const characterId = c.get('characterId')!;

  const mission = await getMission(c.env.DB, missionId);
  if (!mission) {
    return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Mission not found' }] }, 404);
  }

  const character = await c.env.DB
    .prepare('SELECT current_tier, current_location_id FROM characters WHERE id = ?')
    .bind(characterId)
    .first<{ current_tier: number; current_location_id: string | null }>();

  const isAccessible = character &&
    mission.tier_minimum <= character.current_tier &&
    mission.tier_maximum >= character.current_tier;

  const requirements = await c.env.DB.prepare('SELECT * FROM mission_requirements WHERE mission_id = ?').bind(missionId).all();
  const rewards = await c.env.DB.prepare('SELECT * FROM mission_rewards WHERE mission_id = ?').bind(missionId).all();

  const districtId = character?.current_location_id || 'downtown';
  const activeEvents = await getActiveDistrictEvents(c.env.CACHE, districtId);
  const modifiers = getEffectiveModifiers(activeEvents);
  const rewardMod = modifiers.get('MISSION_REWARD') || 1.0;
  const dangerMod = modifiers.get('ROUTE_DANGER') || 1.0;
  const timeMod = modifiers.get('ROUTE_TIME') || 1.0;

  const eventWarnings = activeEvents.map(e => ({
    type: e.type, name: e.name, severity: e.severity, description: e.description,
    effects: e.modifiers.map(m => ({
      type: m.type, multiplier: m.value,
      description: m.type === 'ROUTE_DANGER' ? 'Increased danger' : m.type === 'ROUTE_TIME' ? 'Travel delays' : m.type === 'MISSION_REWARD' ? 'Modified rewards' : m.type === 'DETECTION_RISK' ? 'Detection risk' : m.type,
    })),
  }));

  return c.json({
    success: true,
    data: {
      mission: {
        ...mission,
        effective_credits: Math.round(mission.base_credits * rewardMod),
        effective_xp: Math.round(mission.base_xp * rewardMod),
        effective_time_limit: mission.time_limit_minutes ? Math.round(mission.time_limit_minutes / timeMod) : null,
      },
      requirements: requirements.results, rewards: rewards.results, isAccessible,
      districtConditions: {
        districtId,
        dangerLevel: dangerMod > 1.5 ? 'EXTREME' : dangerMod > 1.3 ? 'HIGH' : dangerMod > 1.0 ? 'ELEVATED' : 'NORMAL',
        dangerMultiplier: dangerMod, rewardMultiplier: rewardMod, timeMultiplier: timeMod,
        activeEvents: eventWarnings,
      },
    },
  });
});

// ---------------------------------------------------------------------------
// POST /missions/:id/accept
// ---------------------------------------------------------------------------

missionRoutes.post('/:id/accept', async (c) => {
  const missionId = c.req.param('id');
  const characterId = c.get('characterId')!;

  const existingActive = await getActiveMission(c.env.DB, characterId);
  if (existingActive) {
    return c.json({ success: false, errors: [{ code: 'MISSION_ACTIVE', message: 'Complete or abandon current mission first' }] }, 400);
  }

  const mission = await getMission(c.env.DB, missionId);
  if (!mission) {
    return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Mission not found' }] }, 404);
  }

  const character = await c.env.DB
    .prepare('SELECT current_tier, carrier_rating FROM characters WHERE id = ?')
    .bind(characterId)
    .first<{ current_tier: number; carrier_rating: number }>();

  if (!character) {
    return c.json({ success: false, errors: [{ code: 'CHARACTER_NOT_FOUND', message: 'Character not found' }] }, 404);
  }

  if (character.current_tier < mission.tier_minimum) {
    return c.json({ success: false, errors: [{ code: 'TIER_TOO_LOW', message: `Requires Tier ${mission.tier_minimum}, you are Tier ${character.current_tier}` }] }, 403);
  }
  if (character.current_tier > mission.tier_maximum) {
    return c.json({ success: false, errors: [{ code: 'TIER_TOO_HIGH', message: 'This mission is below your tier' }] }, 403);
  }

  const activeVehicle = await getActiveVehicle(c.env.DB, characterId);
  if (!activeVehicle) {
    return c.json({ success: false, errors: [{ code: 'NO_VEHICLE', message: 'You need an active vehicle to accept delivery missions. Purchase one from the vehicle dealer.' }] }, 422);
  }

  const vehicleValidation = validateVehicleForMission(activeVehicle, {
    cargo_weight_kg: mission.cargo_weight_kg,
    required_vehicle_class: mission.required_vehicle_class,
    mission_type: mission.mission_type,
  });
  if (!vehicleValidation.valid) {
    return c.json({ success: false, errors: vehicleValidation.errors }, 422);
  }

  const vehicleTimeBonus = calculateVehicleTimeBonus(activeVehicle.top_speed_kmh);
  const effectiveTimeLimit = Math.round((mission.time_limit_minutes ?? 60) * vehicleTimeBonus);

  const missionService = new MissionLifecycleService({ db: c.env.DB, cache: c.env.CACHE, userId: c.get('userId'), characterId });
  const result = await missionService.acceptMission(missionId);

  if (!result.success) {
    return c.json({ success: false, errors: [{ code: result.error.code, message: result.error.message, details: result.error.details }] }, 400);
  }

  return c.json({
    success: true,
    data: {
      instance: result.data, mission,
      vehicle: {
        id: activeVehicle.id, name: activeVehicle.custom_name || activeVehicle.vehicle_class,
        class: activeVehicle.vehicle_class, cargoCapacity: activeVehicle.cargo_capacity_kg,
        speed: activeVehicle.top_speed_kmh, timeBonus: Math.round((vehicleTimeBonus - 1) * 100),
      },
      effectiveTimeLimit,
      message: `Mission accepted. Your ${activeVehicle.vehicle_class} is ready. Good luck, courier.`,
    },
  }, 201);
});

// ---------------------------------------------------------------------------
// POST /missions/:id/action
// ---------------------------------------------------------------------------

missionRoutes.post('/:id/action', zValidator('json', missionActionSchema), async (c) => {
  const instanceId = c.req.param('id');
  const characterId = c.get('characterId')!;
  const action = c.req.valid('json');

  const actionService = new MissionActionService({
    db: c.env.DB, cache: c.env.CACHE, userId: c.get('userId'), characterId,
    combatSession: c.env.COMBAT_SESSION,
  });

  // Verify ownership, auto-start, and time limit
  const verification = await actionService.verifyMissionInstance(instanceId, characterId);
  if (!verification.ok) {
    return c.json({ success: false, errors: [verification.error] }, verification.status as 400 | 404);
  }

  const missionDef = await getMission(c.env.DB, verification.instance.mission_definition_id as string);

  // Dispatch to service
  let result;
  switch (action.actionType) {
    case 'MOVE': result = await actionService.processMove(instanceId, characterId, action.parameters); break;
    case 'SKILL_CHECK': result = await actionService.processSkillCheck(instanceId, characterId, action.parameters); break;
    case 'INTERACT': result = await actionService.processInteraction(instanceId, characterId, action.targetId, action.parameters); break;
    case 'COMBAT': result = await actionService.processCombat(instanceId, characterId, missionDef?.tier_minimum ?? 1, action.parameters); break;
    case 'DIALOGUE': result = await actionService.processDialogue(instanceId, characterId, action.targetId, action.parameters); break;
    case 'USE_ITEM': result = await actionService.processUseItem(instanceId, characterId, action.parameters); break;
    case 'STEALTH': result = await actionService.processStealth(instanceId, characterId, action.parameters); break;
    case 'WAIT': result = await actionService.processWait(instanceId, characterId, action.parameters); break;
    default: result = { success: true, outcome: 'ACTION_NOTED', details: { actionType: action.actionType } };
  }

  // Log action and get remaining objectives
  const { remainingObjectives, canComplete } = await actionService.logAction(instanceId, action, result as unknown as Record<string, unknown>);

  return c.json({ success: true, data: { result, remainingObjectives, canComplete } });
});

// ---------------------------------------------------------------------------
// POST /missions/:id/complete
// ---------------------------------------------------------------------------

missionRoutes.post('/:id/complete', zValidator('json', missionCompleteSchema), async (c) => {
  const instanceId = c.req.param('id');
  const characterId = c.get('characterId')!;
  const completion = c.req.valid('json');

  const missionService = new MissionLifecycleService({ db: c.env.DB, cache: c.env.CACHE, userId: c.get('userId'), characterId });

  let result;
  try {
    if (completion.outcome === 'FAILURE') {
      result = await missionService.failMission(instanceId, 'Player reported failure');
    } else {
      result = await missionService.completeMission(instanceId);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    return c.json({ success: false, errors: [{ code: 'INTERNAL_ERROR', message: `DEBUG: ${message}`, details: { stack } }] }, 500);
  }

  if (!result.success) {
    const status = result.error.code === 'NOT_FOUND' ? 404 : 400;
    return c.json({ success: false, errors: [{ code: result.error.code, message: result.error.message, details: result.error.details }] }, status);
  }

  const character = await c.env.DB.prepare('SELECT current_location_id FROM characters WHERE id = ?').bind(characterId).first<{ current_location_id: string | null }>();
  const districtId = character?.current_location_id || 'downtown';
  const activeEvents = await getActiveDistrictEvents(c.env.CACHE, districtId);
  const eventWarnings = activeEvents.map(e => ({ type: e.type, name: e.name, summary: getEventSummary(e) }));

  return c.json({ success: true, data: { ...result.data, district_events: eventWarnings } });
});

// ---------------------------------------------------------------------------
// POST /missions/:id/combat/resolve
// ---------------------------------------------------------------------------

missionRoutes.post('/:id/combat/resolve', async (c) => {
  const instanceId = c.req.param('id');
  const characterId = c.get('characterId')!;

  const actionService = new MissionActionService({
    db: c.env.DB, cache: c.env.CACHE, userId: c.get('userId'), characterId,
    combatSession: c.env.COMBAT_SESSION,
  });

  const result = await actionService.resolveCombat(instanceId, characterId);
  if (!result.ok) {
    return c.json({ success: false, errors: [result.error] }, result.status as 400 | 404 | 500);
  }

  return c.json({ success: true, data: result.data });
});

// ---------------------------------------------------------------------------
// POST /missions/:id/abandon
// ---------------------------------------------------------------------------

missionRoutes.post('/:id/abandon', async (c) => {
  const instanceId = c.req.param('id');
  const characterId = c.get('characterId')!;

  const actionService = new MissionActionService({
    db: c.env.DB, cache: c.env.CACHE, userId: c.get('userId'), characterId,
  });

  const result = await actionService.abandonMission(instanceId, characterId);
  if (!result.ok) {
    return c.json({ success: false, errors: [result.error] }, result.status as 404);
  }

  return c.json({ success: true, data: result.data });
});

// ---------------------------------------------------------------------------
// GET /missions/complications
// ---------------------------------------------------------------------------

missionRoutes.get('/complications', async (c) => {
  const actionService = new MissionActionService({ db: c.env.DB });
  const data = await actionService.listComplications({ type: c.req.query('type'), combat: c.req.query('combat') });
  return c.json({ success: true, data });
});

missionRoutes.get('/complications/:code', async (c) => {
  const actionService = new MissionActionService({ db: c.env.DB });
  const complication = await actionService.getComplication(c.req.param('code'));
  if (!complication) {
    return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Complication not found' }] }, 404);
  }
  return c.json({ success: true, data: { complication } });
});

// ---------------------------------------------------------------------------
// GET /missions/:missionId/objectives
// ---------------------------------------------------------------------------

missionRoutes.get('/:missionId/objectives', async (c) => {
  const actionService = new MissionActionService({ db: c.env.DB });
  const result = await actionService.listObjectives(c.req.param('missionId'));
  if (!result) {
    return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Mission not found' }] }, 404);
  }
  return c.json({ success: true, data: { missionId: c.req.param('missionId'), ...result } });
});

missionRoutes.get('/objectives/:objectiveId', async (c) => {
  const actionService = new MissionActionService({ db: c.env.DB });
  const objective = await actionService.getObjective(c.req.param('objectiveId'));
  if (!objective) {
    return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Objective not found' }] }, 404);
  }
  return c.json({ success: true, data: { objective } });
});

// =============================================================================
// EXPORTED UTILITIES
// =============================================================================

export {
  getActiveDistrictEvents,
  getEffectiveModifiers,
};
