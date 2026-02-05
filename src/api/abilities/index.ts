/**
 * Surge Protocol - Abilities & Skills Routes
 *
 * Endpoints:
 *
 * Ability Definitions:
 * - GET /abilities - List all ability definitions
 * - GET /abilities/categories - List ability categories
 * - GET /abilities/:id - Get ability details
 *
 * Character Abilities:
 * - GET /abilities/character - Get character's unlocked abilities
 * - GET /abilities/character/equipped - Get currently equipped abilities
 * - POST /abilities/:id/unlock - Unlock an ability
 * - PATCH /abilities/:id/equip - Equip/unequip an ability
 * - POST /abilities/:id/use - Use an ability (for tracking)
 * - POST /abilities/:id/upgrade - Upgrade ability rank
 *
 * Passives:
 * - GET /abilities/passives - List passive definitions
 * - GET /abilities/passives/:id - Get passive details
 * - GET /abilities/passives/character - Get character's active passives
 *
 * Skills:
 * - GET /abilities/skills - List skill definitions
 * - GET /abilities/skills/:id - Get skill details
 * - GET /abilities/skills/character - Get character's skill levels
 * - POST /abilities/skills/:id/train - Add XP to a skill
 * - POST /abilities/skills/:id/use - Record skill usage
 */

import { Hono } from 'hono';

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

interface AbilityDefinition {
  id: string;
  code: string;
  name: string;
  description: string | null;
  detailed_description: string | null;
  flavor_text: string | null;
  ability_type: string;
  category: string;
  is_signature: number;
  is_ultimate: number;
  source_type: string | null;
  source_track_id: string | null;
  source_specialization_id: string | null;
  source_augment_id: string | null;
  source_item_id: string | null;
  required_tier: number;
  required_level: number | null;
  prerequisite_abilities: string | null;
  required_attributes: string | null;
  required_skills: string | null;
  resource_cost: string | null;
  cooldown_seconds: number | null;
  charges: number | null;
  charge_recovery: string | null;
  humanity_cost: number | null;
  activation_type: string | null;
  activation_time: string | null;
  range: string | null;
  area_of_effect: string | null;
  duration: string | null;
  concentration_required: number;
  primary_effect: string | null;
  secondary_effects: string | null;
  scaling: string | null;
  synergies: string | null;
  has_ranks: number;
  max_rank: number | null;
  rank_effects: string | null;
  upgrade_cost: string | null;
  created_at: string;
  updated_at: string;
}

interface CharacterAbility {
  id: string;
  character_id: string;
  ability_id: string;
  acquired_at: string;
  is_unlocked: number;
  is_equipped: number;
  current_rank: number;
  current_charges: number | null;
  cooldown_remaining: number | null;
  is_on_cooldown: number;
  custom_name: string | null;
  modifier_augments: string | null;
  modifier_items: string | null;
  effectiveness_multiplier: number;
  times_used: number;
  successful_uses: number;
  damage_dealt_total: number;
  targets_affected_total: number;
  last_used: string | null;
  xp_invested: number;
  xp_to_next_rank: number | null;
  created_at: string;
  updated_at: string;
}

interface PassiveDefinition {
  id: string;
  code: string;
  name: string;
  description: string | null;
  source_type: string | null;
  source_id: string | null;
  required_tier: number;
  prerequisite_passives: string | null;
  required_condition: string | null;
  effect_type: string | null;
  effect_target: string | null;
  effect_value: number | null;
  effect_is_percentage: number;
  stacks: number;
  max_stacks: number | null;
  trigger_condition: string | null;
  trigger_chance: number | null;
  internal_cooldown: number | null;
  is_hidden: number;
  conflicts_with: string | null;
  synergizes_with: string | null;
  created_at: string;
  updated_at: string;
}

interface SkillDefinition {
  id: string;
  code: string;
  name: string;
  description: string | null;
  governing_attribute_id: string | null;
  category: string;
  max_level: number;
  xp_per_level: string | null;
  training_available: number;
  requires_teacher: number;
  prerequisite_skills: string | null;
  required_tier: number;
  required_track: string | null;
  check_difficulty_base: number | null;
  critical_success_threshold: number | null;
  critical_failure_threshold: number | null;
  can_assist: number;
  can_retry: number;
  retry_penalty: number | null;
  has_specializations: number;
  specialization_definitions: string | null;
  created_at: string;
  updated_at: string;
}

interface CharacterSkill {
  id: string;
  character_id: string;
  skill_id: string;
  current_level: number;
  current_xp: number;
  xp_to_next_level: number | null;
  bonus_from_augments: number;
  bonus_from_items: number;
  temporary_bonus: number;
  temporary_penalty: number;
  times_used: number;
  successes: number;
  failures: number;
  critical_successes: number;
  critical_failures: number;
  last_used: string | null;
  specializations_unlocked: string | null;
  specialization_levels: string | null;
  created_at: string;
  updated_at: string;
}

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

function formatAbilityDefinition(row: AbilityDefinition) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    detailed_description: row.detailed_description,
    flavor_text: row.flavor_text,
    ability_type: row.ability_type,
    category: row.category,
    is_signature: Boolean(row.is_signature),
    is_ultimate: Boolean(row.is_ultimate),
    source: {
      type: row.source_type,
      track_id: row.source_track_id,
      specialization_id: row.source_specialization_id,
      augment_id: row.source_augment_id,
      item_id: row.source_item_id,
    },
    requirements: {
      tier: row.required_tier,
      level: row.required_level,
      prerequisite_abilities: parseJsonField<string[]>(row.prerequisite_abilities, []),
      attributes: parseJsonField<Record<string, number>>(row.required_attributes, {}),
      skills: parseJsonField<Record<string, number>>(row.required_skills, {}),
    },
    costs: {
      resources: parseJsonField<Record<string, number>>(row.resource_cost, {}),
      cooldown_seconds: row.cooldown_seconds,
      charges: row.charges,
      charge_recovery: row.charge_recovery,
      humanity_cost: row.humanity_cost,
    },
    activation: {
      type: row.activation_type,
      time: row.activation_time,
      range: row.range,
      area_of_effect: parseJsonField(row.area_of_effect, null),
      duration: row.duration,
      concentration_required: Boolean(row.concentration_required),
    },
    effects: {
      primary: parseJsonField(row.primary_effect, null),
      secondary: parseJsonField<object[]>(row.secondary_effects, []),
      scaling: parseJsonField(row.scaling, null),
      synergies: parseJsonField<string[]>(row.synergies, []),
    },
    upgrades: {
      has_ranks: Boolean(row.has_ranks),
      max_rank: row.max_rank,
      rank_effects: parseJsonField(row.rank_effects, null),
      upgrade_cost: parseJsonField(row.upgrade_cost, null),
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function formatCharacterAbility(row: CharacterAbility, definition?: AbilityDefinition) {
  const base = {
    id: row.id,
    character_id: row.character_id,
    ability_id: row.ability_id,
    acquired_at: row.acquired_at,
    is_unlocked: Boolean(row.is_unlocked),
    is_equipped: Boolean(row.is_equipped),
    current_rank: row.current_rank,
    current_charges: row.current_charges,
    cooldown: {
      remaining: row.cooldown_remaining,
      is_on_cooldown: Boolean(row.is_on_cooldown),
    },
    customization: {
      custom_name: row.custom_name,
      modifier_augments: parseJsonField<string[]>(row.modifier_augments, []),
      modifier_items: parseJsonField<string[]>(row.modifier_items, []),
      effectiveness_multiplier: row.effectiveness_multiplier,
    },
    stats: {
      times_used: row.times_used,
      successful_uses: row.successful_uses,
      damage_dealt_total: row.damage_dealt_total,
      targets_affected_total: row.targets_affected_total,
      last_used: row.last_used,
    },
    progression: {
      xp_invested: row.xp_invested,
      xp_to_next_rank: row.xp_to_next_rank,
    },
  };

  if (definition) {
    return {
      ...base,
      definition: formatAbilityDefinition(definition),
    };
  }

  return base;
}

function formatPassiveDefinition(row: PassiveDefinition) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    source: {
      type: row.source_type,
      id: row.source_id,
    },
    requirements: {
      tier: row.required_tier,
      prerequisite_passives: parseJsonField<string[]>(row.prerequisite_passives, []),
      condition: row.required_condition,
    },
    effect: {
      type: row.effect_type,
      target: row.effect_target,
      value: row.effect_value,
      is_percentage: Boolean(row.effect_is_percentage),
      stacks: Boolean(row.stacks),
      max_stacks: row.max_stacks,
    },
    trigger: {
      condition: row.trigger_condition,
      chance: row.trigger_chance,
      internal_cooldown: row.internal_cooldown,
    },
    meta: {
      is_hidden: Boolean(row.is_hidden),
      conflicts_with: parseJsonField<string[]>(row.conflicts_with, []),
      synergizes_with: parseJsonField<string[]>(row.synergizes_with, []),
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function formatSkillDefinition(row: SkillDefinition) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    governing_attribute_id: row.governing_attribute_id,
    category: row.category,
    progression: {
      max_level: row.max_level,
      xp_per_level: parseJsonField<number[]>(row.xp_per_level, []),
      training_available: Boolean(row.training_available),
      requires_teacher: Boolean(row.requires_teacher),
    },
    requirements: {
      prerequisite_skills: parseJsonField<string[]>(row.prerequisite_skills, []),
      tier: row.required_tier,
      track: row.required_track,
    },
    mechanics: {
      check_difficulty_base: row.check_difficulty_base,
      critical_success_threshold: row.critical_success_threshold,
      critical_failure_threshold: row.critical_failure_threshold,
      can_assist: Boolean(row.can_assist),
      can_retry: Boolean(row.can_retry),
      retry_penalty: row.retry_penalty,
    },
    specializations: {
      has_specializations: Boolean(row.has_specializations),
      definitions: parseJsonField(row.specialization_definitions, null),
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function formatCharacterSkill(row: CharacterSkill, definition?: SkillDefinition) {
  const base = {
    id: row.id,
    character_id: row.character_id,
    skill_id: row.skill_id,
    level: {
      current: row.current_level,
      xp: row.current_xp,
      xp_to_next: row.xp_to_next_level,
    },
    bonuses: {
      from_augments: row.bonus_from_augments,
      from_items: row.bonus_from_items,
      temporary: row.temporary_bonus,
      temporary_penalty: row.temporary_penalty,
      effective_level: row.current_level + row.bonus_from_augments + row.bonus_from_items + row.temporary_bonus - row.temporary_penalty,
    },
    stats: {
      times_used: row.times_used,
      successes: row.successes,
      failures: row.failures,
      critical_successes: row.critical_successes,
      critical_failures: row.critical_failures,
      last_used: row.last_used,
      success_rate: row.times_used > 0 ? (row.successes / row.times_used) : 0,
    },
    specializations: {
      unlocked: parseJsonField<string[]>(row.specializations_unlocked, []),
      levels: parseJsonField<Record<string, number>>(row.specialization_levels, {}),
    },
  };

  if (definition) {
    return {
      ...base,
      definition: formatSkillDefinition(definition),
    };
  }

  return base;
}

// =============================================================================
// ROUTES
// =============================================================================

export const abilityRoutes = new Hono<{ Bindings: Bindings }>();

// =============================================================================
// ABILITY DEFINITION ENDPOINTS
// =============================================================================

/**
 * GET /abilities
 * List all ability definitions with optional filtering
 */
abilityRoutes.get('/', async (c) => {
  const category = c.req.query('category');
  const abilityType = c.req.query('type');
  const sourceType = c.req.query('source_type');
  const tier = c.req.query('tier');
  const isSignature = c.req.query('is_signature');
  const isUltimate = c.req.query('is_ultimate');

  let query = 'SELECT * FROM ability_definitions WHERE 1=1';
  const params: (string | number)[] = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (abilityType) {
    query += ' AND ability_type = ?';
    params.push(abilityType);
  }

  if (sourceType) {
    query += ' AND source_type = ?';
    params.push(sourceType);
  }

  if (tier) {
    query += ' AND required_tier <= ?';
    params.push(parseInt(tier, 10));
  }

  if (isSignature === 'true') {
    query += ' AND is_signature = 1';
  }

  if (isUltimate === 'true') {
    query += ' AND is_ultimate = 1';
  }

  query += ' ORDER BY category, required_tier, name';

  const result = await c.env.DB.prepare(query)
    .bind(...params)
    .all<AbilityDefinition>();

  return c.json({
    success: true,
    data: {
      abilities: result.results.map(formatAbilityDefinition),
      total: result.results.length,
    },
  });
});

/**
 * GET /abilities/categories
 * List ability categories with counts
 */
abilityRoutes.get('/categories', async (c) => {
  const result = await c.env.DB.prepare(`
    SELECT category, ability_type, COUNT(*) as count
    FROM ability_definitions
    GROUP BY category, ability_type
    ORDER BY category, ability_type
  `).all<{ category: string; ability_type: string; count: number }>();

  // Group by category
  const categories: Record<string, { types: Record<string, number>; total: number }> = {};
  for (const row of result.results) {
    if (!categories[row.category]) {
      categories[row.category] = { types: {}, total: 0 };
    }
    const cat = categories[row.category]!;
    cat.types[row.ability_type] = row.count;
    cat.total += row.count;
  }

  return c.json({
    success: true,
    data: {
      categories,
    },
  });
});

/**
 * GET /abilities/character
 * Get character's unlocked abilities
 */
abilityRoutes.get('/character', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const status = c.req.query('status'); // unlocked, equipped, all
  const category = c.req.query('category');

  let query = `
    SELECT ca.*, ad.*,
           ca.id as ca_id, ad.id as ad_id
    FROM character_abilities ca
    JOIN ability_definitions ad ON ca.ability_id = ad.id
    WHERE ca.character_id = ?
  `;
  const params: (string | number)[] = [characterId];

  if (status === 'unlocked') {
    query += ' AND ca.is_unlocked = 1';
  } else if (status === 'equipped') {
    query += ' AND ca.is_equipped = 1';
  }

  if (category) {
    query += ' AND ad.category = ?';
    params.push(category);
  }

  query += ' ORDER BY ca.is_equipped DESC, ad.category, ad.name';

  const result = await c.env.DB.prepare(query)
    .bind(...params)
    .all();

  const abilities = result.results.map((row: Record<string, unknown>) => {
    const charAbility: CharacterAbility = {
      id: row.ca_id as string,
      character_id: row.character_id as string,
      ability_id: row.ability_id as string,
      acquired_at: row.acquired_at as string,
      is_unlocked: row.is_unlocked as number,
      is_equipped: row.is_equipped as number,
      current_rank: row.current_rank as number,
      current_charges: row.current_charges as number | null,
      cooldown_remaining: row.cooldown_remaining as number | null,
      is_on_cooldown: row.is_on_cooldown as number,
      custom_name: row.custom_name as string | null,
      modifier_augments: row.modifier_augments as string | null,
      modifier_items: row.modifier_items as string | null,
      effectiveness_multiplier: row.effectiveness_multiplier as number,
      times_used: row.times_used as number,
      successful_uses: row.successful_uses as number,
      damage_dealt_total: row.damage_dealt_total as number,
      targets_affected_total: row.targets_affected_total as number,
      last_used: row.last_used as string | null,
      xp_invested: row.xp_invested as number,
      xp_to_next_rank: row.xp_to_next_rank as number | null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };

    const definition: AbilityDefinition = {
      id: row.ad_id as string,
      code: row.code as string,
      name: row.name as string,
      description: row.description as string | null,
      detailed_description: row.detailed_description as string | null,
      flavor_text: row.flavor_text as string | null,
      ability_type: row.ability_type as string,
      category: row.category as string,
      is_signature: row.is_signature as number,
      is_ultimate: row.is_ultimate as number,
      source_type: row.source_type as string | null,
      source_track_id: row.source_track_id as string | null,
      source_specialization_id: row.source_specialization_id as string | null,
      source_augment_id: row.source_augment_id as string | null,
      source_item_id: row.source_item_id as string | null,
      required_tier: row.required_tier as number,
      required_level: row.required_level as number | null,
      prerequisite_abilities: row.prerequisite_abilities as string | null,
      required_attributes: row.required_attributes as string | null,
      required_skills: row.required_skills as string | null,
      resource_cost: row.resource_cost as string | null,
      cooldown_seconds: row.cooldown_seconds as number | null,
      charges: row.charges as number | null,
      charge_recovery: row.charge_recovery as string | null,
      humanity_cost: row.humanity_cost as number | null,
      activation_type: row.activation_type as string | null,
      activation_time: row.activation_time as string | null,
      range: row.range as string | null,
      area_of_effect: row.area_of_effect as string | null,
      duration: row.duration as string | null,
      concentration_required: row.concentration_required as number,
      primary_effect: row.primary_effect as string | null,
      secondary_effects: row.secondary_effects as string | null,
      scaling: row.scaling as string | null,
      synergies: row.synergies as string | null,
      has_ranks: row.has_ranks as number,
      max_rank: row.max_rank as number | null,
      rank_effects: row.rank_effects as string | null,
      upgrade_cost: row.upgrade_cost as string | null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };

    return formatCharacterAbility(charAbility, definition);
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
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const result = await c.env.DB.prepare(`
    SELECT ca.*, ad.*,
           ca.id as ca_id, ad.id as ad_id
    FROM character_abilities ca
    JOIN ability_definitions ad ON ca.ability_id = ad.id
    WHERE ca.character_id = ? AND ca.is_equipped = 1
    ORDER BY ad.category, ad.name
  `).bind(characterId).all();

  const abilities = result.results.map((row: Record<string, unknown>) => {
    const charAbility: CharacterAbility = {
      id: row.ca_id as string,
      character_id: row.character_id as string,
      ability_id: row.ability_id as string,
      acquired_at: row.acquired_at as string,
      is_unlocked: row.is_unlocked as number,
      is_equipped: row.is_equipped as number,
      current_rank: row.current_rank as number,
      current_charges: row.current_charges as number | null,
      cooldown_remaining: row.cooldown_remaining as number | null,
      is_on_cooldown: row.is_on_cooldown as number,
      custom_name: row.custom_name as string | null,
      modifier_augments: row.modifier_augments as string | null,
      modifier_items: row.modifier_items as string | null,
      effectiveness_multiplier: row.effectiveness_multiplier as number,
      times_used: row.times_used as number,
      successful_uses: row.successful_uses as number,
      damage_dealt_total: row.damage_dealt_total as number,
      targets_affected_total: row.targets_affected_total as number,
      last_used: row.last_used as string | null,
      xp_invested: row.xp_invested as number,
      xp_to_next_rank: row.xp_to_next_rank as number | null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };

    return formatCharacterAbility(charAbility);
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
 * GET /abilities/passives
 * List passive definitions
 */
abilityRoutes.get('/passives', async (c) => {
  const sourceType = c.req.query('source_type');
  const effectType = c.req.query('effect_type');
  const includeHidden = c.req.query('include_hidden') === 'true';

  let query = 'SELECT * FROM passive_definitions WHERE 1=1';
  const params: (string | number)[] = [];

  if (!includeHidden) {
    query += ' AND is_hidden = 0';
  }

  if (sourceType) {
    query += ' AND source_type = ?';
    params.push(sourceType);
  }

  if (effectType) {
    query += ' AND effect_type = ?';
    params.push(effectType);
  }

  query += ' ORDER BY required_tier, name';

  const result = await c.env.DB.prepare(query)
    .bind(...params)
    .all<PassiveDefinition>();

  return c.json({
    success: true,
    data: {
      passives: result.results.map(formatPassiveDefinition),
      total: result.results.length,
    },
  });
});

/**
 * GET /abilities/passives/character
 * Get character's active passives
 */
abilityRoutes.get('/passives/character', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  // Get passives from various sources (abilities, augments, items, etc.)
  const result = await c.env.DB.prepare(`
    SELECT pd.* FROM passive_definitions pd
    WHERE pd.id IN (
      -- Passives from equipped abilities
      SELECT pd2.id FROM passive_definitions pd2
      JOIN character_abilities ca ON pd2.source_id = ca.ability_id
      WHERE ca.character_id = ? AND ca.is_equipped = 1 AND pd2.source_type = 'ABILITY'
    )
    ORDER BY pd.name
  `).bind(characterId).all<PassiveDefinition>();

  return c.json({
    success: true,
    data: {
      passives: result.results.map(formatPassiveDefinition),
      total: result.results.length,
    },
  });
});

/**
 * GET /abilities/passives/:id
 * Get passive details
 */
abilityRoutes.get('/passives/:id', async (c) => {
  const { id } = c.req.param();

  const result = await c.env.DB.prepare(
    'SELECT * FROM passive_definitions WHERE id = ?'
  ).bind(id).first<PassiveDefinition>();

  if (!result) {
    return c.json({ success: false, errors: [{ message: 'Passive not found' }] }, 404);
  }

  return c.json({
    success: true,
    data: {
      passive: formatPassiveDefinition(result),
    },
  });
});

/**
 * GET /abilities/skills
 * List skill definitions
 */
abilityRoutes.get('/skills', async (c) => {
  const category = c.req.query('category');
  const attributeId = c.req.query('attribute_id');

  let query = 'SELECT * FROM skill_definitions WHERE 1=1';
  const params: (string | number)[] = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (attributeId) {
    query += ' AND governing_attribute_id = ?';
    params.push(attributeId);
  }

  query += ' ORDER BY category, name';

  const result = await c.env.DB.prepare(query)
    .bind(...params)
    .all<SkillDefinition>();

  return c.json({
    success: true,
    data: {
      skills: result.results.map(formatSkillDefinition),
      total: result.results.length,
    },
  });
});

/**
 * GET /abilities/skills/character
 * Get character's skill levels
 */
abilityRoutes.get('/skills/character', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const category = c.req.query('category');

  let query = `
    SELECT cs.*, sd.*,
           cs.id as cs_id, sd.id as sd_id
    FROM character_skills cs
    JOIN skill_definitions sd ON cs.skill_id = sd.id
    WHERE cs.character_id = ?
  `;
  const params: (string | number)[] = [characterId];

  if (category) {
    query += ' AND sd.category = ?';
    params.push(category);
  }

  query += ' ORDER BY sd.category, sd.name';

  const result = await c.env.DB.prepare(query)
    .bind(...params)
    .all();

  const skills = result.results.map((row: Record<string, unknown>) => {
    const charSkill: CharacterSkill = {
      id: row.cs_id as string,
      character_id: row.character_id as string,
      skill_id: row.skill_id as string,
      current_level: row.current_level as number,
      current_xp: row.current_xp as number,
      xp_to_next_level: row.xp_to_next_level as number | null,
      bonus_from_augments: row.bonus_from_augments as number,
      bonus_from_items: row.bonus_from_items as number,
      temporary_bonus: row.temporary_bonus as number,
      temporary_penalty: row.temporary_penalty as number,
      times_used: row.times_used as number,
      successes: row.successes as number,
      failures: row.failures as number,
      critical_successes: row.critical_successes as number,
      critical_failures: row.critical_failures as number,
      last_used: row.last_used as string | null,
      specializations_unlocked: row.specializations_unlocked as string | null,
      specialization_levels: row.specialization_levels as string | null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };

    const definition: SkillDefinition = {
      id: row.sd_id as string,
      code: row.code as string,
      name: row.name as string,
      description: row.description as string | null,
      governing_attribute_id: row.governing_attribute_id as string | null,
      category: row.category as string,
      max_level: row.max_level as number,
      xp_per_level: row.xp_per_level as string | null,
      training_available: row.training_available as number,
      requires_teacher: row.requires_teacher as number,
      prerequisite_skills: row.prerequisite_skills as string | null,
      required_tier: row.required_tier as number,
      required_track: row.required_track as string | null,
      check_difficulty_base: row.check_difficulty_base as number | null,
      critical_success_threshold: row.critical_success_threshold as number | null,
      critical_failure_threshold: row.critical_failure_threshold as number | null,
      can_assist: row.can_assist as number,
      can_retry: row.can_retry as number,
      retry_penalty: row.retry_penalty as number | null,
      has_specializations: row.has_specializations as number,
      specialization_definitions: row.specialization_definitions as string | null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };

    return formatCharacterSkill(charSkill, definition);
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
 * GET /abilities/skills/:id
 * Get skill details
 */
abilityRoutes.get('/skills/:id', async (c) => {
  const { id } = c.req.param();

  const result = await c.env.DB.prepare(
    'SELECT * FROM skill_definitions WHERE id = ?'
  ).bind(id).first<SkillDefinition>();

  if (!result) {
    return c.json({ success: false, errors: [{ message: 'Skill not found' }] }, 404);
  }

  return c.json({
    success: true,
    data: {
      skill: formatSkillDefinition(result),
    },
  });
});

/**
 * GET /abilities/:id
 * Get ability details
 */
abilityRoutes.get('/:id', async (c) => {
  const { id } = c.req.param();

  const result = await c.env.DB.prepare(
    'SELECT * FROM ability_definitions WHERE id = ?'
  ).bind(id).first<AbilityDefinition>();

  if (!result) {
    return c.json({ success: false, errors: [{ message: 'Ability not found' }] }, 404);
  }

  return c.json({
    success: true,
    data: {
      ability: formatAbilityDefinition(result),
    },
  });
});

// =============================================================================
// MUTATION ENDPOINTS
// =============================================================================

/**
 * POST /abilities/:id/unlock
 * Unlock an ability for a character
 */
abilityRoutes.post('/:id/unlock', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{ characterId: string }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  // Verify ability exists
  const ability = await c.env.DB.prepare(
    'SELECT * FROM ability_definitions WHERE id = ?'
  ).bind(id).first<AbilityDefinition>();

  if (!ability) {
    return c.json({ success: false, errors: [{ message: 'Ability not found' }] }, 404);
  }

  // Check if already unlocked
  const existing = await c.env.DB.prepare(
    'SELECT id FROM character_abilities WHERE character_id = ? AND ability_id = ?'
  ).bind(body.characterId, id).first();

  if (existing) {
    return c.json({ success: false, errors: [{ message: 'Ability already unlocked' }] }, 409);
  }

  // Create the unlock record
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.DB.prepare(`
    INSERT INTO character_abilities (
      id, character_id, ability_id, acquired_at, is_unlocked, is_equipped,
      current_rank, current_charges, is_on_cooldown, effectiveness_multiplier,
      times_used, successful_uses, damage_dealt_total, targets_affected_total,
      xp_invested, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 1, 0, 1, ?, 0, 1.0, 0, 0, 0, 0, 0, ?, ?)
  `).bind(
    newId,
    body.characterId,
    id,
    now,
    ability.charges,
    now,
    now
  ).run();

  return c.json({
    success: true,
    data: {
      unlocked: true,
      ability_id: id,
      character_ability_id: newId,
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

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  if (typeof body.equip !== 'boolean') {
    return c.json({ success: false, errors: [{ message: 'equip must be a boolean' }] }, 400);
  }

  // Find the character ability
  const charAbility = await c.env.DB.prepare(
    'SELECT * FROM character_abilities WHERE character_id = ? AND ability_id = ? AND is_unlocked = 1'
  ).bind(body.characterId, id).first();

  if (!charAbility) {
    return c.json({ success: false, errors: [{ message: 'Ability not unlocked for this character' }] }, 404);
  }

  // Update equipped status
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    'UPDATE character_abilities SET is_equipped = ?, updated_at = ? WHERE character_id = ? AND ability_id = ?'
  ).bind(body.equip ? 1 : 0, now, body.characterId, id).run();

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

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  // Find the character ability
  const charAbility = await c.env.DB.prepare(
    'SELECT * FROM character_abilities WHERE character_id = ? AND ability_id = ? AND is_unlocked = 1'
  ).bind(body.characterId, id).first<CharacterAbility>();

  if (!charAbility) {
    return c.json({ success: false, errors: [{ message: 'Ability not unlocked for this character' }] }, 404);
  }

  // Update usage stats
  const now = new Date().toISOString();
  const successful = body.successful !== false;

  await c.env.DB.prepare(`
    UPDATE character_abilities SET
      times_used = times_used + 1,
      successful_uses = successful_uses + ?,
      damage_dealt_total = damage_dealt_total + ?,
      targets_affected_total = targets_affected_total + ?,
      last_used = ?,
      updated_at = ?
    WHERE character_id = ? AND ability_id = ?
  `).bind(
    successful ? 1 : 0,
    body.damage_dealt || 0,
    body.targets_affected || 0,
    now,
    now,
    body.characterId,
    id
  ).run();

  return c.json({
    success: true,
    data: {
      ability_id: id,
      times_used: charAbility.times_used + 1,
      successful: successful,
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

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  // Find the character ability with definition
  const result = await c.env.DB.prepare(`
    SELECT ca.*, ad.max_rank, ad.has_ranks
    FROM character_abilities ca
    JOIN ability_definitions ad ON ca.ability_id = ad.id
    WHERE ca.character_id = ? AND ca.ability_id = ? AND ca.is_unlocked = 1
  `).bind(body.characterId, id).first<CharacterAbility & { max_rank: number; has_ranks: number }>();

  if (!result) {
    return c.json({ success: false, errors: [{ message: 'Ability not unlocked for this character' }] }, 404);
  }

  if (!result.has_ranks) {
    return c.json({ success: false, errors: [{ message: 'This ability cannot be upgraded' }] }, 400);
  }

  if (result.current_rank >= result.max_rank) {
    return c.json({ success: false, errors: [{ message: 'Ability is already at max rank' }] }, 400);
  }

  // Apply XP or directly upgrade
  const now = new Date().toISOString();
  const newRank = result.current_rank + 1;

  await c.env.DB.prepare(`
    UPDATE character_abilities SET
      current_rank = ?,
      xp_invested = xp_invested + ?,
      updated_at = ?
    WHERE character_id = ? AND ability_id = ?
  `).bind(
    newRank,
    body.xp_amount || 0,
    now,
    body.characterId,
    id
  ).run();

  return c.json({
    success: true,
    data: {
      ability_id: id,
      new_rank: newRank,
      max_rank: result.max_rank,
    },
  });
});

/**
 * POST /abilities/skills/:id/train
 * Add XP to a skill
 */
abilityRoutes.post('/skills/:id/train', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{ characterId: string; xp_amount: number }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  if (typeof body.xp_amount !== 'number' || body.xp_amount <= 0) {
    return c.json({ success: false, errors: [{ message: 'xp_amount must be a positive number' }] }, 400);
  }

  // Find or create character skill
  let charSkill = await c.env.DB.prepare(
    'SELECT cs.*, sd.max_level FROM character_skills cs JOIN skill_definitions sd ON cs.skill_id = sd.id WHERE cs.character_id = ? AND cs.skill_id = ?'
  ).bind(body.characterId, id).first<CharacterSkill & { max_level: number }>();

  const now = new Date().toISOString();

  if (!charSkill) {
    // Create new skill record
    const skillDef = await c.env.DB.prepare(
      'SELECT * FROM skill_definitions WHERE id = ?'
    ).bind(id).first<SkillDefinition>();

    if (!skillDef) {
      return c.json({ success: false, errors: [{ message: 'Skill not found' }] }, 404);
    }

    const newId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO character_skills (
        id, character_id, skill_id, current_level, current_xp, xp_to_next_level,
        bonus_from_augments, bonus_from_items, temporary_bonus, temporary_penalty,
        times_used, successes, failures, critical_successes, critical_failures,
        created_at, updated_at
      ) VALUES (?, ?, ?, 0, 0, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, ?, ?)
    `).bind(newId, body.characterId, id, now, now).run();

    charSkill = {
      id: newId,
      character_id: body.characterId,
      skill_id: id,
      current_level: 0,
      current_xp: 0,
      xp_to_next_level: 100,
      max_level: skillDef.max_level,
      bonus_from_augments: 0,
      bonus_from_items: 0,
      temporary_bonus: 0,
      temporary_penalty: 0,
      times_used: 0,
      successes: 0,
      failures: 0,
      critical_successes: 0,
      critical_failures: 0,
      last_used: null,
      specializations_unlocked: null,
      specialization_levels: null,
      created_at: now,
      updated_at: now,
    };
  }

  // Add XP and check for level up
  let newXp = charSkill.current_xp + body.xp_amount;
  let newLevel = charSkill.current_level;
  let leveledUp = false;

  const xpToNext = charSkill.xp_to_next_level || 100;
  while (newXp >= xpToNext && newLevel < charSkill.max_level) {
    newXp -= xpToNext;
    newLevel++;
    leveledUp = true;
  }

  // Cap at max level
  if (newLevel >= charSkill.max_level) {
    newLevel = charSkill.max_level;
    newXp = 0;
  }

  // Calculate new XP to next level (simple scaling)
  const newXpToNext = Math.floor(100 * Math.pow(1.5, newLevel));

  await c.env.DB.prepare(`
    UPDATE character_skills SET
      current_level = ?,
      current_xp = ?,
      xp_to_next_level = ?,
      updated_at = ?
    WHERE character_id = ? AND skill_id = ?
  `).bind(newLevel, newXp, newXpToNext, now, body.characterId, id).run();

  return c.json({
    success: true,
    data: {
      skill_id: id,
      current_level: newLevel,
      current_xp: newXp,
      xp_to_next_level: newXpToNext,
      leveled_up: leveledUp,
      xp_added: body.xp_amount,
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

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  if (!['success', 'failure', 'critical_success', 'critical_failure'].includes(body.result)) {
    return c.json({ success: false, errors: [{ message: 'result must be one of: success, failure, critical_success, critical_failure' }] }, 400);
  }

  // Find character skill
  const charSkill = await c.env.DB.prepare(
    'SELECT * FROM character_skills WHERE character_id = ? AND skill_id = ?'
  ).bind(body.characterId, id).first<CharacterSkill>();

  if (!charSkill) {
    return c.json({ success: false, errors: [{ message: 'Skill not found for this character' }] }, 404);
  }

  // Update stats based on result
  const now = new Date().toISOString();
  const isSuccess = body.result === 'success' || body.result === 'critical_success';

  await c.env.DB.prepare(`
    UPDATE character_skills SET
      times_used = times_used + 1,
      successes = successes + ?,
      failures = failures + ?,
      critical_successes = critical_successes + ?,
      critical_failures = critical_failures + ?,
      last_used = ?,
      updated_at = ?
    WHERE character_id = ? AND skill_id = ?
  `).bind(
    isSuccess ? 1 : 0,
    !isSuccess ? 1 : 0,
    body.result === 'critical_success' ? 1 : 0,
    body.result === 'critical_failure' ? 1 : 0,
    now,
    now,
    body.characterId,
    id
  ).run();

  return c.json({
    success: true,
    data: {
      skill_id: id,
      result: body.result,
      times_used: charSkill.times_used + 1,
    },
  });
});

