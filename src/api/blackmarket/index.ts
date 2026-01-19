/**
 * Surge Protocol - Black Market Routes
 *
 * Endpoints:
 *
 * Contacts:
 * - GET /blackmarket/contacts - List discovered black market contacts
 * - GET /blackmarket/contacts/:id - Get contact details
 * - GET /blackmarket/contacts/by-location/:locationId - Get contacts at location
 * - GET /blackmarket/contacts/by-specialization/:spec - Get contacts by specialization
 * - POST /blackmarket/contacts/:id/discover - Discover/unlock a contact
 * - POST /blackmarket/contacts/:id/build-trust - Build trust with a contact
 *
 * Inventory:
 * - GET /blackmarket/contacts/:id/inventory - Get contact's current inventory
 * - POST /blackmarket/contacts/:id/refresh-inventory - Force inventory refresh
 * - GET /blackmarket/inventory/:inventoryId - Get specific inventory details
 *
 * Transactions:
 * - POST /blackmarket/buy - Purchase item from black market
 * - POST /blackmarket/sell - Sell item to black market
 * - POST /blackmarket/service - Request a service
 * - GET /blackmarket/transactions - Get character's transaction history
 * - GET /blackmarket/transactions/:id - Get transaction details
 *
 * Heat & Risk:
 * - GET /blackmarket/heat - Get character's current heat level
 * - POST /blackmarket/heat/reduce - Attempt to reduce heat
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

interface BlackMarketContact {
  id: string;
  npc_id: string;
  location_id: string | null;
  contact_type: string;
  specialization: string | null;
  reliability_rating: number;
  danger_rating: number;
  discovery_method: string | null;
  required_tier: number;
  required_reputation: string | null;
  introduction_needed: number;
  introduction_npc_id: string | null;
  trust_threshold: number;
  inventory_tier_min: number;
  inventory_tier_max: number;
  specialization_items: string | null;
  has_prototype_access: number;
  has_corrupted_access: number;
  services_offered: string | null;
  installs_augments: number;
  install_quality_range: string | null;
  removes_tracking: number;
  fences_goods: number;
  fence_rate: number | null;
  base_price_modifier: number;
  accepts_alternative_payment: string | null;
  created_at: string;
  updated_at: string;
}

interface BlackMarketInventory {
  id: string;
  contact_id: string;
  generated_at: string;
  expires_at: string;
  seed: number | null;
  available_items: string | null;
  available_services: string | null;
  created_at: string;
  updated_at: string;
}

interface BlackMarketTransaction {
  id: string;
  character_id: string;
  contact_id: string;
  occurred_at: string;
  transaction_type: string;
  items_involved: string | null;
  services_rendered: string | null;
  total_price: number;
  payment_method: string;
  outcome: string;
  items_received: string | null;
  services_completed: string | null;
  complications: string | null;
  detected_by_corporate: number;
  detected_by_police: number;
  rating_penalty: number | null;
  heat_generated: number;
  trust_change: number;
  contact_satisfaction: number;
  future_discount_earned: number | null;
  created_at: string;
}

// Character's discovered contacts (join table)
interface CharacterContact {
  id: string;
  character_id: string;
  contact_id: string;
  discovered_at: string;
  discovery_method: string | null;
  trust_level: number;
  total_transactions: number;
  total_spent: number;
  last_transaction_at: string | null;
  is_hostile: number;
  heat_with_contact: number;
  notes: string | null;
}

// =============================================================================
// ROUTER SETUP
// =============================================================================

export const blackmarketRoutes = new Hono<{ Bindings: Bindings }>();

// =============================================================================
// CONTACT ENDPOINTS
// =============================================================================

/**
 * GET /blackmarket/contacts
 * List discovered black market contacts for character
 */
blackmarketRoutes.get('/contacts', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId query parameter is required' }]
    }, 400);
  }

  const db = c.env.DB;
  const { contact_type, specialization, min_trust, has_inventory } = c.req.query();

  let query = `
    SELECT
      bmc.*,
      cc.trust_level,
      cc.total_transactions,
      cc.total_spent,
      cc.last_transaction_at,
      cc.is_hostile,
      cc.heat_with_contact,
      cc.discovered_at,
      n.name as npc_name,
      n.title as npc_title,
      l.name as location_name
    FROM black_market_contacts bmc
    JOIN character_contacts cc ON cc.contact_id = bmc.id
    LEFT JOIN npcs n ON n.id = bmc.npc_id
    LEFT JOIN locations l ON l.id = bmc.location_id
    WHERE cc.character_id = ?
  `;
  const params: (string | number)[] = [characterId];

  if (contact_type) {
    query += ` AND bmc.contact_type = ?`;
    params.push(contact_type);
  }

  if (specialization) {
    query += ` AND bmc.specialization LIKE ?`;
    params.push(`%${specialization}%`);
  }

  if (min_trust) {
    query += ` AND cc.trust_level >= ?`;
    params.push(parseInt(min_trust, 10));
  }

  if (has_inventory === 'true') {
    query += ` AND EXISTS (
      SELECT 1 FROM black_market_inventories bmi
      WHERE bmi.contact_id = bmc.id
      AND bmi.expires_at > datetime('now')
    )`;
  }

  query += ` ORDER BY cc.trust_level DESC, bmc.reliability_rating DESC`;

  const results = await db.prepare(query).bind(...params).all<BlackMarketContact & CharacterContact>();

  return c.json({
    success: true,
    data: {
      contacts: results.results || [],
      count: results.results?.length || 0
    }
  });
});

/**
 * GET /blackmarket/contacts/by-location/:locationId
 * Get black market contacts at a specific location
 * NOTE: Must come before /contacts/:id to avoid route conflicts
 */
blackmarketRoutes.get('/contacts/by-location/:locationId', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId query parameter is required' }]
    }, 400);
  }

  const locationId = c.req.param('locationId');
  const db = c.env.DB;

  const results = await db.prepare(`
    SELECT
      bmc.*,
      cc.trust_level,
      cc.discovered_at,
      n.name as npc_name,
      n.title as npc_title
    FROM black_market_contacts bmc
    JOIN character_contacts cc ON cc.contact_id = bmc.id
    LEFT JOIN npcs n ON n.id = bmc.npc_id
    WHERE bmc.location_id = ? AND cc.character_id = ?
    ORDER BY cc.trust_level DESC
  `).bind(locationId, characterId).all<BlackMarketContact & CharacterContact>();

  return c.json({
    success: true,
    data: {
      location_id: locationId,
      contacts: results.results || [],
      count: results.results?.length || 0
    }
  });
});

/**
 * GET /blackmarket/contacts/by-specialization/:spec
 * Get contacts by specialization (weapons, augments, info, etc.)
 * NOTE: Must come before /contacts/:id to avoid route conflicts
 */
blackmarketRoutes.get('/contacts/by-specialization/:spec', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId query parameter is required' }]
    }, 400);
  }

  const spec = c.req.param('spec');
  const db = c.env.DB;

  const results = await db.prepare(`
    SELECT
      bmc.*,
      cc.trust_level,
      cc.discovered_at,
      n.name as npc_name,
      l.name as location_name
    FROM black_market_contacts bmc
    JOIN character_contacts cc ON cc.contact_id = bmc.id
    LEFT JOIN npcs n ON n.id = bmc.npc_id
    LEFT JOIN locations l ON l.id = bmc.location_id
    WHERE (bmc.specialization LIKE ? OR bmc.contact_type = ?)
    AND cc.character_id = ?
    ORDER BY bmc.reliability_rating DESC
  `).bind(`%${spec}%`, spec, characterId).all<BlackMarketContact & CharacterContact>();

  return c.json({
    success: true,
    data: {
      specialization: spec,
      contacts: results.results || [],
      count: results.results?.length || 0
    }
  });
});

/**
 * GET /blackmarket/contacts/:id
 * Get detailed contact information
 */
blackmarketRoutes.get('/contacts/:id', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId query parameter is required' }]
    }, 400);
  }

  const contactId = c.req.param('id');
  const db = c.env.DB;

  // Get contact with character's relationship
  const contact = await db.prepare(`
    SELECT
      bmc.*,
      cc.trust_level,
      cc.total_transactions,
      cc.total_spent,
      cc.last_transaction_at,
      cc.is_hostile,
      cc.heat_with_contact,
      cc.discovered_at,
      cc.notes,
      n.name as npc_name,
      n.title as npc_title,
      n.description as npc_description,
      n.portrait_asset,
      l.name as location_name,
      l.district
    FROM black_market_contacts bmc
    JOIN character_contacts cc ON cc.contact_id = bmc.id
    LEFT JOIN npcs n ON n.id = bmc.npc_id
    LEFT JOIN locations l ON l.id = bmc.location_id
    WHERE bmc.id = ? AND cc.character_id = ?
  `).bind(contactId, characterId).first<BlackMarketContact & CharacterContact>();

  if (!contact) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Contact not found or not discovered' }]
    }, 404);
  }

  // Get current inventory if available
  const inventory = await db.prepare(`
    SELECT id, expires_at, available_items, available_services
    FROM black_market_inventories
    WHERE contact_id = ? AND expires_at > datetime('now')
    ORDER BY generated_at DESC
    LIMIT 1
  `).bind(contactId).first<BlackMarketInventory>();

  // Parse JSON fields
  const response = {
    ...contact,
    specialization_items: contact.specialization_items ? JSON.parse(contact.specialization_items) : null,
    services_offered: contact.services_offered ? JSON.parse(contact.services_offered) : null,
    install_quality_range: contact.install_quality_range ? JSON.parse(contact.install_quality_range) : null,
    accepts_alternative_payment: contact.accepts_alternative_payment ? JSON.parse(contact.accepts_alternative_payment) : null,
    current_inventory: inventory ? {
      id: inventory.id,
      expires_at: inventory.expires_at,
      items: inventory.available_items ? JSON.parse(inventory.available_items) : [],
      services: inventory.available_services ? JSON.parse(inventory.available_services) : []
    } : null
  };

  return c.json({ success: true, data: { contact: response } });
});

/**
 * POST /blackmarket/contacts/:id/discover
 * Discover/unlock a black market contact
 */
blackmarketRoutes.post('/contacts/:id/discover', async (c) => {
  const contactId = c.req.param('id');
  const db = c.env.DB;
  const body = await c.req.json<{
    characterId: string;
    discovery_method?: string;
    introduction_from?: string;
  }>();

  if (!body.characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId is required' }]
    }, 400);
  }

  // Check if contact exists
  const contact = await db.prepare(`
    SELECT * FROM black_market_contacts WHERE id = ?
  `).bind(contactId).first<BlackMarketContact>();

  if (!contact) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Contact not found' }]
    }, 404);
  }

  // Check if already discovered
  const existing = await db.prepare(`
    SELECT id FROM character_contacts
    WHERE character_id = ? AND contact_id = ?
  `).bind(body.characterId, contactId).first();

  if (existing) {
    return c.json({
      success: false,
      errors: [{ code: 'ALREADY_DISCOVERED', message: 'Contact already discovered' }]
    }, 409);
  }

  // Check requirements
  if (contact.introduction_needed && !body.introduction_from) {
    return c.json({
      success: false,
      errors: [{ code: 'INTRODUCTION_REQUIRED', message: 'Introduction required' }],
      data: { required_from: contact.introduction_npc_id }
    }, 400);
  }

  // Create discovery record
  const discoveryId = crypto.randomUUID();
  await db.prepare(`
    INSERT INTO character_contacts (
      id, character_id, contact_id, discovered_at,
      discovery_method, trust_level, total_transactions,
      total_spent, is_hostile, heat_with_contact
    ) VALUES (?, ?, ?, datetime('now'), ?, 0, 0, 0, 0, 0)
  `).bind(
    discoveryId,
    body.characterId,
    contactId,
    body.discovery_method || 'UNKNOWN'
  ).run();

  return c.json({
    success: true,
    data: {
      message: 'Contact discovered',
      discovery_id: discoveryId,
      contact_id: contactId,
      contact_name: contact.specialization || contact.contact_type,
      trust_level: 0
    }
  }, 201);
});

/**
 * POST /blackmarket/contacts/:id/build-trust
 * Build trust with a contact (via gifts, favors, etc.)
 */
blackmarketRoutes.post('/contacts/:id/build-trust', async (c) => {
  const contactId = c.req.param('id');
  const db = c.env.DB;
  const body = await c.req.json<{
    characterId: string;
    method: 'gift' | 'favor' | 'information' | 'referral';
    value?: number;
    details?: string;
  }>();

  if (!body.characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId is required' }]
    }, 400);
  }

  // Get current relationship
  const relationship = await db.prepare(`
    SELECT * FROM character_contacts
    WHERE character_id = ? AND contact_id = ?
  `).bind(body.characterId, contactId).first<CharacterContact>();

  if (!relationship) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Contact not discovered' }]
    }, 404);
  }

  if (relationship.is_hostile) {
    return c.json({
      success: false,
      errors: [{ code: 'HOSTILE', message: 'Contact is hostile, cannot build trust' }]
    }, 400);
  }

  // Calculate trust gain based on method
  let trustGain = 0;
  switch (body.method) {
    case 'gift':
      trustGain = Math.min(10, Math.floor((body.value || 0) / 100));
      break;
    case 'favor':
      trustGain = 15;
      break;
    case 'information':
      trustGain = 10;
      break;
    case 'referral':
      trustGain = 20;
      break;
  }

  const newTrust = Math.min(100, relationship.trust_level + trustGain);

  await db.prepare(`
    UPDATE character_contacts
    SET trust_level = ?
    WHERE id = ?
  `).bind(newTrust, relationship.id).run();

  return c.json({
    success: true,
    data: {
      message: 'Trust increased',
      previous_trust: relationship.trust_level,
      trust_gained: trustGain,
      new_trust: newTrust,
      method: body.method
    }
  });
});

// =============================================================================
// INVENTORY ENDPOINTS
// =============================================================================

/**
 * GET /blackmarket/contacts/:id/inventory
 * Get a contact's current inventory
 */
blackmarketRoutes.get('/contacts/:id/inventory', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId query parameter is required' }]
    }, 400);
  }

  const contactId = c.req.param('id');
  const db = c.env.DB;

  // Verify character has discovered this contact
  const relationship = await db.prepare(`
    SELECT trust_level FROM character_contacts
    WHERE character_id = ? AND contact_id = ?
  `).bind(characterId, contactId).first<{ trust_level: number }>();

  if (!relationship) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Contact not discovered' }]
    }, 404);
  }

  // Get current inventory
  const inventory = await db.prepare(`
    SELECT * FROM black_market_inventories
    WHERE contact_id = ? AND expires_at > datetime('now')
    ORDER BY generated_at DESC
    LIMIT 1
  `).bind(contactId).first<BlackMarketInventory>();

  if (!inventory) {
    return c.json({
      success: true,
      data: {
        message: 'No current inventory available',
        contact_id: contactId,
        inventory: null
      }
    });
  }

  // Parse and filter items based on trust level
  const allItems = inventory.available_items ? JSON.parse(inventory.available_items) : [];
  const allServices = inventory.available_services ? JSON.parse(inventory.available_services) : [];

  // Higher trust = access to better items
  const trustTier = Math.floor(relationship.trust_level / 25) + 1; // 1-4 tiers

  return c.json({
    success: true,
    data: {
      inventory_id: inventory.id,
      contact_id: contactId,
      generated_at: inventory.generated_at,
      expires_at: inventory.expires_at,
      trust_tier: trustTier,
      items: allItems,
      services: allServices
    }
  });
});

/**
 * POST /blackmarket/contacts/:id/refresh-inventory
 * Force inventory refresh (may cost credits or time)
 */
blackmarketRoutes.post('/contacts/:id/refresh-inventory', async (c) => {
  const contactId = c.req.param('id');
  const db = c.env.DB;
  const body = await c.req.json<{ characterId: string }>();

  if (!body.characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId is required' }]
    }, 400);
  }

  // Verify access
  const relationship = await db.prepare(`
    SELECT trust_level FROM character_contacts
    WHERE character_id = ? AND contact_id = ?
  `).bind(body.characterId, contactId).first<{ trust_level: number }>();

  if (!relationship) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Contact not discovered' }]
    }, 404);
  }

  // Get contact info for inventory generation
  const contact = await db.prepare(`
    SELECT inventory_tier_min, inventory_tier_max, specialization_items,
           has_prototype_access, has_corrupted_access, services_offered
    FROM black_market_contacts WHERE id = ?
  `).bind(contactId).first<BlackMarketContact>();

  if (!contact) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Contact not found' }]
    }, 404);
  }

  // Generate new inventory
  const inventoryId = crypto.randomUUID();
  const seed = Math.floor(Math.random() * 1000000000);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

  // Placeholder inventory generation - would be more complex in practice
  const sampleItems = JSON.stringify([
    { item_id: 'sample-1', quantity: 1, price: 500, negotiable: true },
    { item_id: 'sample-2', quantity: 3, price: 200, negotiable: false }
  ]);

  await db.prepare(`
    INSERT INTO black_market_inventories (
      id, contact_id, generated_at, expires_at, seed,
      available_items, available_services, created_at, updated_at
    ) VALUES (?, ?, datetime('now'), ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(
    inventoryId,
    contactId,
    expiresAt,
    seed,
    sampleItems,
    contact.services_offered || '[]'
  ).run();

  return c.json({
    success: true,
    data: {
      message: 'Inventory refreshed',
      inventory_id: inventoryId,
      expires_at: expiresAt
    }
  }, 201);
});

/**
 * GET /blackmarket/inventory/:inventoryId
 * Get specific inventory details
 */
blackmarketRoutes.get('/inventory/:inventoryId', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId query parameter is required' }]
    }, 400);
  }

  const inventoryId = c.req.param('inventoryId');
  const db = c.env.DB;

  const inventory = await db.prepare(`
    SELECT bmi.*, bmc.specialization, bmc.contact_type
    FROM black_market_inventories bmi
    JOIN black_market_contacts bmc ON bmc.id = bmi.contact_id
    JOIN character_contacts cc ON cc.contact_id = bmc.id
    WHERE bmi.id = ? AND cc.character_id = ?
  `).bind(inventoryId, characterId).first<BlackMarketInventory & BlackMarketContact>();

  if (!inventory) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Inventory not found or not accessible' }]
    }, 404);
  }

  return c.json({
    success: true,
    data: {
      inventory: {
        ...inventory,
        available_items: inventory.available_items ? JSON.parse(inventory.available_items) : [],
        available_services: inventory.available_services ? JSON.parse(inventory.available_services) : []
      }
    }
  });
});

// =============================================================================
// TRANSACTION ENDPOINTS
// =============================================================================

/**
 * POST /blackmarket/buy
 * Purchase an item from the black market
 */
blackmarketRoutes.post('/buy', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<{
    characterId: string;
    contact_id: string;
    inventory_id: string;
    item_id: string;
    quantity: number;
    payment_method: string;
    haggle_attempt?: boolean;
  }>();

  if (!body.characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId is required' }]
    }, 400);
  }

  // Verify contact access
  const relationship = await db.prepare(`
    SELECT * FROM character_contacts
    WHERE character_id = ? AND contact_id = ?
  `).bind(body.characterId, body.contact_id).first<CharacterContact>();

  if (!relationship) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Contact not discovered' }]
    }, 404);
  }

  if (relationship.is_hostile) {
    return c.json({
      success: false,
      errors: [{ code: 'HOSTILE', message: 'Contact is hostile' }]
    }, 400);
  }

  // Get inventory and item
  const inventory = await db.prepare(`
    SELECT * FROM black_market_inventories
    WHERE id = ? AND contact_id = ? AND expires_at > datetime('now')
  `).bind(body.inventory_id, body.contact_id).first<BlackMarketInventory>();

  if (!inventory) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Inventory not available' }]
    }, 404);
  }

  // Simulate purchase - in reality would validate item, check funds, etc.
  const transactionId = crypto.randomUUID();
  const totalPrice = 1000 * body.quantity; // Placeholder price
  const heatGenerated = Math.floor(Math.random() * 10); // Random heat
  const detected = Math.random() < 0.05; // 5% detection chance

  await db.prepare(`
    INSERT INTO black_market_transactions (
      id, character_id, contact_id, occurred_at,
      transaction_type, items_involved, total_price,
      payment_method, outcome, items_received,
      detected_by_corporate, detected_by_police,
      heat_generated, trust_change, contact_satisfaction,
      created_at
    ) VALUES (?, ?, ?, datetime('now'), 'PURCHASE', ?, ?, ?, 'SUCCESS', ?, ?, ?, ?, 1, 80, datetime('now'))
  `).bind(
    transactionId,
    body.characterId,
    body.contact_id,
    JSON.stringify([{ item_id: body.item_id, quantity: body.quantity }]),
    totalPrice,
    body.payment_method || 'CREDITS_ANONYMOUS',
    JSON.stringify([{ item_id: body.item_id, quantity: body.quantity }]),
    detected ? 1 : 0,
    detected ? 1 : 0,
    heatGenerated
  ).run();

  // Update relationship stats
  const newTotalSpent = relationship.total_spent + totalPrice;
  const newTotalTransactions = relationship.total_transactions + 1;
  const newTrust = Math.min(100, relationship.trust_level + 1);

  await db.prepare(`
    UPDATE character_contacts
    SET total_spent = ?, total_transactions = ?,
        trust_level = ?, last_transaction_at = datetime('now')
    WHERE id = ?
  `).bind(newTotalSpent, newTotalTransactions, newTrust, relationship.id).run();

  return c.json({
    success: true,
    data: {
      transaction_id: transactionId,
      outcome: 'SUCCESS',
      items_received: [{ item_id: body.item_id, quantity: body.quantity }],
      total_price: totalPrice,
      heat_generated: heatGenerated,
      detected: detected,
      trust_change: 1
    }
  }, 201);
});

/**
 * POST /blackmarket/sell
 * Sell/fence items to black market
 */
blackmarketRoutes.post('/sell', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<{
    characterId: string;
    contact_id: string;
    items: Array<{ item_id: string; quantity: number }>;
    is_stolen?: boolean;
  }>();

  if (!body.characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId is required' }]
    }, 400);
  }

  // Verify contact access
  const relationship = await db.prepare(`
    SELECT cc.*, bmc.fences_goods, bmc.fence_rate, bmc.accepts_alternative_payment
    FROM character_contacts cc
    JOIN black_market_contacts bmc ON bmc.id = cc.contact_id
    WHERE cc.character_id = ? AND cc.contact_id = ?
  `).bind(body.characterId, body.contact_id).first<CharacterContact & BlackMarketContact>();

  if (!relationship) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Contact not discovered' }]
    }, 404);
  }

  if (!relationship.fences_goods) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_SUPPORTED', message: 'Contact does not fence goods' }]
    }, 400);
  }

  // Calculate sale price (with fence rate reduction)
  const baseValue = 500 * body.items.reduce((sum, i) => sum + i.quantity, 0);
  const fenceRate = relationship.fence_rate || 0.5;
  const totalPayment = Math.floor(baseValue * fenceRate);

  // Higher heat for stolen goods
  const heatGenerated = body.is_stolen ? 15 : 5;

  const transactionId = crypto.randomUUID();

  await db.prepare(`
    INSERT INTO black_market_transactions (
      id, character_id, contact_id, occurred_at,
      transaction_type, items_involved, total_price,
      payment_method, outcome,
      detected_by_corporate, detected_by_police,
      heat_generated, trust_change, contact_satisfaction,
      created_at
    ) VALUES (?, ?, ?, datetime('now'), 'SALE', ?, ?, 'CREDITS_ANONYMOUS', 'SUCCESS', 0, 0, ?, 1, 75, datetime('now'))
  `).bind(
    transactionId,
    body.characterId,
    body.contact_id,
    JSON.stringify(body.items),
    totalPayment,
    heatGenerated
  ).run();

  return c.json({
    success: true,
    data: {
      transaction_id: transactionId,
      outcome: 'SUCCESS',
      items_sold: body.items,
      payment_received: totalPayment,
      fence_rate: fenceRate,
      heat_generated: heatGenerated
    }
  }, 201);
});

/**
 * POST /blackmarket/service
 * Request a service (augment installation, tracking removal, etc.)
 */
blackmarketRoutes.post('/service', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<{
    characterId: string;
    contact_id: string;
    service_type: string;
    target_item_id?: string;
    payment_method?: string;
  }>();

  if (!body.characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId is required' }]
    }, 400);
  }

  // Verify contact and service availability
  const contact = await db.prepare(`
    SELECT bmc.*, cc.trust_level
    FROM black_market_contacts bmc
    JOIN character_contacts cc ON cc.contact_id = bmc.id
    WHERE bmc.id = ? AND cc.character_id = ?
  `).bind(body.contact_id, body.characterId).first<BlackMarketContact & { trust_level: number }>();

  if (!contact) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Contact not discovered' }]
    }, 404);
  }

  // Check if service is offered
  const services = contact.services_offered ? JSON.parse(contact.services_offered) : [];
  const serviceOffered = services.includes(body.service_type);

  if (!serviceOffered) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_SUPPORTED', message: 'Service not offered by this contact' }]
    }, 400);
  }

  // Check trust requirements for certain services
  const highTrustServices = ['INSTALL_PROTOTYPE', 'REMOVE_TRACKING', 'IDENTITY_CHANGE'];
  if (highTrustServices.includes(body.service_type) && contact.trust_level < 50) {
    return c.json({
      success: false,
      errors: [{ code: 'INSUFFICIENT_TRUST', message: 'Insufficient trust level for this service' }]
    }, 403);
  }

  // Calculate service outcome
  const servicePrice = 2000; // Placeholder
  const qualityRoll = Math.random();
  const outcome = qualityRoll > 0.1 ? 'SUCCESS' : 'COMPLICATION';

  const transactionId = crypto.randomUUID();

  await db.prepare(`
    INSERT INTO black_market_transactions (
      id, character_id, contact_id, occurred_at,
      transaction_type, services_rendered, total_price,
      payment_method, outcome, services_completed, complications,
      detected_by_corporate, detected_by_police,
      heat_generated, trust_change, contact_satisfaction,
      created_at
    ) VALUES (?, ?, ?, datetime('now'), 'SERVICE', ?, ?, ?, ?, ?, ?, 0, 0, 5, 2, 85, datetime('now'))
  `).bind(
    transactionId,
    body.characterId,
    body.contact_id,
    JSON.stringify([{ type: body.service_type, target: body.target_item_id }]),
    servicePrice,
    body.payment_method || 'CREDITS_ANONYMOUS',
    outcome,
    outcome === 'SUCCESS' ? JSON.stringify([body.service_type]) : null,
    outcome === 'COMPLICATION' ? JSON.stringify(['Minor issue during service']) : null
  ).run();

  return c.json({
    success: true,
    data: {
      transaction_id: transactionId,
      service_type: body.service_type,
      outcome: outcome,
      price: servicePrice,
      complications: outcome === 'COMPLICATION' ? ['Minor issue during service'] : null
    }
  }, 201);
});

/**
 * GET /blackmarket/transactions
 * Get character's transaction history
 */
blackmarketRoutes.get('/transactions', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId query parameter is required' }]
    }, 400);
  }

  const db = c.env.DB;
  const { contact_id, transaction_type, limit, offset } = c.req.query();

  let query = `
    SELECT
      bmt.*,
      bmc.specialization as contact_specialization,
      n.name as contact_name
    FROM black_market_transactions bmt
    JOIN black_market_contacts bmc ON bmc.id = bmt.contact_id
    LEFT JOIN npcs n ON n.id = bmc.npc_id
    WHERE bmt.character_id = ?
  `;
  const params: (string | number)[] = [characterId];

  if (contact_id) {
    query += ` AND bmt.contact_id = ?`;
    params.push(contact_id);
  }

  if (transaction_type) {
    query += ` AND bmt.transaction_type = ?`;
    params.push(transaction_type);
  }

  query += ` ORDER BY bmt.occurred_at DESC`;
  query += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(limit || '50', 10));
  params.push(parseInt(offset || '0', 10));

  const results = await db.prepare(query).bind(...params).all<BlackMarketTransaction>();

  return c.json({
    success: true,
    data: {
      transactions: results.results || [],
      count: results.results?.length || 0
    }
  });
});

/**
 * GET /blackmarket/transactions/:id
 * Get transaction details
 */
blackmarketRoutes.get('/transactions/:id', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId query parameter is required' }]
    }, 400);
  }

  const transactionId = c.req.param('id');
  const db = c.env.DB;

  const transaction = await db.prepare(`
    SELECT
      bmt.*,
      bmc.specialization as contact_specialization,
      bmc.contact_type,
      n.name as contact_name,
      l.name as location_name
    FROM black_market_transactions bmt
    JOIN black_market_contacts bmc ON bmc.id = bmt.contact_id
    LEFT JOIN npcs n ON n.id = bmc.npc_id
    LEFT JOIN locations l ON l.id = bmc.location_id
    WHERE bmt.id = ? AND bmt.character_id = ?
  `).bind(transactionId, characterId).first<BlackMarketTransaction>();

  if (!transaction) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Transaction not found' }]
    }, 404);
  }

  return c.json({
    success: true,
    data: {
      transaction: {
        ...transaction,
        items_involved: transaction.items_involved ? JSON.parse(transaction.items_involved) : null,
        services_rendered: transaction.services_rendered ? JSON.parse(transaction.services_rendered) : null,
        items_received: transaction.items_received ? JSON.parse(transaction.items_received) : null,
        services_completed: transaction.services_completed ? JSON.parse(transaction.services_completed) : null,
        complications: transaction.complications ? JSON.parse(transaction.complications) : null
      }
    }
  });
});

// =============================================================================
// HEAT & RISK ENDPOINTS
// =============================================================================

/**
 * GET /blackmarket/heat
 * Get character's current black market heat level
 */
blackmarketRoutes.get('/heat', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId query parameter is required' }]
    }, 400);
  }

  const db = c.env.DB;

  // Calculate heat from recent transactions
  const heatData = await db.prepare(`
    SELECT
      SUM(heat_generated) as total_heat,
      SUM(CASE WHEN detected_by_corporate = 1 THEN 1 ELSE 0 END) as corporate_detections,
      SUM(CASE WHEN detected_by_police = 1 THEN 1 ELSE 0 END) as police_detections,
      COUNT(*) as total_transactions
    FROM black_market_transactions
    WHERE character_id = ?
    AND occurred_at > datetime('now', '-7 days')
  `).bind(characterId).first<{
    total_heat: number | null;
    corporate_detections: number | null;
    police_detections: number | null;
    total_transactions: number;
  }>();

  // Get heat with individual contacts
  const contactHeat = await db.prepare(`
    SELECT
      cc.contact_id,
      cc.heat_with_contact,
      n.name as contact_name,
      bmc.specialization
    FROM character_contacts cc
    JOIN black_market_contacts bmc ON bmc.id = cc.contact_id
    LEFT JOIN npcs n ON n.id = bmc.npc_id
    WHERE cc.character_id = ? AND cc.heat_with_contact > 0
    ORDER BY cc.heat_with_contact DESC
  `).bind(characterId).all();

  const totalHeat = heatData?.total_heat || 0;
  let heatLevel: string;
  if (totalHeat < 20) heatLevel = 'LOW';
  else if (totalHeat < 50) heatLevel = 'MODERATE';
  else if (totalHeat < 80) heatLevel = 'HIGH';
  else heatLevel = 'CRITICAL';

  return c.json({
    success: true,
    data: {
      heat_level: heatLevel,
      total_heat: totalHeat,
      corporate_detections: heatData?.corporate_detections || 0,
      police_detections: heatData?.police_detections || 0,
      recent_transactions: heatData?.total_transactions || 0,
      contact_heat: contactHeat.results || [],
      decay_rate: 5, // Heat decays 5 points per day
      estimated_clear_days: Math.ceil(totalHeat / 5)
    }
  });
});

/**
 * POST /blackmarket/heat/reduce
 * Attempt to reduce heat (lay low, bribe, etc.)
 */
blackmarketRoutes.post('/heat/reduce', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<{
    characterId: string;
    method: 'lay_low' | 'bribe' | 'relocate' | 'false_trail';
    credits_spent?: number;
    target_contact_id?: string;
  }>();

  if (!body.characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId is required' }]
    }, 400);
  }

  let heatReduction = 0;
  let cost = 0;
  let time_required = 0;
  let success = true;

  switch (body.method) {
    case 'lay_low':
      heatReduction = 10;
      time_required = 24; // hours
      break;
    case 'bribe':
      cost = body.credits_spent || 1000;
      heatReduction = Math.floor(cost / 100);
      success = Math.random() > 0.1; // 90% success
      break;
    case 'relocate':
      heatReduction = 25;
      cost = 500;
      time_required = 12;
      break;
    case 'false_trail':
      heatReduction = 20;
      cost = 2000;
      success = Math.random() > 0.2; // 80% success
      break;
  }

  if (!success) {
    // Failed attempt increases heat
    heatReduction = -10;
  }

  // If targeting a specific contact, reduce that relationship's heat
  if (body.target_contact_id) {
    await db.prepare(`
      UPDATE character_contacts
      SET heat_with_contact = MAX(0, heat_with_contact - ?)
      WHERE character_id = ? AND contact_id = ?
    `).bind(heatReduction, body.characterId, body.target_contact_id).run();
  }

  return c.json({
    success: true,
    data: {
      operation_success: success,
      method: body.method,
      heat_change: success ? -heatReduction : 10,
      cost: cost,
      time_required_hours: time_required,
      message: success
        ? `Successfully reduced heat by ${heatReduction} points`
        : 'Attempt failed! Heat increased by 10 points'
    }
  });
});
