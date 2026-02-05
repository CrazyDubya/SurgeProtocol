/**
 * Surge Protocol - Mission Routes
 *
 * Endpoints:
 * - GET /missions/available - List missions for character's tier
 * - GET /missions/active - Get current active mission
 * - POST /missions/:id/accept - Accept a mission
 * - POST /missions/:id/action - Take action during mission
 * - POST /missions/:id/complete - Complete/submit mission
 * - POST /missions/:id/abandon - Abandon a mission
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import {
  authMiddleware,
  requireCharacterMiddleware,
  type AuthVariables,
} from '../../middleware/auth';
import {
  getMission,
  getAvailableMissions,
  getActiveMission,
  createMissionInstance,
  getCharacter,
  getCharacterCombatData,
  generateProceduralEnemy,
  getSkillCheckData,
} from '../../db';
import { updateQuestProgress, startQuestFromTrigger } from '../quests';
import type { Combatant } from '../../game/mechanics/combat';
import {
  type DistrictEvent,
  type EventModifier,
  EVENT_TEMPLATES,
  getEventSummary,
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
// VEHICLE INTEGRATION TYPES
// =============================================================================

interface ActiveVehicleInfo {
  id: string;
  custom_name: string | null;
  vehicle_class: string;
  cargo_capacity_kg: number;
  top_speed_kmh: number;
  handling_rating: number;
  current_fuel: number;
  fuel_capacity: number;
  current_hull_points: number;
  is_damaged: number;
  odometer_km: number;
  total_deliveries: number;
}

/**
 * Get character's active vehicle with definition details.
 * Returns null if no active vehicle or vehicle is unavailable.
 */
async function getActiveVehicle(
  db: D1Database,
  characterId: string
): Promise<ActiveVehicleInfo | null> {
  return db
    .prepare(`
      SELECT cv.id, cv.custom_name, cv.current_fuel, cv.current_hull_points,
             cv.is_damaged, cv.odometer_km, cv.total_deliveries,
             vd.vehicle_class, vd.cargo_capacity_kg, vd.top_speed_kmh,
             vd.handling_rating, vd.fuel_capacity
      FROM characters c
      JOIN character_vehicles cv ON c.active_vehicle_id = cv.id
      JOIN vehicle_definitions vd ON cv.vehicle_definition_id = vd.id
      WHERE c.id = ? AND cv.character_id = ?
    `)
    .bind(characterId, characterId)
    .first<ActiveVehicleInfo>();
}

/**
 * Check if vehicle can handle the mission requirements.
 * Returns validation result with errors if any.
 */
function validateVehicleForMission(
  vehicle: ActiveVehicleInfo,
  mission: {
    cargo_weight_kg: number | null;
    required_vehicle_class: string | null;
    mission_type: string;
  }
): { valid: boolean; errors: Array<{ code: string; message: string }> } {
  const errors: Array<{ code: string; message: string }> = [];

  // Check if vehicle is damaged
  if (vehicle.is_damaged) {
    errors.push({
      code: 'VEHICLE_DAMAGED',
      message: 'Your active vehicle is damaged. Repair it before accepting missions.',
    });
  }

  // Check fuel level (at least 10% required)
  const fuelPercent = (vehicle.current_fuel / vehicle.fuel_capacity) * 100;
  if (fuelPercent < 10) {
    errors.push({
      code: 'VEHICLE_LOW_FUEL',
      message: 'Your vehicle needs at least 10% fuel to start a mission.',
    });
  }

  // Check cargo capacity
  if (mission.cargo_weight_kg && mission.cargo_weight_kg > vehicle.cargo_capacity_kg) {
    errors.push({
      code: 'CARGO_TOO_HEAVY',
      message: `Mission cargo (${mission.cargo_weight_kg}kg) exceeds vehicle capacity (${vehicle.cargo_capacity_kg}kg).`,
    });
  }

  // Check vehicle class requirement
  if (mission.required_vehicle_class && mission.required_vehicle_class !== vehicle.vehicle_class) {
    errors.push({
      code: 'WRONG_VEHICLE_CLASS',
      message: `This mission requires a ${mission.required_vehicle_class}, but you have a ${vehicle.vehicle_class}.`,
    });
  }

  // Special checks for mission types
  if (mission.mission_type === 'HAZMAT' && !['VAN', 'TRUCK'].includes(vehicle.vehicle_class)) {
    errors.push({
      code: 'HAZMAT_VEHICLE_REQUIRED',
      message: 'HAZMAT missions require a VAN or TRUCK with proper containment.',
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Calculate time bonus based on vehicle speed.
 * Faster vehicles get more time buffer.
 */
function calculateVehicleTimeBonus(vehicleSpeed: number): number {
  // Base reference speed is 100 km/h
  // Faster vehicles get a time bonus (up to 20%)
  // Slower vehicles get a time penalty (up to -20%)
  const speedRatio = vehicleSpeed / 100;
  const timeMultiplier = Math.min(Math.max(speedRatio, 0.8), 1.2);
  return timeMultiplier;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const missionActionSchema = z.object({
  actionType: z.enum([
    'MOVE',
    'INTERACT',
    'STEALTH',
    'COMBAT',
    'SKILL_CHECK',
    'DIALOGUE',
    'USE_ITEM',
    'WAIT',
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

// Apply auth middleware to all routes
missionRoutes.use('*', authMiddleware());
missionRoutes.use('*', requireCharacterMiddleware());

/**
 * GET /missions/available
 * List missions available for the character's current tier.
 * Applies district event modifiers to mission data.
 */
missionRoutes.get('/available', async (c) => {
  const characterId = c.get('characterId')!;

  // Get character's current tier and location
  const character = await c.env.DB
    .prepare('SELECT current_tier, carrier_rating, current_location_id FROM characters WHERE id = ?')
    .bind(characterId)
    .first<{ current_tier: number; carrier_rating: number; current_location_id: string | null }>();

  if (!character) {
    return c.json({
      success: false,
      errors: [{ code: 'CHARACTER_NOT_FOUND', message: 'Character not found' }],
    }, 404);
  }

  // Get available missions for this tier range
  const baseMissions = await getAvailableMissions(
    c.env.DB,
    character.current_tier,
    character.carrier_rating
  );

  // Get character's current district (default to 'downtown' if not set)
  const districtId = character.current_location_id || 'downtown';

  // Get active district events
  const activeEvents = await getActiveDistrictEvents(c.env.CACHE, districtId);
  const modifiers = getEffectiveModifiers(activeEvents);

  // Apply event modifiers to missions
  const missions = baseMissions.map(mission => {
    const rewardMod = modifiers.get('MISSION_REWARD') || 1.0;
    const dangerMod = modifiers.get('ROUTE_DANGER') || 1.0;

    return {
      ...mission,
      // Show modified rewards
      effective_credits: Math.round(mission.base_credits * rewardMod),
      effective_xp: Math.round(mission.base_xp * rewardMod),
      // Show danger level modification
      danger_modifier: dangerMod,
      danger_warning: dangerMod > 1.3 ? 'HIGH' : dangerMod > 1.0 ? 'ELEVATED' : null,
      // Original values for reference
      base_credits: mission.base_credits,
      base_xp: mission.base_xp,
    };
  });

  // Get active mission to check if player can accept new ones
  const activeMission = await getActiveMission(c.env.DB, characterId);

  // Format active events for response
  const eventWarnings = activeEvents.map(e => ({
    type: e.type,
    name: e.name,
    severity: e.severity,
    summary: getEventSummary(e),
    endsAt: e.endTime.toISOString(),
  }));

  return c.json({
    success: true,
    data: {
      missions,
      count: missions.length,
      canAcceptNew: !activeMission,
      currentTier: character.current_tier,
      currentDistrict: districtId,
      activeEvents: eventWarnings,
      modifiers: {
        missionReward: modifiers.get('MISSION_REWARD') || 1.0,
        routeDanger: modifiers.get('ROUTE_DANGER') || 1.0,
        routeTime: modifiers.get('ROUTE_TIME') || 1.0,
        detectionRisk: modifiers.get('DETECTION_RISK') || 1.0,
      },
    },
  });
});

/**
 * GET /missions/active
 * Get the character's current active mission.
 */
missionRoutes.get('/active', async (c) => {
  const characterId = c.get('characterId')!;

  const activeMission = await getActiveMission(c.env.DB, characterId);

  if (!activeMission) {
    return c.json({
      success: true,
      data: { mission: null },
    });
  }

  // Get mission definition details
  const missionDef = await getMission(c.env.DB, activeMission.mission_id);

  // Get mission progress/state
  const checkpoints = await c.env.DB
    .prepare(
      `SELECT * FROM mission_checkpoints
       WHERE mission_instance_id = ?
       ORDER BY sequence_order ASC`
    )
    .bind(activeMission.id)
    .all();

  return c.json({
    success: true,
    data: {
      mission: {
        instance: activeMission,
        definition: missionDef,
        checkpoints: checkpoints.results,
      },
    },
  });
});

/**
 * GET /missions/:id
 * Get details of a specific mission definition.
 * Includes district event warnings and modified rewards.
 */
missionRoutes.get('/:id', async (c) => {
  const missionId = c.req.param('id');
  const characterId = c.get('characterId')!;

  const mission = await getMission(c.env.DB, missionId);

  if (!mission) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Mission not found' }],
    }, 404);
  }

  // Get character's tier and location to check if mission is accessible
  const character = await c.env.DB
    .prepare('SELECT current_tier, current_location_id FROM characters WHERE id = ?')
    .bind(characterId)
    .first<{ current_tier: number; current_location_id: string | null }>();

  const isAccessible = character &&
    mission.tier_minimum <= character.current_tier &&
    mission.tier_maximum >= character.current_tier;

  // Get mission requirements
  const requirements = await c.env.DB
    .prepare('SELECT * FROM mission_requirements WHERE mission_id = ?')
    .bind(missionId)
    .all();

  // Get potential rewards
  const rewards = await c.env.DB
    .prepare('SELECT * FROM mission_rewards WHERE mission_id = ?')
    .bind(missionId)
    .all();

  // Get district events and calculate modifiers
  const districtId = character?.current_location_id || 'downtown';
  const activeEvents = await getActiveDistrictEvents(c.env.CACHE, districtId);
  const modifiers = getEffectiveModifiers(activeEvents);

  const rewardMod = modifiers.get('MISSION_REWARD') || 1.0;
  const dangerMod = modifiers.get('ROUTE_DANGER') || 1.0;
  const timeMod = modifiers.get('ROUTE_TIME') || 1.0;

  // Format event warnings
  const eventWarnings = activeEvents.map(e => ({
    type: e.type,
    name: e.name,
    severity: e.severity,
    description: e.description,
    effects: e.modifiers.map(m => ({
      type: m.type,
      multiplier: m.value,
      description: m.type === 'ROUTE_DANGER' ? 'Increased danger' :
                   m.type === 'ROUTE_TIME' ? 'Travel delays' :
                   m.type === 'MISSION_REWARD' ? 'Modified rewards' :
                   m.type === 'DETECTION_RISK' ? 'Detection risk' : m.type,
    })),
  }));

  return c.json({
    success: true,
    data: {
      mission: {
        ...mission,
        effective_credits: Math.round(mission.base_credits * rewardMod),
        effective_xp: Math.round(mission.base_xp * rewardMod),
        effective_time_limit: mission.time_limit_minutes
          ? Math.round(mission.time_limit_minutes / timeMod)
          : null,
      },
      requirements: requirements.results,
      rewards: rewards.results,
      isAccessible,
      districtConditions: {
        districtId,
        dangerLevel: dangerMod > 1.5 ? 'EXTREME' :
                     dangerMod > 1.3 ? 'HIGH' :
                     dangerMod > 1.0 ? 'ELEVATED' : 'NORMAL',
        dangerMultiplier: dangerMod,
        rewardMultiplier: rewardMod,
        timeMultiplier: timeMod,
        activeEvents: eventWarnings,
      },
    },
  });
});

/**
 * POST /missions/:id/accept
 * Accept a mission to start it.
 */
missionRoutes.post('/:id/accept', async (c) => {
  const missionId = c.req.param('id');
  const characterId = c.get('characterId')!;

  // Check if player already has an active mission
  const existingActive = await getActiveMission(c.env.DB, characterId);
  if (existingActive) {
    return c.json({
      success: false,
      errors: [{
        code: 'MISSION_ACTIVE',
        message: 'Complete or abandon current mission first',
      }],
    }, 400);
  }

  // Get mission definition
  const mission = await getMission(c.env.DB, missionId);
  if (!mission) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Mission not found' }],
    }, 404);
  }

  // Check tier requirements
  const character = await c.env.DB
    .prepare('SELECT current_tier, carrier_rating FROM characters WHERE id = ?')
    .bind(characterId)
    .first<{ current_tier: number; carrier_rating: number }>();

  if (!character) {
    return c.json({
      success: false,
      errors: [{ code: 'CHARACTER_NOT_FOUND', message: 'Character not found' }],
    }, 404);
  }

  if (character.current_tier < mission.tier_minimum) {
    return c.json({
      success: false,
      errors: [{
        code: 'TIER_TOO_LOW',
        message: `Requires Tier ${mission.tier_minimum}, you are Tier ${character.current_tier}`,
      }],
    }, 403);
  }

  if (character.current_tier > mission.tier_maximum) {
    return c.json({
      success: false,
      errors: [{
        code: 'TIER_TOO_HIGH',
        message: 'This mission is below your tier',
      }],
    }, 403);
  }

  // Check vehicle requirements
  const activeVehicle = await getActiveVehicle(c.env.DB, characterId);
  if (!activeVehicle) {
    return c.json({
      success: false,
      errors: [{
        code: 'NO_VEHICLE',
        message: 'You need an active vehicle to accept delivery missions. Purchase one from the vehicle dealer.',
      }],
    }, 422);
  }

  // Validate vehicle can handle this mission
  const vehicleValidation = validateVehicleForMission(activeVehicle, {
    cargo_weight_kg: mission.cargo_weight_kg,
    required_vehicle_class: mission.required_vehicle_class,
    mission_type: mission.mission_type,
  });

  if (!vehicleValidation.valid) {
    return c.json({
      success: false,
      errors: vehicleValidation.errors,
    }, 422);
  }

  // Calculate effective time limit with vehicle speed bonus
  const vehicleTimeBonus = calculateVehicleTimeBonus(activeVehicle.top_speed_kmh);
  const effectiveTimeLimit = Math.round((mission.time_limit_minutes ?? 60) * vehicleTimeBonus);

  // Check mission requirements (skills, items, reputation, etc.)
  const requirements = await c.env.DB
    .prepare('SELECT * FROM mission_requirements WHERE mission_id = ?')
    .bind(missionId)
    .all<{
      requirement_type: string;
      target_id: string | null;
      min_value: number;
    }>();

  for (const req of requirements.results) {
    if (req.requirement_type === 'SKILL') {
      const skill = await c.env.DB
        .prepare(
          `SELECT cs.current_level FROM character_skills cs
           JOIN skill_definitions sd ON cs.skill_id = sd.id
           WHERE cs.character_id = ? AND sd.code = ?`
        )
        .bind(characterId, req.target_id)
        .first<{ current_level: number }>();

      if (!skill || skill.current_level < req.min_value) {
        return c.json({
          success: false,
          errors: [{
            code: 'SKILL_REQUIREMENT',
            message: `Requires ${req.target_id} level ${req.min_value}`,
          }],
        }, 403);
      }
    } else if (req.requirement_type === 'FACTION_REP') {
      const rep = await c.env.DB
        .prepare(
          `SELECT reputation_value FROM character_reputations
           WHERE character_id = ? AND faction_id = ?`
        )
        .bind(characterId, req.target_id)
        .first<{ reputation_value: number }>();

      if (!rep || rep.reputation_value < req.min_value) {
        return c.json({
          success: false,
          errors: [{
            code: 'FACTION_REQUIREMENT',
            message: 'Insufficient faction reputation',
          }],
        }, 403);
      }
    }
  }

  // Create mission instance with vehicle-adjusted time limit
  const instanceId = await createMissionInstance(c.env.DB, {
    missionId,
    characterId,
    timeLimit: effectiveTimeLimit,
  });

  // Store vehicle used for this mission (for tracking and rewards)
  await c.env.DB
    .prepare(
      `UPDATE mission_instances
       SET current_state = json_set(COALESCE(current_state, '{}'), '$.vehicleId', ?)
       WHERE id = ?`
    )
    .bind(activeVehicle.id, instanceId)
    .run();

  // Initialize mission checkpoints
  const checkpointDefs = await c.env.DB
    .prepare(
      `SELECT * FROM mission_checkpoint_definitions
       WHERE mission_id = ?
       ORDER BY sequence_order ASC`
    )
    .bind(missionId)
    .all();

  for (const checkpoint of checkpointDefs.results) {
    await c.env.DB
      .prepare(
        `INSERT INTO mission_checkpoints (id, mission_instance_id, checkpoint_type, sequence_order, is_completed)
         VALUES (?, ?, ?, ?, 0)`
      )
      .bind(nanoid(), instanceId, checkpoint.checkpoint_type, checkpoint.sequence_order)
      .run();
  }

  // Log mission start
  await c.env.DB
    .prepare(
      `INSERT INTO mission_log (id, mission_instance_id, event_type, event_data, created_at)
       VALUES (?, ?, 'MISSION_STARTED', ?, datetime('now'))`
    )
    .bind(nanoid(), instanceId, JSON.stringify({ missionId, characterId }))
    .run();

  const instance = await c.env.DB
    .prepare('SELECT * FROM mission_instances WHERE id = ?')
    .bind(instanceId)
    .first();

  return c.json({
    success: true,
    data: {
      instance,
      mission,
      vehicle: {
        id: activeVehicle.id,
        name: activeVehicle.custom_name || activeVehicle.vehicle_class,
        class: activeVehicle.vehicle_class,
        cargoCapacity: activeVehicle.cargo_capacity_kg,
        speed: activeVehicle.top_speed_kmh,
        timeBonus: Math.round((vehicleTimeBonus - 1) * 100), // As percentage
      },
      effectiveTimeLimit,
      message: `Mission accepted. Your ${activeVehicle.vehicle_class} is ready. Good luck, courier.`,
    },
  }, 201);
});

/**
 * POST /missions/:id/action
 * Take an action during an active mission.
 */
missionRoutes.post('/:id/action', zValidator('json', missionActionSchema), async (c) => {
  const instanceId = c.req.param('id');
  const characterId = c.get('characterId')!;
  const action = c.req.valid('json');

  // Verify mission ownership and status
  const instance = await c.env.DB
    .prepare(
      `SELECT * FROM mission_instances
       WHERE id = ? AND character_id = ? AND status = 'IN_PROGRESS'`
    )
    .bind(instanceId, characterId)
    .first();

  if (!instance) {
    return c.json({
      success: false,
      errors: [{
        code: 'MISSION_NOT_ACTIVE',
        message: 'No active mission with this ID',
      }],
    }, 404);
  }

  // Check time limit
  const startTime = new Date(instance.started_at as string).getTime();
  const timeLimit = (instance.time_limit_minutes as number) * 60 * 1000;
  if (Date.now() - startTime > timeLimit) {
    // Auto-fail the mission
    await c.env.DB
      .prepare("UPDATE mission_instances SET status = 'FAILED', completed_at = datetime('now') WHERE id = ?")
      .bind(instanceId)
      .run();

    return c.json({
      success: false,
      errors: [{
        code: 'TIME_EXPIRED',
        message: 'Mission time limit exceeded',
      }],
    }, 400);
  }

  // Get mission definition for tier info
  const missionDef = await getMission(c.env.DB, instance.mission_id as string);

  // Process action based on type
  let result: {
    success: boolean;
    outcome: string;
    details: Record<string, unknown>;
  };

  switch (action.actionType) {
    case 'MOVE':
      result = await processMoveAction(c.env.DB, instanceId, characterId, action.parameters);
      break;
    case 'SKILL_CHECK':
      result = await processSkillCheck(c.env.DB, instanceId, characterId, action.parameters);
      break;
    case 'INTERACT':
      result = await processInteraction(c.env.DB, instanceId, characterId, action.targetId, action.parameters);
      break;
    case 'COMBAT':
      result = await processCombatAction(
        c.env.DB,
        c.env.COMBAT_SESSION,
        c.env.CACHE,
        instanceId,
        characterId,
        missionDef?.tier_minimum ?? 1,
        action.parameters
      );
      break;
    case 'DIALOGUE':
      result = await processDialogueAction(
        c.env.DB,
        instanceId,
        characterId,
        action.targetId,
        action.parameters
      );
      break;
    case 'USE_ITEM':
      result = await processUseItemAction(c.env.DB, instanceId, characterId, action.parameters);
      break;
    case 'STEALTH':
      result = await processStealthAction(c.env.DB, c.env.CACHE, instanceId, characterId, action.parameters);
      break;
    case 'WAIT':
      result = await processWaitAction(c.env.DB, instanceId, characterId, action.parameters);
      break;
    default:
      result = {
        success: true,
        outcome: 'ACTION_NOTED',
        details: { actionType: action.actionType },
      };
  }

  // Log the action
  await c.env.DB
    .prepare(
      `INSERT INTO mission_log (id, mission_instance_id, event_type, event_data, created_at)
       VALUES (?, ?, 'ACTION', ?, datetime('now'))`
    )
    .bind(nanoid(), instanceId, JSON.stringify({ action, result }))
    .run();

  // Check if mission objectives are complete
  const remainingCheckpoints = await c.env.DB
    .prepare(
      `SELECT COUNT(*) as count FROM mission_checkpoints
       WHERE mission_instance_id = ? AND is_completed = 0`
    )
    .bind(instanceId)
    .first<{ count: number }>();

  return c.json({
    success: true,
    data: {
      result,
      remainingObjectives: remainingCheckpoints?.count ?? 0,
      canComplete: remainingCheckpoints?.count === 0,
    },
  });
});

/**
 * POST /missions/:id/complete
 * Complete/submit an active mission.
 */
missionRoutes.post('/:id/complete', zValidator('json', missionCompleteSchema), async (c) => {
  const instanceId = c.req.param('id');
  const characterId = c.get('characterId')!;
  const completion = c.req.valid('json');

  // Verify mission ownership and status
  const instance = await c.env.DB
    .prepare(
      `SELECT mi.*, md.base_credits, md.base_xp, md.tier_minimum, md.distance_km
       FROM mission_instances mi
       JOIN mission_definitions md ON mi.mission_id = md.id
       WHERE mi.id = ? AND mi.character_id = ? AND mi.status = 'IN_PROGRESS'`
    )
    .bind(instanceId, characterId)
    .first<{
      id: string;
      mission_id: string;
      status: string;
      started_at: string;
      time_limit_minutes: number;
      base_credits: number;
      base_xp: number;
      tier_minimum: number;
      current_state: string | null;
      distance_km: number | null;
    }>();

  if (!instance) {
    return c.json({
      success: false,
      errors: [{
        code: 'MISSION_NOT_ACTIVE',
        message: 'No active mission with this ID',
      }],
    }, 404);
  }

  // Check all required checkpoints are complete
  const incompleteCheckpoints = await c.env.DB
    .prepare(
      `SELECT COUNT(*) as count FROM mission_checkpoints
       WHERE mission_instance_id = ? AND is_completed = 0 AND is_optional = 0`
    )
    .bind(instanceId)
    .first<{ count: number }>();

  if (incompleteCheckpoints && incompleteCheckpoints.count > 0 && completion.outcome === 'SUCCESS') {
    return c.json({
      success: false,
      errors: [{
        code: 'OBJECTIVES_INCOMPLETE',
        message: `${incompleteCheckpoints.count} required objectives not completed`,
      }],
    }, 400);
  }

  // Calculate rewards based on outcome
  // Base rating gain is determined by mission tier (higher tier = higher gain)
  const baseRatingGain = Math.ceil(instance.tier_minimum * 0.5) + 2;
  let creditMultiplier = 1.0;
  let xpMultiplier = 1.0;
  let ratingChange = baseRatingGain;

  switch (completion.outcome) {
    case 'SUCCESS':
      creditMultiplier = 1.0;
      xpMultiplier = 1.0;
      break;
    case 'PARTIAL':
      creditMultiplier = 0.5;
      xpMultiplier = 0.75;
      ratingChange = Math.floor(ratingChange * 0.5);
      break;
    case 'FAILURE':
      creditMultiplier = 0;
      xpMultiplier = 0.25;
      ratingChange = -Math.abs(ratingChange);
      break;
  }

  // Calculate time bonus
  const elapsedMinutes = (Date.now() - new Date(instance.started_at).getTime()) / 60000;
  const timeBonusMultiplier = elapsedMinutes < instance.time_limit_minutes * 0.75 ? 1.1 : 1.0;

  // Get character's district and apply event modifiers
  const character = await c.env.DB
    .prepare('SELECT current_location_id FROM characters WHERE id = ?')
    .bind(characterId)
    .first<{ current_location_id: string | null }>();

  const districtId = character?.current_location_id || 'downtown';
  const activeEvents = await getActiveDistrictEvents(c.env.CACHE, districtId);
  const eventModifiers = getEffectiveModifiers(activeEvents);
  const eventRewardMod = eventModifiers.get('MISSION_REWARD') || 1.0;

  // Apply all multipliers: outcome * time bonus * district events
  const finalCredits = Math.floor(instance.base_credits * creditMultiplier * timeBonusMultiplier * eventRewardMod);
  const finalXp = Math.floor(instance.base_xp * xpMultiplier * eventRewardMod);

  // Update mission instance
  await c.env.DB
    .prepare(
      `UPDATE mission_instances
       SET status = ?, completed_at = datetime('now'),
           credits_earned = ?, xp_earned = ?, rating_change = ?,
           customer_rating = ?
       WHERE id = ?`
    )
    .bind(
      completion.outcome === 'FAILURE' ? 'FAILED' : 'COMPLETED',
      finalCredits,
      finalXp,
      ratingChange,
      completion.customerRating ?? null,
      instanceId
    )
    .run();

  // Award rewards to character
  if (finalCredits > 0) {
    await c.env.DB
      .prepare(
        `UPDATE character_finances
         SET credits = credits + ?, updated_at = datetime('now')
         WHERE character_id = ?`
      )
      .bind(finalCredits, characterId)
      .run();
  }

  // Update character rating
  await c.env.DB
    .prepare(
      `UPDATE characters
       SET carrier_rating = MAX(0, carrier_rating + ?),
           missions_completed = missions_completed + ?,
           updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(ratingChange, completion.outcome === 'SUCCESS' ? 1 : 0, characterId)
    .run();

  // Update vehicle stats if mission was completed
  // Get vehicle ID from mission state
  const missionState = instance.current_state ? JSON.parse(instance.current_state as string) : {};
  const vehicleId = missionState.vehicleId;

  if (vehicleId) {
    // Get mission distance (default to tier * 5 km if not set)
    const missionDistance = instance.distance_km || (instance.tier_minimum * 5);

    // Update vehicle odometer and delivery count
    await c.env.DB
      .prepare(
        `UPDATE character_vehicles
         SET odometer_km = odometer_km + ?,
             total_deliveries = total_deliveries + ?,
             total_distance_km = total_distance_km + ?,
             updated_at = datetime('now')
         WHERE id = ? AND character_id = ?`
      )
      .bind(
        missionDistance,
        completion.outcome === 'SUCCESS' ? 1 : 0,
        missionDistance,
        vehicleId,
        characterId
      )
      .run();

    // Apply minor wear on failure (1% damage chance)
    if (completion.outcome === 'FAILURE' && Math.random() < 0.3) {
      await c.env.DB
        .prepare(
          `UPDATE character_vehicles
           SET current_hull_points = MAX(1, current_hull_points - 5),
               is_damaged = CASE WHEN current_hull_points - 5 < 20 THEN 1 ELSE is_damaged END,
               accidents = accidents + 1
           WHERE id = ? AND character_id = ?`
        )
        .bind(vehicleId, characterId)
        .run();
    }

    // Consume fuel based on distance
    const fuelConsumed = Math.round(missionDistance * 0.1); // ~10L per 100km average
    await c.env.DB
      .prepare(
        `UPDATE character_vehicles
         SET current_fuel = MAX(0, current_fuel - ?)
         WHERE id = ? AND character_id = ?`
      )
      .bind(fuelConsumed, vehicleId, characterId)
      .run();
  }

  // Log completion
  await c.env.DB
    .prepare(
      `INSERT INTO mission_log (id, mission_instance_id, event_type, event_data, created_at)
       VALUES (?, ?, 'MISSION_COMPLETED', ?, datetime('now'))`
    )
    .bind(nanoid(), instanceId, JSON.stringify({
      outcome: completion.outcome,
      credits: finalCredits,
      xp: finalXp,
      ratingChange,
    }))
    .run();

  // Get updated character
  const updatedCharacter = await getCharacter(c.env.DB, characterId);

  // Build message with event context
  let message = completion.outcome === 'SUCCESS'
    ? 'Delivery confirmed. Payment transferred.'
    : completion.outcome === 'PARTIAL'
      ? 'Partial completion noted. Reduced payment processed.'
      : 'Mission failed. The Algorithm has taken note.';

  if (eventRewardMod > 1.0) {
    message += ` District conditions granted a ${Math.round((eventRewardMod - 1) * 100)}% bonus.`;
  }

  return c.json({
    success: true,
    data: {
      outcome: completion.outcome,
      rewards: {
        credits: finalCredits,
        xp: finalXp,
        ratingChange,
        timeBonus: timeBonusMultiplier > 1,
        eventBonus: eventRewardMod !== 1.0,
        eventMultiplier: eventRewardMod,
      },
      districtConditions: {
        districtId,
        activeEvents: activeEvents.map(e => e.name),
      },
      character: updatedCharacter,
      message,
    },
  });
});

/**
 * POST /missions/:id/combat/resolve
 * Resolve an active combat session and update mission state.
 */
missionRoutes.post('/:id/combat/resolve', async (c) => {
  const instanceId = c.req.param('id');
  const characterId = c.get('characterId')!;

  // Verify mission ownership
  const instance = await c.env.DB
    .prepare(
      `SELECT * FROM mission_instances
       WHERE id = ? AND character_id = ? AND status = 'IN_PROGRESS'`
    )
    .bind(instanceId, characterId)
    .first();

  if (!instance) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSION_NOT_ACTIVE', message: 'No active mission with this ID' }],
    }, 404);
  }

  // Get combat session ID from mission state
  const currentState = instance.current_state
    ? JSON.parse(instance.current_state as string)
    : {};

  const combatId = currentState.activeCombatId;
  if (!combatId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_COMBAT', message: 'No active combat session for this mission' }],
    }, 400);
  }

  // Get combat state from Durable Object
  const doId = c.env.COMBAT_SESSION.idFromName(combatId);
  const stub = c.env.COMBAT_SESSION.get(doId);

  const combatResponse = await stub.fetch(
    new Request('https://combat/state', { method: 'GET' })
  );

  if (!combatResponse.ok) {
    return c.json({
      success: false,
      errors: [{ code: 'COMBAT_ERROR', message: 'Failed to get combat state' }],
    }, 500);
  }

  const combatState = await combatResponse.json() as {
    phase: string;
    endReason?: string;
    combatants: Array<[string, { id: string; hp: number; hpMax: number }]>;
  };

  // Check if combat is finished
  if (combatState.phase !== 'COMBAT_END') {
    return c.json({
      success: false,
      errors: [{ code: 'COMBAT_IN_PROGRESS', message: 'Combat is still in progress' }],
    }, 400);
  }

  const endReason = combatState.endReason;

  // Update character health based on combat outcome
  const playerCombatant = combatState.combatants.find(([id]) => !id.startsWith('enemy_'));
  if (playerCombatant) {
    const [, combatant] = playerCombatant;
    await c.env.DB
      .prepare(
        `UPDATE characters SET current_health = ?, updated_at = datetime('now') WHERE id = ?`
      )
      .bind(Math.max(0, combatant.hp), characterId)
      .run();
  }

  // Clear active combat from mission state
  delete currentState.activeCombatId;
  currentState.lastCombatResult = endReason;

  await c.env.DB
    .prepare(
      `UPDATE mission_instances SET current_state = ? WHERE id = ?`
    )
    .bind(JSON.stringify(currentState), instanceId)
    .run();

  // Handle combat outcome
  let missionUpdate = {};
  let checkpointCompleted = false;

  if (endReason === 'VICTORY') {
    // Check if this completes a combat checkpoint
    const combatCheckpoint = await c.env.DB
      .prepare(
        `SELECT id FROM mission_checkpoints
         WHERE mission_instance_id = ? AND checkpoint_type = 'COMBAT'
         AND is_completed = 0
         LIMIT 1`
      )
      .bind(instanceId)
      .first<{ id: string }>();

    if (combatCheckpoint) {
      await c.env.DB
        .prepare("UPDATE mission_checkpoints SET is_completed = 1, completed_at = datetime('now') WHERE id = ?")
        .bind(combatCheckpoint.id)
        .run();
      checkpointCompleted = true;
    }

    missionUpdate = { outcome: 'VICTORY', checkpointCompleted };
  } else if (endReason === 'DEFEAT') {
    // Player was defeated - mission may fail or allow retry
    missionUpdate = { outcome: 'DEFEAT', canRetry: true };
  } else if (endReason === 'ESCAPE') {
    missionUpdate = { outcome: 'ESCAPED' };
  }

  // Log combat resolution
  await c.env.DB
    .prepare(
      `INSERT INTO mission_log (id, mission_instance_id, event_type, event_data, created_at)
       VALUES (?, ?, 'COMBAT_RESOLVED', ?, datetime('now'))`
    )
    .bind(nanoid(), instanceId, JSON.stringify({ combatId, endReason, ...missionUpdate }))
    .run();

  return c.json({
    success: true,
    data: {
      combatResult: endReason,
      ...missionUpdate,
    },
  });
});

/**
 * POST /missions/:id/abandon
 * Abandon an active mission.
 */
missionRoutes.post('/:id/abandon', async (c) => {
  const instanceId = c.req.param('id');
  const characterId = c.get('characterId')!;

  // Verify mission ownership and status
  const instance = await c.env.DB
    .prepare(
      `SELECT * FROM mission_instances
       WHERE id = ? AND character_id = ? AND status = 'IN_PROGRESS'`
    )
    .bind(instanceId, characterId)
    .first();

  if (!instance) {
    return c.json({
      success: false,
      errors: [{
        code: 'MISSION_NOT_ACTIVE',
        message: 'No active mission with this ID',
      }],
    }, 404);
  }

  // Apply abandonment penalty
  const ratingPenalty = -5;

  await c.env.DB
    .prepare(
      `UPDATE mission_instances
       SET status = 'ABANDONED', completed_at = datetime('now'), rating_change = ?
       WHERE id = ?`
    )
    .bind(ratingPenalty, instanceId)
    .run();

  await c.env.DB
    .prepare(
      `UPDATE characters
       SET carrier_rating = MAX(0, carrier_rating + ?), updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(ratingPenalty, characterId)
    .run();

  // Log abandonment
  await c.env.DB
    .prepare(
      `INSERT INTO mission_log (id, mission_instance_id, event_type, event_data, created_at)
       VALUES (?, ?, 'MISSION_ABANDONED', ?, datetime('now'))`
    )
    .bind(nanoid(), instanceId, JSON.stringify({ ratingPenalty }))
    .run();

  return c.json({
    success: true,
    data: {
      message: 'Mission abandoned. Rating penalty applied.',
      ratingPenalty,
    },
  });
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function processMoveAction(
  db: D1Database,
  instanceId: string,
  _characterId: string,
  params?: Record<string, unknown>
): Promise<{ success: boolean; outcome: string; details: Record<string, unknown> }> {
  const destination = params?.destination as string | undefined;

  if (!destination) {
    return {
      success: false,
      outcome: 'NO_DESTINATION',
      details: { error: 'Destination required' },
    };
  }

  // Update mission state with new location
  await db
    .prepare(
      `UPDATE mission_instances
       SET current_state = json_set(COALESCE(current_state, '{}'), '$.location', ?)
       WHERE id = ?`
    )
    .bind(destination, instanceId)
    .run();

  // Check if this completes a checkpoint
  const locationCheckpoint = await db
    .prepare(
      `SELECT id FROM mission_checkpoints
       WHERE mission_instance_id = ? AND checkpoint_type = 'REACH_LOCATION'
       AND is_completed = 0
       AND checkpoint_data LIKE ?`
    )
    .bind(instanceId, `%${destination}%`)
    .first<{ id: string }>();

  if (locationCheckpoint) {
    await db
      .prepare("UPDATE mission_checkpoints SET is_completed = 1, completed_at = datetime('now') WHERE id = ?")
      .bind(locationCheckpoint.id)
      .run();

    return {
      success: true,
      outcome: 'CHECKPOINT_REACHED',
      details: { location: destination, checkpointCompleted: true },
    };
  }

  return {
    success: true,
    outcome: 'MOVED',
    details: { location: destination },
  };
}

async function processSkillCheck(
  db: D1Database,
  _instanceId: string,
  characterId: string,
  params?: Record<string, unknown>
): Promise<{ success: boolean; outcome: string; details: Record<string, unknown> }> {
  const skillCode = params?.skill as string | undefined;
  const difficulty = (params?.difficulty as number) ?? 10;

  if (!skillCode) {
    return {
      success: false,
      outcome: 'NO_SKILL',
      details: { error: 'Skill code required' },
    };
  }

  // Get comprehensive skill check data including:
  // - Skill level
  // - Governing attribute modifier
  // - Equipment bonuses
  // - Condition penalties
  const checkData = await getSkillCheckData(db, characterId, skillCode);

  if (!checkData) {
    return {
      success: false,
      outcome: 'UNKNOWN_SKILL',
      details: { error: `Unknown skill: ${skillCode}` },
    };
  }

  // Roll 2d6 + total bonus vs difficulty
  const roll1 = Math.floor(Math.random() * 6) + 1;
  const roll2 = Math.floor(Math.random() * 6) + 1;
  const rollTotal = roll1 + roll2;
  const total = rollTotal + checkData.totalBonus;
  const success = total >= difficulty;

  // Determine margin of success/failure
  const margin = total - difficulty;

  // Critical success on natural 12, critical failure on natural 2
  const isCriticalSuccess = rollTotal === 12;
  const isCriticalFailure = rollTotal === 2;

  let outcome = success ? 'SKILL_SUCCESS' : 'SKILL_FAILURE';
  if (isCriticalSuccess) outcome = 'CRITICAL_SUCCESS';
  if (isCriticalFailure) outcome = 'CRITICAL_FAILURE';

  return {
    success: success || isCriticalSuccess,
    outcome,
    details: {
      skill: checkData.skillCode,
      skillName: checkData.skillName,
      roll: [roll1, roll2],
      rollTotal,
      // Breakdown of bonuses
      skillLevel: checkData.skillLevel,
      attributeModifier: checkData.attributeModifier,
      governingAttribute: checkData.governingAttribute
        ? {
            code: checkData.governingAttribute.code,
            name: checkData.governingAttribute.name,
            value: checkData.governingAttribute.effectiveValue,
          }
        : null,
      equipmentBonus: checkData.equipmentBonus,
      conditionPenalty: checkData.conditionPenalty,
      totalBonus: checkData.totalBonus,
      // Final calculation
      total,
      difficulty,
      margin,
      isCriticalSuccess,
      isCriticalFailure,
    },
  };
}

async function processInteraction(
  db: D1Database,
  instanceId: string,
  _characterId: string,
  targetId?: string,
  _params?: Record<string, unknown>
): Promise<{ success: boolean; outcome: string; details: Record<string, unknown> }> {
  if (!targetId) {
    return {
      success: false,
      outcome: 'NO_TARGET',
      details: { error: 'Target ID required for interaction' },
    };
  }

  // Check if this completes an interaction checkpoint
  const interactCheckpoint = await db
    .prepare(
      `SELECT id FROM mission_checkpoints
       WHERE mission_instance_id = ? AND checkpoint_type = 'INTERACT'
       AND is_completed = 0
       AND checkpoint_data LIKE ?`
    )
    .bind(instanceId, `%${targetId}%`)
    .first<{ id: string }>();

  if (interactCheckpoint) {
    await db
      .prepare("UPDATE mission_checkpoints SET is_completed = 1, completed_at = datetime('now') WHERE id = ?")
      .bind(interactCheckpoint.id)
      .run();

    return {
      success: true,
      outcome: 'INTERACTION_COMPLETE',
      details: { targetId, checkpointCompleted: true },
    };
  }

  return {
    success: true,
    outcome: 'INTERACTED',
    details: { targetId },
  };
}

/**
 * Process a COMBAT mission action.
 * Creates a combat session and returns WebSocket connection info.
 */
// =============================================================================
// DISTRICT EVENT HELPERS
// =============================================================================

/** Stored event format in KV */
interface StoredDistrictEvent {
  id: string;
  type: string;
  districtId: string;
  severity: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  modifiers: EventModifier[];
}

/**
 * Get active district events from KV storage.
 */
async function getActiveDistrictEvents(
  kv: KVNamespace,
  districtId: string
): Promise<DistrictEvent[]> {
  const key = `district_events:${districtId}`;
  const stored = await kv.get<StoredDistrictEvent[]>(key, 'json');

  if (!stored) return [];

  const now = new Date();
  return stored
    .filter(e => new Date(e.endTime) > now)
    .map(e => ({
      ...e,
      type: e.type as DistrictEvent['type'],
      severity: e.severity as DistrictEvent['severity'],
      startTime: new Date(e.startTime),
      endTime: new Date(e.endTime),
    }));
}

/**
 * Get combined event modifiers for a district.
 */
function getEffectiveModifiers(
  events: DistrictEvent[]
): Map<EventModifier['type'], number> {
  const modifiers = new Map<EventModifier['type'], number>();

  // Start with base values
  const modifierTypes: EventModifier['type'][] = [
    'ROUTE_TIME', 'ROUTE_DANGER', 'SHOP_PRICE',
    'NPC_AVAILABILITY', 'MISSION_REWARD', 'DETECTION_RISK'
  ];
  for (const type of modifierTypes) {
    modifiers.set(type, 1.0);
  }

  // Apply event modifiers (multiplicative)
  for (const event of events) {
    for (const mod of event.modifiers) {
      const current = modifiers.get(mod.type) || 1.0;
      modifiers.set(mod.type, current * mod.value);
    }
  }

  return modifiers;
}

/**
 * Apply a modifier to a base value.
 * Reserved for future use (timing modifiers, stealth checks, etc.)
 */
function _applyModifier(
  modifiers: Map<EventModifier['type'], number>,
  type: EventModifier['type'],
  baseValue: number
): number {
  const modifier = modifiers.get(type) || 1.0;
  return Math.round(baseValue * modifier);
}

/**
 * Generate a random event for testing/demo purposes.
 * In production, events would be triggered by game logic or admin actions.
 */
function _generateRandomEvent(districtId: string, durationMinutes: number = 60): DistrictEvent {
  const types = Object.keys(EVENT_TEMPLATES) as Array<keyof typeof EVENT_TEMPLATES>;
  const type = types[Math.floor(Math.random() * types.length)]!;
  const template = EVENT_TEMPLATES[type];

  const now = new Date();
  return {
    id: nanoid(),
    districtId,
    startTime: now,
    endTime: new Date(now.getTime() + durationMinutes * 60 * 1000),
    ...template,
  };
}

/**
 * Store a district event in KV.
 * Reserved for admin endpoints and game event triggers.
 */
async function _storeDistrictEvent(
  kv: KVNamespace,
  event: DistrictEvent
): Promise<void> {
  const key = `district_events:${event.districtId}`;
  const existing = await kv.get<StoredDistrictEvent[]>(key, 'json') || [];

  const stored: StoredDistrictEvent = {
    ...event,
    startTime: event.startTime.toISOString(),
    endTime: event.endTime.toISOString(),
  };

  // Filter out expired events and add new one
  const now = new Date();
  const updated = [
    ...existing.filter(e => new Date(e.endTime) > now),
    stored,
  ];

  // Store with TTL matching the longest event duration
  const maxEndTime = Math.max(...updated.map(e => new Date(e.endTime).getTime()));
  const ttlSeconds = Math.ceil((maxEndTime - now.getTime()) / 1000) + 60;

  await kv.put(key, JSON.stringify(updated), { expirationTtl: ttlSeconds });
}

// =============================================================================
// COMBAT ACTION HANDLER
// =============================================================================

async function processCombatAction(
  db: D1Database,
  combatDO: DurableObjectNamespace,
  kv: KVNamespace,
  instanceId: string,
  characterId: string,
  missionTier: number,
  params?: Record<string, unknown>
): Promise<{ success: boolean; outcome: string; details: Record<string, unknown> }> {
  // Check if there's already an active combat
  const instance = await db
    .prepare('SELECT current_state FROM mission_instances WHERE id = ?')
    .bind(instanceId)
    .first<{ current_state: string | null }>();

  const currentState = instance?.current_state
    ? JSON.parse(instance.current_state)
    : {};

  if (currentState.activeCombatId) {
    return {
      success: false,
      outcome: 'COMBAT_ALREADY_ACTIVE',
      details: {
        combatId: currentState.activeCombatId,
        message: 'Resolve current combat before starting another',
      },
    };
  }

  // Get character combat data and district info
  const characterData = await getCharacterCombatData(db, characterId);
  if (!characterData) {
    return {
      success: false,
      outcome: 'CHARACTER_ERROR',
      details: { error: 'Could not load character combat data' },
    };
  }

  // Get character's current district for event modifiers
  const character = await db
    .prepare('SELECT current_location_id FROM characters WHERE id = ?')
    .bind(characterId)
    .first<{ current_location_id: string | null }>();

  const districtId = character?.current_location_id || 'downtown';

  // Fetch district events and calculate danger modifier
  const activeEvents = await getActiveDistrictEvents(kv, districtId);
  const modifiers = getEffectiveModifiers(activeEvents);
  const dangerMod = modifiers.get('ROUTE_DANGER') || 1.0;

  // Convert character to Combatant format
  const playerCombatant: Combatant = {
    id: characterData.id,
    name: characterData.name,
    attributes: characterData.attributes,
    skills: characterData.skills,
    hp: characterData.currentHealth,
    hpMax: characterData.maxHealth,
    armor: characterData.equippedArmor
      ? {
          id: characterData.equippedArmor.id,
          name: characterData.equippedArmor.name,
          value: characterData.equippedArmor.value,
          agiPenalty: characterData.equippedArmor.agiPenalty,
          velPenalty: 0,
        }
      : null,
    weapon: characterData.equippedWeapon
      ? {
          id: characterData.equippedWeapon.id,
          name: characterData.equippedWeapon.name,
          type: characterData.equippedWeapon.type,
          subtype: characterData.equippedWeapon.type === 'MELEE' ? 'LIGHT_MELEE' as const : 'HEAVY_PISTOL' as const,
          baseDamage: characterData.equippedWeapon.baseDamage,
          scalingAttribute: characterData.equippedWeapon.type === 'MELEE' ? 'PWR' : 'VEL',
          scalingDivisor: 2,
          attackMod: characterData.equippedWeapon.attackMod,
        }
      : null,
    cover: null,
    augmentBonuses: { initiative: 0, attack: 0, defense: 0, damage: 0 },
    conditions: [],
  };

  // Determine enemy type from parameters or default based on mission
  const enemyType = (params?.enemyType as 'GANGER' | 'CORPORATE' | 'DRONE' | 'BEAST' | 'BOSS') ?? 'GANGER';
  const enemyCount = Math.min((params?.enemyCount as number) ?? 1, 3); // Max 3 enemies

  // Generate enemies with danger modifier applied
  // Danger increases: HP, attack bonus, and potentially enemy count
  const enemies: Combatant[] = [];
  const effectiveEnemyCount = dangerMod > 1.5
    ? Math.min(enemyCount + 1, 4) // Extra enemy at extreme danger
    : enemyCount;

  for (let i = 0; i < effectiveEnemyCount; i++) {
    const enemy = generateProceduralEnemy(missionTier, enemyType);

    // Scale enemy stats based on danger modifier
    if (dangerMod > 1.0) {
      // Increase HP (up to +50% at 1.5x danger)
      const hpBonus = Math.floor(enemy.hpMax * (dangerMod - 1));
      enemy.hp += hpBonus;
      enemy.hpMax += hpBonus;

      // Increase attack modifier based on danger
      if (enemy.weapon) {
        enemy.weapon.attackMod += Math.floor((dangerMod - 1) * 2);
      }

      // Add danger indicator to name
      if (dangerMod > 1.3) {
        enemy.name = `Elite ${enemy.name}`;
      }
    }

    enemies.push(enemy);
  }

  // Create unique combat ID tied to mission
  const combatId = `mission_${instanceId}_combat_${nanoid(8)}`;

  // Initialize combat session via Durable Object
  const doId = combatDO.idFromName(combatId);
  const stub = combatDO.get(doId);

  const initResponse = await stub.fetch(
    new Request('https://combat/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        combatId,
        combatants: [playerCombatant, ...enemies],
        arenaId: currentState.location ?? 'unknown',
        environment: {
          lighting: 'DIM',
          weather: 'CLEAR',
          hazards: [],
        },
      }),
    })
  );

  if (!initResponse.ok) {
    const error = await initResponse.text();
    return {
      success: false,
      outcome: 'COMBAT_INIT_FAILED',
      details: { error },
    };
  }

  // Store combat session ID in mission state
  currentState.activeCombatId = combatId;
  await db
    .prepare(
      `UPDATE mission_instances SET current_state = ? WHERE id = ?`
    )
    .bind(JSON.stringify(currentState), instanceId)
    .run();

  return {
    success: true,
    outcome: 'COMBAT_STARTED',
    details: {
      combatId,
      websocketUrl: `/ws/combat/${combatId}?combatantId=${characterId}`,
      enemies: enemies.map(e => ({
        id: e.id,
        name: e.name,
        hp: e.hp,
        hpMax: e.hpMax,
      })),
      player: {
        id: playerCombatant.id,
        name: playerCombatant.name,
        hp: playerCombatant.hp,
        hpMax: playerCombatant.hpMax,
      },
      districtConditions: {
        districtId,
        dangerLevel: dangerMod > 1.5 ? 'EXTREME' :
                     dangerMod > 1.3 ? 'HIGH' :
                     dangerMod > 1.0 ? 'ELEVATED' : 'NORMAL',
        dangerMultiplier: dangerMod,
        activeEvents: activeEvents.map(e => e.name),
      },
    },
  };
}

// =============================================================================
// DIALOGUE ACTION HANDLER
// =============================================================================

interface DialogueEffect {
  type: string;
  target?: string;
  value?: number | string;
}

/**
 * Process a DIALOGUE mission action.
 * Handles NPC conversations with effects on reputation, items, and quests.
 */
async function processDialogueAction(
  db: D1Database,
  instanceId: string,
  characterId: string,
  targetNpcId?: string,
  params?: Record<string, unknown>
): Promise<{ success: boolean; outcome: string; details: Record<string, unknown> }> {
  if (!targetNpcId) {
    return {
      success: false,
      outcome: 'NO_NPC_TARGET',
      details: { error: 'NPC target ID required for dialogue' },
    };
  }

  const dialogueTreeId = params?.dialogueTreeId as string | undefined;
  const choiceId = params?.choiceId as string | undefined;
  const nodeId = params?.nodeId as string | undefined;

  // Get NPC info
  const npc = await db
    .prepare(
      `SELECT nd.id, nd.name, nd.npc_type, nd.is_quest_giver, nd.faction_id
       FROM npc_definitions nd
       WHERE nd.id = ?`
    )
    .bind(targetNpcId)
    .first<{
      id: string;
      name: string;
      npc_type: string;
      is_quest_giver: number;
      faction_id: string | null;
    }>();

  if (!npc) {
    return {
      success: false,
      outcome: 'NPC_NOT_FOUND',
      details: { error: `NPC not found: ${targetNpcId}` },
    };
  }

  // Get character context for dialogue conditions
  const character = await db
    .prepare(
      `SELECT c.id, c.current_tier, c.humanity,
              cf.credits
       FROM characters c
       LEFT JOIN character_finances cf ON c.id = cf.character_id
       WHERE c.id = ?`
    )
    .bind(characterId)
    .first<{
      id: string;
      current_tier: number;
      humanity: number;
      credits: number;
    }>();

  if (!character) {
    return {
      success: false,
      outcome: 'CHARACTER_ERROR',
      details: { error: 'Could not load character data' },
    };
  }

  // If specific dialogue tree requested, fetch from DB
  let dialogueNode = null;
  let responseText = '';
  const effects: DialogueEffect[] = [];

  if (dialogueTreeId && nodeId) {
    // Get specific dialogue node
    dialogueNode = await db
      .prepare(
        `SELECT dn.*, dt.npc_id FROM dialogue_nodes dn
         JOIN dialogue_trees dt ON dn.tree_id = dt.id
         WHERE dn.id = ? AND dn.tree_id = ?`
      )
      .bind(nodeId, dialogueTreeId)
      .first<{
        id: string;
        text: string;
        node_type: string;
        on_display_effects: string | null;
        flag_changes: string | null;
        relationship_changes: string | null;
      }>();

    if (dialogueNode) {
      responseText = dialogueNode.text;

      // Parse effects from node
      if (dialogueNode.on_display_effects) {
        const nodeEffects = JSON.parse(dialogueNode.on_display_effects);
        effects.push(...nodeEffects);
      }
    }

    // If a choice was made, get response effects
    if (choiceId) {
      const response = await db
        .prepare(`SELECT * FROM dialogue_responses WHERE id = ?`)
        .bind(choiceId)
        .first<{
          id: string;
          relationship_change: number;
          reputation_changes: string | null;
          flag_changes: string | null;
          grants_items: string | null;
          removes_items: string | null;
          grants_xp: number;
          grants_credits: number;
          starts_combat: number;
          triggers_event_id: string | null;
        }>();

      if (response) {
        // Apply relationship change
        if (response.relationship_change !== 0) {
          effects.push({
            type: 'MODIFY_RELATION',
            target: npc.id,
            value: response.relationship_change,
          });
        }

        // Apply reputation changes
        if (response.reputation_changes) {
          const repChanges = JSON.parse(response.reputation_changes);
          for (const [factionId, amount] of Object.entries(repChanges)) {
            effects.push({
              type: 'MODIFY_REP',
              target: factionId,
              value: amount as number,
            });
          }
        }

        // Grant items
        if (response.grants_items) {
          const items = JSON.parse(response.grants_items);
          for (const item of items) {
            effects.push({
              type: 'GIVE_ITEM',
              target: item.itemId || item.id,
              value: item.quantity || 1,
            });
          }
        }

        // Remove items
        if (response.removes_items) {
          const items = JSON.parse(response.removes_items);
          for (const item of items) {
            effects.push({
              type: 'TAKE_ITEM',
              target: item.itemId || item.id,
              value: item.quantity || 1,
            });
          }
        }

        // Grant XP/Credits
        if (response.grants_xp > 0) {
          effects.push({ type: 'GIVE_XP', value: response.grants_xp });
        }
        if (response.grants_credits > 0) {
          effects.push({ type: 'GIVE_CREDITS', value: response.grants_credits });
        }
      }
    }
  } else {
    // Generic dialogue interaction without specific tree
    responseText = `${npc.name} acknowledges you with a nod.`;
  }

  // Apply effects
  const appliedEffects: Array<{ type: string; target?: string; result: string }> = [];

  for (const effect of effects) {
    switch (effect.type) {
      case 'MODIFY_REP':
        if (effect.target && typeof effect.value === 'number') {
          await db
            .prepare(
              `INSERT INTO character_faction_standing (id, character_id, faction_id, reputation)
               VALUES (?, ?, ?, ?)
               ON CONFLICT(character_id, faction_id) DO UPDATE SET reputation = reputation + ?`
            )
            .bind(nanoid(), characterId, effect.target, effect.value, effect.value)
            .run();
          appliedEffects.push({ type: 'REPUTATION', target: effect.target, result: `${effect.value > 0 ? '+' : ''}${effect.value}` });
        }
        break;

      case 'MODIFY_RELATION':
        // Update NPC relationship
        if (effect.target && typeof effect.value === 'number') {
          appliedEffects.push({ type: 'RELATIONSHIP', target: npc.name, result: `${effect.value > 0 ? '+' : ''}${effect.value}` });
        }
        break;

      case 'GIVE_ITEM':
        if (effect.target) {
          const qty = typeof effect.value === 'number' ? effect.value : 1;
          // Check if character already has this item
          const existing = await db
            .prepare(
              `SELECT id, quantity FROM character_inventory WHERE character_id = ? AND item_id = ?`
            )
            .bind(characterId, effect.target)
            .first<{ id: string; quantity: number }>();

          if (existing) {
            await db
              .prepare(`UPDATE character_inventory SET quantity = quantity + ? WHERE id = ?`)
              .bind(qty, existing.id)
              .run();
          } else {
            await db
              .prepare(
                `INSERT INTO character_inventory (id, character_id, item_id, quantity, created_at)
                 VALUES (?, ?, ?, ?, datetime('now'))`
              )
              .bind(nanoid(), characterId, effect.target, qty)
              .run();
          }
          appliedEffects.push({ type: 'ITEM_RECEIVED', target: effect.target, result: `+${qty}` });
        }
        break;

      case 'TAKE_ITEM':
        if (effect.target) {
          const qty = typeof effect.value === 'number' ? effect.value : 1;
          await db
            .prepare(
              `UPDATE character_inventory SET quantity = quantity - ?
               WHERE character_id = ? AND item_id = ? AND quantity >= ?`
            )
            .bind(qty, characterId, effect.target, qty)
            .run();
          appliedEffects.push({ type: 'ITEM_GIVEN', target: effect.target, result: `-${qty}` });
        }
        break;

      case 'GIVE_XP':
        if (typeof effect.value === 'number') {
          await db
            .prepare(`UPDATE characters SET current_xp = current_xp + ? WHERE id = ?`)
            .bind(effect.value, characterId)
            .run();
          appliedEffects.push({ type: 'XP', result: `+${effect.value}` });
        }
        break;

      case 'GIVE_CREDITS':
        if (typeof effect.value === 'number') {
          await db
            .prepare(`UPDATE character_finances SET credits = credits + ? WHERE character_id = ?`)
            .bind(effect.value, characterId)
            .run();
          appliedEffects.push({ type: 'CREDITS', result: `+${effect.value}` });
        }
        break;

      case 'START_QUEST':
        if (typeof effect.target === 'string') {
          const questResult = await startQuestFromTrigger(db, characterId, effect.target);
          if (questResult.success) {
            appliedEffects.push({ type: 'QUEST_STARTED', target: effect.target, result: 'accepted' });
          }
        }
        break;

      case 'ADVANCE_QUEST':
      case 'COMPLETE_QUEST':
        // Quest progress from dialogue
        if (effect.target) {
          const questUpdate = await updateQuestProgress(db, characterId, 'DIALOGUE', effect.target);
          if (questUpdate.objectivesCompleted.length > 0) {
            appliedEffects.push({ type: 'QUEST_PROGRESS', target: effect.target, result: 'objective completed' });
          }
        }
        break;
    }
  }

  // Check if this dialogue completes a mission checkpoint
  const dialogueCheckpoint = await db
    .prepare(
      `SELECT id FROM mission_checkpoints
       WHERE mission_instance_id = ? AND checkpoint_type = 'DIALOGUE'
       AND is_completed = 0
       AND (checkpoint_data LIKE ? OR checkpoint_data LIKE ?)`
    )
    .bind(instanceId, `%${targetNpcId}%`, `%${npc.name}%`)
    .first<{ id: string }>();

  let checkpointCompleted = false;
  if (dialogueCheckpoint) {
    await db
      .prepare("UPDATE mission_checkpoints SET is_completed = 1, completed_at = datetime('now') WHERE id = ?")
      .bind(dialogueCheckpoint.id)
      .run();
    checkpointCompleted = true;
  }

  return {
    success: true,
    outcome: checkpointCompleted ? 'DIALOGUE_CHECKPOINT_COMPLETE' : 'DIALOGUE_COMPLETE',
    details: {
      npc: {
        id: npc.id,
        name: npc.name,
        type: npc.npc_type,
        isQuestGiver: npc.is_quest_giver === 1,
      },
      dialogueTreeId: dialogueTreeId ?? null,
      nodeId: nodeId ?? null,
      choiceId: choiceId ?? null,
      response: responseText,
      effects: appliedEffects,
      checkpointCompleted,
    },
  };
}

// =============================================================================
// USE ITEM ACTION HANDLER
// =============================================================================

/**
 * Process a USE_ITEM mission action.
 * Applies item effects to character during mission.
 */
async function processUseItemAction(
  db: D1Database,
  instanceId: string,
  characterId: string,
  params?: Record<string, unknown>
): Promise<{ success: boolean; outcome: string; details: Record<string, unknown> }> {
  const itemId = params?.itemId as string | undefined;
  const targetId = params?.targetId as string | undefined;

  if (!itemId) {
    return {
      success: false,
      outcome: 'NO_ITEM',
      details: { error: 'Item ID required' },
    };
  }

  // Check character has the item
  const inventoryItem = await db
    .prepare(
      `SELECT ci.id, ci.quantity, ci.item_id,
              id.name, id.item_type, id.subtype, id.is_consumable,
              id.use_effects, id.stack_limit
       FROM character_inventory ci
       JOIN item_definitions id ON ci.item_id = id.id
       WHERE ci.character_id = ? AND (ci.item_id = ? OR id.code = ?)`
    )
    .bind(characterId, itemId, itemId)
    .first<{
      id: string;
      quantity: number;
      item_id: string;
      name: string;
      item_type: string;
      subtype: string | null;
      is_consumable: number;
      use_effects: string | null;
      stack_limit: number;
    }>();

  if (!inventoryItem) {
    return {
      success: false,
      outcome: 'ITEM_NOT_FOUND',
      details: { error: 'Item not in inventory' },
    };
  }

  if (inventoryItem.quantity < 1) {
    return {
      success: false,
      outcome: 'NO_QUANTITY',
      details: { error: 'No items remaining' },
    };
  }

  // Parse and apply effects
  const appliedEffects: Array<{ type: string; value: number | string }> = [];

  if (inventoryItem.use_effects) {
    const effects = JSON.parse(inventoryItem.use_effects) as Array<{
      type: string;
      attribute?: string;
      amount?: number;
      duration?: number;
    }>;

    for (const effect of effects) {
      switch (effect.type) {
        case 'HEAL':
          if (effect.amount) {
            await db
              .prepare(
                `UPDATE characters SET current_health = MIN(max_health, current_health + ?) WHERE id = ?`
              )
              .bind(effect.amount, characterId)
              .run();
            appliedEffects.push({ type: 'HEAL', value: effect.amount });
          }
          break;

        case 'RESTORE_ENERGY':
          if (effect.amount) {
            await db
              .prepare(
                `UPDATE characters SET current_energy = MIN(max_energy, current_energy + ?) WHERE id = ?`
              )
              .bind(effect.amount, characterId)
              .run();
            appliedEffects.push({ type: 'ENERGY', value: effect.amount });
          }
          break;

        case 'BUFF_ATTRIBUTE':
          if (effect.attribute && effect.amount && effect.duration) {
            // Store temporary buff in mission state
            const instance = await db
              .prepare('SELECT current_state FROM mission_instances WHERE id = ?')
              .bind(instanceId)
              .first<{ current_state: string | null }>();

            const state = instance?.current_state ? JSON.parse(instance.current_state) : {};
            state.activeBuffs = state.activeBuffs || [];
            state.activeBuffs.push({
              attribute: effect.attribute,
              amount: effect.amount,
              expiresAt: Date.now() + (effect.duration * 1000),
            });

            await db
              .prepare('UPDATE mission_instances SET current_state = ? WHERE id = ?')
              .bind(JSON.stringify(state), instanceId)
              .run();

            appliedEffects.push({ type: `BUFF_${effect.attribute}`, value: `+${effect.amount} for ${effect.duration}s` });
          }
          break;

        case 'REMOVE_CONDITION':
          // Remove a status condition
          appliedEffects.push({ type: 'CURE', value: effect.attribute || 'condition' });
          break;

        default:
          appliedEffects.push({ type: effect.type, value: effect.amount || 0 });
      }
    }
  }

  // Consume item if consumable
  if (inventoryItem.is_consumable === 1) {
    if (inventoryItem.quantity === 1) {
      // Remove from inventory
      await db
        .prepare('DELETE FROM character_inventory WHERE id = ?')
        .bind(inventoryItem.id)
        .run();
    } else {
      // Reduce quantity
      await db
        .prepare('UPDATE character_inventory SET quantity = quantity - 1 WHERE id = ?')
        .bind(inventoryItem.id)
        .run();
    }
  }

  // Check if using item on specific target completes a checkpoint
  if (targetId) {
    const useItemCheckpoint = await db
      .prepare(
        `SELECT id FROM mission_checkpoints
         WHERE mission_instance_id = ? AND checkpoint_type = 'USE_ITEM'
         AND is_completed = 0
         AND (checkpoint_data LIKE ? OR checkpoint_data LIKE ?)`
      )
      .bind(instanceId, `%${itemId}%`, `%${targetId}%`)
      .first<{ id: string }>();

    if (useItemCheckpoint) {
      await db
        .prepare("UPDATE mission_checkpoints SET is_completed = 1, completed_at = datetime('now') WHERE id = ?")
        .bind(useItemCheckpoint.id)
        .run();

      return {
        success: true,
        outcome: 'ITEM_USED_CHECKPOINT_COMPLETE',
        details: {
          item: {
            id: inventoryItem.item_id,
            name: inventoryItem.name,
            type: inventoryItem.item_type,
          },
          effects: appliedEffects,
          consumed: inventoryItem.is_consumable === 1,
          remainingQuantity: inventoryItem.is_consumable === 1 ? inventoryItem.quantity - 1 : inventoryItem.quantity,
          checkpointCompleted: true,
          targetId,
        },
      };
    }
  }

  return {
    success: true,
    outcome: 'ITEM_USED',
    details: {
      item: {
        id: inventoryItem.item_id,
        name: inventoryItem.name,
        type: inventoryItem.item_type,
      },
      effects: appliedEffects,
      consumed: inventoryItem.is_consumable === 1,
      remainingQuantity: inventoryItem.is_consumable === 1 ? inventoryItem.quantity - 1 : inventoryItem.quantity,
    },
  };
}

// =============================================================================
// STEALTH ACTION HANDLER
// =============================================================================

/**
 * Process a STEALTH mission action.
 * Handles sneaking, hiding, and avoiding detection.
 */
async function processStealthAction(
  db: D1Database,
  kv: KVNamespace,
  instanceId: string,
  characterId: string,
  params?: Record<string, unknown>
): Promise<{ success: boolean; outcome: string; details: Record<string, unknown> }> {
  const stealthType = (params?.type as string) ?? 'SNEAK';
  const targetArea = params?.targetArea as string | undefined;

  // Get character's stealth-related stats
  const character = await db
    .prepare(
      `SELECT c.id, c.current_location_id,
              COALESCE(cs_stealth.current_level, 0) as stealth_level,
              COALESCE(ca.effective_value, 10) as agi_value
       FROM characters c
       LEFT JOIN character_skills cs_stealth ON c.id = cs_stealth.character_id
         AND cs_stealth.skill_id = (SELECT id FROM skill_definitions WHERE code = 'STEALTH')
       LEFT JOIN character_attributes ca ON c.id = ca.character_id
         AND ca.attribute_id = (SELECT id FROM attribute_definitions WHERE code = 'AGI')
       WHERE c.id = ?`
    )
    .bind(characterId)
    .first<{
      id: string;
      current_location_id: string | null;
      stealth_level: number;
      agi_value: number;
    }>();

  if (!character) {
    return {
      success: false,
      outcome: 'CHARACTER_ERROR',
      details: { error: 'Could not load character data' },
    };
  }

  // Get district detection risk modifier
  const districtId = character.current_location_id || 'downtown';
  const activeEvents = await getActiveDistrictEvents(kv, districtId);
  const modifiers = getEffectiveModifiers(activeEvents);
  const detectionMod = modifiers.get('DETECTION_RISK') || 1.0;

  // Calculate base difficulty based on stealth type
  let baseDifficulty = 8;
  switch (stealthType) {
    case 'SNEAK':
      baseDifficulty = 8;
      break;
    case 'HIDE':
      baseDifficulty = 7;
      break;
    case 'DISTRACT':
      baseDifficulty = 10;
      break;
    case 'BYPASS':
      baseDifficulty = 12;
      break;
    default:
      baseDifficulty = 8;
  }

  // Apply detection risk modifier to difficulty
  const adjustedDifficulty = Math.round(baseDifficulty * detectionMod);

  // Roll stealth check: 2d6 + AGI mod + Stealth skill vs difficulty
  const agiMod = Math.floor((character.agi_value - 10) / 2);
  const roll1 = Math.floor(Math.random() * 6) + 1;
  const roll2 = Math.floor(Math.random() * 6) + 1;
  const rollTotal = roll1 + roll2;
  const totalBonus = agiMod + character.stealth_level;
  const total = rollTotal + totalBonus;

  const success = total >= adjustedDifficulty;
  const margin = total - adjustedDifficulty;

  // Critical success/failure
  const isCriticalSuccess = rollTotal === 12;
  const isCriticalFailure = rollTotal === 2;

  // Determine outcome
  let outcome = success ? 'STEALTH_SUCCESS' : 'STEALTH_FAILURE';
  let consequence = null;

  if (isCriticalSuccess) {
    outcome = 'STEALTH_CRITICAL_SUCCESS';
    consequence = 'You move like a shadow. No one suspects a thing.';
  } else if (isCriticalFailure) {
    outcome = 'STEALTH_CRITICAL_FAILURE';
    consequence = 'You stumble loudly, drawing unwanted attention!';
  } else if (!success) {
    // Failed stealth might trigger combat or alert
    if (margin <= -5) {
      consequence = 'You are spotted! Guards are alerted.';
    } else {
      consequence = 'Your attempt to remain hidden fails, but you manage to slip away.';
    }
  } else if (margin >= 5) {
    consequence = 'Flawless execution. You pass completely unnoticed.';
  }

  // Update mission state with stealth status
  const instance = await db
    .prepare('SELECT current_state FROM mission_instances WHERE id = ?')
    .bind(instanceId)
    .first<{ current_state: string | null }>();

  const state = instance?.current_state ? JSON.parse(instance.current_state) : {};
  state.stealthStatus = {
    lastAttempt: stealthType,
    success,
    alertLevel: isCriticalFailure ? 'HIGH' : (!success ? 'ELEVATED' : state.stealthStatus?.alertLevel || 'NONE'),
    timestamp: Date.now(),
  };

  await db
    .prepare('UPDATE mission_instances SET current_state = ? WHERE id = ?')
    .bind(JSON.stringify(state), instanceId)
    .run();

  // Check if stealth completes a checkpoint
  let checkpointCompleted = false;
  if (success) {
    const stealthCheckpoint = await db
      .prepare(
        `SELECT id FROM mission_checkpoints
         WHERE mission_instance_id = ? AND checkpoint_type = 'STEALTH'
         AND is_completed = 0`
      )
      .bind(instanceId)
      .first<{ id: string }>();

    if (stealthCheckpoint) {
      await db
        .prepare("UPDATE mission_checkpoints SET is_completed = 1, completed_at = datetime('now') WHERE id = ?")
        .bind(stealthCheckpoint.id)
        .run();
      checkpointCompleted = true;
    }
  }

  return {
    success,
    outcome,
    details: {
      stealthType,
      roll: [roll1, roll2],
      rollTotal,
      agilityModifier: agiMod,
      stealthSkill: character.stealth_level,
      totalBonus,
      total,
      difficulty: adjustedDifficulty,
      baseDifficulty,
      detectionModifier: detectionMod,
      margin,
      isCriticalSuccess,
      isCriticalFailure,
      consequence,
      alertLevel: state.stealthStatus.alertLevel,
      checkpointCompleted,
      targetArea,
    },
  };
}

// =============================================================================
// WAIT ACTION HANDLER
// =============================================================================

/**
 * Process a WAIT mission action.
 * Allows time to pass during missions, affecting buffs, events, and opportunities.
 */
async function processWaitAction(
  db: D1Database,
  instanceId: string,
  characterId: string,
  params?: Record<string, unknown>
): Promise<{ success: boolean; outcome: string; details: Record<string, unknown> }> {
  const duration = Math.min((params?.duration as number) ?? 5, 60); // Max 60 minutes
  const reason = params?.reason as string | undefined;

  // Get mission instance to check time remaining
  const instance = await db
    .prepare(
      `SELECT started_at, time_limit_minutes, current_state FROM mission_instances WHERE id = ?`
    )
    .bind(instanceId)
    .first<{
      started_at: string;
      time_limit_minutes: number;
      current_state: string | null;
    }>();

  if (!instance) {
    return {
      success: false,
      outcome: 'MISSION_NOT_FOUND',
      details: { error: 'Mission instance not found' },
    };
  }

  // Calculate remaining time
  const startTime = new Date(instance.started_at).getTime();
  const timeLimit = instance.time_limit_minutes * 60 * 1000;
  const elapsedMs = Date.now() - startTime;
  const remainingMs = timeLimit - elapsedMs;
  const remainingMinutes = Math.floor(remainingMs / 60000);

  if (remainingMinutes < duration) {
    return {
      success: false,
      outcome: 'INSUFFICIENT_TIME',
      details: {
        error: `Cannot wait ${duration} minutes. Only ${remainingMinutes} minutes remaining.`,
        remainingMinutes,
        requestedDuration: duration,
      },
    };
  }

  // Parse current state
  const state = instance.current_state ? JSON.parse(instance.current_state) : {};

  // Process waiting effects

  // 1. Expire temporary buffs
  const expiredBuffs: string[] = [];
  if (state.activeBuffs) {
    const futureTime = Date.now() + (duration * 60 * 1000);
    state.activeBuffs = state.activeBuffs.filter((buff: { attribute: string; expiresAt: number }) => {
      if (buff.expiresAt <= futureTime) {
        expiredBuffs.push(buff.attribute);
        return false;
      }
      return true;
    });
  }

  // 2. Reduce alert level if hiding
  if (state.stealthStatus?.alertLevel && state.stealthStatus.alertLevel !== 'NONE') {
    if (duration >= 10) {
      state.stealthStatus.alertLevel = 'NONE';
    } else if (duration >= 5 && state.stealthStatus.alertLevel === 'ELEVATED') {
      state.stealthStatus.alertLevel = 'LOW';
    }
  }

  // 3. Natural health regeneration (small amount)
  const healAmount = Math.floor(duration / 10); // 1 HP per 10 minutes
  if (healAmount > 0) {
    await db
      .prepare(
        `UPDATE characters SET current_health = MIN(max_health, current_health + ?) WHERE id = ?`
      )
      .bind(healAmount, characterId)
      .run();
  }

  // 4. Track total wait time
  state.totalWaitMinutes = (state.totalWaitMinutes || 0) + duration;
  state.lastWaitTime = Date.now();

  // Save updated state
  await db
    .prepare('UPDATE mission_instances SET current_state = ? WHERE id = ?')
    .bind(JSON.stringify(state), instanceId)
    .run();

  // Check if waiting at a location completes a checkpoint
  let checkpointCompleted = false;
  if (reason === 'STAKE_OUT' || reason === 'OBSERVE') {
    const waitCheckpoint = await db
      .prepare(
        `SELECT id FROM mission_checkpoints
         WHERE mission_instance_id = ? AND checkpoint_type = 'WAIT'
         AND is_completed = 0`
      )
      .bind(instanceId)
      .first<{ id: string }>();

    if (waitCheckpoint) {
      await db
        .prepare("UPDATE mission_checkpoints SET is_completed = 1, completed_at = datetime('now') WHERE id = ?")
        .bind(waitCheckpoint.id)
        .run();
      checkpointCompleted = true;
    }
  }

  // Determine outcome narrative
  let narrative = `You wait for ${duration} minutes.`;
  if (reason === 'REST') {
    narrative = `You take a moment to catch your breath.${healAmount > 0 ? ` Recovered ${healAmount} HP.` : ''}`;
  } else if (reason === 'STAKE_OUT') {
    narrative = `You observe the area for ${duration} minutes, noting patrol patterns and activity.`;
  } else if (reason === 'HIDDEN') {
    narrative = `You remain hidden, letting the heat die down.`;
  }

  return {
    success: true,
    outcome: checkpointCompleted ? 'WAIT_CHECKPOINT_COMPLETE' : 'WAIT_COMPLETE',
    details: {
      duration,
      reason: reason || 'GENERAL',
      narrative,
      effects: {
        expiredBuffs,
        healthRecovered: healAmount,
        alertLevelReduced: expiredBuffs.length > 0 || (state.stealthStatus?.alertLevel === 'NONE'),
      },
      missionTiming: {
        elapsedMinutes: Math.floor((elapsedMs + duration * 60000) / 60000),
        remainingMinutes: remainingMinutes - duration,
        totalWaitMinutes: state.totalWaitMinutes,
      },
      checkpointCompleted,
    },
  };
}

// =============================================================================
// COMPLICATION DEFINITIONS
// =============================================================================

/**
 * GET /missions/complications
 * List all complication definitions.
 */
missionRoutes.get('/complications', async (c) => {
  const db = c.env.DB;
  const complicationType = c.req.query('type');
  const isCombat = c.req.query('combat');

  let query = 'SELECT * FROM complication_definitions WHERE 1=1';
  const params: unknown[] = [];

  if (complicationType) {
    query += ' AND complication_type = ?';
    params.push(complicationType);
  }
  if (isCombat === 'true') {
    query += ' AND is_combat = 1';
  } else if (isCombat === 'false') {
    query += ' AND is_combat = 0';
  }

  query += ' ORDER BY severity DESC, name ASC';

  const result = await db.prepare(query).bind(...params).all();

  const complications = result.results.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    announcementText: row.announcement_text,
    complicationType: row.complication_type,
    severity: row.severity,
    isCombat: row.is_combat === 1,
    isTimed: row.is_timed === 1,
    triggerCondition: row.trigger_condition,
    triggerChanceBase: row.trigger_chance_base,
    triggerChanceModifiers: row.trigger_chance_modifiers ? JSON.parse(row.trigger_chance_modifiers as string) : null,
    minTier: row.min_tier,
    maxTier: row.max_tier,
    timeLimitSeconds: row.time_limit_seconds,
    canBePrevented: row.can_be_prevented === 1,
  }));

  return c.json({
    success: true,
    data: { complications, total: complications.length },
  });
});

/**
 * GET /missions/complications/:code
 * Get specific complication definition with full details.
 */
missionRoutes.get('/complications/:code', async (c) => {
  const db = c.env.DB;
  const code = c.req.param('code');

  const result = await db
    .prepare('SELECT * FROM complication_definitions WHERE code = ? OR id = ?')
    .bind(code, code)
    .first();

  if (!result) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Complication not found' }],
    }, 404);
  }

  return c.json({
    success: true,
    data: {
      complication: {
        id: result.id,
        code: result.code,
        name: result.name,
        description: result.description,
        announcementText: result.announcement_text,
        complicationType: result.complication_type,
        severity: result.severity,
        isCombat: result.is_combat === 1,
        isTimed: result.is_timed === 1,
        triggerCondition: result.trigger_condition,
        triggerChanceBase: result.trigger_chance_base,
        triggerChanceModifiers: result.trigger_chance_modifiers ? JSON.parse(result.trigger_chance_modifiers as string) : null,
        minTier: result.min_tier,
        maxTier: result.max_tier,
        effectsOnTrigger: result.effects_on_trigger ? JSON.parse(result.effects_on_trigger as string) : null,
        effectsOnResolve: result.effects_on_resolve ? JSON.parse(result.effects_on_resolve as string) : null,
        effectsOnFail: result.effects_on_fail ? JSON.parse(result.effects_on_fail as string) : null,
        timeLimitSeconds: result.time_limit_seconds,
        resolutionOptions: result.resolution_options ? JSON.parse(result.resolution_options as string) : null,
        canBePrevented: result.can_be_prevented === 1,
        preventionMethods: result.prevention_methods ? JSON.parse(result.prevention_methods as string) : null,
      },
    },
  });
});

// =============================================================================
// MISSION OBJECTIVES
// =============================================================================

/**
 * GET /missions/:missionId/objectives
 * Get all objectives for a mission definition.
 */
missionRoutes.get('/:missionId/objectives', async (c) => {
  const db = c.env.DB;
  const missionId = c.req.param('missionId');

  // Verify mission exists
  const mission = await db
    .prepare('SELECT id, title FROM mission_definitions WHERE id = ?')
    .bind(missionId)
    .first();

  if (!mission) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Mission not found' }],
    }, 404);
  }

  const result = await db
    .prepare(
      `SELECT mo.*, l.name as target_location_name, n.name as target_npc_name, i.name as target_item_name
       FROM mission_objectives mo
       LEFT JOIN locations l ON mo.target_location_id = l.id
       LEFT JOIN npc_definitions n ON mo.target_npc_id = n.id
       LEFT JOIN item_definitions i ON mo.target_item_id = i.id
       WHERE mo.mission_definition_id = ?
       ORDER BY mo.sequence_order ASC`
    )
    .bind(missionId)
    .all();

  const objectives = result.results.map((row) => ({
    id: row.id,
    missionDefinitionId: row.mission_definition_id,
    sequenceOrder: row.sequence_order,
    title: row.title,
    description: row.description,
    hintText: row.hint_text,
    completionText: row.completion_text,
    objectiveType: row.objective_type,
    isOptional: row.is_optional === 1,
    isHidden: row.is_hidden === 1,
    isBonus: row.is_bonus === 1,
    targetLocationId: row.target_location_id,
    targetLocationName: row.target_location_name,
    targetNpcId: row.target_npc_id,
    targetNpcName: row.target_npc_name,
    targetItemId: row.target_item_id,
    targetItemName: row.target_item_name,
    targetCoordinates: row.target_coordinates ? JSON.parse(row.target_coordinates as string) : null,
    targetQuantity: row.target_quantity,
    completionConditions: row.completion_conditions ? JSON.parse(row.completion_conditions as string) : null,
    failureConditions: row.failure_conditions ? JSON.parse(row.failure_conditions as string) : null,
    timeLimitSeconds: row.time_limit_seconds,
    completionXp: row.completion_xp,
  }));

  return c.json({
    success: true,
    data: {
      missionId,
      missionTitle: mission.title,
      objectives,
      total: objectives.length,
      requiredCount: objectives.filter((o) => !o.isOptional).length,
      optionalCount: objectives.filter((o) => o.isOptional).length,
    },
  });
});

/**
 * GET /missions/objectives/:objectiveId
 * Get specific objective with full details.
 */
missionRoutes.get('/objectives/:objectiveId', async (c) => {
  const db = c.env.DB;
  const objectiveId = c.req.param('objectiveId');

  const result = await db
    .prepare(
      `SELECT mo.*, md.title as mission_title, l.name as target_location_name,
              n.name as target_npc_name, i.name as target_item_name
       FROM mission_objectives mo
       JOIN mission_definitions md ON mo.mission_definition_id = md.id
       LEFT JOIN locations l ON mo.target_location_id = l.id
       LEFT JOIN npc_definitions n ON mo.target_npc_id = n.id
       LEFT JOIN item_definitions i ON mo.target_item_id = i.id
       WHERE mo.id = ?`
    )
    .bind(objectiveId)
    .first();

  if (!result) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Objective not found' }],
    }, 404);
  }

  return c.json({
    success: true,
    data: {
      objective: {
        id: result.id,
        missionDefinitionId: result.mission_definition_id,
        missionTitle: result.mission_title,
        sequenceOrder: result.sequence_order,
        title: result.title,
        description: result.description,
        hintText: result.hint_text,
        completionText: result.completion_text,
        objectiveType: result.objective_type,
        isOptional: result.is_optional === 1,
        isHidden: result.is_hidden === 1,
        isBonus: result.is_bonus === 1,
        targetLocationId: result.target_location_id,
        targetLocationName: result.target_location_name,
        targetNpcId: result.target_npc_id,
        targetNpcName: result.target_npc_name,
        targetItemId: result.target_item_id,
        targetItemName: result.target_item_name,
        targetCoordinates: result.target_coordinates ? JSON.parse(result.target_coordinates as string) : null,
        targetQuantity: result.target_quantity,
        completionConditions: result.completion_conditions ? JSON.parse(result.completion_conditions as string) : null,
        failureConditions: result.failure_conditions ? JSON.parse(result.failure_conditions as string) : null,
        timeLimitSeconds: result.time_limit_seconds,
        completionXp: result.completion_xp,
      },
    },
  });
});

// =============================================================================
// EXPORTED UTILITIES
// =============================================================================
// These utilities are exported for admin endpoints and testing

export {
  getActiveDistrictEvents,
  getEffectiveModifiers,
  _applyModifier as applyEventModifier,
  _generateRandomEvent as generateRandomEvent,
  _storeDistrictEvent as storeDistrictEvent,
};
