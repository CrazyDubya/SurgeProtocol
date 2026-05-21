
import { BaseService, type ServiceContext } from '../base';

// =============================================================================
// TYPES
// =============================================================================

export interface BlackMarketContact {
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

export interface BlackMarketInventory {
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

export interface BlackMarketTransaction {
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

export interface CharacterContact {
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

export type EnrichedContact = BlackMarketContact & CharacterContact & {
    npc_name?: string;
    npc_title?: string;
    npc_description?: string;
    portrait_asset?: string;
    location_name?: string;
    district?: string;
};

// =============================================================================
// SERVICE
// =============================================================================

export class BlackMarketService extends BaseService {
    constructor(context: ServiceContext) {
        super(context);
    }

    // -------------------------------------------------------------------------
    // READ OPERATIONS
    // -------------------------------------------------------------------------

    async getContacts(characterId: string, filters?: {
        contactType?: string;
        specialization?: string;
        minTrust?: number;
        hasInventory?: boolean;
        locationId?: string;
    }): Promise<EnrichedContact[]> {
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
      LEFT JOIN npc_definitions n ON n.id = bmc.npc_id
      LEFT JOIN locations l ON l.id = bmc.location_id
      WHERE cc.character_id = ?
    `;
        const params: (string | number)[] = [characterId];

        if (filters?.contactType) {
            query += ` AND bmc.contact_type = ?`;
            params.push(filters.contactType);
        }

        if (filters?.specialization) {
            query += ` AND bmc.specialization LIKE ?`;
            params.push(`%${filters.specialization}%`);
        }

        if (filters?.minTrust) {
            query += ` AND cc.trust_level >= ?`;
            params.push(filters.minTrust);
        }

        if (filters?.locationId) {
            query += ` AND bmc.location_id = ?`;
            params.push(filters.locationId);
        }

        if (filters?.hasInventory) {
            query += ` AND EXISTS (
        SELECT 1 FROM black_market_inventories bmi
        WHERE bmi.contact_id = bmc.id
        AND bmi.expires_at > datetime('now')
      )`;
        }

        query += ` ORDER BY cc.trust_level DESC, bmc.reliability_rating DESC`;

        return this.queryAll<EnrichedContact>(query, ...params);
    }

    async getContact(characterId: string, contactId: string): Promise<EnrichedContact | null> {
        return this.query<EnrichedContact>(`
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
          l.name as location_name
        FROM black_market_contacts bmc
        JOIN character_contacts cc ON cc.contact_id = bmc.id
        LEFT JOIN npc_definitions n ON n.id = bmc.npc_id
        LEFT JOIN locations l ON l.id = bmc.location_id
        WHERE bmc.id = ? AND cc.character_id = ?
      `, contactId, characterId);
    }

    async getInventory(contactId: string): Promise<BlackMarketInventory | null> {
        return this.query<BlackMarketInventory>(`
      SELECT * FROM black_market_inventories
      WHERE contact_id = ? AND expires_at > datetime('now')
      ORDER BY generated_at DESC
      LIMIT 1
    `, contactId);
    }

    // -------------------------------------------------------------------------
    // WRITE OPERATIONS
    // -------------------------------------------------------------------------

    async discoverContact(characterId: string, contactId: string, method: string, introFrom?: string): Promise<{ success: boolean; message: string; data?: any }> {
        // Check if contact exists
        const contact = await this.query<BlackMarketContact>(`SELECT * FROM black_market_contacts WHERE id = ?`, contactId);
        if (!contact) return { success: false, message: 'Contact not found' };

        // Check if already discovered
        const existing = await this.query<{ id: string }>(`SELECT id FROM character_contacts WHERE character_id = ? AND contact_id = ?`, characterId, contactId);
        if (existing) return { success: false, message: 'Contact already discovered' };

        // Check requirements
        if (contact.introduction_needed && !introFrom) {
            return { success: false, message: 'Introduction required', data: { required_from: contact.introduction_npc_id } };
        }

        const discoveryId = crypto.randomUUID();

        await this.execute(`
      INSERT INTO character_contacts (
        id, character_id, contact_id, discovered_at,
        discovery_method, trust_level, total_transactions,
        total_spent, is_hostile, heat_with_contact
      ) VALUES (?, ?, ?, datetime('now'), ?, 0, 0, 0, 0, 0)
    `, discoveryId, characterId, contactId, method || 'UNKNOWN');

        return {
            success: true,
            message: 'Contact discovered',
            data: {
                discovery_id: discoveryId,
                contact_id: contactId,
                contact_name: contact.specialization || contact.contact_type,
                trust_level: 0
            }
        };
    }

    async buildTrust(characterId: string, contactId: string, method: 'gift' | 'favor' | 'information' | 'referral', value?: number): Promise<{ success: boolean; message: string; data?: any }> {
        const relationship = await this.query<CharacterContact>(`SELECT * FROM character_contacts WHERE character_id = ? AND contact_id = ?`, characterId, contactId);
        if (!relationship) return { success: false, message: 'Contact not discovered' };
        if (relationship.is_hostile) return { success: false, message: 'Contact is hostile' };

        let trustGain = 0;
        switch (method) {
            case 'gift': trustGain = Math.min(10, Math.floor((value || 0) / 100)); break;
            case 'favor': trustGain = 15; break;
            case 'information': trustGain = 10; break;
            case 'referral': trustGain = 20; break;
        }

        const newTrust = Math.min(100, relationship.trust_level + trustGain);
        await this.execute(`UPDATE character_contacts SET trust_level = ? WHERE id = ?`, newTrust, relationship.id);

        return {
            success: true,
            message: 'Trust increased',
            data: { previous: relationship.trust_level, current: newTrust, gained: trustGain }
        };
    }

    async refreshInventory(characterId: string, contactId: string): Promise<{ success: boolean; message: string; data?: any }> {
        const relationship = await this.query<CharacterContact>(`SELECT * FROM character_contacts WHERE character_id = ? AND contact_id = ?`, characterId, contactId);
        if (!relationship) return { success: false, message: 'Contact not discovered' };

        const contact = await this.query<BlackMarketContact>(`SELECT * FROM black_market_contacts WHERE id = ?`, contactId);
        if (!contact) return { success: false, message: 'Contact not found' };

        const inventoryId = crypto.randomUUID();
        const seed = Math.floor(Math.random() * 1000000000);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        // Placeholder inventory generation
        const sampleItems = JSON.stringify([
            { item_id: 'sample-1', quantity: 1, price: 500, negotiable: true },
            { item_id: 'sample-2', quantity: 3, price: 200, negotiable: false }
        ]);

        await this.execute(`
      INSERT INTO black_market_inventories (
        id, contact_id, generated_at, expires_at, seed,
        available_items, available_services
      ) VALUES (?, ?, datetime('now'), ?, ?, ?, ?)
    `, inventoryId, contactId, expiresAt, seed, sampleItems, contact.services_offered || '[]');

        return {
            success: true,
            message: 'Inventory refreshed',
            data: { inventory_id: inventoryId, expires_at: expiresAt }
        };
    }

    async purchaseItem(dto: {
        characterId: string;
        contactId: string;
        inventoryId: string;
        itemId: string;
        quantity: number;
        paymentMethod: string;
    }): Promise<{ success: boolean; message: string; data?: any }> {
        const { characterId, contactId, inventoryId, itemId, quantity } = dto;

        const relationship = await this.query<CharacterContact>(`SELECT * FROM character_contacts WHERE character_id = ? AND contact_id = ?`, characterId, contactId);
        if (!relationship) return { success: false, message: 'Contact not discovered' };
        if (relationship.is_hostile) return { success: false, message: 'Contact is hostile' };

        const inventory = await this.query<BlackMarketInventory>(`SELECT * FROM black_market_inventories WHERE id = ? AND contact_id = ? AND expires_at > datetime('now')`, inventoryId, contactId);
        if (!inventory) return { success: false, message: 'Inventory not available' };

        // In real impl, check stock in inventory.available_items JSON
        // And check player funds

        const transactionId = crypto.randomUUID();
        const totalPrice = 1000 * quantity; // Placeholder

        await this.execute(`
        INSERT INTO black_market_transactions (
          id, character_id, contact_id, occurred_at,
          transaction_type, items_involved, total_price,
          payment_method, outcome, items_received,
          detected_by_corporate, detected_by_police,
          heat_generated, trust_change, contact_satisfaction
        ) VALUES (?, ?, ?, datetime('now'), 'PURCHASE', ?, ?, ?, 'SUCCESS', ?, 0, 0, 5, 1, 80)
      `, transactionId, characterId, contactId,
            JSON.stringify([{ item_id: itemId, quantity }]),
            totalPrice, dto.paymentMethod,
            JSON.stringify([{ item_id: itemId, quantity }])
        );

        return { success: true, message: 'Purchase successful', data: { transactionId } };
    }
}
