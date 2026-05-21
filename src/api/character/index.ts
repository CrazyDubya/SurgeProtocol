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
// import { nanoid } from 'nanoid';
import {
  authMiddleware,
  type AuthVariables,
} from '../../middleware/auth';
import { CharacterService } from '../../services/character';

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
    RSN: z.number().int().min(1).max(10).optional(), // Reason (was WIS)
    WIS: z.number().int().min(1).max(10).optional(), // Keep for compat if needed, or remove
    EMP: z.number().int().min(1).max(10),
    PRE: z.number().int().min(1).max(10).optional(), // Presence (was missing)
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
  const service = new CharacterService(c.env.DB);
  try {
    const data = c.req.valid('json');

    // Get a starting location (Tier 1)
    const startLocation = await c.env.DB
      .prepare('SELECT id FROM locations WHERE tier_requirement <= 1 LIMIT 1')
      .first<{ id: string }>();

    const character = await service.createCharacter(userId, data, startLocation?.id);

    return c.json({
      success: true,
      data: { character },
    }, 201);
  } catch (err: any) {
    console.error('[API] Create Character Error:', err);
    return c.json({
      success: false,
      errors: [{ code: 'SERVER_ERROR', message: err.message }],
    }, err.message === 'Maximum 3 characters per account' ? 400 : err.message === 'Handle already in use' ? 409 : 500);
  }
});

/**
 * GET /characters
 * List all characters for the authenticated user.
 */
characterRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const service = new CharacterService(c.env.DB);
  const characters = await service.listCharacters(userId);

  return c.json({
    success: true,
    data: {
      characters,
      count: characters.length,
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
  const service = new CharacterService(c.env.DB);

  const result = await service.getCharacterDetails(userId, characterId);

  if (!result) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Character not found' }],
    }, 404);
  }

  return c.json({
    success: true,
    data: result,
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
  const service = new CharacterService(c.env.DB);

  try {
    const character = await service.updateCharacter(userId, characterId, updates);
    return c.json({
      success: true,
      data: { character },
    });
  } catch (err: any) {
    return c.json({
      success: false,
      errors: [{ code: err.message === 'Character not found' ? 'NOT_FOUND' : 'SERVER_ERROR', message: err.message }],
    }, err.message === 'Character not found' ? 404 : err.message === 'Handle already in use' ? 409 : 500);
  }
});

/**
 * POST /characters/:id/select
 * Select a character as the active character.
 * Returns new tokens with characterId.
 */
characterRoutes.post('/:id/select', async (c) => {
  const userId = c.get('userId');
  const characterId = c.req.param('id');
  const service = new CharacterService(c.env.DB);

  try {
    const tokens = await service.selectCharacter(userId, characterId, c.env.JWT_SECRET);
    return c.json({
      success: true,
      data: {
        characterId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
    });
  } catch (err: any) {
    return c.json({
      success: false,
      errors: [{ code: err.message === 'Character not found' ? 'NOT_FOUND' : 'SERVER_ERROR', message: err.message }],
    }, err.message === 'Character not found' ? 404 : 400);
  }
});

/**
 * GET /characters/:id/stats
 * Get full character statistics.
 */
characterRoutes.get('/:id/stats', async (c) => {
  const userId = c.get('userId');
  const characterId = c.req.param('id');
  const service = new CharacterService(c.env.DB);

  try {
    const stats = await service.getCharacterStats(userId, characterId);
    return c.json({
      success: true,
      data: stats,
    });
  } catch (err: any) {
    console.error('[API] Get Stats Error:', err);
    return c.json({ success: false, errors: [{ message: err.message }] }, err.message === 'Character not found' ? 404 : 500);
  }
});

/**
 * GET /characters/:id/inventory
 * Get character's full inventory.
 */
characterRoutes.get('/:id/inventory', async (c) => {
  const userId = c.get('userId');
  const characterId = c.req.param('id');
  const service = new CharacterService(c.env.DB);

  try {
    const result = await service.getCharacterInventory(userId, characterId);
    return c.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('[API] Get Inventory Error:', err);
    return c.json({ success: false, errors: [{ message: err.message }] }, err.message === 'Character not found' ? 404 : 500);
  }
});

/**
 * GET /characters/:id/factions
 * Get character's faction standings.
 */
characterRoutes.get('/:id/factions', async (c) => {
  const userId = c.get('userId');
  const characterId = c.req.param('id');
  const service = new CharacterService(c.env.DB);

  try {
    const factions = await service.getCharacterFactions(userId, characterId);
    return c.json({
      success: true,
      data: { factions },
    });
  } catch (err: any) {
    console.error('[API] Get Factions Error:', err);
    return c.json({ success: false, errors: [{ message: err.message }] }, err.message === 'Character not found' ? 404 : 500);
  }
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
    const id = crypto.randomUUID();

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

  const id = crypto.randomUUID();
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
