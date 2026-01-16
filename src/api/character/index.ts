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
