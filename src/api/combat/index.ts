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
