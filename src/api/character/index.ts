/**
 * Surge Protocol - Character Routes
 *
 * Endpoints:
 * - POST /characters - Create new character
 * - GET /characters - List user's characters
 * - GET /characters/:id - Get character details
 * - PATCH /characters/:id - Update character
 * - POST /characters/:id/select - Select as active character
 * - GET /characters/:id/stats - Get full character stats
 * - GET /characters/:id/inventory - Get character inventory
 * - GET /characters/:id/factions - Get faction standings
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import {
  authMiddleware,
  generateTokenPair,
  type AuthVariables,
} from '../../middleware/auth';
import {
  getCharacter,
  getCharacterAttributes,
  getCharacterInventory,
  createCharacter,
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

const createCharacterSchema = z.object({
  legalName: z.string().min(2).max(100),
  streetName: z.string().min(2).max(50).optional(),
  handle: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  sex: z.enum(['MALE', 'FEMALE', 'NONBINARY', 'SYNTHETIC', 'UNKNOWN']).optional(),
  age: z.number().int().min(16).max(120).optional(),
  attributes: z.object({
    PWR: z.number().int().min(1).max(10),
    AGI: z.number().int().min(1).max(10),
    END: z.number().int().min(1).max(10),
    VEL: z.number().int().min(1).max(10),
    INT: z.number().int().min(1).max(10),
    WIS: z.number().int().min(1).max(10),
    EMP: z.number().int().min(1).max(10),
    PRC: z.number().int().min(1).max(10),
  }).optional(),
});

const updateCharacterSchema = z.object({
  streetName: z.string().min(2).max(50).optional(),
  handle: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/).optional(),
});

// =============================================================================
// ROUTES
// =============================================================================

export const characterRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// Apply auth middleware to all routes
characterRoutes.use('*', authMiddleware());

/**
 * POST /characters
 * Create a new character for the authenticated user.
 */
characterRoutes.post('/', zValidator('json', createCharacterSchema), async (c) => {
  const userId = c.get('userId');
  const data = c.req.valid('json');

  // Check character limit (max 3 per user)
  const existingCount = await c.env.DB
    .prepare('SELECT COUNT(*) as count FROM characters WHERE player_id = ?')
    .bind(userId)
    .first<{ count: number }>();

  if (existingCount && existingCount.count >= 3) {
    return c.json({
      success: false,
      errors: [{ code: 'CHARACTER_LIMIT', message: 'Maximum 3 characters per account' }],
    }, 400);
  }

  // Check handle uniqueness
  if (data.handle) {
    const handleExists = await c.env.DB
      .prepare('SELECT id FROM characters WHERE handle = ?')
      .bind(data.handle)
      .first();

    if (handleExists) {
      return c.json({
        success: false,
        errors: [{ code: 'HANDLE_TAKEN', message: 'Handle already in use' }],
      }, 409);
    }
  }

  // Validate attribute point buy (if provided)
  if (data.attributes) {
    const totalPoints = Object.values(data.attributes).reduce((sum, v) => sum + v, 0);
    const expectedPoints = 40; // 8 attributes * 5 base
    if (totalPoints !== expectedPoints) {
      return c.json({
        success: false,
        errors: [{
          code: 'INVALID_ATTRIBUTES',
          message: `Attribute points must total ${expectedPoints}, got ${totalPoints}`,
        }],
      }, 400);
    }
  }

  // Create character
  const characterId = await createCharacter(c.env.DB, {
    playerId: userId,
    legalName: data.legalName,
    streetName: data.streetName,
    handle: data.handle,
    sex: data.sex,
    age: data.age,
  });

  // Initialize attributes if provided
  if (data.attributes) {
    const attributeCodes = ['PWR', 'AGI', 'END', 'VEL', 'INT', 'WIS', 'EMP', 'PRC'];

    for (const code of attributeCodes) {
      const value = data.attributes[code as keyof typeof data.attributes];

      // Get attribute definition ID
      const attrDef = await c.env.DB
        .prepare('SELECT id FROM attribute_definitions WHERE code = ?')
        .bind(code)
        .first<{ id: string }>();

      if (attrDef) {
        await c.env.DB
          .prepare(
            `INSERT INTO character_attributes (id, character_id, attribute_id, base_value, current_value)
             VALUES (?, ?, ?, ?, ?)`
          )
          .bind(nanoid(), characterId, attrDef.id, value, value)
          .run();
      }
    }
  }

  // Fetch created character
  const character = await getCharacter(c.env.DB, characterId);

  return c.json({
    success: true,
    data: { character },
  }, 201);
});

/**
 * GET /characters
 * List all characters for the authenticated user.
 */
characterRoutes.get('/', async (c) => {
  const userId = c.get('userId');

  const result = await c.env.DB
    .prepare(
      `SELECT id, legal_name, street_name, handle, current_tier, carrier_rating,
              current_health, max_health, is_active, created_at
       FROM characters
       WHERE player_id = ?
       ORDER BY is_active DESC, updated_at DESC`
    )
    .bind(userId)
    .all();

  return c.json({
    success: true,
    data: {
      characters: result.results,
      count: result.results.length,
    },
  });
});

/**
 * GET /characters/:id
 * Get detailed character information.
 */
characterRoutes.get('/:id', async (c) => {
  const userId = c.get('userId');
  const characterId = c.req.param('id');

  const character = await c.env.DB
    .prepare(
      `SELECT * FROM characters WHERE id = ? AND player_id = ?`
    )
    .bind(characterId, userId)
    .first();

  if (!character) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Character not found' }],
    }, 404);
  }

  // Get attributes
  const attributes = await getCharacterAttributes(c.env.DB, characterId);

  // Get rating components
  const ratingComponents = await c.env.DB
    .prepare('SELECT * FROM rating_components WHERE character_id = ?')
    .bind(characterId)
    .first();

  return c.json({
    success: true,
    data: {
      character,
      attributes,
      ratingComponents,
    },
  });
});

/**
 * PATCH /characters/:id
 * Update character details (limited fields).
 */
characterRoutes.patch('/:id', zValidator('json', updateCharacterSchema), async (c) => {
  const userId = c.get('userId');
  const characterId = c.req.param('id');
  const updates = c.req.valid('json');

  // Verify ownership
  const character = await c.env.DB
    .prepare('SELECT id FROM characters WHERE id = ? AND player_id = ?')
    .bind(characterId, userId)
    .first();

  if (!character) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Character not found' }],
    }, 404);
  }

  // Check handle uniqueness if changing
  if (updates.handle) {
    const handleExists = await c.env.DB
      .prepare('SELECT id FROM characters WHERE handle = ? AND id != ?')
      .bind(updates.handle, characterId)
      .first();

    if (handleExists) {
      return c.json({
        success: false,
        errors: [{ code: 'HANDLE_TAKEN', message: 'Handle already in use' }],
      }, 409);
    }
  }

  // Build update query
  const setClauses: string[] = ["updated_at = datetime('now')"];
  const values: (string | null)[] = [];

  if (updates.streetName !== undefined) {
    setClauses.push('street_name = ?');
    values.push(updates.streetName);
  }
  if (updates.handle !== undefined) {
    setClauses.push('handle = ?');
    values.push(updates.handle);
  }

  values.push(characterId);

  await c.env.DB
    .prepare(`UPDATE characters SET ${setClauses.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  const updated = await getCharacter(c.env.DB, characterId);

  return c.json({
    success: true,
    data: { character: updated },
  });
});

/**
 * POST /characters/:id/select
 * Select a character as the active character.
 * Returns new tokens with characterId.
 */
characterRoutes.post('/:id/select', async (c) => {
  const userId = c.get('userId');
  const characterId = c.req.param('id');

  // Verify ownership and character is alive
  const character = await c.env.DB
    .prepare('SELECT id, is_dead FROM characters WHERE id = ? AND player_id = ?')
    .bind(characterId, userId)
    .first<{ id: string; is_dead: number }>();

  if (!character) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Character not found' }],
    }, 404);
  }

  if (character.is_dead) {
    return c.json({
      success: false,
      errors: [{ code: 'CHARACTER_DEAD', message: 'Cannot select a dead character' }],
    }, 400);
  }

  // Deactivate other characters
  await c.env.DB
    .prepare('UPDATE characters SET is_active = 0 WHERE player_id = ?')
    .bind(userId)
    .run();

  // Activate selected character
  await c.env.DB
    .prepare("UPDATE characters SET is_active = 1, last_played = datetime('now') WHERE id = ?")
    .bind(characterId)
    .run();

  // Generate new tokens with character ID
  const tokens = await generateTokenPair(userId, characterId, c.env.JWT_SECRET);

  return c.json({
    success: true,
    data: {
      characterId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    },
  });
});

/**
 * GET /characters/:id/stats
 * Get full character statistics.
 */
characterRoutes.get('/:id/stats', async (c) => {
  const userId = c.get('userId');
  const characterId = c.req.param('id');

  // Verify ownership
  const character = await c.env.DB
    .prepare('SELECT id FROM characters WHERE id = ? AND player_id = ?')
    .bind(characterId, userId)
    .first();

  if (!character) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Character not found' }],
    }, 404);
  }

  // Get attributes with effective values
  const attributes = await c.env.DB
    .prepare(
      `SELECT ad.code, ad.name, ca.base_value, ca.current_value,
              ca.bonus_from_augments, ca.bonus_from_items, ca.bonus_from_conditions,
              (ca.current_value + ca.bonus_from_augments + ca.bonus_from_items +
               ca.bonus_from_conditions + ca.temporary_modifier) as effective_value
       FROM character_attributes ca
       JOIN attribute_definitions ad ON ca.attribute_id = ad.id
       WHERE ca.character_id = ?`
    )
    .bind(characterId)
    .all();

  // Get skills
  const skills = await c.env.DB
    .prepare(
      `SELECT sd.code, sd.name, cs.current_level, cs.xp_invested
       FROM character_skills cs
       JOIN skill_definitions sd ON cs.skill_id = sd.id
       WHERE cs.character_id = ?`
    )
    .bind(characterId)
    .all();

  // Get equipped items
  const equipped = await c.env.DB
    .prepare(
      `SELECT ci.equipped_slot, id.name, id.item_type, id.rarity
       FROM character_inventory ci
       JOIN item_definitions id ON ci.item_id = id.id
       WHERE ci.character_id = ? AND ci.is_equipped = 1`
    )
    .bind(characterId)
    .all();

  // Get active conditions
  const conditions = await c.env.DB
    .prepare(
      `SELECT cc.*, cd.name, cd.effect_description
       FROM character_conditions cc
       JOIN condition_definitions cd ON cc.condition_id = cd.id
       WHERE cc.character_id = ? AND cc.is_active = 1`
    )
    .bind(characterId)
    .all();

  return c.json({
    success: true,
    data: {
      attributes: attributes.results,
      skills: skills.results,
      equipped: equipped.results,
      conditions: conditions.results,
    },
  });
});

/**
 * GET /characters/:id/inventory
 * Get character's full inventory.
 */
characterRoutes.get('/:id/inventory', async (c) => {
  const userId = c.get('userId');
  const characterId = c.req.param('id');

  // Verify ownership
  const character = await c.env.DB
    .prepare('SELECT id FROM characters WHERE id = ? AND player_id = ?')
    .bind(characterId, userId)
    .first();

  if (!character) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Character not found' }],
    }, 404);
  }

  const inventory = await getCharacterInventory(c.env.DB, characterId);

  // Get character's credits
  const finances = await c.env.DB
    .prepare('SELECT * FROM character_finances WHERE character_id = ?')
    .bind(characterId)
    .first();

  return c.json({
    success: true,
    data: {
      items: inventory,
      finances,
    },
  });
});

/**
 * GET /characters/:id/factions
 * Get character's faction standings.
 */
characterRoutes.get('/:id/factions', async (c) => {
  const userId = c.get('userId');
  const characterId = c.req.param('id');

  // Verify ownership
  const character = await c.env.DB
    .prepare('SELECT id FROM characters WHERE id = ? AND player_id = ?')
    .bind(characterId, userId)
    .first();

  if (!character) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Character not found' }],
    }, 404);
  }

  const standings = await c.env.DB
    .prepare(
      `SELECT cr.*, f.name as faction_name, f.faction_type, f.is_hostile_default
       FROM character_reputations cr
       JOIN factions f ON cr.faction_id = f.id
       WHERE cr.character_id = ?
       ORDER BY cr.reputation_value DESC`
    )
    .bind(characterId)
    .all();

  return c.json({
    success: true,
    data: {
      standings: standings.results,
    },
  });
});

// =============================================================================
// BACKSTORY ENDPOINTS
// =============================================================================

/**
 * GET /characters/:id/backstory
 * Get character's backstory/biographical information.
 */
characterRoutes.get('/:id/backstory', async (c) => {
  const userId = c.get('userId');
  const characterId = c.req.param('id');

  // Verify ownership
  const character = await c.env.DB
    .prepare('SELECT id FROM characters WHERE id = ? AND player_id = ?')
    .bind(characterId, userId)
    .first();

  if (!character) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Character not found' }],
    }, 404);
  }

  const backstory = await c.env.DB
    .prepare('SELECT * FROM character_backstory WHERE character_id = ?')
    .bind(characterId)
    .first();

  if (!backstory) {
    return c.json({
      success: true,
      data: { backstory: null },
    });
  }

  return c.json({
    success: true,
    data: {
      backstory: {
        id: backstory.id,
        characterId: backstory.character_id,
        originType: backstory.origin_type,
        originLocationId: backstory.origin_location_id,
        originNarrative: backstory.origin_narrative,
        familyStatus: backstory.family_status,
        familyDescription: backstory.family_description,
        familyDebtAmount: backstory.family_debt_amount,
        educationLevel: backstory.education_level,
        educationInstitution: backstory.education_institution,
        educationSpecialty: backstory.education_specialty,
        previousOccupation: backstory.previous_occupation,
        previousEmployer: backstory.previous_employer,
        yearsAsCourier: backstory.years_as_courier,
        primaryMotivation: backstory.primary_motivation,
        secondaryMotivation: backstory.secondary_motivation,
        longTermGoal: backstory.long_term_goal,
        hiddenPast: backstory.hidden_past,
        darkSecret: backstory.dark_secret,
        createdAt: backstory.created_at,
        updatedAt: backstory.updated_at,
      },
    },
  });
});

/**
 * POST /characters/:id/backstory
 * Create or update character's backstory.
 */
characterRoutes.post('/:id/backstory', async (c) => {
  const userId = c.get('userId');
  const characterId = c.req.param('id');
  const body = await c.req.json();

  // Verify ownership
  const character = await c.env.DB
    .prepare('SELECT id FROM characters WHERE id = ? AND player_id = ?')
    .bind(characterId, userId)
    .first();

  if (!character) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Character not found' }],
    }, 404);
  }

  const now = new Date().toISOString();

  // Check if backstory exists
  const existing = await c.env.DB
    .prepare('SELECT id FROM character_backstory WHERE character_id = ?')
    .bind(characterId)
    .first();

  if (existing) {
    // Update existing backstory
    await c.env.DB
      .prepare(
        `UPDATE character_backstory SET
          origin_type = COALESCE(?, origin_type),
          origin_location_id = COALESCE(?, origin_location_id),
          origin_narrative = COALESCE(?, origin_narrative),
          family_status = COALESCE(?, family_status),
          family_description = COALESCE(?, family_description),
          family_debt_amount = COALESCE(?, family_debt_amount),
          education_level = COALESCE(?, education_level),
          education_institution = COALESCE(?, education_institution),
          education_specialty = COALESCE(?, education_specialty),
          previous_occupation = COALESCE(?, previous_occupation),
          previous_employer = COALESCE(?, previous_employer),
          years_as_courier = COALESCE(?, years_as_courier),
          primary_motivation = COALESCE(?, primary_motivation),
          secondary_motivation = COALESCE(?, secondary_motivation),
          long_term_goal = COALESCE(?, long_term_goal),
          hidden_past = COALESCE(?, hidden_past),
          dark_secret = COALESCE(?, dark_secret),
          updated_at = ?
         WHERE character_id = ?`
      )
      .bind(
        body.originType || null,
        body.originLocationId || null,
        body.originNarrative || null,
        body.familyStatus || null,
        body.familyDescription || null,
        body.familyDebtAmount || null,
        body.educationLevel || null,
        body.educationInstitution || null,
        body.educationSpecialty || null,
        body.previousOccupation || null,
        body.previousEmployer || null,
        body.yearsAsCourier || null,
        body.primaryMotivation || null,
        body.secondaryMotivation || null,
        body.longTermGoal || null,
        body.hiddenPast || null,
        body.darkSecret || null,
        now,
        characterId
      )
      .run();

    return c.json({
      success: true,
      data: { message: 'Backstory updated' },
    });
  } else {
    // Create new backstory
    const id = nanoid();

    await c.env.DB
      .prepare(
        `INSERT INTO character_backstory (
          id, character_id, origin_type, origin_location_id, origin_narrative,
          family_status, family_description, family_debt_amount,
          education_level, education_institution, education_specialty,
          previous_occupation, previous_employer, years_as_courier,
          primary_motivation, secondary_motivation, long_term_goal,
          hidden_past, dark_secret, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        characterId,
        body.originType || null,
        body.originLocationId || null,
        body.originNarrative || null,
        body.familyStatus || null,
        body.familyDescription || null,
        body.familyDebtAmount || 0,
        body.educationLevel || null,
        body.educationInstitution || null,
        body.educationSpecialty || null,
        body.previousOccupation || null,
        body.previousEmployer || null,
        body.yearsAsCourier || 0,
        body.primaryMotivation || null,
        body.secondaryMotivation || null,
        body.longTermGoal || null,
        body.hiddenPast || null,
        body.darkSecret || null,
        now,
        now
      )
      .run();

    return c.json({
      success: true,
      data: { id, message: 'Backstory created' },
    }, 201);
  }
});

// =============================================================================
// MEMORIES ENDPOINTS
// =============================================================================

/**
 * GET /characters/:id/memories
 * Get character's memories.
 */
characterRoutes.get('/:id/memories', async (c) => {
  const userId = c.get('userId');
  const characterId = c.req.param('id');
  const memoryType = c.req.query('type');
  const includeCorrupted = c.req.query('includeCorrupted') === 'true';
  const includeSold = c.req.query('includeSold') === 'true';

  // Verify ownership
  const character = await c.env.DB
    .prepare('SELECT id FROM characters WHERE id = ? AND player_id = ?')
    .bind(characterId, userId)
    .first();

  if (!character) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Character not found' }],
    }, 404);
  }

  let query = `
    SELECT cm.*, n.name as source_npc_name, md.title as source_mission_title
    FROM character_memories cm
    LEFT JOIN npc_definitions n ON cm.source_npc_id = n.id
    LEFT JOIN mission_definitions md ON cm.source_mission_id = md.id
    WHERE cm.character_id = ?
  `;
  const params: unknown[] = [characterId];

  if (memoryType) {
    query += ' AND cm.memory_type = ?';
    params.push(memoryType);
  }

  if (!includeCorrupted) {
    query += ' AND cm.is_corrupted = 0';
  }

  if (!includeSold) {
    query += ' AND cm.is_sold = 0';
  }

  query += ' ORDER BY cm.occurred_at DESC, cm.created_at DESC';

  const result = await c.env.DB
    .prepare(query)
    .bind(...params)
    .all();

  const memories = result.results.map((row) => ({
    id: row.id,
    characterId: row.character_id,
    memoryType: row.memory_type,
    title: row.title,
    description: row.description,
    emotionalWeight: row.emotional_weight,
    isReal: row.is_real === 1,
    isImplanted: row.is_implanted === 1,
    sourceNpcId: row.source_npc_id,
    sourceNpcName: row.source_npc_name,
    sourceMissionId: row.source_mission_id,
    sourceMissionTitle: row.source_mission_title,
    isLocked: row.is_locked === 1,
    isCorrupted: row.is_corrupted === 1,
    isSold: row.is_sold === 1,
    memoryValueCreds: row.memory_value_creds,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
  }));

  return c.json({
    success: true,
    data: {
      memories,
      total: memories.length,
    },
  });
});

/**
 * GET /characters/:id/memories/:memoryId
 * Get a specific memory with full details.
 */
characterRoutes.get('/:id/memories/:memoryId', async (c) => {
  const userId = c.get('userId');
  const characterId = c.req.param('id');
  const memoryId = c.req.param('memoryId');

  // Verify ownership
  const character = await c.env.DB
    .prepare('SELECT id FROM characters WHERE id = ? AND player_id = ?')
    .bind(characterId, userId)
    .first();

  if (!character) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Character not found' }],
    }, 404);
  }

  const memory = await c.env.DB
    .prepare(
      `SELECT cm.*, n.name as source_npc_name, md.title as source_mission_title
       FROM character_memories cm
       LEFT JOIN npc_definitions n ON cm.source_npc_id = n.id
       LEFT JOIN mission_definitions md ON cm.source_mission_id = md.id
       WHERE cm.id = ? AND cm.character_id = ?`
    )
    .bind(memoryId, characterId)
    .first();

  if (!memory) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Memory not found' }],
    }, 404);
  }

  // Parse JSON fields
  let triggerConditions = null;
  let narrativeUnlocks = null;
  try {
    if (memory.trigger_conditions) {
      triggerConditions = JSON.parse(memory.trigger_conditions as string);
    }
    if (memory.narrative_unlocks) {
      narrativeUnlocks = JSON.parse(memory.narrative_unlocks as string);
    }
  } catch {
    // Ignore parse errors
  }

  return c.json({
    success: true,
    data: {
      memory: {
        id: memory.id,
        characterId: memory.character_id,
        memoryType: memory.memory_type,
        title: memory.title,
        description: memory.description,
        emotionalWeight: memory.emotional_weight,
        isReal: memory.is_real === 1,
        isImplanted: memory.is_implanted === 1,
        sourceNpcId: memory.source_npc_id,
        sourceNpcName: memory.source_npc_name,
        sourceMissionId: memory.source_mission_id,
        sourceMissionTitle: memory.source_mission_title,
        isLocked: memory.is_locked === 1,
        isCorrupted: memory.is_corrupted === 1,
        isSold: memory.is_sold === 1,
        memoryValueCreds: memory.memory_value_creds,
        triggerConditions,
        narrativeUnlocks,
        occurredAt: memory.occurred_at,
        createdAt: memory.created_at,
      },
    },
  });
});

/**
 * POST /characters/:id/memories
 * Create a new memory (unlock/acquire).
 */
characterRoutes.post('/:id/memories', async (c) => {
  const userId = c.get('userId');
  const characterId = c.req.param('id');
  const body = await c.req.json();

  // Verify ownership
  const character = await c.env.DB
    .prepare('SELECT id FROM characters WHERE id = ? AND player_id = ?')
    .bind(characterId, userId)
    .first();

  if (!character) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Character not found' }],
    }, 404);
  }

  if (!body.title) {
    return c.json({
      success: false,
      errors: [{ code: 'VALIDATION_ERROR', message: 'title is required' }],
    }, 400);
  }

  const id = nanoid();
  const now = new Date().toISOString();

  await c.env.DB
    .prepare(
      `INSERT INTO character_memories (
        id, character_id, memory_type, title, description, emotional_weight,
        is_real, is_implanted, source_npc_id, source_mission_id,
        is_locked, is_corrupted, is_sold, memory_value_creds,
        trigger_conditions, narrative_unlocks, occurred_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      characterId,
      body.memoryType || null,
      body.title,
      body.description || null,
      body.emotionalWeight || 0,
      body.isReal !== false ? 1 : 0,
      body.isImplanted ? 1 : 0,
      body.sourceNpcId || null,
      body.sourceMissionId || null,
      body.isLocked ? 1 : 0,
      0, // is_corrupted
      0, // is_sold
      body.memoryValueCreds || 0,
      body.triggerConditions ? JSON.stringify(body.triggerConditions) : null,
      body.narrativeUnlocks ? JSON.stringify(body.narrativeUnlocks) : null,
      body.occurredAt || now,
      now
    )
    .run();

  return c.json({
    success: true,
    data: { id, message: 'Memory created' },
  }, 201);
});

/**
 * PATCH /characters/:id/memories/:memoryId
 * Update a memory (corruption, selling, etc.).
 */
characterRoutes.patch('/:id/memories/:memoryId', async (c) => {
  const userId = c.get('userId');
  const characterId = c.req.param('id');
  const memoryId = c.req.param('memoryId');
  const body = await c.req.json();

  // Verify ownership
  const character = await c.env.DB
    .prepare('SELECT id FROM characters WHERE id = ? AND player_id = ?')
    .bind(characterId, userId)
    .first();

  if (!character) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Character not found' }],
    }, 404);
  }

  const memory = await c.env.DB
    .prepare('SELECT id FROM character_memories WHERE id = ? AND character_id = ?')
    .bind(memoryId, characterId)
    .first();

  if (!memory) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Memory not found' }],
    }, 404);
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (body.isLocked !== undefined) {
    updates.push('is_locked = ?');
    values.push(body.isLocked ? 1 : 0);
  }
  if (body.isCorrupted !== undefined) {
    updates.push('is_corrupted = ?');
    values.push(body.isCorrupted ? 1 : 0);
  }
  if (body.isSold !== undefined) {
    updates.push('is_sold = ?');
    values.push(body.isSold ? 1 : 0);
  }
  if (body.emotionalWeight !== undefined) {
    updates.push('emotional_weight = ?');
    values.push(body.emotionalWeight);
  }

  if (updates.length > 0) {
    values.push(memoryId);
    await c.env.DB
      .prepare(`UPDATE character_memories SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  return c.json({
    success: true,
    data: { message: 'Memory updated' },
  });
});

/**
 * POST /characters/:id/memories/:memoryId/sell
 * Sell a memory (cyberpunk trope - selling memories for credits).
 */
characterRoutes.post('/:id/memories/:memoryId/sell', async (c) => {
  const userId = c.get('userId');
  const characterId = c.req.param('id');
  const memoryId = c.req.param('memoryId');

  // Verify ownership
  const character = await c.env.DB
    .prepare('SELECT id FROM characters WHERE id = ? AND player_id = ?')
    .bind(characterId, userId)
    .first();

  if (!character) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Character not found' }],
    }, 404);
  }

  const memory = await c.env.DB
    .prepare('SELECT * FROM character_memories WHERE id = ? AND character_id = ?')
    .bind(memoryId, characterId)
    .first();

  if (!memory) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Memory not found' }],
    }, 404);
  }

  if (memory.is_sold === 1) {
    return c.json({
      success: false,
      errors: [{ code: 'ALREADY_SOLD', message: 'Memory has already been sold' }],
    }, 400);
  }

  if (memory.is_locked === 1) {
    return c.json({
      success: false,
      errors: [{ code: 'LOCKED', message: 'Cannot sell a locked memory' }],
    }, 400);
  }

  const creditsGained = memory.memory_value_creds as number;

  // Mark memory as sold
  await c.env.DB
    .prepare('UPDATE character_memories SET is_sold = 1 WHERE id = ?')
    .bind(memoryId)
    .run();

  // Add credits to character
  if (creditsGained > 0) {
    await c.env.DB
      .prepare(
        `UPDATE character_finances
         SET credits = credits + ?, updated_at = datetime('now')
         WHERE character_id = ?`
      )
      .bind(creditsGained, characterId)
      .run();
  }

  return c.json({
    success: true,
    data: {
      message: 'Memory sold',
      creditsGained,
      memoryTitle: memory.title,
    },
  });
});
