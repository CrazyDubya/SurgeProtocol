/**
 * Integration tests for Black Market System API.
 *
 * Tests for contacts, inventory, transactions, and heat management.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import app from '../../src/index';
import { createMockEnv, createTestRequest, parseJsonResponse, type MockEnv } from '../helpers/mock-env';

describe('Black Market System Integration', () => {
  let env: MockEnv;

  beforeEach(async () => {
    env = createMockEnv();

    // Seed NPCs for contacts
    env.DB._seed('npcs', [
      {
        id: 'npc-fixer-1',
        code: 'FIXER_ROGUE',
        name: 'Rogue',
      },
      {
        id: 'npc-dealer-1',
        code: 'DEALER_FINGERS',
        name: 'Fingers',
      },
    ]);

    // Seed locations
    env.DB._seed('locations', [
      {
        id: 'loc-afterlife',
        code: 'AFTERLIFE',
        name: 'The Afterlife',
        district: 'Watson',
      },
      {
        id: 'loc-kabuki',
        code: 'KABUKI_MARKET',
        name: 'Kabuki Market',
        district: 'Watson',
      },
    ]);

    // Seed black market contacts
    env.DB._seed('black_market_contacts', [
      {
        id: 'contact-rogue',
        npc_id: 'npc-fixer-1',
        location_id: 'loc-afterlife',
        contact_type: 'FIXER',
        specialization: 'Weapons',
        reliability_rating: 90,
        danger_rating: 30,
        discovery_method: 'REFERRAL',
        required_tier: 2,
        required_reputation: null,
        introduction_needed: 1,
        introduction_npc_id: 'npc-jackie',
        trust_threshold: 50,
        inventory_tier_min: 3,
        inventory_tier_max: 5,
        specialization_items: JSON.stringify(['weapons', 'military_grade']),
        has_prototype_access: 1,
        has_corrupted_access: 0,
        services_offered: JSON.stringify(['ACQUIRE_ITEM', 'SELL_CONTRABAND']),
        installs_augments: 0,
        install_quality_range: null,
        removes_tracking: 0,
        fences_goods: 1,
        fence_rate: 0.65,
        base_price_modifier: 1.2,
        accepts_alternative_payment: JSON.stringify(['FAVOR_OWED', 'INFORMATION']),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'contact-fingers',
        npc_id: 'npc-dealer-1',
        location_id: 'loc-kabuki',
        contact_type: 'RIPPER',
        specialization: 'Augmentations',
        reliability_rating: 40,
        danger_rating: 70,
        discovery_method: 'STREET_KNOWLEDGE',
        required_tier: 1,
        required_reputation: null,
        introduction_needed: 0,
        introduction_npc_id: null,
        trust_threshold: 20,
        inventory_tier_min: 1,
        inventory_tier_max: 3,
        specialization_items: JSON.stringify(['augments', 'black_market_chrome']),
        has_prototype_access: 0,
        has_corrupted_access: 1,
        services_offered: JSON.stringify(['INSTALL_AUGMENT', 'REMOVE_TRACKING']),
        installs_augments: 1,
        install_quality_range: JSON.stringify({ min: 30, max: 80 }),
        removes_tracking: 1,
        fences_goods: 0,
        fence_rate: null,
        base_price_modifier: 0.8,
        accepts_alternative_payment: JSON.stringify(['FLESH_PAYMENT']),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    // Seed characters
    env.DB._seed('characters', [
      {
        id: 'char-player-1',
        user_id: 'user-1',
        name: 'V',
        tier: 2,
      },
    ]);

    // Seed character contacts (discovered)
    env.DB._seed('character_contacts', [
      {
        id: 'cc-1',
        character_id: 'char-player-1',
        contact_id: 'contact-rogue',
        discovered_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        discovery_method: 'REFERRAL',
        trust_level: 45,
        total_transactions: 5,
        total_spent: 25000,
        last_transaction_at: new Date(Date.now() - 86400000).toISOString(),
        is_hostile: 0,
        heat_with_contact: 10,
        notes: null,
      },
      {
        id: 'cc-2',
        character_id: 'char-player-1',
        contact_id: 'contact-fingers',
        discovered_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        discovery_method: 'STREET_KNOWLEDGE',
        trust_level: 20,
        total_transactions: 1,
        total_spent: 2000,
        last_transaction_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        is_hostile: 0,
        heat_with_contact: 5,
        notes: null,
      },
    ]);

    // Seed black market inventories
    env.DB._seed('black_market_inventories', [
      {
        id: 'inv-rogue-1',
        contact_id: 'contact-rogue',
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        seed: 12345,
        available_items: JSON.stringify([
          { item_id: 'wpn-ajax', quantity: 1, price: 5000, negotiable: true, provenance: 'military' },
          { item_id: 'wpn-copperhead', quantity: 2, price: 3000, negotiable: false, provenance: 'stolen' },
        ]),
        available_services: JSON.stringify([
          { type: 'ACQUIRE_ITEM', price: 1000, turnaround_hours: 24 },
        ]),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    // Seed black market transactions
    env.DB._seed('black_market_transactions', [
      {
        id: 'txn-1',
        character_id: 'char-player-1',
        contact_id: 'contact-rogue',
        occurred_at: new Date(Date.now() - 86400000).toISOString(),
        transaction_type: 'PURCHASE',
        items_involved: JSON.stringify([{ item_id: 'wpn-ajax', quantity: 1 }]),
        services_rendered: null,
        total_price: 5000,
        payment_method: 'CREDITS_ANONYMOUS',
        outcome: 'SUCCESS',
        items_received: JSON.stringify([{ item_id: 'wpn-ajax', quantity: 1 }]),
        services_completed: null,
        complications: null,
        detected_by_corporate: 0,
        detected_by_police: 0,
        rating_penalty: null,
        heat_generated: 5,
        trust_change: 2,
        contact_satisfaction: 85,
        future_discount_earned: null,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'txn-2',
        character_id: 'char-player-1',
        contact_id: 'contact-fingers',
        occurred_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        transaction_type: 'SERVICE',
        items_involved: null,
        services_rendered: JSON.stringify([{ type: 'INSTALL_AUGMENT', target: 'aug-123' }]),
        total_price: 2000,
        payment_method: 'CREDITS_ANONYMOUS',
        outcome: 'COMPLICATION',
        items_received: null,
        services_completed: JSON.stringify(['INSTALL_AUGMENT']),
        complications: JSON.stringify(['Minor infection risk']),
        detected_by_corporate: 0,
        detected_by_police: 0,
        rating_penalty: 0.001,
        heat_generated: 3,
        trust_change: -1,
        contact_satisfaction: 60,
        future_discount_earned: null,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ]);
  });

  // ==========================================================================
  // CONTACT ENDPOINTS
  // ==========================================================================

  describe('GET /api/blackmarket/contacts', () => {
    it('should list discovered contacts', async () => {
      const req = createTestRequest('GET', '/api/blackmarket/contacts?characterId=char-player-1');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.contacts).toHaveLength(2);
    });

    it('should require characterId', async () => {
      const req = createTestRequest('GET', '/api/blackmarket/contacts');
      const res = await app.fetch(req, env);

      expect(res.status).toBe(400);
    });

    it('should filter by contact type', async () => {
      const req = createTestRequest('GET', '/api/blackmarket/contacts?characterId=char-player-1&contact_type=FIXER');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.contacts).toHaveLength(1);
      expect(body.data.contacts[0].contact_type).toBe('FIXER');
    });

    it('should filter by minimum trust', async () => {
      const req = createTestRequest('GET', '/api/blackmarket/contacts?characterId=char-player-1&min_trust=40');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.contacts).toHaveLength(1);
      expect(body.data.contacts[0].trust_level).toBeGreaterThanOrEqual(40);
    });
  });

  describe('GET /api/blackmarket/contacts/by-location/:locationId', () => {
    it('should return contacts at a location', async () => {
      const req = createTestRequest('GET', '/api/blackmarket/contacts/by-location/loc-afterlife?characterId=char-player-1');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.contacts).toHaveLength(1);
      expect(body.data.location_id).toBe('loc-afterlife');
    });
  });

  describe('GET /api/blackmarket/contacts/by-specialization/:spec', () => {
    it('should return contacts by specialization', async () => {
      const req = createTestRequest('GET', '/api/blackmarket/contacts/by-specialization/Weapons?characterId=char-player-1');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.contacts).toHaveLength(1);
    });
  });

  describe('GET /api/blackmarket/contacts/:id', () => {
    it('should return contact details', async () => {
      const req = createTestRequest('GET', '/api/blackmarket/contacts/contact-rogue?characterId=char-player-1');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.contact.id).toBe('contact-rogue');
      expect(body.data.contact.trust_level).toBe(45);
    });

    it('should return 404 for undiscovered contact', async () => {
      // Create a new contact not discovered by character
      env.DB._seed('black_market_contacts', [
        {
          id: 'contact-new',
          npc_id: 'npc-fixer-1',
          location_id: 'loc-afterlife',
          contact_type: 'FIXER',
          specialization: 'Info',
          reliability_rating: 50,
          danger_rating: 50,
          discovery_method: null,
          required_tier: 1,
          required_reputation: null,
          introduction_needed: 0,
          introduction_npc_id: null,
          trust_threshold: 10,
          inventory_tier_min: 1,
          inventory_tier_max: 2,
          specialization_items: null,
          has_prototype_access: 0,
          has_corrupted_access: 0,
          services_offered: null,
          installs_augments: 0,
          install_quality_range: null,
          removes_tracking: 0,
          fences_goods: 0,
          fence_rate: null,
          base_price_modifier: 1.0,
          accepts_alternative_payment: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      const req = createTestRequest('GET', '/api/blackmarket/contacts/contact-new?characterId=char-player-1');
      const res = await app.fetch(req, env);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/blackmarket/contacts/:id/discover', () => {
    beforeEach(() => {
      // Add a discoverable contact
      env.DB._seed('black_market_contacts', [
        {
          id: 'contact-undiscovered',
          npc_id: 'npc-fixer-1',
          location_id: 'loc-afterlife',
          contact_type: 'INFO_BROKER',
          specialization: 'Intel',
          reliability_rating: 70,
          danger_rating: 40,
          discovery_method: 'STREET_KNOWLEDGE',
          required_tier: 1,
          required_reputation: null,
          introduction_needed: 0,
          introduction_npc_id: null,
          trust_threshold: 25,
          inventory_tier_min: 2,
          inventory_tier_max: 4,
          specialization_items: null,
          has_prototype_access: 0,
          has_corrupted_access: 0,
          services_offered: JSON.stringify(['INTEL_GATHERING']),
          installs_augments: 0,
          install_quality_range: null,
          removes_tracking: 0,
          fences_goods: 0,
          fence_rate: null,
          base_price_modifier: 1.1,
          accepts_alternative_payment: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    });

    it('should discover a new contact', async () => {
      const req = createTestRequest('POST', '/api/blackmarket/contacts/contact-undiscovered/discover', {
        body: {
          characterId: 'char-player-1',
          discovery_method: 'STREET_KNOWLEDGE',
        },
      });
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.trust_level).toBe(0);
    });

    it('should return conflict for already discovered contact', async () => {
      const req = createTestRequest('POST', '/api/blackmarket/contacts/contact-rogue/discover', {
        body: {
          characterId: 'char-player-1',
          discovery_method: 'REFERRAL',
        },
      });
      const res = await app.fetch(req, env);

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/blackmarket/contacts/:id/build-trust', () => {
    it('should increase trust level', async () => {
      const req = createTestRequest('POST', '/api/blackmarket/contacts/contact-rogue/build-trust', {
        body: {
          characterId: 'char-player-1',
          method: 'gift',
          value: 500,
        },
      });
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.new_trust).toBeGreaterThan(body.data.previous_trust);
    });

    it('should cap trust at 100', async () => {
      const req = createTestRequest('POST', '/api/blackmarket/contacts/contact-rogue/build-trust', {
        body: {
          characterId: 'char-player-1',
          method: 'referral', // +20 trust
        },
      });
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.new_trust).toBeLessThanOrEqual(100);
    });
  });

  // ==========================================================================
  // INVENTORY ENDPOINTS
  // ==========================================================================

  describe('GET /api/blackmarket/contacts/:id/inventory', () => {
    it('should return contact inventory', async () => {
      const req = createTestRequest('GET', '/api/blackmarket/contacts/contact-rogue/inventory?characterId=char-player-1');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.items).toBeDefined();
      expect(body.data.services).toBeDefined();
    });

    it('should return null for contact without inventory', async () => {
      const req = createTestRequest('GET', '/api/blackmarket/contacts/contact-fingers/inventory?characterId=char-player-1');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.inventory).toBeNull();
    });
  });

  describe('POST /api/blackmarket/contacts/:id/refresh-inventory', () => {
    it('should generate new inventory', async () => {
      const req = createTestRequest('POST', '/api/blackmarket/contacts/contact-fingers/refresh-inventory', {
        body: { characterId: 'char-player-1' },
      });
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(201);
      expect(body.data.inventory_id).toBeDefined();
      expect(body.data.expires_at).toBeDefined();
    });
  });

  describe('GET /api/blackmarket/inventory/:inventoryId', () => {
    it('should return inventory details', async () => {
      const req = createTestRequest('GET', '/api/blackmarket/inventory/inv-rogue-1?characterId=char-player-1');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.inventory.available_items).toHaveLength(2);
    });
  });

  // ==========================================================================
  // TRANSACTION ENDPOINTS
  // ==========================================================================

  describe('POST /api/blackmarket/buy', () => {
    it('should process purchase', async () => {
      const req = createTestRequest('POST', '/api/blackmarket/buy', {
        body: {
          characterId: 'char-player-1',
          contact_id: 'contact-rogue',
          inventory_id: 'inv-rogue-1',
          item_id: 'wpn-ajax',
          quantity: 1,
          payment_method: 'CREDITS_ANONYMOUS',
        },
      });
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(201);
      expect(body.data.outcome).toBe('SUCCESS');
      expect(body.data.transaction_id).toBeDefined();
    });

    it('should require characterId', async () => {
      const req = createTestRequest('POST', '/api/blackmarket/buy', {
        body: {
          contact_id: 'contact-rogue',
          inventory_id: 'inv-rogue-1',
          item_id: 'wpn-ajax',
          quantity: 1,
          payment_method: 'CREDITS_ANONYMOUS',
        },
      });
      const res = await app.fetch(req, env);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/blackmarket/sell', () => {
    it('should process sale', async () => {
      const req = createTestRequest('POST', '/api/blackmarket/sell', {
        body: {
          characterId: 'char-player-1',
          contact_id: 'contact-rogue',
          items: [{ item_id: 'stolen-goods-1', quantity: 5 }],
          is_stolen: true,
        },
      });
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(201);
      expect(body.data.outcome).toBe('SUCCESS');
      expect(body.data.fence_rate).toBe(0.65);
    });

    it('should reject sale to non-fencing contact', async () => {
      const req = createTestRequest('POST', '/api/blackmarket/sell', {
        body: {
          characterId: 'char-player-1',
          contact_id: 'contact-fingers',
          items: [{ item_id: 'goods-1', quantity: 1 }],
        },
      });
      const res = await app.fetch(req, env);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/blackmarket/service', () => {
    it('should request a service', async () => {
      const req = createTestRequest('POST', '/api/blackmarket/service', {
        body: {
          characterId: 'char-player-1',
          contact_id: 'contact-fingers',
          service_type: 'INSTALL_AUGMENT',
          target_item_id: 'aug-new-123',
        },
      });
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(201);
      expect(['SUCCESS', 'COMPLICATION']).toContain(body.data.outcome);
    });

    it('should reject service not offered by contact', async () => {
      const req = createTestRequest('POST', '/api/blackmarket/service', {
        body: {
          characterId: 'char-player-1',
          contact_id: 'contact-rogue',
          service_type: 'INSTALL_AUGMENT',
        },
      });
      const res = await app.fetch(req, env);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/blackmarket/transactions', () => {
    it('should return transaction history', async () => {
      const req = createTestRequest('GET', '/api/blackmarket/transactions?characterId=char-player-1');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.transactions).toHaveLength(2);
    });

    it('should filter by contact', async () => {
      const req = createTestRequest('GET', '/api/blackmarket/transactions?characterId=char-player-1&contact_id=contact-rogue');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.transactions).toHaveLength(1);
    });

    it('should filter by transaction type', async () => {
      const req = createTestRequest('GET', '/api/blackmarket/transactions?characterId=char-player-1&transaction_type=SERVICE');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.transactions).toHaveLength(1);
      expect(body.data.transactions[0].transaction_type).toBe('SERVICE');
    });
  });

  describe('GET /api/blackmarket/transactions/:id', () => {
    it('should return transaction details', async () => {
      const req = createTestRequest('GET', '/api/blackmarket/transactions/txn-1?characterId=char-player-1');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.transaction.id).toBe('txn-1');
      expect(body.data.transaction.items_involved).toBeDefined();
    });
  });

  // ==========================================================================
  // HEAT ENDPOINTS
  // ==========================================================================

  describe('GET /api/blackmarket/heat', () => {
    it('should return heat level', async () => {
      const req = createTestRequest('GET', '/api/blackmarket/heat?characterId=char-player-1');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.heat_level).toBeDefined();
      expect(body.data.total_heat).toBeDefined();
    });

    it('should require characterId', async () => {
      const req = createTestRequest('GET', '/api/blackmarket/heat');
      const res = await app.fetch(req, env);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/blackmarket/heat/reduce', () => {
    it('should attempt to reduce heat', async () => {
      const req = createTestRequest('POST', '/api/blackmarket/heat/reduce', {
        body: {
          characterId: 'char-player-1',
          method: 'lay_low',
        },
      });
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.operation_success).toBeDefined();
      expect(body.data.method).toBe('lay_low');
    });

    it('should support bribe method with variable cost', async () => {
      const req = createTestRequest('POST', '/api/blackmarket/heat/reduce', {
        body: {
          characterId: 'char-player-1',
          method: 'bribe',
          credits_spent: 2000,
        },
      });
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.cost).toBe(2000);
    });
  });
});
