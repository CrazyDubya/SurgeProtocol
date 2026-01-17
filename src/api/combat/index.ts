/**
 * Surge Protocol - Combat System API
 *
 * Endpoints for combat mechanics, damage types, conditions, and status effects.
 * Day 1: Catalog endpoints for damage types, conditions, and combat actions.
 */

import { Hono } from 'hono';
import { type AuthVariables } from '../../middleware/auth';

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

// Database row types
interface DamageTypeDefinition {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_physical: number;
  is_energy: number;
  is_elemental: number;
  is_exotic: number;
  armor_effectiveness: number;
  shield_effectiveness: number;
  can_crit: number;
  leaves_status_id: string | null;
  environmental_source: number;
  common_resistances: string | null;
  created_at: string;
  updated_at: string;
}

interface ConditionDefinition {
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
  on_apply_effect: string | null;
  on_expire_effect: string | null;
  on_tick_effect: string | null;
  on_stack_effect: string | null;
  removal_conditions: string | null;
  cleanse_types: string | null;
  immunity_after_removal: number;
  typical_sources: string | null;
  augment_mitigation: string | null;
  skill_mitigation_id: string | null;
  visual_effect_on_character: string | null;
  screen_effect: string | null;
  audio_effect: string | null;
  created_at: string;
  updated_at: string;
}

interface CombatActionDefinition {
  id: string;
  code: string;
  name: string;
  description: string | null;
  action_type: string | null;
  action_cost: number;
  is_free_action: number;
  is_reaction: number;
  requires_weapon_type: string | null;
  requires_ability_id: string | null;
  requires_augment_id: string | null;
  min_attribute: string | null;
  requires_stance: string | null;
  target_type: string | null;
  target_count: number;
  range_min_m: number;
  range_max_m: number | null;
  requires_los: number;
  area_of_effect: string | null;
  damage_formula: string | null;
  damage_type: string | null;
  status_effects: string | null;
  knockback: number;
  special_effects: string | null;
  accuracy_modifier: number;
  critical_chance_modifier: number;
  critical_damage_modifier: number;
  animation_id: string | null;
  sound_effect_id: string | null;
  visual_effect_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CharacterCondition {
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

interface AddictionType {
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
  craving_response_options: string | null;
  created_at: string;
  updated_at: string;
}

interface CharacterAddiction {
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

// =============================================================================
// ROUTER
// =============================================================================

export const combatRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// =============================================================================
// DAMAGE TYPE ENDPOINTS
// =============================================================================

/**
 * GET /combat/damage-types
 * List all damage type definitions with optional filtering.
 */
combatRoutes.get('/damage-types', async (c) => {
  const db = c.env.DB;

  // Query params for filtering
  const isPhysical = c.req.query('physical');
  const isEnergy = c.req.query('energy');
  const isElemental = c.req.query('elemental');
  const isExotic = c.req.query('exotic');

  let query = `
    SELECT id, code, name, description,
           is_physical, is_energy, is_elemental, is_exotic,
           armor_effectiveness, shield_effectiveness,
           can_crit, leaves_status_id, environmental_source
    FROM damage_type_definitions
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (isPhysical === 'true') {
    query += ` AND is_physical = 1`;
  } else if (isPhysical === 'false') {
    query += ` AND is_physical = 0`;
  }

  if (isEnergy === 'true') {
    query += ` AND is_energy = 1`;
  } else if (isEnergy === 'false') {
    query += ` AND is_energy = 0`;
  }

  if (isElemental === 'true') {
    query += ` AND is_elemental = 1`;
  } else if (isElemental === 'false') {
    query += ` AND is_elemental = 0`;
  }

  if (isExotic === 'true') {
    query += ` AND is_exotic = 1`;
  } else if (isExotic === 'false') {
    query += ` AND is_exotic = 0`;
  }

  query += ` ORDER BY name ASC`;

  const result = await db.prepare(query).bind(...params).all<DamageTypeDefinition>();

  // Transform results
  const damageTypes = result.results.map(dt => ({
    id: dt.id,
    code: dt.code,
    name: dt.name,
    description: dt.description,
    classification: {
      isPhysical: dt.is_physical === 1,
      isEnergy: dt.is_energy === 1,
      isElemental: dt.is_elemental === 1,
      isExotic: dt.is_exotic === 1,
    },
    effectiveness: {
      armor: dt.armor_effectiveness,
      shield: dt.shield_effectiveness,
    },
    canCrit: dt.can_crit === 1,
    leavesStatusId: dt.leaves_status_id,
    isEnvironmental: dt.environmental_source === 1,
  }));

  return c.json({
    success: true,
    data: {
      damageTypes,
      count: damageTypes.length,
    },
  });
});

/**
 * GET /combat/damage-types/:id
 * Get detailed information about a specific damage type.
 */
combatRoutes.get('/damage-types/:id', async (c) => {
  const db = c.env.DB;
  const damageTypeId = c.req.param('id');

  const damageType = await db
    .prepare(
      `SELECT * FROM damage_type_definitions WHERE id = ? OR code = ?`
    )
    .bind(damageTypeId, damageTypeId)
    .first<DamageTypeDefinition>();

  if (!damageType) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Damage type not found' }],
    }, 404);
  }

  // Get associated status effect if any
  let statusEffect = null;
  if (damageType.leaves_status_id) {
    statusEffect = await db
      .prepare(
        `SELECT id, code, name, description, condition_type, severity
         FROM condition_definitions WHERE id = ?`
      )
      .bind(damageType.leaves_status_id)
      .first();
  }

  return c.json({
    success: true,
    data: {
      damageType: {
        id: damageType.id,
        code: damageType.code,
        name: damageType.name,
        description: damageType.description,
        classification: {
          isPhysical: damageType.is_physical === 1,
          isEnergy: damageType.is_energy === 1,
          isElemental: damageType.is_elemental === 1,
          isExotic: damageType.is_exotic === 1,
        },
        effectiveness: {
          armor: damageType.armor_effectiveness,
          shield: damageType.shield_effectiveness,
        },
        canCrit: damageType.can_crit === 1,
        isEnvironmental: damageType.environmental_source === 1,
        statusEffect: statusEffect ? {
          id: statusEffect.id,
          code: statusEffect.code,
          name: statusEffect.name,
          description: statusEffect.description,
          type: statusEffect.condition_type,
          severity: statusEffect.severity,
        } : null,
        commonResistances: damageType.common_resistances
          ? JSON.parse(damageType.common_resistances)
          : [],
      },
    },
  });
});

// =============================================================================
// CONDITION ENDPOINTS
// =============================================================================

/**
 * GET /combat/conditions
 * List all condition/status effect definitions with optional filtering.
 */
combatRoutes.get('/conditions', async (c) => {
  const db = c.env.DB;

  // Query params for filtering
  const conditionType = c.req.query('type');
  const minSeverity = c.req.query('minSeverity');
  const maxSeverity = c.req.query('maxSeverity');
  const isPositive = c.req.query('positive');
  const isDispellable = c.req.query('dispellable');
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  const offset = parseInt(c.req.query('offset') || '0');

  let query = `
    SELECT id, code, name, description, icon_asset,
           condition_type, severity, is_positive, is_visible,
           is_dispellable, duration_type, default_duration_seconds,
           stacks, max_stacks, movement_modifier
    FROM condition_definitions
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (conditionType) {
    query += ` AND condition_type = ?`;
    params.push(conditionType);
  }

  if (minSeverity) {
    query += ` AND severity >= ?`;
    params.push(parseInt(minSeverity));
  }

  if (maxSeverity) {
    query += ` AND severity <= ?`;
    params.push(parseInt(maxSeverity));
  }

  if (isPositive === 'true') {
    query += ` AND is_positive = 1`;
  } else if (isPositive === 'false') {
    query += ` AND is_positive = 0`;
  }

  if (isDispellable === 'true') {
    query += ` AND is_dispellable = 1`;
  } else if (isDispellable === 'false') {
    query += ` AND is_dispellable = 0`;
  }

  // Count total (use [\s\S] to match across newlines)
  const countQuery = query.replace(/SELECT[\s\S]+?FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await db.prepare(countQuery).bind(...params).first<{ total: number }>();

  query += ` ORDER BY severity DESC, name ASC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const result = await db.prepare(query).bind(...params).all<ConditionDefinition>();

  // Transform results
  const conditions = result.results.map(cond => ({
    id: cond.id,
    code: cond.code,
    name: cond.name,
    description: cond.description,
    iconAsset: cond.icon_asset,
    type: cond.condition_type,
    severity: cond.severity,
    isPositive: cond.is_positive === 1,
    isVisible: cond.is_visible === 1,
    isDispellable: cond.is_dispellable === 1,
    duration: {
      type: cond.duration_type,
      defaultSeconds: cond.default_duration_seconds,
    },
    stacking: {
      canStack: cond.stacks === 1,
      maxStacks: cond.max_stacks,
    },
    movementModifier: cond.movement_modifier,
  }));

  return c.json({
    success: true,
    data: {
      conditions,
      pagination: {
        total: countResult?.total || 0,
        limit,
        offset,
        hasMore: offset + limit < (countResult?.total || 0),
      },
    },
  });
});

/**
 * GET /combat/conditions/:id
 * Get detailed information about a specific condition/status effect.
 */
combatRoutes.get('/conditions/:id', async (c) => {
  const db = c.env.DB;
  const conditionId = c.req.param('id');

  const condition = await db
    .prepare(
      `SELECT * FROM condition_definitions WHERE id = ? OR code = ?`
    )
    .bind(conditionId, conditionId)
    .first<ConditionDefinition>();

  if (!condition) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Condition not found' }],
    }, 404);
  }

  // Get skill mitigation info if any
  let skillMitigation = null;
  if (condition.skill_mitigation_id) {
    skillMitigation = await db
      .prepare(`SELECT id, code, name FROM skill_definitions WHERE id = ?`)
      .bind(condition.skill_mitigation_id)
      .first();
  }

  return c.json({
    success: true,
    data: {
      condition: {
        id: condition.id,
        code: condition.code,
        name: condition.name,
        description: condition.description,
        iconAsset: condition.icon_asset,
        classification: {
          type: condition.condition_type,
          severity: condition.severity,
          isPositive: condition.is_positive === 1,
          isVisible: condition.is_visible === 1,
          isDispellable: condition.is_dispellable === 1,
        },
        duration: {
          type: condition.duration_type,
          defaultSeconds: condition.default_duration_seconds,
          canStackDuration: condition.can_stack_duration === 1,
        },
        stacking: {
          canStack: condition.stacks === 1,
          maxStacks: condition.max_stacks,
          behavior: condition.stack_behavior,
        },
        effects: {
          statModifiers: condition.stat_modifiers
            ? JSON.parse(condition.stat_modifiers)
            : null,
          attributeModifiers: condition.attribute_modifiers
            ? JSON.parse(condition.attribute_modifiers)
            : null,
          damageOverTime: condition.damage_over_time
            ? JSON.parse(condition.damage_over_time)
            : null,
          healingOverTime: condition.healing_over_time
            ? JSON.parse(condition.healing_over_time)
            : null,
          movementModifier: condition.movement_modifier,
          actionRestrictions: condition.action_restrictions
            ? JSON.parse(condition.action_restrictions)
            : null,
          specialEffects: condition.special_effects
            ? JSON.parse(condition.special_effects)
            : null,
        },
        triggers: {
          onApply: condition.on_apply_effect
            ? JSON.parse(condition.on_apply_effect)
            : null,
          onExpire: condition.on_expire_effect
            ? JSON.parse(condition.on_expire_effect)
            : null,
          onTick: condition.on_tick_effect
            ? JSON.parse(condition.on_tick_effect)
            : null,
          onStack: condition.on_stack_effect
            ? JSON.parse(condition.on_stack_effect)
            : null,
        },
        removal: {
          conditions: condition.removal_conditions
            ? JSON.parse(condition.removal_conditions)
            : null,
          cleanseTypes: condition.cleanse_types
            ? JSON.parse(condition.cleanse_types)
            : null,
          immunityAfterRemoval: condition.immunity_after_removal,
        },
        mitigation: {
          skillMitigation: skillMitigation ? {
            id: skillMitigation.id,
            code: skillMitigation.code,
            name: skillMitigation.name,
          } : null,
          augmentMitigation: condition.augment_mitigation
            ? JSON.parse(condition.augment_mitigation)
            : null,
        },
        typicalSources: condition.typical_sources
          ? JSON.parse(condition.typical_sources)
          : null,
        visuals: {
          characterEffect: condition.visual_effect_on_character,
          screenEffect: condition.screen_effect,
          audioEffect: condition.audio_effect,
        },
      },
    },
  });
});

// =============================================================================
// COMBAT ACTION ENDPOINTS
// =============================================================================

/**
 * GET /combat/actions
 * List all combat action definitions with optional filtering.
 */
combatRoutes.get('/actions', async (c) => {
  const db = c.env.DB;

  // Query params for filtering
  const actionType = c.req.query('type');
  const weaponType = c.req.query('weaponType');
  const damageType = c.req.query('damageType');
  const isFreeAction = c.req.query('freeAction');
  const isReaction = c.req.query('reaction');
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  const offset = parseInt(c.req.query('offset') || '0');

  let query = `
    SELECT id, code, name, description,
           action_type, action_cost, is_free_action, is_reaction,
           requires_weapon_type, target_type, target_count,
           range_min_m, range_max_m, requires_los,
           damage_formula, damage_type,
           accuracy_modifier, critical_chance_modifier
    FROM combat_action_definitions
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (actionType) {
    query += ` AND action_type = ?`;
    params.push(actionType);
  }

  if (weaponType) {
    query += ` AND requires_weapon_type LIKE ?`;
    params.push(`%${weaponType}%`);
  }

  if (damageType) {
    query += ` AND damage_type = ?`;
    params.push(damageType);
  }

  if (isFreeAction === 'true') {
    query += ` AND is_free_action = 1`;
  } else if (isFreeAction === 'false') {
    query += ` AND is_free_action = 0`;
  }

  if (isReaction === 'true') {
    query += ` AND is_reaction = 1`;
  } else if (isReaction === 'false') {
    query += ` AND is_reaction = 0`;
  }

  // Count total (use [\s\S] to match across newlines)
  const countQuery = query.replace(/SELECT[\s\S]+?FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await db.prepare(countQuery).bind(...params).first<{ total: number }>();

  query += ` ORDER BY action_type, action_cost, name ASC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const result = await db.prepare(query).bind(...params).all<CombatActionDefinition>();

  // Transform results
  const actions = result.results.map(action => ({
    id: action.id,
    code: action.code,
    name: action.name,
    description: action.description,
    type: action.action_type,
    cost: {
      actionPoints: action.action_cost,
      isFreeAction: action.is_free_action === 1,
      isReaction: action.is_reaction === 1,
    },
    requirements: {
      weaponType: action.requires_weapon_type
        ? JSON.parse(action.requires_weapon_type)
        : null,
    },
    targeting: {
      type: action.target_type,
      count: action.target_count,
      rangeMin: action.range_min_m,
      rangeMax: action.range_max_m,
      requiresLineOfSight: action.requires_los === 1,
    },
    damage: action.damage_formula ? {
      formula: action.damage_formula,
      type: action.damage_type,
    } : null,
    modifiers: {
      accuracy: action.accuracy_modifier,
      criticalChance: action.critical_chance_modifier,
    },
  }));

  return c.json({
    success: true,
    data: {
      actions,
      pagination: {
        total: countResult?.total || 0,
        limit,
        offset,
        hasMore: offset + limit < (countResult?.total || 0),
      },
    },
  });
});

/**
 * GET /combat/actions/:id
 * Get detailed information about a specific combat action.
 */
combatRoutes.get('/actions/:id', async (c) => {
  const db = c.env.DB;
  const actionId = c.req.param('id');

  const action = await db
    .prepare(
      `SELECT * FROM combat_action_definitions WHERE id = ? OR code = ?`
    )
    .bind(actionId, actionId)
    .first<CombatActionDefinition>();

  if (!action) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Combat action not found' }],
    }, 404);
  }

  // Get damage type info if any
  let damageTypeInfo = null;
  if (action.damage_type) {
    damageTypeInfo = await db
      .prepare(
        `SELECT id, code, name, is_physical, is_energy, armor_effectiveness
         FROM damage_type_definitions WHERE code = ?`
      )
      .bind(action.damage_type)
      .first();
  }

  // Get required ability info if any
  let requiredAbility = null;
  if (action.requires_ability_id) {
    requiredAbility = await db
      .prepare(`SELECT id, code, name FROM ability_definitions WHERE id = ?`)
      .bind(action.requires_ability_id)
      .first();
  }

  // Get required augment info if any
  let requiredAugment = null;
  if (action.requires_augment_id) {
    requiredAugment = await db
      .prepare(`SELECT id, code, name FROM augment_definitions WHERE id = ?`)
      .bind(action.requires_augment_id)
      .first();
  }

  return c.json({
    success: true,
    data: {
      action: {
        id: action.id,
        code: action.code,
        name: action.name,
        description: action.description,
        type: action.action_type,
        cost: {
          actionPoints: action.action_cost,
          isFreeAction: action.is_free_action === 1,
          isReaction: action.is_reaction === 1,
        },
        requirements: {
          weaponType: action.requires_weapon_type
            ? JSON.parse(action.requires_weapon_type)
            : null,
          ability: requiredAbility ? {
            id: requiredAbility.id,
            code: requiredAbility.code,
            name: requiredAbility.name,
          } : null,
          augment: requiredAugment ? {
            id: requiredAugment.id,
            code: requiredAugment.code,
            name: requiredAugment.name,
          } : null,
          minAttribute: action.min_attribute
            ? JSON.parse(action.min_attribute)
            : null,
          stance: action.requires_stance,
        },
        targeting: {
          type: action.target_type,
          count: action.target_count,
          rangeMin: action.range_min_m,
          rangeMax: action.range_max_m,
          requiresLineOfSight: action.requires_los === 1,
          areaOfEffect: action.area_of_effect
            ? JSON.parse(action.area_of_effect)
            : null,
        },
        damage: action.damage_formula ? {
          formula: action.damage_formula,
          type: action.damage_type,
          typeInfo: damageTypeInfo ? {
            id: damageTypeInfo.id,
            code: damageTypeInfo.code,
            name: damageTypeInfo.name,
            isPhysical: damageTypeInfo.is_physical === 1,
            isEnergy: damageTypeInfo.is_energy === 1,
            armorEffectiveness: damageTypeInfo.armor_effectiveness,
          } : null,
          knockback: action.knockback,
        } : null,
        modifiers: {
          accuracy: action.accuracy_modifier,
          criticalChance: action.critical_chance_modifier,
          criticalDamage: action.critical_damage_modifier,
        },
        effects: {
          statusEffects: action.status_effects
            ? JSON.parse(action.status_effects)
            : null,
          specialEffects: action.special_effects
            ? JSON.parse(action.special_effects)
            : null,
        },
        visuals: {
          animationId: action.animation_id,
          soundEffectId: action.sound_effect_id,
          visualEffectId: action.visual_effect_id,
        },
      },
    },
  });
});

// =============================================================================
// UTILITY ENDPOINTS
// =============================================================================

/**
 * GET /combat/types
 * Get all available combat-related type enums for UI dropdowns.
 */
combatRoutes.get('/types', async (c) => {
  return c.json({
    success: true,
    data: {
      conditionTypes: [
        'BUFF',
        'DEBUFF',
        'DOT',
        'HOT',
        'CROWD_CONTROL',
        'MOVEMENT',
        'ENVIRONMENTAL',
        'MENTAL',
        'PHYSICAL',
        'CYBER',
      ],
      actionTypes: [
        'ATTACK',
        'DEFEND',
        'MOVE',
        'USE_ITEM',
        'ABILITY',
        'INTERACT',
        'RELOAD',
        'OVERWATCH',
        'HUNKER',
        'HACK',
      ],
      targetTypes: [
        'SELF',
        'SINGLE_ENEMY',
        'SINGLE_ALLY',
        'SINGLE_ANY',
        'AREA',
        'CONE',
        'LINE',
        'ALL_ENEMIES',
        'ALL_ALLIES',
      ],
      damageCategories: [
        'PHYSICAL',
        'ENERGY',
        'ELEMENTAL',
        'EXOTIC',
      ],
    },
  });
});

// =============================================================================
// DAY 2: ARENA ENDPOINTS
// =============================================================================

interface CombatArena {
  id: string;
  location_id: string | null;
  name: string | null;
  width_m: number;
  height_m: number;
  grid_size_m: number;
  terrain_map: string | null;
  elevation_map: string | null;
  cover_points: string | null;
  hazard_zones: string | null;
  player_spawn_points: string | null;
  enemy_spawn_points: string | null;
  reinforcement_points: string | null;
  interactable_objects: string | null;
  destructibles: string | null;
  hackable_objects: string | null;
  lighting_level: number;
  ambient_hazards: string | null;
  weather_effects: string | null;
  noise_level: number;
  has_multiple_levels: number;
  level_connections: string | null;
  fall_damage_enabled: number;
  patrol_routes: string | null;
  sniper_positions: string | null;
  flanking_routes: string | null;
  retreat_routes: string | null;
  created_at: string;
  updated_at: string;
}

interface CombatEncounter {
  id: string;
  name: string | null;
  description: string | null;
  encounter_type: string | null;
  difficulty_rating: number;
  is_scripted: number;
  is_avoidable: number;
  location_id: string | null;
  combat_arena_id: string | null;
  environment_modifiers: string | null;
  enemy_spawn_groups: string | null;
  boss_npc_id: string | null;
  primary_objective: string | null;
  optional_objectives: string | null;
  failure_conditions: string | null;
  time_limit_seconds: number | null;
  xp_reward: number;
  cred_reward: number;
  item_drops: string | null;
  special_rewards: string | null;
  retreat_possible: number;
  retreat_penalty: string | null;
  death_consequence: string | null;
  narrative_impact: string | null;
  enemy_ai_profile: string | null;
  enemy_coordination: number;
  enemy_morale_enabled: number;
  surrender_possible: number;
  created_at: string;
  updated_at: string;
}

/**
 * GET /combat/arenas
 * List all combat arenas with optional location filtering.
 */
combatRoutes.get('/arenas', async (c) => {
  const db = c.env.DB;

  // Query params for filtering
  const locationId = c.req.query('locationId');
  const hasMultipleLevels = c.req.query('multipleLevels');
  const minSize = c.req.query('minSize');
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  const offset = parseInt(c.req.query('offset') || '0');

  let query = `
    SELECT ca.id, ca.name, ca.location_id,
           ca.width_m, ca.height_m, ca.grid_size_m,
           ca.lighting_level, ca.noise_level,
           ca.has_multiple_levels, ca.fall_damage_enabled,
           l.name as location_name, l.district_id
    FROM combat_arenas ca
    LEFT JOIN locations l ON ca.location_id = l.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (locationId) {
    query += ` AND ca.location_id = ?`;
    params.push(locationId);
  }

  if (hasMultipleLevels === 'true') {
    query += ` AND ca.has_multiple_levels = 1`;
  } else if (hasMultipleLevels === 'false') {
    query += ` AND ca.has_multiple_levels = 0`;
  }

  if (minSize) {
    const size = parseInt(minSize);
    query += ` AND (ca.width_m * ca.height_m) >= ?`;
    params.push(size);
  }

  // Count total
  const countQuery = query.replace(/SELECT[\s\S]+?FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await db.prepare(countQuery).bind(...params).first<{ total: number }>();

  query += ` ORDER BY ca.name ASC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const result = await db.prepare(query).bind(...params).all<CombatArena & { location_name: string | null; district_id: string | null }>();

  const arenas = result.results.map(arena => ({
    id: arena.id,
    name: arena.name,
    location: arena.location_id ? {
      id: arena.location_id,
      name: arena.location_name,
      districtId: arena.district_id,
    } : null,
    dimensions: {
      width: arena.width_m,
      height: arena.height_m,
      gridSize: arena.grid_size_m,
      area: arena.width_m * arena.height_m,
    },
    environment: {
      lightingLevel: arena.lighting_level,
      noiseLevel: arena.noise_level,
    },
    hasMultipleLevels: arena.has_multiple_levels === 1,
    fallDamageEnabled: arena.fall_damage_enabled === 1,
  }));

  return c.json({
    success: true,
    data: {
      arenas,
      pagination: {
        total: countResult?.total || 0,
        limit,
        offset,
        hasMore: offset + limit < (countResult?.total || 0),
      },
    },
  });
});

/**
 * GET /combat/arenas/:id
 * Get detailed information about a specific combat arena.
 */
combatRoutes.get('/arenas/:id', async (c) => {
  const db = c.env.DB;
  const arenaId = c.req.param('id');

  const arena = await db
    .prepare(
      `SELECT ca.*, l.name as location_name, l.district_id
       FROM combat_arenas ca
       LEFT JOIN locations l ON ca.location_id = l.id
       WHERE ca.id = ?`
    )
    .bind(arenaId)
    .first<CombatArena & { location_name: string | null; district_id: string | null }>();

  if (!arena) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Combat arena not found' }],
    }, 404);
  }

  return c.json({
    success: true,
    data: {
      arena: {
        id: arena.id,
        name: arena.name,
        location: arena.location_id ? {
          id: arena.location_id,
          name: arena.location_name,
          districtId: arena.district_id,
        } : null,
        dimensions: {
          width: arena.width_m,
          height: arena.height_m,
          gridSize: arena.grid_size_m,
          area: arena.width_m * arena.height_m,
        },
        terrain: {
          map: arena.terrain_map ? JSON.parse(arena.terrain_map) : null,
          elevation: arena.elevation_map ? JSON.parse(arena.elevation_map) : null,
          coverPoints: arena.cover_points ? JSON.parse(arena.cover_points) : [],
          hazardZones: arena.hazard_zones ? JSON.parse(arena.hazard_zones) : [],
        },
        spawns: {
          player: arena.player_spawn_points ? JSON.parse(arena.player_spawn_points) : [],
          enemy: arena.enemy_spawn_points ? JSON.parse(arena.enemy_spawn_points) : [],
          reinforcement: arena.reinforcement_points ? JSON.parse(arena.reinforcement_points) : [],
        },
        interactables: {
          objects: arena.interactable_objects ? JSON.parse(arena.interactable_objects) : [],
          destructibles: arena.destructibles ? JSON.parse(arena.destructibles) : [],
          hackable: arena.hackable_objects ? JSON.parse(arena.hackable_objects) : [],
        },
        environment: {
          lightingLevel: arena.lighting_level,
          noiseLevel: arena.noise_level,
          ambientHazards: arena.ambient_hazards ? JSON.parse(arena.ambient_hazards) : [],
          weatherEffects: arena.weather_effects ? JSON.parse(arena.weather_effects) : null,
        },
        vertical: {
          hasMultipleLevels: arena.has_multiple_levels === 1,
          levelConnections: arena.level_connections ? JSON.parse(arena.level_connections) : [],
          fallDamageEnabled: arena.fall_damage_enabled === 1,
        },
        aiHints: {
          patrolRoutes: arena.patrol_routes ? JSON.parse(arena.patrol_routes) : [],
          sniperPositions: arena.sniper_positions ? JSON.parse(arena.sniper_positions) : [],
          flankingRoutes: arena.flanking_routes ? JSON.parse(arena.flanking_routes) : [],
          retreatRoutes: arena.retreat_routes ? JSON.parse(arena.retreat_routes) : [],
        },
      },
    },
  });
});

// =============================================================================
// DAY 2: ENCOUNTER ENDPOINTS
// =============================================================================

/**
 * GET /combat/encounters
 * List all combat encounters with optional filtering.
 */
combatRoutes.get('/encounters', async (c) => {
  const db = c.env.DB;

  // Query params for filtering
  const encounterType = c.req.query('type');
  const minDifficulty = c.req.query('minDifficulty');
  const maxDifficulty = c.req.query('maxDifficulty');
  const locationId = c.req.query('locationId');
  const isAvoidable = c.req.query('avoidable');
  const isScripted = c.req.query('scripted');
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  const offset = parseInt(c.req.query('offset') || '0');

  let query = `
    SELECT ce.id, ce.name, ce.description,
           ce.encounter_type, ce.difficulty_rating,
           ce.is_scripted, ce.is_avoidable,
           ce.location_id, ce.combat_arena_id,
           ce.xp_reward, ce.cred_reward,
           ce.retreat_possible, ce.surrender_possible,
           l.name as location_name,
           ca.name as arena_name
    FROM combat_encounters ce
    LEFT JOIN locations l ON ce.location_id = l.id
    LEFT JOIN combat_arenas ca ON ce.combat_arena_id = ca.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (encounterType) {
    query += ` AND ce.encounter_type = ?`;
    params.push(encounterType);
  }

  if (minDifficulty) {
    query += ` AND ce.difficulty_rating >= ?`;
    params.push(parseInt(minDifficulty));
  }

  if (maxDifficulty) {
    query += ` AND ce.difficulty_rating <= ?`;
    params.push(parseInt(maxDifficulty));
  }

  if (locationId) {
    query += ` AND ce.location_id = ?`;
    params.push(locationId);
  }

  if (isAvoidable === 'true') {
    query += ` AND ce.is_avoidable = 1`;
  } else if (isAvoidable === 'false') {
    query += ` AND ce.is_avoidable = 0`;
  }

  if (isScripted === 'true') {
    query += ` AND ce.is_scripted = 1`;
  } else if (isScripted === 'false') {
    query += ` AND ce.is_scripted = 0`;
  }

  // Count total
  const countQuery = query.replace(/SELECT[\s\S]+?FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await db.prepare(countQuery).bind(...params).first<{ total: number }>();

  query += ` ORDER BY ce.difficulty_rating ASC, ce.name ASC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const result = await db.prepare(query).bind(...params).all<CombatEncounter & { location_name: string | null; arena_name: string | null }>();

  const encounters = result.results.map(enc => ({
    id: enc.id,
    name: enc.name,
    description: enc.description,
    type: enc.encounter_type,
    difficulty: enc.difficulty_rating,
    isScripted: enc.is_scripted === 1,
    isAvoidable: enc.is_avoidable === 1,
    location: enc.location_id ? {
      id: enc.location_id,
      name: enc.location_name,
    } : null,
    arena: enc.combat_arena_id ? {
      id: enc.combat_arena_id,
      name: enc.arena_name,
    } : null,
    rewards: {
      xp: enc.xp_reward,
      credits: enc.cred_reward,
    },
    options: {
      canRetreat: enc.retreat_possible === 1,
      canSurrender: enc.surrender_possible === 1,
    },
  }));

  return c.json({
    success: true,
    data: {
      encounters,
      pagination: {
        total: countResult?.total || 0,
        limit,
        offset,
        hasMore: offset + limit < (countResult?.total || 0),
      },
    },
  });
});

/**
 * GET /combat/encounters/:id
 * Get detailed information about a specific combat encounter.
 */
combatRoutes.get('/encounters/:id', async (c) => {
  const db = c.env.DB;
  const encounterId = c.req.param('id');

  const encounter = await db
    .prepare(
      `SELECT ce.*, l.name as location_name, ca.name as arena_name,
              npc.name as boss_name, npc.npc_type as boss_type
       FROM combat_encounters ce
       LEFT JOIN locations l ON ce.location_id = l.id
       LEFT JOIN combat_arenas ca ON ce.combat_arena_id = ca.id
       LEFT JOIN npc_definitions npc ON ce.boss_npc_id = npc.id
       WHERE ce.id = ?`
    )
    .bind(encounterId)
    .first<CombatEncounter & {
      location_name: string | null;
      arena_name: string | null;
      boss_name: string | null;
      boss_type: string | null;
    }>();

  if (!encounter) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Combat encounter not found' }],
    }, 404);
  }

  return c.json({
    success: true,
    data: {
      encounter: {
        id: encounter.id,
        name: encounter.name,
        description: encounter.description,
        type: encounter.encounter_type,
        difficulty: encounter.difficulty_rating,
        isScripted: encounter.is_scripted === 1,
        isAvoidable: encounter.is_avoidable === 1,
        location: encounter.location_id ? {
          id: encounter.location_id,
          name: encounter.location_name,
        } : null,
        arena: encounter.combat_arena_id ? {
          id: encounter.combat_arena_id,
          name: encounter.arena_name,
        } : null,
        environmentModifiers: encounter.environment_modifiers
          ? JSON.parse(encounter.environment_modifiers)
          : null,
        enemies: {
          spawnGroups: encounter.enemy_spawn_groups
            ? JSON.parse(encounter.enemy_spawn_groups)
            : [],
          boss: encounter.boss_npc_id ? {
            id: encounter.boss_npc_id,
            name: encounter.boss_name,
            type: encounter.boss_type,
          } : null,
        },
        objectives: {
          primary: encounter.primary_objective,
          optional: encounter.optional_objectives
            ? JSON.parse(encounter.optional_objectives)
            : [],
          failureConditions: encounter.failure_conditions
            ? JSON.parse(encounter.failure_conditions)
            : [],
          timeLimit: encounter.time_limit_seconds,
        },
        rewards: {
          xp: encounter.xp_reward,
          credits: encounter.cred_reward,
          itemDrops: encounter.item_drops
            ? JSON.parse(encounter.item_drops)
            : [],
          special: encounter.special_rewards
            ? JSON.parse(encounter.special_rewards)
            : [],
        },
        consequences: {
          canRetreat: encounter.retreat_possible === 1,
          retreatPenalty: encounter.retreat_penalty
            ? JSON.parse(encounter.retreat_penalty)
            : null,
          deathConsequence: encounter.death_consequence,
          narrativeImpact: encounter.narrative_impact
            ? JSON.parse(encounter.narrative_impact)
            : null,
        },
        ai: {
          profile: encounter.enemy_ai_profile,
          coordination: encounter.enemy_coordination,
          moraleEnabled: encounter.enemy_morale_enabled === 1,
          canSurrender: encounter.surrender_possible === 1,
        },
      },
    },
  });
});

/**
 * GET /combat/encounters/:id/preview
 * Get a spoiler-free preview of an encounter for pre-combat decision making.
 */
combatRoutes.get('/encounters/:id/preview', async (c) => {
  const db = c.env.DB;
  const encounterId = c.req.param('id');

  const encounter = await db
    .prepare(
      `SELECT ce.id, ce.name, ce.description,
              ce.encounter_type, ce.difficulty_rating,
              ce.is_avoidable, ce.retreat_possible,
              ce.xp_reward, ce.cred_reward,
              ce.time_limit_seconds,
              l.name as location_name
       FROM combat_encounters ce
       LEFT JOIN locations l ON ce.location_id = l.id
       WHERE ce.id = ?`
    )
    .bind(encounterId)
    .first<{
      id: string;
      name: string | null;
      description: string | null;
      encounter_type: string | null;
      difficulty_rating: number;
      is_avoidable: number;
      retreat_possible: number;
      xp_reward: number;
      cred_reward: number;
      time_limit_seconds: number | null;
      location_name: string | null;
    }>();

  if (!encounter) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Combat encounter not found' }],
    }, 404);
  }

  // Determine difficulty label
  let difficultyLabel = 'Unknown';
  if (encounter.difficulty_rating <= 2) difficultyLabel = 'Easy';
  else if (encounter.difficulty_rating <= 4) difficultyLabel = 'Normal';
  else if (encounter.difficulty_rating <= 6) difficultyLabel = 'Hard';
  else if (encounter.difficulty_rating <= 8) difficultyLabel = 'Very Hard';
  else difficultyLabel = 'Extreme';

  return c.json({
    success: true,
    data: {
      preview: {
        id: encounter.id,
        name: encounter.name,
        description: encounter.description,
        type: encounter.encounter_type,
        difficulty: {
          rating: encounter.difficulty_rating,
          label: difficultyLabel,
        },
        location: encounter.location_name,
        options: {
          canAvoid: encounter.is_avoidable === 1,
          canRetreat: encounter.retreat_possible === 1,
        },
        hasTimeLimit: encounter.time_limit_seconds !== null,
        estimatedRewards: {
          xp: encounter.xp_reward,
          credits: encounter.cred_reward,
        },
        warnings: [
          ...(encounter.difficulty_rating >= 7 ? ['High difficulty - prepare carefully'] : []),
          ...(encounter.time_limit_seconds ? ['Time-limited encounter'] : []),
          ...(encounter.is_avoidable === 0 ? ['Cannot be avoided'] : []),
          ...(encounter.retreat_possible === 0 ? ['No retreat possible'] : []),
        ],
      },
    },
  });
});

// =============================================================================
// DAY 3: COMBAT INSTANCE MANAGEMENT
// =============================================================================

interface CombatInstance {
  id: string;
  character_id: string;
  encounter_id: string | null;
  started_at: string;
  status: string;
  current_round: number;
  current_turn_entity_id: string | null;
  turn_order: string | null;
  player_participants: string | null;
  enemy_participants: string | null;
  neutral_participants: string | null;
  reinforcements_called: number;
  damage_dealt_by_player: number;
  damage_taken_by_player: number;
  enemies_defeated: number;
  allies_lost: number;
  rounds_elapsed: number;
  time_elapsed_seconds: number;
  ammo_expended: string | null;
  items_used: string | null;
  abilities_used: string | null;
  health_items_used: number;
  ended_at: string | null;
  outcome: string | null;
  objectives_completed: string | null;
  loot_dropped: string | null;
  xp_earned: number;
  special_achievements: string | null;
  action_log: string | null;
  replay_seed: number | null;
}

/**
 * POST /combat/start
 * Initialize a new combat instance from an encounter.
 */
combatRoutes.post('/start', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<{
    characterId: string;
    encounterId: string;
    participants?: { id: string; type: 'player' | 'ally' }[];
  }>();

  const { characterId, encounterId, participants = [] } = body;

  // Validate character exists
  const character = await db
    .prepare(`SELECT id, name FROM characters WHERE id = ?`)
    .bind(characterId)
    .first<{ id: string; name: string }>();

  if (!character) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Character not found' }],
    }, 404);
  }

  // Check if character already has active combat
  const activeCombat = await db
    .prepare(
      `SELECT id FROM combat_instances
       WHERE character_id = ? AND status IN ('INITIALIZING', 'ACTIVE', 'PAUSED')`
    )
    .bind(characterId)
    .first();

  if (activeCombat) {
    return c.json({
      success: false,
      errors: [{ code: 'ALREADY_IN_COMBAT', message: 'Character is already in combat' }],
    }, 400);
  }

  // Validate encounter exists
  const encounter = await db
    .prepare(
      `SELECT id, name, enemy_spawn_groups, difficulty_rating,
              primary_objective, time_limit_seconds
       FROM combat_encounters WHERE id = ?`
    )
    .bind(encounterId)
    .first<{
      id: string;
      name: string | null;
      enemy_spawn_groups: string | null;
      difficulty_rating: number;
      primary_objective: string | null;
      time_limit_seconds: number | null;
    }>();

  if (!encounter) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Encounter not found' }],
    }, 404);
  }

  // Generate combat instance ID
  const combatId = `combat-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  // Build initial participant lists
  const playerParticipants = [
    { id: characterId, name: character.name, type: 'player' as const, isActive: true },
    ...participants.map(p => ({ ...p, isActive: true })),
  ];

  // Parse enemy spawn groups from encounter
  const enemyGroups = encounter.enemy_spawn_groups
    ? JSON.parse(encounter.enemy_spawn_groups)
    : [];
  const enemyParticipants = enemyGroups.flatMap((group: { enemies: unknown[] }) =>
    group.enemies || []
  );

  // Generate initial turn order (simplified - players first, then enemies)
  const turnOrder = [
    ...playerParticipants.map(p => ({ id: p.id, type: 'player' })),
    ...enemyParticipants.map((e: { id: string }) => ({ id: e.id, type: 'enemy' })),
  ];

  // Generate replay seed for deterministic random events
  const replaySeed = Math.floor(Math.random() * 1000000);

  // Insert combat instance
  await db
    .prepare(
      `INSERT INTO combat_instances (
        id, character_id, encounter_id, started_at,
        status, current_round, current_turn_entity_id, turn_order,
        player_participants, enemy_participants, replay_seed
      ) VALUES (?, ?, ?, datetime('now'), 'ACTIVE', 1, ?, ?, ?, ?, ?)`
    )
    .bind(
      combatId,
      characterId,
      encounterId,
      turnOrder[0]?.id || null,
      JSON.stringify(turnOrder),
      JSON.stringify(playerParticipants),
      JSON.stringify(enemyParticipants),
      replaySeed
    )
    .run();

  return c.json({
    success: true,
    data: {
      combat: {
        id: combatId,
        status: 'ACTIVE',
        encounter: {
          id: encounter.id,
          name: encounter.name,
          difficulty: encounter.difficulty_rating,
          objective: encounter.primary_objective,
          timeLimit: encounter.time_limit_seconds,
        },
        currentRound: 1,
        currentTurn: turnOrder[0] || null,
        turnOrder,
        participants: {
          players: playerParticipants,
          enemies: enemyParticipants,
        },
        startedAt: new Date().toISOString(),
      },
    },
  }, 201);
});

/**
 * GET /combat/active
 * List active combat instances for a character.
 */
combatRoutes.get('/active', async (c) => {
  const db = c.env.DB;
  const characterId = c.req.query('characterId');

  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId query parameter is required' }],
    }, 400);
  }

  const result = await db
    .prepare(
      `SELECT ci.*, ce.name as encounter_name, ce.difficulty_rating
       FROM combat_instances ci
       LEFT JOIN combat_encounters ce ON ci.encounter_id = ce.id
       WHERE ci.character_id = ? AND ci.status IN ('INITIALIZING', 'ACTIVE', 'PAUSED')
       ORDER BY ci.started_at DESC`
    )
    .bind(characterId)
    .all<CombatInstance & { encounter_name: string | null; difficulty_rating: number | null }>();

  const activeCombats = result.results.map(combat => ({
    id: combat.id,
    status: combat.status,
    encounter: combat.encounter_id ? {
      id: combat.encounter_id,
      name: combat.encounter_name,
      difficulty: combat.difficulty_rating,
    } : null,
    currentRound: combat.current_round,
    roundsElapsed: combat.rounds_elapsed,
    timeElapsed: combat.time_elapsed_seconds,
    stats: {
      damageDealt: combat.damage_dealt_by_player,
      damageTaken: combat.damage_taken_by_player,
      enemiesDefeated: combat.enemies_defeated,
      alliesLost: combat.allies_lost,
    },
    startedAt: combat.started_at,
  }));

  return c.json({
    success: true,
    data: {
      activeCombats,
      count: activeCombats.length,
    },
  });
});

/**
 * GET /combat/instances/:id
 * Get detailed state of a combat instance.
 */
combatRoutes.get('/instances/:id', async (c) => {
  const db = c.env.DB;
  const combatId = c.req.param('id');

  const combat = await db
    .prepare(
      `SELECT ci.*, ce.name as encounter_name, ce.difficulty_rating,
              ce.primary_objective, ce.optional_objectives,
              ce.time_limit_seconds, ce.retreat_possible
       FROM combat_instances ci
       LEFT JOIN combat_encounters ce ON ci.encounter_id = ce.id
       WHERE ci.id = ?`
    )
    .bind(combatId)
    .first<CombatInstance & {
      encounter_name: string | null;
      difficulty_rating: number | null;
      primary_objective: string | null;
      optional_objectives: string | null;
      time_limit_seconds: number | null;
      retreat_possible: number | null;
    }>();

  if (!combat) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Combat instance not found' }],
    }, 404);
  }

  return c.json({
    success: true,
    data: {
      combat: {
        id: combat.id,
        characterId: combat.character_id,
        status: combat.status,
        encounter: combat.encounter_id ? {
          id: combat.encounter_id,
          name: combat.encounter_name,
          difficulty: combat.difficulty_rating,
          objective: combat.primary_objective,
          optionalObjectives: combat.optional_objectives
            ? JSON.parse(combat.optional_objectives)
            : [],
          timeLimit: combat.time_limit_seconds,
          canRetreat: combat.retreat_possible === 1,
        } : null,
        turn: {
          currentRound: combat.current_round,
          currentEntityId: combat.current_turn_entity_id,
          turnOrder: combat.turn_order ? JSON.parse(combat.turn_order) : [],
        },
        participants: {
          players: combat.player_participants
            ? JSON.parse(combat.player_participants)
            : [],
          enemies: combat.enemy_participants
            ? JSON.parse(combat.enemy_participants)
            : [],
          neutrals: combat.neutral_participants
            ? JSON.parse(combat.neutral_participants)
            : [],
          reinforcementsCalled: combat.reinforcements_called === 1,
        },
        stats: {
          damageDealt: combat.damage_dealt_by_player,
          damageTaken: combat.damage_taken_by_player,
          enemiesDefeated: combat.enemies_defeated,
          alliesLost: combat.allies_lost,
          roundsElapsed: combat.rounds_elapsed,
          timeElapsed: combat.time_elapsed_seconds,
        },
        resourcesUsed: {
          ammo: combat.ammo_expended ? JSON.parse(combat.ammo_expended) : {},
          items: combat.items_used ? JSON.parse(combat.items_used) : [],
          abilities: combat.abilities_used ? JSON.parse(combat.abilities_used) : [],
          healthItems: combat.health_items_used,
        },
        outcome: combat.ended_at ? {
          result: combat.outcome,
          objectivesCompleted: combat.objectives_completed
            ? JSON.parse(combat.objectives_completed)
            : [],
          loot: combat.loot_dropped ? JSON.parse(combat.loot_dropped) : [],
          xpEarned: combat.xp_earned,
          achievements: combat.special_achievements
            ? JSON.parse(combat.special_achievements)
            : [],
          endedAt: combat.ended_at,
        } : null,
        timing: {
          startedAt: combat.started_at,
          endedAt: combat.ended_at,
        },
      },
    },
  });
});

/**
 * POST /combat/instances/:id/end
 * End a combat instance with a specific outcome.
 */
combatRoutes.post('/instances/:id/end', async (c) => {
  const db = c.env.DB;
  const combatId = c.req.param('id');
  const body = await c.req.json<{
    outcome: 'VICTORY' | 'DEFEAT' | 'RETREAT' | 'DRAW';
    objectivesCompleted?: string[];
    loot?: { itemId: string; quantity: number }[];
  }>();

  const { outcome, objectivesCompleted = [], loot = [] } = body;

  // Validate outcome
  const validOutcomes = ['VICTORY', 'DEFEAT', 'RETREAT', 'DRAW'];
  if (!validOutcomes.includes(outcome)) {
    return c.json({
      success: false,
      errors: [{ code: 'INVALID_OUTCOME', message: 'Invalid combat outcome' }],
    }, 400);
  }

  // Get combat instance (without JOIN for better mock DB compatibility)
  const combat = await db
    .prepare(`SELECT * FROM combat_instances WHERE id = ?`)
    .bind(combatId)
    .first<CombatInstance>();

  if (!combat) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Combat instance not found' }],
    }, 404);
  }

  // Check if combat is already ended
  if (combat.status === 'COMPLETED' || combat.status === 'ABANDONED') {
    return c.json({
      success: false,
      errors: [{ code: 'ALREADY_ENDED', message: 'Combat has already ended' }],
    }, 400);
  }

  // Get encounter details if exists
  let encounter: { xp_reward: number; cred_reward: number; retreat_possible: number } | null = null;
  if (combat.encounter_id) {
    encounter = await db
      .prepare(`SELECT xp_reward, cred_reward, retreat_possible FROM combat_encounters WHERE id = ?`)
      .bind(combat.encounter_id)
      .first<{ xp_reward: number; cred_reward: number; retreat_possible: number }>();
  }

  // Check retreat possibility
  if (outcome === 'RETREAT' && encounter?.retreat_possible === 0) {
    return c.json({
      success: false,
      errors: [{ code: 'RETREAT_NOT_ALLOWED', message: 'Retreat is not possible in this encounter' }],
    }, 400);
  }

  // Calculate XP based on outcome
  let xpEarned = 0;
  const xpReward = encounter?.xp_reward || 0;
  const credReward = encounter?.cred_reward || 0;
  if (outcome === 'VICTORY') {
    xpEarned = xpReward;
  } else if (outcome === 'RETREAT') {
    xpEarned = Math.floor(xpReward * 0.25); // 25% XP for retreat
  } else if (outcome === 'DRAW') {
    xpEarned = Math.floor(xpReward * 0.5); // 50% XP for draw
  }
  // DEFEAT gets 0 XP

  // Update combat instance
  await db
    .prepare(
      `UPDATE combat_instances SET
        status = ?,
        ended_at = ?,
        outcome = ?,
        objectives_completed = ?,
        loot_dropped = ?,
        xp_earned = ?
       WHERE id = ?`
    )
    .bind(
      'COMPLETED',
      new Date().toISOString(),
      outcome,
      JSON.stringify(objectivesCompleted),
      JSON.stringify(loot),
      xpEarned,
      combatId
    )
    .run();

  return c.json({
    success: true,
    data: {
      combat: {
        id: combatId,
        status: 'COMPLETED',
        outcome,
        stats: {
          damageDealt: combat.damage_dealt_by_player,
          damageTaken: combat.damage_taken_by_player,
          enemiesDefeated: combat.enemies_defeated,
          roundsElapsed: combat.rounds_elapsed,
          timeElapsed: combat.time_elapsed_seconds,
        },
        rewards: {
          xpEarned,
          creditsEarned: outcome === 'VICTORY' ? credReward : 0,
          loot,
          objectivesCompleted,
        },
        endedAt: new Date().toISOString(),
      },
    },
  });
});

/**
 * GET /combat/history
 * Get completed combat history for a character.
 */
combatRoutes.get('/history', async (c) => {
  const db = c.env.DB;
  const characterId = c.req.query('characterId');
  const outcome = c.req.query('outcome');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
  const offset = parseInt(c.req.query('offset') || '0');

  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId query parameter is required' }],
    }, 400);
  }

  let query = `
    SELECT ci.*, ce.name as encounter_name, ce.difficulty_rating
    FROM combat_instances ci
    LEFT JOIN combat_encounters ce ON ci.encounter_id = ce.id
    WHERE ci.character_id = ? AND ci.status = 'COMPLETED'
  `;
  const params: unknown[] = [characterId];

  if (outcome) {
    query += ` AND ci.outcome = ?`;
    params.push(outcome);
  }

  // Count total
  const countQuery = query.replace(/SELECT[\s\S]+?FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await db.prepare(countQuery).bind(...params).first<{ total: number }>();

  query += ` ORDER BY ci.ended_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const result = await db.prepare(query).bind(...params).all<CombatInstance & {
    encounter_name: string | null;
    difficulty_rating: number | null;
  }>();

  const history = result.results.map(combat => ({
    id: combat.id,
    encounter: combat.encounter_id ? {
      id: combat.encounter_id,
      name: combat.encounter_name,
      difficulty: combat.difficulty_rating,
    } : null,
    outcome: combat.outcome,
    stats: {
      damageDealt: combat.damage_dealt_by_player,
      damageTaken: combat.damage_taken_by_player,
      enemiesDefeated: combat.enemies_defeated,
      alliesLost: combat.allies_lost,
      roundsElapsed: combat.rounds_elapsed,
      timeElapsed: combat.time_elapsed_seconds,
    },
    rewards: {
      xpEarned: combat.xp_earned,
      loot: combat.loot_dropped ? JSON.parse(combat.loot_dropped) : [],
      objectivesCompleted: combat.objectives_completed
        ? JSON.parse(combat.objectives_completed)
        : [],
    },
    achievements: combat.special_achievements
      ? JSON.parse(combat.special_achievements)
      : [],
    timing: {
      startedAt: combat.started_at,
      endedAt: combat.ended_at,
    },
  }));

  // Calculate summary stats
  const totalCombats = countResult?.total || 0;
  const victories = result.results.filter(c => c.outcome === 'VICTORY').length;
  const defeats = result.results.filter(c => c.outcome === 'DEFEAT').length;
  const retreats = result.results.filter(c => c.outcome === 'RETREAT').length;

  return c.json({
    success: true,
    data: {
      history,
      summary: {
        totalCombats,
        inCurrentPage: history.length,
        outcomes: {
          victories,
          defeats,
          retreats,
        },
      },
      pagination: {
        total: totalCombats,
        limit,
        offset,
        hasMore: offset + limit < totalCombats,
      },
    },
  });
});

// =============================================================================
// DAY 4: COMBAT ACTIONS & TURN MANAGEMENT
// =============================================================================

interface ActionResult {
  success: boolean;
  damage?: number;
  damageType?: string;
  targetId?: string;
  effects?: string[];
  criticalHit?: boolean;
  message: string;
}

/**
 * GET /combat/instances/:id/available-actions
 * Get available actions for the current entity's turn.
 */
combatRoutes.get('/instances/:id/available-actions', async (c) => {
  const db = c.env.DB;
  const combatId = c.req.param('id');

  // Get combat instance
  const combat = await db
    .prepare(`SELECT * FROM combat_instances WHERE id = ?`)
    .bind(combatId)
    .first<CombatInstance>();

  if (!combat) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Combat instance not found' }],
    }, 404);
  }

  if (combat.status !== 'ACTIVE') {
    return c.json({
      success: false,
      errors: [{ code: 'COMBAT_NOT_ACTIVE', message: 'Combat is not active' }],
    }, 400);
  }

  // Get current entity's available actions
  const currentEntityId = combat.current_turn_entity_id;
  const turnOrder = combat.turn_order ? JSON.parse(combat.turn_order) : [];
  const currentTurn = turnOrder.find((t: { id: string }) => t.id === currentEntityId);

  if (!currentTurn) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_CURRENT_TURN', message: 'No current turn entity' }],
    }, 400);
  }

  // Get all combat action definitions
  const actionsResult = await db
    .prepare(
      `SELECT id, code, name, description, action_type, action_cost,
              is_free_action, is_reaction, target_type, range_min_m, range_max_m,
              damage_formula, damage_type
       FROM combat_action_definitions
       ORDER BY action_type, action_cost, name`
    )
    .all<CombatActionDefinition>();

  // Parse participants to find valid targets
  const playerParticipants = combat.player_participants
    ? JSON.parse(combat.player_participants)
    : [];
  const enemyParticipants = combat.enemy_participants
    ? JSON.parse(combat.enemy_participants)
    : [];

  const isPlayerTurn = currentTurn.type === 'player';
  const validTargets = isPlayerTurn
    ? enemyParticipants.filter((e: { isActive?: boolean }) => e.isActive !== false)
    : playerParticipants.filter((p: { isActive?: boolean }) => p.isActive !== false);

  // Categorize actions
  const actions = actionsResult.results.map(action => ({
    id: action.id,
    code: action.code,
    name: action.name,
    description: action.description,
    type: action.action_type,
    cost: action.action_cost,
    isFreeAction: action.is_free_action === 1,
    isReaction: action.is_reaction === 1,
    targeting: {
      type: action.target_type,
      rangeMin: action.range_min_m,
      rangeMax: action.range_max_m,
    },
    damage: action.damage_formula ? {
      formula: action.damage_formula,
      type: action.damage_type,
    } : null,
  }));

  // Group by type
  const attackActions = actions.filter(a => a.type === 'ATTACK');
  const defenseActions = actions.filter(a => a.type === 'DEFEND' || a.type === 'HUNKER');
  const movementActions = actions.filter(a => a.type === 'MOVE');
  const utilityActions = actions.filter(a => !['ATTACK', 'DEFEND', 'HUNKER', 'MOVE'].includes(a.type || ''));

  return c.json({
    success: true,
    data: {
      currentTurn: {
        entityId: currentEntityId,
        entityType: currentTurn.type,
        round: combat.current_round,
      },
      actions: {
        attack: attackActions,
        defense: defenseActions,
        movement: movementActions,
        utility: utilityActions,
      },
      validTargets: validTargets.map((t: { id: string; name: string }) => ({
        id: t.id,
        name: t.name,
      })),
      actionPointsRemaining: 2, // Standard action points per turn
    },
  });
});

/**
 * POST /combat/instances/:id/action
 * Execute a combat action.
 */
combatRoutes.post('/instances/:id/action', async (c) => {
  const db = c.env.DB;
  const combatId = c.req.param('id');
  const body = await c.req.json<{
    actionId: string;
    targetId?: string;
    position?: { x: number; y: number };
  }>();

  const { actionId, targetId, position } = body;

  // Get combat instance
  const combat = await db
    .prepare(`SELECT * FROM combat_instances WHERE id = ?`)
    .bind(combatId)
    .first<CombatInstance>();

  if (!combat) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Combat instance not found' }],
    }, 404);
  }

  if (combat.status !== 'ACTIVE') {
    return c.json({
      success: false,
      errors: [{ code: 'COMBAT_NOT_ACTIVE', message: 'Combat is not active' }],
    }, 400);
  }

  // Get action definition
  const action = await db
    .prepare(`SELECT * FROM combat_action_definitions WHERE id = ? OR code = ?`)
    .bind(actionId, actionId)
    .first<CombatActionDefinition>();

  if (!action) {
    return c.json({
      success: false,
      errors: [{ code: 'INVALID_ACTION', message: 'Action not found' }],
    }, 400);
  }

  // Validate target if required
  const requiresTarget = ['SINGLE_ENEMY', 'SINGLE_ALLY', 'SINGLE_ANY'].includes(action.target_type || '');
  if (requiresTarget && !targetId) {
    return c.json({
      success: false,
      errors: [{ code: 'TARGET_REQUIRED', message: 'This action requires a target' }],
    }, 400);
  }

  // Calculate action result
  const result = calculateActionResult(action, targetId, combat);

  // Update combat stats based on action
  let damageDealt = combat.damage_dealt_by_player;
  let damageTaken = combat.damage_taken_by_player;
  let enemiesDefeated = combat.enemies_defeated;

  const turnOrder = combat.turn_order ? JSON.parse(combat.turn_order) : [];
  const currentTurn = turnOrder.find((t: { id: string }) => t.id === combat.current_turn_entity_id);
  const isPlayerAction = currentTurn?.type === 'player';

  if (result.damage && result.damage > 0) {
    if (isPlayerAction) {
      damageDealt += result.damage;
      // Check if target defeated (simplified)
      if (result.damage >= 50) {
        enemiesDefeated += 1;
      }
    } else {
      damageTaken += result.damage;
    }
  }

  // Record action in log
  const actionLog = combat.action_log ? JSON.parse(combat.action_log) : [];
  actionLog.push({
    round: combat.current_round,
    entityId: combat.current_turn_entity_id,
    actionId: action.id,
    actionCode: action.code,
    targetId,
    result,
    timestamp: new Date().toISOString(),
  });

  // Update combat instance
  await db
    .prepare(
      `UPDATE combat_instances SET
        damage_dealt_by_player = ?,
        damage_taken_by_player = ?,
        enemies_defeated = ?,
        action_log = ?
       WHERE id = ?`
    )
    .bind(damageDealt, damageTaken, enemiesDefeated, JSON.stringify(actionLog), combatId)
    .run();

  return c.json({
    success: true,
    data: {
      action: {
        id: action.id,
        code: action.code,
        name: action.name,
        type: action.action_type,
      },
      result,
      combat: {
        id: combatId,
        currentRound: combat.current_round,
        currentTurnEntity: combat.current_turn_entity_id,
        stats: {
          damageDealt,
          damageTaken,
          enemiesDefeated,
        },
      },
    },
  });
});

/**
 * Calculate the result of a combat action.
 */
function calculateActionResult(
  action: CombatActionDefinition,
  targetId: string | undefined,
  combat: CombatInstance
): ActionResult {
  // Simplified damage calculation
  let damage = 0;
  let criticalHit = false;
  const effects: string[] = [];

  if (action.damage_formula) {
    // Parse damage formula (e.g., "2d6+5" or "1d10+STR")
    const baseDamage = parseDamageFormula(action.damage_formula);

    // Check for critical hit (10% base chance + modifiers)
    const critChance = 0.1 + (action.critical_chance_modifier / 100);
    if (Math.random() < critChance) {
      criticalHit = true;
      damage = Math.floor(baseDamage * (action.critical_damage_modifier || 1.5));
      effects.push('CRITICAL_HIT');
    } else {
      damage = baseDamage;
    }

    // Apply accuracy modifier
    const hitChance = 0.8 + (action.accuracy_modifier / 100);
    if (Math.random() > hitChance) {
      damage = 0;
      return {
        success: false,
        damage: 0,
        targetId,
        effects: ['MISSED'],
        message: `${action.name} missed!`,
      };
    }
  }

  // Handle special action types
  if (action.action_type === 'DEFEND' || action.action_type === 'HUNKER') {
    effects.push('DEFENDING');
    return {
      success: true,
      targetId: combat.current_turn_entity_id,
      effects,
      message: `Took defensive stance`,
    };
  }

  if (action.action_type === 'MOVE') {
    effects.push('MOVED');
    return {
      success: true,
      effects,
      message: `Moved to new position`,
    };
  }

  if (action.action_type === 'RELOAD') {
    effects.push('RELOADED');
    return {
      success: true,
      effects,
      message: `Reloaded weapon`,
    };
  }

  // Parse status effects from action
  if (action.status_effects) {
    const statusEffects = JSON.parse(action.status_effects);
    effects.push(...statusEffects.map((s: { code: string }) => s.code));
  }

  return {
    success: true,
    damage,
    damageType: action.damage_type || undefined,
    targetId,
    effects,
    criticalHit,
    message: damage > 0
      ? `${action.name} dealt ${damage} ${action.damage_type || ''} damage${criticalHit ? ' (CRITICAL!)' : ''}`
      : `${action.name} executed successfully`,
  };
}

/**
 * Parse a damage formula and return calculated damage.
 */
function parseDamageFormula(formula: string): number {
  // Handle dice notation (e.g., "2d6+5")
  const diceMatch = formula.match(/(\d+)d(\d+)(?:\+(\d+))?/);
  if (diceMatch) {
    const numDice = parseInt(diceMatch[1]!, 10);
    const dieSize = parseInt(diceMatch[2]!, 10);
    const bonus = parseInt(diceMatch[3] || '0', 10);

    let total = 0;
    for (let i = 0; i < numDice; i++) {
      total += Math.floor(Math.random() * dieSize) + 1;
    }
    return total + bonus;
  }

  // Handle flat damage
  const flatMatch = formula.match(/^(\d+)$/);
  if (flatMatch) {
    return parseInt(flatMatch[1]!, 10);
  }

  // Default fallback
  return Math.floor(Math.random() * 10) + 5;
}

/**
 * POST /combat/instances/:id/next-turn
 * Advance to the next turn in combat.
 */
combatRoutes.post('/instances/:id/next-turn', async (c) => {
  const db = c.env.DB;
  const combatId = c.req.param('id');

  // Get combat instance
  const combat = await db
    .prepare(`SELECT * FROM combat_instances WHERE id = ?`)
    .bind(combatId)
    .first<CombatInstance>();

  if (!combat) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Combat instance not found' }],
    }, 404);
  }

  if (combat.status !== 'ACTIVE') {
    return c.json({
      success: false,
      errors: [{ code: 'COMBAT_NOT_ACTIVE', message: 'Combat is not active' }],
    }, 400);
  }

  const turnOrder = combat.turn_order ? JSON.parse(combat.turn_order) : [];
  if (turnOrder.length === 0) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_TURN_ORDER', message: 'No turn order defined' }],
    }, 400);
  }

  // Find current turn index
  const currentIndex = turnOrder.findIndex(
    (t: { id: string }) => t.id === combat.current_turn_entity_id
  );

  // Calculate next turn
  let nextIndex = (currentIndex + 1) % turnOrder.length;
  let newRound = combat.current_round;
  let roundsElapsed = combat.rounds_elapsed;

  // If we wrapped around, increment round
  if (nextIndex === 0) {
    newRound += 1;
    roundsElapsed += 1;
  }

  const nextEntity = turnOrder[nextIndex];

  // Save previous turn info BEFORE the update (mock DB mutates rows in place)
  const previousEntityId = combat.current_turn_entity_id;
  const previousRound = combat.current_round;

  // Update combat instance
  await db
    .prepare(
      `UPDATE combat_instances SET
        current_turn_entity_id = ?,
        current_round = ?,
        rounds_elapsed = ?
       WHERE id = ?`
    )
    .bind(nextEntity.id, newRound, roundsElapsed, combatId)
    .run();

  return c.json({
    success: true,
    data: {
      previousTurn: {
        entityId: previousEntityId,
        round: previousRound,
      },
      currentTurn: {
        entityId: nextEntity.id,
        entityType: nextEntity.type,
        round: newRound,
        turnIndex: nextIndex,
        totalTurns: turnOrder.length,
      },
      roundAdvanced: nextIndex === 0,
      combat: {
        id: combatId,
        roundsElapsed,
      },
    },
  });
});

/**
 * POST /combat/instances/:id/pause
 * Pause an active combat.
 */
combatRoutes.post('/instances/:id/pause', async (c) => {
  const db = c.env.DB;
  const combatId = c.req.param('id');

  // Get combat instance
  const combat = await db
    .prepare(`SELECT * FROM combat_instances WHERE id = ?`)
    .bind(combatId)
    .first<CombatInstance>();

  if (!combat) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Combat instance not found' }],
    }, 404);
  }

  if (combat.status !== 'ACTIVE') {
    return c.json({
      success: false,
      errors: [{ code: 'CANNOT_PAUSE', message: 'Only active combat can be paused' }],
    }, 400);
  }

  // Update status to PAUSED
  await db
    .prepare(`UPDATE combat_instances SET status = ? WHERE id = ?`)
    .bind('PAUSED', combatId)
    .run();

  return c.json({
    success: true,
    data: {
      combat: {
        id: combatId,
        status: 'PAUSED',
        currentRound: combat.current_round,
        currentTurnEntity: combat.current_turn_entity_id,
      },
      message: 'Combat paused',
    },
  });
});

/**
 * POST /combat/instances/:id/resume
 * Resume a paused combat.
 */
combatRoutes.post('/instances/:id/resume', async (c) => {
  const db = c.env.DB;
  const combatId = c.req.param('id');

  // Get combat instance
  const combat = await db
    .prepare(`SELECT * FROM combat_instances WHERE id = ?`)
    .bind(combatId)
    .first<CombatInstance>();

  if (!combat) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Combat instance not found' }],
    }, 404);
  }

  if (combat.status !== 'PAUSED') {
    return c.json({
      success: false,
      errors: [{ code: 'CANNOT_RESUME', message: 'Only paused combat can be resumed' }],
    }, 400);
  }

  // Update status to ACTIVE
  await db
    .prepare(`UPDATE combat_instances SET status = ? WHERE id = ?`)
    .bind('ACTIVE', combatId)
    .run();

  return c.json({
    success: true,
    data: {
      combat: {
        id: combatId,
        status: 'ACTIVE',
        currentRound: combat.current_round,
        currentTurnEntity: combat.current_turn_entity_id,
      },
      message: 'Combat resumed',
    },
  });
});

// =============================================================================
// DAY 5: CONDITIONS & STATUS EFFECTS
// =============================================================================

/**
 * POST /combat/instances/:id/apply-condition
 * Apply a condition to a participant in combat.
 */
combatRoutes.post('/instances/:id/apply-condition', async (c) => {
  const db = c.env.DB;
  const combatId = c.req.param('id');

  let body: {
    targetId: string;
    conditionId?: string;
    conditionCode?: string;
    stacks?: number;
    durationOverride?: number;
    sourceType?: string;
    sourceId?: string;
    sourceName?: string;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({
      success: false,
      errors: [{ code: 'INVALID_JSON', message: 'Invalid JSON body' }],
    }, 400);
  }

  const { targetId, conditionId, conditionCode, stacks = 1, durationOverride, sourceType, sourceId, sourceName } = body;

  if (!targetId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_TARGET', message: 'targetId is required' }],
    }, 400);
  }

  if (!conditionId && !conditionCode) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_CONDITION', message: 'Either conditionId or conditionCode is required' }],
    }, 400);
  }

  // Get combat instance
  const combat = await db
    .prepare(`SELECT * FROM combat_instances WHERE id = ?`)
    .bind(combatId)
    .first<CombatInstance>();

  if (!combat) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Combat instance not found' }],
    }, 404);
  }

  if (combat.status !== 'ACTIVE') {
    return c.json({
      success: false,
      errors: [{ code: 'COMBAT_NOT_ACTIVE', message: 'Combat is not active' }],
    }, 400);
  }

  // Get condition definition
  let condition: ConditionDefinition | null = null;
  if (conditionId) {
    condition = await db
      .prepare(`SELECT * FROM condition_definitions WHERE id = ?`)
      .bind(conditionId)
      .first<ConditionDefinition>();
  } else if (conditionCode) {
    condition = await db
      .prepare(`SELECT * FROM condition_definitions WHERE code = ?`)
      .bind(conditionCode)
      .first<ConditionDefinition>();
  }

  if (!condition) {
    return c.json({
      success: false,
      errors: [{ code: 'CONDITION_NOT_FOUND', message: 'Condition not found' }],
    }, 404);
  }

  // Check if target is a valid participant
  const participants = [
    ...(combat.player_participants ? JSON.parse(combat.player_participants) : []),
    ...(combat.enemy_participants ? JSON.parse(combat.enemy_participants) : []),
    ...(combat.neutral_participants ? JSON.parse(combat.neutral_participants) : []),
  ];

  const target = participants.find((p: { id: string }) => p.id === targetId);
  if (!target) {
    return c.json({
      success: false,
      errors: [{ code: 'TARGET_NOT_FOUND', message: 'Target is not a participant in this combat' }],
    }, 400);
  }

  // Check if condition already exists on target
  const existingCondition = await db
    .prepare(`SELECT * FROM character_conditions WHERE character_id = ? AND condition_id = ?`)
    .bind(targetId, condition.id)
    .first<CharacterCondition>();

  const duration = durationOverride ?? condition.default_duration_seconds;
  const newConditionId = `cond-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  let appliedStacks = stacks;
  let action: 'applied' | 'stacked' | 'refreshed' = 'applied';

  if (existingCondition) {
    if (condition.stacks) {
      // Condition stacks - increase stack count
      const newStacks = Math.min(existingCondition.current_stacks + stacks, condition.max_stacks);
      appliedStacks = newStacks;
      action = 'stacked';

      await db
        .prepare(`UPDATE character_conditions SET
          current_stacks = ?,
          times_refreshed = times_refreshed + 1
         WHERE id = ?`)
        .bind(newStacks, existingCondition.id)
        .run();
    } else if (condition.can_stack_duration) {
      // Duration stacking - add to duration
      const currentDuration = existingCondition.duration_remaining_seconds || 0;
      action = 'refreshed';

      await db
        .prepare(`UPDATE character_conditions SET
          duration_remaining_seconds = ?,
          times_refreshed = times_refreshed + 1
         WHERE id = ?`)
        .bind(currentDuration + duration, existingCondition.id)
        .run();
    } else {
      // Refresh duration only
      action = 'refreshed';

      await db
        .prepare(`UPDATE character_conditions SET
          duration_remaining_seconds = ?,
          times_refreshed = times_refreshed + 1
         WHERE id = ?`)
        .bind(duration, existingCondition.id)
        .run();
    }
  } else {
    // Apply new condition
    await db
      .prepare(`INSERT INTO character_conditions (
        id, character_id, condition_id, current_stacks,
        duration_remaining_seconds, source_type, source_id, source_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        newConditionId,
        targetId,
        condition.id,
        Math.min(stacks, condition.max_stacks),
        duration,
        sourceType || 'combat',
        sourceId || combatId,
        sourceName || 'Combat Effect'
      )
      .run();
  }

  // Parse on_apply_effect if exists
  let onApplyEffects: unknown[] = [];
  if (condition.on_apply_effect) {
    try {
      onApplyEffects = JSON.parse(condition.on_apply_effect);
    } catch { /* ignore */ }
  }

  return c.json({
    success: true,
    data: {
      action,
      condition: {
        id: existingCondition?.id || newConditionId,
        definitionId: condition.id,
        code: condition.code,
        name: condition.name,
        currentStacks: appliedStacks,
        durationRemaining: duration,
        isPositive: condition.is_positive === 1,
        severity: condition.severity,
      },
      target: {
        id: targetId,
        name: target.name,
      },
      effects: {
        onApply: onApplyEffects,
        statModifiers: condition.stat_modifiers ? JSON.parse(condition.stat_modifiers) : null,
        movementModifier: condition.movement_modifier,
        actionRestrictions: condition.action_restrictions ? JSON.parse(condition.action_restrictions) : null,
      },
    },
  });
});

/**
 * GET /combat/instances/:id/conditions
 * Get all active conditions in a combat instance.
 */
combatRoutes.get('/instances/:id/conditions', async (c) => {
  const db = c.env.DB;
  const combatId = c.req.param('id');
  const participantId = c.req.query('participantId');

  // Get combat instance
  const combat = await db
    .prepare(`SELECT * FROM combat_instances WHERE id = ?`)
    .bind(combatId)
    .first<CombatInstance>();

  if (!combat) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Combat instance not found' }],
    }, 404);
  }

  // Get all participants
  const participants = [
    ...(combat.player_participants ? JSON.parse(combat.player_participants) : []),
    ...(combat.enemy_participants ? JSON.parse(combat.enemy_participants) : []),
    ...(combat.neutral_participants ? JSON.parse(combat.neutral_participants) : []),
  ];

  // Get participant IDs to query
  const participantIds = participantId
    ? [participantId]
    : participants.map((p: { id: string }) => p.id);

  if (participantIds.length === 0) {
    return c.json({
      success: true,
      data: {
        conditions: [],
        byParticipant: {},
        summary: { total: 0, buffs: 0, debuffs: 0, byType: {} },
      },
    });
  }

  // Query conditions for all participants
  const placeholders = participantIds.map(() => '?').join(', ');
  const conditionsResult = await db
    .prepare(`
      SELECT cc.*, cd.code, cd.name, cd.description, cd.condition_type,
             cd.is_positive, cd.severity, cd.damage_over_time, cd.healing_over_time,
             cd.stat_modifiers, cd.movement_modifier, cd.action_restrictions,
             cd.icon_asset
      FROM character_conditions cc
      JOIN condition_definitions cd ON cc.condition_id = cd.id
      WHERE cc.character_id IN (${placeholders})
    `)
    .bind(...participantIds)
    .all<CharacterCondition & {
      code: string;
      name: string;
      description: string | null;
      condition_type: string | null;
      is_positive: number;
      severity: number;
      damage_over_time: string | null;
      healing_over_time: string | null;
      stat_modifiers: string | null;
      movement_modifier: number;
      action_restrictions: string | null;
      icon_asset: string | null;
    }>();

  const conditions = conditionsResult.results;

  // Group by participant
  const byParticipant: Record<string, unknown[]> = {};
  for (const participantIdLoop of participantIds) {
    byParticipant[participantIdLoop] = [];
  }

  let buffsCount = 0;
  let debuffsCount = 0;
  const byType: Record<string, number> = {};

  const formattedConditions = conditions.map(cond => {
    const formatted = {
      id: cond.id,
      conditionId: cond.condition_id,
      code: cond.code,
      name: cond.name,
      description: cond.description,
      type: cond.condition_type,
      icon: cond.icon_asset,
      isPositive: cond.is_positive === 1,
      severity: cond.severity,
      currentStacks: cond.current_stacks,
      durationRemaining: cond.duration_remaining_seconds,
      isPaused: cond.is_paused === 1,
      appliedAt: cond.applied_at,
      source: {
        type: cond.source_type,
        id: cond.source_id,
        name: cond.source_name,
      },
      effects: {
        damageOverTime: cond.damage_over_time ? JSON.parse(cond.damage_over_time) : null,
        healingOverTime: cond.healing_over_time ? JSON.parse(cond.healing_over_time) : null,
        statModifiers: cond.stat_modifiers ? JSON.parse(cond.stat_modifiers) : null,
        movementModifier: cond.movement_modifier,
        actionRestrictions: cond.action_restrictions ? JSON.parse(cond.action_restrictions) : null,
      },
      tracking: {
        timesTicked: cond.times_ticked,
        totalDamageDealt: cond.total_damage_dealt,
        totalHealingDone: cond.total_healing_done,
        timesRefreshed: cond.times_refreshed,
      },
      targetId: cond.character_id,
    };

    if (!byParticipant[cond.character_id]) {
      byParticipant[cond.character_id] = [];
    }
    byParticipant[cond.character_id].push(formatted);

    if (cond.is_positive === 1) {
      buffsCount++;
    } else {
      debuffsCount++;
    }

    const condType = cond.condition_type || 'unknown';
    byType[condType] = (byType[condType] || 0) + 1;

    return formatted;
  });

  return c.json({
    success: true,
    data: {
      conditions: formattedConditions,
      byParticipant,
      summary: {
        total: conditions.length,
        buffs: buffsCount,
        debuffs: debuffsCount,
        byType,
      },
    },
  });
});

/**
 * POST /combat/instances/:id/remove-condition
 * Remove a condition from a participant.
 */
combatRoutes.post('/instances/:id/remove-condition', async (c) => {
  const db = c.env.DB;
  const combatId = c.req.param('id');

  let body: {
    targetId: string;
    conditionInstanceId?: string;
    conditionCode?: string;
    removeAll?: boolean;
    removeStacks?: number;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({
      success: false,
      errors: [{ code: 'INVALID_JSON', message: 'Invalid JSON body' }],
    }, 400);
  }

  const { targetId, conditionInstanceId, conditionCode, removeAll = false, removeStacks } = body;

  if (!targetId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_TARGET', message: 'targetId is required' }],
    }, 400);
  }

  if (!conditionInstanceId && !conditionCode && !removeAll) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_CONDITION', message: 'conditionInstanceId, conditionCode, or removeAll is required' }],
    }, 400);
  }

  // Get combat instance
  const combat = await db
    .prepare(`SELECT * FROM combat_instances WHERE id = ?`)
    .bind(combatId)
    .first<CombatInstance>();

  if (!combat) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Combat instance not found' }],
    }, 404);
  }

  if (combat.status !== 'ACTIVE') {
    return c.json({
      success: false,
      errors: [{ code: 'COMBAT_NOT_ACTIVE', message: 'Combat is not active' }],
    }, 400);
  }

  let removedConditions: { id: string; code: string; name: string }[] = [];
  let action: 'removed' | 'reduced' | 'all_removed' = 'removed';

  if (removeAll) {
    // Remove all conditions from target
    const conditions = await db
      .prepare(`
        SELECT cc.id, cd.code, cd.name
        FROM character_conditions cc
        JOIN condition_definitions cd ON cc.condition_id = cd.id
        WHERE cc.character_id = ?
      `)
      .bind(targetId)
      .all<{ id: string; code: string; name: string }>();

    removedConditions = conditions.results;
    action = 'all_removed';

    await db
      .prepare(`DELETE FROM character_conditions WHERE character_id = ?`)
      .bind(targetId)
      .run();
  } else if (conditionInstanceId) {
    // Remove specific condition instance
    const condition = await db
      .prepare(`
        SELECT cc.*, cd.code, cd.name, cd.on_expire_effect
        FROM character_conditions cc
        JOIN condition_definitions cd ON cc.condition_id = cd.id
        WHERE cc.id = ? AND cc.character_id = ?
      `)
      .bind(conditionInstanceId, targetId)
      .first<CharacterCondition & { code: string; name: string; on_expire_effect: string | null }>();

    if (!condition) {
      return c.json({
        success: false,
        errors: [{ code: 'CONDITION_NOT_FOUND', message: 'Condition not found on target' }],
      }, 404);
    }

    if (removeStacks && condition.current_stacks > removeStacks) {
      // Just reduce stacks
      await db
        .prepare(`UPDATE character_conditions SET current_stacks = current_stacks - ? WHERE id = ?`)
        .bind(removeStacks, conditionInstanceId)
        .run();
      action = 'reduced';
      removedConditions = [{ id: condition.id, code: condition.code, name: condition.name }];
    } else {
      // Remove entirely
      await db
        .prepare(`DELETE FROM character_conditions WHERE id = ?`)
        .bind(conditionInstanceId)
        .run();
      removedConditions = [{ id: condition.id, code: condition.code, name: condition.name }];
    }
  } else if (conditionCode) {
    // Remove condition by code
    const condition = await db
      .prepare(`
        SELECT cc.*, cd.code, cd.name
        FROM character_conditions cc
        JOIN condition_definitions cd ON cc.condition_id = cd.id
        WHERE cd.code = ? AND cc.character_id = ?
      `)
      .bind(conditionCode, targetId)
      .first<CharacterCondition & { code: string; name: string }>();

    if (!condition) {
      return c.json({
        success: false,
        errors: [{ code: 'CONDITION_NOT_FOUND', message: 'Condition not found on target' }],
      }, 404);
    }

    if (removeStacks && condition.current_stacks > removeStacks) {
      await db
        .prepare(`UPDATE character_conditions SET current_stacks = current_stacks - ? WHERE id = ?`)
        .bind(removeStacks, condition.id)
        .run();
      action = 'reduced';
    } else {
      await db
        .prepare(`DELETE FROM character_conditions WHERE id = ?`)
        .bind(condition.id)
        .run();
    }
    removedConditions = [{ id: condition.id, code: condition.code, name: condition.name }];
  }

  return c.json({
    success: true,
    data: {
      action,
      removedConditions,
      target: targetId,
      removedCount: removedConditions.length,
      stacksRemoved: removeStacks || null,
    },
  });
});

/**
 * POST /combat/instances/:id/tick-conditions
 * Process condition effects (damage over time, healing, duration countdown).
 */
combatRoutes.post('/instances/:id/tick-conditions', async (c) => {
  const db = c.env.DB;
  const combatId = c.req.param('id');

  let body: {
    tickDuration?: number;
    participantId?: string;
  } = {};

  try {
    body = await c.req.json();
  } catch { /* empty body is ok */ }

  const tickDuration = body.tickDuration ?? 6; // Default 6 seconds (1 combat round)
  const participantId = body.participantId;

  // Get combat instance
  const combat = await db
    .prepare(`SELECT * FROM combat_instances WHERE id = ?`)
    .bind(combatId)
    .first<CombatInstance>();

  if (!combat) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Combat instance not found' }],
    }, 404);
  }

  if (combat.status !== 'ACTIVE') {
    return c.json({
      success: false,
      errors: [{ code: 'COMBAT_NOT_ACTIVE', message: 'Combat is not active' }],
    }, 400);
  }

  // Get all participants
  const participants = [
    ...(combat.player_participants ? JSON.parse(combat.player_participants) : []),
    ...(combat.enemy_participants ? JSON.parse(combat.enemy_participants) : []),
    ...(combat.neutral_participants ? JSON.parse(combat.neutral_participants) : []),
  ];

  const participantIds = participantId
    ? [participantId]
    : participants.map((p: { id: string }) => p.id);

  if (participantIds.length === 0) {
    return c.json({
      success: true,
      data: {
        processed: [],
        expired: [],
        totalDamage: 0,
        totalHealing: 0,
      },
    });
  }

  // Get active conditions
  const placeholders = participantIds.map(() => '?').join(', ');
  const conditionsResult = await db
    .prepare(`
      SELECT cc.*, cd.code, cd.name, cd.damage_over_time, cd.healing_over_time,
             cd.on_tick_effect, cd.on_expire_effect
      FROM character_conditions cc
      JOIN condition_definitions cd ON cc.condition_id = cd.id
      WHERE cc.character_id IN (${placeholders}) AND cc.is_paused = 0
    `)
    .bind(...participantIds)
    .all<CharacterCondition & {
      code: string;
      name: string;
      damage_over_time: string | null;
      healing_over_time: string | null;
      on_tick_effect: string | null;
      on_expire_effect: string | null;
    }>();

  const conditions = conditionsResult.results;
  const processed: unknown[] = [];
  const expired: unknown[] = [];
  let totalDamage = 0;
  let totalHealing = 0;

  for (const cond of conditions) {
    let damageThisTick = 0;
    let healingThisTick = 0;

    // Process damage over time
    if (cond.damage_over_time) {
      try {
        const dot = JSON.parse(cond.damage_over_time);
        const damagePerTick = (dot.damagePerSecond || 0) * tickDuration * cond.current_stacks;
        damageThisTick = Math.floor(damagePerTick);
        totalDamage += damageThisTick;
      } catch { /* ignore */ }
    }

    // Process healing over time
    if (cond.healing_over_time) {
      try {
        const hot = JSON.parse(cond.healing_over_time);
        const healingPerTick = (hot.healingPerSecond || 0) * tickDuration * cond.current_stacks;
        healingThisTick = Math.floor(healingPerTick);
        totalHealing += healingThisTick;
      } catch { /* ignore */ }
    }

    // Update duration
    const newDuration = cond.duration_remaining_seconds !== null
      ? Math.max(0, cond.duration_remaining_seconds - tickDuration)
      : null;

    const hasExpired = newDuration !== null && newDuration <= 0;

    if (hasExpired) {
      // Condition expired - remove it
      await db
        .prepare(`DELETE FROM character_conditions WHERE id = ?`)
        .bind(cond.id)
        .run();

      expired.push({
        id: cond.id,
        code: cond.code,
        name: cond.name,
        targetId: cond.character_id,
        finalDamage: damageThisTick,
        finalHealing: healingThisTick,
        totalDamageDealt: cond.total_damage_dealt + damageThisTick,
        totalHealingDone: cond.total_healing_done + healingThisTick,
      });
    } else {
      // Update condition
      await db
        .prepare(`UPDATE character_conditions SET
          duration_remaining_seconds = ?,
          times_ticked = times_ticked + 1,
          total_damage_dealt = total_damage_dealt + ?,
          total_healing_done = total_healing_done + ?
         WHERE id = ?`)
        .bind(newDuration, damageThisTick, healingThisTick, cond.id)
        .run();

      processed.push({
        id: cond.id,
        code: cond.code,
        name: cond.name,
        targetId: cond.character_id,
        damageDealt: damageThisTick,
        healingDone: healingThisTick,
        durationRemaining: newDuration,
        currentStacks: cond.current_stacks,
      });
    }
  }

  return c.json({
    success: true,
    data: {
      tickDuration,
      processed,
      expired,
      totalDamage,
      totalHealing,
      summary: {
        conditionsProcessed: processed.length,
        conditionsExpired: expired.length,
        netHealthChange: totalHealing - totalDamage,
      },
    },
  });
});

// =============================================================================
// DAY 6: ADDICTION SYSTEM
// =============================================================================

/**
 * GET /combat/addictions
 * List all addiction type definitions.
 */
combatRoutes.get('/addictions', async (c) => {
  const db = c.env.DB;
  const substanceId = c.req.query('substanceId');
  const minWithdrawalLethality = c.req.query('minLethality');

  let sql = `SELECT * FROM addiction_types WHERE 1=1`;
  const params: unknown[] = [];

  if (substanceId) {
    sql += ` AND substance_id = ?`;
    params.push(substanceId);
  }

  if (minWithdrawalLethality) {
    sql += ` AND withdrawal_lethality >= ?`;
    params.push(parseFloat(minWithdrawalLethality));
  }

  const result = await db
    .prepare(sql)
    .bind(...params)
    .all<AddictionType>();

  const addictions = result.results.map(addiction => ({
    id: addiction.id,
    code: addiction.code,
    name: addiction.name,
    description: addiction.description,
    substanceId: addiction.substance_id,
    progression: {
      toleranceRate: addiction.tolerance_rate,
      dependenceRate: addiction.dependence_rate,
      decayRatePerDay: addiction.decay_rate_per_day,
      stages: addiction.stages ? JSON.parse(addiction.stages) : [],
    },
    withdrawal: {
      onsetHours: addiction.withdrawal_onset_hours,
      peakHours: addiction.withdrawal_peak_hours,
      durationHours: addiction.withdrawal_duration_hours,
      lethality: addiction.withdrawal_lethality,
    },
    treatment: {
      cost: addiction.treatment_cost,
      durationDays: addiction.treatment_duration_days,
      relapseRisk: addiction.relapse_risk,
    },
    cravingStrengthBase: addiction.craving_strength_base,
  }));

  return c.json({
    success: true,
    data: {
      addictions,
      count: addictions.length,
    },
  });
});

/**
 * GET /combat/addictions/:id
 * Get detailed addiction type information.
 */
combatRoutes.get('/addictions/:id', async (c) => {
  const db = c.env.DB;
  const addictionId = c.req.param('id');

  // Try by ID first, then by code
  let addiction = await db
    .prepare(`SELECT * FROM addiction_types WHERE id = ?`)
    .bind(addictionId)
    .first<AddictionType>();

  if (!addiction) {
    addiction = await db
      .prepare(`SELECT * FROM addiction_types WHERE code = ?`)
      .bind(addictionId)
      .first<AddictionType>();
  }

  if (!addiction) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Addiction type not found' }],
    }, 404);
  }

  return c.json({
    success: true,
    data: {
      id: addiction.id,
      code: addiction.code,
      name: addiction.name,
      description: addiction.description,
      substanceId: addiction.substance_id,
      progression: {
        toleranceRate: addiction.tolerance_rate,
        dependenceRate: addiction.dependence_rate,
        decayRatePerDay: addiction.decay_rate_per_day,
        stages: addiction.stages ? JSON.parse(addiction.stages) : [],
      },
      withdrawal: {
        onsetHours: addiction.withdrawal_onset_hours,
        peakHours: addiction.withdrawal_peak_hours,
        durationHours: addiction.withdrawal_duration_hours,
        effects: addiction.withdrawal_effects ? JSON.parse(addiction.withdrawal_effects) : [],
        lethality: addiction.withdrawal_lethality,
      },
      treatment: {
        methods: addiction.treatment_methods ? JSON.parse(addiction.treatment_methods) : [],
        cost: addiction.treatment_cost,
        durationDays: addiction.treatment_duration_days,
        relapseRisk: addiction.relapse_risk,
      },
      cravings: {
        strengthBase: addiction.craving_strength_base,
        triggers: addiction.craving_triggers ? JSON.parse(addiction.craving_triggers) : [],
        responseOptions: addiction.craving_response_options ? JSON.parse(addiction.craving_response_options) : [],
      },
    },
  });
});

/**
 * POST /combat/instances/:id/apply-addiction
 * Apply or progress an addiction for a character during combat (e.g., using a stim).
 */
combatRoutes.post('/instances/:id/apply-addiction', async (c) => {
  const db = c.env.DB;
  const combatId = c.req.param('id');

  let body: {
    characterId: string;
    addictionId?: string;
    addictionCode?: string;
    dosage?: number;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({
      success: false,
      errors: [{ code: 'INVALID_JSON', message: 'Invalid JSON body' }],
    }, 400);
  }

  const { characterId, addictionId, addictionCode, dosage = 1 } = body;

  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_CHARACTER', message: 'characterId is required' }],
    }, 400);
  }

  if (!addictionId && !addictionCode) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_ADDICTION', message: 'Either addictionId or addictionCode is required' }],
    }, 400);
  }

  // Get combat instance
  const combat = await db
    .prepare(`SELECT * FROM combat_instances WHERE id = ?`)
    .bind(combatId)
    .first<CombatInstance>();

  if (!combat) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Combat instance not found' }],
    }, 404);
  }

  if (combat.status !== 'ACTIVE') {
    return c.json({
      success: false,
      errors: [{ code: 'COMBAT_NOT_ACTIVE', message: 'Combat is not active' }],
    }, 400);
  }

  // Get addiction type
  let addictionType: AddictionType | null = null;
  if (addictionId) {
    addictionType = await db
      .prepare(`SELECT * FROM addiction_types WHERE id = ?`)
      .bind(addictionId)
      .first<AddictionType>();
  } else if (addictionCode) {
    addictionType = await db
      .prepare(`SELECT * FROM addiction_types WHERE code = ?`)
      .bind(addictionCode)
      .first<AddictionType>();
  }

  if (!addictionType) {
    return c.json({
      success: false,
      errors: [{ code: 'ADDICTION_NOT_FOUND', message: 'Addiction type not found' }],
    }, 404);
  }

  // Check if character already has this addiction
  const existingAddiction = await db
    .prepare(`SELECT * FROM character_addictions WHERE character_id = ? AND addiction_type_id = ?`)
    .bind(characterId, addictionType.id)
    .first<CharacterAddiction>();

  const now = new Date().toISOString();
  let action: 'created' | 'progressed' = 'created';
  let newTolerance = addictionType.tolerance_rate * dosage;
  let newDependence = addictionType.dependence_rate * dosage;
  let newStage = 1;
  let totalUses = dosage;
  let withdrawalCleared = false;

  if (existingAddiction) {
    action = 'progressed';
    newTolerance = Math.min(1.0, existingAddiction.tolerance_level + (addictionType.tolerance_rate * dosage));
    newDependence = Math.min(1.0, existingAddiction.dependence_level + (addictionType.dependence_rate * dosage));
    totalUses = existingAddiction.times_used_total + dosage;

    // Calculate stage based on dependence
    const stages = addictionType.stages ? JSON.parse(addictionType.stages) : [];
    newStage = 1;
    for (let i = stages.length - 1; i >= 0; i--) {
      if (newDependence >= (stages[i]?.threshold || 0)) {
        newStage = i + 1;
        break;
      }
    }

    // Clear withdrawal if using
    withdrawalCleared = existingAddiction.in_withdrawal === 1;

    await db
      .prepare(`UPDATE character_addictions SET
        tolerance_level = ?,
        dependence_level = ?,
        current_stage = ?,
        times_used_total = ?,
        last_use = ?,
        in_withdrawal = 0,
        withdrawal_stage = 0,
        withdrawal_started = NULL,
        current_craving_strength = 0
       WHERE id = ?`)
      .bind(newTolerance, newDependence, newStage, totalUses, now, existingAddiction.id)
      .run();
  } else {
    // Create new addiction
    const newAddictionId = `add-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await db
      .prepare(`INSERT INTO character_addictions (
        id, character_id, addiction_type_id, tolerance_level, dependence_level,
        current_stage, times_used_total, last_use
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        newAddictionId,
        characterId,
        addictionType.id,
        newTolerance,
        newDependence,
        newStage,
        totalUses,
        now
      )
      .run();
  }

  return c.json({
    success: true,
    data: {
      action,
      addiction: {
        typeId: addictionType.id,
        code: addictionType.code,
        name: addictionType.name,
      },
      state: {
        stage: newStage,
        toleranceLevel: newTolerance,
        dependenceLevel: newDependence,
        totalUses,
      },
      effects: {
        withdrawalCleared,
        toleranceGain: addictionType.tolerance_rate * dosage,
        dependenceGain: addictionType.dependence_rate * dosage,
      },
      character: characterId,
    },
  });
});

/**
 * GET /combat/characters/:characterId/addictions
 * Get all addictions for a character.
 */
combatRoutes.get('/characters/:characterId/addictions', async (c) => {
  const db = c.env.DB;
  const characterId = c.req.param('characterId');
  const activeOnly = c.req.query('activeOnly') === 'true';

  let sql = `
    SELECT ca.*, at.code, at.name, at.description, at.stages,
           at.withdrawal_onset_hours, at.withdrawal_peak_hours, at.withdrawal_effects
    FROM character_addictions ca
    JOIN addiction_types at ON ca.addiction_type_id = at.id
    WHERE ca.character_id = ?
  `;

  if (activeOnly) {
    sql += ` AND ca.dependence_level > 0`;
  }

  const result = await db
    .prepare(sql)
    .bind(characterId)
    .all<CharacterAddiction & {
      code: string;
      name: string;
      description: string | null;
      stages: string | null;
      withdrawal_onset_hours: number;
      withdrawal_peak_hours: number;
      withdrawal_effects: string | null;
    }>();

  const addictions = result.results.map(addiction => {
    // Calculate hours since last use
    const hoursSinceUse = addiction.last_use
      ? (Date.now() - new Date(addiction.last_use).getTime()) / (1000 * 60 * 60)
      : null;

    // Determine withdrawal status
    const shouldBeInWithdrawal = hoursSinceUse !== null &&
      hoursSinceUse >= addiction.withdrawal_onset_hours &&
      addiction.dependence_level > 0.2;

    return {
      id: addiction.id,
      typeId: addiction.addiction_type_id,
      code: addiction.code,
      name: addiction.name,
      description: addiction.description,
      state: {
        stage: addiction.current_stage,
        toleranceLevel: addiction.tolerance_level,
        dependenceLevel: addiction.dependence_level,
        totalUses: addiction.times_used_total,
        lastUse: addiction.last_use,
        hoursSinceUse,
      },
      withdrawal: {
        inWithdrawal: addiction.in_withdrawal === 1,
        shouldBeInWithdrawal,
        stage: addiction.withdrawal_stage,
        started: addiction.withdrawal_started,
        effects: addiction.withdrawal_effects ? JSON.parse(addiction.withdrawal_effects) : [],
      },
      treatment: {
        inTreatment: addiction.in_treatment === 1,
        progress: addiction.treatment_progress,
        method: addiction.treatment_method,
      },
      history: {
        recoveryAttempts: addiction.recovery_attempts,
        relapses: addiction.relapses,
        longestCleanStreakHours: addiction.longest_clean_streak_hours,
      },
      cravings: {
        currentStrength: addiction.current_craving_strength,
        resisted: addiction.cravings_resisted,
        succumbed: addiction.cravings_succumbed,
      },
    };
  });

  // Calculate summary
  const inWithdrawalCount = addictions.filter(a => a.withdrawal.inWithdrawal).length;
  const inTreatmentCount = addictions.filter(a => a.treatment.inTreatment).length;
  const highDependenceCount = addictions.filter(a => a.state.dependenceLevel >= 0.7).length;

  return c.json({
    success: true,
    data: {
      addictions,
      count: addictions.length,
      summary: {
        inWithdrawal: inWithdrawalCount,
        inTreatment: inTreatmentCount,
        highDependence: highDependenceCount,
        totalDependence: addictions.reduce((sum, a) => sum + a.state.dependenceLevel, 0),
      },
    },
  });
});

/**
 * POST /combat/instances/:id/withdrawal-check
 * Check and apply withdrawal effects for a character in combat.
 */
combatRoutes.post('/instances/:id/withdrawal-check', async (c) => {
  const db = c.env.DB;
  const combatId = c.req.param('id');

  let body: {
    characterId: string;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({
      success: false,
      errors: [{ code: 'INVALID_JSON', message: 'Invalid JSON body' }],
    }, 400);
  }

  const { characterId } = body;

  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_CHARACTER', message: 'characterId is required' }],
    }, 400);
  }

  // Get combat instance
  const combat = await db
    .prepare(`SELECT * FROM combat_instances WHERE id = ?`)
    .bind(combatId)
    .first<CombatInstance>();

  if (!combat) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Combat instance not found' }],
    }, 404);
  }

  if (combat.status !== 'ACTIVE') {
    return c.json({
      success: false,
      errors: [{ code: 'COMBAT_NOT_ACTIVE', message: 'Combat is not active' }],
    }, 400);
  }

  // Get character's addictions with type info
  const addictionsResult = await db
    .prepare(`
      SELECT ca.*, at.code, at.name, at.withdrawal_onset_hours, at.withdrawal_peak_hours,
             at.withdrawal_duration_hours, at.withdrawal_effects, at.withdrawal_lethality
      FROM character_addictions ca
      JOIN addiction_types at ON ca.addiction_type_id = at.id
      WHERE ca.character_id = ? AND ca.dependence_level > 0.1
    `)
    .bind(characterId)
    .all<CharacterAddiction & {
      code: string;
      name: string;
      withdrawal_onset_hours: number;
      withdrawal_peak_hours: number;
      withdrawal_duration_hours: number;
      withdrawal_effects: string | null;
      withdrawal_lethality: number;
    }>();

  const now = Date.now();
  const withdrawalEffects: Array<{
    addictionCode: string;
    addictionName: string;
    stage: string;
    effects: unknown[];
    lethalityRisk: number;
  }> = [];
  const triggeredWithdrawals: string[] = [];
  const conditionsToApply: Array<{ code: string; name: string }> = [];

  for (const addiction of addictionsResult.results) {
    if (!addiction.last_use) continue;

    const hoursSinceUse = (now - new Date(addiction.last_use).getTime()) / (1000 * 60 * 60);

    if (hoursSinceUse >= addiction.withdrawal_onset_hours) {
      let withdrawalStage = 'early';
      let stageMultiplier = 0.5;

      if (hoursSinceUse >= addiction.withdrawal_peak_hours) {
        withdrawalStage = 'peak';
        stageMultiplier = 1.0;
      } else if (hoursSinceUse >= addiction.withdrawal_onset_hours + (addiction.withdrawal_peak_hours - addiction.withdrawal_onset_hours) / 2) {
        withdrawalStage = 'mid';
        stageMultiplier = 0.75;
      }

      // Recovery phase
      if (hoursSinceUse >= addiction.withdrawal_duration_hours) {
        withdrawalStage = 'recovery';
        stageMultiplier = 0.25;
      }

      const effects = addiction.withdrawal_effects ? JSON.parse(addiction.withdrawal_effects) : [];
      const scaledEffects = effects.map((e: { type: string; value: number; condition?: string }) => ({
        ...e,
        value: Math.floor(e.value * stageMultiplier * addiction.dependence_level),
        condition: e.condition,
      }));

      withdrawalEffects.push({
        addictionCode: addiction.code,
        addictionName: addiction.name,
        stage: withdrawalStage,
        effects: scaledEffects,
        lethalityRisk: addiction.withdrawal_lethality * stageMultiplier * addiction.dependence_level,
      });

      // Track which conditions to apply
      for (const effect of scaledEffects) {
        if (effect.condition) {
          conditionsToApply.push({ code: effect.condition, name: effect.type });
        }
      }

      // Update addiction withdrawal status if not already
      if (addiction.in_withdrawal === 0) {
        triggeredWithdrawals.push(addiction.code);
        await db
          .prepare(`UPDATE character_addictions SET
            in_withdrawal = 1,
            withdrawal_stage = ?,
            withdrawal_started = ?
           WHERE id = ?`)
          .bind(withdrawalStage === 'early' ? 1 : withdrawalStage === 'mid' ? 2 : withdrawalStage === 'peak' ? 3 : 4, new Date().toISOString(), addiction.id)
          .run();
      }
    }
  }

  // Calculate total effects
  const totalPenalty = withdrawalEffects.reduce((sum, w) => {
    const effectPenalties = w.effects.reduce((eSum: number, e: { value?: number }) => eSum + (e.value || 0), 0);
    return sum + effectPenalties;
  }, 0);

  const maxLethalityRisk = Math.max(0, ...withdrawalEffects.map(w => w.lethalityRisk));

  return c.json({
    success: true,
    data: {
      character: characterId,
      withdrawalEffects,
      triggeredWithdrawals,
      conditionsToApply,
      summary: {
        addictionsChecked: addictionsResult.results.length,
        inWithdrawal: withdrawalEffects.length,
        newWithdrawals: triggeredWithdrawals.length,
        totalPenalty,
        maxLethalityRisk,
      },
    },
  });
});
