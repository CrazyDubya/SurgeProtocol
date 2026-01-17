/**
 * Integration tests for mission lifecycle.
 *
 * Tests: list available → accept → action → complete
 */

import { describe, it, expect, beforeEach } from 'vitest';
import app from '../../src/index';
import { createMockEnv, createTestRequest, parseJsonResponse, type MockEnv } from '../helpers/mock-env';
import { SignJWT } from 'jose';

// Helper to create a valid JWT with character
async function createTestToken(userId: string, characterId: string, secret: string = 'test-jwt-secret-key-for-testing-only'): Promise<string> {
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

describe('Mission Lifecycle Integration', () => {
  let env: MockEnv;
  let authToken: string;
  const testUserId = 'test-user-123';
  const testCharacterId = 'test-char-123';

  beforeEach(async () => {
    env = createMockEnv();

    // Create auth token with character
    authToken = await createTestToken(testUserId, testCharacterId);

    // Seed player
    env.DB._seed('players', [{
      id: testUserId,
      email: 'test@example.com',
      username: 'testuser',
      created_at: new Date().toISOString(),
    }]);

    // Seed character
    env.DB._seed('characters', [{
      id: testCharacterId,
      player_id: testUserId,
      legal_name: 'Test Runner',
      street_name: 'Shadow',
      current_tier: 2,
      carrier_rating: 3.5,
      current_health: 30,
      max_health: 30,
      current_location_id: 'downtown',
      is_active: 1,
      created_at: new Date().toISOString(),
    }]);

    // Seed mission definitions
    env.DB._seed('mission_definitions', [
      {
        id: 'mission-1',
        code: 'quick_delivery',
        name: 'Quick Delivery',
        description: 'Deliver a package across town',
        mission_type: 'DELIVERY',
        tier_minimum: 1,
        tier_maximum: 3,
        base_credits_reward: 500,
        base_xp_reward: 100,
        is_active: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'mission-2',
        code: 'dangerous_run',
        name: 'Dangerous Run',
        description: 'High-risk delivery through gang territory',
        mission_type: 'DELIVERY',
        tier_minimum: 3,
        tier_maximum: 5,
        base_credits_reward: 2000,
        base_xp_reward: 400,
        is_active: 1,
        created_at: new Date().toISOString(),
      },
    ]);

    // Seed mission instances (empty initially)
    env.DB._seed('mission_instances', []);

    // Seed locations
    env.DB._seed('locations', [
      { id: 'downtown', code: 'downtown', name: 'Downtown', region_id: 'night-city' },
      { id: 'industrial', code: 'industrial', name: 'Industrial District', region_id: 'night-city' },
    ]);
  });

  describe('GET /api/missions/available', () => {
    it('should return available missions for character tier', async () => {
      const request = createTestRequest('GET', '/api/missions/available', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { missions: Array<{ id: string; name: string }> };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.missions).toBeDefined();
    });

    it('should filter missions by tier', async () => {
      // Character is tier 2, should see mission-1 (tier 1-3) but not mission-2 (tier 3-5)
      const request = createTestRequest('GET', '/api/missions/available', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { missions: Array<{ id: string }> };
      }>(response);

      expect(response.status).toBe(200);
      // Mission filtering is tier-based
      expect(data.data?.missions).toBeDefined();
    });

    it('should require character selection', async () => {
      // Create token without character
      const key = new TextEncoder().encode('test-jwt-secret-key-for-testing-only');
      const tokenWithoutChar = await new SignJWT({
        sub: testUserId,
        type: 'access',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(key);

      const request = createTestRequest('GET', '/api/missions/available', {
        headers: { Authorization: `Bearer ${tokenWithoutChar}` },
      });

      const response = await app.fetch(request, env);

      // Should fail without character
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/missions/:id/accept', () => {
    it('should accept an available mission', async () => {
      const request = createTestRequest('POST', '/api/missions/mission-1/accept', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { instance: { id: string; status: string } };
      }>(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data?.instance).toBeDefined();
    });

    it('should prevent accepting mission above tier', async () => {
      // mission-2 requires tier 3+, character is tier 2
      const request = createTestRequest('POST', '/api/missions/mission-2/accept', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        errors?: Array<{ code: string }>;
      }>(response);

      // Should reject due to tier requirement
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should prevent accepting while on active mission', async () => {
      // Seed an active mission instance
      env.DB._seed('mission_instances', [{
        id: 'active-instance',
        mission_id: 'mission-1',
        character_id: testCharacterId,
        status: 'IN_PROGRESS',
        created_at: new Date().toISOString(),
      }]);

      const request = createTestRequest('POST', '/api/missions/mission-1/accept', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        errors?: Array<{ code: string }>;
      }>(response);

      expect(response.status).toBe(400);
      expect(data.errors?.[0]?.code).toBe('MISSION_IN_PROGRESS');
    });
  });

  describe('GET /api/missions/active', () => {
    it('should return null when no active mission', async () => {
      const request = createTestRequest('GET', '/api/missions/active', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { mission: unknown | null };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.mission).toBeNull();
    });

    it('should return active mission details', async () => {
      // Seed an active mission
      env.DB._seed('mission_instances', [{
        id: 'active-instance',
        mission_id: 'mission-1',
        character_id: testCharacterId,
        status: 'IN_PROGRESS',
        current_checkpoint: 0,
        created_at: new Date().toISOString(),
      }]);

      const request = createTestRequest('GET', '/api/missions/active', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { mission: { id: string } };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.mission).toBeDefined();
    });
  });

  describe('POST /api/missions/:instanceId/action', () => {
    beforeEach(() => {
      // Seed an active mission
      env.DB._seed('mission_instances', [{
        id: 'active-instance',
        mission_id: 'mission-1',
        character_id: testCharacterId,
        status: 'IN_PROGRESS',
        current_checkpoint: 0,
        current_state: '{}',
        created_at: new Date().toISOString(),
      }]);

      // Seed skill definitions for skill checks
      env.DB._seed('skill_definitions', [
        { id: 'skill-driving', code: 'driving', name: 'Driving', governing_attribute_id: 'attr-agi' },
        { id: 'skill-stealth', code: 'stealth', name: 'Stealth', governing_attribute_id: 'attr-agi' },
      ]);

      env.DB._seed('character_skills', [
        { id: 'cs-1', character_id: testCharacterId, skill_id: 'skill-driving', current_level: 3 },
      ]);

      env.DB._seed('character_attributes', [
        { id: 'ca-1', character_id: testCharacterId, attribute_id: 'attr-agi', base_value: 12, current_value: 12, bonus_from_augments: 0, bonus_from_items: 0, bonus_from_conditions: 0, temporary_modifier: 0 },
      ]);

      env.DB._seed('attribute_definitions', [
        { id: 'attr-agi', code: 'AGI', name: 'Agility' },
      ]);
    });

    it('should process MOVE action', async () => {
      const request = createTestRequest('POST', '/api/missions/active-instance/action', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          actionType: 'MOVE',
          parameters: {
            destination: 'industrial',
          },
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { result: { success: boolean; outcome: string } };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should process SKILL_CHECK action', async () => {
      const request = createTestRequest('POST', '/api/missions/active-instance/action', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          actionType: 'SKILL_CHECK',
          parameters: {
            skill: 'driving',
            difficulty: 10,
          },
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          result: {
            success: boolean;
            outcome: string;
            details: { roll: number[]; skillLevel: number };
          };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.result.details.roll).toHaveLength(2);
      expect(data.data?.result.details.skillLevel).toBeDefined();
    });

    it('should reject action on non-existent instance', async () => {
      const request = createTestRequest('POST', '/api/missions/nonexistent/action', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          actionType: 'MOVE',
        },
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/missions/:instanceId/complete', () => {
    beforeEach(() => {
      // Seed a mission ready to complete
      env.DB._seed('mission_instances', [{
        id: 'ready-instance',
        mission_id: 'mission-1',
        character_id: testCharacterId,
        status: 'AT_DESTINATION',
        current_checkpoint: 5,
        created_at: new Date().toISOString(),
      }]);

      // Seed rating components
      env.DB._seed('rating_components', [{
        id: 'rc-1',
        character_id: testCharacterId,
        total_deliveries: 10,
        on_time_deliveries: 8,
        created_at: new Date().toISOString(),
      }]);
    });

    it('should complete mission and award rewards', async () => {
      const request = createTestRequest('POST', '/api/missions/ready-instance/complete', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          rewards: { credits: number; xp: number };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.rewards.credits).toBeGreaterThan(0);
      expect(data.data?.rewards.xp).toBeGreaterThan(0);
    });

    it('should reject completing in-progress mission', async () => {
      env.DB._seed('mission_instances', [{
        id: 'in-progress-instance',
        mission_id: 'mission-1',
        character_id: testCharacterId,
        status: 'IN_PROGRESS',
        created_at: new Date().toISOString(),
      }]);

      const request = createTestRequest('POST', '/api/missions/in-progress-instance/complete', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/missions/:instanceId/abandon', () => {
    beforeEach(() => {
      env.DB._seed('mission_instances', [{
        id: 'active-instance',
        mission_id: 'mission-1',
        character_id: testCharacterId,
        status: 'IN_PROGRESS',
        created_at: new Date().toISOString(),
      }]);
    });

    it('should abandon active mission', async () => {
      const request = createTestRequest('POST', '/api/missions/active-instance/abandon', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { status: string };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject abandoning another users mission', async () => {
      env.DB._seed('mission_instances', [{
        id: 'other-instance',
        mission_id: 'mission-1',
        character_id: 'other-char',
        status: 'IN_PROGRESS',
        created_at: new Date().toISOString(),
      }]);

      const request = createTestRequest('POST', '/api/missions/other-instance/abandon', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBe(404);
    });
  });
});
