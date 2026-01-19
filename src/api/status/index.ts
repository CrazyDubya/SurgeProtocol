/**
 * Surge Protocol - Status Effects & Conditions System Routes
 *
 * Comprehensive API for status effects, addictions, humanity, and cyberpsychosis.
 *
 * CONDITION ENDPOINTS:
 * - GET /status/conditions - List condition definitions
 * - GET /status/conditions/:id - Get condition details
 * - GET /status/character/conditions - Get character's active conditions
 * - POST /status/character/conditions/apply - Apply a condition
 * - POST /status/character/conditions/:id/remove - Remove a condition
 * - POST /status/character/conditions/:id/tick - Process condition tick
 *
 * ADDICTION ENDPOINTS:
 * - GET /status/addictions - List addiction types
 * - GET /status/addictions/:id - Get addiction type details
 * - GET /status/character/addictions - Get character's addictions
 * - POST /status/character/addictions/:id/use - Record substance use
 * - POST /status/character/addictions/:id/resist - Resist a craving
 * - POST /status/character/addictions/:id/treatment - Start/progress treatment
 *
 * HUMANITY ENDPOINTS:
 * - GET /status/humanity/thresholds - Get humanity threshold definitions
 * - GET /status/character/humanity - Get character's humanity state
 * - GET /status/character/humanity/history - Get humanity event history
 * - POST /status/character/humanity/adjust - Adjust humanity (internal)
 * - POST /status/character/humanity/therapy - Apply therapy session
 *
 * CYBERPSYCHOSIS ENDPOINTS:
 * - GET /status/character/cyberpsychosis - Get cyberpsychosis state
 * - GET /status/character/cyberpsychosis/episodes - Get episode history
 * - POST /status/character/cyberpsychosis/trigger - Trigger episode (internal)
 * - POST /status/character/cyberpsychosis/resolve - Resolve current episode
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  authMiddleware,
  requireCharacterMiddleware,
  type AuthVariables,
} from '../../middleware/auth';

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

interface ConditionDefRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon_asset: string | null;
  condition_type: string | null;
  severity: number;
  is_positive: number;
  is_visible: number;
  is_dispellable: number;
  duration_type: string | null;
  default_duration_seconds: number;
  can_stack_duration: number;
  stacks: number;
  max_stacks: number;
  stack_behavior: string | null;
  stat_modifiers: string | null;
  attribute_modifiers: string | null;
  damage_over_time: string | null;
  healing_over_time: string | null;
  movement_modifier: number;
  action_restrictions: string | null;
  special_effects: string | null;
}

interface CharConditionRow {
  id: string;
  character_id: string;
  condition_id: string;
  applied_at: string;
  current_stacks: number;
  duration_remaining_seconds: number | null;
  is_paused: number;
  source_type: string | null;
  source_id: string | null;
  source_name: string | null;
  times_ticked: number;
  total_damage_dealt: number;
  total_healing_done: number;
  times_refreshed: number;
}

interface AddictionTypeRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  substance_id: string | null;
  stages: string | null;
  tolerance_rate: number;
  dependence_rate: number;
  decay_rate_per_day: number;
  withdrawal_onset_hours: number;
  withdrawal_peak_hours: number;
  withdrawal_duration_hours: number;
  withdrawal_effects: string | null;
  withdrawal_lethality: number;
  treatment_methods: string | null;
  treatment_cost: number;
  treatment_duration_days: number;
  relapse_risk: number;
  craving_triggers: string | null;
  craving_strength_base: number;
}

interface CharAddictionRow {
  id: string;
  character_id: string;
  addiction_type_id: string;
  started_at: string;
  current_stage: number;
  tolerance_level: number;
  dependence_level: number;
  last_use: string | null;
  times_used_total: number;
  in_withdrawal: number;
  withdrawal_stage: number;
  withdrawal_started: string | null;
  in_treatment: number;
  treatment_progress: number;
  treatment_start: string | null;
  treatment_method: string | null;
  recovery_attempts: number;
  relapses: number;
  clean_streaks: string | null;
  longest_clean_streak_hours: number;
  current_craving_strength: number;
  last_craving: string | null;
  cravings_resisted: number;
  cravings_succumbed: number;
}

interface HumanityThresholdRow {
  id: string;
  threshold_value: number;
  threshold_name: string;
  description: string | null;
  condition_id: string | null;
  behavioral_changes: string | null;
  dialogue_changes: string | null;
  ability_unlocks: string | null;
  ability_locks: string | null;
  can_recover: number;
  recovery_methods: string | null;
  permanent_effects: string | null;
}

interface HumanityEventRow {
  id: string;
  character_id: string;
  occurred_at: string;
  humanity_before: number | null;
  humanity_after: number | null;
  change_amount: number | null;
  change_source: string | null;
  source_id: string | null;
  crossed_threshold: number | null;
  triggered_condition_id: string | null;
  episode_severity: number | null;
  therapy_applied: number;
  anchor_used: number;
}

interface CyberpsychosisRow {
  id: string;
  character_id: string;
  occurred_at: string;
  trigger_type: string | null;
  trigger_source_id: string | null;
  humanity_at_trigger: number | null;
  severity: number;
  duration_minutes: number;
  episode_type: string | null;
  actions_during: string | null;
  npcs_harmed: string | null;
  property_destroyed: string | null;
  memories_lost: string | null;
  resolution_method: string | null;
  resolved_by_npc_id: string | null;
  humanity_after: number | null;
  permanent_effects: string | null;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const applyConditionSchema = z.object({
  conditionId: z.string(),
  duration: z.number().optional(),
  stacks: z.number().int().min(1).default(1),
  sourceType: z.string().optional(),
  sourceId: z.string().optional(),
  sourceName: z.string().optional(),
});

const adjustHumanitySchema = z.object({
  amount: z.number().int(),
  source: z.string(),
  sourceId: z.string().optional(),
});

const therapySchema = z.object({
  therapyType: z.enum(['session', 'anchor', 'medication', 'meditation']),
  npcId: z.string().optional(),
  cost: z.number().optional(),
});

const treatmentSchema = z.object({
  action: z.enum(['start', 'progress', 'complete', 'abandon']),
  method: z.string().optional(),
});

const resolveEpisodeSchema = z.object({
  method: z.string(),
  resolvedByNpcId: z.string().optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function parseJsonField<T>(value: string | null, defaultValue: T): T {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}

function formatConditionDef(row: ConditionDefRow) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    icon: row.icon_asset,
    type: row.condition_type,
    severity: row.severity,
    isPositive: row.is_positive === 1,
    isVisible: row.is_visible === 1,
    isDispellable: row.is_dispellable === 1,
    duration: {
      type: row.duration_type,
      default: row.default_duration_seconds,
      canStackDuration: row.can_stack_duration === 1,
    },
    stacking: {
      canStack: row.stacks === 1,
      maxStacks: row.max_stacks,
      behavior: row.stack_behavior,
    },
    effects: {
      statModifiers: parseJsonField<Record<string, number>>(row.stat_modifiers, {}),
      attributeModifiers: parseJsonField<Record<string, number>>(row.attribute_modifiers, {}),
      damageOverTime: parseJsonField<{ damage: number; interval: number } | null>(row.damage_over_time, null),
      healingOverTime: parseJsonField<{ healing: number; interval: number } | null>(row.healing_over_time, null),
      movementModifier: row.movement_modifier,
      actionRestrictions: parseJsonField<string[]>(row.action_restrictions, []),
      special: parseJsonField<Record<string, unknown>>(row.special_effects, {}),
    },
  };
}

function formatCharCondition(row: CharConditionRow, condDef?: ConditionDefRow) {
  return {
    id: row.id,
    conditionId: row.condition_id,
    condition: condDef ? {
      code: condDef.code,
      name: condDef.name,
      type: condDef.condition_type,
      isPositive: condDef.is_positive === 1,
      icon: condDef.icon_asset,
    } : null,
    appliedAt: row.applied_at,
    stacks: row.current_stacks,
    durationRemaining: row.duration_remaining_seconds,
    isPaused: row.is_paused === 1,
    source: {
      type: row.source_type,
      id: row.source_id,
      name: row.source_name,
    },
    stats: {
      timesTicked: row.times_ticked,
      totalDamage: row.total_damage_dealt,
      totalHealing: row.total_healing_done,
      timesRefreshed: row.times_refreshed,
    },
  };
}

function formatAddictionType(row: AddictionTypeRow) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    substanceId: row.substance_id,
    stages: parseJsonField<Array<{ level: number; name: string; effects: string[] }>>(row.stages, []),
    progression: {
      toleranceRate: row.tolerance_rate,
      dependenceRate: row.dependence_rate,
      decayRatePerDay: row.decay_rate_per_day,
    },
    withdrawal: {
      onsetHours: row.withdrawal_onset_hours,
      peakHours: row.withdrawal_peak_hours,
      durationHours: row.withdrawal_duration_hours,
      effects: parseJsonField<string[]>(row.withdrawal_effects, []),
      lethality: row.withdrawal_lethality,
    },
    treatment: {
      methods: parseJsonField<string[]>(row.treatment_methods, []),
      cost: row.treatment_cost,
      durationDays: row.treatment_duration_days,
      relapseRisk: row.relapse_risk,
    },
    cravings: {
      triggers: parseJsonField<string[]>(row.craving_triggers, []),
      baseStrength: row.craving_strength_base,
    },
  };
}

function formatCharAddiction(row: CharAddictionRow, typeDef?: AddictionTypeRow) {
  return {
    id: row.id,
    addictionTypeId: row.addiction_type_id,
    addictionType: typeDef ? {
      code: typeDef.code,
      name: typeDef.name,
    } : null,
    startedAt: row.started_at,
    stage: row.current_stage,
    tolerance: row.tolerance_level,
    dependence: row.dependence_level,
    lastUse: row.last_use,
    timesUsed: row.times_used_total,
    withdrawal: {
      active: row.in_withdrawal === 1,
      stage: row.withdrawal_stage,
      started: row.withdrawal_started,
    },
    treatment: {
      active: row.in_treatment === 1,
      progress: row.treatment_progress,
      started: row.treatment_start,
      method: row.treatment_method,
    },
    recovery: {
      attempts: row.recovery_attempts,
      relapses: row.relapses,
      longestCleanStreak: row.longest_clean_streak_hours,
    },
    cravings: {
      currentStrength: row.current_craving_strength,
      lastCraving: row.last_craving,
      resisted: row.cravings_resisted,
      succumbed: row.cravings_succumbed,
    },
  };
}

function formatHumanityThreshold(row: HumanityThresholdRow) {
  return {
    id: row.id,
    threshold: row.threshold_value,
    name: row.threshold_name,
    description: row.description,
    conditionId: row.condition_id,
    effects: {
      behavioral: row.behavioral_changes,
      dialogueChanges: parseJsonField<Record<string, string>>(row.dialogue_changes, {}),
      abilityUnlocks: parseJsonField<string[]>(row.ability_unlocks, []),
      abilityLocks: parseJsonField<string[]>(row.ability_locks, []),
    },
    recovery: {
      possible: row.can_recover === 1,
      methods: parseJsonField<string[]>(row.recovery_methods, []),
      permanentEffects: parseJsonField<string[]>(row.permanent_effects, []),
    },
  };
}

// =============================================================================
// ROUTES
// =============================================================================

export const statusRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// Apply auth middleware to all routes
statusRoutes.use('*', authMiddleware());

// -----------------------------------------------------------------------------
// CONDITION DEFINITIONS
// -----------------------------------------------------------------------------

/**
 * GET /status/conditions
 * List all condition definitions.
 */
statusRoutes.get('/conditions', async (c) => {
  const type = c.req.query('type');
  const positive = c.req.query('positive');

  let query = 'SELECT * FROM condition_definitions WHERE 1=1';
  const params: (string | number)[] = [];

  if (type) {
    query += ' AND condition_type = ?';
    params.push(type);
  }

  if (positive !== undefined) {
    query += ' AND is_positive = ?';
    params.push(positive === 'true' ? 1 : 0);
  }

  query += ' ORDER BY condition_type, severity DESC, name';

  const result = await c.env.DB.prepare(query)
    .bind(...params)
    .all<ConditionDefRow>();

  // Group by type
  const byType: Record<string, ReturnType<typeof formatConditionDef>[]> = {};
  for (const row of result.results) {
    const formatted = formatConditionDef(row);
    const t = formatted.type || 'OTHER';
    if (!byType[t]) byType[t] = [];
    byType[t]!.push(formatted);
  }

  return c.json({
    success: true,
    data: {
      conditions: result.results.map(formatConditionDef),
      byType,
      count: result.results.length,
    },
  });
});

/**
 * GET /status/conditions/:id
 * Get detailed condition definition.
 */
statusRoutes.get('/conditions/:id', async (c) => {
  const conditionId = c.req.param('id');

  const condition = await c.env.DB
    .prepare('SELECT * FROM condition_definitions WHERE id = ? OR code = ?')
    .bind(conditionId, conditionId)
    .first<ConditionDefRow>();

  if (!condition) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Condition not found' }],
    }, 404);
  }

  return c.json({
    success: true,
    data: {
      condition: formatConditionDef(condition),
    },
  });
});

// -----------------------------------------------------------------------------
// CHARACTER CONDITIONS
// -----------------------------------------------------------------------------

/**
 * GET /status/character/conditions
 * Get character's active conditions.
 */
statusRoutes.get('/character/conditions', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;

  const conditions = await c.env.DB
    .prepare(
      `SELECT cc.*, cd.code, cd.name, cd.condition_type, cd.is_positive, cd.icon_asset,
              cd.severity, cd.stat_modifiers, cd.attribute_modifiers
       FROM character_conditions cc
       JOIN condition_definitions cd ON cc.condition_id = cd.id
       WHERE cc.character_id = ?
       ORDER BY cd.is_positive ASC, cd.severity DESC`
    )
    .bind(characterId)
    .all<CharConditionRow & {
      code: string;
      name: string;
      condition_type: string | null;
      is_positive: number;
      icon_asset: string | null;
      severity: number;
      stat_modifiers: string | null;
      attribute_modifiers: string | null;
    }>();

  const formatted = conditions.results.map(row => ({
    ...formatCharCondition(row),
    condition: {
      code: row.code,
      name: row.name,
      type: row.condition_type,
      isPositive: row.is_positive === 1,
      icon: row.icon_asset,
      severity: row.severity,
    },
    effects: {
      stats: parseJsonField<Record<string, number>>(row.stat_modifiers, {}),
      attributes: parseJsonField<Record<string, number>>(row.attribute_modifiers, {}),
    },
  }));

  const buffs = formatted.filter(c => c.condition.isPositive);
  const debuffs = formatted.filter(c => !c.condition.isPositive);

  // Calculate total modifiers
  const totalModifiers: Record<string, number> = {};
  for (const cond of formatted) {
    for (const [stat, mod] of Object.entries(cond.effects.stats)) {
      totalModifiers[stat] = (totalModifiers[stat] || 0) + (mod as number) * cond.stacks;
    }
    for (const [attr, mod] of Object.entries(cond.effects.attributes)) {
      totalModifiers[attr] = (totalModifiers[attr] || 0) + (mod as number) * cond.stacks;
    }
  }

  return c.json({
    success: true,
    data: {
      conditions: formatted,
      buffs,
      debuffs,
      totalModifiers,
      activeCount: formatted.length,
    },
  });
});

/**
 * POST /status/character/conditions/apply
 * Apply a condition to the character.
 */
statusRoutes.post('/character/conditions/apply', requireCharacterMiddleware(), zValidator('json', applyConditionSchema), async (c) => {
  const characterId = c.get('characterId')!;
  const { conditionId, duration, stacks, sourceType, sourceId, sourceName } = c.req.valid('json');

  // Get condition definition
  const condDef = await c.env.DB
    .prepare('SELECT * FROM condition_definitions WHERE id = ? OR code = ?')
    .bind(conditionId, conditionId)
    .first<ConditionDefRow>();

  if (!condDef) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Condition not found' }],
    }, 404);
  }

  // Check for existing condition
  const existing = await c.env.DB
    .prepare(
      'SELECT id, current_stacks, duration_remaining_seconds FROM character_conditions WHERE character_id = ? AND condition_id = ?'
    )
    .bind(characterId, condDef.id)
    .first<{ id: string; current_stacks: number; duration_remaining_seconds: number | null }>();

  const effectiveDuration = duration ?? condDef.default_duration_seconds;

  if (existing) {
    // Update existing condition
    let newStacks = existing.current_stacks;
    let newDuration = existing.duration_remaining_seconds;

    if (condDef.stacks === 1 && existing.current_stacks < condDef.max_stacks) {
      newStacks = Math.min(condDef.max_stacks, existing.current_stacks + stacks);
    }

    if (condDef.can_stack_duration === 1) {
      newDuration = (existing.duration_remaining_seconds || 0) + effectiveDuration;
    } else {
      newDuration = Math.max(existing.duration_remaining_seconds || 0, effectiveDuration);
    }

    await c.env.DB
      .prepare(
        `UPDATE character_conditions
         SET current_stacks = ?, duration_remaining_seconds = ?, times_refreshed = times_refreshed + 1
         WHERE id = ?`
      )
      .bind(newStacks, newDuration, existing.id)
      .run();

    return c.json({
      success: true,
      data: {
        action: 'refreshed',
        conditionId: existing.id,
        condition: condDef.name,
        stacks: newStacks,
        duration: newDuration,
        message: `${condDef.name} refreshed (${newStacks} stacks)`,
      },
    });
  }

  // Apply new condition
  const { nanoid } = await import('nanoid');
  const newCondId = nanoid();

  await c.env.DB
    .prepare(
      `INSERT INTO character_conditions
       (id, character_id, condition_id, current_stacks, duration_remaining_seconds,
        source_type, source_id, source_name, applied_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    .bind(newCondId, characterId, condDef.id, stacks, effectiveDuration, sourceType || null, sourceId || null, sourceName || null)
    .run();

  return c.json({
    success: true,
    data: {
      action: 'applied',
      conditionId: newCondId,
      condition: condDef.name,
      type: condDef.condition_type,
      isPositive: condDef.is_positive === 1,
      stacks,
      duration: effectiveDuration,
      message: `${condDef.name} applied`,
    },
  });
});

/**
 * POST /status/character/conditions/:id/remove
 * Remove a condition from the character.
 */
statusRoutes.post('/character/conditions/:id/remove', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;
  const conditionInstanceId = c.req.param('id');

  const condition = await c.env.DB
    .prepare(
      `SELECT cc.id, cd.name, cd.is_dispellable
       FROM character_conditions cc
       JOIN condition_definitions cd ON cc.condition_id = cd.id
       WHERE cc.id = ? AND cc.character_id = ?`
    )
    .bind(conditionInstanceId, characterId)
    .first<{ id: string; name: string; is_dispellable: number }>();

  if (!condition) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Condition not found on character' }],
    }, 404);
  }

  if (!condition.is_dispellable) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_DISPELLABLE', message: 'This condition cannot be removed' }],
    }, 400);
  }

  await c.env.DB
    .prepare('DELETE FROM character_conditions WHERE id = ?')
    .bind(conditionInstanceId)
    .run();

  return c.json({
    success: true,
    data: {
      removed: condition.name,
      message: `${condition.name} removed`,
    },
  });
});

/**
 * POST /status/character/conditions/:id/tick
 * Process a condition tick (for DoT/HoT effects).
 */
statusRoutes.post('/character/conditions/:id/tick', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;
  const conditionInstanceId = c.req.param('id');

  const condition = await c.env.DB
    .prepare(
      `SELECT cc.*, cd.name, cd.damage_over_time, cd.healing_over_time, cd.default_duration_seconds
       FROM character_conditions cc
       JOIN condition_definitions cd ON cc.condition_id = cd.id
       WHERE cc.id = ? AND cc.character_id = ?`
    )
    .bind(conditionInstanceId, characterId)
    .first<CharConditionRow & {
      name: string;
      damage_over_time: string | null;
      healing_over_time: string | null;
      default_duration_seconds: number;
    }>();

  if (!condition) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Condition not found' }],
    }, 404);
  }

  const dot = parseJsonField<{ damage: number; interval: number } | null>(condition.damage_over_time, null);
  const hot = parseJsonField<{ healing: number; interval: number } | null>(condition.healing_over_time, null);

  let damageDealt = 0;
  let healingDone = 0;

  // Apply damage
  if (dot) {
    damageDealt = dot.damage * condition.current_stacks;
    await c.env.DB
      .prepare(
        `UPDATE characters SET current_health = MAX(0, current_health - ?) WHERE id = ?`
      )
      .bind(damageDealt, characterId)
      .run();
  }

  // Apply healing
  if (hot) {
    healingDone = hot.healing * condition.current_stacks;
    await c.env.DB
      .prepare(
        `UPDATE characters SET current_health = MIN(max_health, current_health + ?) WHERE id = ?`
      )
      .bind(healingDone, characterId)
      .run();
  }

  // Update condition tracking
  const tickInterval = dot?.interval || hot?.interval || 1;
  const newDuration = (condition.duration_remaining_seconds || 0) - tickInterval;

  if (newDuration <= 0) {
    // Condition expired
    await c.env.DB
      .prepare('DELETE FROM character_conditions WHERE id = ?')
      .bind(conditionInstanceId)
      .run();

    return c.json({
      success: true,
      data: {
        condition: condition.name,
        tick: condition.times_ticked + 1,
        damageDealt,
        healingDone,
        expired: true,
        message: `${condition.name} expired`,
      },
    });
  }

  await c.env.DB
    .prepare(
      `UPDATE character_conditions
       SET times_ticked = times_ticked + 1,
           total_damage_dealt = total_damage_dealt + ?,
           total_healing_done = total_healing_done + ?,
           duration_remaining_seconds = ?
       WHERE id = ?`
    )
    .bind(damageDealt, healingDone, newDuration, conditionInstanceId)
    .run();

  return c.json({
    success: true,
    data: {
      condition: condition.name,
      tick: condition.times_ticked + 1,
      damageDealt,
      healingDone,
      durationRemaining: newDuration,
      expired: false,
    },
  });
});

// -----------------------------------------------------------------------------
// ADDICTION TYPES
// -----------------------------------------------------------------------------

/**
 * GET /status/addictions
 * List addiction type definitions.
 */
statusRoutes.get('/addictions', async (c) => {
  const result = await c.env.DB
    .prepare('SELECT * FROM addiction_types ORDER BY name')
    .all<AddictionTypeRow>();

  return c.json({
    success: true,
    data: {
      addictionTypes: result.results.map(formatAddictionType),
      count: result.results.length,
    },
  });
});

/**
 * GET /status/addictions/:id
 * Get addiction type details.
 */
statusRoutes.get('/addictions/:id', async (c) => {
  const addictionId = c.req.param('id');

  const addiction = await c.env.DB
    .prepare('SELECT * FROM addiction_types WHERE id = ? OR code = ?')
    .bind(addictionId, addictionId)
    .first<AddictionTypeRow>();

  if (!addiction) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Addiction type not found' }],
    }, 404);
  }

  // Get related substance if any
  let substance = null;
  if (addiction.substance_id) {
    substance = await c.env.DB
      .prepare('SELECT id, code, name, description FROM item_definitions WHERE id = ?')
      .bind(addiction.substance_id)
      .first<{ id: string; code: string; name: string; description: string | null }>();
  }

  return c.json({
    success: true,
    data: {
      addictionType: formatAddictionType(addiction),
      substance,
    },
  });
});

// -----------------------------------------------------------------------------
// CHARACTER ADDICTIONS
// -----------------------------------------------------------------------------

/**
 * GET /status/character/addictions
 * Get character's addictions.
 */
statusRoutes.get('/character/addictions', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;

  const addictions = await c.env.DB
    .prepare(
      `SELECT ca.*, at.code, at.name as addiction_name
       FROM character_addictions ca
       JOIN addiction_types at ON ca.addiction_type_id = at.id
       WHERE ca.character_id = ?
       ORDER BY ca.current_stage DESC, ca.dependence_level DESC`
    )
    .bind(characterId)
    .all<CharAddictionRow & { code: string; addiction_name: string }>();

  const formatted = addictions.results.map(row => ({
    ...formatCharAddiction(row),
    addictionType: {
      code: row.code,
      name: row.addiction_name,
    },
  }));

  const active = formatted.filter(a => a.stage > 0);
  const inWithdrawal = formatted.filter(a => a.withdrawal.active);
  const inTreatment = formatted.filter(a => a.treatment.active);

  return c.json({
    success: true,
    data: {
      addictions: formatted,
      summary: {
        total: formatted.length,
        active: active.length,
        inWithdrawal: inWithdrawal.length,
        inTreatment: inTreatment.length,
      },
    },
  });
});

/**
 * POST /status/character/addictions/:id/use
 * Record substance use (increases addiction).
 */
statusRoutes.post('/character/addictions/:id/use', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;
  const addictionTypeId = c.req.param('id');

  // Get addiction type
  const addictionType = await c.env.DB
    .prepare('SELECT * FROM addiction_types WHERE id = ? OR code = ?')
    .bind(addictionTypeId, addictionTypeId)
    .first<AddictionTypeRow>();

  if (!addictionType) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Addiction type not found' }],
    }, 404);
  }

  // Get or create character addiction
  let addiction = await c.env.DB
    .prepare('SELECT * FROM character_addictions WHERE character_id = ? AND addiction_type_id = ?')
    .bind(characterId, addictionType.id)
    .first<CharAddictionRow>();

  const now = new Date().toISOString();

  if (!addiction) {
    // Create new addiction record
    const { nanoid } = await import('nanoid');
    const newId = nanoid();

    await c.env.DB
      .prepare(
        `INSERT INTO character_addictions
         (id, character_id, addiction_type_id, current_stage, tolerance_level, dependence_level,
          last_use, times_used_total, started_at)
         VALUES (?, ?, ?, 1, ?, ?, ?, 1, ?)`
      )
      .bind(newId, characterId, addictionType.id, addictionType.tolerance_rate, addictionType.dependence_rate, now, now)
      .run();

    return c.json({
      success: true,
      data: {
        addictionId: newId,
        addiction: addictionType.name,
        stage: 1,
        firstUse: true,
        message: `Started developing ${addictionType.name} addiction`,
      },
    });
  }

  // Update existing addiction
  const newTolerance = Math.min(1, addiction.tolerance_level + addictionType.tolerance_rate);
  const newDependence = Math.min(1, addiction.dependence_level + addictionType.dependence_rate);
  const newStage = Math.min(5, Math.floor(newDependence * 5) + 1);
  const stageIncreased = newStage > addiction.current_stage;

  // End withdrawal if active
  const wasInWithdrawal = addiction.in_withdrawal === 1;

  await c.env.DB
    .prepare(
      `UPDATE character_addictions
       SET tolerance_level = ?, dependence_level = ?, current_stage = ?,
           last_use = ?, times_used_total = times_used_total + 1,
           in_withdrawal = 0, withdrawal_stage = 0, withdrawal_started = NULL,
           current_craving_strength = 0, cravings_succumbed = cravings_succumbed + 1
       WHERE id = ?`
    )
    .bind(newTolerance, newDependence, newStage, now, addiction.id)
    .run();

  return c.json({
    success: true,
    data: {
      addiction: addictionType.name,
      stage: newStage,
      stageIncreased,
      tolerance: Math.round(newTolerance * 100),
      dependence: Math.round(newDependence * 100),
      withdrawalEnded: wasInWithdrawal,
      message: stageIncreased
        ? `${addictionType.name} addiction worsened to stage ${newStage}`
        : `Used ${addictionType.name}`,
    },
  });
});

/**
 * POST /status/character/addictions/:id/resist
 * Resist a craving.
 */
statusRoutes.post('/character/addictions/:id/resist', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;
  const addictionId = c.req.param('id');

  const addiction = await c.env.DB
    .prepare(
      `SELECT ca.*, at.name as addiction_name, at.decay_rate_per_day
       FROM character_addictions ca
       JOIN addiction_types at ON ca.addiction_type_id = at.id
       WHERE ca.id = ? AND ca.character_id = ?`
    )
    .bind(addictionId, characterId)
    .first<CharAddictionRow & { addiction_name: string; decay_rate_per_day: number }>();

  if (!addiction) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Addiction not found' }],
    }, 404);
  }

  // Reduce craving and slightly reduce dependence
  const newCraving = Math.max(0, addiction.current_craving_strength - 10);
  const newDependence = Math.max(0, addiction.dependence_level - (addiction.decay_rate_per_day / 24));

  await c.env.DB
    .prepare(
      `UPDATE character_addictions
       SET current_craving_strength = ?, dependence_level = ?,
           cravings_resisted = cravings_resisted + 1, last_craving = datetime('now')
       WHERE id = ?`
    )
    .bind(newCraving, newDependence, addictionId)
    .run();

  return c.json({
    success: true,
    data: {
      addiction: addiction.addiction_name,
      cravingReduced: true,
      newCravingStrength: newCraving,
      dependenceReduced: Math.round((addiction.dependence_level - newDependence) * 100),
      message: `Resisted ${addiction.addiction_name} craving`,
    },
  });
});

/**
 * POST /status/character/addictions/:id/treatment
 * Manage addiction treatment.
 */
statusRoutes.post('/character/addictions/:id/treatment', requireCharacterMiddleware(), zValidator('json', treatmentSchema), async (c) => {
  const characterId = c.get('characterId')!;
  const addictionId = c.req.param('id');
  const { action, method } = c.req.valid('json');

  const addiction = await c.env.DB
    .prepare(
      `SELECT ca.*, at.name as addiction_name, at.treatment_duration_days
       FROM character_addictions ca
       JOIN addiction_types at ON ca.addiction_type_id = at.id
       WHERE ca.id = ? AND ca.character_id = ?`
    )
    .bind(addictionId, characterId)
    .first<CharAddictionRow & { addiction_name: string; treatment_duration_days: number }>();

  if (!addiction) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Addiction not found' }],
    }, 404);
  }

  switch (action) {
    case 'start':
      if (addiction.in_treatment) {
        return c.json({
          success: false,
          errors: [{ code: 'ALREADY_IN_TREATMENT', message: 'Already in treatment' }],
        }, 400);
      }

      await c.env.DB
        .prepare(
          `UPDATE character_addictions
           SET in_treatment = 1, treatment_progress = 0,
               treatment_start = datetime('now'), treatment_method = ?,
               recovery_attempts = recovery_attempts + 1
           WHERE id = ?`
        )
        .bind(method || 'standard', addictionId)
        .run();

      return c.json({
        success: true,
        data: {
          addiction: addiction.addiction_name,
          action: 'started',
          method: method || 'standard',
          message: `Started treatment for ${addiction.addiction_name}`,
        },
      });

    case 'progress':
      if (!addiction.in_treatment) {
        return c.json({
          success: false,
          errors: [{ code: 'NOT_IN_TREATMENT', message: 'Not currently in treatment' }],
        }, 400);
      }

      const progressIncrement = 100 / addiction.treatment_duration_days;
      const newProgress = Math.min(100, addiction.treatment_progress + progressIncrement);

      await c.env.DB
        .prepare('UPDATE character_addictions SET treatment_progress = ? WHERE id = ?')
        .bind(newProgress, addictionId)
        .run();

      return c.json({
        success: true,
        data: {
          addiction: addiction.addiction_name,
          progress: Math.round(newProgress),
          daysRemaining: Math.ceil((100 - newProgress) / progressIncrement),
          message: `Treatment progress: ${Math.round(newProgress)}%`,
        },
      });

    case 'complete':
      if (!addiction.in_treatment || addiction.treatment_progress < 100) {
        return c.json({
          success: false,
          errors: [{ code: 'TREATMENT_INCOMPLETE', message: 'Treatment not complete' }],
        }, 400);
      }

      // Reset addiction
      await c.env.DB
        .prepare(
          `UPDATE character_addictions
           SET current_stage = 0, tolerance_level = 0, dependence_level = 0,
               in_treatment = 0, in_withdrawal = 0,
               current_craving_strength = 0
           WHERE id = ?`
        )
        .bind(addictionId)
        .run();

      return c.json({
        success: true,
        data: {
          addiction: addiction.addiction_name,
          action: 'completed',
          recovered: true,
          message: `Successfully completed treatment for ${addiction.addiction_name}`,
        },
      });

    case 'abandon':
      await c.env.DB
        .prepare(
          `UPDATE character_addictions
           SET in_treatment = 0, treatment_progress = 0, treatment_method = NULL
           WHERE id = ?`
        )
        .bind(addictionId)
        .run();

      return c.json({
        success: true,
        data: {
          addiction: addiction.addiction_name,
          action: 'abandoned',
          message: `Abandoned treatment for ${addiction.addiction_name}`,
        },
      });

    default:
      return c.json({
        success: false,
        errors: [{ code: 'INVALID_ACTION', message: 'Invalid treatment action' }],
      }, 400);
  }
});

// -----------------------------------------------------------------------------
// HUMANITY SYSTEM
// -----------------------------------------------------------------------------

/**
 * GET /status/humanity/thresholds
 * Get humanity threshold definitions.
 */
statusRoutes.get('/humanity/thresholds', async (c) => {
  const thresholds = await c.env.DB
    .prepare('SELECT * FROM humanity_thresholds ORDER BY threshold_value DESC')
    .all<HumanityThresholdRow>();

  return c.json({
    success: true,
    data: {
      thresholds: thresholds.results.map(formatHumanityThreshold),
    },
  });
});

/**
 * GET /status/character/humanity
 * Get character's humanity state.
 */
statusRoutes.get('/character/humanity', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;

  // Get character's current humanity
  const character = await c.env.DB
    .prepare('SELECT current_humanity, max_humanity FROM characters WHERE id = ?')
    .bind(characterId)
    .first<{ current_humanity: number; max_humanity: number }>();

  if (!character) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Character not found' }],
    }, 404);
  }

  // Get current threshold
  const currentThreshold = await c.env.DB
    .prepare(
      `SELECT * FROM humanity_thresholds
       WHERE threshold_value <= ?
       ORDER BY threshold_value DESC
       LIMIT 1`
    )
    .bind(character.current_humanity)
    .first<HumanityThresholdRow>();

  // Get next threshold (recovery target)
  const nextThreshold = await c.env.DB
    .prepare(
      `SELECT * FROM humanity_thresholds
       WHERE threshold_value > ?
       ORDER BY threshold_value ASC
       LIMIT 1`
    )
    .bind(character.current_humanity)
    .first<HumanityThresholdRow>();

  // Get recent events
  const recentEvents = await c.env.DB
    .prepare(
      `SELECT * FROM humanity_events
       WHERE character_id = ?
       ORDER BY occurred_at DESC
       LIMIT 5`
    )
    .bind(characterId)
    .all<HumanityEventRow>();

  return c.json({
    success: true,
    data: {
      current: character.current_humanity,
      max: character.max_humanity,
      percentage: Math.round((character.current_humanity / character.max_humanity) * 100),
      threshold: currentThreshold ? formatHumanityThreshold(currentThreshold) : null,
      nextThreshold: nextThreshold ? {
        value: nextThreshold.threshold_value,
        name: nextThreshold.threshold_name,
        pointsNeeded: nextThreshold.threshold_value - character.current_humanity,
      } : null,
      recentEvents: recentEvents.results.map(e => ({
        occurredAt: e.occurred_at,
        change: e.change_amount,
        source: e.change_source,
        crossedThreshold: e.crossed_threshold,
      })),
    },
  });
});

/**
 * GET /status/character/humanity/history
 * Get humanity event history.
 */
statusRoutes.get('/character/humanity/history', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 100);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  const events = await c.env.DB
    .prepare(
      `SELECT * FROM humanity_events
       WHERE character_id = ?
       ORDER BY occurred_at DESC
       LIMIT ? OFFSET ?`
    )
    .bind(characterId, limit, offset)
    .all<HumanityEventRow>();

  return c.json({
    success: true,
    data: {
      events: events.results.map(e => ({
        id: e.id,
        occurredAt: e.occurred_at,
        before: e.humanity_before,
        after: e.humanity_after,
        change: e.change_amount,
        source: e.change_source,
        sourceId: e.source_id,
        crossedThreshold: e.crossed_threshold,
        episodeSeverity: e.episode_severity,
        therapyApplied: e.therapy_applied === 1,
        anchorUsed: e.anchor_used === 1,
      })),
      pagination: {
        limit,
        offset,
        count: events.results.length,
      },
    },
  });
});

/**
 * POST /status/character/humanity/adjust
 * Adjust character's humanity.
 */
statusRoutes.post('/character/humanity/adjust', requireCharacterMiddleware(), zValidator('json', adjustHumanitySchema), async (c) => {
  const characterId = c.get('characterId')!;
  const { amount, source, sourceId } = c.req.valid('json');

  // Get current humanity
  const character = await c.env.DB
    .prepare('SELECT current_humanity, max_humanity FROM characters WHERE id = ?')
    .bind(characterId)
    .first<{ current_humanity: number; max_humanity: number }>();

  if (!character) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Character not found' }],
    }, 404);
  }

  const oldHumanity = character.current_humanity;
  const newHumanity = Math.max(0, Math.min(character.max_humanity, oldHumanity + amount));

  // Check for threshold crossing
  let crossedThreshold: HumanityThresholdRow | null = null;
  let triggeredEpisode = false;

  if (amount < 0) {
    // Losing humanity - check if crossed a threshold
    crossedThreshold = await c.env.DB
      .prepare(
        `SELECT * FROM humanity_thresholds
         WHERE threshold_value <= ? AND threshold_value > ?
         ORDER BY threshold_value DESC
         LIMIT 1`
      )
      .bind(oldHumanity, newHumanity)
      .first<HumanityThresholdRow>();

    // Very low humanity might trigger cyberpsychosis
    if (newHumanity < 20 && Math.random() < (20 - newHumanity) / 100) {
      triggeredEpisode = true;
    }
  }

  // Update humanity
  await c.env.DB
    .prepare('UPDATE characters SET current_humanity = ? WHERE id = ?')
    .bind(newHumanity, characterId)
    .run();

  // Record event
  const { nanoid } = await import('nanoid');
  await c.env.DB
    .prepare(
      `INSERT INTO humanity_events
       (id, character_id, humanity_before, humanity_after, change_amount,
        change_source, source_id, crossed_threshold, episode_severity, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    .bind(
      nanoid(),
      characterId,
      oldHumanity,
      newHumanity,
      amount,
      source,
      sourceId || null,
      crossedThreshold?.threshold_value || null,
      triggeredEpisode ? Math.ceil(Math.random() * 3) : null
    )
    .run();

  return c.json({
    success: true,
    data: {
      previousHumanity: oldHumanity,
      newHumanity,
      change: amount,
      crossedThreshold: crossedThreshold ? {
        value: crossedThreshold.threshold_value,
        name: crossedThreshold.threshold_name,
      } : null,
      triggeredEpisode,
      message: amount >= 0
        ? `Gained ${amount} humanity`
        : `Lost ${Math.abs(amount)} humanity`,
    },
  });
});

/**
 * POST /status/character/humanity/therapy
 * Apply therapy to restore humanity.
 */
statusRoutes.post('/character/humanity/therapy', requireCharacterMiddleware(), zValidator('json', therapySchema), async (c) => {
  const characterId = c.get('characterId')!;
  const { therapyType, npcId } = c.req.valid('json');

  // Get current humanity
  const character = await c.env.DB
    .prepare('SELECT current_humanity, max_humanity FROM characters WHERE id = ?')
    .bind(characterId)
    .first<{ current_humanity: number; max_humanity: number }>();

  if (!character) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Character not found' }],
    }, 404);
  }

  // Calculate humanity gain based on therapy type
  let gain = 0;
  switch (therapyType) {
    case 'session':
      gain = 5 + Math.floor(Math.random() * 5);
      break;
    case 'anchor':
      gain = 10 + Math.floor(Math.random() * 10);
      break;
    case 'medication':
      gain = 3 + Math.floor(Math.random() * 3);
      break;
    case 'meditation':
      gain = 2 + Math.floor(Math.random() * 3);
      break;
  }

  const oldHumanity = character.current_humanity;
  const newHumanity = Math.min(character.max_humanity, oldHumanity + gain);
  const actualGain = newHumanity - oldHumanity;

  // Update humanity
  await c.env.DB
    .prepare('UPDATE characters SET current_humanity = ? WHERE id = ?')
    .bind(newHumanity, characterId)
    .run();

  // Record event
  const { nanoid } = await import('nanoid');
  await c.env.DB
    .prepare(
      `INSERT INTO humanity_events
       (id, character_id, humanity_before, humanity_after, change_amount,
        change_source, source_id, therapy_applied, anchor_used, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    .bind(
      nanoid(),
      characterId,
      oldHumanity,
      newHumanity,
      actualGain,
      `THERAPY_${therapyType.toUpperCase()}`,
      npcId || null,
      therapyType === 'session' || therapyType === 'medication' ? 1 : 0,
      therapyType === 'anchor' ? 1 : 0
    )
    .run();

  return c.json({
    success: true,
    data: {
      therapyType,
      humanityGained: actualGain,
      newHumanity,
      atMax: newHumanity >= character.max_humanity,
      message: `${therapyType} restored ${actualGain} humanity`,
    },
  });
});

// -----------------------------------------------------------------------------
// CYBERPSYCHOSIS
// -----------------------------------------------------------------------------

/**
 * GET /status/character/cyberpsychosis
 * Get character's cyberpsychosis state.
 */
statusRoutes.get('/character/cyberpsychosis', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;

  // Get character's humanity for risk assessment
  const character = await c.env.DB
    .prepare('SELECT current_humanity, max_humanity FROM characters WHERE id = ?')
    .bind(characterId)
    .first<{ current_humanity: number; max_humanity: number }>();

  if (!character) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Character not found' }],
    }, 404);
  }

  // Check for active episode
  const activeEpisode = await c.env.DB
    .prepare(
      `SELECT * FROM cyberpsychosis_episodes
       WHERE character_id = ? AND resolution_method IS NULL
       ORDER BY occurred_at DESC
       LIMIT 1`
    )
    .bind(characterId)
    .first<CyberpsychosisRow>();

  // Get episode count
  const episodeCount = await c.env.DB
    .prepare('SELECT COUNT(*) as count FROM cyberpsychosis_episodes WHERE character_id = ?')
    .bind(characterId)
    .first<{ count: number }>();

  // Calculate risk level based on humanity
  const humanityPercent = (character.current_humanity / character.max_humanity) * 100;
  let riskLevel: string;
  let riskPercent: number;

  if (humanityPercent >= 80) {
    riskLevel = 'MINIMAL';
    riskPercent = 0;
  } else if (humanityPercent >= 60) {
    riskLevel = 'LOW';
    riskPercent = 5;
  } else if (humanityPercent >= 40) {
    riskLevel = 'MODERATE';
    riskPercent = 15;
  } else if (humanityPercent >= 20) {
    riskLevel = 'HIGH';
    riskPercent = 35;
  } else {
    riskLevel = 'CRITICAL';
    riskPercent = 60 + (20 - humanityPercent) * 2;
  }

  return c.json({
    success: true,
    data: {
      hasActiveEpisode: !!activeEpisode,
      activeEpisode: activeEpisode ? {
        id: activeEpisode.id,
        severity: activeEpisode.severity,
        type: activeEpisode.episode_type,
        startedAt: activeEpisode.occurred_at,
        duration: activeEpisode.duration_minutes,
      } : null,
      risk: {
        level: riskLevel,
        percent: Math.min(100, riskPercent),
        humanity: character.current_humanity,
        humanityPercent: Math.round(humanityPercent),
      },
      history: {
        totalEpisodes: episodeCount?.count || 0,
      },
    },
  });
});

/**
 * GET /status/character/cyberpsychosis/episodes
 * Get episode history.
 */
statusRoutes.get('/character/cyberpsychosis/episodes', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;
  const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 50);

  const episodes = await c.env.DB
    .prepare(
      `SELECT * FROM cyberpsychosis_episodes
       WHERE character_id = ?
       ORDER BY occurred_at DESC
       LIMIT ?`
    )
    .bind(characterId, limit)
    .all<CyberpsychosisRow>();

  return c.json({
    success: true,
    data: {
      episodes: episodes.results.map(e => ({
        id: e.id,
        occurredAt: e.occurred_at,
        triggerType: e.trigger_type,
        humanityAtTrigger: e.humanity_at_trigger,
        severity: e.severity,
        duration: e.duration_minutes,
        type: e.episode_type,
        actions: parseJsonField<string[]>(e.actions_during, []),
        npcsHarmed: parseJsonField<string[]>(e.npcs_harmed, []),
        resolved: !!e.resolution_method,
        resolutionMethod: e.resolution_method,
        humanityAfter: e.humanity_after,
        permanentEffects: parseJsonField<string[]>(e.permanent_effects, []),
      })),
    },
  });
});

/**
 * POST /status/character/cyberpsychosis/resolve
 * Resolve a cyberpsychosis episode.
 */
statusRoutes.post('/character/cyberpsychosis/resolve', requireCharacterMiddleware(), zValidator('json', resolveEpisodeSchema), async (c) => {
  const characterId = c.get('characterId')!;
  const { method, resolvedByNpcId } = c.req.valid('json');

  // Get active episode
  const episode = await c.env.DB
    .prepare(
      `SELECT * FROM cyberpsychosis_episodes
       WHERE character_id = ? AND resolution_method IS NULL
       ORDER BY occurred_at DESC
       LIMIT 1`
    )
    .bind(characterId)
    .first<CyberpsychosisRow>();

  if (!episode) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_ACTIVE_EPISODE', message: 'No active cyberpsychosis episode' }],
    }, 400);
  }

  // Get current humanity
  const character = await c.env.DB
    .prepare('SELECT current_humanity FROM characters WHERE id = ?')
    .bind(characterId)
    .first<{ current_humanity: number }>();

  // Resolve episode
  await c.env.DB
    .prepare(
      `UPDATE cyberpsychosis_episodes
       SET resolution_method = ?, resolved_by_npc_id = ?, humanity_after = ?
       WHERE id = ?`
    )
    .bind(method, resolvedByNpcId || null, character?.current_humanity || 0, episode.id)
    .run();

  return c.json({
    success: true,
    data: {
      episodeId: episode.id,
      severity: episode.severity,
      resolutionMethod: method,
      message: 'Cyberpsychosis episode resolved',
    },
  });
});
