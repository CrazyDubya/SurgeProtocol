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
