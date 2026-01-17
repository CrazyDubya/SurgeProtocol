/**
 * Surge Protocol - Items Routes
 *
 * Endpoints:
 * - GET /items/catalog - Browse item definitions
 * - GET /items/catalog/:id - Get item details with effects
 * - GET /items/inventory - Get character's inventory
 * - POST /items/inventory/:inventoryId/use - Use a consumable item
 * - POST /items/inventory/:inventoryId/equip - Equip an item
 * - POST /items/inventory/:inventoryId/unequip - Unequip an item
 * - DELETE /items/inventory/:inventoryId - Discard/drop an item
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  authMiddleware,
  requireCharacterMiddleware,
  type AuthVariables,
} from '../../middleware/auth';

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

// Effect type definitions
interface UseEffects {
  healing?: number;
  staminaRestore?: number;
  tempAttributeBonus?: { attribute: string; value: number; duration: number };
  tempSkillBonus?: { skill: string; value: number; duration: number };
  removeCondition?: string;
  addCondition?: { condition: string; duration: number };
  custom?: string;
}

interface EquipEffects {
  attributeBonuses?: Record<string, number>;
  skillBonuses?: Record<string, number>;
  armorValue?: number;
  damage?: string;
  attackMod?: number;
  special?: string[];
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const equipSchema = z.object({
  slot: z.string().optional(),
});

// =============================================================================
// ROUTES
// =============================================================================

export const itemRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// Apply auth middleware to all routes
itemRoutes.use('*', authMiddleware());

/**
 * GET /items/catalog
 * Browse item catalog with optional filters.
 */
itemRoutes.get('/catalog', async (c) => {
  const itemType = c.req.query('type');
  const rarity = c.req.query('rarity');
  const maxTier = c.req.query('maxTier');
  const search = c.req.query('search');

  let query = `
    SELECT id, code, name, description, item_type, item_subtype, rarity,
           quality_tier, base_price, weight_kg, required_tier,
           is_illegal, manufacturer
    FROM item_definitions
    WHERE 1=1
  `;

  const params: (string | number)[] = [];

  if (itemType) {
    query += ` AND item_type = ?`;
    params.push(itemType);
  }

  if (rarity) {
    query += ` AND rarity = ?`;
    params.push(rarity);
  }

  if (maxTier) {
    query += ` AND required_tier <= ?`;
    params.push(parseInt(maxTier, 10));
  }

  if (search) {
    query += ` AND (name LIKE ? OR description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY item_type, rarity DESC, name LIMIT 100`;

  const stmt = c.env.DB.prepare(query);
  const result = params.length > 0
    ? await stmt.bind(...params).all()
    : await stmt.all();

  // Group by type
  const byType: Record<string, typeof result.results> = {};
  for (const item of result.results) {
    const type = (item.item_type as string) || 'OTHER';
    if (!byType[type]) byType[type] = [];
    byType[type]!.push(item);
  }

  return c.json({
    success: true,
    data: {
      items: result.results,
      byType,
      count: result.results.length,
    },
  });
});

/**
 * GET /items/catalog/:id
 * Get detailed item information including effects.
 */
itemRoutes.get('/catalog/:id', async (c) => {
  const itemId = c.req.param('id');

  const item = await c.env.DB
    .prepare(
      `SELECT * FROM item_definitions WHERE id = ? OR code = ?`
    )
    .bind(itemId, itemId)
    .first();

  if (!item) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Item not found' }],
    }, 404);
  }

  // Parse JSON fields
  const passiveEffects = item.passive_effects
    ? JSON.parse(item.passive_effects as string)
    : null;
  const useEffects = item.use_effects
    ? JSON.parse(item.use_effects as string)
    : null;
  const equipEffects = item.equip_effects
    ? JSON.parse(item.equip_effects as string)
    : null;
  const properties = item.properties
    ? JSON.parse(item.properties as string)
    : null;
  const requiredAttributes = item.required_attributes
    ? JSON.parse(item.required_attributes as string)
    : null;
  const requiredSkills = item.required_skills
    ? JSON.parse(item.required_skills as string)
    : null;

  return c.json({
    success: true,
    data: {
      item: {
        ...item,
        passiveEffects,
        useEffects,
        equipEffects,
        properties,
        requiredAttributes,
        requiredSkills,
        isConsumable: !!useEffects,
        isEquipable: item.item_type?.toString().startsWith('WEAPON') ||
                     item.item_type?.toString().startsWith('ARMOR') ||
                     item.item_type === 'ACCESSORY',
      },
    },
  });
});

/**
 * GET /items/inventory
 * Get character's full inventory.
 */
itemRoutes.get('/inventory', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;

  const inventory = await c.env.DB
    .prepare(
      `SELECT ci.id, ci.quantity, ci.equipped_slot, ci.quick_slot,
              ci.current_durability, ci.current_charges, ci.current_ammo,
              ci.is_damaged, ci.is_broken, ci.custom_name,
              id.code, id.name, id.description, id.item_type, id.item_subtype,
              id.rarity, id.weight_kg, id.base_price,
              id.passive_effects, id.use_effects, id.equip_effects, id.properties
       FROM character_inventory ci
       JOIN item_definitions id ON ci.item_definition_id = id.id
       WHERE ci.character_id = ?
       ORDER BY ci.equipped_slot IS NOT NULL DESC, id.item_type, id.name`
    )
    .bind(characterId)
    .all();

  // Process items
  const items = inventory.results.map(item => {
    const passiveEffects = item.passive_effects
      ? JSON.parse(item.passive_effects as string)
      : null;
    const useEffects = item.use_effects
      ? JSON.parse(item.use_effects as string)
      : null;
    const equipEffects = item.equip_effects
      ? JSON.parse(item.equip_effects as string)
      : null;
    const properties = item.properties
      ? JSON.parse(item.properties as string)
      : null;

    return {
      inventoryId: item.id,
      code: item.code,
      name: item.custom_name || item.name,
      originalName: item.name,
      description: item.description,
      itemType: item.item_type,
      itemSubtype: item.item_subtype,
      rarity: item.rarity,
      quantity: item.quantity,
      weight: item.weight_kg,
      basePrice: item.base_price,
      equippedSlot: item.equipped_slot,
      quickSlot: item.quick_slot,
      durability: item.current_durability,
      charges: item.current_charges,
      ammo: item.current_ammo,
      isDamaged: item.is_damaged === 1,
      isBroken: item.is_broken === 1,
      isEquipped: !!item.equipped_slot,
      isConsumable: !!useEffects,
      passiveEffects,
      useEffects,
      equipEffects,
      properties,
    };
  });

  // Separate equipped vs unequipped
  const equipped = items.filter(i => i.isEquipped);
  const unequipped = items.filter(i => !i.isEquipped);

  // Calculate total weight
  const totalWeight = items.reduce((sum, i) => {
    const weight = typeof i.weight === 'number' ? i.weight : 0;
    const qty = typeof i.quantity === 'number' ? i.quantity : 1;
    return sum + weight * qty;
  }, 0);

  return c.json({
    success: true,
    data: {
      items,
      equipped,
      unequipped,
      totalItems: items.length,
      totalWeight: Math.round(totalWeight * 100) / 100,
    },
  });
});

/**
 * POST /items/inventory/:inventoryId/use
 * Use a consumable item.
 */
itemRoutes.post('/inventory/:inventoryId/use', requireCharacterMiddleware(), async (c) => {
  const inventoryId = c.req.param('inventoryId');
  const characterId = c.get('characterId')!;

  // Get the inventory item
  const invItem = await c.env.DB
    .prepare(
      `SELECT ci.*, id.name, id.item_type, id.use_effects, id.max_stack_size
       FROM character_inventory ci
       JOIN item_definitions id ON ci.item_definition_id = id.id
       WHERE ci.id = ? AND ci.character_id = ?`
    )
    .bind(inventoryId, characterId)
    .first<{
      id: string;
      quantity: number;
      current_charges: number | null;
      name: string;
      item_type: string;
      use_effects: string | null;
      max_stack_size: number;
    }>();

  if (!invItem) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Item not found in inventory' }],
    }, 404);
  }

  // Check if item is usable
  if (!invItem.use_effects) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_USABLE', message: 'This item cannot be used' }],
    }, 400);
  }

  const useEffects: UseEffects = JSON.parse(invItem.use_effects);
  const appliedEffects: string[] = [];

  // Apply healing effect
  if (useEffects.healing) {
    await c.env.DB
      .prepare(
        `UPDATE characters
         SET current_health = MIN(current_health + ?, max_health),
             updated_at = datetime('now')
         WHERE id = ?`
      )
      .bind(useEffects.healing, characterId)
      .run();
    appliedEffects.push(`Healed ${useEffects.healing} HP`);
  }

  // Apply temp attribute bonus
  if (useEffects.tempAttributeBonus) {
    const { attribute, value, duration } = useEffects.tempAttributeBonus;
    await c.env.DB
      .prepare(
        `UPDATE character_attributes
         SET temporary_modifier = temporary_modifier + ?,
             updated_at = datetime('now')
         WHERE character_id = ? AND attribute_id IN (
           SELECT id FROM attribute_definitions WHERE code = ?
         )`
      )
      .bind(value, characterId, attribute)
      .run();
    appliedEffects.push(`+${value} ${attribute} for ${duration}s`);

    // TODO: Schedule removal of temp bonus after duration
  }

  // Apply add condition
  if (useEffects.addCondition) {
    const { condition, duration } = useEffects.addCondition;
    const condDef = await c.env.DB
      .prepare('SELECT id FROM condition_definitions WHERE code = ?')
      .bind(condition)
      .first<{ id: string }>();

    if (condDef) {
      const { nanoid } = await import('nanoid');
      await c.env.DB
        .prepare(
          `INSERT INTO character_conditions
           (id, character_id, condition_id, is_active, duration_remaining_seconds, created_at)
           VALUES (?, ?, ?, 1, ?, datetime('now'))`
        )
        .bind(nanoid(), characterId, condDef.id, duration)
        .run();
      appliedEffects.push(`Applied ${condition} for ${duration}s`);
    }
  }

  // Apply remove condition
  if (useEffects.removeCondition) {
    await c.env.DB
      .prepare(
        `UPDATE character_conditions
         SET is_active = 0, updated_at = datetime('now')
         WHERE character_id = ? AND condition_id IN (
           SELECT id FROM condition_definitions WHERE code = ?
         )`
      )
      .bind(characterId, useEffects.removeCondition)
      .run();
    appliedEffects.push(`Removed ${useEffects.removeCondition}`);
  }

  // Consume the item
  if (invItem.quantity > 1) {
    // Reduce stack
    await c.env.DB
      .prepare(
        `UPDATE character_inventory
         SET quantity = quantity - 1, updated_at = datetime('now')
         WHERE id = ?`
      )
      .bind(inventoryId)
      .run();
  } else {
    // Remove from inventory
    await c.env.DB
      .prepare('DELETE FROM character_inventory WHERE id = ?')
      .bind(inventoryId)
      .run();
  }

  return c.json({
    success: true,
    data: {
      itemUsed: invItem.name,
      effects: appliedEffects,
      remainingQuantity: invItem.quantity > 1 ? invItem.quantity - 1 : 0,
      message: `Used ${invItem.name}. ${appliedEffects.join(', ')}.`,
    },
  });
});

/**
 * POST /items/inventory/:inventoryId/equip
 * Equip an item to a slot.
 */
itemRoutes.post('/inventory/:inventoryId/equip', requireCharacterMiddleware(), zValidator('json', equipSchema), async (c) => {
  const inventoryId = c.req.param('inventoryId');
  const characterId = c.get('characterId')!;
  const { slot } = c.req.valid('json');

  // Get the inventory item
  const invItem = await c.env.DB
    .prepare(
      `SELECT ci.*, id.name, id.item_type, id.item_subtype, id.equip_effects,
              id.required_tier, id.required_attributes
       FROM character_inventory ci
       JOIN item_definitions id ON ci.item_definition_id = id.id
       WHERE ci.id = ? AND ci.character_id = ?`
    )
    .bind(inventoryId, characterId)
    .first<{
      id: string;
      equipped_slot: string | null;
      name: string;
      item_type: string;
      item_subtype: string | null;
      equip_effects: string | null;
      required_tier: number;
      required_attributes: string | null;
    }>();

  if (!invItem) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Item not found in inventory' }],
    }, 404);
  }

  // Check if already equipped
  if (invItem.equipped_slot) {
    return c.json({
      success: false,
      errors: [{ code: 'ALREADY_EQUIPPED', message: 'Item is already equipped' }],
    }, 400);
  }

  // Determine slot from item type if not specified
  let equipSlot = slot;
  if (!equipSlot) {
    switch (invItem.item_type) {
      case 'WEAPON_MELEE':
      case 'WEAPON_RANGED':
        equipSlot = 'MAIN_HAND';
        break;
      case 'ARMOR':
        equipSlot = 'TORSO';
        break;
      case 'ACCESSORY':
        equipSlot = 'ACCESSORY_1';
        break;
      default:
        return c.json({
          success: false,
          errors: [{ code: 'NOT_EQUIPABLE', message: 'This item cannot be equipped' }],
        }, 400);
    }
  }

  // Check tier requirement
  const character = await c.env.DB
    .prepare('SELECT current_tier FROM characters WHERE id = ?')
    .bind(characterId)
    .first<{ current_tier: number }>();

  if (character && character.current_tier < invItem.required_tier) {
    return c.json({
      success: false,
      errors: [{
        code: 'TIER_REQUIREMENT',
        message: `Requires Tier ${invItem.required_tier}`,
      }],
    }, 400);
  }

  // Unequip any item in that slot first
  const existingEquipped = await c.env.DB
    .prepare(
      `SELECT id, item_definition_id FROM character_inventory
       WHERE character_id = ? AND equipped_slot = ?`
    )
    .bind(characterId, equipSlot)
    .first<{ id: string; item_definition_id: string }>();

  if (existingEquipped) {
    await c.env.DB
      .prepare(
        `UPDATE character_inventory
         SET equipped_slot = NULL, updated_at = datetime('now')
         WHERE id = ?`
      )
      .bind(existingEquipped.id)
      .run();

    // Remove old item's bonuses from character
    await removeEquipEffects(c.env.DB, characterId, existingEquipped.item_definition_id);
  }

  // Equip the new item
  await c.env.DB
    .prepare(
      `UPDATE character_inventory
       SET equipped_slot = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(equipSlot, inventoryId)
    .run();

  // Apply equip effects to character
  if (invItem.equip_effects) {
    const effects: EquipEffects = JSON.parse(invItem.equip_effects);
    await applyEquipEffects(c.env.DB, characterId, effects);
  }

  return c.json({
    success: true,
    data: {
      equipped: {
        inventoryId,
        name: invItem.name,
        slot: equipSlot,
      },
      unequipped: existingEquipped ? {
        inventoryId: existingEquipped.id,
      } : null,
      message: `Equipped ${invItem.name} to ${equipSlot}.`,
    },
  });
});

/**
 * POST /items/inventory/:inventoryId/unequip
 * Unequip an item.
 */
itemRoutes.post('/inventory/:inventoryId/unequip', requireCharacterMiddleware(), async (c) => {
  const inventoryId = c.req.param('inventoryId');
  const characterId = c.get('characterId')!;

  // Get the inventory item
  const invItem = await c.env.DB
    .prepare(
      `SELECT ci.*, id.name, id.equip_effects
       FROM character_inventory ci
       JOIN item_definitions id ON ci.item_definition_id = id.id
       WHERE ci.id = ? AND ci.character_id = ?`
    )
    .bind(inventoryId, characterId)
    .first<{
      id: string;
      item_definition_id: string;
      equipped_slot: string | null;
      name: string;
      equip_effects: string | null;
    }>();

  if (!invItem) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Item not found in inventory' }],
    }, 404);
  }

  if (!invItem.equipped_slot) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_EQUIPPED', message: 'Item is not equipped' }],
    }, 400);
  }

  const previousSlot = invItem.equipped_slot;

  // Unequip
  await c.env.DB
    .prepare(
      `UPDATE character_inventory
       SET equipped_slot = NULL, updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(inventoryId)
    .run();

  // Remove equip effects
  await removeEquipEffects(c.env.DB, characterId, invItem.item_definition_id);

  return c.json({
    success: true,
    data: {
      unequipped: {
        inventoryId,
        name: invItem.name,
        previousSlot,
      },
      message: `Unequipped ${invItem.name} from ${previousSlot}.`,
    },
  });
});

/**
 * DELETE /items/inventory/:inventoryId
 * Discard/drop an item from inventory.
 */
itemRoutes.delete('/inventory/:inventoryId', requireCharacterMiddleware(), async (c) => {
  const inventoryId = c.req.param('inventoryId');
  const characterId = c.get('characterId')!;
  const quantityParam = c.req.query('quantity');
  const quantity = quantityParam ? parseInt(quantityParam, 10) : 1;

  // Get the inventory item
  const invItem = await c.env.DB
    .prepare(
      `SELECT ci.*, id.name, id.equip_effects
       FROM character_inventory ci
       JOIN item_definitions id ON ci.item_definition_id = id.id
       WHERE ci.id = ? AND ci.character_id = ?`
    )
    .bind(inventoryId, characterId)
    .first<{
      id: string;
      item_definition_id: string;
      quantity: number;
      equipped_slot: string | null;
      name: string;
      equip_effects: string | null;
    }>();

  if (!invItem) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Item not found in inventory' }],
    }, 404);
  }

  // Cannot discard equipped items
  if (invItem.equipped_slot) {
    return c.json({
      success: false,
      errors: [{ code: 'ITEM_EQUIPPED', message: 'Unequip item before discarding' }],
    }, 400);
  }

  // Check quantity
  if (quantity > invItem.quantity) {
    return c.json({
      success: false,
      errors: [{ code: 'INSUFFICIENT_QUANTITY', message: `Only have ${invItem.quantity} to discard` }],
    }, 400);
  }

  // Discard the item(s)
  if (quantity >= invItem.quantity) {
    // Remove entirely
    await c.env.DB
      .prepare('DELETE FROM character_inventory WHERE id = ?')
      .bind(inventoryId)
      .run();
  } else {
    // Reduce quantity
    await c.env.DB
      .prepare(
        `UPDATE character_inventory
         SET quantity = quantity - ?, updated_at = datetime('now')
         WHERE id = ?`
      )
      .bind(quantity, inventoryId)
      .run();
  }

  return c.json({
    success: true,
    data: {
      discarded: {
        inventoryId,
        name: invItem.name,
        quantity,
      },
      remainingQuantity: Math.max(0, invItem.quantity - quantity),
      message: `Discarded ${quantity}x ${invItem.name}.`,
    },
  });
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Apply equip effects to character stats.
 */
async function applyEquipEffects(
  db: D1Database,
  characterId: string,
  effects: EquipEffects
): Promise<void> {
  // Apply attribute bonuses
  if (effects.attributeBonuses) {
    for (const [attrCode, bonus] of Object.entries(effects.attributeBonuses)) {
      await db
        .prepare(
          `UPDATE character_attributes
           SET bonus_from_items = bonus_from_items + ?,
               updated_at = datetime('now')
           WHERE character_id = ? AND attribute_id IN (
             SELECT id FROM attribute_definitions WHERE code = ?
           )`
        )
        .bind(bonus, characterId, attrCode)
        .run();
    }
  }

  // Skill bonuses are stored in the item itself and queried during checks
  // (already handled in getSkillCheckData)
}

/**
 * Remove equip effects from character stats.
 */
async function removeEquipEffects(
  db: D1Database,
  characterId: string,
  itemDefinitionId: string
): Promise<void> {
  // Get the item's effects
  const item = await db
    .prepare('SELECT equip_effects FROM item_definitions WHERE id = ?')
    .bind(itemDefinitionId)
    .first<{ equip_effects: string | null }>();

  if (!item?.equip_effects) return;

  const effects: EquipEffects = JSON.parse(item.equip_effects);

  // Remove attribute bonuses
  if (effects.attributeBonuses) {
    for (const [attrCode, bonus] of Object.entries(effects.attributeBonuses)) {
      await db
        .prepare(
          `UPDATE character_attributes
           SET bonus_from_items = bonus_from_items - ?,
               updated_at = datetime('now')
           WHERE character_id = ? AND attribute_id IN (
             SELECT id FROM attribute_definitions WHERE code = ?
           )`
        )
        .bind(bonus, characterId, attrCode)
        .run();
    }
  }
}
