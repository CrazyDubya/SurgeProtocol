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

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

interface NpcDefinition {
  id: string;
  code: string;
  name: string;
  title: string | null;
  description: string | null;
  background: string | null;
  npc_type: string | null;
  npc_category: string | null;
  is_unique: number;
  is_essential: number;
  is_procedural: number;
  gender: string | null;
  age: number | null;
  ethnicity: string | null;
  height_cm: number | null;
  build: string | null;
  distinguishing_features: string | null;
  portrait_asset: string | null;
  personality_traits: string | null;
  speech_patterns: string | null;
  mannerisms: string | null;
  likes: string | null;
  dislikes: string | null;
  goals: string | null;
  faction_id: string | null;
  faction_rank: string | null;
  employer: string | null;
  occupation: string | null;
  home_location_id: string | null;
  work_location_id: string | null;
  hangout_locations: string | null;
  schedule: string | null;
  combat_capable: number;
  combat_style: string | null;
  threat_level: number;
  skills: string | null;
  abilities: string | null;
  augments: string | null;
  typical_equipment: string | null;
  is_vendor: number;
  vendor_inventory_id: string | null;
  is_quest_giver: number;
  available_quests: string | null;
  is_trainer: number;
  trainable_skills: string | null;
  greeting_dialogue_id: string | null;
  ambient_dialogue: string | null;
  story_importance: number;
  romance_option: number;
  killable_by_player: number;
  death_consequence: string | null;
  created_at: string;
  updated_at: string;
}

interface NpcInstance {
  id: string;
  npc_definition_id: string;
  save_id: string | null;
  is_alive: number;
  is_active: number;
  current_health: number | null;
  current_location_id: string | null;
  current_activity: string | null;
  relationship_with_player: number;
  trust_level: number;
  fear_level: number;
  respect_level: number;
  romantic_interest: number;
  times_met: number;
  last_interaction: string | null;
  dialogue_flags: string | null;
  topics_discussed: string | null;
  secrets_revealed: string | null;
  favors_owed: string | null;
  quests_given: string | null;
  quests_completed: string | null;
  memories_of_player: string | null;
  witnessed_events: string | null;
  grudges: string | null;
  gratitudes: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatNpcDefinition(npc: NpcDefinition) {
  return {
    id: npc.id,
    code: npc.code,
    name: npc.name,
    title: npc.title,
    description: npc.description,
    background: npc.background,
    classification: {
      type: npc.npc_type,
      category: npc.npc_category,
      isUnique: npc.is_unique === 1,
      isEssential: npc.is_essential === 1,
      isProcedural: npc.is_procedural === 1,
    },
    appearance: {
      gender: npc.gender,
      age: npc.age,
      ethnicity: npc.ethnicity,
      heightCm: npc.height_cm,
      build: npc.build,
      distinguishingFeatures: npc.distinguishing_features,
      portraitAsset: npc.portrait_asset,
    },
    personality: {
      traits: npc.personality_traits ? JSON.parse(npc.personality_traits) : [],
      speechPatterns: npc.speech_patterns ? JSON.parse(npc.speech_patterns) : [],
      mannerisms: npc.mannerisms,
      likes: npc.likes ? JSON.parse(npc.likes) : [],
      dislikes: npc.dislikes ? JSON.parse(npc.dislikes) : [],
      goals: npc.goals ? JSON.parse(npc.goals) : [],
    },
    affiliation: {
      factionId: npc.faction_id,
      factionRank: npc.faction_rank,
      employer: npc.employer,
      occupation: npc.occupation,
    },
    locations: {
      homeLocationId: npc.home_location_id,
      workLocationId: npc.work_location_id,
      hangoutLocations: npc.hangout_locations ? JSON.parse(npc.hangout_locations) : [],
      schedule: npc.schedule ? JSON.parse(npc.schedule) : null,
    },
    combat: {
      capable: npc.combat_capable === 1,
      style: npc.combat_style,
      threatLevel: npc.threat_level,
      skills: npc.skills ? JSON.parse(npc.skills) : [],
      abilities: npc.abilities ? JSON.parse(npc.abilities) : [],
      augments: npc.augments ? JSON.parse(npc.augments) : [],
      typicalEquipment: npc.typical_equipment ? JSON.parse(npc.typical_equipment) : [],
    },
    services: {
      isVendor: npc.is_vendor === 1,
      vendorInventoryId: npc.vendor_inventory_id,
      isQuestGiver: npc.is_quest_giver === 1,
      availableQuests: npc.available_quests ? JSON.parse(npc.available_quests) : [],
      isTrainer: npc.is_trainer === 1,
      trainableSkills: npc.trainable_skills ? JSON.parse(npc.trainable_skills) : [],
    },
    dialogue: {
      greetingDialogueId: npc.greeting_dialogue_id,
      ambientDialogue: npc.ambient_dialogue ? JSON.parse(npc.ambient_dialogue) : [],
    },
    narrative: {
      storyImportance: npc.story_importance,
      romanceOption: npc.romance_option === 1,
      killableByPlayer: npc.killable_by_player === 1,
      deathConsequence: npc.death_consequence,
    },
  };
}

function formatNpcInstance(instance: NpcInstance, definition?: NpcDefinition) {
  return {
    id: instance.id,
    definitionId: instance.npc_definition_id,
    saveId: instance.save_id,
    definition: definition ? {
      code: definition.code,
      name: definition.name,
      title: definition.title,
      portraitAsset: definition.portrait_asset,
    } : null,
    state: {
      isAlive: instance.is_alive === 1,
      isActive: instance.is_active === 1,
      currentHealth: instance.current_health,
      currentLocationId: instance.current_location_id,
      currentActivity: instance.current_activity,
    },
    relationship: {
      overall: instance.relationship_with_player,
      trust: instance.trust_level,
      fear: instance.fear_level,
      respect: instance.respect_level,
      romanticInterest: instance.romantic_interest,
      timesMet: instance.times_met,
      lastInteraction: instance.last_interaction,
    },
    dialogue: {
      flags: instance.dialogue_flags ? JSON.parse(instance.dialogue_flags) : {},
      topicsDiscussed: instance.topics_discussed ? JSON.parse(instance.topics_discussed) : [],
      secretsRevealed: instance.secrets_revealed ? JSON.parse(instance.secrets_revealed) : [],
      favorsOwed: instance.favors_owed ? JSON.parse(instance.favors_owed) : [],
    },
    quests: {
      given: instance.quests_given ? JSON.parse(instance.quests_given) : [],
      completed: instance.quests_completed ? JSON.parse(instance.quests_completed) : [],
    },
    memory: {
      memoriesOfPlayer: instance.memories_of_player ? JSON.parse(instance.memories_of_player) : [],
      witnessedEvents: instance.witnessed_events ? JSON.parse(instance.witnessed_events) : [],
      grudges: instance.grudges ? JSON.parse(instance.grudges) : [],
      gratitudes: instance.gratitudes ? JSON.parse(instance.gratitudes) : [],
    },
  };
}

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
  const db = c.env.DB;

  // Query parameters for filtering
  const npcType = c.req.query('type');
  const category = c.req.query('category');
  const factionId = c.req.query('factionId');
  const isVendor = c.req.query('isVendor');
  const isQuestGiver = c.req.query('isQuestGiver');
  const isTrainer = c.req.query('isTrainer');
  const combatCapable = c.req.query('combatCapable');
  const isUnique = c.req.query('isUnique');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  let sql = `SELECT * FROM npc_definitions WHERE 1=1`;
  const params: unknown[] = [];

  if (npcType) {
    sql += ` AND npc_type = ?`;
    params.push(npcType);
  }

  if (category) {
    sql += ` AND npc_category = ?`;
    params.push(category);
  }

  if (factionId) {
    sql += ` AND faction_id = ?`;
    params.push(factionId);
  }

  if (isVendor === 'true') {
    sql += ` AND is_vendor = 1`;
  }

  if (isQuestGiver === 'true') {
    sql += ` AND is_quest_giver = 1`;
  }

  if (isTrainer === 'true') {
    sql += ` AND is_trainer = 1`;
  }

  if (combatCapable === 'true') {
    sql += ` AND combat_capable = 1`;
  }

  if (isUnique === 'true') {
    sql += ` AND is_unique = 1`;
  }

  sql += ` ORDER BY story_importance DESC, name ASC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const result = await db
    .prepare(sql)
    .bind(...params)
    .all<NpcDefinition>();

  const npcs = result.results.map(formatNpcDefinition);

  // Get total count
  let countSql = `SELECT COUNT(*) as total FROM npc_definitions WHERE 1=1`;
  const countParams: unknown[] = [];

  if (npcType) {
    countSql += ` AND npc_type = ?`;
    countParams.push(npcType);
  }
  if (category) {
    countSql += ` AND npc_category = ?`;
    countParams.push(category);
  }
  if (factionId) {
    countSql += ` AND faction_id = ?`;
    countParams.push(factionId);
  }
  if (isVendor === 'true') countSql += ` AND is_vendor = 1`;
  if (isQuestGiver === 'true') countSql += ` AND is_quest_giver = 1`;
  if (isTrainer === 'true') countSql += ` AND is_trainer = 1`;
  if (combatCapable === 'true') countSql += ` AND combat_capable = 1`;
  if (isUnique === 'true') countSql += ` AND is_unique = 1`;

  const countResult = await db
    .prepare(countSql)
    .bind(...countParams)
    .first<{ total: number }>();

  return c.json({
    success: true,
    data: {
      npcs,
      pagination: {
        total: countResult?.total || 0,
        limit,
        offset,
        hasMore: offset + npcs.length < (countResult?.total || 0),
      },
    },
  });
});

/**
 * GET /npcs/vendors
 * List all vendor NPCs.
 */
npcRoutes.get('/vendors', async (c) => {
  const db = c.env.DB;
  const locationId = c.req.query('locationId');

  let sql = `SELECT * FROM npc_definitions WHERE is_vendor = 1`;
  const params: unknown[] = [];

  if (locationId) {
    sql += ` AND (home_location_id = ? OR work_location_id = ?)`;
    params.push(locationId, locationId);
  }

  sql += ` ORDER BY name ASC`;

  const result = await db
    .prepare(sql)
    .bind(...params)
    .all<NpcDefinition>();

  const vendors = result.results.map(npc => ({
    ...formatNpcDefinition(npc),
    vendorInfo: {
      inventoryId: npc.vendor_inventory_id,
    },
  }));

  return c.json({
    success: true,
    data: {
      vendors,
      count: vendors.length,
    },
  });
});

/**
 * GET /npcs/quest-givers
 * List all quest giver NPCs.
 */
npcRoutes.get('/quest-givers', async (c) => {
  const db = c.env.DB;
  const locationId = c.req.query('locationId');

  let sql = `SELECT * FROM npc_definitions WHERE is_quest_giver = 1`;
  const params: unknown[] = [];

  if (locationId) {
    sql += ` AND (home_location_id = ? OR work_location_id = ?)`;
    params.push(locationId, locationId);
  }

  sql += ` ORDER BY story_importance DESC, name ASC`;

  const result = await db
    .prepare(sql)
    .bind(...params)
    .all<NpcDefinition>();

  const questGivers = result.results.map(npc => ({
    ...formatNpcDefinition(npc),
    questInfo: {
      availableQuests: npc.available_quests ? JSON.parse(npc.available_quests) : [],
    },
  }));

  return c.json({
    success: true,
    data: {
      questGivers,
      count: questGivers.length,
    },
  });
});

/**
 * GET /npcs/trainers
 * List all trainer NPCs.
 */
npcRoutes.get('/trainers', async (c) => {
  const db = c.env.DB;
  const skillId = c.req.query('skillId');
  const locationId = c.req.query('locationId');

  let sql = `SELECT * FROM npc_definitions WHERE is_trainer = 1`;
  const params: unknown[] = [];

  if (locationId) {
    sql += ` AND (home_location_id = ? OR work_location_id = ?)`;
    params.push(locationId, locationId);
  }

  sql += ` ORDER BY name ASC`;

  const result = await db
    .prepare(sql)
    .bind(...params)
    .all<NpcDefinition>();

  let trainers = result.results.map(npc => ({
    ...formatNpcDefinition(npc),
    trainerInfo: {
      trainableSkills: npc.trainable_skills ? JSON.parse(npc.trainable_skills) : [],
    },
  }));

  // Filter by skill if specified
  if (skillId) {
    trainers = trainers.filter(t =>
      t.trainerInfo.trainableSkills.some((s: { skillId?: string; id?: string }) =>
        s.skillId === skillId || s.id === skillId
      )
    );
  }

  return c.json({
    success: true,
    data: {
      trainers,
      count: trainers.length,
    },
  });
});

/**
 * GET /npcs/by-location/:locationId
 * Get NPCs assigned to a specific location.
 */
npcRoutes.get('/by-location/:locationId', async (c) => {
  const db = c.env.DB;
  const locationId = c.req.param('locationId');

  const result = await db
    .prepare(`
      SELECT * FROM npc_definitions
      WHERE home_location_id = ?
         OR work_location_id = ?
         OR hangout_locations LIKE ?
      ORDER BY story_importance DESC, name ASC
    `)
    .bind(locationId, locationId, `%"${locationId}"%`)
    .all<NpcDefinition>();

  const npcs = result.results.map(npc => {
    const hangouts = npc.hangout_locations ? JSON.parse(npc.hangout_locations) : [];
    return {
      ...formatNpcDefinition(npc),
      locationRole: npc.home_location_id === locationId ? 'resident' :
                    npc.work_location_id === locationId ? 'worker' : 'visitor',
    };
  });

  return c.json({
    success: true,
    data: {
      locationId,
      npcs,
      count: npcs.length,
    },
  });
});

/**
 * GET /npcs/by-faction/:factionId
 * Get NPCs belonging to a faction.
 */
npcRoutes.get('/by-faction/:factionId', async (c) => {
  const db = c.env.DB;
  const factionId = c.req.param('factionId');

  const result = await db
    .prepare(`
      SELECT * FROM npc_definitions
      WHERE faction_id = ?
      ORDER BY faction_rank DESC, story_importance DESC, name ASC
    `)
    .bind(factionId)
    .all<NpcDefinition>();

  const npcs = result.results.map(formatNpcDefinition);

  // Group by rank
  const byRank: Record<string, typeof npcs> = {};
  for (const npc of npcs) {
    const rank = npc.affiliation.factionRank || 'Member';
    if (!byRank[rank]) byRank[rank] = [];
    byRank[rank].push(npc);
  }

  return c.json({
    success: true,
    data: {
      factionId,
      npcs,
      byRank,
      count: npcs.length,
    },
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
  const db = c.env.DB;
  const saveId = c.req.query('saveId');
  const locationId = c.req.query('locationId');
  const isAlive = c.req.query('isAlive');
  const minRelationship = c.req.query('minRelationship');

  let sql = `
    SELECT ni.*, nd.code, nd.name, nd.title, nd.portrait_asset
    FROM npc_instances ni
    JOIN npc_definitions nd ON ni.npc_definition_id = nd.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (saveId) {
    sql += ` AND ni.save_id = ?`;
    params.push(saveId);
  }

  if (locationId) {
    sql += ` AND ni.current_location_id = ?`;
    params.push(locationId);
  }

  if (isAlive === 'true') {
    sql += ` AND ni.is_alive = 1`;
  } else if (isAlive === 'false') {
    sql += ` AND ni.is_alive = 0`;
  }

  if (minRelationship) {
    sql += ` AND ni.relationship_with_player >= ?`;
    params.push(parseInt(minRelationship));
  }

  sql += ` ORDER BY nd.story_importance DESC, nd.name ASC`;

  const result = await db
    .prepare(sql)
    .bind(...params)
    .all<NpcInstance & { code: string; name: string; title: string | null; portrait_asset: string | null }>();

  const instances = result.results.map(inst => ({
    id: inst.id,
    definitionId: inst.npc_definition_id,
    saveId: inst.save_id,
    definition: {
      code: inst.code,
      name: inst.name,
      title: inst.title,
      portraitAsset: inst.portrait_asset,
    },
    state: {
      isAlive: inst.is_alive === 1,
      isActive: inst.is_active === 1,
      currentHealth: inst.current_health,
      currentLocationId: inst.current_location_id,
      currentActivity: inst.current_activity,
    },
    relationship: {
      overall: inst.relationship_with_player,
      trust: inst.trust_level,
      fear: inst.fear_level,
      respect: inst.respect_level,
      timesMet: inst.times_met,
      lastInteraction: inst.last_interaction,
    },
  }));

  return c.json({
    success: true,
    data: {
      instances,
      count: instances.length,
    },
  });
});

/**
 * GET /npcs/instances/at-location/:locationId
 * Get all NPC instances currently at a location.
 */
npcRoutes.get('/instances/at-location/:locationId', async (c) => {
  const db = c.env.DB;
  const locationId = c.req.param('locationId');
  const saveId = c.req.query('saveId');

  let sql = `
    SELECT ni.*, nd.code, nd.name, nd.title, nd.portrait_asset, nd.is_vendor,
           nd.is_quest_giver, nd.is_trainer, nd.occupation
    FROM npc_instances ni
    JOIN npc_definitions nd ON ni.npc_definition_id = nd.id
    WHERE ni.current_location_id = ? AND ni.is_alive = 1 AND ni.is_active = 1
  `;
  const params: unknown[] = [locationId];

  if (saveId) {
    sql += ` AND ni.save_id = ?`;
    params.push(saveId);
  }

  sql += ` ORDER BY nd.story_importance DESC, nd.name ASC`;

  const result = await db
    .prepare(sql)
    .bind(...params)
    .all<NpcInstance & {
      code: string;
      name: string;
      title: string | null;
      portrait_asset: string | null;
      is_vendor: number;
      is_quest_giver: number;
      is_trainer: number;
      occupation: string | null;
    }>();

  const npcsAtLocation = result.results.map(inst => ({
    instanceId: inst.id,
    definitionId: inst.npc_definition_id,
    code: inst.code,
    name: inst.name,
    title: inst.title,
    portraitAsset: inst.portrait_asset,
    occupation: inst.occupation,
    currentActivity: inst.current_activity,
    services: {
      isVendor: inst.is_vendor === 1,
      isQuestGiver: inst.is_quest_giver === 1,
      isTrainer: inst.is_trainer === 1,
    },
    relationship: {
      overall: inst.relationship_with_player,
      trust: inst.trust_level,
      timesMet: inst.times_met,
    },
  }));

  return c.json({
    success: true,
    data: {
      locationId,
      npcs: npcsAtLocation,
      count: npcsAtLocation.length,
    },
  });
});

/**
 * GET /npcs/instances/:instanceId
 * Get detailed NPC instance state.
 */
npcRoutes.get('/instances/:instanceId', async (c) => {
  const db = c.env.DB;
  const instanceId = c.req.param('instanceId');

  const instance = await db
    .prepare(`SELECT * FROM npc_instances WHERE id = ?`)
    .bind(instanceId)
    .first<NpcInstance>();

  if (!instance) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'NPC instance not found' }],
    }, 404);
  }

  const definition = await db
    .prepare(`SELECT * FROM npc_definitions WHERE id = ?`)
    .bind(instance.npc_definition_id)
    .first<NpcDefinition>();

  // Get current location info
  let currentLocation = null;
  if (instance.current_location_id) {
    currentLocation = await db
      .prepare(`SELECT id, code, name FROM locations WHERE id = ?`)
      .bind(instance.current_location_id)
      .first<{ id: string; code: string; name: string }>();
  }

  return c.json({
    success: true,
    data: {
      ...formatNpcInstance(instance, definition || undefined),
      currentLocation,
      fullDefinition: definition ? formatNpcDefinition(definition) : null,
    },
  });
});

/**
 * PATCH /npcs/instances/:instanceId
 * Update NPC instance state.
 */
npcRoutes.patch('/instances/:instanceId', async (c) => {
  const db = c.env.DB;
  const instanceId = c.req.param('instanceId');

  let body: {
    currentLocationId?: string;
    currentActivity?: string;
    currentHealth?: number;
    isAlive?: boolean;
    isActive?: boolean;
    relationshipChange?: number;
    trustChange?: number;
    fearChange?: number;
    respectChange?: number;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({
      success: false,
      errors: [{ code: 'INVALID_JSON', message: 'Invalid JSON body' }],
    }, 400);
  }

  // Get current instance
  const instance = await db
    .prepare(`SELECT * FROM npc_instances WHERE id = ?`)
    .bind(instanceId)
    .first<NpcInstance>();

  if (!instance) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'NPC instance not found' }],
    }, 404);
  }

  // Build update query
  const updates: string[] = [];
  const params: unknown[] = [];

  if (body.currentLocationId !== undefined) {
    updates.push('current_location_id = ?');
    params.push(body.currentLocationId);
  }

  if (body.currentActivity !== undefined) {
    updates.push('current_activity = ?');
    params.push(body.currentActivity);
  }

  if (body.currentHealth !== undefined) {
    updates.push('current_health = ?');
    params.push(body.currentHealth);
  }

  if (body.isAlive !== undefined) {
    updates.push('is_alive = ?');
    params.push(body.isAlive ? 1 : 0);
  }

  if (body.isActive !== undefined) {
    updates.push('is_active = ?');
    params.push(body.isActive ? 1 : 0);
  }

  if (body.relationshipChange) {
    const newRel = Math.max(-100, Math.min(100, instance.relationship_with_player + body.relationshipChange));
    updates.push('relationship_with_player = ?');
    params.push(newRel);
  }

  if (body.trustChange) {
    const newTrust = Math.max(0, Math.min(100, instance.trust_level + body.trustChange));
    updates.push('trust_level = ?');
    params.push(newTrust);
  }

  if (body.fearChange) {
    const newFear = Math.max(0, Math.min(100, instance.fear_level + body.fearChange));
    updates.push('fear_level = ?');
    params.push(newFear);
  }

  if (body.respectChange) {
    const newRespect = Math.max(0, Math.min(100, instance.respect_level + body.respectChange));
    updates.push('respect_level = ?');
    params.push(newRespect);
  }

  if (updates.length === 0) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_UPDATES', message: 'No valid updates provided' }],
    }, 400);
  }

  updates.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(instanceId);

  await db
    .prepare(`UPDATE npc_instances SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...params)
    .run();

  // Get updated instance
  const updated = await db
    .prepare(`SELECT * FROM npc_instances WHERE id = ?`)
    .bind(instanceId)
    .first<NpcInstance>();

  return c.json({
    success: true,
    data: formatNpcInstance(updated!),
  });
});

/**
 * POST /npcs/instances/:instanceId/interact
 * Record an interaction with an NPC.
 */
npcRoutes.post('/instances/:instanceId/interact', async (c) => {
  const db = c.env.DB;
  const instanceId = c.req.param('instanceId');

  let body: {
    interactionType: string;
    outcome?: 'positive' | 'negative' | 'neutral';
    topicDiscussed?: string;
    secretRevealed?: string;
    memory?: string;
    relationshipImpact?: number;
    trustImpact?: number;
    respectImpact?: number;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({
      success: false,
      errors: [{ code: 'INVALID_JSON', message: 'Invalid JSON body' }],
    }, 400);
  }

  const { interactionType, outcome = 'neutral', topicDiscussed, secretRevealed, memory, relationshipImpact = 0, trustImpact = 0, respectImpact = 0 } = body;

  if (!interactionType) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_TYPE', message: 'interactionType is required' }],
    }, 400);
  }

  // Get current instance
  const instance = await db
    .prepare(`SELECT * FROM npc_instances WHERE id = ?`)
    .bind(instanceId)
    .first<NpcInstance>();

  if (!instance) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'NPC instance not found' }],
    }, 404);
  }

  if (instance.is_alive !== 1) {
    return c.json({
      success: false,
      errors: [{ code: 'NPC_DEAD', message: 'Cannot interact with dead NPC' }],
    }, 400);
  }

  // Calculate changes based on outcome
  let relChange = relationshipImpact;
  let trustChange = trustImpact;
  let respectChange = respectImpact;

  if (outcome === 'positive' && relChange === 0) relChange = 5;
  if (outcome === 'negative' && relChange === 0) relChange = -5;

  const now = new Date().toISOString();

  // Update relationship values
  const newRelationship = Math.max(-100, Math.min(100, instance.relationship_with_player + relChange));
  const newTrust = Math.max(0, Math.min(100, instance.trust_level + trustChange));
  const newRespect = Math.max(0, Math.min(100, instance.respect_level + respectChange));

  // Update topics discussed
  let topicsDiscussed = instance.topics_discussed ? JSON.parse(instance.topics_discussed) : [];
  if (topicDiscussed && !topicsDiscussed.includes(topicDiscussed)) {
    topicsDiscussed.push(topicDiscussed);
  }

  // Update secrets revealed
  let secretsRevealed = instance.secrets_revealed ? JSON.parse(instance.secrets_revealed) : [];
  if (secretRevealed && !secretsRevealed.includes(secretRevealed)) {
    secretsRevealed.push(secretRevealed);
  }

  // Update memories
  let memories = instance.memories_of_player ? JSON.parse(instance.memories_of_player) : [];
  if (memory) {
    memories.push({
      memory,
      timestamp: now,
      outcome,
    });
    // Keep last 20 memories
    if (memories.length > 20) memories = memories.slice(-20);
  }

  // Calculate new times_met (can't use times_met + 1 in mock DB)
  const newTimesMet = instance.times_met + 1;

  await db
    .prepare(`UPDATE npc_instances SET
      times_met = ?,
      last_interaction = ?,
      relationship_with_player = ?,
      trust_level = ?,
      respect_level = ?,
      topics_discussed = ?,
      secrets_revealed = ?,
      memories_of_player = ?,
      updated_at = ?
     WHERE id = ?`)
    .bind(
      newTimesMet,
      now,
      newRelationship,
      newTrust,
      newRespect,
      JSON.stringify(topicsDiscussed),
      JSON.stringify(secretsRevealed),
      JSON.stringify(memories),
      now,
      instanceId
    )
    .run();

  // Get updated instance
  const updated = await db
    .prepare(`SELECT * FROM npc_instances WHERE id = ?`)
    .bind(instanceId)
    .first<NpcInstance>();

  return c.json({
    success: true,
    data: {
      interaction: {
        type: interactionType,
        outcome,
        timestamp: now,
      },
      changes: {
        relationship: { before: instance.relationship_with_player, after: newRelationship, change: relChange },
        trust: { before: instance.trust_level, after: newTrust, change: trustChange },
        respect: { before: instance.respect_level, after: newRespect, change: respectChange },
        timesMet: updated!.times_met,
      },
      newSecrets: secretRevealed ? [secretRevealed] : [],
      newTopics: topicDiscussed ? [topicDiscussed] : [],
    },
  });
});

// =============================================================================
// NPC DEFINITION ENDPOINTS (parameterized routes must come after static routes)
// =============================================================================

/**
 * GET /npcs/:id
 * Get a specific NPC definition by ID or code.
 */
npcRoutes.get('/:id', async (c) => {
  const db = c.env.DB;
  const npcId = c.req.param('id');

  // Try by ID first, then by code
  let npc = await db
    .prepare(`SELECT * FROM npc_definitions WHERE id = ?`)
    .bind(npcId)
    .first<NpcDefinition>();

  if (!npc) {
    npc = await db
      .prepare(`SELECT * FROM npc_definitions WHERE code = ?`)
      .bind(npcId)
      .first<NpcDefinition>();
  }

  if (!npc) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'NPC not found' }],
    }, 404);
  }

  // Get faction info if applicable
  let faction = null;
  if (npc.faction_id) {
    faction = await db
      .prepare(`SELECT id, code, name FROM factions WHERE id = ?`)
      .bind(npc.faction_id)
      .first<{ id: string; code: string; name: string }>();
  }

  // Get location info
  const locations: Record<string, unknown> = {};
  if (npc.home_location_id) {
    locations.home = await db
      .prepare(`SELECT id, code, name FROM locations WHERE id = ?`)
      .bind(npc.home_location_id)
      .first<{ id: string; code: string; name: string }>();
  }
  if (npc.work_location_id) {
    locations.work = await db
      .prepare(`SELECT id, code, name FROM locations WHERE id = ?`)
      .bind(npc.work_location_id)
      .first<{ id: string; code: string; name: string }>();
  }

  return c.json({
    success: true,
    data: {
      ...formatNpcDefinition(npc),
      faction,
      locationDetails: locations,
    },
  });
});

/**
 * POST /npcs/:id/spawn
 * Create an instance of an NPC for a save game.
 */
npcRoutes.post('/:id/spawn', async (c) => {
  const db = c.env.DB;
  const npcDefinitionId = c.req.param('id');

  let body: {
    saveId?: string;
    locationId?: string;
    initialRelationship?: number;
  };

  try {
    body = await c.req.json();
  } catch {
    body = {};
  }

  const { saveId, locationId, initialRelationship = 0 } = body;

  // Get NPC definition
  let npcDef = await db
    .prepare(`SELECT * FROM npc_definitions WHERE id = ?`)
    .bind(npcDefinitionId)
    .first<NpcDefinition>();

  if (!npcDef) {
    npcDef = await db
      .prepare(`SELECT * FROM npc_definitions WHERE code = ?`)
      .bind(npcDefinitionId)
      .first<NpcDefinition>();
  }

  if (!npcDef) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'NPC definition not found' }],
    }, 404);
  }

  // Check if instance already exists for this save
  if (saveId) {
    const existing = await db
      .prepare(`SELECT id FROM npc_instances WHERE npc_definition_id = ? AND save_id = ?`)
      .bind(npcDef.id, saveId)
      .first();

    if (existing) {
      return c.json({
        success: false,
        errors: [{ code: 'ALREADY_EXISTS', message: 'NPC instance already exists for this save' }],
      }, 409);
    }
  }

  // Create instance
  const instanceId = `npc-inst-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const spawnLocation = locationId || npcDef.home_location_id || npcDef.work_location_id;

  await db
    .prepare(`INSERT INTO npc_instances (
      id, npc_definition_id, save_id, current_location_id, relationship_with_player
    ) VALUES (?, ?, ?, ?, ?)`)
    .bind(instanceId, npcDef.id, saveId || null, spawnLocation, initialRelationship)
    .run();

  const instance = await db
    .prepare(`SELECT * FROM npc_instances WHERE id = ?`)
    .bind(instanceId)
    .first<NpcInstance>();

  return c.json({
    success: true,
    data: formatNpcInstance(instance!, npcDef),
  }, 201);
});
