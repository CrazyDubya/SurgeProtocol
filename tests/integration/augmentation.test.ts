/**
 * Integration tests for augmentation system.
 *
 * Tests: catalog → body-locations → install → toggle → remove → humanity
 */

import { describe, it, expect, beforeEach } from 'vitest';
import app from '../../src/index';
import { createMockEnv, createTestRequest, parseJsonResponse, type MockEnv } from '../helpers/mock-env';
import { SignJWT } from 'jose';

// Helper to create a valid JWT for testing
async function createTestToken(
  userId: string,
  characterId?: string,
  secret: string = 'test-jwt-secret-key-for-testing-only'
): Promise<string> {
  const key = new TextEncoder().encode(secret);
  const token = await new SignJWT({
    sub: userId,
    characterId,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key);
  return token;
}

describe('Augmentation System Integration', () => {
  let env: MockEnv;
  let authToken: string;
  let characterToken: string;
  const testUserId = 'test-user-123';
  const testCharacterId = 'char-test-456';

  beforeEach(async () => {
    env = createMockEnv();

    // Create auth tokens
    authToken = await createTestToken(testUserId);
    characterToken = await createTestToken(testUserId, testCharacterId);

    // Seed players
    env.DB._seed('players', [
      {
        id: testUserId,
        email: 'test@example.com',
        username: 'testuser',
        created_at: new Date().toISOString(),
      },
    ]);

    // Seed character with humanity and credits
    env.DB._seed('characters', [
      {
        id: testCharacterId,
        player_id: testUserId,
        legal_name: 'Test Runner',
        street_name: 'Chrome',
        handle: 'chrome_runner',
        current_tier: 2,
        current_credits: 10000,
        current_humanity: 85,
        max_humanity: 100,
        current_health: 30,
        max_health: 30,
        is_active: 1,
        created_at: new Date().toISOString(),
      },
    ]);

    // Seed body locations
    env.DB._seed('body_locations', [
      {
        id: 'loc-skull',
        code: 'SKULL',
        name: 'Skull',
        augment_slots: 2,
        critical_organ: 1,
        surgery_risk_base: 15,
      },
      {
        id: 'loc-eyes',
        code: 'EYES',
        name: 'Eyes',
        parent_location_id: 'loc-skull',
        augment_slots: 2,
        surgery_risk_base: 10,
      },
      {
        id: 'loc-arm-right',
        code: 'ARM_RIGHT',
        name: 'Right Arm',
        augment_slots: 3,
        surgery_risk_base: 5,
      },
    ]);

    // Seed augment definitions
    env.DB._seed('augment_definitions', [
      {
        id: 'aug-neural-link',
        code: 'NEURAL_LINK_MK1',
        name: 'Neural Interface Mk1',
        manufacturer: 'ARASAKA',
        category: 'NEURAL',
        rarity: 'COMMON',
        required_tier: 1,
        body_location_id: 'loc-skull',
        slots_consumed: 1,
        base_price_creds: 2000,
        installation_cost_creds: 500,
        humanity_cost: 5,
        surgery_difficulty: 5,
        attribute_modifiers: JSON.stringify({ INT: 1 }),
      },
      {
        id: 'aug-cyber-eyes',
        code: 'KIROSHI_OPTICS_MK2',
        name: 'Kiroshi Optics Mk2',
        manufacturer: 'KIROSHI',
        category: 'SENSORY',
        rarity: 'UNCOMMON',
        required_tier: 2,
        body_location_id: 'loc-eyes',
        slots_consumed: 2,
        base_price_creds: 5000,
        installation_cost_creds: 1000,
        humanity_cost: 8,
        surgery_difficulty: 7,
        attribute_modifiers: JSON.stringify({ PRC: 2 }),
      },
      {
        id: 'aug-gorilla-arms',
        code: 'GORILLA_ARMS',
        name: 'Gorilla Arms',
        manufacturer: 'MILITECH',
        category: 'LIMB',
        rarity: 'RARE',
        required_tier: 3,
        body_location_id: 'loc-arm-right',
        slots_consumed: 3,
        base_price_creds: 15000,
        installation_cost_creds: 3000,
        humanity_cost: 15,
        surgery_difficulty: 10,
      },
    ]);

    // Seed character augments (initially empty)
    env.DB._seed('character_augments', []);

    // Seed humanity thresholds
    env.DB._seed('humanity_thresholds', [
      {
        id: 'thresh-75',
        threshold_value: 75,
        threshold_name: 'Detached',
        description: 'Beginning to feel disconnected from humanity',
        can_recover: 1,
      },
      {
        id: 'thresh-50',
        threshold_value: 50,
        threshold_name: 'Cold',
        description: 'Emotional responses significantly dampened',
        can_recover: 1,
      },
      {
        id: 'thresh-25',
        threshold_value: 25,
        threshold_name: 'Cyberpsychosis Risk',
        description: 'High risk of cyberpsychotic episodes',
        can_recover: 0,
      },
    ]);

    // Seed humanity events (empty)
    env.DB._seed('humanity_events', []);

    // Seed character_attributes for attribute modifier application
    env.DB._seed('character_attributes', [
      {
        id: 'ca-int',
        character_id: testCharacterId,
        attribute_id: 'attr-int',
        base_value: 10,
        current_value: 10,
        bonus_from_augments: 0,
        bonus_from_items: 0,
        bonus_from_conditions: 0,
        temporary_modifier: 0,
      },
      {
        id: 'ca-prc',
        character_id: testCharacterId,
        attribute_id: 'attr-prc',
        base_value: 10,
        current_value: 10,
        bonus_from_augments: 0,
        bonus_from_items: 0,
        bonus_from_conditions: 0,
        temporary_modifier: 0,
      },
    ]);

    // Seed attribute definitions
    env.DB._seed('attribute_definitions', [
      { id: 'attr-int', code: 'INT', name: 'Intelligence' },
      { id: 'attr-prc', code: 'PRC', name: 'Perception' },
    ]);
  });

  // =============================================================================
  // PUBLIC CATALOG ENDPOINTS
  // =============================================================================

  describe('GET /api/augmentations/catalog', () => {
    it('should return all augments without auth', async () => {
      const request = createTestRequest('GET', '/api/augmentations/catalog');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          augments: Array<{ id: string; name: string }>;
          pagination: { total: number };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.augments.length).toBeGreaterThan(0);
      expect(data.data?.pagination.total).toBe(3);
    });

    it('should filter by category', async () => {
      const request = createTestRequest('GET', '/api/augmentations/catalog?category=NEURAL');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { augments: Array<{ category: string }> };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.augments).toHaveLength(1);
      expect(data.data?.augments[0]?.category).toBe('NEURAL');
    });

    it('should filter by max tier', async () => {
      const request = createTestRequest('GET', '/api/augmentations/catalog?maxTier=2');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { augments: Array<{ required_tier: number }> };
      }>(response);

      expect(response.status).toBe(200);
      // Should return augments with tier 1 and 2, not tier 3
      expect(data.data?.augments.every((a) => a.required_tier <= 2)).toBe(true);
    });

    it('should paginate results', async () => {
      const request = createTestRequest('GET', '/api/augmentations/catalog?limit=2&offset=0');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          augments: unknown[];
          pagination: { total: number; limit: number; offset: number; hasMore: boolean };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.augments).toHaveLength(2);
      expect(data.data?.pagination.hasMore).toBe(true);
    });
  });

  describe('GET /api/augmentations/catalog/:id', () => {
    it('should return augment details by ID', async () => {
      const request = createTestRequest('GET', '/api/augmentations/catalog/aug-neural-link');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { augment: { id: string; name: string; humanity_cost: number } };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.augment.name).toBe('Neural Interface Mk1');
      expect(data.data?.augment.humanity_cost).toBe(5);
    });

    it('should return augment details by code', async () => {
      const request = createTestRequest('GET', '/api/augmentations/catalog/NEURAL_LINK_MK1');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { augment: { code: string } };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.augment.code).toBe('NEURAL_LINK_MK1');
    });

    it('should return 404 for non-existent augment', async () => {
      const request = createTestRequest('GET', '/api/augmentations/catalog/nonexistent');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        errors?: Array<{ code: string }>;
      }>(response);

      expect(response.status).toBe(404);
      expect(data.errors?.[0]?.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/augmentations/body-locations', () => {
    it('should return all body locations', async () => {
      const request = createTestRequest('GET', '/api/augmentations/body-locations');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { locations: Array<{ id: string; name: string; augment_slots: number }> };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.locations.length).toBe(3);
    });
  });

  describe('GET /api/augmentations/categories', () => {
    it('should return all augment categories', async () => {
      const request = createTestRequest('GET', '/api/augmentations/categories');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { categories: Array<{ code: string; name: string }> };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.categories).toContainEqual({ code: 'NEURAL', name: 'Neural' });
      expect(data.data?.categories).toContainEqual({ code: 'LIMB', name: 'Limb' });
    });
  });

  // =============================================================================
  // AUTHENTICATED ENDPOINTS
  // =============================================================================

  describe('GET /api/augmentations/character', () => {
    it('should require authentication', async () => {
      const request = createTestRequest('GET', '/api/augmentations/character');

      const response = await app.fetch(request, env);

      expect(response.status).toBe(401);
    });

    it('should require character selection', async () => {
      const request = createTestRequest('GET', '/api/augmentations/character', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBe(403);
    });

    it('should return empty list for new character', async () => {
      const request = createTestRequest('GET', '/api/augmentations/character', {
        headers: { Authorization: `Bearer ${characterToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          augments: unknown[];
          count: number;
          humanity: { current: number; max: number };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.augments).toHaveLength(0);
      expect(data.data?.count).toBe(0);
      expect(data.data?.humanity.current).toBe(85);
    });

    it('should return installed augments', async () => {
      // Seed an installed augment
      env.DB._seed('character_augments', [
        {
          id: 'install-1',
          character_id: testCharacterId,
          augment_definition_id: 'aug-neural-link',
          body_location_id: 'loc-skull',
          is_active: 1,
          installation_quality: 85,
          installed_at: new Date().toISOString(),
        },
      ]);

      const request = createTestRequest('GET', '/api/augmentations/character', {
        headers: { Authorization: `Bearer ${characterToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          augments: Array<{ id: string; augment_name: string }>;
          count: number;
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.count).toBe(1);
      expect(data.data?.augments[0]?.augment_name).toBe('Neural Interface Mk1');
    });
  });

  describe('POST /api/augmentations/install', () => {
    it('should require authentication', async () => {
      const request = createTestRequest('POST', '/api/augmentations/install', {
        body: { augmentId: 'aug-neural-link' },
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBe(401);
    });

    it('should install an augment successfully', async () => {
      const request = createTestRequest('POST', '/api/augmentations/install', {
        headers: { Authorization: `Bearer ${characterToken}` },
        body: { augmentId: 'aug-neural-link' },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          installation: { id: string; augmentName: string };
          costs: { credits: number; humanityCost: number };
          character: { creditsRemaining: number; humanityRemaining: number };
        };
      }>(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data?.installation.augmentName).toBe('Neural Interface Mk1');
      expect(data.data?.costs.credits).toBe(2500); // base + install cost
      expect(data.data?.costs.humanityCost).toBe(5);
      expect(data.data?.character.creditsRemaining).toBe(7500);
      expect(data.data?.character.humanityRemaining).toBe(80);
    });

    it('should reject if tier too low', async () => {
      // Update character to tier 1
      env.DB._seed('characters', [
        {
          id: testCharacterId,
          player_id: testUserId,
          current_tier: 1,
          current_credits: 50000,
          current_humanity: 100,
          max_humanity: 100,
        },
      ]);

      const request = createTestRequest('POST', '/api/augmentations/install', {
        headers: { Authorization: `Bearer ${characterToken}` },
        body: { augmentId: 'aug-gorilla-arms' }, // requires tier 3
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        errors?: Array<{ code: string }>;
      }>(response);

      expect(response.status).toBe(400);
      expect(data.errors?.[0]?.code).toBe('TIER_REQUIREMENT');
    });

    it('should reject if insufficient credits', async () => {
      // Update character to have low credits
      env.DB._seed('characters', [
        {
          id: testCharacterId,
          player_id: testUserId,
          current_tier: 2,
          current_credits: 100,
          current_humanity: 100,
          max_humanity: 100,
        },
      ]);

      const request = createTestRequest('POST', '/api/augmentations/install', {
        headers: { Authorization: `Bearer ${characterToken}` },
        body: { augmentId: 'aug-neural-link' },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        errors?: Array<{ code: string }>;
      }>(response);

      expect(response.status).toBe(400);
      expect(data.errors?.[0]?.code).toBe('INSUFFICIENT_CREDITS');
    });

    it('should apply black market discount', async () => {
      const request = createTestRequest('POST', '/api/augmentations/install', {
        headers: { Authorization: `Bearer ${characterToken}` },
        body: { augmentId: 'aug-neural-link', useBlackMarket: true },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          installation: { isBlackMarket: boolean };
          costs: { credits: number };
        };
      }>(response);

      expect(response.status).toBe(201);
      expect(data.data?.installation.isBlackMarket).toBe(true);
      // 70% of normal cost = (2000 + 500) * 0.7 = 1750
      expect(data.data?.costs.credits).toBe(1750);
    });

    it('should reject if no available slots', async () => {
      // Fill up eye slots
      env.DB._seed('character_augments', [
        {
          id: 'install-eyes',
          character_id: testCharacterId,
          augment_definition_id: 'aug-cyber-eyes', // consumes 2 slots
          body_location_id: 'loc-eyes',
          is_active: 1,
          installed_at: new Date().toISOString(),
        },
      ]);

      const request = createTestRequest('POST', '/api/augmentations/install', {
        headers: { Authorization: `Bearer ${characterToken}` },
        body: { augmentId: 'aug-cyber-eyes' }, // needs 2 slots, 0 available
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        errors?: Array<{ code: string }>;
      }>(response);

      expect(response.status).toBe(400);
      expect(data.errors?.[0]?.code).toBe('NO_AVAILABLE_SLOTS');
    });
  });

  describe('POST /api/augmentations/:id/toggle', () => {
    beforeEach(() => {
      env.DB._seed('character_augments', [
        {
          id: 'install-toggle',
          character_id: testCharacterId,
          augment_definition_id: 'aug-neural-link',
          body_location_id: 'loc-skull',
          is_active: 1,
          is_damaged: 0,
          times_activated: 5,
          installed_at: new Date().toISOString(),
        },
      ]);
    });

    it('should toggle augment off', async () => {
      const request = createTestRequest('POST', '/api/augmentations/install-toggle/toggle', {
        headers: { Authorization: `Bearer ${characterToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { augmentId: string; isActive: boolean };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.isActive).toBe(false);
    });

    it('should return 404 for non-existent installation', async () => {
      const request = createTestRequest('POST', '/api/augmentations/nonexistent/toggle', {
        headers: { Authorization: `Bearer ${characterToken}` },
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/augmentations/:id/remove', () => {
    beforeEach(() => {
      env.DB._seed('character_augments', [
        {
          id: 'install-remove',
          character_id: testCharacterId,
          augment_definition_id: 'aug-neural-link',
          body_location_id: 'loc-skull',
          is_active: 1,
          integration_level: 50,
          installed_at: new Date().toISOString(),
        },
      ]);
    });

    it('should remove an augment', async () => {
      const request = createTestRequest('POST', '/api/augmentations/install-remove/remove', {
        headers: { Authorization: `Bearer ${characterToken}` },
        body: {},
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          removed: { augmentName: string };
          costs: { credits: number };
          surgery: { risk: number };
          humanity: { restored: number; current: number };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.removed.augmentName).toBe('Neural Interface Mk1');
      expect(data.data?.humanity.restored).toBeGreaterThan(0);
    });

    it('should apply black market removal risk', async () => {
      const request = createTestRequest('POST', '/api/augmentations/install-remove/remove', {
        headers: { Authorization: `Bearer ${characterToken}` },
        body: { useBlackMarket: true },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          costs: { credits: number };
          surgery: { risk: number };
        };
      }>(response);

      expect(response.status).toBe(200);
      // Black market has 15% additional risk
      expect(data.data?.surgery.risk).toBeGreaterThan(10);
    });
  });

  describe('GET /api/augmentations/humanity/history', () => {
    beforeEach(() => {
      env.DB._seed('humanity_events', [
        {
          id: 'he-1',
          character_id: testCharacterId,
          humanity_before: 100,
          humanity_after: 95,
          change_amount: -5,
          change_source: 'AUGMENT_INSTALL',
          source_id: 'install-1',
          occurred_at: new Date().toISOString(),
        },
        {
          id: 'he-2',
          character_id: testCharacterId,
          humanity_before: 95,
          humanity_after: 85,
          change_amount: -10,
          change_source: 'AUGMENT_INSTALL',
          source_id: 'install-2',
          crossed_threshold: 90,
          occurred_at: new Date().toISOString(),
        },
      ]);
    });

    it('should return humanity history', async () => {
      const request = createTestRequest('GET', '/api/augmentations/humanity/history', {
        headers: { Authorization: `Bearer ${characterToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { events: Array<{ id: string; change_amount: number }> };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.events.length).toBe(2);
    });
  });

  describe('GET /api/augmentations/humanity/thresholds', () => {
    it('should return all humanity thresholds', async () => {
      const request = createTestRequest('GET', '/api/augmentations/humanity/thresholds', {
        headers: { Authorization: `Bearer ${characterToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          thresholds: Array<{ threshold_value: number; threshold_name: string }>;
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.thresholds.length).toBe(3);
    });
  });
});
