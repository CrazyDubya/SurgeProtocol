/**
 * Surge Protocol - Progression System Routes
 *
 * Endpoints:
 *
 * Tracks:
 * - GET /progression/tracks - List all tracks
 * - GET /progression/tracks/:id - Get track details
 * - POST /progression/character/select-track - Select track (requires Tier 3)
 *
 * Specializations:
 * - GET /progression/specializations - List all specializations
 * - GET /progression/specializations/:id - Get specialization details
 * - GET /progression/specializations/by-track/:trackId - Get specializations for track
 * - POST /progression/character/select-specialization - Select specialization (requires Tier 6)
 *
 * Tiers:
 * - GET /progression/tiers - List tier definitions
 * - GET /progression/tiers/:tier - Get tier details
 * - GET /progression/tiers/current - Get character's current tier info
 *
 * Experience:
 * - GET /progression/character/experience - Get character XP by category
 * - POST /progression/character/experience/add - Add XP (for testing/admin)
 *
 * Advancement:
 * - GET /progression/character/advancement - Get available advancement points
 * - POST /progression/character/advancement/spend - Spend advancement points
 *
 * Rating:
 * - GET /progression/rating/components - List rating component definitions
 * - GET /progression/character/rating - Get character's rating breakdown
 * - GET /progression/character/rating/history - Get rating history
 *
 * Cross-Training:
 * - GET /progression/character/cross-training - Get cross-training progress
 * - POST /progression/character/cross-training/invest - Invest XP in cross-training
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

interface Track {
  id: string;
  code: string;
  name: string;
  tagline: string | null;
  description: string | null;
  lore_description: string | null;
  unlocked_at_tier: number;
  prerequisite_attributes: string | null;
  prerequisite_missions: string | null;
  primary_attribute: string | null;
  secondary_attribute: string | null;
  resource_pool_type: string | null;
  signature_mechanic_description: string | null;
  natural_ally_tracks: string | null;
  difficult_cross_tracks: string | null;
  difficulty_rating: number | null;
  playstyle_tags: string | null;
  recommended_for_new_players: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface Specialization {
  id: string;
  track_id: string;
  code: string;
  name: string;
  tagline: string | null;
  description: string | null;
  lore_description: string | null;
  unlocked_at_tier: number;
  prerequisite_abilities: string | null;
  prerequisite_augments: string | null;
  prerequisite_missions: string | null;
  signature_ability_id: string | null;
  signature_passive_id: string | null;
  combat_focus: number;
  stealth_focus: number;
  social_focus: number;
  technical_focus: number;
  mobility_focus: number;
  difficulty_rating: number | null;
  synergy_specs: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface TierDefinition {
  id: string;
  tier_number: number;
  name: string;
  subtitle: string | null;
  description: string | null;
  min_rating: number;
  min_deliveries: number;
  min_playtime_hours: number;
  required_augments: number;
  corporate_title: string | null;
  street_title: string | null;
  algorithm_relationship: string | null;
  base_pay_multiplier: number;
  mission_access_level: number;
  location_access_level: number;
  augment_access_level: number;
  black_market_access: number;
  interstitial_access: number;
  health_insurance_tier: number;
  housing_subsidy_level: number;
  corporate_support_level: number;
  algorithm_consultation: number;
  triggers_convergence_choice: number;
  ascension_eligible: number;
  rogue_path_available: number;
  display_color: string | null;
  created_at: string;
  updated_at: string;
}

interface CharacterExperience {
  id: string;
  character_id: string;
  total_xp_earned: number;
  total_xp_spent: number;
  available_xp: number;
  combat_xp: number;
  delivery_xp: number;
  social_xp: number;
  technical_xp: number;
  exploration_xp: number;
  story_xp: number;
  attribute_points_available: number;
  skill_points_available: number;
  ability_points_available: number;
  augment_slots_available: number;
  algorithm_favor: number;
  street_cred: number;
  network_tokens: number;
  humanity_anchors: number;
  created_at: string;
  updated_at: string;
}

interface RatingComponent {
  id: string;
  code: string;
  name: string;
  description: string | null;
  weight: number;
  min_value: number;
  max_value: number;
  decay_rate_per_day: number;
  is_public: number;
  affects_tier: number;
  created_at: string;
  updated_at: string;
}

interface CrossTrainingProgress {
  id: string;
  character_id: string;
  source_track_id: string;
  target_track_id: string;
  xp_invested: number;
  xp_required: number;
  current_effectiveness: number;
  max_effectiveness: number;
  abilities_unlocked: string | null;
  passives_unlocked: string | null;
  blocked_abilities: string | null;
  requires_augment_compatibility: number;
  created_at: string;
  updated_at: string;
}

interface Character {
  id: string;
  current_tier: number;
  tier_progress: number;
  track_id: string | null;
  specialization_id: string | null;
  carrier_rating: number;
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

function formatTrack(row: Track) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    lore_description: row.lore_description,
    requirements: {
      unlocked_at_tier: row.unlocked_at_tier,
      attributes: parseJsonField<Record<string, number>>(row.prerequisite_attributes, {}),
      missions: parseJsonField<string[]>(row.prerequisite_missions, []),
    },
    mechanics: {
      primary_attribute: row.primary_attribute,
      secondary_attribute: row.secondary_attribute,
      resource_pool_type: row.resource_pool_type,
      signature_mechanic: row.signature_mechanic_description,
    },
    cross_training: {
      natural_allies: parseJsonField<string[]>(row.natural_ally_tracks, []),
      difficult: parseJsonField<string[]>(row.difficult_cross_tracks, []),
    },
    meta: {
      difficulty_rating: row.difficulty_rating,
      playstyle_tags: parseJsonField<string[]>(row.playstyle_tags, []),
      recommended_for_new_players: Boolean(row.recommended_for_new_players),
      display_order: row.display_order,
    },
  };
}

function formatSpecialization(row: Specialization, trackName?: string) {
  return {
    id: row.id,
    track_id: row.track_id,
    track_name: trackName,
    code: row.code,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    lore_description: row.lore_description,
    requirements: {
      unlocked_at_tier: row.unlocked_at_tier,
      abilities: parseJsonField<string[]>(row.prerequisite_abilities, []),
      augments: parseJsonField<string[]>(row.prerequisite_augments, []),
      missions: parseJsonField<string[]>(row.prerequisite_missions, []),
    },
    signature: {
      ability_id: row.signature_ability_id,
      passive_id: row.signature_passive_id,
    },
    focus: {
      combat: row.combat_focus,
      stealth: row.stealth_focus,
      social: row.social_focus,
      technical: row.technical_focus,
      mobility: row.mobility_focus,
    },
    meta: {
      difficulty_rating: row.difficulty_rating,
      synergy_specs: parseJsonField<string[]>(row.synergy_specs, []),
      display_order: row.display_order,
    },
  };
}

function formatTierDefinition(row: TierDefinition) {
  return {
    id: row.id,
    tier_number: row.tier_number,
    name: row.name,
    subtitle: row.subtitle,
    description: row.description,
    requirements: {
      min_rating: row.min_rating,
      min_deliveries: row.min_deliveries,
      min_playtime_hours: row.min_playtime_hours,
      required_augments: row.required_augments,
    },
    titles: {
      corporate: row.corporate_title,
      street: row.street_title,
      algorithm_relationship: row.algorithm_relationship,
    },
    benefits: {
      base_pay_multiplier: row.base_pay_multiplier,
      mission_access_level: row.mission_access_level,
      location_access_level: row.location_access_level,
      augment_access_level: row.augment_access_level,
      black_market_access: Boolean(row.black_market_access),
      interstitial_access: Boolean(row.interstitial_access),
      health_insurance_tier: row.health_insurance_tier,
      housing_subsidy_level: row.housing_subsidy_level,
      corporate_support_level: row.corporate_support_level,
      algorithm_consultation: Boolean(row.algorithm_consultation),
    },
    special: {
      triggers_convergence_choice: Boolean(row.triggers_convergence_choice),
      ascension_eligible: Boolean(row.ascension_eligible),
      rogue_path_available: Boolean(row.rogue_path_available),
    },
    display_color: row.display_color,
  };
}

function formatCharacterExperience(row: CharacterExperience) {
  return {
    totals: {
      earned: row.total_xp_earned,
      spent: row.total_xp_spent,
      available: row.available_xp,
    },
    by_category: {
      combat: row.combat_xp,
      delivery: row.delivery_xp,
      social: row.social_xp,
      technical: row.technical_xp,
      exploration: row.exploration_xp,
      story: row.story_xp,
    },
    advancement_points: {
      attribute: row.attribute_points_available,
      skill: row.skill_points_available,
      ability: row.ability_points_available,
      augment_slots: row.augment_slots_available,
    },
    special_currencies: {
      algorithm_favor: row.algorithm_favor,
      street_cred: row.street_cred,
      network_tokens: row.network_tokens,
      humanity_anchors: row.humanity_anchors,
    },
  };
}

function formatRatingComponent(row: RatingComponent) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    weight: row.weight,
    range: {
      min: row.min_value,
      max: row.max_value,
    },
    decay_rate_per_day: row.decay_rate_per_day,
    is_public: Boolean(row.is_public),
    affects_tier: Boolean(row.affects_tier),
  };
}

function formatCrossTraining(row: CrossTrainingProgress, sourceName?: string, targetName?: string) {
  return {
    id: row.id,
    source_track: {
      id: row.source_track_id,
      name: sourceName,
    },
    target_track: {
      id: row.target_track_id,
      name: targetName,
    },
    progress: {
      xp_invested: row.xp_invested,
      xp_required: row.xp_required,
      percent_complete: row.xp_required > 0 ? Math.min(100, (row.xp_invested / row.xp_required) * 100) : 0,
    },
    effectiveness: {
      current: row.current_effectiveness,
      max: row.max_effectiveness,
    },
    unlocks: {
      abilities: parseJsonField<string[]>(row.abilities_unlocked, []),
      passives: parseJsonField<string[]>(row.passives_unlocked, []),
    },
    restrictions: {
      blocked_abilities: parseJsonField<string[]>(row.blocked_abilities, []),
      requires_augment_compatibility: Boolean(row.requires_augment_compatibility),
    },
  };
}

// =============================================================================
// ROUTES
// =============================================================================

export const progressionRoutes = new Hono<{ Bindings: Bindings }>();

// =============================================================================
// TRACK ENDPOINTS
// =============================================================================

/**
 * GET /progression/tracks
 * List all tracks
 */
progressionRoutes.get('/tracks', async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT * FROM tracks ORDER BY display_order'
  ).all<Track>();

  return c.json({
    success: true,
    data: {
      tracks: result.results.map(formatTrack),
      total: result.results.length,
    },
  });
});

/**
 * GET /progression/tracks/:id
 * Get track details with specializations
 */
progressionRoutes.get('/tracks/:id', async (c) => {
  const { id } = c.req.param();

  const track = await c.env.DB.prepare(
    'SELECT * FROM tracks WHERE id = ?'
  ).bind(id).first<Track>();

  if (!track) {
    return c.json({ success: false, errors: [{ message: 'Track not found' }] }, 404);
  }

  // Get specializations for this track
  const specs = await c.env.DB.prepare(
    'SELECT * FROM specializations WHERE track_id = ? ORDER BY display_order'
  ).bind(id).all<Specialization>();

  return c.json({
    success: true,
    data: {
      track: formatTrack(track),
      specializations: specs.results.map(s => formatSpecialization(s, track.name)),
    },
  });
});

// =============================================================================
// SPECIALIZATION ENDPOINTS
// =============================================================================

/**
 * GET /progression/specializations
 * List all specializations
 */
progressionRoutes.get('/specializations', async (c) => {
  const trackId = c.req.query('track_id');

  let query = `
    SELECT s.*, t.name as track_name
    FROM specializations s
    JOIN tracks t ON s.track_id = t.id
    WHERE 1=1
  `;
  const params: string[] = [];

  if (trackId) {
    query += ' AND s.track_id = ?';
    params.push(trackId);
  }

  query += ' ORDER BY t.display_order, s.display_order';

  const result = await c.env.DB.prepare(query)
    .bind(...params)
    .all<Specialization & { track_name: string }>();

  return c.json({
    success: true,
    data: {
      specializations: result.results.map(r => formatSpecialization(r, r.track_name)),
      total: result.results.length,
    },
  });
});

/**
 * GET /progression/specializations/by-track/:trackId
 * Get specializations for a specific track
 */
progressionRoutes.get('/specializations/by-track/:trackId', async (c) => {
  const { trackId } = c.req.param();

  const track = await c.env.DB.prepare(
    'SELECT name FROM tracks WHERE id = ?'
  ).bind(trackId).first<{ name: string }>();

  if (!track) {
    return c.json({ success: false, errors: [{ message: 'Track not found' }] }, 404);
  }

  const specs = await c.env.DB.prepare(
    'SELECT * FROM specializations WHERE track_id = ? ORDER BY display_order'
  ).bind(trackId).all<Specialization>();

  return c.json({
    success: true,
    data: {
      track_id: trackId,
      track_name: track.name,
      specializations: specs.results.map(s => formatSpecialization(s, track.name)),
    },
  });
});

/**
 * GET /progression/specializations/:id
 * Get specialization details
 */
progressionRoutes.get('/specializations/:id', async (c) => {
  const { id } = c.req.param();

  const result = await c.env.DB.prepare(`
    SELECT s.*, t.name as track_name, t.code as track_code
    FROM specializations s
    JOIN tracks t ON s.track_id = t.id
    WHERE s.id = ?
  `).bind(id).first<Specialization & { track_name: string; track_code: string }>();

  if (!result) {
    return c.json({ success: false, errors: [{ message: 'Specialization not found' }] }, 404);
  }

  return c.json({
    success: true,
    data: {
      specialization: {
        ...formatSpecialization(result, result.track_name),
        track_code: result.track_code,
      },
    },
  });
});

// =============================================================================
// TIER ENDPOINTS
// =============================================================================

/**
 * GET /progression/tiers
 * List all tier definitions
 */
progressionRoutes.get('/tiers', async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT * FROM tier_definitions ORDER BY tier_number'
  ).all<TierDefinition>();

  return c.json({
    success: true,
    data: {
      tiers: result.results.map(formatTierDefinition),
      total: result.results.length,
    },
  });
});

/**
 * GET /progression/tiers/current
 * Get character's current tier info and progress to next
 */
progressionRoutes.get('/tiers/current', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const character = await c.env.DB.prepare(
    'SELECT id, current_tier, tier_progress, carrier_rating, track_id, specialization_id FROM characters WHERE id = ?'
  ).bind(characterId).first<Character>();

  if (!character) {
    return c.json({ success: false, errors: [{ message: 'Character not found' }] }, 404);
  }

  // Get current and next tier definitions
  const currentTier = await c.env.DB.prepare(
    'SELECT * FROM tier_definitions WHERE tier_number = ?'
  ).bind(character.current_tier).first<TierDefinition>();

  const nextTier = await c.env.DB.prepare(
    'SELECT * FROM tier_definitions WHERE tier_number = ?'
  ).bind(character.current_tier + 1).first<TierDefinition>();

  return c.json({
    success: true,
    data: {
      character_id: characterId,
      current_tier: currentTier ? formatTierDefinition(currentTier) : null,
      tier_progress: character.tier_progress,
      carrier_rating: character.carrier_rating,
      next_tier: nextTier ? formatTierDefinition(nextTier) : null,
      track_id: character.track_id,
      specialization_id: character.specialization_id,
    },
  });
});

/**
 * GET /progression/tiers/:tier
 * Get specific tier details
 */
progressionRoutes.get('/tiers/:tier', async (c) => {
  const tier = parseInt(c.req.param('tier'), 10);

  if (isNaN(tier) || tier < 1 || tier > 10) {
    return c.json({ success: false, errors: [{ message: 'Invalid tier number (1-10)' }] }, 400);
  }

  const result = await c.env.DB.prepare(
    'SELECT * FROM tier_definitions WHERE tier_number = ?'
  ).bind(tier).first<TierDefinition>();

  if (!result) {
    return c.json({ success: false, errors: [{ message: 'Tier not found' }] }, 404);
  }

  return c.json({
    success: true,
    data: {
      tier: formatTierDefinition(result),
    },
  });
});

// =============================================================================
// EXPERIENCE ENDPOINTS
// =============================================================================

/**
 * GET /progression/character/experience
 * Get character's XP by category and advancement points
 */
progressionRoutes.get('/character/experience', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const exp = await c.env.DB.prepare(
    'SELECT * FROM character_experience WHERE character_id = ?'
  ).bind(characterId).first<CharacterExperience>();

  if (!exp) {
    // Return empty experience if not found
    return c.json({
      success: true,
      data: {
        experience: {
          totals: { earned: 0, spent: 0, available: 0 },
          by_category: { combat: 0, delivery: 0, social: 0, technical: 0, exploration: 0, story: 0 },
          advancement_points: { attribute: 0, skill: 0, ability: 0, augment_slots: 0 },
          special_currencies: { algorithm_favor: 0, street_cred: 0, network_tokens: 0, humanity_anchors: 0 },
        },
      },
    });
  }

  return c.json({
    success: true,
    data: {
      experience: formatCharacterExperience(exp),
    },
  });
});

/**
 * POST /progression/character/experience/add
 * Add XP to a category (admin/testing endpoint)
 */
progressionRoutes.post('/character/experience/add', async (c) => {
  const body = await c.req.json<{
    characterId: string;
    category: 'combat' | 'delivery' | 'social' | 'technical' | 'exploration' | 'story';
    amount: number;
  }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const validCategories = ['combat', 'delivery', 'social', 'technical', 'exploration', 'story'];
  if (!validCategories.includes(body.category)) {
    return c.json({ success: false, errors: [{ message: 'Invalid category' }] }, 400);
  }

  if (typeof body.amount !== 'number' || body.amount <= 0) {
    return c.json({ success: false, errors: [{ message: 'amount must be a positive number' }] }, 400);
  }

  const now = new Date().toISOString();
  const column = `${body.category}_xp`;

  // Check if experience record exists
  const existing = await c.env.DB.prepare(
    'SELECT id FROM character_experience WHERE character_id = ?'
  ).bind(body.characterId).first();

  if (existing) {
    await c.env.DB.prepare(`
      UPDATE character_experience SET
        ${column} = ${column} + ?,
        total_xp_earned = total_xp_earned + ?,
        available_xp = available_xp + ?,
        updated_at = ?
      WHERE character_id = ?
    `).bind(body.amount, body.amount, body.amount, now, body.characterId).run();
  } else {
    const newId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO character_experience (
        id, character_id, total_xp_earned, total_xp_spent, available_xp,
        combat_xp, delivery_xp, social_xp, technical_xp, exploration_xp, story_xp,
        attribute_points_available, skill_points_available, ability_points_available, augment_slots_available,
        algorithm_favor, street_cred, network_tokens, humanity_anchors,
        created_at, updated_at
      ) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0, ?, ?)
    `).bind(
      newId, body.characterId, body.amount, body.amount,
      body.category === 'combat' ? body.amount : 0,
      body.category === 'delivery' ? body.amount : 0,
      body.category === 'social' ? body.amount : 0,
      body.category === 'technical' ? body.amount : 0,
      body.category === 'exploration' ? body.amount : 0,
      body.category === 'story' ? body.amount : 0,
      now, now
    ).run();
  }

  return c.json({
    success: true,
    data: {
      category: body.category,
      amount_added: body.amount,
    },
  });
});

// =============================================================================
// ADVANCEMENT ENDPOINTS
// =============================================================================

/**
 * GET /progression/character/advancement
 * Get available advancement points
 */
progressionRoutes.get('/character/advancement', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const exp = await c.env.DB.prepare(
    'SELECT attribute_points_available, skill_points_available, ability_points_available, augment_slots_available FROM character_experience WHERE character_id = ?'
  ).bind(characterId).first<Partial<CharacterExperience>>();

  return c.json({
    success: true,
    data: {
      advancement_points: {
        attribute: exp?.attribute_points_available || 0,
        skill: exp?.skill_points_available || 0,
        ability: exp?.ability_points_available || 0,
        augment_slots: exp?.augment_slots_available || 0,
      },
    },
  });
});

/**
 * POST /progression/character/advancement/spend
 * Spend advancement points
 */
progressionRoutes.post('/character/advancement/spend', async (c) => {
  const body = await c.req.json<{
    characterId: string;
    type: 'attribute' | 'skill' | 'ability' | 'augment_slots';
    amount: number;
    target_id?: string;
  }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const validTypes = ['attribute', 'skill', 'ability', 'augment_slots'];
  if (!validTypes.includes(body.type)) {
    return c.json({ success: false, errors: [{ message: 'Invalid type' }] }, 400);
  }

  if (typeof body.amount !== 'number' || body.amount <= 0) {
    return c.json({ success: false, errors: [{ message: 'amount must be a positive number' }] }, 400);
  }

  const column = `${body.type}_points_available`;

  // Check available points
  const exp = await c.env.DB.prepare(
    `SELECT ${column} as available FROM character_experience WHERE character_id = ?`
  ).bind(body.characterId).first<{ available: number }>();

  if (!exp || exp.available < body.amount) {
    return c.json({
      success: false,
      errors: [{ message: `Insufficient ${body.type} points. Available: ${exp?.available || 0}` }],
    }, 400);
  }

  const now = new Date().toISOString();

  await c.env.DB.prepare(`
    UPDATE character_experience SET
      ${column} = ${column} - ?,
      total_xp_spent = total_xp_spent + ?,
      updated_at = ?
    WHERE character_id = ?
  `).bind(body.amount, body.amount, now, body.characterId).run();

  return c.json({
    success: true,
    data: {
      type: body.type,
      amount_spent: body.amount,
      target_id: body.target_id,
      remaining: exp.available - body.amount,
    },
  });
});

// =============================================================================
// RATING ENDPOINTS
// =============================================================================

/**
 * GET /progression/rating/components
 * List rating component definitions
 */
progressionRoutes.get('/rating/components', async (c) => {
  const publicOnly = c.req.query('public_only') === 'true';

  let query = 'SELECT * FROM rating_components WHERE 1=1';
  if (publicOnly) {
    query += ' AND is_public = 1';
  }
  query += ' ORDER BY weight DESC';

  const result = await c.env.DB.prepare(query).all<RatingComponent>();

  return c.json({
    success: true,
    data: {
      components: result.results.map(formatRatingComponent),
      total: result.results.length,
    },
  });
});

/**
 * GET /progression/character/rating
 * Get character's rating breakdown
 */
progressionRoutes.get('/character/rating', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  // Get character's carrier rating
  const character = await c.env.DB.prepare(
    'SELECT carrier_rating, current_tier, tier_progress FROM characters WHERE id = ?'
  ).bind(characterId).first<Character>();

  if (!character) {
    return c.json({ success: false, errors: [{ message: 'Character not found' }] }, 404);
  }

  // Get rating components
  const components = await c.env.DB.prepare(
    'SELECT * FROM rating_components ORDER BY weight DESC'
  ).all<RatingComponent>();

  // Get character's individual component values if tracked
  const charRatings = await c.env.DB.prepare(
    'SELECT * FROM character_rating_components WHERE character_id = ?'
  ).bind(characterId).all<{ component_id: string; value: number }>();

  const ratingMap = new Map(charRatings.results.map(r => [r.component_id, r.value]));

  const breakdown = components.results.map(comp => ({
    ...formatRatingComponent(comp),
    character_value: ratingMap.get(comp.id) || 0,
    weighted_contribution: (ratingMap.get(comp.id) || 0) * comp.weight,
  }));

  return c.json({
    success: true,
    data: {
      carrier_rating: character.carrier_rating,
      current_tier: character.current_tier,
      tier_progress: character.tier_progress,
      breakdown,
    },
  });
});

// =============================================================================
// CROSS-TRAINING ENDPOINTS
// =============================================================================

/**
 * GET /progression/character/cross-training
 * Get character's cross-training progress
 */
progressionRoutes.get('/character/cross-training', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const result = await c.env.DB.prepare(`
    SELECT ct.*,
           st.name as source_name, st.code as source_code,
           tt.name as target_name, tt.code as target_code
    FROM cross_training_progress ct
    JOIN tracks st ON ct.source_track_id = st.id
    JOIN tracks tt ON ct.target_track_id = tt.id
    WHERE ct.character_id = ?
    ORDER BY ct.current_effectiveness DESC
  `).bind(characterId).all<CrossTrainingProgress & {
    source_name: string;
    source_code: string;
    target_name: string;
    target_code: string;
  }>();

  return c.json({
    success: true,
    data: {
      cross_training: result.results.map(r => ({
        ...formatCrossTraining(r, r.source_name, r.target_name),
        source_code: r.source_code,
        target_code: r.target_code,
      })),
      total: result.results.length,
    },
  });
});

/**
 * POST /progression/character/cross-training/invest
 * Invest XP in cross-training
 */
progressionRoutes.post('/character/cross-training/invest', async (c) => {
  const body = await c.req.json<{
    characterId: string;
    target_track_id: string;
    xp_amount: number;
  }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  if (!body.target_track_id) {
    return c.json({ success: false, errors: [{ message: 'target_track_id is required' }] }, 400);
  }

  if (typeof body.xp_amount !== 'number' || body.xp_amount <= 0) {
    return c.json({ success: false, errors: [{ message: 'xp_amount must be a positive number' }] }, 400);
  }

  // Get character's current track
  const character = await c.env.DB.prepare(
    'SELECT track_id FROM characters WHERE id = ?'
  ).bind(body.characterId).first<{ track_id: string | null }>();

  if (!character || !character.track_id) {
    return c.json({ success: false, errors: [{ message: 'Character has no primary track selected' }] }, 400);
  }

  if (character.track_id === body.target_track_id) {
    return c.json({ success: false, errors: [{ message: 'Cannot cross-train in your own track' }] }, 400);
  }

  // Check available XP
  const exp = await c.env.DB.prepare(
    'SELECT available_xp FROM character_experience WHERE character_id = ?'
  ).bind(body.characterId).first<{ available_xp: number }>();

  if (!exp || exp.available_xp < body.xp_amount) {
    return c.json({
      success: false,
      errors: [{ message: `Insufficient XP. Available: ${exp?.available_xp || 0}` }],
    }, 400);
  }

  const now = new Date().toISOString();

  // Find or create cross-training progress
  let progress = await c.env.DB.prepare(
    'SELECT * FROM cross_training_progress WHERE character_id = ? AND target_track_id = ?'
  ).bind(body.characterId, body.target_track_id).first<CrossTrainingProgress>();

  if (progress) {
    // Update existing progress
    const newXpInvested = progress.xp_invested + body.xp_amount;
    const newEffectiveness = Math.min(
      progress.max_effectiveness,
      progress.current_effectiveness + (body.xp_amount / progress.xp_required) * progress.max_effectiveness
    );

    await c.env.DB.prepare(`
      UPDATE cross_training_progress SET
        xp_invested = ?,
        current_effectiveness = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(newXpInvested, newEffectiveness, now, progress.id).run();

    // Deduct XP
    await c.env.DB.prepare(`
      UPDATE character_experience SET
        available_xp = available_xp - ?,
        total_xp_spent = total_xp_spent + ?,
        updated_at = ?
      WHERE character_id = ?
    `).bind(body.xp_amount, body.xp_amount, now, body.characterId).run();

    return c.json({
      success: true,
      data: {
        target_track_id: body.target_track_id,
        xp_invested: newXpInvested,
        current_effectiveness: newEffectiveness,
        max_effectiveness: progress.max_effectiveness,
      },
    });
  } else {
    // Get track relationship to determine max effectiveness
    const sourceTrack = await c.env.DB.prepare(
      'SELECT natural_ally_tracks, difficult_cross_tracks FROM tracks WHERE id = ?'
    ).bind(character.track_id).first<{ natural_ally_tracks: string | null; difficult_cross_tracks: string | null }>();

    const allies = parseJsonField<string[]>(sourceTrack?.natural_ally_tracks ?? null, []);
    const difficult = parseJsonField<string[]>(sourceTrack?.difficult_cross_tracks ?? null, []);

    let maxEffectiveness = 0.60; // Default
    if (allies.includes(body.target_track_id)) {
      maxEffectiveness = 0.75;
    } else if (difficult.includes(body.target_track_id)) {
      maxEffectiveness = 0.50;
    }

    const xpRequired = 10000; // Base XP required for full cross-training
    const newId = crypto.randomUUID();

    await c.env.DB.prepare(`
      INSERT INTO cross_training_progress (
        id, character_id, source_track_id, target_track_id,
        xp_invested, xp_required, current_effectiveness, max_effectiveness,
        requires_augment_compatibility, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).bind(
      newId, body.characterId, character.track_id, body.target_track_id,
      body.xp_amount, xpRequired,
      (body.xp_amount / xpRequired) * maxEffectiveness,
      maxEffectiveness,
      now, now
    ).run();

    // Deduct XP
    await c.env.DB.prepare(`
      UPDATE character_experience SET
        available_xp = available_xp - ?,
        total_xp_spent = total_xp_spent + ?,
        updated_at = ?
      WHERE character_id = ?
    `).bind(body.xp_amount, body.xp_amount, now, body.characterId).run();

    return c.json({
      success: true,
      data: {
        target_track_id: body.target_track_id,
        xp_invested: body.xp_amount,
        current_effectiveness: (body.xp_amount / xpRequired) * maxEffectiveness,
        max_effectiveness: maxEffectiveness,
        is_new: true,
      },
    }, 201);
  }
});

// =============================================================================
// CHARACTER TRACK/SPEC SELECTION ENDPOINTS
// =============================================================================

/**
 * POST /progression/character/select-track
 * Select a track (requires Tier 3)
 */
progressionRoutes.post('/character/select-track', async (c) => {
  const body = await c.req.json<{ characterId: string; track_id: string }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  if (!body.track_id) {
    return c.json({ success: false, errors: [{ message: 'track_id is required' }] }, 400);
  }

  // Get character
  const character = await c.env.DB.prepare(
    'SELECT id, current_tier, track_id FROM characters WHERE id = ?'
  ).bind(body.characterId).first<Character>();

  if (!character) {
    return c.json({ success: false, errors: [{ message: 'Character not found' }] }, 404);
  }

  if (character.current_tier < 3) {
    return c.json({ success: false, errors: [{ message: 'Must be at least Tier 3 to select a track' }] }, 400);
  }

  if (character.track_id) {
    return c.json({ success: false, errors: [{ message: 'Track already selected. Track changes require special quest.' }] }, 400);
  }

  // Verify track exists
  const track = await c.env.DB.prepare(
    'SELECT id, name, code FROM tracks WHERE id = ?'
  ).bind(body.track_id).first<Track>();

  if (!track) {
    return c.json({ success: false, errors: [{ message: 'Track not found' }] }, 404);
  }

  const now = new Date().toISOString();

  await c.env.DB.prepare(
    'UPDATE characters SET track_id = ?, updated_at = ? WHERE id = ?'
  ).bind(body.track_id, now, body.characterId).run();

  return c.json({
    success: true,
    data: {
      track_id: body.track_id,
      track_name: track.name,
      track_code: track.code,
      message: `You have joined the ${track.name} track!`,
    },
  });
});

/**
 * POST /progression/character/select-specialization
 * Select a specialization (requires Tier 6)
 */
progressionRoutes.post('/character/select-specialization', async (c) => {
  const body = await c.req.json<{ characterId: string; specialization_id: string }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  if (!body.specialization_id) {
    return c.json({ success: false, errors: [{ message: 'specialization_id is required' }] }, 400);
  }

  // Get character
  const character = await c.env.DB.prepare(
    'SELECT id, current_tier, track_id, specialization_id FROM characters WHERE id = ?'
  ).bind(body.characterId).first<Character>();

  if (!character) {
    return c.json({ success: false, errors: [{ message: 'Character not found' }] }, 404);
  }

  if (character.current_tier < 6) {
    return c.json({ success: false, errors: [{ message: 'Must be at least Tier 6 to select a specialization' }] }, 400);
  }

  if (!character.track_id) {
    return c.json({ success: false, errors: [{ message: 'Must select a track before specializing' }] }, 400);
  }

  if (character.specialization_id) {
    return c.json({ success: false, errors: [{ message: 'Specialization already selected' }] }, 400);
  }

  // Verify specialization exists and belongs to character's track
  const spec = await c.env.DB.prepare(
    'SELECT id, name, code, track_id FROM specializations WHERE id = ?'
  ).bind(body.specialization_id).first<Specialization>();

  if (!spec) {
    return c.json({ success: false, errors: [{ message: 'Specialization not found' }] }, 404);
  }

  if (spec.track_id !== character.track_id) {
    return c.json({ success: false, errors: [{ message: 'Specialization must be from your track' }] }, 400);
  }

  const now = new Date().toISOString();

  await c.env.DB.prepare(
    'UPDATE characters SET specialization_id = ?, updated_at = ? WHERE id = ?'
  ).bind(body.specialization_id, now, body.characterId).run();

  return c.json({
    success: true,
    data: {
      specialization_id: body.specialization_id,
      specialization_name: spec.name,
      specialization_code: spec.code,
      message: `You have specialized as a ${spec.name}!`,
    },
  });
});
