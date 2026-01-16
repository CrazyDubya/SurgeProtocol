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
} from '../../db';

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
 */
missionRoutes.get('/available', async (c) => {
  const characterId = c.get('characterId')!;

  // Get character's current tier
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

  // Get available missions for this tier range
  const missions = await getAvailableMissions(
    c.env.DB,
    character.current_tier,
    character.carrier_rating
  );

  // Get active mission to check if player can accept new ones
  const activeMission = await getActiveMission(c.env.DB, characterId);

  return c.json({
    success: true,
    data: {
      missions,
      count: missions.length,
      canAcceptNew: !activeMission,
      currentTier: character.current_tier,
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

  // Get character's tier to check if mission is accessible
  const character = await c.env.DB
    .prepare('SELECT current_tier FROM characters WHERE id = ?')
    .bind(characterId)
    .first<{ current_tier: number }>();

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

  return c.json({
    success: true,
    data: {
      mission,
      requirements: requirements.results,
      rewards: rewards.results,
      isAccessible,
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

  // Create mission instance
  const instanceId = await createMissionInstance(c.env.DB, {
    missionId,
    characterId,
    timeLimit: mission.time_limit_minutes ?? 60, // Default 60 minutes if not specified
  });

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
      message: 'Mission accepted. Good luck, courier.',
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
      `SELECT mi.*, md.base_credits, md.base_xp, md.tier_minimum
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

  const finalCredits = Math.floor(instance.base_credits * creditMultiplier * timeBonusMultiplier);
  const finalXp = Math.floor(instance.base_xp * xpMultiplier);

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

  return c.json({
    success: true,
    data: {
      outcome: completion.outcome,
      rewards: {
        credits: finalCredits,
        xp: finalXp,
        ratingChange,
        timeBonus: timeBonusMultiplier > 1,
      },
      character: updatedCharacter,
      message: completion.outcome === 'SUCCESS'
        ? 'Delivery confirmed. Payment transferred.'
        : completion.outcome === 'PARTIAL'
          ? 'Partial completion noted. Reduced payment processed.'
          : 'Mission failed. The Algorithm has taken note.',
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

  // Get character's skill level
  const skill = await db
    .prepare(
      `SELECT cs.current_level FROM character_skills cs
       JOIN skill_definitions sd ON cs.skill_id = sd.id
       WHERE cs.character_id = ? AND sd.code = ?`
    )
    .bind(characterId, skillCode)
    .first<{ current_level: number }>();

  const skillLevel = skill?.current_level ?? 0;

  // Simple 2d6 + skill vs difficulty
  const roll1 = Math.floor(Math.random() * 6) + 1;
  const roll2 = Math.floor(Math.random() * 6) + 1;
  const total = roll1 + roll2 + skillLevel;
  const success = total >= difficulty;

  return {
    success,
    outcome: success ? 'SKILL_SUCCESS' : 'SKILL_FAILURE',
    details: {
      skill: skillCode,
      roll: [roll1, roll2],
      skillBonus: skillLevel,
      total,
      difficulty,
      margin: total - difficulty,
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
