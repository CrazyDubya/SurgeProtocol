/**
 * Surge Protocol - Economy Routes
 *
 * Endpoints:
 * - GET /economy/currencies - List available currencies
 * - GET /economy/balance - Get character's current balances
 * - GET /economy/transactions - Transaction history (paginated)
 * - POST /economy/transfer - Transfer funds between accounts
 * - GET /economy/vendors - List nearby vendors
 * - GET /economy/vendors/:id - Vendor details + inventory
 * - POST /economy/vendors/:id/buy - Purchase item from vendor
 * - POST /economy/vendors/:id/sell - Sell item to vendor
 * - POST /economy/vendors/:id/haggle - Attempt to negotiate price
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
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

type Variables = AuthVariables & {
  characterId?: string;
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const transferSchema = z.object({
  amount: z.number().int().positive(),
  currencyId: z.string().optional(), // Defaults to primary currency
  fromAccount: z.enum(['wallet', 'bank', 'stash']).default('wallet'),
  toAccount: z.enum(['wallet', 'bank', 'stash']),
  description: z.string().max(255).optional(),
});

const buySchema = z.object({
  itemId: z.string(),
  quantity: z.number().int().positive().default(1),
  paymentMethod: z.enum(['wallet', 'bank', 'credit']).default('wallet'),
});

const sellSchema = z.object({
  inventoryItemId: z.string(),
  quantity: z.number().int().positive().default(1),
});

const haggleSchema = z.object({
  itemId: z.string(),
  action: z.enum(['buy', 'sell']),
  proposedPrice: z.number().int().positive(),
});

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// =============================================================================
// ROUTES
// =============================================================================

export const economyRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply auth middleware to all routes
economyRoutes.use('*', authMiddleware());

// =============================================================================
// CURRENCY ENDPOINTS
// =============================================================================

/**
 * GET /economy/currencies
 * List all available currencies.
 */
economyRoutes.get('/currencies', async (c) => {
  const currencies = await c.env.DB
    .prepare(`
      SELECT
        id, code, name, symbol, description,
        currency_type, is_primary, is_tradeable, is_physical,
        exchange_rate_to_primary, tier_required, illegal
      FROM currency_definitions
      WHERE 1=1
      ORDER BY is_primary DESC, code ASC
    `)
    .all();

  return c.json({
    success: true,
    data: {
      currencies: currencies.results || [],
    },
  });
});

/**
 * GET /economy/currencies/:code
 * Get details for a specific currency.
 */
economyRoutes.get('/currencies/:code', async (c) => {
  const code = c.req.param('code');

  const currency = await c.env.DB
    .prepare(`
      SELECT *
      FROM currency_definitions
      WHERE code = ?
    `)
    .bind(code)
    .first();

  if (!currency) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Currency not found' }],
    }, 404);
  }

  return c.json({
    success: true,
    data: { currency },
  });
});

// =============================================================================
// BALANCE & TRANSACTION ENDPOINTS
// =============================================================================

/**
 * GET /economy/balance
 * Get character's current balances across all accounts.
 */
economyRoutes.get('/balance', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId');

  // Get or create character finances record
  let finances = await c.env.DB
    .prepare(`
      SELECT *
      FROM character_finances
      WHERE character_id = ?
    `)
    .bind(characterId)
    .first();

  if (!finances) {
    // Initialize finances for new character
    const financeId = nanoid();
    await c.env.DB
      .prepare(`
        INSERT INTO character_finances (id, character_id, primary_currency_balance)
        VALUES (?, ?, 1000)
      `)
      .bind(financeId, characterId)
      .run();

    finances = {
      id: financeId,
      character_id: characterId,
      primary_currency_balance: 1000,
      currency_balances: '{}',
      physical_currency_on_person: '{}',
      bank_accounts: '{}',
      crypto_wallets: '{}',
      hidden_stashes: '{}',
      total_earned_career: 0,
      total_spent_career: 0,
      total_debt: 0,
      credit_score: 500,
      credit_limit: 1000,
      credit_utilized: 0,
    };
  }

  // Parse JSON fields
  const currencyBalances = safeParseJSON(finances.currency_balances as string, {});
  const bankAccounts = safeParseJSON(finances.bank_accounts as string, {});
  const cryptoWallets = safeParseJSON(finances.crypto_wallets as string, {});
  const hiddenStashes = safeParseJSON(finances.hidden_stashes as string, {});

  return c.json({
    success: true,
    data: {
      wallet: {
        primary: finances.primary_currency_balance,
        currencies: currencyBalances,
      },
      bank: bankAccounts,
      crypto: cryptoWallets,
      stashes: hiddenStashes,
      stats: {
        totalEarnedCareer: finances.total_earned_career,
        totalSpentCareer: finances.total_spent_career,
        totalDebt: finances.total_debt,
        creditScore: finances.credit_score,
        creditLimit: finances.credit_limit,
        creditUtilized: finances.credit_utilized,
      },
    },
  });
});

/**
 * GET /economy/transactions
 * Get transaction history for the character.
 */
economyRoutes.get('/transactions', requireCharacterMiddleware(), zValidator('query', paginationSchema), async (c) => {
  const characterId = c.get('characterId');
  const { limit, offset } = c.req.valid('query');

  const transactions = await c.env.DB
    .prepare(`
      SELECT
        id, occurred_at, transaction_type, currency_id,
        amount, is_income, balance_after,
        source_type, source_name,
        destination_type, destination_name,
        description, category
      FROM financial_transactions
      WHERE character_id = ?
      ORDER BY occurred_at DESC
      LIMIT ? OFFSET ?
    `)
    .bind(characterId, limit, offset)
    .all();

  const countResult = await c.env.DB
    .prepare('SELECT COUNT(*) as total FROM financial_transactions WHERE character_id = ?')
    .bind(characterId)
    .first<{ total: number }>();

  return c.json({
    success: true,
    data: {
      transactions: transactions.results || [],
      pagination: {
        limit,
        offset,
        total: countResult?.total || 0,
      },
    },
  });
});

/**
 * POST /economy/transfer
 * Transfer funds between character's accounts.
 */
economyRoutes.post('/transfer', requireCharacterMiddleware(), zValidator('json', transferSchema), async (c) => {
  const characterId = c.get('characterId');
  const { amount, fromAccount, toAccount, description } = c.req.valid('json');

  if (fromAccount === toAccount) {
    return c.json({
      success: false,
      errors: [{ code: 'INVALID_TRANSFER', message: 'Cannot transfer to the same account' }],
    }, 400);
  }

  // Get current finances
  const finances = await c.env.DB
    .prepare('SELECT * FROM character_finances WHERE character_id = ?')
    .bind(characterId)
    .first();

  if (!finances) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_FINANCES', message: 'Character finances not initialized' }],
    }, 400);
  }

  // Check balance in source account
  const sourceBalance = getAccountBalance(finances, fromAccount);
  if (sourceBalance < amount) {
    return c.json({
      success: false,
      errors: [{ code: 'INSUFFICIENT_FUNDS', message: `Insufficient funds in ${fromAccount}` }],
    }, 400);
  }

  // Execute transfer
  const updateQuery = buildTransferUpdate(fromAccount, toAccount, amount);
  await c.env.DB
    .prepare(`UPDATE character_finances SET ${updateQuery}, updated_at = datetime('now') WHERE character_id = ?`)
    .bind(characterId)
    .run();

  // Record transaction
  const transactionId = nanoid();
  await c.env.DB
    .prepare(`
      INSERT INTO financial_transactions
        (id, character_id, transaction_type, amount, is_income,
         source_type, source_name, destination_type, destination_name, description, category)
      VALUES (?, ?, 'TRANSFER', ?, 0, ?, ?, ?, ?, ?, 'INTERNAL')
    `)
    .bind(
      transactionId, characterId, amount,
      'ACCOUNT', fromAccount,
      'ACCOUNT', toAccount,
      description || `Transfer from ${fromAccount} to ${toAccount}`
    )
    .run();

  return c.json({
    success: true,
    data: {
      transactionId,
      amount,
      from: fromAccount,
      to: toAccount,
      message: `Transferred ${amount} credits from ${fromAccount} to ${toAccount}`,
    },
  });
});

// =============================================================================
// VENDOR ENDPOINTS
// =============================================================================

/**
 * GET /economy/vendors
 * List vendors near the character's location.
 */
economyRoutes.get('/vendors', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId');

  // Get character's current location
  const character = await c.env.DB
    .prepare('SELECT current_location_id, current_district_id FROM characters WHERE id = ?')
    .bind(characterId)
    .first();

  // Get vendors in the district (or all if no location set)
  const vendors = await c.env.DB
    .prepare(`
      SELECT
        vi.id, vi.vendor_type, vi.specialization,
        vi.quality_tier_min, vi.quality_tier_max,
        vi.buy_price_modifier, vi.sell_price_modifier,
        vi.reputation_required, vi.tier_required,
        vi.accepts_stolen, vi.accepts_contraband,
        n.id as npc_id, n.name as npc_name, n.occupation,
        l.id as location_id, l.name as location_name
      FROM vendor_inventories vi
      LEFT JOIN npc_definitions n ON vi.vendor_npc_id = n.id
      LEFT JOIN locations l ON vi.location_id = l.id
      WHERE vi.location_id = ? OR ? IS NULL
      ORDER BY vi.vendor_type, n.name
      LIMIT 50
    `)
    .bind(character?.current_location_id || null, character?.current_location_id || null)
    .all();

  return c.json({
    success: true,
    data: {
      vendors: vendors.results || [],
      location: character?.current_location_id || null,
    },
  });
});

/**
 * GET /economy/vendors/:id
 * Get vendor details and inventory.
 */
economyRoutes.get('/vendors/:id', requireCharacterMiddleware(), async (c) => {
  const vendorId = c.req.param('id');
  const characterId = c.get('characterId');

  // Get vendor info
  const vendor = await c.env.DB
    .prepare(`
      SELECT
        vi.*,
        n.id as npc_id, n.name as npc_name, n.occupation, n.dialogue_greeting,
        l.id as location_id, l.name as location_name
      FROM vendor_inventories vi
      LEFT JOIN npc_definitions n ON vi.vendor_npc_id = n.id
      LEFT JOIN locations l ON vi.location_id = l.id
      WHERE vi.id = ?
    `)
    .bind(vendorId)
    .first();

  if (!vendor) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Vendor not found' }],
    }, 404);
  }

  // Check if character meets requirements
  const character = await c.env.DB
    .prepare('SELECT carrier_tier FROM characters WHERE id = ?')
    .bind(characterId)
    .first<{ carrier_tier: number }>();

  if (character && character.carrier_tier < (vendor.tier_required as number || 1)) {
    return c.json({
      success: false,
      errors: [{
        code: 'TIER_REQUIRED',
        message: `Requires Tier ${vendor.tier_required} (you are Tier ${character.carrier_tier})`
      }],
    }, 403);
  }

  // Parse inventory
  const baseInventory = safeParseJSON(vendor.base_inventory as string, []);
  const rotatingInventory = safeParseJSON(vendor.rotating_inventory as string, []);
  const limitedStock = safeParseJSON(vendor.limited_stock as string, []);

  // Get item details for inventory
  const allItemIds = [...baseInventory, ...rotatingInventory, ...limitedStock]
    .map((item: { itemId?: string; item_id?: string }) => item.itemId || item.item_id)
    .filter(Boolean);

  let items: Record<string, unknown> = {};
  if (allItemIds.length > 0) {
    const placeholders = allItemIds.map(() => '?').join(',');
    const itemsResult = await c.env.DB
      .prepare(`
        SELECT id, code, name, description, item_type, rarity, base_price, weight
        FROM item_definitions
        WHERE id IN (${placeholders})
      `)
      .bind(...allItemIds)
      .all();

    for (const item of (itemsResult.results || [])) {
      const itemData = item as Record<string, unknown>;
      if (itemData.id) {
        items[itemData.id as string] = itemData;
      }
    }
  }

  return c.json({
    success: true,
    data: {
      vendor: {
        id: vendor.id,
        type: vendor.vendor_type,
        specialization: vendor.specialization,
        buyPriceModifier: vendor.buy_price_modifier,
        sellPriceModifier: vendor.sell_price_modifier,
        haggleDifficulty: vendor.haggle_difficulty,
        acceptsStolen: vendor.accepts_stolen === 1,
        acceptsContraband: vendor.accepts_contraband === 1,
        npc: vendor.npc_id ? {
          id: vendor.npc_id,
          name: vendor.npc_name,
          occupation: vendor.occupation,
          greeting: vendor.dialogue_greeting,
        } : null,
        location: vendor.location_id ? {
          id: vendor.location_id,
          name: vendor.location_name,
        } : null,
      },
      inventory: {
        base: enrichInventory(baseInventory, items, vendor.buy_price_modifier as number),
        rotating: enrichInventory(rotatingInventory, items, vendor.buy_price_modifier as number),
        limited: enrichInventory(limitedStock, items, vendor.buy_price_modifier as number),
      },
    },
  });
});

/**
 * POST /economy/vendors/:id/buy
 * Purchase an item from a vendor.
 */
economyRoutes.post('/vendors/:id/buy', requireCharacterMiddleware(), zValidator('json', buySchema), async (c) => {
  const vendorId = c.req.param('id');
  const characterId = c.get('characterId');
  const { itemId, quantity, paymentMethod } = c.req.valid('json');

  // Get vendor
  const vendor = await c.env.DB
    .prepare('SELECT * FROM vendor_inventories WHERE id = ?')
    .bind(vendorId)
    .first();

  if (!vendor) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Vendor not found' }],
    }, 404);
  }

  // Get item
  const item = await c.env.DB
    .prepare('SELECT * FROM item_definitions WHERE id = ?')
    .bind(itemId)
    .first();

  if (!item) {
    return c.json({
      success: false,
      errors: [{ code: 'ITEM_NOT_FOUND', message: 'Item not found' }],
    }, 404);
  }

  // Calculate price
  const basePrice = (item.base_price as number) || 0;
  const modifier = (vendor.buy_price_modifier as number) || 1.0;
  const totalPrice = Math.ceil(basePrice * modifier * quantity);

  // Check funds
  const finances = await c.env.DB
    .prepare('SELECT * FROM character_finances WHERE character_id = ?')
    .bind(characterId)
    .first();

  if (!finances) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_FINANCES', message: 'Character finances not initialized' }],
    }, 400);
  }

  const availableFunds = getAccountBalance(finances, paymentMethod === 'credit' ? 'wallet' : paymentMethod);

  if (paymentMethod === 'credit') {
    const creditAvailable = (finances.credit_limit as number) - (finances.credit_utilized as number);
    if (totalPrice > creditAvailable) {
      return c.json({
        success: false,
        errors: [{ code: 'CREDIT_LIMIT', message: 'Insufficient credit available' }],
      }, 400);
    }
  } else if (availableFunds < totalPrice) {
    return c.json({
      success: false,
      errors: [{ code: 'INSUFFICIENT_FUNDS', message: `Need ${totalPrice} credits, have ${availableFunds}` }],
    }, 400);
  }

  // Deduct payment
  if (paymentMethod === 'credit') {
    await c.env.DB
      .prepare(`
        UPDATE character_finances
        SET credit_utilized = credit_utilized + ?,
            total_spent_career = total_spent_career + ?,
            updated_at = datetime('now')
        WHERE character_id = ?
      `)
      .bind(totalPrice, totalPrice, characterId)
      .run();
  } else {
    // Note: Bank payments would need JSON update logic for bank_accounts field
    // For now, all non-credit payments come from wallet
    await c.env.DB
      .prepare(`
        UPDATE character_finances
        SET primary_currency_balance = primary_currency_balance - ?,
            total_spent_career = total_spent_career + ?,
            updated_at = datetime('now')
        WHERE character_id = ?
      `)
      .bind(totalPrice, totalPrice, characterId)
      .run();
  }

  // Add item to inventory
  const inventoryId = nanoid();
  await c.env.DB
    .prepare(`
      INSERT INTO character_inventory
        (id, character_id, item_definition_id, quantity, equipped, acquired_from, acquired_at)
      VALUES (?, ?, ?, ?, 0, 'VENDOR', datetime('now'))
    `)
    .bind(inventoryId, characterId, itemId, quantity)
    .run();

  // Record transaction
  const transactionId = nanoid();
  await c.env.DB
    .prepare(`
      INSERT INTO financial_transactions
        (id, character_id, transaction_type, amount, is_income,
         source_type, source_name, destination_type, destination_name,
         description, category, related_item_id, is_legal, traceable)
      VALUES (?, ?, 'PURCHASE', ?, 0, 'CHARACTER', 'Wallet', 'VENDOR', ?, ?, 'SHOPPING', ?, 1, 1)
    `)
    .bind(
      transactionId, characterId, totalPrice,
      vendor.vendor_npc_id || 'Unknown Vendor',
      `Purchased ${quantity}x ${item.name}`,
      itemId
    )
    .run();

  return c.json({
    success: true,
    data: {
      transactionId,
      inventoryId,
      item: {
        id: item.id,
        name: item.name,
        quantity,
      },
      price: {
        unitPrice: Math.ceil(basePrice * modifier),
        quantity,
        total: totalPrice,
      },
      paymentMethod,
    },
  });
});

/**
 * POST /economy/vendors/:id/sell
 * Sell an item to a vendor.
 */
economyRoutes.post('/vendors/:id/sell', requireCharacterMiddleware(), zValidator('json', sellSchema), async (c) => {
  const vendorId = c.req.param('id');
  const characterId = c.get('characterId');
  const { inventoryItemId, quantity } = c.req.valid('json');

  // Get vendor
  const vendor = await c.env.DB
    .prepare('SELECT * FROM vendor_inventories WHERE id = ?')
    .bind(vendorId)
    .first();

  if (!vendor) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Vendor not found' }],
    }, 404);
  }

  // Get inventory item
  const inventoryItem = await c.env.DB
    .prepare(`
      SELECT ci.*, id.base_price, id.name as item_name, id.is_stolen, id.is_contraband
      FROM character_inventory ci
      JOIN item_definitions id ON ci.item_definition_id = id.id
      WHERE ci.id = ? AND ci.character_id = ?
    `)
    .bind(inventoryItemId, characterId)
    .first();

  if (!inventoryItem) {
    return c.json({
      success: false,
      errors: [{ code: 'ITEM_NOT_FOUND', message: 'Item not in inventory' }],
    }, 404);
  }

  if ((inventoryItem.quantity as number) < quantity) {
    return c.json({
      success: false,
      errors: [{ code: 'INSUFFICIENT_QUANTITY', message: 'Not enough items to sell' }],
    }, 400);
  }

  // Check if vendor accepts stolen/contraband
  if (inventoryItem.is_stolen && !vendor.accepts_stolen) {
    return c.json({
      success: false,
      errors: [{ code: 'VENDOR_REFUSES', message: 'Vendor does not accept stolen goods' }],
    }, 400);
  }

  if (inventoryItem.is_contraband && !vendor.accepts_contraband) {
    return c.json({
      success: false,
      errors: [{ code: 'VENDOR_REFUSES', message: 'Vendor does not accept contraband' }],
    }, 400);
  }

  // Calculate sell price
  const basePrice = (inventoryItem.base_price as number) || 0;
  const modifier = (vendor.sell_price_modifier as number) || 0.5;
  const totalPrice = Math.floor(basePrice * modifier * quantity);

  // Update or remove inventory item
  if ((inventoryItem.quantity as number) === quantity) {
    await c.env.DB
      .prepare('DELETE FROM character_inventory WHERE id = ?')
      .bind(inventoryItemId)
      .run();
  } else {
    await c.env.DB
      .prepare('UPDATE character_inventory SET quantity = quantity - ? WHERE id = ?')
      .bind(quantity, inventoryItemId)
      .run();
  }

  // Add payment
  await c.env.DB
    .prepare(`
      UPDATE character_finances
      SET primary_currency_balance = primary_currency_balance + ?,
          total_earned_career = total_earned_career + ?,
          updated_at = datetime('now')
      WHERE character_id = ?
    `)
    .bind(totalPrice, totalPrice, characterId)
    .run();

  // Record transaction
  const transactionId = nanoid();
  await c.env.DB
    .prepare(`
      INSERT INTO financial_transactions
        (id, character_id, transaction_type, amount, is_income,
         source_type, source_name, destination_type, destination_name,
         description, category, related_item_id, is_legal, traceable)
      VALUES (?, ?, 'SALE', ?, 1, 'VENDOR', ?, 'CHARACTER', 'Wallet', ?, 'SHOPPING', ?, 1, 1)
    `)
    .bind(
      transactionId, characterId, totalPrice,
      vendor.vendor_npc_id || 'Unknown Vendor',
      `Sold ${quantity}x ${inventoryItem.item_name}`,
      inventoryItem.item_definition_id
    )
    .run();

  return c.json({
    success: true,
    data: {
      transactionId,
      item: {
        id: inventoryItem.item_definition_id,
        name: inventoryItem.item_name,
        quantity,
      },
      price: {
        unitPrice: Math.floor(basePrice * modifier),
        quantity,
        total: totalPrice,
      },
    },
  });
});

/**
 * POST /economy/vendors/:id/haggle
 * Attempt to negotiate a better price.
 */
economyRoutes.post('/vendors/:id/haggle', requireCharacterMiddleware(), zValidator('json', haggleSchema), async (c) => {
  const vendorId = c.req.param('id');
  const characterId = c.get('characterId');
  const { itemId, action, proposedPrice } = c.req.valid('json');

  // Get vendor
  const vendor = await c.env.DB
    .prepare('SELECT * FROM vendor_inventories WHERE id = ?')
    .bind(vendorId)
    .first();

  if (!vendor) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Vendor not found' }],
    }, 404);
  }

  // Get item
  const item = await c.env.DB
    .prepare('SELECT * FROM item_definitions WHERE id = ?')
    .bind(itemId)
    .first();

  if (!item) {
    return c.json({
      success: false,
      errors: [{ code: 'ITEM_NOT_FOUND', message: 'Item not found' }],
    }, 404);
  }

  // Get character's EMP attribute for haggle check
  const empAttr = await c.env.DB
    .prepare(`
      SELECT ca.current_value
      FROM character_attributes ca
      JOIN attribute_definitions ad ON ca.attribute_id = ad.id
      WHERE ca.character_id = ? AND ad.code = 'EMP'
    `)
    .bind(characterId)
    .first<{ current_value: number }>();

  const empValue = empAttr?.current_value || 5;
  const haggleDifficulty = (vendor.haggle_difficulty as number) || 5;

  // Calculate base and target prices
  const basePrice = (item.base_price as number) || 0;
  const currentModifier = action === 'buy'
    ? (vendor.buy_price_modifier as number) || 1.0
    : (vendor.sell_price_modifier as number) || 0.5;
  const currentPrice = action === 'buy'
    ? Math.ceil(basePrice * currentModifier)
    : Math.floor(basePrice * currentModifier);

  // Calculate how aggressive the haggle is
  const priceDiff = action === 'buy'
    ? currentPrice - proposedPrice
    : proposedPrice - currentPrice;
  const diffPercent = Math.abs(priceDiff) / currentPrice;

  // Haggle check: 2d6 + EMP mod vs difficulty + diff modifier
  const empMod = Math.floor((empValue - 10) / 2);
  const diffMod = Math.floor(diffPercent * 10); // Harder to haggle more
  const roll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
  const total = roll + empMod;
  const target = haggleDifficulty + diffMod;

  const success = total >= target;
  const margin = total - target;

  // Calculate actual discount/bonus
  let finalPrice = currentPrice;
  if (success) {
    // Successful haggle - apply portion of requested discount
    const achievedDiff = Math.min(priceDiff, Math.floor(priceDiff * (0.5 + margin * 0.1)));
    finalPrice = action === 'buy'
      ? currentPrice - achievedDiff
      : currentPrice + achievedDiff;
  } else if (margin < -3) {
    // Critical failure - vendor offended, prices go UP
    finalPrice = action === 'buy'
      ? Math.ceil(currentPrice * 1.1)
      : Math.floor(currentPrice * 0.9);
  }

  return c.json({
    success: true,
    data: {
      haggleResult: success ? 'SUCCESS' : (margin < -3 ? 'CRITICAL_FAILURE' : 'FAILURE'),
      roll: { dice: roll, modifier: empMod, total, target },
      prices: {
        original: currentPrice,
        proposed: proposedPrice,
        final: finalPrice,
        discount: currentPrice - finalPrice,
      },
      vendorReaction: success
        ? "The vendor sighs and nods reluctantly."
        : margin < -3
          ? "The vendor's eyes narrow. 'You insult me. Prices just went up.'"
          : "The vendor shakes their head. 'That's my final price.'",
    },
  });
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function safeParseJSON<T>(value: string | null | undefined, defaultValue: T): T {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value);
  } catch {
    return defaultValue;
  }
}

function getAccountBalance(finances: Record<string, unknown>, account: string): number {
  switch (account) {
    case 'wallet':
      return (finances.primary_currency_balance as number) || 0;
    case 'bank': {
      const bankAccounts = safeParseJSON(finances.bank_accounts as string, { primary: 0 });
      return bankAccounts.primary || 0;
    }
    case 'stash': {
      const stashes = safeParseJSON(finances.hidden_stashes as string, {});
      return Object.values(stashes).reduce((sum: number, val) => sum + (val as number || 0), 0);
    }
    default:
      return 0;
  }
}

function buildTransferUpdate(from: string, _to: string, amount: number): string {
  // For simplicity, only handling wallet transfers for now
  // Bank/stash would need JSON update logic
  // _to is reserved for future implementation of bank/stash transfers
  if (from === 'wallet') {
    return `primary_currency_balance = primary_currency_balance - ${amount}`;
  }
  return `primary_currency_balance = primary_currency_balance + ${amount}`;
}

interface InventoryItem {
  itemId?: string;
  item_id?: string;
  quantity?: number;
  price?: number;
}

function enrichInventory(
  inventory: InventoryItem[],
  items: Record<string, unknown>,
  priceModifier: number
): Array<{
  itemId: string;
  quantity: number;
  price: number;
  item: unknown;
}> {
  return inventory.map((entry) => {
    const itemId = entry.itemId || entry.item_id || '';
    const item = items[itemId] as { base_price?: number } | undefined;
    const basePrice = item?.base_price || entry.price || 0;

    return {
      itemId,
      quantity: entry.quantity || 1,
      price: Math.ceil(basePrice * priceModifier),
      item: item || null,
    };
  });
}
