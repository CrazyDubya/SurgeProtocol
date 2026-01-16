/**
 * Surge Protocol - Augmentation System API
 *
 * Endpoints for browsing, installing, and managing cybernetic augmentations.
 * Handles humanity tracking and cyberpsychosis risk.
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, requireCharacterMiddleware } from '../../middleware/auth';
import { nanoid } from 'nanoid';

// =============================================================================
// TYPES
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

type Variables = {
  userId: string;
  characterId: string;
};

// Augment categories
const AUGMENT_CATEGORIES = [
  'NEURAL',
  'SENSORY',
  'SKELETAL',
  'MUSCULAR',
  'DERMAL',
  'ORGAN',
  'LIMB',
  'CIRCULATORY',
  'ENDOCRINE',
  'INTERFACE',
  'COSMETIC',
  'EXPERIMENTAL',
] as const;

// =============================================================================
// ROUTER
// =============================================================================

const augmentationRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// =============================================================================
// PUBLIC ENDPOINTS
// =============================================================================

/**
 * GET /augmentations/catalog
 * Browse available augmentation definitions.
 */
augmentationRoutes.get('/catalog', async (c) => {
  const db = c.env.DB;

  // Query params
  const category = c.req.query('category');
  const rarity = c.req.query('rarity');
  const maxTier = c.req.query('maxTier');
  const manufacturer = c.req.query('manufacturer');
  const bodyLocation = c.req.query('bodyLocation');
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  const offset = parseInt(c.req.query('offset') || '0');

  // Build query
  let query = `
    SELECT
      ad.id,
      ad.code,
      ad.name,
      ad.manufacturer,
      ad.model,
      ad.description,
      ad.category,
      ad.subcategory,
      ad.rarity,
      ad.quality_tier,
      ad.required_tier,
      ad.body_location_id,
      ad.slots_consumed,
      ad.base_price_creds,
      ad.installation_cost_creds,
      ad.humanity_cost,
      ad.is_black_market,
      ad.is_prototype,
      bl.name as body_location_name,
      bl.code as body_location_code
    FROM augment_definitions ad
    LEFT JOIN body_locations bl ON ad.body_location_id = bl.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (category) {
    query += ` AND ad.category = ?`;
    params.push(category);
  }

  if (rarity) {
    query += ` AND ad.rarity = ?`;
    params.push(rarity);
  }

  if (maxTier) {
    query += ` AND ad.required_tier <= ?`;
    params.push(parseInt(maxTier));
  }

  if (manufacturer) {
    query += ` AND ad.manufacturer = ?`;
    params.push(manufacturer);
  }

  if (bodyLocation) {
    query += ` AND ad.body_location_id = ?`;
    params.push(bodyLocation);
  }

  query += ` ORDER BY ad.required_tier, ad.rarity, ad.name LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const result = await db.prepare(query).bind(...params).all();

  // Get total count for pagination
  let countQuery = `SELECT COUNT(*) as total FROM augment_definitions WHERE 1=1`;
  const countParams: unknown[] = [];

  if (category) {
    countQuery += ` AND category = ?`;
    countParams.push(category);
  }
  if (rarity) {
    countQuery += ` AND rarity = ?`;
    countParams.push(rarity);
  }
  if (maxTier) {
    countQuery += ` AND required_tier <= ?`;
    countParams.push(parseInt(maxTier));
  }
  if (manufacturer) {
    countQuery += ` AND manufacturer = ?`;
    countParams.push(manufacturer);
  }
  if (bodyLocation) {
    countQuery += ` AND body_location_id = ?`;
    countParams.push(bodyLocation);
  }

  const countResult = await db.prepare(countQuery).bind(...countParams).first<{ total: number }>();

  return c.json({
    success: true,
    data: {
      augments: result.results,
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
 * GET /augmentations/catalog/:id
 * Get detailed information about a specific augmentation.
 */
augmentationRoutes.get('/catalog/:id', async (c) => {
  const db = c.env.DB;
  const augmentId = c.req.param('id');

  const augment = await db
    .prepare(
      `
      SELECT
        ad.*,
        bl.name as body_location_name,
        bl.code as body_location_code,
        bl.augment_slots as location_total_slots,
        bl.surgery_risk_base as location_surgery_risk,
        am.name as manufacturer_name,
        am.quality_rating as manufacturer_quality,
        am.reliability_rating as manufacturer_reliability
      FROM augment_definitions ad
      LEFT JOIN body_locations bl ON ad.body_location_id = bl.id
      LEFT JOIN augment_manufacturers am ON ad.manufacturer = am.code
      WHERE ad.id = ? OR ad.code = ?
    `
    )
    .bind(augmentId, augmentId)
    .first();

  if (!augment) {
    return c.json(
      {
        success: false,
        errors: [{ code: 'NOT_FOUND', message: 'Augmentation not found' }],
      },
      404
    );
  }

  // Parse JSON fields
  const parsed = {
    ...augment,
    attribute_modifiers: augment.attribute_modifiers
      ? JSON.parse(augment.attribute_modifiers as string)
      : null,
    stat_modifiers: augment.stat_modifiers
      ? JSON.parse(augment.stat_modifiers as string)
      : null,
    grants_abilities: augment.grants_abilities
      ? JSON.parse(augment.grants_abilities as string)
      : null,
    grants_passives: augment.grants_passives
      ? JSON.parse(augment.grants_passives as string)
      : null,
    special_effects: augment.special_effects
      ? JSON.parse(augment.special_effects as string)
      : null,
    side_effects: augment.side_effects
      ? JSON.parse(augment.side_effects as string)
      : null,
    required_augments: augment.required_augments
      ? JSON.parse(augment.required_augments as string)
      : null,
    incompatible_augments: augment.incompatible_augments
      ? JSON.parse(augment.incompatible_augments as string)
      : null,
    required_attributes: augment.required_attributes
      ? JSON.parse(augment.required_attributes as string)
      : null,
    upgrade_to: augment.upgrade_to
      ? JSON.parse(augment.upgrade_to as string)
      : null,
  };

  // Get upgrade path info if applicable
  let upgradePath = null;
  if (augment.upgrade_from_id) {
    const upgradeFrom = await db
      .prepare(`SELECT id, code, name FROM augment_definitions WHERE id = ?`)
      .bind(augment.upgrade_from_id)
      .first();
    if (upgradeFrom) {
      upgradePath = { from: upgradeFrom };
    }
  }

  return c.json({
    success: true,
    data: {
      augment: parsed,
      upgradePath,
    },
  });
});

/**
 * GET /augmentations/body-locations
 * List all body locations where augments can be installed.
 */
augmentationRoutes.get('/body-locations', async (c) => {
  const db = c.env.DB;

  const result = await db
    .prepare(
      `
      SELECT
        id,
        code,
        name,
        description,
        parent_location_id,
        augment_slots,
        critical_organ,
        visible_externally,
        damage_multiplier,
        min_tier_to_augment,
        surgery_risk_base
      FROM body_locations
      ORDER BY name
    `
    )
    .all();

  return c.json({
    success: true,
    data: {
      locations: result.results,
    },
  });
});

/**
 * GET /augmentations/manufacturers
 * List augmentation manufacturers.
 */
augmentationRoutes.get('/manufacturers', async (c) => {
  const db = c.env.DB;

  const result = await db
    .prepare(
      `
      SELECT
        id,
        code,
        name,
        tagline,
        description,
        quality_rating,
        reliability_rating,
        innovation_rating,
        price_tier,
        primary_category,
        is_corporate_approved,
        black_market_presence
      FROM augment_manufacturers
      ORDER BY quality_rating DESC, name
    `
    )
    .all();

  return c.json({
    success: true,
    data: {
      manufacturers: result.results,
    },
  });
});

/**
 * GET /augmentations/categories
 * List available augmentation categories.
 */
augmentationRoutes.get('/categories', (c) => {
  return c.json({
    success: true,
    data: {
      categories: AUGMENT_CATEGORIES.map((cat) => ({
        code: cat,
        name: cat.charAt(0) + cat.slice(1).toLowerCase(),
      })),
    },
  });
});

// =============================================================================
// AUTHENTICATED ENDPOINTS
// =============================================================================

// Apply auth middleware to remaining routes
augmentationRoutes.use('/*', authMiddleware());

/**
 * GET /augmentations/character
 * List augmentations installed on the current character.
 */
augmentationRoutes.get('/character', requireCharacterMiddleware(), async (c) => {
  const db = c.env.DB;
  const characterId = c.get('characterId');

  // Get installed augments
  const installed = await db
    .prepare(
      `
      SELECT
        ca.id,
        ca.installed_at,
        ca.body_location_id,
        ca.installation_quality,
        ca.is_active,
        ca.is_damaged,
        ca.damage_level,
        ca.is_malfunctioning,
        ca.malfunction_type,
        ca.charge_level,
        ca.integration_level,
        ca.rejection_risk_current,
        ca.custom_name,
        ca.warranty_expires,
        ad.code as augment_code,
        ad.name as augment_name,
        ad.category,
        ad.rarity,
        ad.humanity_cost,
        ad.attribute_modifiers,
        ad.stat_modifiers,
        ad.grants_abilities,
        ad.grants_passives,
        ad.power_consumption,
        bl.name as body_location_name,
        bl.code as body_location_code
      FROM character_augments ca
      JOIN augment_definitions ad ON ca.augment_definition_id = ad.id
      LEFT JOIN body_locations bl ON ca.body_location_id = bl.id
      WHERE ca.character_id = ?
      ORDER BY ca.installed_at DESC
    `
    )
    .bind(characterId)
    .all();

  // Get character's humanity stats
  const character = await db
    .prepare(
      `SELECT current_humanity, max_humanity FROM characters WHERE id = ?`
    )
    .bind(characterId)
    .first<{ current_humanity: number; max_humanity: number }>();

  // Calculate total humanity cost
  const totalHumanityCost = installed.results.reduce((sum, aug) => {
    const cost = typeof aug.humanity_cost === 'number' ? aug.humanity_cost : 0;
    return sum + cost;
  }, 0);

  // Get humanity threshold info
  const humanityThreshold = await db
    .prepare(
      `
      SELECT * FROM humanity_thresholds
      WHERE threshold_value >= ?
      ORDER BY threshold_value ASC
      LIMIT 1
    `
    )
    .bind(character?.current_humanity || 100)
    .first();

  // Parse JSON fields for each augment
  const parsedAugments = installed.results.map((aug) => ({
    ...aug,
    attribute_modifiers: aug.attribute_modifiers
      ? JSON.parse(aug.attribute_modifiers as string)
      : null,
    stat_modifiers: aug.stat_modifiers
      ? JSON.parse(aug.stat_modifiers as string)
      : null,
    grants_abilities: aug.grants_abilities
      ? JSON.parse(aug.grants_abilities as string)
      : null,
    grants_passives: aug.grants_passives
      ? JSON.parse(aug.grants_passives as string)
      : null,
  }));

  return c.json({
    success: true,
    data: {
      augments: parsedAugments,
      count: installed.results.length,
      humanity: {
        current: character?.current_humanity || 100,
        max: character?.max_humanity || 100,
        totalCost: totalHumanityCost,
        threshold: humanityThreshold,
      },
    },
  });
});

/**
 * POST /augmentations/install
 * Install an augmentation on the character.
 */
const installSchema = z.object({
  augmentId: z.string().min(1),
  bodyLocationId: z.string().optional(),
  installerId: z.string().optional(),
  useBlackMarket: z.boolean().default(false),
});

augmentationRoutes.post(
  '/install',
  requireCharacterMiddleware(),
  zValidator('json', installSchema),
  async (c) => {
    const db = c.env.DB;
    const characterId = c.get('characterId');
    const { augmentId, bodyLocationId, installerId, useBlackMarket } = c.req.valid('json');

    // Get augment definition
    const augment = await db
      .prepare(
        `SELECT * FROM augment_definitions WHERE id = ? OR code = ?`
      )
      .bind(augmentId, augmentId)
      .first();

    if (!augment) {
      return c.json(
        {
          success: false,
          errors: [{ code: 'AUGMENT_NOT_FOUND', message: 'Augmentation not found' }],
        },
        404
      );
    }

    // Get character
    const character = await db
      .prepare(
        `SELECT id, current_tier, current_credits, current_humanity, max_humanity
         FROM characters WHERE id = ?`
      )
      .bind(characterId)
      .first<{
        id: string;
        current_tier: number;
        current_credits: number;
        current_humanity: number;
        max_humanity: number;
      }>();

    if (!character) {
      return c.json(
        {
          success: false,
          errors: [{ code: 'CHARACTER_NOT_FOUND', message: 'Character not found' }],
        },
        404
      );
    }

    // Check tier requirement
    const requiredTier = typeof augment.required_tier === 'number' ? augment.required_tier : 1;
    if (character.current_tier < requiredTier) {
      return c.json(
        {
          success: false,
          errors: [
            {
              code: 'TIER_REQUIREMENT',
              message: `Requires tier ${requiredTier}, you are tier ${character.current_tier}`,
            },
          ],
        },
        400
      );
    }

    // Calculate costs
    const basePrice = typeof augment.base_price_creds === 'number' ? augment.base_price_creds : 1000;
    const installCost = typeof augment.installation_cost_creds === 'number'
      ? augment.installation_cost_creds
      : 500;
    const totalCost = useBlackMarket
      ? Math.floor((basePrice + installCost) * 0.7) // Black market discount
      : basePrice + installCost;

    // Check credits
    if (character.current_credits < totalCost) {
      return c.json(
        {
          success: false,
          errors: [
            {
              code: 'INSUFFICIENT_CREDITS',
              message: `Need ${totalCost} credits, have ${character.current_credits}`,
            },
          ],
        },
        400
      );
    }

    // Determine body location
    const targetLocationId = bodyLocationId || (augment.body_location_id as string);
    if (!targetLocationId) {
      return c.json(
        {
          success: false,
          errors: [{ code: 'NO_BODY_LOCATION', message: 'Body location required' }],
        },
        400
      );
    }

    // Check body location has available slots
    const bodyLocation = await db
      .prepare(`SELECT * FROM body_locations WHERE id = ?`)
      .bind(targetLocationId)
      .first();

    if (!bodyLocation) {
      return c.json(
        {
          success: false,
          errors: [{ code: 'INVALID_LOCATION', message: 'Invalid body location' }],
        },
        400
      );
    }

    // Count existing augments at this location
    const slotsUsed = await db
      .prepare(
        `SELECT COALESCE(SUM(ad.slots_consumed), 0) as used
         FROM character_augments ca
         JOIN augment_definitions ad ON ca.augment_definition_id = ad.id
         WHERE ca.character_id = ? AND ca.body_location_id = ?`
      )
      .bind(characterId, targetLocationId)
      .first<{ used: number }>();

    const locationSlots = typeof bodyLocation.augment_slots === 'number'
      ? bodyLocation.augment_slots
      : 1;
    const augmentSlots = typeof augment.slots_consumed === 'number'
      ? augment.slots_consumed
      : 1;
    const currentUsed = slotsUsed?.used || 0;

    if (currentUsed + augmentSlots > locationSlots) {
      return c.json(
        {
          success: false,
          errors: [
            {
              code: 'NO_AVAILABLE_SLOTS',
              message: `Location has ${locationSlots} slots, ${currentUsed} used, need ${augmentSlots}`,
            },
          ],
        },
        400
      );
    }

    // Check for incompatible augments
    if (augment.incompatible_augments) {
      const incompatible = JSON.parse(augment.incompatible_augments as string) as string[];
      const existingAugments = await db
        .prepare(
          `SELECT ad.code FROM character_augments ca
           JOIN augment_definitions ad ON ca.augment_definition_id = ad.id
           WHERE ca.character_id = ?`
        )
        .bind(characterId)
        .all();

      const existingCodes = existingAugments.results.map((a) => a.code as string);
      const conflict = incompatible.find((code) => existingCodes.includes(code));

      if (conflict) {
        return c.json(
          {
            success: false,
            errors: [
              {
                code: 'INCOMPATIBLE_AUGMENT',
                message: `Incompatible with existing augment: ${conflict}`,
              },
            ],
          },
          400
        );
      }
    }

    // Check humanity cost
    const humanityCost = typeof augment.humanity_cost === 'number' ? augment.humanity_cost : 5;
    const newHumanity = character.current_humanity - humanityCost;

    if (newHumanity < 0) {
      return c.json(
        {
          success: false,
          errors: [
            {
              code: 'HUMANITY_TOO_LOW',
              message: `Installation would reduce humanity below 0. Current: ${character.current_humanity}, Cost: ${humanityCost}`,
            },
          ],
        },
        400
      );
    }

    // Calculate installation quality (affected by black market)
    const baseQuality = 80;
    const installationQuality = useBlackMarket
      ? Math.max(40, baseQuality - Math.floor(Math.random() * 30))
      : baseQuality + Math.floor(Math.random() * 20);

    // Create augment installation
    const installId = nanoid();
    const now = new Date().toISOString();

    await db
      .prepare(
        `INSERT INTO character_augments (
          id, character_id, augment_definition_id, body_location_id,
          installed_by_npc_id, installation_quality, is_corporate_installed,
          is_active, integration_level, installed_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 50, ?, ?)`
      )
      .bind(
        installId,
        characterId,
        augment.id,
        targetLocationId,
        installerId || null,
        installationQuality,
        useBlackMarket ? 0 : 1,
        now,
        now
      )
      .run();

    // Deduct credits
    await db
      .prepare(
        `UPDATE characters SET current_credits = current_credits - ? WHERE id = ?`
      )
      .bind(totalCost, characterId)
      .run();

    // Reduce humanity
    await db
      .prepare(
        `UPDATE characters SET current_humanity = current_humanity - ? WHERE id = ?`
      )
      .bind(humanityCost, characterId)
      .run();

    // Record humanity event
    await db
      .prepare(
        `INSERT INTO humanity_events (
          id, character_id, humanity_before, humanity_after, change_amount,
          change_source, source_id, occurred_at
        ) VALUES (?, ?, ?, ?, ?, 'AUGMENT_INSTALL', ?, ?)`
      )
      .bind(
        nanoid(),
        characterId,
        character.current_humanity,
        newHumanity,
        -humanityCost,
        installId,
        now
      )
      .run();

    // Apply attribute modifiers if any
    if (augment.attribute_modifiers) {
      const modifiers = JSON.parse(augment.attribute_modifiers as string) as Record<
        string,
        number
      >;

      for (const [attrCode, modifier] of Object.entries(modifiers)) {
        await db
          .prepare(
            `UPDATE character_attributes
             SET bonus_from_augments = bonus_from_augments + ?,
                 current_value = base_value + bonus_from_augments + ? + bonus_from_items + bonus_from_conditions + temporary_modifier
             WHERE character_id = ? AND attribute_id IN (
               SELECT id FROM attribute_definitions WHERE code = ?
             )`
          )
          .bind(modifier, modifier, characterId, attrCode)
          .run();
      }
    }

    // Check for humanity threshold crossing
    let thresholdCrossed = null;
    const crossedThreshold = await db
      .prepare(
        `SELECT * FROM humanity_thresholds
         WHERE threshold_value > ? AND threshold_value <= ?
         ORDER BY threshold_value DESC LIMIT 1`
      )
      .bind(newHumanity, character.current_humanity)
      .first();

    if (crossedThreshold) {
      thresholdCrossed = crossedThreshold;

      // Update humanity event with threshold crossing
      await db
        .prepare(
          `UPDATE humanity_events
           SET crossed_threshold = ?
           WHERE source_id = ?`
        )
        .bind(crossedThreshold.threshold_value, installId)
        .run();
    }

    return c.json(
      {
        success: true,
        data: {
          installation: {
            id: installId,
            augmentId: augment.id,
            augmentName: augment.name,
            bodyLocation: bodyLocation.name,
            installationQuality,
            isBlackMarket: useBlackMarket,
          },
          costs: {
            credits: totalCost,
            humanityCost,
          },
          character: {
            creditsRemaining: character.current_credits - totalCost,
            humanityRemaining: newHumanity,
          },
          thresholdCrossed,
        },
      },
      201
    );
  }
);

/**
 * POST /augmentations/:id/toggle
 * Activate or deactivate an installed augment.
 */
augmentationRoutes.post('/:id/toggle', requireCharacterMiddleware(), async (c) => {
  const db = c.env.DB;
  const characterId = c.get('characterId');
  const augmentInstallId = c.req.param('id');

  // Get installed augment
  const installed = await db
    .prepare(
      `SELECT ca.*, ad.name as augment_name, ad.power_consumption
       FROM character_augments ca
       JOIN augment_definitions ad ON ca.augment_definition_id = ad.id
       WHERE ca.id = ? AND ca.character_id = ?`
    )
    .bind(augmentInstallId, characterId)
    .first();

  if (!installed) {
    return c.json(
      {
        success: false,
        errors: [{ code: 'NOT_FOUND', message: 'Installed augment not found' }],
      },
      404
    );
  }

  // Check if damaged/malfunctioning
  if (installed.is_damaged && !installed.is_active) {
    return c.json(
      {
        success: false,
        errors: [{ code: 'AUGMENT_DAMAGED', message: 'Augment is damaged and cannot be activated' }],
      },
      400
    );
  }

  // Toggle state
  const newState = installed.is_active ? 0 : 1;

  await db
    .prepare(
      `UPDATE character_augments
       SET is_active = ?, times_activated = times_activated + ?, updated_at = ?
       WHERE id = ?`
    )
    .bind(newState, newState, new Date().toISOString(), augmentInstallId)
    .run();

  return c.json({
    success: true,
    data: {
      augmentId: augmentInstallId,
      augmentName: installed.augment_name,
      isActive: newState === 1,
    },
  });
});

/**
 * POST /augmentations/:id/remove
 * Remove an installed augment (risky surgery).
 */
const removeSchema = z.object({
  surgeonId: z.string().optional(),
  useBlackMarket: z.boolean().default(false),
});

augmentationRoutes.post(
  '/:id/remove',
  requireCharacterMiddleware(),
  zValidator('json', removeSchema),
  async (c) => {
    const db = c.env.DB;
    const characterId = c.get('characterId');
    const augmentInstallId = c.req.param('id');
    const { surgeonId: _surgeonId, useBlackMarket } = c.req.valid('json');
    // Note: _surgeonId reserved for future NPC surgeon quality modifiers

    // Get installed augment
    const installed = await db
      .prepare(
        `SELECT ca.*, ad.name as augment_name, ad.humanity_cost, ad.attribute_modifiers,
                ad.surgery_difficulty, ad.base_price_creds
         FROM character_augments ca
         JOIN augment_definitions ad ON ca.augment_definition_id = ad.id
         WHERE ca.id = ? AND ca.character_id = ?`
      )
      .bind(augmentInstallId, characterId)
      .first();

    if (!installed) {
      return c.json(
        {
          success: false,
          errors: [{ code: 'NOT_FOUND', message: 'Installed augment not found' }],
        },
        404
      );
    }

    // Check for debt/repossession restrictions
    if (installed.debt_attached_id && !installed.can_be_repossessed) {
      return c.json(
        {
          success: false,
          errors: [
            {
              code: 'DEBT_ATTACHED',
              message: 'Cannot remove augment with attached debt',
            },
          ],
        },
        400
      );
    }

    // Get character for credit check and humanity restoration
    const character = await db
      .prepare(`SELECT current_credits, current_humanity, max_humanity FROM characters WHERE id = ?`)
      .bind(characterId)
      .first<{ current_credits: number; current_humanity: number; max_humanity: number }>();

    if (!character) {
      return c.json(
        { success: false, errors: [{ code: 'CHARACTER_NOT_FOUND', message: 'Character not found' }] },
        404
      );
    }

    // Calculate removal cost (percentage of base price)
    const basePrice = typeof installed.base_price_creds === 'number' ? installed.base_price_creds : 1000;
    const removalCost = useBlackMarket
      ? Math.floor(basePrice * 0.15)
      : Math.floor(basePrice * 0.25);

    if (character.current_credits < removalCost) {
      return c.json(
        {
          success: false,
          errors: [
            {
              code: 'INSUFFICIENT_CREDITS',
              message: `Removal costs ${removalCost} credits`,
            },
          ],
        },
        400
      );
    }

    // Calculate surgery risk
    const surgeryDifficulty = typeof installed.surgery_difficulty === 'number'
      ? installed.surgery_difficulty
      : 5;
    const integrationLevel = typeof installed.integration_level === 'number'
      ? installed.integration_level
      : 50;

    // Higher integration = higher risk
    const baseRisk = surgeryDifficulty * 2;
    const integrationRisk = Math.floor(integrationLevel / 10);
    const blackMarketPenalty = useBlackMarket ? 15 : 0;
    const totalRisk = Math.min(95, baseRisk + integrationRisk + blackMarketPenalty);

    // Roll for complications
    const roll = Math.floor(Math.random() * 100);
    const hasComplications = roll < totalRisk;

    // Restore partial humanity (50-80% based on integration)
    const humanityCost = typeof installed.humanity_cost === 'number' ? installed.humanity_cost : 5;
    const restorationRate = Math.max(0.5, 1 - integrationLevel / 200);
    let humanityRestored = Math.floor(humanityCost * restorationRate);

    // Complications reduce humanity restoration
    if (hasComplications) {
      humanityRestored = Math.floor(humanityRestored * 0.5);
    }

    const newHumanity = Math.min(
      character.max_humanity,
      character.current_humanity + humanityRestored
    );

    // Remove attribute modifiers
    if (installed.attribute_modifiers) {
      const modifiers = JSON.parse(installed.attribute_modifiers as string) as Record<
        string,
        number
      >;

      for (const [attrCode, modifier] of Object.entries(modifiers)) {
        await db
          .prepare(
            `UPDATE character_attributes
             SET bonus_from_augments = bonus_from_augments - ?,
                 current_value = base_value + bonus_from_augments - ? + bonus_from_items + bonus_from_conditions + temporary_modifier
             WHERE character_id = ? AND attribute_id IN (
               SELECT id FROM attribute_definitions WHERE code = ?
             )`
          )
          .bind(modifier, modifier, characterId, attrCode)
          .run();
      }
    }

    // Delete the augment installation
    await db
      .prepare(`DELETE FROM character_augments WHERE id = ?`)
      .bind(augmentInstallId)
      .run();

    // Deduct removal cost
    await db
      .prepare(`UPDATE characters SET current_credits = current_credits - ? WHERE id = ?`)
      .bind(removalCost, characterId)
      .run();

    // Restore humanity
    await db
      .prepare(`UPDATE characters SET current_humanity = ? WHERE id = ?`)
      .bind(newHumanity, characterId)
      .run();

    // Record humanity event
    const now = new Date().toISOString();
    await db
      .prepare(
        `INSERT INTO humanity_events (
          id, character_id, humanity_before, humanity_after, change_amount,
          change_source, source_id, occurred_at
        ) VALUES (?, ?, ?, ?, ?, 'AUGMENT_REMOVE', ?, ?)`
      )
      .bind(
        nanoid(),
        characterId,
        character.current_humanity,
        newHumanity,
        humanityRestored,
        augmentInstallId,
        now
      )
      .run();

    // Apply damage if complications
    let complicationDamage = 0;
    if (hasComplications) {
      complicationDamage = Math.floor(Math.random() * 10) + 5;
      await db
        .prepare(
          `UPDATE characters
           SET current_health = MAX(1, current_health - ?)
           WHERE id = ?`
        )
        .bind(complicationDamage, characterId)
        .run();
    }

    return c.json({
      success: true,
      data: {
        removed: {
          augmentName: installed.augment_name,
        },
        costs: {
          credits: removalCost,
        },
        surgery: {
          risk: totalRisk,
          hadComplications: hasComplications,
          damage: complicationDamage,
        },
        humanity: {
          restored: humanityRestored,
          current: newHumanity,
        },
        character: {
          creditsRemaining: character.current_credits - removalCost,
        },
      },
    });
  }
);

/**
 * GET /augmentations/humanity/history
 * Get humanity change history for the character.
 */
augmentationRoutes.get('/humanity/history', requireCharacterMiddleware(), async (c) => {
  const db = c.env.DB;
  const characterId = c.get('characterId');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);

  const events = await db
    .prepare(
      `SELECT
        he.*,
        ht.threshold_name,
        ht.description as threshold_description
       FROM humanity_events he
       LEFT JOIN humanity_thresholds ht ON he.crossed_threshold = ht.threshold_value
       WHERE he.character_id = ?
       ORDER BY he.occurred_at DESC
       LIMIT ?`
    )
    .bind(characterId, limit)
    .all();

  return c.json({
    success: true,
    data: {
      events: events.results,
    },
  });
});

/**
 * GET /augmentations/humanity/thresholds
 * Get all humanity thresholds and their effects.
 */
augmentationRoutes.get('/humanity/thresholds', async (c) => {
  const db = c.env.DB;

  const thresholds = await db
    .prepare(
      `SELECT * FROM humanity_thresholds ORDER BY threshold_value DESC`
    )
    .all();

  // Parse JSON fields
  const parsed = thresholds.results.map((t) => ({
    ...t,
    dialogue_changes: t.dialogue_changes ? JSON.parse(t.dialogue_changes as string) : null,
    ability_unlocks: t.ability_unlocks ? JSON.parse(t.ability_unlocks as string) : null,
    ability_locks: t.ability_locks ? JSON.parse(t.ability_locks as string) : null,
    recovery_methods: t.recovery_methods ? JSON.parse(t.recovery_methods as string) : null,
    permanent_effects: t.permanent_effects ? JSON.parse(t.permanent_effects as string) : null,
  }));

  return c.json({
    success: true,
    data: {
      thresholds: parsed,
    },
  });
});

export { augmentationRoutes };
