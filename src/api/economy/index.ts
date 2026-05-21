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
// import { nanoid } from 'nanoid';
import {
  authMiddleware,
  requireCharacterMiddleware,
  type AuthVariables,
} from '../../middleware/auth';
import { EconomyService } from '../../services/economy';
import type { D1Database, KVNamespace } from '@cloudflare/workers-types';

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

type Variables = AuthVariables & {
  characterId: string;
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
  const service = new EconomyService(c.env.DB);
  const currencies = await service.listCurrencies();

  return c.json({
    success: true,
    data: {
      currencies,
    },
  });
});

/**
 * GET /economy/currencies/:code
 * Get details for a specific currency.
 */
economyRoutes.get('/currencies/:code', async (c) => {
  const code = c.req.param('code');
  const service = new EconomyService(c.env.DB);
  const currency = await service.getCurrency(code!);

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
  const service = new EconomyService(c.env.DB);
  const balances = await service.getFormattedBalances(characterId!);

  return c.json({
    success: true,
    data: balances,
  });
});

/**
 * GET /economy/transactions
 * Get transaction history for the character.
 */
economyRoutes.get('/transactions', requireCharacterMiddleware(), zValidator('query', paginationSchema), async (c) => {
  const characterId = c.get('characterId');
  const { limit, offset } = c.req.valid('query');
  const service = new EconomyService(c.env.DB);

  const { transactions, total } = await service.listTransactions(characterId!, limit, offset);

  return c.json({
    success: true,
    data: {
      transactions,
      pagination: {
        limit,
        offset,
        total,
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
  const { amount, fromAccount, toAccount, description, currencyId } = c.req.valid('json');
  const service = new EconomyService(c.env.DB);

  try {
    await service.transferFunds({
      characterId: characterId!,
      amount,
      fromAccount: fromAccount as any,
      toAccount: toAccount as any,
      description,
      currencyCode: currencyId
    });

    return c.json({
      success: true,
      data: {
        amount,
        from: fromAccount,
        to: toAccount,
        message: `Transferred ${amount} units from ${fromAccount} to ${toAccount}`,
      },
    });
  } catch (e: any) {
    return c.json({
      success: false,
      errors: [{ code: 'TRANSFER_FAILED', message: e.message }],
    }, 400);
  }
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
  const service = new EconomyService(c.env.DB);

  // Get character's current location to prioritize nearby vendors if possible
  const character = await c.env.DB
    .prepare('SELECT current_location_id FROM characters WHERE id = ?')
    .bind(characterId)
    .first<{ current_location_id: string }>();

  const vendors = await service.listVendors(character?.current_location_id || null);

  return c.json({
    success: true,
    data: {
      vendors,
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
  const service = new EconomyService(c.env.DB);

  // Get character tier for requirement check
  const character = await c.env.DB
    .prepare('SELECT carrier_tier FROM characters WHERE id = ?')
    .bind(characterId)
    .first<{ carrier_tier: number }>();

  try {
    const details = await service.getVendorDetails(vendorId!, character?.carrier_tier || 1);

    if (!details) {
      return c.json({
        success: false,
        errors: [{ code: 'NOT_FOUND', message: 'Vendor not found' }],
      }, 404);
    }

    return c.json({
      success: true,
      data: details,
    });
  } catch (e: any) {
    return c.json({
      success: false,
      errors: [{ code: 'HIERARCHY_ERROR', message: e.message }],
    }, 403);
  }
});

/**
 * POST /economy/vendors/:id/buy
 * Purchase an item from a vendor.
 */
economyRoutes.post('/vendors/:id/buy', requireCharacterMiddleware(), zValidator('json', buySchema), async (c) => {
  const vendorId = c.req.param('id');
  const characterId = c.get('characterId');
  const { itemId, quantity, paymentMethod } = c.req.valid('json');
  const service = new EconomyService(c.env.DB);

  try {
    const result = await service.buyItem({
      characterId: characterId!,
      vendorId: vendorId!,
      itemId,
      quantity,
      paymentMethod
    });

    return c.json({
      success: true,
      data: result,
    });
  } catch (e: any) {
    return c.json({
      success: false,
      errors: [{ code: 'BUY_FAILED', message: e.message }],
    }, 400);
  }
});

/**
 * POST /economy/vendors/:id/sell
 * Sell an item to a vendor.
 */
economyRoutes.post('/vendors/:id/sell', requireCharacterMiddleware(), zValidator('json', sellSchema), async (c) => {
  const vendorId = c.req.param('id');
  const characterId = c.get('characterId');
  const { inventoryItemId, quantity } = c.req.valid('json');
  const service = new EconomyService(c.env.DB);

  try {
    const result = await service.sellItem({
      characterId: characterId!,
      vendorId: vendorId!,
      inventoryItemId,
      quantity
    });

    return c.json({
      success: true,
      data: result,
    });
  } catch (e: any) {
    return c.json({
      success: false,
      errors: [{ code: 'SELL_FAILED', message: e.message }],
    }, 400);
  }
});

/**
 * POST /economy/vendors/:id/haggle
 * Attempt to negotiate a better price.
 */
economyRoutes.post('/vendors/:id/haggle', requireCharacterMiddleware(), zValidator('json', haggleSchema), async (c) => {
  const vendorId = c.req.param('id');
  const characterId = c.get('characterId');
  const { itemId, action, proposedPrice } = c.req.valid('json');
  const service = new EconomyService(c.env.DB);

  const result = await service.haggle({
    characterId: characterId!,
    vendorId: vendorId!,
    itemId,
    action,
    proposedPrice
  });

  return c.json({
    success: true,
    data: result,
  });
});
