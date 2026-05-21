
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
 * - GET /items/armor - Browse armor
 * - GET /items/weapons - Browse weapons
 * - GET /items/consumables - Browse consumables
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, requireCharacterMiddleware, type AuthVariables } from '../../middleware/auth';
import type { D1Database, KVNamespace } from '@cloudflare/workers-types';
import { ItemService } from '../../services/items/item';

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

const equipSchema = z.object({
  slot: z.string().optional(),
});

export const itemRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

itemRoutes.use('*', authMiddleware());



itemRoutes.get('/catalog', async (c) => {
  const service = new ItemService(c.env.DB);
  const result = await service.searchCatalog({
    type: c.req.query('type'),
    rarity: c.req.query('rarity'),
    maxTier: c.req.query('maxTier') ? parseInt(c.req.query('maxTier')!, 10) : undefined,
    search: c.req.query('search'),
  });

  return c.json({
    success: true,
    data: {
      items: result.items,
      byType: result.byType,
      count: result.items.length
    }
  });
});

itemRoutes.get('/catalog/:id', async (c) => {
  const itemId = c.req.param('id');
  const service = new ItemService(c.env.DB);
  const item = await service.getItemDefinition(itemId);

  if (!item) {
    return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Item not found' }] }, 404);
  }

  return c.json({
    success: true,
    data: { item }
  });
});

/**
 * GET /items/inventory
 */
itemRoutes.get('/inventory', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;
  const service = new ItemService(c.env.DB);

  try {
    const { items, totalWeight } = await service.getInventory(characterId);

    // Get character's credits (Added for Frontend compatibility)
    const finances = await c.env.DB
      .prepare('SELECT * FROM character_finances WHERE character_id = ?')
      .bind(characterId)
      .first<any>();

    const equipped = items.filter(i => i.isEquipped);
    const unequipped = items.filter(i => !i.isEquipped);

    return c.json({
      success: true,
      data: {
        items,
        equipped,
        unequipped,
        totalItems: items.length,
        totalWeight: Math.round(totalWeight * 100) / 100,
        finances: finances ? {
          credits: finances.primary_currency_balance || 0,
          creditsLifetime: finances.lifetime_earnings || 0,
          escrowHeld: finances.escrow_balance || 0,
          debt: finances.debt_balance || 0,
        } : null,
      }
    });
  } catch (error: any) {
    console.error('[API] Inventory Error:', error);
    return c.json({ success: false, errors: [{ message: error.message || 'Internal Server Error' }] }, 500);
  }
});

/**
 * POST /items/inventory/:inventoryId/use
 */
itemRoutes.post('/inventory/:inventoryId/use', requireCharacterMiddleware(), async (c) => {
  const inventoryId = c.req.param('inventoryId');
  const characterId = c.get('characterId')!;
  const service = new ItemService(c.env.DB);

  try {
    const result = await service.useItem(characterId, inventoryId);
    return c.json({ success: true, data: result });
  } catch (err: any) {
    return c.json({ success: false, errors: [{ message: err.message }] }, 400);
  }
});

/**
 * POST /items/inventory/:inventoryId/equip
 */
itemRoutes.post('/inventory/:inventoryId/equip', requireCharacterMiddleware(), zValidator('json', equipSchema), async (c) => {
  const inventoryId = c.req.param('inventoryId');
  const characterId = c.get('characterId')!;
  const { slot } = c.req.valid('json');
  const service = new ItemService(c.env.DB);

  try {
    const result = await service.equipItem(characterId, inventoryId, slot);
    return c.json({ success: true, data: result });
  } catch (err: any) {
    return c.json({ success: false, errors: [{ message: err.message }] }, 400);
  }
});

/**
 * POST /items/inventory/:inventoryId/unequip
 */
itemRoutes.post('/inventory/:inventoryId/unequip', requireCharacterMiddleware(), async (c) => {
  const inventoryId = c.req.param('inventoryId');
  const characterId = c.get('characterId')!;
  const service = new ItemService(c.env.DB);

  try {
    await service.unequipItem(characterId, inventoryId);
    return c.json({ success: true, data: { message: 'Unequipped item' } });
  } catch (err: any) {
    return c.json({ success: false, errors: [{ message: err.message }] }, 400);
  }
});

/**
 * DELETE /items/inventory/:inventoryId
 */
itemRoutes.delete('/inventory/:inventoryId', requireCharacterMiddleware(), async (c) => {
  const inventoryId = c.req.param('inventoryId');
  const characterId = c.get('characterId')!;
  const quantity = parseInt(c.req.query('quantity') || '1', 10);
  const service = new ItemService(c.env.DB);

  try {
    const result = await service.discardItem(characterId, inventoryId, quantity);
    return c.json({ success: true, data: result });
  } catch (err: any) {
    return c.json({ success: false, errors: [{ message: err.message }] }, 400);
  }
});

// =============================================================================
// CATALOGS
// =============================================================================

/**
 * GET /items/armor
 */
itemRoutes.get('/armor', async (c) => {
  const service = new ItemService(c.env.DB);
  const armor = await service.getArmorCatalog({
    style: c.req.query('style'),
    minArmor: c.req.query('minArmor') ? parseInt(c.req.query('minArmor')!) : undefined
  });

  return c.json({ success: true, data: { armor, total: armor.length } });
});

/**
 * GET /items/armor/:id
 */
itemRoutes.get('/armor/:id', async (c) => {
  const service = new ItemService(c.env.DB);
  const armor = await service.getArmorDetails(c.req.param('id'));

  if (!armor) return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Armor not found' }] }, 404);

  return c.json({ success: true, data: { armor } });
});

/**
 * GET /items/weapons
 */
itemRoutes.get('/weapons', async (c) => {
  const service = new ItemService(c.env.DB);
  const weapons = await service.getWeaponCatalog({
    class: c.req.query('class'),
    damageType: c.req.query('damageType'),
    melee: c.req.query('melee') === 'true',
    ranged: c.req.query('ranged') === 'true'
  });

  return c.json({ success: true, data: { weapons, total: weapons.length } });
});

/**
 * GET /items/weapons/:id
 */
itemRoutes.get('/weapons/:id', async (c) => {
  const service = new ItemService(c.env.DB);
  const weapon = await service.getWeaponDetails(c.req.param('id'));

  if (!weapon) return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Weapon not found' }] }, 404);

  return c.json({ success: true, data: { weapon } });
});

/**
 * GET /items/consumables
 */
itemRoutes.get('/consumables', async (c) => {
  const service = new ItemService(c.env.DB);
  const consumables = await service.getConsumableCatalog({
    type: c.req.query('type'),
    illegal: c.req.query('illegal') === 'true' ? true : c.req.query('illegal') === 'false' ? false : undefined
  });

  return c.json({ success: true, data: { consumables, total: consumables.length } });
});

/**
 * GET /items/consumables/:id
 */
itemRoutes.get('/consumables/:id', async (c) => {
  const service = new ItemService(c.env.DB);
  const consumable = await service.getConsumableDetails(c.req.param('id'));

  if (!consumable) return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Consumable not found' }] }, 404);

  return c.json({ success: true, data: { consumable } });
});
