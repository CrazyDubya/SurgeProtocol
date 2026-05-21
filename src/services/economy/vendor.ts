/**
 * Surge Protocol - Vendor Service
 *
 * Handles vendor interactions:
 * - Vendor inventory management
 * - Price calculation with reputation modifiers
 * - Buy/sell operations
 * - Haggle system
 */

import { CharacterService, type ServiceContext, ErrorCodes } from '../base';


// =============================================================================
// TYPES
// =============================================================================

export interface VendorInfo {
  id: string;
  vendor_type: string;
  specialization: string;
  buy_price_modifier: number;
  sell_price_modifier: number;
  haggle_difficulty: number;
  quality_tier_min: number;
  quality_tier_max: number;
  accepts_stolen: boolean;
  accepts_contraband: boolean;
  reputation_required: number | null;
  tier_required: number;
  npc?: {
    id: string;
    name: string;
    occupation: string;
    greeting: string | null;
  } | null;
  location?: {
    id: string;
    name: string;
  } | null;
}

export interface VendorInventoryItem {
  itemId: string;
  quantity: number;
  price: number;
  item: ItemDefinition | null;
}

export interface ItemDefinition {
  id: string;
  code: string;
  name: string;
  description: string | null;
  item_type: string;
  rarity: string;
  base_price: number;
  weight: number;
  is_stolen?: boolean;
  is_contraband?: boolean;
}

export interface HaggleResult {
  success: boolean;
  result: 'SUCCESS' | 'FAILURE' | 'CRITICAL_FAILURE';
  roll: {
    dice: number;
    modifier: number;
    total: number;
    target: number;
  };
  prices: {
    original: number;
    proposed: number;
    final: number;
    discount: number;
  };
  vendorReaction: string;
}

export interface BuyResult {
  transactionId: string;
  inventoryId: string;
  item: {
    id: string;
    name: string;
    quantity: number;
  };
  price: {
    unitPrice: number;
    quantity: number;
    total: number;
  };
}

export interface SellResult {
  transactionId: string;
  item: {
    id: string;
    name: string;
    quantity: number;
  };
  price: {
    unitPrice: number;
    quantity: number;
    total: number;
  };
}

// =============================================================================
// VENDOR SERVICE
// =============================================================================

export class VendorService extends CharacterService {
  constructor(context: ServiceContext) {
    super(context);
    if (!this.cache) {
      throw new Error('CACHE binding is required for VendorService');
    }
  }

  /**
   * Check and restock vendor inventory if needed.
   */
  async checkAndRestock(vendorId: string) {
    const vendor = await this.db.prepare(`
          SELECT id, last_restock, restock_frequency_hours 
          FROM vendor_inventories 
          WHERE id = ?
      `).bind(vendorId).first<{ id: string, last_restock: string, restock_frequency_hours: number }>();

    if (!vendor) return;

    const lastRestock = new Date(vendor.last_restock || 0);
    const now = new Date();
    const nextRestock = new Date(lastRestock.getTime() + (vendor.restock_frequency_hours * 60 * 60 * 1000));

    if (now >= nextRestock) {
      // Update timestamp first to prevent concurrent re-runs (simple lock)
      const nowIso = now.toISOString();
      await this.db.prepare(`
              UPDATE vendor_inventories 
              SET last_restock = ?, updated_at = ? 
              WHERE id = ?
          `).bind(nowIso, nowIso, vendorId).run();

      await this.generateVendorStock(vendorId);
    }
  }

  /**
   * Get vendor by ID with NPC and location info.
   */
  async getVendor(vendorId: string): Promise<VendorInfo | null> {
    // Trigger restock check
    await this.checkAndRestock(vendorId);

    const vendor = await this.query<Record<string, unknown>>(
      `SELECT
        vi.*,
        n.id as npc_id, n.name as npc_name, n.occupation, n.dialogue_greeting,
        l.id as location_id, l.name as location_name
       FROM vendor_inventories vi
       LEFT JOIN npc_definitions n ON vi.vendor_npc_id = n.id
       LEFT JOIN locations l ON vi.location_id = l.id
       WHERE vi.id = ?`,
      vendorId
    );

    if (!vendor) return null;

    return {
      id: vendor.id as string,
      vendor_type: vendor.vendor_type as string,
      specialization: vendor.specialization as string,
      buy_price_modifier: (vendor.buy_price_modifier as number) || 1.0,
      sell_price_modifier: (vendor.sell_price_modifier as number) || 0.5,
      haggle_difficulty: (vendor.haggle_difficulty as number) || 5,
      quality_tier_min: (vendor.quality_tier_min as number) || 1,
      quality_tier_max: (vendor.quality_tier_max as number) || 10,
      accepts_stolen: vendor.accepts_stolen === 1,
      accepts_contraband: vendor.accepts_contraband === 1,
      reputation_required: vendor.reputation_required as number | null,
      tier_required: (vendor.tier_required as number) || 1,
      npc: vendor.npc_id
        ? {
          id: vendor.npc_id as string,
          name: vendor.npc_name as string,
          occupation: vendor.occupation as string,
          greeting: vendor.dialogue_greeting as string | null,
        }
        : null,
      location: vendor.location_id
        ? {
          id: vendor.location_id as string,
          name: vendor.location_name as string,
        }
        : null,
    };
  }

  /**
   * Check if character meets vendor requirements.
   */
  async checkVendorAccess(vendor: VendorInfo): Promise<{
    hasAccess: boolean;
    reason?: string;
  }> {
    const character = await this.getCharacter();

    if (character.tier < vendor.tier_required) {
      return {
        hasAccess: false,
        reason: `Requires Tier ${vendor.tier_required} (you are Tier ${character.tier})`,
      };
    }

    // Could add reputation checks here
    return { hasAccess: true };
  }

  /**
   * Calculate purchase price with modifiers.
   */
  calculateBuyPrice(
    basePrice: number,
    buyModifier: number,
    quantity: number = 1
  ): number {
    return Math.ceil(basePrice * buyModifier * quantity);
  }

  /**
   * Calculate sell price with modifiers.
   */
  calculateSellPrice(
    basePrice: number,
    sellModifier: number,
    quantity: number = 1
  ): number {
    return Math.floor(basePrice * sellModifier * quantity);
  }

  /**
   * Get item definition by ID.
   */
  async getItem(itemId: string): Promise<ItemDefinition | null> {
    return this.query<ItemDefinition>(
      `SELECT id, code, name, description, item_type, rarity, base_price, weight
       FROM item_definitions WHERE id = ?`,
      itemId
    );
  }

  /**
   * Generate stock for a vendor based on their specialization and tier.
   */
  async generateVendorStock(vendorId: string): Promise<void> {
    const vendor = await this.getVendor(vendorId);
    if (!vendor) return;

    // 1. Clear existing non-persistent stock (for now, clear all)
    await this.execute('DELETE FROM vendor_items WHERE vendor_id = ?', vendorId);

    // 2. Determine limits
    const minTier = vendor.quality_tier_min;
    const maxTier = vendor.quality_tier_max;
    // Map specialization to item_type or other filters
    let typeFilter = '';
    const params: any[] = [];

    // Basic mapping covering common specializations
    // valid item_types: WEAPON, ARMOR, AUGMENT, CONSUMABLE, KEY_ITEM, JUNK, CURRENCY
    switch (vendor.specialization) {
      case 'WEAPONS':
        typeFilter = 'item_type = ?'; // WEAPON
        params.push('WEAPON');
        break;
      case 'ARMOR':
        typeFilter = 'item_type = ?'; // ARMOR
        params.push('ARMOR');
        break;
      case 'MEDICAL':
        typeFilter = 'item_type = ? AND item_subtype = ?'; // CONSUMABLE, MEDICAL
        params.push('CONSUMABLE', 'MEDICAL');
        break;
      case 'FOOD':
        typeFilter = 'item_type = ? AND item_subtype = ?'; // CONSUMABLE, FOOD
        params.push('CONSUMABLE', 'FOOD');
        break;
      case 'ELECTRONICS':
        typeFilter = 'item_type = ?'; // JUNK (often electronics) or KEY_ITEM? 
        // For now, let's assume specific subtypes or just JUNK
        params.push('JUNK');
        break;
      case 'GENERAL':
      default:
        // No specific filter, maybe exclude key items
        typeFilter = 'item_type != ?';
        params.push('KEY_ITEM');
        break;
    }

    // 3. fetch potential items
    // Dynamic query construction
    const items = await this.queryAll<{ id: string; base_price: number }>(
      `SELECT id, base_price FROM item_definitions 
       WHERE tier >= ? AND tier <= ? 
       AND ${typeFilter}
       ORDER BY RANDOM() LIMIT 20`, // Limit stock count
      minTier, maxTier, ...params
    );

    if (!items || items.length === 0) return;

    // 4. Insert into vendor_items
    const stmt = this.db.prepare(`
      INSERT INTO vendor_items (id, vendor_id, item_definition_id, quantity, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);

    const batch = items.map(item => {
      const qty = Math.floor(Math.random() * 5) + 1; // 1-5 items
      return stmt.bind(crypto.randomUUID(), vendorId, item.id, qty);
    });

    await this.db.batch(batch);
  }

  /**
   * Purchase an item from a vendor.
   */
  async buyItem(params: {
    vendorId: string;
    itemId: string;
    quantity: number;
    paymentMethod: 'wallet' | 'bank' | 'credit';
  }): Promise<BuyResult> {
    const { vendorId, itemId, quantity, paymentMethod } = params;

    // Get vendor
    const vendor = await this.getVendor(vendorId);
    if (!vendor) {
      this.throw(ErrorCodes.NOT_FOUND, 'Vendor not found', 404);
    }

    // Check access
    const access = await this.checkVendorAccess(vendor);
    if (!access.hasAccess) {
      this.throw(ErrorCodes.FORBIDDEN, access.reason || 'Access denied', 403);
    }

    // Check Vendor Stock
    const stock = await this.query<{ id: string; quantity: number; price_override: number | null }>(
      'SELECT id, quantity, price_override FROM vendor_items WHERE vendor_id = ? AND item_definition_id = ?',
      vendorId, itemId
    );

    if (!stock || stock.quantity < quantity) {
      this.throw(ErrorCodes.VALIDATION_ERROR, `Vendor is out of stock. Available: ${stock?.quantity || 0}`);
    }

    // Get item definition
    const item = await this.getItem(itemId);
    if (!item) {
      this.throw(ErrorCodes.NOT_FOUND, 'Item definition not found', 404);
    }

    // Calculate price
    // Use override if present, else calc
    let unitPrice = 0;
    if (stock.price_override) {
      unitPrice = stock.price_override;
    } else {
      unitPrice = this.calculateBuyPrice(item.base_price, vendor.buy_price_modifier, 1);
    }
    const totalPrice = unitPrice * quantity;

    // Check funds
    const finances = await this.query<{
      primary_currency_balance: number;
      credit_limit: number;
      credit_utilized: number;
    }>('SELECT * FROM character_finances WHERE character_id = ?', this.requiredCharacterId);

    if (!finances) {
      this.throw(ErrorCodes.INTERNAL_ERROR, 'Character finances not initialized');
    }

    if (paymentMethod === 'credit') {
      const creditAvailable = finances.credit_limit - finances.credit_utilized;
      if (totalPrice > creditAvailable) {
        this.throw(
          ErrorCodes.VALIDATION_ERROR,
          `Insufficient credit. Available: ${creditAvailable}, Needed: ${totalPrice}`
        );
      }
    } else {
      if (finances.primary_currency_balance < totalPrice) {
        this.throw(
          ErrorCodes.VALIDATION_ERROR,
          `Insufficient funds. Available: ${finances.primary_currency_balance}, Needed: ${totalPrice}`
        );
      }
    }

    // Deduct payment
    if (paymentMethod === 'credit') {
      await this.execute(
        `UPDATE character_finances SET
          credit_utilized = credit_utilized + ?,
          total_spent_career = total_spent_career + ?,
          updated_at = datetime('now')
         WHERE character_id = ?`,
        totalPrice,
        totalPrice,
        this.requiredCharacterId
      );
    } else {
      await this.execute(
        `UPDATE character_finances SET
          primary_currency_balance = primary_currency_balance - ?,
          total_spent_career = total_spent_career + ?,
          updated_at = datetime('now')
         WHERE character_id = ?`,
        totalPrice,
        totalPrice,
        this.requiredCharacterId
      );
    }

    // Add item to inventory
    const inventoryId = crypto.randomUUID();
    await this.execute(
      `INSERT INTO character_inventory
        (id, character_id, item_definition_id, quantity, equipped, acquired_from, acquired_at)
       VALUES (?, ?, ?, ?, 0, 'VENDOR', datetime('now'))`,
      inventoryId,
      this.requiredCharacterId,
      itemId,
      quantity
    );

    // Reduce Vendor Stock
    if (stock.quantity === quantity) {
      await this.execute('DELETE FROM vendor_items WHERE id = ?', stock.id);
    } else {
      await this.execute('UPDATE vendor_items SET quantity = quantity - ? WHERE id = ?', quantity, stock.id);
    }

    // Record transaction
    const transactionId = crypto.randomUUID();
    await this.execute(
      `INSERT INTO financial_transactions
        (id, character_id, transaction_type, amount, is_income,
         source_type, source_name, destination_type, destination_name,
         description, category, related_item_id, is_legal, traceable)
       VALUES (?, ?, 'PURCHASE', ?, 0, 'CHARACTER', ?, 'VENDOR', ?, ?, 'SHOPPING', ?, 1, 1)`,
      transactionId,
      this.requiredCharacterId,
      totalPrice,
      paymentMethod,
      vendor.npc?.id || vendorId,
      `Purchased ${quantity}x ${item.name}`,
      itemId
    );

    return {
      transactionId,
      inventoryId,
      item: {
        id: item.id,
        name: item.name,
        quantity,
      },
      price: {
        unitPrice,
        quantity,
        total: totalPrice,
      },
    };
  }

  /**
   * Sell an item to a vendor.
   */
  async sellItem(params: {
    vendorId: string;
    inventoryItemId: string;
    quantity: number;
  }): Promise<SellResult> {
    const { vendorId, inventoryItemId, quantity } = params;

    // Get vendor
    const vendor = await this.getVendor(vendorId);
    if (!vendor) {
      this.throw(ErrorCodes.NOT_FOUND, 'Vendor not found', 404);
    }

    // Get inventory item
    const inventoryItem = await this.query<{
      id: string;
      item_definition_id: string;
      quantity: number;
      base_price: number;
      item_name: string;
      is_stolen: number;
      is_contraband: number;
    }>(
      `SELECT ci.*, id.base_price, id.name as item_name, id.is_stolen, id.is_contraband
       FROM character_inventory ci
       JOIN item_definitions id ON ci.item_definition_id = id.id
       WHERE ci.id = ? AND ci.character_id = ?`,
      inventoryItemId,
      this.requiredCharacterId
    );

    if (!inventoryItem) {
      this.throw(ErrorCodes.NOT_FOUND, 'Item not in inventory', 404);
    }

    if (inventoryItem.quantity < quantity) {
      this.throw(
        ErrorCodes.VALIDATION_ERROR,
        `Not enough items. Have: ${inventoryItem.quantity}, Trying to sell: ${quantity}`
      );
    }

    // Check vendor restrictions
    if (inventoryItem.is_stolen && !vendor.accepts_stolen) {
      this.throw(ErrorCodes.FORBIDDEN, 'Vendor does not accept stolen goods');
    }

    if (inventoryItem.is_contraband && !vendor.accepts_contraband) {
      this.throw(ErrorCodes.FORBIDDEN, 'Vendor does not accept contraband');
    }

    // Calculate price
    const totalPrice = this.calculateSellPrice(
      inventoryItem.base_price,
      vendor.sell_price_modifier,
      quantity
    );

    // Update or remove inventory item
    if (inventoryItem.quantity === quantity) {
      await this.execute(
        'DELETE FROM character_inventory WHERE id = ?',
        inventoryItemId
      );
    } else {
      await this.execute(
        'UPDATE character_inventory SET quantity = quantity - ? WHERE id = ?',
        quantity,
        inventoryItemId
      );
    }

    // Add payment
    await this.execute(
      `UPDATE character_finances SET
        primary_currency_balance = primary_currency_balance + ?,
        total_earned_career = total_earned_career + ?,
        updated_at = datetime('now')
       WHERE character_id = ?`,
      totalPrice,
      totalPrice,
      this.requiredCharacterId
    );

    // Record transaction
    const transactionId = crypto.randomUUID();
    await this.execute(
      `INSERT INTO financial_transactions
        (id, character_id, transaction_type, amount, is_income,
         source_type, source_name, destination_type, destination_name,
         description, category, related_item_id, is_legal, traceable)
       VALUES (?, ?, 'SALE', ?, 1, 'VENDOR', ?, 'CHARACTER', 'Wallet', ?, 'SHOPPING', ?, 1, 1)`,
      transactionId,
      this.requiredCharacterId,
      totalPrice,
      vendor.npc?.id || vendorId,
      `Sold ${quantity}x ${inventoryItem.item_name}`,
      inventoryItem.item_definition_id
    );

    // Black Market / Heat Logic
    if (inventoryItem.is_contraband || inventoryItem.is_stolen) {
      await this.processBlackMarketTransaction(
        transactionId,
        this.requiredCharacterId,
        vendorId,
        totalPrice,
        inventoryItem.is_contraband ? 25 : 10 // Base heat: 25 for contraband, 10 for stolen
      );
    }

    return {
      transactionId,
      item: {
        id: inventoryItem.item_definition_id,
        name: inventoryItem.item_name,
        quantity,
      },
      price: {
        unitPrice: this.calculateSellPrice(
          inventoryItem.base_price,
          vendor.sell_price_modifier,
          1
        ),
        quantity,
        total: totalPrice,
      },
    };
  }

  /**
   * Process a black market transaction to generate heat/risk
   */
  private async processBlackMarketTransaction(
    transactionId: string,
    characterId: string,
    vendorId: string,
    amount: number,
    baseHeat: number
  ) {
    // 1. Calculate Heat generated
    // Heat scales with amount (e.g. 1 heat per 1000 creds) + base base
    const valueHeat = Math.floor(amount / 1000);
    const totalHeat = baseHeat + valueHeat;

    // 2. Record simulated Black Market Transaction
    // (This matches the advanced schema table `black_market_transactions` if it existed, 
    // or we simulate it via logs/attributes)

    // Since `black_market_transactions` is in the schema but might need manual SQL if types aren't mapped,
    // we'll try to insert or fallback to log.
    try {
      // Check if table exists (it should per schema report)
      await this.execute(
        `INSERT INTO black_market_transactions 
               (id, character_id, vendor_id, transaction_id, heat_generated, risk_level, created_at)
               VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        crypto.randomUUID(), characterId, vendorId, transactionId, totalHeat, 'MEDIUM'
      );
    } catch (e) {
      console.warn('Black market table missing or insert failed, skipping history', e);
    }

    // 3. Update Character's "Heat" or "Wanted" status
    // We'll increment a temporary tracked attribute for now, or a specific "HEAT" attribute
    try {
      // Check if HEAT attribute exists, if not, maybe use Reputation with Law Enforcement (negative)
      // For now, let's assume valid 'HEAT' code or just log it for "lazy simulation"

      await this.execute(
        `UPDATE character_attributes 
              SET current_value = current_value + ? 
              WHERE character_id = ? AND attribute_id IN (SELECT id FROM attribute_definitions WHERE code = 'HEAT')`,
        totalHeat, characterId
      );
    } catch (e) {
      // Ignore if attribute doesn't exist
    }
  }

  /**
   * Attempt to haggle for a better price.
   */
  async haggle(params: {
    vendorId: string;
    itemId: string;
    action: 'buy' | 'sell';
    proposedPrice: number;
  }): Promise<HaggleResult> {
    const { vendorId, itemId, action, proposedPrice } = params;

    // Get vendor
    const vendor = await this.getVendor(vendorId);
    if (!vendor) {
      this.throw(ErrorCodes.NOT_FOUND, 'Vendor not found', 404);
    }

    // Get item
    const item = await this.getItem(itemId);
    if (!item) {
      this.throw(ErrorCodes.NOT_FOUND, 'Item not found', 404);
    }

    // Get character's EMP attribute for haggle check
    const empAttr = await this.query<{ current_value: number }>(
      `SELECT ca.current_value
       FROM character_attributes ca
       JOIN attribute_definitions ad ON ca.attribute_id = ad.id
       WHERE ca.character_id = ? AND ad.code = 'EMP'`,
      this.requiredCharacterId
    );

    const empValue = empAttr?.current_value || 5;

    // Calculate current and proposed prices
    const currentModifier =
      action === 'buy'
        ? vendor.buy_price_modifier
        : vendor.sell_price_modifier;
    const currentPrice =
      action === 'buy'
        ? this.calculateBuyPrice(item.base_price, currentModifier, 1)
        : this.calculateSellPrice(item.base_price, currentModifier, 1);

    // Calculate how aggressive the haggle is
    const priceDiff =
      action === 'buy'
        ? currentPrice - proposedPrice
        : proposedPrice - currentPrice;
    const diffPercent = Math.abs(priceDiff) / currentPrice;

    // Haggle check: 2d6 + EMP mod vs difficulty + diff modifier
    const empMod = Math.floor((empValue - 10) / 2);
    const diffMod = Math.floor(diffPercent * 10);
    const dice = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
    const total = dice + empMod;
    const target = vendor.haggle_difficulty + diffMod;

    const success = total >= target;
    const margin = total - target;

    // Calculate actual final price
    let finalPrice = currentPrice;
    if (success) {
      const achievedDiff = Math.min(
        priceDiff,
        Math.floor(priceDiff * (0.5 + margin * 0.1))
      );
      finalPrice =
        action === 'buy'
          ? currentPrice - achievedDiff
          : currentPrice + achievedDiff;
    } else if (margin < -3) {
      // Critical failure
      finalPrice =
        action === 'buy'
          ? Math.ceil(currentPrice * 1.1)
          : Math.floor(currentPrice * 0.9);
    }

    const result: 'SUCCESS' | 'FAILURE' | 'CRITICAL_FAILURE' = success
      ? 'SUCCESS'
      : margin < -3
        ? 'CRITICAL_FAILURE'
        : 'FAILURE';

    const reactions = {
      SUCCESS: "The vendor sighs and nods reluctantly.",
      FAILURE: "The vendor shakes their head. 'That's my final price.'",
      CRITICAL_FAILURE:
        "The vendor's eyes narrow. 'You insult me. Prices just went up.'",
    };

    return {
      success,
      result,
      roll: {
        dice,
        modifier: empMod,
        total,
        target,
      },
      prices: {
        original: currentPrice,
        proposed: proposedPrice,
        final: finalPrice,
        discount: currentPrice - finalPrice,
      },
      vendorReaction: reactions[result],
    };
  }
}
